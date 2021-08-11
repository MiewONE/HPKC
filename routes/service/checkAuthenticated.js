const dbClient = require("../../db/db");
const _client = dbClient.connect();
require("dotenv").config();
const dev = process.env.dev;
const jwt = require("jsonwebtoken");
const logging = require("../../config/winston");
const requestIp = require("request-ip");

exports.transaction = async (callback) => {
    const client = await _client;
    const session = client.startSession();
    let sendData;
    const transactionOptions = {
        readPreference: "primary",
        readConcern: { level: "local" },
        writeConcern: { w: "majority" },
    };

    try {
        await session.withTransaction(async () => {
            sendData = await callback();
        }, transactionOptions);
    } catch (err) {
        console.log(err);
        sendData = {
            success: false,
            msg: "서버에서 문제가 생겼습니다.",
        };
    } finally {
        await session.endSession();
    }
    return sendData;
};
exports.voteDbCollection = async () => {
    const client = await _client;
    return client.db("HPKC").collection("vote");
};
exports.teamDbCollection = async () => {
    const client = await _client;
    return client.db("HPKC").collection("teams");
};
exports.userDbCollection = async () => {
    const client = await _client;
    return client.db("HPKC").collection("users");
};
exports.ptDbCollection = async () => {
    const client = await _client;
    return client.db("HPKC").collection("pt");
};
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
        const userDb = await this.userDbCollection();
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
// exports.tokenCheck = async (req, res, next) => {
//     const { token } = req.body;
//     if (!token)
//         return res.json({
//             success: false,
//             msg: "not logged in",
//         });
//     const user = await jwt.verify(token.token);
//
//     if (user === -3) {
//         //TOKEN_EXPIRED
//         logging.info(
//             `CheckAuthenticate TokenCheck Fail! login expired!  RequestUser : ${
//                 req.user.email
//             }  RequestIP:${requestIp.getClientIp(req)}`,
//         );
//         return res.json({
//             success: false,
//             msg: "login expired",
//         });
//     }
//     if (user === -2)
//         logging.info(
//             `CheckAuthenticate TokenCheck Fail! login invalid!  RequestUser : ${
//                 req.user.email
//             }  RequestIP:${requestIp.getClientIp(req)}`,
//         );
//     return res.json({
//         success: false,
//         msg: "login invalid",
//     });
//
//     if (user.email === undefined)
//         logging.info(
//             `CheckAuthenticate TokenCheck Fail! token mean undefined!  RequestUser : ${
//                 req.user.email
//             }  RequestIP:${requestIp.getClientIp(req)}`,
//         );
//     return res.json({
//         success: false,
//         msg: "token mean undefined",
//     });
//     next();
//     // req.user = user;
// };
