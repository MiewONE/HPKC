const request = require("supertest");
const app = require("../app");

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
