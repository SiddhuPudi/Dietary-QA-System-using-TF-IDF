const readline = require("readline");
const { SIMILARITY_THRESHOLD, formatScore } = require("./utils");
const { search } = require("./tfidf");

let debugMode = false;

/**
 * Get the best answer for a user query.
 * @param {string} query
 * @returns {{answer: string, source: string|null, score: number|null, id: string|null, topResults: Array}}
 */
function getAnswer(query) {
  const topResults = search(query, 3);
  if (topResults.length === 0) {
    return {
      answer: "⚠️  Could not process the query. Please try rephrasing.",
      source: null,
      score: null,
      id: null,
      topResults: [],
    };
  }
  const top = topResults[0];
  if (top.score < SIMILARITY_THRESHOLD) {
    return {
      answer: "ℹ️  Information not available in the provided documents.\n   Try rephrasing your question or using different keywords.",
      source: null,
      score: top.score,
      id: null,
      topResults: topResults,
    };
  }
  return {
    answer: top.text,
    source: top.source,
    score: top.score,
    id: top.id,
    topResults: topResults,
  };
}

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
      console.log("  🔍 Debug — Top 3 results:");
      result.topResults.forEach((r, i) => {
        console.log(`\n  [${i + 1}] Score: ${formatScore(r.score)} | Source: ${r.source} | ID: ${r.id}`);
        console.log(`      ${r.text.substring(0, 120)}...`);
      });
      console.log("");
    }
    askQuestion();
  });
}

printBanner();
askQuestion();