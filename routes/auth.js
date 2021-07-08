const express = require("express");
const router = express.Router();
const passport = require("passport");
const kakaoStrategy = require("passport-kakao").Strategy;
const localStrategy = require("passport-local").Strategy;
const dotenv = require("dotenv");
const dbClient = require("../db/db");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

dotenv.config();

/** @typedef User
 * @property {string} name
 * @property {string} provider
 * @property {number} providerId
 * @property {string[]} Team
 * @property {string} email
 * */

const _client = dbClient.connect();

async function dbCollection() {
    const client = await _client;
    return client.db("HPKC").collection("users");
}
const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.ACCESSTOKEN, {
        expiresIn: "20m",
    });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.REFRESHTOKEN, {
        expiresIn: "300m",
    });
};
const authenticateAccesstoken = (req, res, next) => {
    const token = req.user;

    if (!token) {
        return res.sendStatus(400);
    }

    jwt.verify(token, process.env.refreshtoken, (err, user) => {
        if (err) return res.sendStatus(403);

        req.user = user;
        next();
    });
};

router.use(passport.initialize());
router.use(passport.session());
passport.serializeUser((user, done) => {
    return done(null, user);
});
passport.deserializeUser((user, done) => {
    return done(null, user);
});
passport.use(
    "kakao",
    new kakaoStrategy(
        {
            clientID: process.env.kakaoKey,
            callbackURL: "/oauth/kakao/callbak",
        },
        (accessToken, refreshToken, profile, done) => {
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
passport.use(
    "local",
    new localStrategy(
        {
            usernameField: "userEmail",
            passwordField: "password",
            passReqToCallback: true,
        },
        async (req, username, password, done) => {
            console.log(">>> localStrategy 영역입니다.");
            console.log(req);
            console.log(username);
            console.log(password);

            const userCollection = await dbCollection();
            const {
                name,
                password: pwd,
                salt,
                provider,
            } = await userCollection.findOne({
                $and: [{ email: username }],
            });
            const logined =
                (await new Promise((resolve, reject) => {
                    crypto.pbkdf2(password, salt, 1024, 64, "sha512", (err, key) => {
                        if (err) reject(err);
                        resolve(key.toString("base64"));
                    });
                })) === pwd;
            let user;
            if (logined) {
                const accessToken = generateAccessToken(username);
                const refreshToken = generateRefreshToken(username);
                /**@type User */
                user = {
                    name: name,
                    provider: provider,
                    email: username,
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    connectTime: Date(),
                };
                // res.json({ accessToken, refreshToken });
            }
            return done(null, user);
        },
    ),
);
router.get("/kakao", passport.authenticate("kakao"));
router.post(
    "/logins",
    passport.authenticate("local", { failureRedirect: "/loginError" }),
    (req, res) => {
        res.redirect("/");
    },
);
router.get(
    "/kakao/callbak",
    passport.authenticate("kakao", {
        failureRedirect: "/error",
    }),
    async (req, res) => {
        console.log(">>> kakaoLogin");
        /** @type User*/
        const User = req.user;
        const loginCollection = await dbCollection();

        /** @type User*/
        const loginUser = await loginCollection.findOne({
            email: User.email,
        });
        if (!loginUser) {
            await loginCollection.insertOne(User);
        }
        req.user.connectTime = Date();
        const accessToken = generateAccessToken(User.email);
        const refreshToken = generateRefreshToken(User.email);
        req.user.accessToken = accessToken;
        req.user.refreshToken = refreshToken;
        // res.send(JSON.stringify(req.session));

        res.redirect("/");
    },
);
router.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

router.post("/register", async (req, res) => {
    if (!req.body) {
        res.sendStatus(400);
        return;
    }

    const userCollection = await dbCollection();

    const { userName, userEmail, password: _password } = req.body;
    const userCursor = await userCollection.findOne({
        email: userEmail,
    });
    if (userCursor) {
        res.sendStatus(400);
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

router.get("/usr", authenticateAccesstoken, (req, res) => {
    res.json();
});
module.exports = router;
