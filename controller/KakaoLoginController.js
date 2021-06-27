const passport = require('passport')
const kakaoStrategy = require('passport-kakao').Strategy
const express = require('express');
const fs = require('fs')

const router = express.Router();


const key = fs.readFileSync('./key/kakaoKey',{
    encoding :"utf-8"
});
passport.use('kakao-login',new kakaoStrategy({
    clientID:key,
    callbackURL:'http://localhost:3045/login/kakao/oauth'
}, async(accessToken,refreshToken,profile,done) => {
    console.log(accessToken);
    console.log(profile);
    done(null, {accessToken,profile});
}));

router.get('/kakao/oauth',passport.authenticate('kakao-login'));

router.get('/kakao/callback',passport.authenticate('kakao-login', {
    failureRedirect: '/',
}),(req,res) => {
    console.log(req);
    res.redirect('/');
})

module.exports = router;