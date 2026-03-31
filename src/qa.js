const fs = require("fs");
const path = require("path");
const natural = require("natural");
const readline = require("readline");

const chunks = JSON.parse(
  fs.readFileSync(path.join("data", "processed", "chunks.json"), "utf-8")
);

const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

chunks.forEach(chunk => {
  tfidf.addDocument(chunk.text);
});

function cleanText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getAnswer(query) {
  const cleanedQuery = cleanText(query);
  let results = [];
  tfidf.tfidfs(cleanedQuery, (i, score) => {
    results.push({
      index: i,
      score: score,
      text: chunks[i].text,
      source: chunks[i].source
    });
  });
  results.sort((a, b) => b.score - a.score);
  const top = results[0];
  if (!top || top.score < 0.05) {
    return {
      answer: "Information not available in provided documents",
      source: null
    };
  }
  return {
    answer: top.text,
    source: top.source,
    score: top.score
  };
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion() {
  rl.question("\n💬 Enter your question: ", (query) => {
    const result = getAnswer(query);
    console.log("\n📌 Answer:\n");
    console.log(result.answer);
    if (result.source) {
      console.log(`\n📚 Source: ${result.source}`);
      console.log(`🔢 Score: ${result.score.toFixed(4)}`);
    }
    askQuestion(); // loop
  });
}

console.log("✅ Dietary QA System Ready");
askQuestion();