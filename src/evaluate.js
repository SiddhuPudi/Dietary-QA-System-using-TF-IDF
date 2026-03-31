const fs = require("fs");
const path = require("path");
const {
  PATHS,
  SIMILARITY_THRESHOLD,
  formatScore,
  ensureDir,
} = require("./utils");
const { search } = require("./tfidf");

if (!fs.existsSync(PATHS.QUESTIONS_FILE)) {
  console.error(`❌ Test questions file not found: ${PATHS.QUESTIONS_FILE}`);
  process.exit(1);
}
const questions = JSON.parse(
  fs.readFileSync(PATHS.QUESTIONS_FILE, "utf-8")
);
if (!Array.isArray(questions) || questions.length === 0) {
  console.error("❌ Questions file is empty or invalid.");
  process.exit(1);
}

console.log("\n╔══════════════════════════════════════════╗");
console.log("║   📊 Evaluation Results                  ║");
console.log("╚══════════════════════════════════════════╝\n");

const startTime = Date.now();
let correct = 0;
const scores = [];
const detailedResults = [];

questions.forEach((q, index) => {
  const topResults = search(q.question, 3);
  const top = topResults[0];

  const hasAnswer = top && top.score >= SIMILARITY_THRESHOLD;
  const answerText = hasAnswer ? top.text.toLowerCase() : "";
  const isCorrect = hasAnswer && answerText.includes(q.expected_keyword.toLowerCase());
  if (isCorrect) correct++;
  if (top) scores.push(top.score);

  const status = isCorrect ? "✅" : "❌";
  console.log(`  ${status} Q${index + 1}: ${q.question}`);
  console.log(`     Expected keyword: "${q.expected_keyword}"`);

  if (top) {
    console.log(`     Score: ${formatScore(top.score)} | Source: ${top.source}`);
    if (!hasAnswer) {
      console.log(`     ⚠️  Below threshold (${SIMILARITY_THRESHOLD})`);
    } else if (!isCorrect) {
      console.log(`     ⚠️  Keyword not found in answer`);
    }
  } else {
    console.log(`     ⚠️  No results returned`);
  }
  console.log("");

  detailedResults.push({
    question: q.question,
    expected_keyword: q.expected_keyword,
    is_correct: isCorrect,
    score: top ? top.score : 0,
    source: top ? top.source : null,
    chunk_id: top ? top.id : null,
    answer_preview: top ? top.text.substring(0, 200) : null,
    below_threshold: top ? top.score < SIMILARITY_THRESHOLD : true,
  });
});

const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
const accuracy = (correct / questions.length) * 100;
const avgScore = scores.length > 0
  ? scores.reduce((a, b) => a + b, 0) / scores.length
  : 0;
const minScore = scores.length > 0 ? Math.min(...scores) : 0;
const maxScore = scores.length > 0 ? Math.max(...scores) : 0;

console.log("╔══════════════════════════════════════════╗");
console.log("║   Summary                               ║");
console.log("╠══════════════════════════════════════════╣");
console.log(`║   Questions:  ${questions.length.toString().padEnd(27)}║`);
console.log(`║   Correct:    ${correct.toString().padEnd(27)}║`);
console.log(`║   Accuracy:   ${accuracy.toFixed(2).padEnd(26)}%║`);
console.log(`║   Avg Score:  ${formatScore(avgScore).padEnd(27)}║`);
console.log(`║   Min Score:  ${formatScore(minScore).padEnd(27)}║`);
console.log(`║   Max Score:  ${formatScore(maxScore).padEnd(27)}║`);
console.log(`║   Time:       ${(elapsed + "s").padEnd(27)}║`);
console.log("╚══════════════════════════════════════════╝\n");

ensureDir("test");

const resultsOutput = {
  timestamp: new Date().toISOString(),
  total_questions: questions.length,
  correct: correct,
  accuracy_percent: parseFloat(accuracy.toFixed(2)),
  avg_score: parseFloat(avgScore.toFixed(4)),
  min_score: parseFloat(minScore.toFixed(4)),
  max_score: parseFloat(maxScore.toFixed(4)),
  threshold: SIMILARITY_THRESHOLD,
  elapsed_seconds: parseFloat(elapsed),
  results: detailedResults,
};

fs.writeFileSync(
  PATHS.RESULTS_FILE,
  JSON.stringify(resultsOutput, null, 2),
  "utf-8"
);

console.log(`📝 Detailed results saved to: ${PATHS.RESULTS_FILE}\n`);