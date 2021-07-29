require("dotenv").config();
module.exports = {
    secretKey: process.env.ACCESSTOKEN,
    options: {
        algorithm: "HS256",
        expiresIn: "60m",
        issuer: "HPKC",
    },
};
