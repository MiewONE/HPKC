const express = require("express");
const router = express.Router();
const passport = require("passport");
const kakaoStrategy = require("passport-kakao").Strategy;
const dotenv = require("dotenv");
const dbClient = require("../db/db");
const crypto = require("crypto");

dotenv.config();

/** @typedef User
 * @property {string} name
 * @property {string} provider
 * @property {number} providerId
 * @property {string[]} Team
 * @property {string} email
 * @property {string} salt
 * */

const _client = dbClient.connect();

async function dbCollection() {
    const client = await _client;
    return client.db("HPKC").collection("users");
}

router.use(passport.initialize());
router.use(passport.session());
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});
passport.use(
    "kakao",
    new kakaoStrategy(
        {
            clientID: process.env.kakaoKey,
            callbackURL: "/oauth/kakao/callbak",
        },
        async (accessToken, refreshToken, profile, done) => {
            /** @type {User}*/
            const User = {
                name: profile.username,
                provider: profile.provider,
                providerId: profile.id,
                email: profile._json.kakao_account.email,
                team: [],
            };
            return done(null, User);
        },
    ),
);

router.get("/kakao", passport.authenticate("kakao"));

router.get(
    "/oauth/kakao/callbak",
    passport.authenticate("kakao", {
        failureRedirect: "/error",
    }),
    async (req, res) => {
        console.log(">>> kakaoLogin");
        /** @type User*/
        const User = req.user;
        const loginCollection = await dbCollection();
        try {
            /** @type User*/
            const loginUser = await loginCollection.findOne({
                email: User.email,
            });
            if (!loginUser) {
                await loginCollection.insertOne(User);
            }
            req.user.connectTime = Date();
            // res.send(JSON.stringify(req.session));
        } catch (e) {
            console.log(e);
        }

        res.redirect("/");
    },
);
router.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

router.post("/register", async (req, res) => {
    if (!req.body) {
        return;
    }

    const userCollection = await dbCollection();

    const { userName, userEmail, password: _password } = req.body;
    const userCursor = await userCollection.findOne({
        email: userEmail,
    });
    if (userCursor) {
        res.send("이미 존재하는 계정입니다.");
        return;
    }

    const salt = await new Promise((resolve, reject) => {
        crypto.randomBytes(64, (err, buf) => {
            if (err) reject(err);
            resolve(buf.toString("base64"));
        });
    });

    const createHasedPassword = await new Promise((resolve, reject) => {
        crypto.pbkdf2(_password, salt, 1024, 64, "sha512", (err, key) => {
            if (err) reject(err);
            resolve(key.toString("base64"));
        });
    });

    /** @type User*/
    const user = {
        name: userName,
        provider: "HPKC",
        team: [],
        email: userEmail,
        password: createHasedPassword,
        salt: salt,
    };
    await userCollection.insertOne({
        ...user,
    });
});
router.post("/login", async (req, res) => {
    const userCollection = await dbCollection();
    const { userEmail, password: _password } = req.body;
    const { password, salt } = await userCollection.findOne({
        $and: [{ email: userEmail }],
    });
    const logined =
        (await new Promise((resolve, reject) => {
            crypto.pbkdf2(_password, salt, 1024, 64, "sha512", (err, key) => {
                if (err) reject(err);
                resolve(key.toString("base64"));
            });
        })) === password;
    console.log(logined);
});
module.exports = router;
