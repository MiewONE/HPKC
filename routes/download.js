const fs = require("fs");
const path = require("path");
const express = require("express");
const router = express.Router();
const { log } = console;
const mime = require("mime");
const iconvLite = require("iconv-lite");

const getDownloadFilename = (req, filename) => {
    const header = req.headers["user-agent"];

    if (header.includes("MSIE") || header.includes("Trident")) {
        return encodeURIComponent(filename).replace(/\\+/gi, "%20");
    } else if (header.includes("Chrome")) {
        return iconvLite.decode(iconvLite.encode(filename, "UTF-8"), "ISO-8859-1");
    } else if (header.includes("Opera")) {
        return iconvLite.decode(iconvLite.encode(filename, "UTF-8"), "ISO-8859-1");
    } else if (header.includes("Firefox")) {
        return iconvLite.decode(iconvLite.encode(filename, "UTF-8"), "ISO-8859-1");
    }

    return filename;
};
const fileDown = (req, res, next) => {
    const dir = "./upload/";
    const file = dir + req.params.filename;
    // const file = dir + "다운.txt";
    if (!fs.existsSync(file)) {
        res.send("파일이 존재 하지 않습니다");
        return;
    }
    const fileName = path.basename(file);
    const mimetype = mime.getType(file);

    res.setHeader(
        "Content-disposition",
        "attachment; filename=" + getDownloadFilename(req, fileName),
    ); // 다운받아질 파일명 설정
    res.setHeader("Content-type", mimetype); // 파일 형식 지정

    const fileStream = fs.createReadStream(file, {
        encoding: "utf-8",
    });
    fileStream.pipe(res);
};

router.get("/file/:filename", fileDown);

module.exports = router;
