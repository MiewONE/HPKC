const express = require("express");
const router = express.Router();
const check = require("./service/checkAuthenticated");

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
// const dbInit = async (req, res, next) => {
//     const teamCursor = await check.teamDbCollection();
//     // /pt/123/createPresentation
//     console.log(req.originalUrl.split("/")[2]);
//     teamDb = await teamCursor.findOne({ teamName: req.originalUrl.split("/")[2].toString() });
//
//     next();
// };
//
// router.use(dbInit);
const createPt = async (req, res, next) => {
    const ptDb = await check.ptDbCollection();
    const teamCursor = await check.teamDbCollection();
    console.log(req.originalUrl.split("/"));
    teamDb = await teamCursor.findOne({ teamName: req.originalUrl.split("/")[2].toString() });
    if(!teamDb)
    {
        res.send("팀을 찾지 못하였습니다.")
    }
    /**@type pt */
    const pt = {
        ptName : req.body.ptName,
        attendants : [],
        createdAt: Date(),
        ptOrder : [],
        resultVote : "",
        joined_people: 0,
        Team_id : teamDb._id
    }
    await ptDb.insertOne({
        ...pt
    })
    res.send(teamDb);
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
router.get("/read", check.isAuthenticated, check.isTeamAuthenticated);
router.post("/delete", check.isAuthenticated, check.isTeamAuthenticated);
router.post("/update", check.isAuthenticated, check.isTeamAuthenticated);

module.exports = router;
