const check = require("./service/checkAuthenticated");
const express = require("express");
const router = express.Router();

/** @typedef Team
 *  @property {string} teamName
 *  @property {id} teamId
 *  @property {User} members
 *  @property {string} creator
 *  @property {Date} created_at
 * */

/** @typedef User
 * @property {string} name
 * @property {string} subject
 * @property {string} provider
 * @property {number} providerId
 * @property {Object | undefined} Team
 * */

async function findTeam(teamName, userName) {
    const teamCollection = await check.teamDbCollection();
    const teamCursor = await teamCollection.findOne({
        teamName: teamName,
    });
    return teamCursor;
}

const teamCreate = async (req, res) => {
    const returnValue = await check.transaction(async () => {
        const User = req.user;
        const userCursor = await check.userDbCollection();

        const { teamName, subject } = req.body;
        /** @type User*/
        const user = await userCursor.findOne({
            email: User.email,
        });
        const teamCollection = await check.teamDbCollection();
        /** @type Team*/
        const team = {
            teamName: teamName,
            subject: subject,
            creator: user._id,
            member_id: [user._id],
            pt_id: [],
            pendingMember: [],
        };
        if (!(await findTeam(req.body.teamName))) {
            teamCollection.insertOne({
                ...team,
            });
        } else {
            return { success: false, msg: "exist" };
        }
        userCursor.update(
            { _id: user._id },
            { $set: { team: [...user.team, team.teamName] }, $currentDate: { lastModified: true } },
        );
        const memberCursor = teamCollection.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "member_id",
                    foreignField: "_id",
                    as: "members",
                },
            },
        ]);
        await memberCursor.forEach(console.log);

        return {
            success: true,
            msg: {
                teamName: team.teamName,
                members: team.member_id.length,
                subject: team.subject,
                ptCnt: team.pt_id.length < 1 ? 0 : pt_id.length,
            },
        };
    });

    res.json({ ...returnValue });
};
const teamDelete = async (req, res, next) => {
    const returnValue = await check.transaction(async () => {
        const teamCollection = await check.teamDbCollection();
        const userCollection = await check.userDbCollection();
        const ptCollection = await check.ptDbCollection();

        const { teamName } = req.body;
        const teamCursor = await teamCollection.findOne({ teamName: teamName });
        const teamCreator = await userCollection.findOne({
            _id: teamCursor.creator,
        });
        const requesterCursor = await userCollection.findOne({ email: req.user.email });

        if (!teamCursor) return { success: false, msg: "존재하지 않는 팀입니다." };
        if (requesterCursor.email !== teamCreator.email) {
            return {
                success: false,
                msg: "권한이 없습니다. " + teamCreator.email + "님이 관리자입니다.",
            };
        }

        const teamMembers = teamCursor.member_id;

        for (let i = 0; i < teamMembers.length; i++) {
            const user = await userCollection.findOne({
                _id: teamMembers[i],
            });
            const hasTeam = user.team.filter((ele) => ele !== teamCursor.teamName);

            await userCollection.updateOne(
                {
                    _id: teamMembers[i],
                },
                {
                    $set: {
                        team: [...hasTeam],
                    },
                    $currentDate: { lastModified: true },
                },
            );
        }
        const ptIds = teamCursor.pt_id;

        for (let i = 0; i < ptIds.length; i++) {
            await ptCollection.deleteOne({ _id: ptIds[i] });
        }
        await teamCollection.deleteOne({ _id: teamCursor._id });

        return { success: true, msg: req.body.teamName };
    });

    res.json({ ...returnValue });
};
// TODO 초대한 이메일과 추가 될려는 이메일이 같으면 멤버로 추가하기.
const teamMemberAppend = async (req, res, next) => {
    const returnValue = await check.transaction(async () => {
        const teamCollection = await check.teamDbCollection();
        const userCollection = await check.userDbCollection();
        const { teamName } = req.body;
        const memberEmail = req.user.email;
        const teamCursor = await findTeam(teamName, memberEmail);
        const inviteUser = await userCollection.findOne({ email: memberEmail });

        if (!teamCursor || !inviteUser) {
            // 없는 팀,사람 입력
            return { success: false, msg: "해당 하는 팀또는 멤버가 없습니다." };
        }
        if (!teamCursor.pendingMember.includes(memberEmail)) {
            return { success: false, msg: "제대로 된 요청이 아닙니다" };
        }
        if (teamCursor.creator.toString() === inviteUser._id.toString()) {
            return { success: false, msg: "이미 존재하는 멤버입니다." };
        }

        let exist;
        if (teamCursor && inviteUser) {
            teamCursor.member_id.forEach((ele) => {
                if (ele.toString() === inviteUser._id.toString()) {
                    exist = true;
                }
            });
            if (exist) {
                return { success: false, msg: "이미 존재하는 멤버입니다." };
            }
            await teamCollection.update(
                { _id: teamCursor._id },
                {
                    $set: { member_id: [...teamCursor.member_id, inviteUser._id] },
                    $currentDate: { lastModified: true },
                },
            );
            await userCollection.update(
                { _id: inviteUser._id },
                {
                    $set: {
                        team: [...inviteUser.team, teamCursor.teamName],
                        invitation: inviteUser.invitation.filter(
                            (ele) => ele.teamName !== teamName,
                        ),
                    },
                    $currentDate: { lastModified: true },
                },
            );
        }
        return {
            success: true,
            msg: {
                teamName: teamCursor.teamName,
                members: teamCursor.member_id.length + 1,
                subject: teamCursor.subject,
                ptCnt: teamCursor.pt_id.length < 1 ? 0 : teamCursor.pt_id.length,
            },
        };
    });
    // 팀에 멤버를 추가하기위해서는 추가,초대 할려는 사람이 팀의 멤버여야한다.
    res.json({ ...returnValue });
};
const teamMemberRemove = async (req, res, next) => {
    const returnValue = await check.transaction(async () => {
        // TODO 멤버 여러명 동시에 삭제 가능하게.만들어야함.
        const { teamName, members } = req.body;
        const userCollection = await check.userDbCollection();
        const teamCollection = await check.teamDbCollection();

        let teamCursor;
        for (let i = 0; i < members.length; i++) {
            teamCursor = await teamCollection.findOne({ teamName });
            const creatorCursor = await userCollection.findOne({ email: req.user.email });

            if (!teamCursor) {
                return { success: false, msg: "팀이름 확인해주세요" };
            }
            if (teamCursor.creator.toString() !== creatorCursor._id.toString()) {
                return { success: false, msg: "팀 관리자가 아닙니다." };
            }
            const deleteUser = await userCollection.findOne({ email: members[i].email });
            if (teamCursor.creator.toString() === deleteUser._id.toString()) {
                return { success: false, msg: "팀 관리자를 제외할 수 없습니다." };
            }
            await userCollection.update(
                {
                    _id: deleteUser._id,
                },
                {
                    $set: {
                        team: deleteUser.team.filter((ele) => ele !== teamName),
                    },
                    $currentDate: { lastModified: true },
                },
            );
            await teamCollection.update(
                {
                    _id: teamCursor._id,
                },
                {
                    $set: {
                        member_id: teamCursor.member_id.filter(
                            (ele) => ele.toString() !== deleteUser._id.toString(),
                        ),
                    },
                    $currentDate: { lastModified: true },
                },
            );
        }

        return {
            success: true,
            msg: {
                teamName: teamCursor.teamName,
                members: teamCursor.member_id.length - members.length,
                subject: teamCursor.subject,
                ptCnt: teamCursor.pt_id.length < 1 ? 0 : teamCursor.pt_id.length,
            },
        };
    });

    res.json({ ...returnValue });
};
const teamUserList = async (req, res, next) => {
    const teamCollection = await check.teamDbCollection();
    const userCollection = await check.userDbCollection();
    const { teamName } = req.body;
    const teamCursor = await teamCollection.findOne({ teamName });

    const member = [];
    for (let i = 0; i < teamCursor.member_id.length; i++) {
        const tmp = await userCollection.findOne({ _id: teamCursor.member_id[i] });
        member.push({
            id: tmp.name,
            email: tmp.email,
        });
    }
    console.log(member);
    res.json({
        success: true,
        msg: member,
    });
};
const teamPage = async (req, res, next) => {
    // req.body.teamName
    throw new Error("erroe page");
};
const teamList = async (req, res, next) => {
    const userDB = await check.userDbCollection();
    const userCursor = await userDB.findOne({ email: req.user.email });
    const teamDB = await check.teamDbCollection();
    const teamCursor = await teamDB.find({ member_id: userCursor._id });
    const teamArray = await teamCursor.toArray();
    res.json({
        success: true,
        msg: teamArray.map((ele) => {
            return {
                teamName: ele.teamName,
                members: ele.member_id.length,
                subject: ele.subject,
                ptCnt: ele.pt_id.length,
            };
        }),
    }); // 멤버가 팀 페이지로 이동할 수 있는 링크를 보여줘야함.
};
const memberInvite = (req, res) => {
    const returnValue = check.transaction(async () => {
        const { teamName, memberEmail } = req.body;
        const teamCollection = await check.teamDbCollection();
        const userCollection = await check.userDbCollection();
        const { email } = req.user;
        const userCursor = await userCollection.findOne({ email: memberEmail });
        if (!userCursor) {
            return { success: false, msg: "해당하는 유저는 없습니다." };
        }
        const constitutorCursor = await userCollection.findOne({ email });
        const constitutor = {
            email: constitutorCursor.email,
            teamName,
        };

        const teamCursor = await teamCollection.findOne({ teamName });
        await userCollection.update(
            { _id: userCursor._id },
            { $set: { invitation: [...userCursor.invitation, constitutor] } },
        );
        await teamCollection.update(
            { _id: teamCursor._id },
            { $set: { pendingMember: [...teamCursor.pendingMember, memberEmail] } },
        );
        return { success: true, msg: memberEmail };
    });
    res.json(returnValue);
};
router.post("/create", teamCreate);
// TODO 수정 필요 post --> delete 메소드로
router.delete("/delete", check.isTeamAuthenticated, teamDelete);
router.post("/memberappend", teamMemberAppend);
router.put("/memberremove", check.isTeamAuthenticated, teamMemberRemove);
router.post("/userlist", check.isTeamAuthenticated, teamUserList);
router.get("/teampage", check.isTeamAuthenticated, teamPage);
router.get("/teamlist", teamList);
router.post("/invite", memberInvite);
module.exports = router;
