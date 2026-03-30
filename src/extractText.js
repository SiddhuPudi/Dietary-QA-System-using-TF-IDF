const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");

function cleanText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function processPDF(fileName) {
  const inputPath = path.join("data", "raw", fileName);
  const baseName = path.parse(fileName).name;
  const outputRaw = path.join("data", "extracted", `${baseName}.txt`);
  const outputClean = path.join("data", "extracted", `${baseName}_clean.txt`);
  if (fs.existsSync(outputClean)) {
    console.log(`⏭️ Skipping (already processed): ${fileName}`);
    return;
  }
  try {
    console.log(`📄 Processing: ${fileName}`);
    const buffer = fs.readFileSync(inputPath);
    const data = await pdf(buffer);
    fs.writeFileSync(outputRaw, data.text, "utf-8");
    const cleaned = cleanText(data.text);
    fs.writeFileSync(outputClean, cleaned, "utf-8");
  } catch (err) {
    console.error(`❌ Error with ${fileName}:`, err.message);
  }
}

async function processAll() {
  const files = fs.readdirSync("data/raw");
  const pdfFiles = files.filter(f => f.endsWith(".pdf"));
  console.log(`Found ${pdfFiles.length} PDF files\n`);
  for (const file of pdfFiles) {
    await processPDF(file);
  }
  console.log(`\n✅ Done: ${pdfFiles.length} books processed`);
}

processAll();