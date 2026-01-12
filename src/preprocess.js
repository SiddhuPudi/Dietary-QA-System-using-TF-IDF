const fs = require("fs");
const path = require("path");
const { text } = require("stream/consumers");
/**
 * Clean and normalize text
 * @param {string} text
 * @returns {string}
 */

function cleanText(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s.,]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

const inputFile = path.join("data", "extracted", "book1.txt");
const outputFile = path.join("data", "extracted", "book1_cleaned.txt");

try {
    const rawText = fs.readFileSync(inputFile, "utf-8");
    const cleanedText = cleanText(rawText);
    fs.writeFileSync(outputFile, cleanedText, "utf-8");
    console.log(`✅ Cleaned text saved to ${outputFile}`);
} catch (error) {
    console.error("❌ Error during text cleaning:", error.message);
}