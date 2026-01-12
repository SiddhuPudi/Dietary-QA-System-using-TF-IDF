const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

async function extractPDF(inputPath, outputPath) {
    try {
        const dataBuffer = fs.readFileSync(inputPath);
        const data = await pdfParse(dataBuffer);
        fs.writeFileSync(outputPath, data.text, "utf-8");
        console.log(`✅ Extracted text saved to ${outputPath}`);
    } catch (error) {
        console.error("❌ Error extracting text from PDF:", error.message);
    }
}

const books = [
    { pdf: "book1.pdf", txt: "book1.txt" },
    { pdf: "book2.pdf", txt: "book2.txt" }
]

async function extractAll() {
    for (const book of books) {
        await extractPDF(
            path.join("data", "raw", book.pdf),
            path.join("data", "extracted", book.txt)
        );
    }
}

extractAll();