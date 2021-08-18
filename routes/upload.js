const express = require("express");
const router = express.Router();
const multer = require("multer");

const storage = multer.diskStorage({
    // 2
    destination(req, file, cb) {
        cb(null, "uploadedFiles/");
    },
    filename(req, file, cb) {
        cb(null, `${Date.now()}__${file.originalname}`);
    },
});
const upload = multer({ dest: "upload/" }); // 3-1
const uploadWithOriginalFilename = multer({ storage: storage }); // 3-2

router.get("/", (req, res) => {
    //res.render('upload');
    res.json({ file: req.file, files: null });
});

router.post("/uploadFile", upload.single("attachment"), (req, res) => {
    // 4
    //res.render('confirmation', { file:req.file, fi// les:null });
    // res.json({file:req.file,files:null});
    // res.status(200);
});

router.post(
    "/uploadFileWithOriginalFilename",
    uploadWithOriginalFilename.single("attachment"),
    (req, res) => {
        // 5
        //res.render('confirmation', { file:req.file, files:null });
        res.json({ file: req.file, files: null });
    },
);

router.post("/uploadFiles", upload.array("attachments"), (req, res) => {
    // 6
    //res.render('confirmation', { file: null, files:req.files} );
    res.json({ file: req.file, files: null });
});

router.post(
    "/uploadFilesWithOriginalFilename",
    uploadWithOriginalFilename.array("attachments"),
    (req, res) => {
        // 7
        //res.render('confirmation', { file:null, files:req.files });
        res.json({ file: req.file, files: null });
    },
);

module.exports = router;
