const fs = require("fs");
const path = require("path");
const natural = require("natural");
const chunks = JSON.parse(
  fs.readFileSync(path.join("data", "processed", "chunks.json"), "utf-8")
);
const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();
chunks.forEach(chunk => {
  tfidf.addDocument(chunk.text);
});
console.log(`✅ TF-IDF index created with ${chunks.length} chunks`);

function testQuery(query) {
  console.log(`\n🔍 Query: "${query}"\n`);
  let results = [];
  tfidf.tfidfs(query, (i, score) => {
    results.push({
      index: i,
      score: score,
      text: chunks[i].text
    });
  });
  results.sort((a, b) => b.score - a.score);
  results.slice(0, 3).forEach((res, i) => {
    console.log(`Result ${i + 1} (Score: ${res.score.toFixed(4)})`);
    console.log(res.text.substring(0, 200), "...\n");
  });
}

testQuery("protein diet benefits");
testQuery("fiber rich foods");
testQuery("balanced diet");
testQuery("vitamin deficiency");