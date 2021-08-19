const request = require("supertest");
const app = require("../app");
describe("Test user", () => {
    test("유저 가입 테스트", async () => {
        const res = await request(app)
            .post("/oauth/register")
            .set("Accept", "application/json")
            .type("application/json")
            .send({
                userName: "t",
                userEmail: "t",
                password: "t",
            });

        expect(res.status).toBe(200);
    });
    test("유저 로그인 테스트", async () => {
        const res = await request(app)
            .post("/oauth/logins")
            .set("Accept", "application/json")
            .type("application/json")
            .send({
                userEmail: "t",
                password: "t",
            });
        expect(res.status).toBe(201);
    });
});
