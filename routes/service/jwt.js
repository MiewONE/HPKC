const jwt = require("jsonwebtoken");
const rndToken = require("rand-token");
const options = require("/config/secretkey");
require("dotenv").config();
const TOKEN_EXPIRED = -3;
const TOKEN_INVALID = -2;
module.exports = {
    sign: async (user) => {
        const payload = {
            email: user.email,
        };
        return {
            AccessToken: jwt.sign(payload, process.env.ACCESSTOKEN, options),
            RefreshToken: rndToken.uid(256),
        };
    },
    verify: async (token) => {
        let decoded;
        try {
            decoded = jwt.verify(token, secretKey, options);
        } catch (err) {
            if (err.message === "jwt expired") {
                console.log("expired token");
                return TOKEN_EXPIRED;
            } else if (err.message === "invalid token") {
                console.log("invalid token");
                console.log(TOKEN_INVALID);
                return TOKEN_INVALID;
            } else {
                console.log("invalid token");
                return TOKEN_INVALID;
            }
        }
        return decoded;
    },
};

// const generateAccessToken = (id) => {
//   return jwt.sign({ id }, process.env.ACCESSTOKEN, {
//     expiresIn: "20m",
//   });
// };
//
// const generateRefreshToken = (id) => {
//   return jwt.sign({ id }, process.env.REFRESHTOKEN, {
//     expiresIn: "300m",
//   });
// };
