require("dotenv").config();
module.exports = {
    scretkey: process.env.ACCESSTOKEN,
    option: {
        algorithm: "sha256",
        expiresIn: "30m",
        issuer: "issuer",
    },
};
