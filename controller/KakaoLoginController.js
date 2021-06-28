const passport = require('passport')
const kakaoStrategy = require('passport-kakao').Strategy
const express = require('express');
const session = require('express-session')
const fs = require('fs')

const router = express.Router();


const key = fs.readFileSync('./key/kakaoKey',{
    encoding :"utf-8"
});
router.use(session({
    secret:'test',
    resave:true,
    saveUninitialized:true
}))
router.use(passport.initialize())
router.use(passport.session())
passport.use('kakao-login',new kakaoStrategy({
    clientID:key,
    callbackURL:'http://localhost:3045/login/kakao/callback'
}, async(accessToken,refreshToken,profile,done) => {
    console.log(accessToken);
    console.log(profile);
    // return done(null,{accessToken,profile});
    if(!profile)
    {
        done(null,undefined,"login fail");
    }
    done(null,profile);
}));

router.get('/kakao/oauth',passport.authenticate('kakao-login'),(req,res,next) => {
    console.log(req);
    res.end();
});


router.get('/kakao/callback',passport.authenticate('kakao-login', {
    failureRedirect: '/error',
}),(req,res) => {

    console.log("login Success");
    console.log(req);
    res.redirect('/');
})


module.exports = router;