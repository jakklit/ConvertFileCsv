const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const { Parser } = require("json2csv");
const path = require("path");

const router = express.Router();

const upload = multer({ dest: "uploads/" }).array("csvFiles", 10);

function convertThaiUnits(value, key) {
    const skipColumns = [
        "Data Period",
        "User Id",
        "Start Time",
        "Duration",
        "Livestream Name",
        "Comments",
        "Avg. Views Duration",
    ];
    if (
        skipColumns.includes(key) ||
        (typeof value === "string" && value.match(/\d{2}-\d{2}-\d{4}/))
    ) {
        return value;
    }

    if (typeof value === "string") {
        value = value.replace("฿", "").trim();

        if (value.includes("ล้าน")) {
            return (
                parseFloat(value.replace("ล้าน", "").trim()) * 1000000
            ).toLocaleString();
        } else if (value.includes("แสน")) {
            return (
                parseFloat(value.replace("แสน", "").trim()) * 100000
            ).toLocaleString();
        } else if (value.includes("หมื่น")) {
            return (
                parseFloat(value.replace("หมื่น", "").trim()) * 10000
            ).toLocaleString();
        } else if (value.includes("พัน")) {
            return (
                parseFloat(value.replace("พัน", "").trim()) * 1000
            ).toLocaleString();
        } else if (value.match(/^\d+(\.\d+)?พัน$/)) {
            return (parseFloat(value.replace("พัน", "")) * 1000).toLocaleString();
        } else if (!isNaN(parseFloat(value))) {
            return parseFloat(value).toLocaleString();
        }
    }
    return value;
}

function mergeCSVFiles(files, res) {
    let mergedData = [];

    files.forEach((file, index) => {
        const filePath = file.path;
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (row) => {
                Object.keys(row).forEach((key) => {
                    row[key] = convertThaiUnits(row[key], key);
                });
                mergedData.push(row);
            })
            .on("end", () => {
                console.log(`${file.originalname} has been processed.`);

                fs.unlinkSync(filePath);

                if (index === files.length - 1) {
                    mergedData.sort((a, b) => {
                        const noA = parseInt(a['No.'], 10);
                        const noB = parseInt(b['No.'], 10);
                        return noA - noB;
                    });

                    const json2csvParser = new Parser();
                    const csvOutput = json2csvParser.parse(mergedData);

                    const outputFilePath = path.join(path.dirname(filePath), 'merged_output.csv');
                    fs.writeFileSync(outputFilePath, csvOutput);

                    res.setHeader('Content-Disposition', 'attachment; filename=merged_output.csv');
                    res.sendFile(path.resolve(outputFilePath), (err) => {
                        if (err) {
                            console.error('Error while sending the file:', err);
                        } else {
                            fs.unlinkSync(outputFilePath);
                        }
                    });
                }
            });
    });
}

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
