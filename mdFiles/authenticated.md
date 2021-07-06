# Authenticated 보안관련
> ref : [pageseo](https://gngsn.tistory.com/31)

## 인증 Authentication
> API 요청에 대해 사용 가능한 사용자인지 확인하는 절차

주로 클라이언트와 서버가 통신을 할 때, 클라이언트 쪽에서 요청하는 사용자와 같은 사용자인지를 확인하는것

## 인가 Authorization
> 사용자가 특정 자원에 대한 접근 권한이 있는지 권한 체크

클라이언트가 하고자 하는 작업이 해당 클라이언트에게 허가된 작업인지 확인하는 것.

## Cookie VS. Session

HTTP에는 무상태성이라는 특징이 존재
Stateless, 상태를 저장하지 않는다는 의미.

### express-session

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
### Cookie
> 클라이언트 로컬에 저장되는 키와 값이 들어있는 작은 데이터 파일

### Session
> 일정 시간 동안 같은 브라우저로부터 들어오는 일련의 요구를 하나의 상태로 보고 그 상태를 유지한느 기술

## 토큰 기반 인증
1. Authorization Grant

   권한을 인증해준다.
   클라이언트가 Authorization Server에 권한을 요청하게 된다.
2. Access Token

   Authorization Server가 클라이언트의 인증 요청을 확인한다.
   로그인이라고 하면, 아이디가 있는지 비밀번호는 맞는지 확인한다.
   인증에 성공하면 특정 유절르 위한 Token을 건네준다.
3. Access Token

   클라이언트가 만약 Resource Server(특정 서비스를 제공하는 서버)에 접근을 요청한다고 하면, 해당 요청에 대한 인증&인가를 받는다
   이 때 발급받은 Token을 Resource Server에 같이 보내준다.(Request Header를 통하여)
4. Protected Resource

   Resource Server가 Access Token을 받고 토큰을 검증
   토큰이 유효한가, 토큰 기간이 만료되지는 않았나 등 검사를 하고 신뢰성 있는 토큰이라면 쵸어한 자료를 클라이언트에게 보내주게 된다.

## 토큰을 사용하는 이유

### 보안성
토큰 기반 인증 시스템을 사용하여 어플리케이션의 보안을 비교적 높일수있음.
토큰에 유효기간을 설정, 유효기간이 끝나면 Access Token을 발급받는 방식을 사용

## 무상태 & 확장성 (Stateless & scalability)

## Access Token

- 서버에서 클라이언트가 인증을 받았을때 확인을 위한 토큰
## Refresh Token

- Access Token이 만료되었을 때 새로 발급해주는 열쇠
- Access Token과 함께 클라이언트에 발급
- 현재 액세스 토큰이 유효하지 않거나 만료될 때 새 액세스 토큰을 얻을 수 있다.

# JWT
> JWT -> JSON Web Token

JWT를 사용하여 두 개체 사이에서 JSON 객체를 사용하여 정보를 안전성 있게 전달할 수 있다.


## 사용 이유
단순한 String 형태이기 때문에 가볍고 데이터를 토큰 내부에 포함한다.
HTTP 헤더나 URI 파라미터를 이용하여 전달 할 수 있으며 RFC 표준으로 등록되었기 때문에 다양한 프로그래밍 언어에서 지원해주고있다.

## JWT 구조
복잡하고 읽을 수 없는 String 형태로 지정되어있다.


__header.payload.verify_signature__
###header
> 알고리즘과 토큰 타입 지정
```json
{
  "algorithm": "sha256",
  "typ": "JWT"
}
```
###payload
> 토큰에 담을 정보

####register claim
토큰에 대한 정보들을 담기 위하여 이름이 이미 정해진 클레임

- iss : 토큰 발급자 (issuer)
- sub : 토큰 제목 (subject)
- aud : 토큰 대상자(audience)
- exp : 토큰의 만료시간(expiraton) 
        
        시간은 NumericDate 형식으로 되어있어야하며 언제나 현재 시간보다 이후로 설정되어 있어야함.
- iat : 토큰이 발급된 시간,토큰의 age가 얼마나 되었는지 판단
#### public claim
공개된 클레임-충돌이 방지된 collision-resistant이름을 가져야한다.
클레임 이름으로 URI를 사용한다.
```json
{
  "https://example.com/auth/isAdmin": true
}
```

#### private claim
등록된 클레임도 아니고 공개된 클레임도 아님
클라이언트와 서버합의 하에 사용되는 클레임이름들로 구성되어있다.
이름이 중복되어 충돌이 될 수 있으며 사용시 유의

```json
{
  "idx": 2,
  "id": "miewone",
  "age": 26,
  "iss": "root",
  "exp": "1511224"
}
```

### Verify Signature
마지막 부분에는 JWT 해싱할 때, 복호화 할 수 있는 비밀키가 같이 포함되어있다.
```text
HMACSHA256(
    base65UrlEncode(haeder)
    + "."
    + base64UrlEncode(payload),
    secretKey
)
```
