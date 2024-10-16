const csv = require("csv-parser");
const fs = require("fs");
const { Parser } = require("json2csv");
const path = require("path");



function isDateOrDateTime(value) {
    const dateRegex1 = /^\d{2}\/\d{2}\/\d{4}$/; // Format: DD/MM/YYYY
    const dateRegex2 = /^\d{4}-\d{2}-\d{2}$/; // Format: YYYY-MM-DD
    const dateTimeRegex1 = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}(:\d{2})?$/; // Format: DD/MM/YYYY HH:MM(:SS)
    const dateTimeRegex2 = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/; // Format: YYYY-MM-DD HH:MM(:SS)
    const dateTimeRegexISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/; // ISO Format: YYYY-MM-DDTHH:MM(:SS)

    return (
        dateRegex1.test(value) || // DD/MM/YYYY
        dateRegex2.test(value) || // YYYY-MM-DD
        dateTimeRegex1.test(value) || // DD/MM/YYYY HH:MM(:SS)
        dateTimeRegex2.test(value) || // YYYY-MM-DD HH:MM(:SS)
        dateTimeRegexISO.test(value) // ISO format
    );
}

function convertThaiUnits(value, key) {
    if (key === "Data Period") {
        console.log("Skipping Data Period: ", value); // เพิ่มการตรวจสอบที่แน่ชัด
        return value;
    }

    const skipColumns = [
        "Data Period",  
        "User Id",
        "Start Time",
        "Duration",
        "Livestream Name",
        "Comments",
        "Avg. Views Duration"
    ];

    const trimmedKey = key.trim();

    if (skipColumns.includes(trimmedKey) || isDateOrDateTime(value)) {
        return value;
    }

    if (typeof value === "string") {
        if (value.includes("฿") && value.includes(",")) {
            return value.replace("฿", "").trim();
        }

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
        } else if (!isNaN(parseFloat(value))) {
            // ถ้าเป็นตัวเลข ให้ใส่เครื่องหมาย ","
            return parseFloat(value).toLocaleString();
        }
    }
        if (!isNaN(parseFloat(value))) {
            return parseFloat(value).toLocaleString();
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
                    const json2csvParser = new Parser();
                    const csvOutput = json2csvParser.parse(mergedData);

                    const outputFilePath = path.join(
                        path.dirname(filePath),
                        "merged_output.csv"
                    );
                    fs.writeFileSync(outputFilePath, csvOutput);

                    // ส่งไฟล์ให้กับผู้ใช้
                    res.setHeader(
                        "Content-Disposition",
                        "attachment; filename=merged_output.csv"
                    );
                    res.sendFile(path.resolve(outputFilePath), (err) => {
                        if (err) {
                            console.error("Error while sending the file:", err);
                        } else {
                            fs.unlinkSync(outputFilePath);
                        }
                    });
                }
            });
    });
}

module.exports = { mergeCSVFiles };
