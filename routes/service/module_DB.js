const dbClient = require("../../db/db");
const _client = dbClient.connect();
require("dotenv").config();
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
