const express = require("express");
const router = express.Router();
const passport = require("passport");
const kakaoStrategy = require("passport-kakao").Strategy;
const dotenv = require("dotenv");
const dbClient = require("../db/db");
const uri = "mongodb://localhost:27017";
dotenv.config();

const _client = dbClient.connect();

async function dbCollection() {
    const client = await _client;
    return client.db("oauthUser").collection("users");
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
            return done(null, profile);
        },
    ),
);

router.get("/oauth/kakao", passport.authenticate("kakao"));

router.get(
    "/oauth/kakao/callbak",
    passport.authenticate("kakao", {
        failureRedirect: "/error",
    }),
    async (req, res) => {
        if (req.session.passport.user) {
            res.send("이미 로그인된 사용자입니다.");
            return;
        }

        console.log(">>> kakaoLogin");

        const loginCollection = await dbCollection();

        const loginUser = await loginCollection.findOne({
            $and: [{ provider: "kakao" }, { id: req.user.id }],
        });
        if (!loginUser) {
            await loginCollection.insertOne(req.user);
        }
        req.session.connectTime = Date();
        res.send(JSON.stringify(req.session));

    },
);
router.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});
module.exports = router;
