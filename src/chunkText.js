const fs = require("fs");
const path = require("path");

function chunkText(text) {
  const paragraphs = text.split(". ");
  return paragraphs
    .map(p => p.trim())
    .filter(p => p.length > 150);
}

function processAll() {
  const extractedPath = path.join("data", "extracted");
  const files = fs.readdirSync(extractedPath);
  const cleanFiles = files.filter(f => f.endsWith("_clean.txt"));
  let allChunks = [];
  let chunkCount = 0;
  console.log(`Found ${cleanFiles.length} cleaned files\n`);
  cleanFiles.forEach(file => {
    const filePath = path.join(extractedPath, file);
    const text = fs.readFileSync(filePath, "utf-8");
    const baseName = file.replace("_clean.txt", "");
    const chunks = chunkText(text);
    chunks.forEach((chunk, index) => {
      allChunks.push({
        id: `${baseName}_chunk_${index}`,
        text: chunk,
        source: baseName
      });
      chunkCount++;
    });
    console.log(`Processed ${file} → ${chunks.length} chunks`);
  });
  fs.writeFileSync(
    path.join("data", "processed", "chunks.json"),
    JSON.stringify(allChunks, null, 2)
  );
  console.log(`\n✅ Total chunks created: ${chunkCount}`);
}

processAll();