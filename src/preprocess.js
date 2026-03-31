const fs = require("fs");
const path = require("path");
const { cleanText, ensureDir, PATHS } = require("./utils");

/**
 * Clean a single extracted text file.
 * @param {string} fileName   - raw .txt filename
 * @param {number} current    - current file index (1-based)
 * @param {number} total      - total number of files
 */
function processFile(fileName, current, total) {
  const baseName = path.parse(fileName).name;
  const inputPath = path.join(PATHS.EXTRACTED, fileName);
  const outputPath = path.join(PATHS.EXTRACTED, `${baseName}_clean.txt`);

  if (fs.existsSync(outputPath)) {
    const rawStat = fs.statSync(inputPath);
    const cleanStat = fs.statSync(outputPath);
    if (cleanStat.mtimeMs >= rawStat.mtimeMs) {
      console.log(`  ⏭️  [${current}/${total}] Skipping (already cleaned): ${fileName}`);
      return "skipped";
    }
  }
  try {
    const rawText = fs.readFileSync(inputPath, "utf-8");
    if (!rawText || rawText.trim().length === 0) {
      console.warn(`  ⚠️  [${current}/${total}] Empty file, skipping: ${fileName}`);
      return "empty";
    }
    const cleanedText = cleanText(rawText);
    if (cleanedText.length === 0) {
      console.warn(`  ⚠️  [${current}/${total}] No content after cleaning: ${fileName}`);
      return "empty";
    }
    fs.writeFileSync(outputPath, cleanedText, "utf-8");
    const reduction = ((1 - cleanedText.length / rawText.length) * 100).toFixed(1);
    console.log(`  ✅ [${current}/${total}] Cleaned: ${fileName} (${reduction}% reduction)`);
    return "success";
  } catch (err) {
    console.error(`  ❌ [${current}/${total}] Error cleaning ${fileName}: ${err.message}`);
    return "error";
  }
}

function processAll() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║   Step 2: Text Preprocessing             ║");
  console.log("╚══════════════════════════════════════════╝\n");
  ensureDir(PATHS.EXTRACTED);
  if (!fs.existsSync(PATHS.EXTRACTED)) {
    console.error(`❌ Extracted directory not found: ${PATHS.EXTRACTED}`);
    console.error("   Run extraction first: npm run extract");
    process.exit(1);
  }
  const files = fs.readdirSync(PATHS.EXTRACTED);
  const rawFiles = files.filter(
    (f) => f.endsWith(".txt") && !f.endsWith("_clean.txt")
  );
  if (rawFiles.length === 0) {
    console.error("❌ No extracted text files found.");
    console.error("   Run extraction first: npm run extract");
    process.exit(1);
  }
  console.log(`📝 Found ${rawFiles.length} text file(s) to clean\n`);
  let success = 0, skipped = 0, errors = 0;
  rawFiles.forEach((file, i) => {
    const result = processFile(file, i + 1, rawFiles.length);
    if (result === "success") success++;
    else if (result === "skipped") skipped++;
    else errors++;
  });
  console.log("\n────────────────────────────────────────────");
  console.log(`✅ Preprocessing complete`);
  console.log(`   ${success} cleaned | ${skipped} skipped | ${errors} errors`);
  console.log("────────────────────────────────────────────\n");
}

processAll();