const dbClient = require("../db/db");
const express = require("express");
const router = express.Router();
const _client = dbClient.connect();

async function teamDbCollection() {
    const client = await _client;
    return client.db("teams").collection("team");
}
async function userDbCollection() {
    const client = await _client;
    return client.db("oauthUser").collection("users");
}

async function findTeam(teamName, userName) {
    const teamCollection = await teamDbCollection();
    let teamCursor;
    if (!(teamName && userName)) {
        teamCursor = await teamCollection.findOne({
            teamName: teamName,
        });
    }
    teamCursor = await teamCollection.findOne({
        $and: [
            { teamName: teamName },
            {
                creater: userName,
            },
        ],
    });
    return teamCursor;
}
router.post("/create", async (req, res) => {
    if (!req.user) {
        // TODO 권한 오류 페이지만들어서 연결
        res.redirect("/403");
        return;
    }
    const { username, id, provider } = req.user;
    const userCursor = await userDbCollection();
    const userName = await userCursor.findOne({
        $and: [{ provider: provider }, { id: id }, { username: username }],
    });
    if (!(userName && userName.username === username)) {
        res.send("로그인 정보가 정확하지 않습니다.");
        return;
    }
    const teamCollection = await teamDbCollection();
    if (!(await findTeam(req.body.teamName))) {
        teamCollection.insertOne({
            teamName: req.body.teamName,
            subject: req.body.subject,
            creater: req.session.passport.user.username,
            members: {},
        });
    }

    res.send(req.body.teamName);
});

router.post("/memberAppend", async (req, res) => {
    const teamCollection = await teamDbCollection();

    const teamCuror = await findTeam(req.body.teamName, req.user.username);
    if (teamCuror) {
    }
});
module.exports = router;
