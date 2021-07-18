const request = require("supertest");
const app = require("../app");

const teamName = "1234";
describe("Test /pt",() => {
  test("팀 생성 테스트", async () => {
    const res = await request(app)
      .post("/team/create")
      .set("Accept", "application/json")
      .type("application/json")
      .send({
        teamName,
        subject: "123",
      });

    expect(res.status).toBe(200);
  });
  test("발표 생성 테스트", async () => {
    const res = await request(app)
      .post("/pt/"+teamName+"/createPresentation")
      .set("Accept", "application/json")
      .type("application/json")
      .send({
        ptName : "발표테스트",
        attendants : [1,2,3,4],
        ptOrder : [4,1,3,2]
      });

    expect(res.status).toBe(200);
    console.log(res)
  });
  test("팀 삭제 테스트",async() => {
    const res = await request(app)
      .post("/team/delete")
      .set("Accept", "application/json")
      .type("application/json")
      .send({
        teamName
      })
    expect(res.status).toBe(200);
  })


})

