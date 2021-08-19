const crypto = require("crypto");

exports.confirmPwd = async (password, salt) => {
    return await new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, 1024, 64, "sha512", (err, key) => {
            if (err) reject(err);
            resolve(key.toString("base64"));
        });
    });
};
exports.createHashedPassword = async (_password) => {
    const salt = await new Promise((resolve, reject) => {
        crypto.randomBytes(64, (err, buf) => {
            if (err) reject(err);
            resolve(buf.toString("base64"));
        });
    });
    const password = await new Promise((resolve, reject) => {
        crypto.pbkdf2(_password, salt, 1024, 64, "sha512", (err, key) => {
            if (err) reject(err);
            resolve(key.toString("base64"));
        });
    });
    return { password, salt };
};
