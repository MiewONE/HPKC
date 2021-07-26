const fs = require("fs");
const path = require('path');
const express = require("express");
const router = express.Router();
const {log} = console;
const fileDown = (req,res,next) => {
  log(req.params.filename);
  const rs = fs.createReadStream("./upload/nuget.org.txt",{
    encoding:"utf-8"
  });
  rs.on('data',(data) => {
    log("Event : data",data);
  })
  rs.on('end',() => {
    log("Event: end");
  })
}


router.get("/file/:filename",fileDown);

module.exports = router;