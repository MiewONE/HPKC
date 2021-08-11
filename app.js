const express = require("express");
const session = require("express-session");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const oauth = require("./routes/auth");
const indexRouter = require("./routes/index");
const MongoStore = require("connect-mongodb-session")(session);
const team = require("./routes/team");
const passport = require("passport");
const pt = require("./routes/presentation");
const check = require("./routes/service/checkAuthenticated");
const upload = require("./routes/upload");
const download = require("./routes/download");
// const kakaologin = require('./controller/KakaoLoginController')
const app = express();
app.use(
    session({
        secret: "@@TESTSIGN",
        resave: false,
        saveUninitialized: true,
        store: new MongoStore({
            url: `mongodb+srv://miewone:${process.env.mongodbpw}@cluster0.e5ipp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`,
            db: "HPKC",
            collection: "sessions",
        }),
        cookie: {
            httpOnly: true,
            maxAge: 60 * 60 * 1000,
        },
    }),
);

app.use(logger("dev"));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/api/oauth", oauth);
app.use("/api/team", check.isAuthenticated, team);
app.use("/api/pt", check.isAuthenticated, check.isTeamAuthenticated, pt);
app.use("/api/upload", upload);
app.use("/api/download", download);
app.use((err, req, res, next) => {
    res.send(err.message);
});
module.exports = app;
