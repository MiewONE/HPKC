# 프로젝트 명 
> 우리의 프로젝트

# 프로젝트 목적

매주 진행하는 발표를 서로 익명성 투표를 하여 투표결과를 바탕으로 발표의 질을 높이고 철저한 벌칙과 재미를 위한 프로젝트입니다.

# 프로젝트 목표

취업을 위한 포트폴리오 겸 토이프로젝트 이므로 회사에서 요구하는 기술을 녹여볼려합니다.
## 자격요건

1. __Node.Js__ ,TypeScript ,NestJs
2. MySql( AWS Aurora ),MongoDB
3. Jest                         
4. Docker,Docker-compose
5. AWS (ECS, SNS, SQS, API Gateway 등)
6. Terraform

## 기업에서 우대하는 사항

- AWS, GCP, Azure와같은클라우드서비스사용경험
- Typescript 백엔드경력
- DDD (Domain Driven Design)에경험이있거나, 관심이있는분
- 마이크로서비스 아키텍처에 관심이 있거나 운영 경험이 있는 분
- NestJS 혹은 Spring 사용경험

위 자격사항과 우대사항을 충족하게 프로젝트를 진행 할 것입니다.

# 프로젝트 설계

## 요구사항
1. 카카오 및 AuthO 로그인 기능을 사용하여 사용자를 식별하기
2. 팀을 만들어서 관리자 및 팀 구성원이 사용자를 추가,삭제,변경
3. 발표에 사용했던 PPT,PDF,HWP 등 파일 자료 업로드
4. 익명 투표 기능
5. 발표 내역들을 저장하고 통계를 내어 보여주기.
6. 통계 자료를 엑셀 등 파일로 내보내기
7. sns에 공유하기 기능
8. 리액트를 이용하여 프론트엔드 구현

# 기능 구현
## 카카오톡 로그인
> [카카오 Dev Doc 참조](https://developers.kakao.com/docs/latest/ko/kakaologin/common)

소개 : 

    카카오 로그인은 카카오계정과 애플리케이션(이하 앱)을 연결하고 토큰을 발급받아 카카오 API를 사용할 수 있도록 하는 기능입니다. 
    토큰은 사용자를 인증하고 카카오 API 호출 권한을 부여하는 액세스 토큰(Access Token)와 액세스 토큰을 갱신하는 데 쓰는 리프레시 토큰(Refresh Token)이 있습니다

|NAME|설명|Kakao API|
|---|---|---|
|로그인|카카오계정 정보로 사용자를 인증하고 API 호출 권한을 얻습니다.|O|
|연결|카카오계정과 앱을 연결, 사용자가 해당 앱에서 카카오 API를 사용할 수 있게 합니다.|O|
|가입|카카오계정 정보로 로그인한 사용자를 서비스 데이터베이스(DB)에 회원으로 등록합니다.|X<br>서비스 자체 구현|
|로그아웃|로그아웃 요청한 사용자의 토큰을 만료시킵니다.|O|
|연결 끊기|카카오계정과 서비스 사이의 연결을 해제합니다.|O|
|탈퇴|회원 정보를 삭제하고 서비스를 더 이상 이용하지 않습니다.|X<br>서비스 자체 구현|
|토큰|API 호출 권한을 증명하며, 로그인을 통해 발급받습니다.|O|


### 로그인 과정

![](https://developers.kakao.com/docs/latest/ko/assets/style/images/kakaologin/kakaologin_process.png)


|토큰 종류|권한|유효기간|
|----|-----|-----|
|AccessToken|사용자를 인증|REST API : 6 시간|
|RefreshToken|일정 기간 동안 다시 인증 절차를 거치지 않고도 액세스 토큰 발급을 받을수 있게 해줍니다.|2달<br>유효기간 1달 남은 시점부터 갱신 가능|

## 로그인 과정 소스
<pre>
const key = fs.readFileSync('./key/kakaoKey',{
    encoding :"utf-8"
});
passport.use('kakao-login',new kakaoStrategy({
    clientID:key,
    callbackURL:'http://localhost:3045/login/kakao/oauth'
}, async(accessToken,refreshToken,profile,done) => {
    console.log(accessToken);
    console.log(profile);
}));

router.get('/kakao/oauth',passport.authenticate('kakao-login'));

router.get('/auth/kakao/callback',passport.authenticate('kakao-login', {
    failureRedirect: '/',
}),(req,res) => {
    res.redirect('/');
})
</pre>
카카오 dev의 어플리케이션 RestApi 키를 통하여 카카오 사이트로 리다이렉트를 하고 로그인을 성공하였지만. 멈춘 증상이 발생하였습니다.

# 후술...