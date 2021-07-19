const request = require("supertest");
const app = require("../app");

const teamName = "1234";

// beforeAll(() => {
//     test("팀 생성 테스트", async () => {
//         const res = await request(app)
//             .post("/team/create")
//             .set("Accept", "application/json")
//             .type("application/json")
//             .send({
//                 teamName,
//                 subject: "123",
//             });
//
//         expect(res.status).toBe(200);
//     });
// });
// afterAll(() => {
//     test("팀 삭제 테스트", async () => {
//         const res = await request(app)
//             .post("/team/delete")
//             .set("Accept", "application/json")
//             .type("application/json")
//             .send({
//                 teamName,
//             });
//         expect(res.status).toBe(200);
//     });
// });
describe("Test /pt", () => {
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
    for (let i = 0; i < 10; i++) {
        test("발표 생성 테스트" + i + "번째", async () => {
            const res = await request(app)
                .post("/pt/" + teamName + "/createPresentation")
                .set("Accept", "application/json")
                .type("application/json")
                .send({
                    ptName: "발표테스트" + i,
                    attendants: [
                        {
                            name: "박원균",
                            subject: "nodejs",
                            order: 0,
                            result: 0,
                        },
                        {
                            name: "함지윤",
                            subject: "사회복지",
                            order: 0,
                            result: 0,
                        },
                        {
                            name: "최윤지",
                            subject: "react",
                            order: 0,
                            result: 0,
                        },
                    ],
                });

            expect(res.status).toBe(200);
            // console.log(res);
        });
    }
    test("발표 내역 테스트", async () => {
        const res = await request(app).get("/pt/ptlist/" + teamName);

        expect(res.status).toBe(200);
        console.log("발표 내역 테스트 응답>>>");
        res.body.forEach((ele) => console.log(JSON.stringify(ele)));
    });
    test("발표 순서 수정 테스트", async () => {
        const res = await request(app)
            .put("/pt/OrderChange")
            .set("Accept", "application/json")
            .type("application/json")
            .send({
                ptName: "발표테스트0",
                attendants: [
                    {
                        name: "박원균",
                        subject: "nodejs",
                        order: 1,
                        result: 0,
                    },
                    {
                        name: "함지윤",
                        subject: "사회복지",
                        order: 2,
                        result: 0,
                    },
                    {
                        name: "최윤지",
                        subject: "react",
                        order: 3,
                        result: 0,
                    },
                ],
            });
        expect(res.status).toBe(200);
    });
    test("발표 내역 테스트", async () => {
        const res = await request(app).get("/pt/ptlist/" + teamName);

        expect(res.status).toBe(200);
        console.log("발표 내역 테스트 수정 후 응답>>>");
        res.body.forEach((ele) => console.log(JSON.stringify(ele)));
    });
    test("팀 삭제 테스트", async () => {
        const res = await request(app)
            .post("/team/delete")
            .set("Accept", "application/json")
            .type("application/json")
            .send({
                teamName,
            });
        expect(res.status).toBe(200);
    });
});

describe("Test /pt", () => {});
