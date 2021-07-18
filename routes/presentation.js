const express = require("express");
const router = express.Router();
const check = require("./service/checkAuthenticated");
const httpServer = require("http").createServer(express);
const io = require("socket.io")(httpServer,{
    cors : {
        origin : "http://localhost:3000",
        methods:["GET","POST"]
    }
})

// router.io = require("socket.io")()
let teamDb;
/** @typedef pt
 *  @property {string} ptName
 *  @property{string} createdAt
 *  @property{Array} attendants
 *  @property{Array} ptOrder
 *  @property{string} resultVote
 *  @property{number} joined_people
 *  @property{string} Team_id
 * */


const createPt = async (req, res, next) => {
    const msg_createPt = await check.transaction(async () => {
        const ptDb = await check.ptDbCollection();
        const teamCursor = await check.teamDbCollection();
        console.log(req.originalUrl.split("/"));
        const {ptName,attendants,ptOrder} = req.body;
        teamDb = await teamCursor.findOne({ teamName: req.originalUrl.split("/")[2].toString() });
        if(!teamDb)
        {
            res.send("팀을 찾지 못하였습니다.")
        }
        /**@type pt */
        const pt = {
            ptName,
            attendants,
            createdAt: Date(),
            ptOrder,
            resultVote : "",
            joined_people: attendants.length,
            Team_id : teamDb._id
        }
        const tt = await ptDb.insertOne({
            ...pt
        })
        // console.log();
        const ts = await teamCursor.update({_id : teamDb._id},{$set : {pt_id :[...teamDb.pt_id,tt.insertedId]}})
        if(!ts) {
            ptDb.deleteOne({_id:tt.insertedId});
            res.send("발표 생성 중 에러가 발생했습니다.")
        }
        return tt;
    })

    res.send(msg_createPt);
};
// router.io.on("connection",(socket) => {
//     console.log("client connected");
//
//     socket.on("init",(data) => {
//         console.log(data);
//         socket.emit("welcome");
//     })
// })
const voted = async (req,res,next)=> {
    const voteDb = await check.voteDbCollection();

    let vote = [];
    io.on("connection",(sockect) => {
        console.log(sockect.data);
        console.log("his");
    })
};
const readPt = async (req, res, next) => {};
const delPt = async (req, res, next) => {};
const updatePt = async (req, res, next) => {};

router.post(
    "/:teamName/createPresentation",
    check.isAuthenticated,
    check.isTeamAuthenticated,
    createPt,
);
router.get("/read", check.isAuthenticated, check.isTeamAuthenticated,readPt);
router.post("/delete", check.isAuthenticated, check.isTeamAuthenticated,delPt);
router.post("/update", check.isAuthenticated, check.isTeamAuthenticated,updatePt);
router.get("/:ptName/vote",check.isAuthenticated,check.isTeamAuthenticated,voted)
httpServer.listen(3046);
module.exports = router;
