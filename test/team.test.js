jest.setTimeout(20 * 1000);

const request = require("supertest");
const app = require("../app");

// Math.random().toString(36).substr(2, 11); //랜덤 문자열
const teamName = "팀생성테스트";
const memberEmail = "tester2@test.com";
describe("Test /team", () => {
    test("팀 생성 테스트", async () => {
        const res = await request(app)
            .post("/team/create")
            .set("Accept", "application/json")
            .type("application/json")
            .send({
                teamName,
                subject: "123",
            });
        expect(res.body.message).toBe("200");
    });
    test("팀 멤버 추가 테스트", async () => {
        const res = await request(app)
            .post("/team/memberappend")
            .set("Accept", "application/json")
            .type("application/json")
            .send({
                teamName,
                memberEmail,
            });
        console.log(res);
        expect(res.body.message).toBe(memberEmail);
    });
    test("팀 멤버 삭제 테스트", async () => {
        const res = await request(app)
            .post("/team/memberremove")
            .set("Accept", "application/json")
            .type("application/json")
            .send({
                teamName,
                memberEmail,
            });
        expect(res.body.message).toBe(memberEmail);
    });
    test("팀 삭제 테스트", async () => {
        const res = await request(app)
            .post("/team/delete")
            .set("Accept", "application/json")
            .type("application/json")
            .send({
                teamName,
            });
        expect(res.body.message).toBe(teamName);
    });
});

// # 시나리오
// t라는 이메일을 가진 멤버가 "팀생성테스트"라는 팀을 만들고나서 tester2@test.com라는 이메일을 가진 유저를 멤버로 초대할려고한다.
// tester2는 초대가온 팀을 확인하고 초대를 수락하여 팀에 참여하게된다.

// # 나올 수 있는 경우
// 응답에 성공하게된다면 res.body.success 가 true 라고 나올것이다.
describe("Test /memberInviteSuccess", () => {
    test("팀 생성 테스트", async () => {
        const res = await request(app)
            .post("/team/create")
            .set("Accept", "application/json")
            .type("application/json")
            .send({
                teamName,
                subject: "123",
            });
        expect(res.body.success).toBe(true);
    });
    test("팀 인원 초대 테스트", async () => {
        const res = await request(app)
            .post("/team/invite")
            .set("Accept", "application/json")
            .type("application/json")
            .send({
                teamName,
                memberEmail,
            });

        expect(res.body.success).toBe(true);
        expect(res.body.msg.memberEmail).toBe(memberEmail);
    });
    test("팀 초대 수락 테스트", async () => {
        const res = await request(app)
            .post("/team/memberappend")
            .set("Accept", "application/json")
            .type("application/json")
            .send({
                teamName,
                memberEmail,
            });
        expect(res.body.success).toBe(true);
        expect(res.body.msg.teamName).toBe(teamName);
        expect(res.body.msg.confirmMember).toBe(memberEmail);
    });
    test("팀 삭제 테스트", async () => {
        const res = await request(app)
            .post("/team/delete")
            .set("Accept", "application/json")
            .type("application/json")
            .send({
                teamName,
            });
        expect(res.body.success).toBe(true);
    });
});
describe("Test /memberInviteReject", () => {
    test("팀 생성 테스트", async () => {
        const res = await request(app)
            .post("/team/create")
            .set("Accept", "application/json")
            .type("application/json")
            .send({
                teamName,
                subject: "123",
            });
        expect(res.body.success).toBe(true);
    });
    test("팀 인원 초대 테스트", async () => {
        const res = await request(app)
            .post("/team/invite")
            .set("Accept", "application/json")
            .type("application/json")
            .send({
                teamName,
                memberEmail,
            });
        expect(res.body.success).toBe(true);
    });
    test("팀 초대 거절 테스트", async () => {
        const res = await request(app)
            .post("/team/invite")
            .set("Accept", "application/json")
            .type("application/json")
            .send({
                teamName,
                memberEmail,
            });
    });
    test("팀 삭제 테스트", async () => {
        const res = await request(app)
            .post("/team/delete")
            .set("Accept", "application/json")
            .type("application/json")
            .send({
                teamName,
            });
        expect(res.body.success).toBe(true);
    });
});

beforeAll(() => {});
afterAll(() => {});
