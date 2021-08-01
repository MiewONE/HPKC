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
    await check.transaction(async () => {
        const User = req.user;
        const userCursor = await check.userDbCollection();

        /** @type User*/
        const user = await userCursor.findOne({
            email: User.email,
        });
        const teamCollection = await check.teamDbCollection();
        /** @type Team*/
        const team = {
            teamName: req.body.teamName,
            subject: req.body.subject,
            creator: user._id,
            member_id: [user._id],
            pt_id: [],
        };
        if (!(await findTeam(req.body.teamName))) {
            teamCollection.insertOne({
                ...team,
            });
        } else {
            res.send("exist");
            return;
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
    });

    res.json({ message: "200" });
};
const teamDelete = (req, res, next) => {
    const returnValue = check.transaction(async () => {
        const teamCollection = await check.teamDbCollection();
        const userCollection = await check.userDbCollection();
        const ptCollection = await check.ptDbCollection();

        const teamCursor = await teamCollection.findOne({ teamName: req.body.teamName });
        const creatorCursor = await userCollection.findOne({ email: req.user.email });

        if (!teamCursor) return next(new Error("400 | 존재 하지않는 테이블 입니다."));
        if (creatorCursor._id.toString() !== teamCursor.creator.toString()) {
            return next(new Error("403 | 권한이 없습니다"));
        }

        const teamMembers = teamCursor.member_id;

        for (let i = 0; i < teamMembers.length; i++) {
            const user = await userCollection.findOne({
                _id: teamMembers[i],
            });
            const hasTeam = user.team.filter((ele) => ele !== teamCursor.teamName);

            await userCollection.update(
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
        return req.body.teamName;
    });

    res.json({ message: returnValue });
};
const teamMemberAppend = async (req, res, next) => {
    const returnValue = await check.transaction(async () => {
        const teamCollection = await check.teamDbCollection();
        const userCollection = await check.userDbCollection();
        const { teamName, memberEmail } = req.body;
        const teamCursor = await findTeam(teamName, memberEmail);
        const existingMember = await userCollection.findOne({ email: req.user.email });
        const inviteUser = await userCollection.findOne({ email: memberEmail });

        if (!teamCursor || !inviteUser) {
            // 없는 팀,사람 입력
            next(new Error("400 | 해당 하는 팀과 사람이 없습니다."));
            return;
        }
        if (teamCursor.creator.toString() !== existingMember._id.toString()) {
            next(new Error("403 | 팀 관리자가 아닙니다."));
            return;
        }
        if (teamCursor.creator === inviteUser._id) {
            res.json({ message: "이미 존재하는 유저입니다." });
            return;
        }
        if (teamCursor && inviteUser) {
            teamCursor.member_id.forEach((ele) => {
                if (ele === inviteUser._id) {
                    return next(new Error("400 | 이미 존재하는 유저입니다."));
                }
            });

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
                    $set: { team: [...inviteUser.team, teamCursor.teamName] },
                    $currentDate: { lastModified: true },
                },
            );
        }
        return memberEmail;
    });
    // 팀에 멤버를 추가하기위해서는 추가,초대 할려는 사람이 팀의 멤버여야한다.
    res.json({ message: returnValue });
};
const teamMemberRemove = async (req, res, next) => {
    const returnValue = await check.transaction(async () => {
        // TODO 유저 여러명 동시에 삭제 가능하게.만들어야함.
        const { teamName, memberEmail } = req.body;
        const userCollection = await check.userDbCollection();
        const teamCollection = await check.teamDbCollection();
        const teamCursor = await findTeam(teamName, memberEmail);
        const creatorCursor = await userCollection.findOne({ email: req.user.email });
        const deleteUser = await userCollection.findOne({ email: memberEmail });

        if (!teamCursor || !deleteUser) {
            res.send("팀이름 또는 유저를 확인해주세요");
            return;
        }
        if (teamCursor.creator.toString() !== creatorCursor._id.toString()) {
            return next(new Error("400 | 팀 관리자가 아닙니다"));
        }

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
        return memberEmail;
    });

    res.json({ message: returnValue });
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
        message: "OK",
        member: member,
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
    }); // 유저가 팀 페이지로 이동할 수 있는 링크를 보여줘야함.
};
router.post("/create", teamCreate);
// TODO 수정 필요 post --> delete 메소드로
router.post("/delete", check.isTeamAuthenticated, teamDelete);
router.post("/memberappend", check.isTeamAuthenticated, teamMemberAppend);
router.post("/memberremove", check.isTeamAuthenticated, teamMemberRemove);
router.post("/userlist", check.isTeamAuthenticated, teamUserList);
router.get("/teampage", check.isTeamAuthenticated, teamPage);
router.get("/teamlist", teamList);

module.exports = router;
