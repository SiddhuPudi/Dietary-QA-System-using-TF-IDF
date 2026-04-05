const fs = require("fs");
const path = require("path");
const { ensureDir, PATHS } = require("./utils");

// ─── Chunk-size parameters ──────────────────────────────────────
const MIN_CHUNK_LENGTH = 100;  // Minimum characters for a valid chunk
const MAX_CHUNK_LENGTH = 600;  // Maximum characters for a chunk
const TARGET_SENTENCES = 4;    // Ideal sentences per chunk (3–5)
const MIN_SENTENCES    = 3;    // Minimum sentences per chunk
const MAX_SENTENCES    = 5;    // Maximum sentences per chunk

// ─── Noise-detection thresholds ─────────────────────────────────
const MAX_COMMA_COUNT      = 8;    // Chunks with > 8 commas are likely lists/index
const MAX_DIGIT_RATIO      = 0.12; // If digits > 12% of total chars → noisy
const MIN_AVG_WORD_LENGTH  = 2.5;  // Very short avg word length → abbreviation lists
const MAX_REPETITION_RATIO = 0.45; // If > 45% of words are repeated → repetitive
const MIN_ALPHA_RATIO      = 0.55; // At least 55% of chars should be letters

//  SENTENCE SPLITTING
/**
 * Split text into individual sentences using ., ?, ! as boundaries.
 * Handles common abbreviations (dr., mr., etc.) to avoid false splits.
 * @param {string} text
 * @returns {string[]}
 */
function splitIntoSentences(text) {
  if (!text || text.trim().length === 0) return [];

  // Protect common abbreviations from being treated as sentence endings
  let processed = text
    .replace(/\b(dr|mr|mrs|ms|prof|sr|jr|vs|etc|inc|ltd|co|govt|approx|vol|no|fig|ref|e\.g|i\.e)\./gi, "$1<DOT>")
    .replace(/\b(\d+)\./g, "$1<DOT>");      // numbered lists like "1."

  // Split on sentence-ending punctuation followed by a space or end
  const raw = processed.split(/(?<=[.!?])\s+/);

  return raw
    .map(s => s.replace(/<DOT>/g, ".").trim())
    .filter(s => s.length > 0);
}

//  NOISE DETECTION
/**
 * Determine if a chunk is "noisy" — i.e. index pages, keyword lists,
 * table-of-contents, dense number lists, or repetitive patterns.
 *
 * @param {string} text
 * @returns {boolean} true if the chunk should be discarded
 */
function isNoisyChunk(text) {
  if (!text) return true;
  const len = text.length;
  if (len < MIN_CHUNK_LENGTH)  return true;   // too short to be useful
  if (len > MAX_CHUNK_LENGTH * 2) return true; // abnormally long
  // 1. Too many commas (index/list indicator)
  const commaCount = (text.match(/,/g) || []).length;
  if (commaCount > MAX_COMMA_COUNT) return true;
  // 2. High digit ratio (page numbers, table data)
  const digitCount = (text.match(/\d/g) || []).length;
  if (len > 0 && digitCount / len > MAX_DIGIT_RATIO) return true;
  // 3. Low alphabetic ratio (non-prose content)
  const alphaCount = (text.match(/[a-z]/gi) || []).length;
  if (len > 0 && alphaCount / len < MIN_ALPHA_RATIO) return true;
  // 4. Average word length too short (abbreviation lists, initials)
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length > 0) {
    const avgWordLen = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    if (avgWordLen < MIN_AVG_WORD_LENGTH) return true;
  }
  // 5. Repetitive content — too many repeated words
  if (words.length > 5) {
    const unique = new Set(words.map(w => w.toLowerCase()));
    const repetitionRatio = 1 - (unique.size / words.length);
    if (repetitionRatio > MAX_REPETITION_RATIO) return true;
  }
  // 6. Pattern-based: looks like a book index ("word 123, 456, 789")
  //    Detect lines with many "word number" or "number, number" patterns
  const indexPattern = /\b[a-z]+\s+\d{1,3}(,\s*\d{1,3}){2,}/gi;
  const indexMatches = text.match(indexPattern) || [];
  if (indexMatches.length >= 2) return true;
  // 7. Contains common non-content markers
  const nonContentMarkers = [
    "table of contents",
    "list of tables",
    "list of figures",
    "bibliography",
    "references cited",
    "acknowledgements",
    "copyright",
    "isbn",
    "all rights reserved",
  ];
  const lowerText = text.toLowerCase();
  const markerCount = nonContentMarkers.filter(m => lowerText.includes(m)).length;
  if (markerCount >= 2) return true;

  return false;
}

