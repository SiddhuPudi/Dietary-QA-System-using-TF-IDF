const {
  loadChunks,
  buildTfIdfIndex,
  searchIndex,
  formatScore,
} = require("./utils");

const chunks = loadChunks();
const tfidf = buildTfIdfIndex(chunks);
console.log(`✅ TF-IDF index built: ${chunks.length} chunks indexed`);

/**
 * Search the index for a query.
 * @param {string} query - natural language query
 * @param {number} [topN=3] - number of results to return
 * @returns {Array<{index, score, text, source, id}>}
 */
function search(query, topN = 3) {
  return searchIndex(tfidf, chunks, query, topN);
}

module.exports = { tfidf, chunks, search };

if (require.main === module) {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║   Step 4: TF-IDF Index & Test Queries    ║");
  console.log("╚══════════════════════════════════════════╝\n");

  const testQueries = [
    "protein diet benefits",
    "fiber rich foods",
    "balanced diet",
    "vitamin deficiency",
    "weight loss tips",
  ];

  testQueries.forEach((query) => {
    console.log(`🔍 Query: "${query}"\n`);
    const results = search(query, 3);
    if (results.length === 0) {
      console.log("   No results found.\n");
      return;
    }
    results.forEach((res, i) => {
      console.log(`   Result ${i + 1} (Score: ${formatScore(res.score)}) [${res.source}]`);
      console.log(`   ${res.text.substring(0, 150)}...\n`);
    });
    console.log("────────────────────────────────────────────\n");
  });
}