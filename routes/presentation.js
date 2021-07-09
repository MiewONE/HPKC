const express = require("express");
const router = express.Router();
const check = require("./service/checkAuthenticated");

let teamDb;

const dbInit = async (req, res, next) => {
    const teamCursor = await check.teamDbCollection();
    // /pt/123/createPresentation
    console.log(req.originalUrl.split("/")[2]);
    teamDb = await teamCursor.findOne({ teamName: req.originalUrl.split("/")[2].toString() });

    next();
};
router.use(dbInit);
const createPt = async (req, res, next) => {
    const ptDb = await check.ptDbCollection();
    res.send(teamDb);
};
const readPt = async (req, res, next) => {};
const delPt = async (req, res, next) => {};
const updatePt = async (req, res, next) => {};

router.get(
    "/:teamName/createPresentation",
    check.isAuthenticated,
    check.isTeamAuthenticated,
    createPt,
);
router.get("/read", check.isAuthenticated, check.isTeamAuthenticated);
router.post("/delete", check.isAuthenticated, check.isTeamAuthenticated);
router.post("/update", check.isAuthenticated, check.isTeamAuthenticated);

module.exports = router;
