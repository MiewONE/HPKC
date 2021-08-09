const express = require("express");
const router = express.Router();
const check = require("./service/checkAuthenticated");
const httpServer = require("http").createServer(express);
const io = require("socket.io")(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

/** @typedef pt
 *  @property {string} ptName
 *  @property{string} createdAt
 *  @property{Array} attendents
 *  @property{Array} ptOrder
 *  @property{string} resultVote
 *  @property{number} joined_people
 *  @property{string} Team_id
 * */

const ptFind = async (teamName, ptName) => {
    const teamCollection = await check.teamDbCollection();
    const ptCollection = await check.ptDbCollection();

    const teamCursor = await teamCollection.findOne({ teamName });
    const ptCursor = await ptCollection.findOne({
        $and: [{ Team_id: teamCursor._id }, { ptName }],
    });
    if (teamCursor && ptCursor)
        return {
            teamCollection,
            teamCursor,
            ptCollection,
            ptCursor,
        };
    else {
        return undefined;
    }
};

const createPt = async (req, res, next) => {
    const returnValue = await check.transaction(async () => {
        const ptDb = await check.ptDbCollection();
        const teamCollection = await check.teamDbCollection();
        const userCollection = await check.userDbCollection();

        console.log(req.originalUrl.split("/"));
        const { ptName, members, teamName } = req.body;
        if (!ptName || !members || !teamName) {
            return { success: false, msg: "요청을 다시 확인해주세요" };
        }

        const teamDb = await teamCollection.findOne({
            teamName: teamName,
        });
        if (!teamDb) {
            return { success: false, msg: "Not fond Team" };
        }
        const attendents = [];
        for (let i = 0; i < members.length; i++) {
            const member = await userCollection.findOne({ email: members[i].email });
            attendents.push({
                name: member.name,
                email: member.email,
                ddabong: [],
                order: i + 1,
            });
        }

        /**@type pt */
        const pt = {
            ptName,
            attendents,
            createdAt: Date(),
            resultVote: "",
            joined_people: attendents.length,
            Team_id: teamDb._id,
        };
        const insertedPt = await ptDb.insertOne({
            ...pt,
        });
        // console.log();
        const ts = await teamCollection.update(
            { _id: teamDb._id },
            { $set: { pt_id: [...teamDb.pt_id, insertedPt.insertedId] } },
        );
        if (!ts) {
            ptDb.deleteOne({ _id: insertedPt.insertedId });
            return { success: false, msg: "발표 생성 중 에러가 발생하였습니다." };
        }
        const date = new Date(Date.parse(pt.createdAt));
        return {
            success: true,
            msg: {
                ...pt,
                createdAt: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
            },
        };
    });

    res.json({ ...returnValue });
};

const voted = async (req, res, next) => {
    const voteDb = await check.voteDbCollection();
    const ptDb = await check.ptDbCollection();
    const ptName = req.originalUrl.split("/");

    const ptCursor = await ptDb.findOne({ ptName });
    console.log(ptName);
    io.to(ptName).emit("voteStart", { text: "test" });
    let vote = [];
};
const voteDone = (req, res, next) => {
    const ptName = req.originalUrl.split("/")[2];
    io.to(ptName).emit("votedDone", { text: "done" });
};
const readPt = async (req, res, next) => {};
const delPt = async (req, res, next) => {
    const returnValue = await check.transaction(async () => {
        const { teamName, delList } = req.body;

        for (let i = 0; i < delList.length; i++) {
            const { ptCollection, ptCursor } = await ptFind(teamName, delList[i].ptName);

            await ptCollection.deleteOne({
                _id: ptCursor._id,
            });
        }

        return { success: true, msg: teamName };
    });
    res.json({ ...returnValue });
};
const updatePt = async (req, res, next) => {
    const returnValue = check.transaction(async () => {
        const { teamName, presentation } = req.body;
        const { ptCollection, ptCursor } = await ptFind(teamName, presentation.ptName);

        await ptCollection.update(
            { _id: ptCursor._id },
            { $set: { ...ptCursor, ...presentation }, $currentDate: { lastModified: true } },
        );
        return { success: true, msg: ptCursor.ptName };
    });
    res.json({ ...returnValue });
};
const ptList = async (req, res, next) => {
    const teamDB = await check.teamDbCollection();
    const ptDB = await check.ptDbCollection();
    const teamCursor = await teamDB.findOne({
        teamName: req.body.teamName,
    });
    const ptCursor = await ptDB.find({ Team_id: teamCursor._id });

    if (!teamCursor || !ptCursor) {
        res.json({ success: false, msg: "서버에 일시적인 문제가 생겼습니다." });
    }
    const tmpObj = await ptCursor.toArray();
    const remap = tmpObj.map((ele) => {
        const date = new Date(Date.parse(ele.createdAt));
        return {
            _id: ele._id,
            ptName: ele.ptName,
            attendents: ele.attendents.sort((a, b) => {
                return a.order - b.order;
            }),
            createdAt: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
            resultVote: ele.resultVote,
            joined_people: ele.joined_people,
            teamId: ele.Team_id,
        };
    });
    res.json({ success: true, msg: remap });
};
const ptListDetailsSave = async (req, res) => {
    const returnValue = await check.transaction(async () => {
        const { ptName, presenter, teamName } = req.body;
        const { ptCollection, ptCursor } = await ptFind(teamName, ptName);

        if (!ptCursor) {
            return { success: false, msg: "서버에서 오류가 발생했습니다." };
        }
        const attendents = ptCursor.attendents.map((ele) => {
            if (ele.name !== presenter.name) return ele;
            else return presenter;
        });
        console.log(">>> 상세 정보 저장\n", attendents);
        await ptCollection.update(
            { _id: ptCursor._id },
            {
                $set: {
                    attendents: attendents,
                },
            },
        );
        return { success: true, msg: presenter };
    });

    res.json({ ...returnValue });
};
const orderChange = async (req, res) => {
    const sendData = await check.transaction(async () => {
        // TODO 발표자들이 전부 순서를 바꿀 수있음.
        const ptName = req.body.ptName;
        const ptDB = await check.ptDbCollection();
        const ptCursor = await ptDB.findOne({ ptName });

        return await ptDB.update(
            { _id: ptCursor._id },
            {
                $set: { attendents: req.body.attendents },
                $currentDate: { lastModified: true },
            },
        );
    });
    res.send(sendData);
};
const recommendation = async (req, res) => {
    const returnValue = await check.transaction(async () => {
        const { teamName, ptName, presenter } = req.body;
        const { ptCollection, ptCursor } = await ptFind(teamName, ptName);
        const useCollection = await check.userDbCollection();
        const ptOwner = await useCollection.findOne({ email: presenter.email });
        const recommender = await useCollection.findOne({ email: req.user.email });

        const presentor = ptCursor.attendents.filter((ele) => ele.email === ptOwner.email)[0];

        const alreadyDdabong = presentor.ddabong.filter((ele) => ele === recommender.email);
        if (alreadyDdabong.length > 0) {
            return { success: false, msg: "이미 추천하셨습니다." };
        } else {
        }

        const maintaindMember = await ptCursor.attendents.map((ele) => {
            if (ele.email === ptOwner.email) {
                return {
                    ...ele,
                    ddabong: [...ele.ddabong, recommender.email],
                };
            } else {
                return ele;
            }
        });

        await ptCollection.update(
            { _id: ptCursor._id },
            {
                $set: {
                    attendents: [...maintaindMember],
                },
            },
        );
        const recommandList = recommender.recommendationList;
        console.log(recommandList);
        await useCollection.update(
            { _id: recommender._id },
            {
                $set: {
                    recommendationList: [...recommandList, ptCursor._id],
                },
            },
        );
        const { ptCursor: afterPtCursor } = await ptFind(teamName, ptName);
        const ddabongCnt = afterPtCursor.attendents.filter((ele) => ele.email === ptOwner.email);

        return { success: true, msg: ddabongCnt[0].ddabong.length };
    });
    res.json({ ...returnValue });
};
router.post("/create-presentation", createPt);
router.get("/:ptName/vote-done", voteDone);
router.get("/read", readPt);
router.delete("/delete", delPt);
router.post("/update", updatePt);
router.get("/vote/:ptname", voted);
router.post("/ptlist", ptList);
router.post("/presenter/detailsave", ptListDetailsSave);
router.put("/orderchange", orderChange);
router.put("/recommendation", recommendation);
module.exports = router;
