const check = require("./service/checkAuthenticated");
const express = require("express");
const router = express.Router();
const logging = require("../config/winston");
const requestIp = require("request-ip");
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
        const checkTeamCursor = await teamCollection.findOne({ _id: teamName });
        if (checkTeamCursor) {
            logging.info(
                `Team Create Fail! Exist! email:${
                    req.user.email
                } RequestTeamName:${teamName} RequestIP:${requestIp.getClientIp(
                    req,
                )}  RequestIP:${requestIp.getClientIp(req)}`,
            );
            return { success: false, msg: "exists" };
        }
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
            logging.info(
                `Team Create Fail! Exist! email:${
                    req.user.email
                } RequestTeamName:${teamName} RequestIP:${requestIp.getClientIp(
                    req,
                )}  RequestIP:${requestIp.getClientIp(req)}`,
            );
            logging.info(
                `Team Create Fail! Exist! email:${
                    req.user.email
                } RequestTeamName:${teamName} RequestIP:${requestIp.getClientIp(req)}`,
            );
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

        logging.info(
            `Team Create Success! email:${
                req.user.email
            } RequestTeamName:${teamName} RequestIP:${requestIp.getClientIp(req)}`,
        );
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
            logging.info(
                `Team Delete Fail! Not Have Permission! email:${
                    req.user.email
                } RequestTeamName:${teamName} RequestIP:${requestIp.getClientIp(req)}`,
            );
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

        logging.info(
            `Team Delete Success! email:${
                req.user.email
            } RequestTeamName:${teamName} RequestIP:${requestIp.getClientIp(req)}`,
        );
        return { success: true, msg: req.body.teamName };
    });

    res.json(returnValue);
};
// TODO 초대한 이메일과 추가 될려는 이메일이 같으면 멤버로 추가하기.
const teamMemberAppend = async (req, res, next) => {
    const returnValue = await check.transaction(async () => {
        // 초대 받은 팀 이름과 로그인 한 유저의 이메일의 값을 가지고
        // 팀을 찾은다음 팀에 초대한 유저를 초대한 이메일을 비교하여 초대했던 멤버이면
        // 팀에 인원을 추가한다.

        const teamCollection = await check.teamDbCollection();
        const userCollection = await check.userDbCollection();
        const { teamName } = req.body;
        let memberEmail;
        // 테스트시에는 로그인이 된 유저가 t 계정이기 대문에 여기서 잠시 변경을 해주겠음.
        if (process.env.dev === "true") {
            memberEmail = "tester2@test.com";
        } else {
            memberEmail = req.user.email;
        }

        const teamCursor = await findTeam(teamName, memberEmail);
        const inviteUser = await userCollection.findOne({ email: memberEmail });

        if (!teamCursor || !inviteUser) {
            // 없는 팀,사람 입력
            // 초대를 수락하기전에 팀이 삭제됐을 경우 초대장만 제외.
            await userCollection.update(
                { _id: inviteUser._id },
                {
                    $set: {
                        invitation: inviteUser.invitation.filter(
                            (ele) => ele.teamName !== teamName,
                        ),
                    },
                    $currentDate: { lastModified: true },
                },
            );
            logging.info(
                `Team Invite Fail! Doesn't Exist! email:${
                    req.user.email
                } RequestTeamName:${teamName} RequestIP:${requestIp.getClientIp(req)}`,
            );
            return {
                success: false,
                msg: "해당 하는 팀또는 멤버가 없습니다. 초대장이 삭제되었습니다.",
            };
        }
        if (!teamCursor.pendingMember.includes(memberEmail)) {
            logging.info(
                `Team Invite Fail! There is no invitation history! email:${
                    req.user.email
                } RequestTeamName:${teamName} RequestIP:${requestIp.getClientIp(req)}`,
            );
            return { success: false, msg: "제대로 된 요청이 아닙니다" };
        }
        if (teamCursor.creator.toString() === inviteUser._id.toString()) {
            logging.info(
                `Team Invite Fail! Exist Member! email:${
                    req.user.email
                } RequestTeamName:${teamName} RequestIP:${requestIp.getClientIp(req)}`,
            );
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
                logging.info(
                    `Team Invite Fail! Exist Member! email:${
                        req.user.email
                    } RequestTeamName:${teamName} RequestIP:${requestIp.getClientIp(req)}`,
                );
                return { success: false, msg: "이미 존재하는 멤버입니다." };
            }
            await teamCollection.update(
                { _id: teamCursor._id },
                {
                    $set: {
                        member_id: [...teamCursor.member_id, inviteUser._id],
                        pendingMember: teamCursor.pendingMember.filter(
                            (ele) => ele !== memberEmail,
                        ),
                    },
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
            await teamCollection.updateOne();
        }
        logging.info(
            `Team Invite Success! email:${
                req.user.email
            } RequestTeamName:${teamName} RequestIP:${requestIp.getClientIp(req)}`,
        );
        return {
            success: true,
            msg: {
                teamName: teamCursor.teamName,
                confirmMember: memberEmail,
            },
        };
    });
    // 팀에 멤버를 추가하기위해서는 추가,초대 할려는 사람이 팀의 멤버여야한다.
    res.json(returnValue);
};
const teamMemberRemove = async (req, res, next) => {
    const returnValue = await check.transaction(async () => {
        const { teamName, members } = req.body;
        const userCollection = await check.userDbCollection();
        const teamCollection = await check.teamDbCollection();

        let teamCursor;
        for (let i = 0; i < members.length; i++) {
            teamCursor = await teamCollection.findOne({ teamName });
            const creatorCursor = await userCollection.findOne({ email: req.user.email });

            if (!teamCursor) {
                logging.info(
                    `Team Member Delete Fail! Team name Error! email:${
                        req.user.email
                    } RequestTeamName:${teamName} RequestIP:${requestIp.getClientIp(req)}`,
                );
                return { success: false, msg: "팀이름 확인해주세요" };
            }
            if (teamCursor.creator.toString() !== creatorCursor._id.toString()) {
                logging.info(
                    `Team Member Delete Fail! User not Admin! email:${
                        req.user.email
                    } RequestTeamName:${teamName} RequestIP:${requestIp.getClientIp(req)}`,
                );
                return { success: false, msg: "팀 관리자가 아닙니다." };
            }
            const deleteUser = await userCollection.findOne({ email: members[i].email });
            if (teamCursor.creator.toString() === deleteUser._id.toString()) {
                logging.info(
                    `Team Member Delete Fail! req.user is team Admin! email:${
                        req.user.email
                    } RequestTeamName:${teamName} RequestIP:${requestIp.getClientIp(req)}`,
                );
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

        logging.info(
            `Team Member Delete Success! email:${
                req.user.email
            } RequestTeamName:${teamName} RequestIP:${requestIp.getClientIp(req)}`,
        );
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
const leaveTeam = async (req, res) => {
    const returnValue = await check.transaction(async () => {
        const teamCollection = await check.teamDbCollection();
        const userCollection = await check.userDbCollection();

        const { teamName } = req.body;
        const { email } = req.user;

        const userCursor = await userCollection.findOne({ email });

        const teamCursor = await teamCollection.findOne({ teamName });

        if (teamCursor.creator.toString() === userCursor._id.toString()) {
            logging.info(
                `Team Member Leave Fail! req.user is Admin! email:${
                    req.user.email
                } RequestTeamName:${teamName} RequestIP:${requestIp.getClientIp(req)}`,
            );
            return { success: false, msg: "팀 관리자는 나갈수없습니다." };
        }
        const checkMember = teamCursor.member_id.filter(
            (ele) => ele.toString() === userCursor._id.toString(),
        );

        if (!checkMember) {
            logging.info(
                `Team Member Leave Fail! req.user is not member! email:${
                    req.user.email
                } RequestTeamName:${teamName} RequestIP:${requestIp.getClientIp(req)}`,
            );
            return { success: false, msg: "팀 구성 멤버가 아닙니다" };
        }
        await teamCollection.updateOne(
            { _id: teamCursor._id },
            {
                $set: {
                    member_id: teamCursor.member_id.filter(
                        (ele) => ele.toString() !== userCursor._id.toString(),
                    ),
                },
            },
        );

        await userCollection.updateOne(
            { _id: userCursor._id },
            {
                $set: {
                    team: userCursor.team.filter((ele) => ele !== teamName),
                },
            },
        );
        logging.info(
            `Team Member Leave Success! email:${
                req.user.email
            } RequestTeamName:${teamName} RequestIP:${requestIp.getClientIp(req)}`,
        );
        return { success: true, msg: teamName };
    });
    res.json(returnValue);
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
    logging.info(
        `Team Member List Success! email:${
            req.user.email
        } RequestTeamName:${teamName} RequestIP:${requestIp.getClientIp(req)}`,
    );
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

    logging.info(
        `Team List Success! email:${req.user.email} RequestIP:${requestIp.getClientIp(req)}`,
    );
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
const memberInvite = async (req, res) => {
    const returnValue = await check.transaction(async () => {
        const { teamName, memberEmail } = req.body;
        const teamCollection = await check.teamDbCollection();
        const userCollection = await check.userDbCollection();
        const { email } = req.user;
        const userCursor = await userCollection.findOne({ email: memberEmail });
        if (!userCursor) {
            logging.info(
                `Team Member Invite Fail! Doesn't exist User! RequestEmail:${memberEmail} RequestTeamName:${teamName} , RequestUser:${
                    req.user.email
                }  RequestIP:${requestIp.getClientIp(req)}`,
            );
            return { success: false, msg: "해당하는 유저는 없습니다." };
        }
        const constitutorCursor = await userCollection.findOne({ email });
        const constitutor = {
            email: constitutorCursor.email,
            teamName,
        };

        const teamCursor = await teamCollection.findOne({ teamName });
        if (teamCursor.pendingMember.includes(memberEmail)) {
            logging.info(
                `Team Member Invite Fail! Already Invited User! RequestEmail:${memberEmail} RequestTeamName:${teamName} , RequestUser:${
                    req.user.email
                }  RequestIP:${requestIp.getClientIp(req)}`,
            );
            return { success: false, msg: "이미 초대를 요청했습니다." };
        }
        await userCollection.update(
            { _id: userCursor._id },
            { $set: { invitation: [...userCursor.invitation, constitutor] } },
        );
        await teamCollection.update(
            { _id: teamCursor._id },
            { $set: { pendingMember: [...teamCursor.pendingMember, memberEmail] } },
        );
        logging.info(
            `Team Member Invite Success! RequestEmail:${memberEmail} RequestTeamName:${teamName}, RequestUser:${
                req.user.email
            }  RequestIP:${requestIp.getClientIp(req)}`,
        );
        return { success: true, msg: memberEmail };
    });
    res.json(returnValue);
};
const inviteReject = (req, res) => {
    const returnValue = check.transaction(async () => {
        const teamCollection = await check.teamDbCollection();
        const userCollection = await check.userDbCollection();

        const { email } = req.user;
        const { teamName } = req.body;

        const rejectMemberCursor = await userCollection.findOne({ email });
        const rejectTeamCursor = await teamCollection.findOne({ teamName });

        if (!rejectMemberCursor || !rejectTeamCursor) {
            logging.info(
                `Team Member InviteReject Fail! Server Error! RequestEmail:${email} RequestTeamName:${teamName}, RequestUser:${
                    req.user.email
                }  RequestIP:${requestIp.getClientIp(req)}`,
            );
            return { success: false, msg: "잘못된 요청입니다." };
        }
        await userCollection.updateOne(
            { _id: rejectMemberCursor._id },
            {
                $set: {
                    invitation: rejectMemberCursor.invitation.filter(
                        (ele) => ele.teamName !== rejectTeamCursor.teamName,
                    ),
                },
            },
        );
        await teamCollection.updateOne(
            { _id: rejectTeamCursor._id },
            {
                $set: {
                    pendingMember: rejectTeamCursor.pendingMember.filter(
                        (ele) => ele !== rejectMemberCursor.email,
                    ),
                },
            },
        );
        logging.info(
            `Team Member InviteReject Success! RequestEmail:${email} RequestTeamName:${teamName}, RequestUser:${
                req.user.email
            }  RequestIP:${requestIp.getClientIp(req)}`,
        );
        return { success: true, msg: "요청이 완료되었습니다." };
    });
    res.json(returnValue);
};
router.post("/create", teamCreate);
router.delete("/delete", check.isTeamAuthenticated, teamDelete);
router.post("/memberappend", teamMemberAppend);
router.put("/memberremove", check.isTeamAuthenticated, teamMemberRemove);
router.post("/userlist", check.isTeamAuthenticated, teamUserList);
router.get("/teampage", check.isTeamAuthenticated, teamPage);
router.get("/teamlist", teamList);
router.post("/invite", check.isTeamAuthenticated, memberInvite);
router.post("/reject", inviteReject);
router.post("/leaveTeam", check.isTeamAuthenticated, leaveTeam);
module.exports = router;
