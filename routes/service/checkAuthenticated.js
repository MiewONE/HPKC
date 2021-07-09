const dbClient = require("../../db/db");
const _client = dbClient.connect();

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
    if (req.isAuthenticated()) return next();
    return next(new Error("403 | 권한이 없습니다."));
};
exports.isLogined = (req, res, next) => {
    if (req.user) return next(new Error("400 | 이미 로그인 되어있습니다.."));
    return next();
};
exports.isTeamAuthenticated = async (req, res, next) => {
    const userDb = await this.userDbCollection();
    const user = await userDb.findOne({ email: req.user.email });
    const team = user.team.filter((ele) => ele === req.params.teamName);
    if (!team) return next(new Error("403 | 해당 팀에 권한을 가지고 있지 않습니다."));
    return next();
};
