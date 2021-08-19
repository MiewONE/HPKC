require("dotenv").config();
const dev = process.env.dev;
const jwt = require("jsonwebtoken");
const db_module = require("./module_DB");
exports.isAuthenticated = (req, res, next) => {
    if (dev === "false") {
        if (req.isAuthenticated()) {
            return next();
        } else {
            res.json({ success: false, msg: "권한이 없습니다." });
            return;
        }
    } else {
        req.user = {
            _id: {
                $oid: "60e713c2bdd1aa4b9c843aa5",
            },
            name: "t",
            provider: "HPKC",
            team: ["123", "123", "11112"],
            email: "t",
            password:
                "0trvt2tK94VtpT+QM94l3yRnKc/TOiQ7Mbzt5TOvylM2OaApp939M8XsJs6CtLRFL4UgPZ7eeBhVyMkFb4+t4Q==",
            salt: "jg3T0oL6V7ekbp5f0MWXeMrwxctV/2JV8O/Esx/n83QuAgsKyeN9t+KP2zXyU55SrnniAGZpGHfxNJEmmo7r3A==",
        };
        return next();
    }
};
exports.isLogined = (req, res, next) => {
    if (dev === "false") {
        if (req.user) {
            req.session.destroy((err) => {
                if (err) console.log(">>>>>> err :\n", err);
            });
            req.logout();
            return res.json({ success: false, msg: "이미 로그인되어있습니다." });
        }
        return next();
    } else {
        req.user = {
            _id: {
                $oid: "60e713c2bdd1aa4b9c843aa5",
            },
            name: "t",
            provider: "HPKC",
            team: ["123", "123", "11112"],
            email: "t",
            password:
                "0trvt2tK94VtpT+QM94l3yRnKc/TOiQ7Mbzt5TOvylM2OaApp939M8XsJs6CtLRFL4UgPZ7eeBhVyMkFb4+t4Q==",
            salt: "jg3T0oL6V7ekbp5f0MWXeMrwxctV/2JV8O/Esx/n83QuAgsKyeN9t+KP2zXyU55SrnniAGZpGHfxNJEmmo7r3A==",
        };
    }
    return next();
};
exports.isTeamAuthenticated = async (req, res, next) => {
    if (dev === "false") {
        const userDb = await db_module.userDbCollection();
        const user = await userDb.findOne({ email: req.user.email });
        const team = user.team.filter((ele) => ele === req.body.teamName);
        console.log(req.body);
        if (team.length < 1) {
            res.json({
                success: false,
                msg: "해당 팀에 권한을 가지고 있지 않습니다.",
            });
            return;
        }
        return next();
    } else {
        req.user = {
            _id: {
                $oid: "60e713c2bdd1aa4b9c843aa5",
            },
            name: "t",
            provider: "HPKC",
            team: ["123", "123", "11112"],
            email: "t",
            password:
                "0trvt2tK94VtpT+QM94l3yRnKc/TOiQ7Mbzt5TOvylM2OaApp939M8XsJs6CtLRFL4UgPZ7eeBhVyMkFb4+t4Q==",
            salt: "jg3T0oL6V7ekbp5f0MWXeMrwxctV/2JV8O/Esx/n83QuAgsKyeN9t+KP2zXyU55SrnniAGZpGHfxNJEmmo7r3A==",
        };
    }
    return next();
};
