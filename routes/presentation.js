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

let room;
io.on("connection", (socket) => {
    console.log("SOCKETIO connection EVENT: ", socket.id, " client connected");
    socket.on("joinRoom", (data) => {
        console.log(socket.id, "가 ", data.groupName.toString(), "에 참석하였습니다.");
        socket.join(data.groupName.toString());
    });

    socket.on("grouptest", (data) => {
        console.log(data.text, ">>>");
        // socket.emit("joined",data);
        socket.to(data.groupName.toString()).emit("joined", data.text);
    });
});

const createPt = async (req, res, next) => {
    const msg_createPt = await check.transaction(async () => {
        const ptDb = await check.ptDbCollection();
        const teamCursor = await check.teamDbCollection();
        console.log(req.originalUrl.split("/"));
        const { ptName, attendents, ptOrder, teamname } = req.body;
        const teamDb = await teamCursor.findOne({
            teamName: teamname,
        });
        if (!teamDb) {
            res.send("팀을 찾지 못하였습니다.");
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
        const ts = await teamCursor.update(
            { _id: teamDb._id },
            { $set: { pt_id: [...teamDb.pt_id, insertedPt.insertedId] } },
        );
        if (!ts) {
            ptDb.deleteOne({ _id: insertedPt.insertedId });
            res.send("발표 생성 중 에러가 발생했습니다.");
        }
        return insertedPt;
    });

    res.send(msg_createPt);
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
const delPt = async (req, res, next) => {};
const updatePt = async (req, res, next) => {};
const ptList = async (req, res, next) => {
    const teamDB = await check.teamDbCollection();
    const ptDB = await check.ptDbCollection();
    const teamCursor = await teamDB.findOne({
        teamName: req.body.teamname,
    });
    const ptCursor = await ptDB.find({ Team_id: teamCursor._id });
    if (!teamCursor || !ptCursor) {
        return next(new Error("500 | 서버에 일시적인 문제가 생겼습니다."));
    }
    const tmpObj = await ptCursor.toArray();

    res.send(tmpObj);
};
const ptListDetailsSave = async (req, res) => {
    const { ptName, Presenter } = req.body;
    const ptDB = await check.ptDbCollection();
    const ptCursor = await ptDB.findOne({ ptName });
    if (!ptCursor) {
        res.send("서버에서 오류가 발생했습니다.");
    }
    await ptDB.update(
        { _id: ptCursor._id },
        {
            $set: {
                attendents: [
                    ptCursor.attendents.filter((ele) => ele.name !== Presenter.name),
                    Presenter,
                ],
            },
        },
    );
    res.send("발표자 저장");
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
router.post("/create-presentation", createPt);
router.get("/:ptName/vote-done", voteDone);
router.get("/read", readPt);
router.post("/delete", delPt);
router.post("/update", updatePt);
router.get("/vote/:ptname", voted);
router.post("/ptlist", ptList);
router.post("/presenter/detailsave", ptListDetailsSave);
router.put("/orderchange", orderChange);
httpServer.listen(3046);
module.exports = router;
