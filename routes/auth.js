const express = require("express");
const router = express.Router();
const passport = require("passport");
const kakaoStrategy = require("passport-kakao").Strategy;
const dotenv = require("dotenv");
const dbClient = require("../db/db");

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
        console.log(">>> kakaoLogin");
        const { username, id, provider } = req.user;
        try {
            const loginCollection = await dbCollection();

            const loginUser = await loginCollection.findOne({
                $and: [{ provider: provider }, { username: username }, { id: id }],
            });
            if (!loginUser) {
                await loginCollection.insertOne(req.user);
            }
            req.session.connectTime = Date();
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
module.exports = router;
