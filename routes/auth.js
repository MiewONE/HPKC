const express = require("express");
const router = express.Router();
const passport = require("passport");
const kakaoStrategy = require("passport-kakao").Strategy;
const LocalStrategy = require("passport-local").Strategy;
const dotenv = require("dotenv");
const crypto = require("crypto");
const jwt = require("./api/jwt");
const check = require("./service/checkAuthenticated");
const logging = require("../config/winston");
const requestIp = require("request-ip");
// const cookieParser = require("cookie-parser");
dotenv.config();

/** @typedef User
 * @property {string} name
 * @property {string} provider
 * @property {number} providerId
 * @property {string[]} Team
 * @property {string} email
 * */

// router.use(cookieParser());

// const authenticateAccesstoken = (req, res, next) => {
//     const token = req.user;
//
//     if (!token) {
//         return res.sendStatus(400);
//     }
//
//     jwt.verify(token, process.env.refreshtoken, (err, user) => {
//         if (err) return res.sendStatus(403);
//
//         req.user = user;
//         next();
//     });
// };

router.use(passport.initialize());
router.use(passport.session());
passport.serializeUser((user, done) => {
    console.log(Date(), ">>> login\n", user);

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
    new LocalStrategy(
        {
            usernameField: "userEmail",
            passwordField: "password",
            passReqToCallback: true,
        },
        async (req, username, password, done, err) => {
            // req.cookies.forEach((ele) => console.log(ele));
            if (req.user) return done(err);
            const userCollection = await check.userDbCollection();
            const userCursor = await userCollection.findOne({
                $and: [{ email: username }],
            });
            if (!userCursor) {
                return done(err);
            }
            const { name, password: pwd, salt, provider } = userCursor;
            const logined =
                (await new Promise((resolve, reject) => {
                    crypto.pbkdf2(password, salt, 1024, 64, "sha512", (err, key) => {
                        if (err) reject(err);
                        resolve(key.toString("base64"));
                    });
                })) === pwd;
            let user;
            if (logined) {
                const token = await jwt.sign(username);
                /**@type User */
                user = {
                    name: name,
                    provider: provider,
                    email: username,
                    token: token,
                    connectTime: Date(),
                };
                req.session.save();
                // res.json({ accessToken, refreshToken });
            } else {
                return done(err);
            }
            return done(null, user);
        },
    ),
);
router.get("/kakao", check.isLogined, passport.authenticate("kakao"));
router.post("/logins", check.isLogined, passport.authenticate("local"), (req, res) => {
    logging.info(`User login!  email:${req.user.email}`);
    res.json({ success: true, msg: req.user });
});
router.get(
    "/kakao/callbak",
    passport.authenticate("kakao", {
        failureRedirect: "/error",
    }),
    async (req, res) => {
        console.log(">>> kakaoLogin");
        /** @type User*/
        const User = req.user;
        const loginCollection = await check.userDbCollection();

        /** @type User*/
        const loginUser = await loginCollection.findOne({
            email: User.email,
        });
        if (!loginUser) {
            await loginCollection.insertOne(User);
        }
        req.user.connectTime = Date();
        const token = await jwt.sign(User.email);
        req.user.token = token;
        logging.info(
            `User login!  email:${req.user.email} RequestIP:${requestIp.getClientIp(req)}`,
        );
        // res.json({ success: true, msg: req.user });
        res.redirect("http://localhost:3000");
    },
);
router.get("/logout", check.isAuthenticated, (req, res) => {
    logging.info(`User logout!  email:${req.user.email}`);
    req.session.destroy((err) => {
        if (err) console.log(">>>>>> err :\n", err);
    });
    req.logout();
    res.redirect("http://localhost:3000");
});

router.post("/register", check.isLogined, async (req, res, next) => {
    const returnValue = check.transaction(async () => {
        if (!req.body) {
            return next(new Error("400 | 입력하신 내용이 없습니다."));
        }

        const userCollection = await check.userDbCollection();

        const { userName, userEmail, password: _password } = req.body;
        const userCursor = await userCollection.findOne({
            email: userEmail,
        });
        if (userCursor) {
            return next(new Error("400 | 해당하는 유저가 있습니다."));
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
            recommendationList: [],
            invitation: [],
            salt: salt,
        };
        await userCollection.insertOne({
            ...user,
        });
        logging.info(
            `User Register! name:${user.name} email:${user.email} RequestIP:${requestIp.getClientIp(
                req,
            )}`,
        );
        return userName;
    });
    res.json({ success: true, msg: returnValue });
});
router.get("/usr", check.isAuthenticated, (req, res) => {
    logging.info(
        `User login Check!  email:${req.user.email} RequestIP:${requestIp.getClientIp(req)}`,
    );
    res.json({ success: true, msg: req.user });
});
router.post("/check", async (req, res) => {
    const { token } = req.body;
    if (!token) return res.json();
    const user = await jwt.verify(token);

    if (user === -3) {
        logging.info(
            `User login Check Fail! Error Code:-3!  email:${
                req.user.email
            } RequestIP:${requestIp.getClientIp(req)}`,
        );
        req.session.destroy();
        req.logout();
        //TOKEN_EXPIRED
        return res.json({
            success: false,
            msg: "login expired",
        });
    }
    if (user === -2) {
        req.session.destroy();
        req.logout();
        logging.info(
            `User login Check Fail! Error Code:-2!  email:${
                req.user.email
            } RequestIP:${requestIp.getClientIp(req)}`,
        );
        return res.json({
            success: false,
            msg: "login invalid",
        });
    }
    if (user.email === undefined) {
        logging.info(
            `User login Check Fail! user.email undefined!  email:${
                req.user.email
            } RequestIP:${requestIp.getClientIp(req)}`,
        );
        req.session.destroy();
        req.logout();
        return res.json({
            success: false,
            msg: "token mean undefined",
        });
    }
    req.user = user;
    logging.info(
        `User login Token Check Success!  email:${req.user.email} RequestIP:${requestIp.getClientIp(
            req,
        )}`,
    );
    return res.json({
        success: true,
        msg: "user check success",
    });
});
const invitedTeam = async (req, res) => {
    const { email } = req.user;

    const userCollection = await check.userDbCollection();
    const userCursor = await userCollection.findOne({ email });
    logging.info(
        `Team User Invite list! Success email:${req.user.email} RequestIP:${requestIp.getClientIp(
            req,
        )}`,
    );
    res.json({ success: true, msg: userCursor.invitation });
};
router.get("/invitedTeam", check.isAuthenticated, invitedTeam);
module.exports = router;
