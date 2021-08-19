const express = require("express");
const router = express.Router();
const passport = require("passport");
const kakaoStrategy = require("passport-kakao").Strategy;
const LocalStrategy = require("passport-local").Strategy;
const dotenv = require("dotenv");
const crypto = require("crypto");
const jwt = require("./api/jwt");
const check = require("./service/checkAuthenticated");
const db_module = require("./service/module_DB");
const account_module = require("./service/module_account");
const team_module = require("./service/module_team");
// const cookieParser = require("cookie-parser");
dotenv.config();

/** @typedef User
 * @property {string} name
 * @property {string} provider
 * @property {number} providerId
 * @property {string[]} Team
 * @property {string} email
 * */

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
            const userCollection = await db_module.userDbCollection();
            const userCursor = await userCollection.findOne({
                $and: [{ email: username }],
            });
            if (!userCursor) {
                return done(err);
            }
            const { name, password: pwd, salt, provider } = userCursor;
            const logined = (await account_module.confirmPwd(password, salt)) === pwd;
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
    console.log(Date(), ">>> login success\n", req.user);
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
        const loginCollection = await db_module.userDbCollection();

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
        // res.json({ success: true, msg: req.user });
        res.redirect("http://localhost:3000");
    },
);
router.get("/logout", check.isAuthenticated, (req, res) => {
    req.session.destroy((err) => {
        if (err) console.log(">>>>>> err :\n", err);
    });
    req.logout();
    res.redirect("http://localhost:3000");
});

router.post("/register", check.isLogined, async (req, res, next) => {
    const returnValue = db_module.transaction(async () => {
        if (!req.body) {
            return next(new Error("400 | 입력하신 내용이 없습니다."));
        }

        const userCollection = await db_module.userDbCollection();

        const { userName, userEmail, password: _password } = req.body;
        const userCursor = await userCollection.findOne({
            email: userEmail,
        });
        if (userCursor) {
            return next(new Error("400 | 해당하는 유저가 있습니다."));
        }

        const { password, salt } = await account_module.createHashedPassword(_password);

        /** @type User*/
        const user = {
            name: userName,
            provider: "HPKC",
            team: [],
            email: userEmail,
            password,
            recommendationList: [],
            invitation: [],
            salt: salt,
        };
        await userCollection.insertOne({
            ...user,
        });
        return userName;
    });
    res.json({ success: true, msg: returnValue });
});
router.get("/usr", check.isAuthenticated, (req, res) => {
    res.json({ success: true, msg: req.user });
});
router.post("/check", async (req, res) => {
    const { token } = req.body;
    if (!token) return res.json();
    const user = await jwt.verify(token);

    if (user === -3) {
        //TOKEN_EXPIRED
        return res.json({
            success: false,
            msg: "login expired",
        });
    }
    if (user === -2)
        return res.json({
            success: false,
            msg: "login invalid",
        });
    if (user.email === undefined)
        return res.json({
            success: false,
            msg: "token mean undefined",
        });
    req.user = user;
    return res.json({
        success: true,
        msg: "user check success",
    });
});
const invitedTeam = async (req, res) => {
    const { email } = req.user;

    const userCollection = await db_module.userDbCollection();
    const userCursor = await userCollection.findOne({ email });

    res.json({ success: true, msg: userCursor.invitation });
};
const mypage = async (req, res) => {
    const userCollection = await db_module.userDbCollection();

    const userCursor = await userCollection.findOne({ email: req.user.email });
    if (!userCursor) {
        res.json({ success: false, msg: "user not found" });
        return;
    }
    const { name, provider, email, recommendationList, invitation, lastModified } = userCursor;
    res.json({
        success: true,
        msg: {
            name,
            provider,
            email,
            recommendationList,
            invitation,
            lastModified,
        },
    });
};
const pwdupdate = async (req, res) => {
    const returnValue = await db_module.transaction(async () => {
        const { newPassword } = req.body;

        const { password, salt } = await account_module.createHashedPassword(newPassword);
        const userCollection = await db_module.userDbCollection();
        const userCursor = await userCollection.findOne({ email: req.user.email });

        await userCollection.updateOne(
            { _id: userCursor._id },
            { $set: { password, salt }, $currentDate: { lastModified: true } },
        );

        return { success: true, msg: "password changed" };
    });
    res.json(returnValue);
};
const checkpwd = async (req, res) => {
    const { password } = req.body;
    const userCollection = await db_module.userDbCollection();
    const userCursor = await userCollection.findOne({ email: req.user.email });
    const checkpwd = await account_module.confirmPwd(password, userCursor.salt);
    const pwd = checkpwd === userCursor.password;

    if (pwd) {
        res.json({ success: true, msg: "pwd confirm" });
    } else {
        res.json({ success: false, msg: "pwd different" });
    }
};
const withdrawer = async (req, res) => {
    const returnValue = await db_module.transaction(async () => {
        const userCollection = await db_module.userDbCollection();
        const teamCollection = await db_module.teamDbCollection();
        const ptColloection = await db_module.ptDbCollection();

        const userCursor = await userCollection.findOne({ email: req.user.email });
        const createdTeamCursor = await teamCollection.find({ creator: userCursor._id });

        const teamList = await createdTeamCursor.toArray();

        for (let i = 0; i < teamList.length; i++) {
            const teamCursor = await teamCollection.findOne({ teamName: teamList[i].teamName });
            const teamCreator = await userCollection.findOne({
                _id: teamCursor.creator,
            });
            await team_module.deleteTeam(
                teamList[i].teamName,
                teamCursor,
                teamCreator,
                teamCollection,
                userCollection,
                ptColloection,
                req.user.email,
            );
        }
        teamList.forEach((ele) => {
            team_module.deleteTeam(ele.teamName);
        });
        await userCollection.deleteOne({ _id: userCursor._id });
        return { success: true, msg: "request complete" };
    });
    res.json(returnValue);
};
router.get("/invitedTeam", check.isAuthenticated, invitedTeam);
router.get("/mypage", check.isAuthenticated, mypage);
router.put("/updatepassword", check.isAuthenticated, pwdupdate);
router.post("/confirmpwd", check.isAuthenticated, checkpwd);
router.get("/withdrawer", check.isAuthenticated, withdrawer);
module.exports = router;
