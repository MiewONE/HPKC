const express = require('express');
const router = express.Router();
const passport = require('passport')
const kakaoStrategy = require('passport-kakao').Strategy;
const fs = require('fs')

const key = fs.readFileSync('./key/kakaoKey',{
    encoding:'utf-8'
})

router.use(passport.initialize())
router.use(passport.session());
passport.serializeUser( (user,done) => {
    done(null,user);
})
passport.deserializeUser( (user,done) => {
    done(null,user);
})
passport.use('kakao',new kakaoStrategy({
    clientID : key,
    callbackURL : '/oauth/kakao/callbak',
}, async( accessToken,refreshToken,profile,done) => {
    console.log(accessToken);
    console.log(refreshToken);
    console.log(profile);

    return done(null,profile);
}))

router.get('/oauth/kakao',passport.authenticate(('kakao')));

router.get('/oauth/kakao/callbak',passport.authenticate('kakao',{
    failureRedirect:'/error',
}),(req,res) => {
    console.log(">>> login Success");
    console.log(req.user);
    res.redirect('/');
})

module.exports = router;