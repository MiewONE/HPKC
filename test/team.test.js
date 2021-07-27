const request = require("supertest");
const app = require("../app");

const teamName = "1234";
const memberEmail = "t";
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
            .post("/team/memberAppend\t")
            .set("Accept", "application/json")
            .type("application/json")
            .send({
                teamName,
                memberEmail,
            });
        expect(res.body.message).toBe(memberEmail);
    });
    test("팀 멤버 삭제 테스트", async () => {
        const res = await request(app)
            .post("/team/memberAppend\t")
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
