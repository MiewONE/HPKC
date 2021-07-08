const dbClient = require("../db/db");

const express = require("express");
const router = express.Router();
const _client = dbClient.connect();

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

async function teamDbCollection() {
    const client = await _client;
    return client.db("HPKC").collection("teams");
}
async function userDbCollection() {
    const client = await _client;
    return client.db("HPKC").collection("users");
}

async function findTeam(teamName, userName) {
    const teamCollection = await teamDbCollection();
    let teamCursor;
    if (!(teamName && userName)) {
        teamCursor = await teamCollection.findOne({
            teamName: teamName,
        });
        return teamCursor;
    }
    teamCursor = await teamCollection.findOne({
        $and: [
            { teamName: teamName },
            {
                creator: userName,
            },
        ],
    });
    return teamCursor;
}

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    return next(new Error("403 | 권한이 없습니다."));
};

const isTeamAuthenticated = async (req,res,next) => {
    const userDb = await userDbCollection();
    const user = await userDb.findOne({email : req.user.email});
    const team = user.team.filter((ele) => ele === req.params.page);
    if(!team) return next(new Error("403 | 해당 팀에 권한을 가지고 있지 않습니다."));
    return next();
}
router.post("/create", isAuthenticated, async (req, res) => {
    const User = req.user;
    const userCursor = await userDbCollection();
    /** @type User*/
    const user = await userCursor.findOne({
        email: User.email,
    });
    const teamCollection = await teamDbCollection();
    /** @type Team*/
    const team = {
        teamName: req.body.teamName,
        subject: req.body.subject,
        creator: user._id,
        member_id: [user._id],
    };
    if (!(await findTeam(req.body.teamName))) {
        teamCollection.insertOne({
            ...team,
        });
    } else {
        res.send("exist");
        return;
    }
    user.team.push(team.teamName);
    userCursor.update({ _id: user._id }, { $set: { team: [...user.team] } });
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
    res.send(req.body.teamName);
});
// TODO 수정 필요 post --> delete 메소드로
router.post("/delete", isAuthenticated, async (req, res,next) => {
    const teamCollection = await teamDbCollection();
    const userCollection = await userDbCollection();

    const teamCursor = await teamCollection.findOne({ teamName: req.body.teamName });
    const creatorCursor = await userCollection.findOne({ email: req.user.email });

    if( teamCursor) return next(new Error("400 | 존재 하지않는 테이블 입니다."))
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
            },
        );
    }
    await teamCollection.deleteOne({ _id: teamCursor._id });
    res.sendStatus(200);
});

//팀에 유저를 추가하는 기능
router.post("/memberAppend", isAuthenticated, async (req, res,next) => {
    // 팀에 멤버를 추가하기위해서는 추가,초대 할려는 사람이 팀의 멤버여야한다.
    const teamCollection = await teamDbCollection();
    const userCollection = await userDbCollection();

    const teamCursor = await findTeam(req.body.teamName, req.user.username);
    const existingMember = await userCollection.findOne({ email: req.user.email });
    const inviteUser = await userCollection.findOne({ email: req.body.memberEmail });

    if (!teamCursor || !inviteUser) {
        // 없는 팀,사람 입력
        return next(new Error("400 | 해당 하는 팀과 사람이 없습니다."))
    }
    if (teamCursor.creator.toString() !== existingMember._id.toString()) {
        return next(new Error("403 | 팀 관리자가 아닙니다."));
    }
    if (teamCursor && inviteUser) {
        teamCursor.member_id.forEach((ele) => {
            if (ele.toString() === inviteUser._id.toString()) {
                return next(new Error("400 | 이미 존재하는 유저입니다."))
            }
        });
        teamCursor.member_id.push(inviteUser._id);
        await teamCollection.update(
            { _id: teamCursor._id },
            { $set: { member_id: [...teamCursor.member_id] } },
        );
        inviteUser.team.push(teamCursor.teamName);
        userCollection.update({ _id: inviteUser._id }, { $set: { team: [...inviteUser.team] } });
    }

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
    res.sendStatus(200);
});
router.post("/memberRemove", isAuthenticated, async (req, res,next) => {
    // TODO 유저 여러명 동시에 삭제 가능하게.만들어야함.
    const userCollection = await userDbCollection();
    const teamCollection = await teamDbCollection();
    const teamCursor = await findTeam(req.body.teamName, req.user.username);
    const creatorCursor = await userCollection.findOne({ email: req.user.email });
    const deleteUser = await userCollection.findOne({ email: req.body.memberEmail });

    if (!teamCursor || !deleteUser) {
        res.send("팀이름 또는 유저를 확인해주세요");
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
        },
    );
    res.sendStatus(200);
});
router.get("/userlist", async (req, res,next) => {
    if (!req.user) {
        return next(new Error("403 | 권한이 없습니다"));
    }
    const teamCollection = await teamDbCollection();
    const userCollection = await userDbCollection();
});

router.get("/:page",isAuthenticated,isTeamAuthenticated ,async (req,res,next) => {
    const teamCollection = await teamDbCollection();

    const teamCursor = await teamCollection.findOne({
        teamName : req.params.page
    })
    if(!teamCursor)
    {
        return next(new Error("500 | 서버에 일시적인 문제가 생겼습니다."))
    }

    res.send(JSON.stringify(teamCursor));
})
module.exports = router;
