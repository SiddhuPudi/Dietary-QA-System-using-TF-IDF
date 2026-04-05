const readline = require("readline");
const { SIMILARITY_THRESHOLD, formatScore } = require("./utils");
const { search } = require("./tfidf");

let debugMode = false;

// ─── Answer-formatting constants ────────────────────────────────
const MAX_ANSWER_SENTENCES = 3;  // Pick top 2–3 relevant sentences
const MIN_SENTENCE_WORDS   = 8;  // Skip sentences shorter than 8 words
const MAX_DIGIT_RATIO_SENT = 0.2; // Skip sentences where >20% chars are digits

//  ANSWER QUALITY HELPERS
/**
 * Compute a readability score for a chunk of text.
 * Higher score = more likely to be a clean, readable answer.
 *
 * Factors:
 * - Has proper sentence endings (., !, ?)
 * - Reasonable sentence count
 * - Low digit ratio (not a number list)
 * - Low comma density (not an index)
 * - Good average word length
 *
 * @param {string} text
 * @returns {number} readability score (0 to 1)
 */
function readabilityScore(text) {
  if (!text || text.length === 0) return 0;
  let score = 0;
  const len = text.length;
  // 1. Sentence count (prefer 2–5 sentences)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
  if (sentences.length >= 2 && sentences.length <= 5) {
    score += 0.3;
  } else if (sentences.length === 1) {
    score += 0.15;
  }
  // 2. Low digit ratio (prose, not numbers)
  const digitCount = (text.match(/\d/g) || []).length;
  const digitRatio = digitCount / len;
  if (digitRatio < 0.05) score += 0.25;
  else if (digitRatio < 0.10) score += 0.15;
  // 3. Low comma density (not an index/list)
  const commaCount = (text.match(/,/g) || []).length;
  if (commaCount <= 5) score += 0.15;
  else if (commaCount <= 8) score += 0.05;
  // 4. Ends with proper punctuation
  if (/[.!?]$/.test(text.trim())) {
    score += 0.15;
  }
  // 5. Good average word length (real words, not abbreviations)
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length > 0) {
    const avgWordLen = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    if (avgWordLen >= 3.5 && avgWordLen <= 8) {
      score += 0.15;
    }
  }

  return Math.min(score, 1.0);
}

//  SENTENCE-LEVEL HELPERS
/**
 * Extract meaningful keywords from a string.
 * Removes common English stop-words so only content words remain.
 * @param {string} str
 * @returns {Set<string>}
 */
const STOP_WORDS = new Set([
  "a","an","the","is","are","was","were","be","been","being",
  "have","has","had","do","does","did","will","would","shall",
  "should","may","might","must","can","could","of","in","to",
  "for","with","on","at","from","by","about","as","into","through",
  "during","before","after","above","below","between","and","but",
  "or","nor","not","so","yet","both","either","neither","each",
  "every","all","any","few","more","most","other","some","such",
  "no","only","own","same","than","too","very","just","because",
  "if","when","where","how","what","which","who","whom","this",
  "that","these","those","i","me","my","we","our","you","your",
  "he","him","his","she","her","it","its","they","them","their",
]);

function extractKeywords(str) {
  const words = str.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/);
  return new Set(words.filter(w => w.length > 2 && !STOP_WORDS.has(w)));
}

/**
 * Compute keyword-overlap score between a sentence and the query.
 * Returns a value between 0 and 1.
 * @param {Set<string>} queryKW  - keywords from the user query
 * @param {string} sentence
 * @returns {number}
 */
function sentenceRelevance(queryKW, sentence) {
  if (queryKW.size === 0) return 0;
  const sentKW = extractKeywords(sentence);
  let overlap = 0;
  for (const w of queryKW) {
    if (sentKW.has(w)) overlap++;
  }
  return overlap / queryKW.size; // 0–1
}

/**
 * Determine whether a sentence is "noisy" and should be skipped.
 *  - Too short (< MIN_SENTENCE_WORDS real words)
 *  - Too many digits (reference-like)
 *  - Looks like a citation / page reference
 * @param {string} sentence
 * @returns {boolean} true → skip this sentence
 */
function isNoisySentence(sentence) {
  const words = sentence.split(/\s+/).filter(w => w.length > 0);
  if (words.length < MIN_SENTENCE_WORDS) return true;
  // High digit ratio → page numbers, table data
  const digits = (sentence.match(/\d/g) || []).length;
  if (sentence.length > 0 && digits / sentence.length > MAX_DIGIT_RATIO_SENT) return true;
  // Reference / citation patterns  (e.g. "(2019)", "pp. 34", "vol. 12")
  if (/\b(pp|vol|fig|table|page|ibid|et al)\b/i.test(sentence)) return true;
  // Mostly commas → likely a list fragment
  const commas = (sentence.match(/,/g) || []).length;
  if (commas > 5) return true;
  return false;
}

/**
 * Select the most query-relevant sentences from the chunk text.
 *
 * Steps:
 *  1. Split chunk into individual sentences
 *  2. Filter out noisy / reference sentences
 *  3. Score each sentence by keyword overlap with the query
 *  4. Pick top 2–3 sentences by score
 *  5. Re-order them in their original appearance order
 *  6. Join with proper punctuation
 *
 * @param {string} text  - raw retrieved chunk text
 * @param {string} query - the user's original query
 * @returns {string} concise, relevant answer
 */
