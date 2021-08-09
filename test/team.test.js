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

describe("Test /member", () => {
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
