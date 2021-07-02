const express = require("express");
const session = require("express-session");
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

router.use(
    session({
        secret: "users",
        resave: false,
        saveUninitialized: true,
    }),
);
router.use(passport.initialize());
router.use(passport.session());
passport.serializeUser(async (user, done) => {
    console.log(">>> kakaoLogin");

    const loginCollection = await dbCollection();

    const loginUser = await loginCollection.findOne({
        $and: [{ provider: "kakao" }, { id: user.id }],
    });
    if (!loginUser) {
        await loginCollection.insertOne(user);
    }

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
    (req, res) => {
        console.log(req);
        // res.redirect("/hi");
        res.send(JSON.stringify(req.user));
    },
);

module.exports = router;
