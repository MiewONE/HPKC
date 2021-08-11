const winston = require("winston");
require("dotenv").config();

const { combine, timestamp, label, printf } = winston.format;

const logFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`; // log 출력 포맷 정의
});

const options = {
    file: {
        level: "info",
        filename: "logs/winston-test.log",
        handleExceptions: true,
        json: false,
        maxsize: 5242880,
        maxFiles: 5,
        colorize: false,
        format: combine(label({ label: "service-log" }), timestamp(), logFormat),
    },
    console: {
        level: "debug",
        handleExceptions: true,
        json: false, // 로그형태를 json으로도 뽑을 수 있다.
        colorize: true,
        format: combine(label({ label: "debug-output" }), timestamp(), logFormat),
    },
};

let logger = new winston.createLogger({
    transports: [
        new winston.transports.File(options.file), // 중요! 위에서 선언한 option으로 로그 파일 관리 모듈 transport
    ],
    exitOnError: false,
});

if (process.env.dev !== "false") {
    logger.add(new winston.transports.Console(options.console)); // 개발 시 console로도 출력
}

// const logger = winston.createLogger({
//     level: "info",
//     format: winston.format.json(),
//     transports: [
//         new winston.transports.File({ filename: "error.log", level: "error" }),
//         new winston.transports.File({ filename: "combined.log" }),
//     ],
// });
//
// if (process.env.dev === "true") {
//     logger.add(
//         new winston.transports.Console({
//             format: winston.format.simple(),
//         }),
//     );
// }

module.exports = logger;
