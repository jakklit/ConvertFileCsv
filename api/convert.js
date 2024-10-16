const express = require("express");
const router = express.Router();
const multer = require("multer");
const { mergeCSVFiles } = require("../sdk/convert");

const upload = multer({ dest: "uploads/" }).array("csvFiles", 10);

router.post("/upload", (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).send("Error uploading files.");
        }

        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).send("Please upload at least one CSV file.");
        }

        mergeCSVFiles(files, res);
    });
});

module.exports = router;
