const fs = require("fs");
const path = require("path");
const natural = require("natural");

const PATHS = {
  RAW: path.join("data", "raw"),
  EXTRACTED: path.join("data", "extracted"),
  PROCESSED: path.join("data", "processed"),
  CHUNKS_FILE: path.join("data", "processed", "chunks.json"),
  QUESTIONS_FILE: path.join("test", "questions.json"),
  RESULTS_FILE: path.join("test", "evaluation_results.json"),
};

const SIMILARITY_THRESHOLD = 1.0;

/**
 * Clean and normalize text while preserving meaningful content.
 *
 * @param {string} text - raw text to clean
 * @returns {string} cleaned, lowercased text
 */
function cleanText(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s.,;:'\-()]/g, " ")  // keep useful punctuation
    .replace(/\s+/g, " ")                     // collapse whitespace
    .trim();
}

/**
 * Ensure a directory exists, creating it (and parents) if necessary.
 * @param {string} dirPath
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

/**
 * Load chunks.json safely with validation.
 * @returns {Array<{id: string, text: string, source: string}>}
 */
function loadChunks() {
  if (!fs.existsSync(PATHS.CHUNKS_FILE)) {
    console.error(`❌ Chunks file not found: ${PATHS.CHUNKS_FILE}`);
    console.error("   Run the pipeline first: npm run pipeline");
    process.exit(1);
  }
  const raw = fs.readFileSync(PATHS.CHUNKS_FILE, "utf-8");
  const chunks = JSON.parse(raw);
  if (!Array.isArray(chunks) || chunks.length === 0) {
    console.error("❌ Chunks file is empty or invalid.");
    console.error("   Re-run chunking: npm run chunk");
    process.exit(1);
  }
  return chunks;
}

/**
 * Build a TF-IDF index from chunks.
 * @param {Array<{text: string}>} chunks
 * @returns {natural.TfIdf}
 */
function buildTfIdfIndex(chunks) {
  const TfIdf = natural.TfIdf;
  const tfidf = new TfIdf();
  chunks.forEach((chunk) => {
    tfidf.addDocument(chunk.text);
  });
  return tfidf;
}

/**
 * Search the TF-IDF index and return ranked results.
 *
 * @param {natural.TfIdf} tfidf - built TF-IDF index
 * @param {Array} chunks - original chunk objects
 * @param {string} query - user query
 * @param {number} [topN=3] - number of top results to return
 * @returns {Array<{index: number, score: number, text: string, source: string, id: string}>}
 */
function searchIndex(tfidf, chunks, query, topN = 3) {
  const cleanedQuery = cleanText(query);
  if (!cleanedQuery) return [];
  const results = [];
  tfidf.tfidfs(cleanedQuery, (i, score) => {
    results.push({
      index: i,
      score: score,
      text: chunks[i].text,
      source: chunks[i].source,
      id: chunks[i].id,
    });
  });
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topN);
}

/**
 * Format a TF-IDF score for display.
 * @param {number} score
 * @returns {string}
 */
function formatScore(score) {
  return score.toFixed(4);
}

module.exports = {
  PATHS,
  SIMILARITY_THRESHOLD,
  cleanText,
  ensureDir,
  loadChunks,
  buildTfIdfIndex,
  searchIndex,
  formatScore,
};