function formatAnswer(text, query) {
  if (!text) return "";
  // Clean up excessive whitespace
  const cleaned = text.replace(/\s+/g, " ").trim();
  // Split into sentences
  const allSentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
  if (allSentences.length === 0) return cleaned;
  // If only 1–2 sentences total, just return them (nothing to select from)
  if (allSentences.length <= 2) {
    return ensureEnding(allSentences.join(" "));
  }
  // Extract query keywords
  const queryKW = extractKeywords(query || "");
  // Score each sentence: { index, sentence, relevance }
  const scored = allSentences.map((s, i) => ({
    index: i,
    sentence: s,
    relevance: sentenceRelevance(queryKW, s),
    noisy: isNoisySentence(s),
  }));
  // Keep only clean (non-noisy) sentences
  const candidates = scored.filter(s => !s.noisy);
  // If all were filtered out, fall back to first 2 original sentences
  if (candidates.length === 0) {
    return ensureEnding(allSentences.slice(0, 2).join(" "));
  }
  // Sort by relevance (descending), pick top MAX_ANSWER_SENTENCES
  const topByRelevance = [...candidates]
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, MAX_ANSWER_SENTENCES);
  // Re-sort by original index to preserve reading order
  topByRelevance.sort((a, b) => a.index - b.index);
  const answer = topByRelevance.map(s => s.sentence).join(" ");
  return ensureEnding(answer);
}

/**
 * Make sure the answer ends with proper punctuation.
 * @param {string} text
 * @returns {string}
 */
function ensureEnding(text) {
  let answer = text.trim();
  if (!answer) return "";
  if (/[.!?]$/.test(answer)) return answer;

  // Cut at last sentence boundary
  const lastPunct = Math.max(
    answer.lastIndexOf("."),
    answer.lastIndexOf("!"),
    answer.lastIndexOf("?")
  );
  if (lastPunct > answer.length * 0.3) {
    return answer.substring(0, lastPunct + 1);
  }
  return answer + ".";
}

//  MAIN QA FUNCTION
/**
 * Get the best answer for a user query.
 *
 * Improvement: retrieves top 3 results from TF-IDF, then re-ranks
 * using a combined score of TF-IDF relevance + readability.
 * This ensures the returned answer is both relevant AND readable.
 *
 * @param {string} query
 * @returns {{answer: string, source: string|null, score: number|null, id: string|null, topResults: Array}}
 */
function getAnswer(query) {
  // Retrieve top 3 candidates from TF-IDF index
  const topResults = search(query, 5);
  if (topResults.length === 0) {
    return {
      answer: "Could not process the query. Please try rephrasing.",
      source: null,
      score: null,
      id: null,
      topResults: [],
    };
  }
  // Check if best TF-IDF result is above threshold
  const maxScore = topResults[0].score;
  if (maxScore < SIMILARITY_THRESHOLD) {
    return {
      answer: "Information not available in the provided documents. Try rephrasing your question or using different keywords.",
      source: null,
      score: maxScore,
      id: null,
      topResults: topResults,
    };
  }
  // ── Re-rank: combine TF-IDF score with readability ──
  // Normalize TF-IDF scores relative to the top score
  const rankedCandidates = topResults
    .filter(r => r.score >= SIMILARITY_THRESHOLD) // only above-threshold
    .map(r => {
      const tfidfNorm = maxScore > 0 ? r.score / maxScore : 0;  // 0–1
      const readability = readabilityScore(r.text);               // 0–1
      // Combined: 60% relevance + 40% readability
      const combined = (0.6 * tfidfNorm) + (0.4 * readability);
      return { ...r, readability, combined };
    })
    .sort((a, b) => b.combined - a.combined);
  // Pick the best candidate after re-ranking
  const best = rankedCandidates[0] || topResults[0];

  return {
    answer: formatAnswer(best.text, query),
    source: best.source,
    score: best.score,
    id: best.id,
    topResults: topResults,
  };
}

//  CLI INTERFACE

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
function printBanner() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║   🥗 Dietary QA System — Ready!          ║");
  console.log("╠══════════════════════════════════════════╣");
  console.log("║   Commands:                              ║");
  console.log("║     Type a question to get an answer     ║");
  console.log("║     'debug'  → toggle debug mode         ║");
  console.log("║     'exit'   → quit the system           ║");
  console.log("╚══════════════════════════════════════════╝\n");
}
function askQuestion() {
  rl.question("💬 Your question: ", (query) => {
    const trimmed = query.trim();
    if (!trimmed) {
      askQuestion();
      return;
    }
    if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
      console.log("\n👋 Goodbye!\n");
      rl.close();
      return;
    }
    if (trimmed.toLowerCase() === "debug") {
      debugMode = !debugMode;
      console.log(`\n🔧 Debug mode: ${debugMode ? "ON" : "OFF"}\n`);
      askQuestion();
      return;
    }
    const result = getAnswer(trimmed);
    console.log("\n┌─── Answer ────────────────────────────────");
    console.log(`│`);
    const lines = result.answer.split("\n");
    lines.forEach((line) => console.log(`│  ${line}`));
    console.log(`│`);
    if (result.source) {
      console.log(`│  📚 Source: ${result.source}`);
      console.log(`│  🆔 Chunk: ${result.id}`);
      console.log(`│  🔢 Score: ${formatScore(result.score)}`);
    }
    console.log("└───────────────────────────────────────────\n");
    if (debugMode && result.topResults.length > 0) {
      console.log("  🔍 Debug — Top candidates (re-ranked):");
      result.topResults.forEach((r, i) => {
        const rdScore = readabilityScore(r.text).toFixed(2);
        console.log(`\n  [${i + 1}] TF-IDF: ${formatScore(r.score)} | Readability: ${rdScore} | Source: ${r.source}`);
        console.log(`      ${r.text.substring(0, 120)}...`);
      });
      console.log("");
    }
    askQuestion();
  });
}

printBanner();
askQuestion();

module.exports = { getAnswer };