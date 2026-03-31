const fs = require("fs");
const path = require("path");
const natural = require("natural");

const chunks = JSON.parse(
  fs.readFileSync(path.join("data", "processed", "chunks.json"), "utf-8")
);

const questions = JSON.parse(
  fs.readFileSync(path.join("test", "questions.json"), "utf-8")
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
      text: chunks[i].text
    });
  });
  results.sort((a, b) => b.score - a.score);
  return results[0];
}

let correct = 0;
console.log("\n📊 Evaluation Results:\n");

questions.forEach((q, index) => {
  const result = getAnswer(q.question);
  const answerText = result.text.toLowerCase();
  const isCorrect = answerText.includes(q.expected_keyword);
  if (isCorrect) correct++;
  console.log(`Q${index + 1}: ${q.question}`);
  console.log(`✔ Expected keyword: ${q.expected_keyword}`);
  console.log(`📌 Match: ${isCorrect ? "YES" : "NO"}\n`);
});

const accuracy = (correct / questions.length) * 100;

console.log(`\n✅ Accuracy: ${accuracy.toFixed(2)}%`);