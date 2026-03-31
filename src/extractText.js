const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const { ensureDir, PATHS } = require("./utils");

/**
 * Extract raw text from a single PDF file.
 * @param {string} fileName - PDF filename
 * @param {number} current  - current file index (1-based)
 * @param {number} total    - total number of files
 */
async function processPDF(fileName, current, total) {
  const inputPath = path.join(PATHS.RAW, fileName);
  const baseName = path.parse(fileName).name;
  const outputPath = path.join(PATHS.EXTRACTED, `${baseName}.txt`);
  if (fs.existsSync(outputPath)) {
    console.log(`  ⏭️  [${current}/${total}] Skipping (already extracted): ${fileName}`);
    return { status: "skipped", file: fileName };
  }
  const stats = fs.statSync(inputPath);
  if (stats.size === 0) {
    console.warn(`  ⚠️  [${current}/${total}] Skipping empty file: ${fileName}`);
    return { status: "empty", file: fileName };
  }
  try {
    console.log(`  📄 [${current}/${total}] Extracting: ${fileName} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
    const buffer = fs.readFileSync(inputPath);
    const data = await pdf(buffer);
    if (!data.text || data.text.trim().length === 0) {
      console.warn(`  ⚠️  [${current}/${total}] No text content in: ${fileName}`);
      return { status: "no-text", file: fileName };
    }
    fs.writeFileSync(outputPath, data.text, "utf-8");
    console.log(`  ✅ [${current}/${total}] Extracted ${data.numpages} pages → ${baseName}.txt`);
    return { status: "success", file: fileName, pages: data.numpages };
  } catch (err) {
    console.error(`  ❌ [${current}/${total}] Error with ${fileName}: ${err.message}`);
    return { status: "error", file: fileName, error: err.message };
  }
}

async function processAll() {
  const startTime = Date.now();
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║   Step 1: PDF Text Extraction            ║");
  console.log("╚══════════════════════════════════════════╝\n");
  ensureDir(PATHS.EXTRACTED);
  if (!fs.existsSync(PATHS.RAW)) {
    console.error(`❌ Raw data directory not found: ${PATHS.RAW}`);
    console.error("   Place PDF files in data/raw/ and try again.");
    process.exit(1);
  }
  const files = fs.readdirSync(PATHS.RAW);
  const pdfFiles = files.filter((f) => f.toLowerCase().endsWith(".pdf"));
  if (pdfFiles.length === 0) {
    console.error("❌ No PDF files found in data/raw/");
    process.exit(1);
  }
  console.log(`📚 Found ${pdfFiles.length} PDF file(s)\n`);
  const results = [];
  for (let i = 0; i < pdfFiles.length; i++) {
    const result = await processPDF(pdfFiles[i], i + 1, pdfFiles.length);
    results.push(result);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const success = results.filter((r) => r.status === "success").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const errors = results.filter((r) => r.status === "error").length;

  console.log("\n────────────────────────────────────────────");
  console.log(`✅ Extraction complete in ${elapsed}s`);
  console.log(`   ${success} extracted | ${skipped} skipped | ${errors} errors`);
  console.log("────────────────────────────────────────────\n");
}

processAll();