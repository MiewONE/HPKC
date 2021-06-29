const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const oauth = require('./controller/auth')

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
// const kakaologin = require('./controller/KakaoLoginController')


const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
// app.use('/login',kakaologin);
app.use('/',oauth);

module.exports = app;
