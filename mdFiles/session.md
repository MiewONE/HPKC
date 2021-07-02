# express-session

ex) 사용예
```javascript
// session
app.use(express_session({
  secret: "test", 
  resave: false, 
  saveUninitialized: false,
  store:require('mongoose-session')(mongoose), 
  // session 저장 장소 (Mongoose를 이용하여 Mongodb로 설정)
  cookie:{maxAge:(3.6e+6)*24} // 24시간 뒤 만료(자동 삭제)
}));
```

- secret : 암호 키 저장, 이 키를 통하여 Session id를 암호화한다.
- resave :  재저장을 계속 할 것인지 정보, 세션에 변화가 없어도 계속 저장한다는 옵션이다.(false 권장)
- saveUninitialized : True일 경우 세션 저장 전 unitialized 상태로 미리 저장한다
- store : 세션 데이터의 저장소 설정 (위 코드에서는 mongoose-session을 통하여 MongoDB에 저장)
- cookie { maxAge } : 세션 저장 만료 시간 설정 (위 예제에서는 24시간으로 설정)