//  CHUNKING
/**
 * Split text into meaningful, sentence-based chunks.
 *
 * Strategy:
 * 1. Split entire text into sentences
 * 2. Group sentences into chunks of 3–5 sentences
 * 3. Respect character boundaries (100–600 chars)
 * 4. Filter out noisy/non-content chunks
 *
 * @param {string} text - cleaned text content
 * @returns {string[]} array of clean, readable text chunks
 */
function chunkText(text) {
  if (!text || text.trim().length === 0) return [];
  // Step 1: Get all sentences
  const sentences = splitIntoSentences(text);
  if (sentences.length === 0) return [];
  // Step 2: Group sentences into chunks (3–5 sentences, 100–600 chars)
  const rawChunks = [];
  let currentGroup = [];
  let currentLength = 0;
  for (const sentence of sentences) {
    const sentenceLen = sentence.length;
    // If adding this sentence would exceed MAX_CHUNK_LENGTH and we have
    // enough sentences already, flush the current group
    if (currentGroup.length >= MIN_SENTENCES &&
        (currentLength + sentenceLen > MAX_CHUNK_LENGTH || currentGroup.length >= MAX_SENTENCES)) {
      rawChunks.push(currentGroup.join(" "));
      currentGroup = [];
      currentLength = 0;
    }
    currentGroup.push(sentence);
    currentLength += sentenceLen + 1; // +1 for the joining space
  }
  // Flush remaining sentences
  if (currentGroup.length > 0) {
    const remaining = currentGroup.join(" ");
    // If the leftover is too small, merge with the previous chunk
    if (rawChunks.length > 0 && remaining.length < MIN_CHUNK_LENGTH) {
      rawChunks[rawChunks.length - 1] += " " + remaining;
    } else {
      rawChunks.push(remaining);
    }
  }
  // Step 3: Filter out noisy chunks
  const cleanChunks = rawChunks.filter(chunk => !isNoisyChunk(chunk));
  return cleanChunks;
}

//  PIPELINE — Process all extracted files
function processAll() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║   Step 3: Text Chunking (Improved)       ║");
  console.log("╚══════════════════════════════════════════╝\n");
  ensureDir(PATHS.PROCESSED);
  if (!fs.existsSync(PATHS.EXTRACTED)) {
    console.error(`❌ Extracted directory not found: ${PATHS.EXTRACTED}`);
    console.error("   Run preprocessing first: npm run preprocess");
    process.exit(1);
  }
  const files = fs.readdirSync(PATHS.EXTRACTED);
  const cleanFiles = files.filter((f) => f.endsWith("_clean.txt"));
  if (cleanFiles.length === 0) {
    console.error("❌ No cleaned text files found.");
    console.error("   Run preprocessing first: npm run preprocess");
    process.exit(1);
  }
  console.log(`📄 Found ${cleanFiles.length} cleaned file(s)\n`);
  const allChunks = [];
  const chunkSizes = [];
  let totalRaw = 0;
  let totalFiltered = 0;
  cleanFiles.forEach((file, fileIndex) => {
    const filePath = path.join(PATHS.EXTRACTED, file);
    const text = fs.readFileSync(filePath, "utf-8");
    const baseName = file.replace("_clean.txt", "");
    // Get raw sentence count for stats
    const rawSentences = splitIntoSentences(text);
    totalRaw += rawSentences.length;
    const chunks = chunkText(text);
    const rawChunkCount = text.split(/\n\n+/).filter(p => p.trim().length > 0).length;
    totalFiltered += (rawChunkCount - chunks.length);
    chunks.forEach((chunk, chunkIndex) => {
      allChunks.push({
        id: `${baseName}_chunk_${chunkIndex}`,
        text: chunk,
        source: baseName,
      });
      chunkSizes.push(chunk.length);
    });
    console.log(`  [${fileIndex + 1}/${cleanFiles.length}] ${file} → ${chunks.length} chunks`);
  });
  fs.writeFileSync(
    PATHS.CHUNKS_FILE,
    JSON.stringify(allChunks, null, 2),
    "utf-8"
  );
  const avgSize = chunkSizes.length > 0
    ? Math.round(chunkSizes.reduce((a, b) => a + b, 0) / chunkSizes.length)
    : 0;
  const minSize = chunkSizes.length > 0 ? Math.min(...chunkSizes) : 0;
  const maxSize = chunkSizes.length > 0 ? Math.max(...chunkSizes) : 0;
  console.log("\n────────────────────────────────────────────");
  console.log(`✅ Chunking complete`);
  console.log(`   Total chunks: ${allChunks.length}`);
  console.log(`   Chunk sizes:  min=${minSize} | avg=${avgSize} | max=${maxSize} chars`);
  console.log(`   Noise filter: removed noisy/non-content chunks`);
  console.log(`   Output: ${PATHS.CHUNKS_FILE}`);
  console.log("────────────────────────────────────────────\n");
}

module.exports = { chunkText, splitIntoSentences, isNoisyChunk };

if (require.main === module) {
  processAll();
}