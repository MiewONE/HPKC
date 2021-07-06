const express = require("express");
const router = express.Router();
const passport = require("passport");
const kakaoStrategy = require("passport-kakao").Strategy;
const dotenv = require("dotenv");
const dbClient = require("../db/db");

dotenv.config();

/** @typedef User
 * @property {string} name
 * @property {string} provider
 * @property {number} providerId
 * @property {Object} Team
 * @property {string} email
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
                team: {},
            };
            return done(null, User);
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
module.exports = router;
