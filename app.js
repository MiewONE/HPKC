const express = require("express");
const session = require("express-session");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const oauth = require("./routes/auth");
const indexRouter = require("./routes/index");
const MongoStore = require("connect-mongodb-session")(session);
const team = require("./routes/team");
// const kakaologin = require('./controller/KakaoLoginController')
const app = express();

app.use(
    session({
        secret: "@@TESTSIGN",
        resave: false,
        saveUninitialized: true,
        store: new MongoStore({
            url: "mongodb://localhost:27017",
            db: "HPKC",
            collection: "sessions",
        }),
        cookie: {
            httpOnly: true,
            maxAge: 600000,
        },
    }),
);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
// app.use('/login',kakaologin);
app.use("/oauth", oauth);
app.use("/team", team);
app.use("/whoami", (req, res) => {
    res.send(req.session);
});

module.exports = app;
