const express = require("express");
const bodyParser = require("body-parser");
const { getAnswer } = require("./qa"); // export this from qa.js

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

// API endpoint
app.post("/ask", (req, res) => {
  try {
    const query = req.body.question;
    if (!query) {
      return res.json({ error: "No question provided" });
    }
    const result = getAnswer(query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});