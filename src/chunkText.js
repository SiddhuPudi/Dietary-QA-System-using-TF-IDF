const fs = require("fs");
const path = require("path");
const { ensureDir, PATHS } = require("./utils");

const MIN_CHUNK_LENGTH = 50;   // Minimum characters for a valid chunk
const TARGET_CHUNK_SIZE = 500; // Target chunk size in characters
const MAX_CHUNK_SIZE = 1000;   // Maximum chunk size before splitting

/**
 * Split text into meaningful chunks.
 *
 * Strategy:
 * 1. Split by double newlines (paragraph boundaries)
 * 2. If a paragraph is too large, split it into sentence groups
 * 3. If a paragraph is too small, merge it with adjacent content
 * 4. Filter out chunks that are too short to be meaningful
 * @param {string} text - cleaned text content
 * @returns {string[]} array of text chunks
 */

function chunkText(text) {
  if (!text || text.trim().length === 0) return [];

  let rawParagraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (rawParagraphs.length <= 1) {
    rawParagraphs = splitIntoSentenceGroups(text);
  }

  const chunks = [];
  let buffer = "";

  for (const para of rawParagraphs) {
    if (para.length > MAX_CHUNK_SIZE) {
      if (buffer.length >= MIN_CHUNK_LENGTH) {
        chunks.push(buffer.trim());
      }
      buffer = "";
      const subChunks = splitIntoSentenceGroups(para);
      subChunks.forEach((sc) => {
        if (sc.length >= MIN_CHUNK_LENGTH) {
          chunks.push(sc.trim());
        }
      });
    } else if (buffer.length + para.length > TARGET_CHUNK_SIZE) {
      if (buffer.length >= MIN_CHUNK_LENGTH) {
        chunks.push(buffer.trim());
      }
      buffer = para;
    } else {
      buffer = buffer ? buffer + " " + para : para;
    }
  }
  if (buffer.length >= MIN_CHUNK_LENGTH) {
    chunks.push(buffer.trim());
  }
  return chunks;
}

/**
 * Split text into groups of sentences, targeting ~TARGET_CHUNK_SIZE chars each.
 * @param {string} text
 * @returns {string[]}
 */
function splitIntoSentenceGroups(text) {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (sentences.length === 0) return [];
  const groups = [];
  let current = "";
  for (const sentence of sentences) {
    if (current.length + sentence.length > TARGET_CHUNK_SIZE && current.length > 0) {
      groups.push(current.trim());
      current = sentence;
    } else {
      current = current ? current + " " + sentence : sentence;
    }
  }
  if (current.trim().length > 0) {
    groups.push(current.trim());
  }
  return groups;
}

function processAll() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║   Step 3: Text Chunking                  ║");
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

  cleanFiles.forEach((file, fileIndex) => {
    const filePath = path.join(PATHS.EXTRACTED, file);
    const text = fs.readFileSync(filePath, "utf-8");
    const baseName = file.replace("_clean.txt", "");
    const chunks = chunkText(text);

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
  console.log(`   Output: ${PATHS.CHUNKS_FILE}`);
  console.log("────────────────────────────────────────────\n");
}

processAll();