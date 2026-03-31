# Developing a Small LLM for Dietary Recommendations

A document-grounded dietary question answering system using classical NLP techniques (TF-IDF retrieval). The system processes diet-related PDF books and answers user questions by retrieving the most relevant passages.

## Architecture

```
PDF Documents (data/raw/)
        │
        ▼
┌─────────────────┐
│  Text Extraction│  extractText.js — pdf-parse
└────────┬────────┘
         ▼
┌─────────────────┐
│  Preprocessing  │  preprocess.js — lowercase, normalize
└────────┬────────┘
         ▼
┌─────────────────┐
│  Chunking       │  chunkText.js — paragraph-level splitting
└────────┬────────┘
         ▼
┌─────────────────┐
│  TF-IDF Index   │  tfidf.js — natural library
└────────┬────────┘
         ▼
┌─────────────────┐
│  Query → Answer │  qa.js — cosine similarity matching
└─────────────────┘
```

## Tech Stack

- **Runtime**: Node.js
- **NLP**: TF-IDF vectorization via [natural]
- **PDF Parsing**: [pdf-parse]
- **Storage**: JSON-based document chunks

## Setup

```bash
# Install dependencies
npm install

# Place PDF diet books in:
data/raw/
```

## Usage

### Run the Full Pipeline

```bash
# Extract → Preprocess → Chunk (all three steps)
npm run pipeline
```

### Run Individual Steps

```bash
npm run extract
npm run preprocess
npm run chunk
npm run index
```

### Interactive QA

```bash
npm run qa
```
Type your dietary question and get answers with source tracing. Type `debug` to see top-3 results, or `exit` to quit.

### Evaluation

```bash
npm run evaluate
# or
npm test
```
Runs 15 test questions and reports accuracy, scores, and saves results to `test/evaluation_results.json`.

## Project Structure

```
diet-LLM-mini-project/
├── data/
│   ├── raw/              # Input PDF files
│   ├── extracted/         # Extracted and cleaned text
│   └── processed/         # chunks.json (TF-IDF ready)
├── src/
│   ├── utils.js           # Shared utilities
│   ├── extractText.js     # Step 1: PDF extraction
│   ├── preprocess.js      # Step 2: Text cleaning
│   ├── chunkText.js       # Step 3: Text chunking
│   ├── tfidf.js           # Step 4: TF-IDF index
│   ├── qa.js              # Interactive QA system
│   └── evaluate.js        # Accuracy evaluation
├── test/
│   ├── questions.json     # Test questions with expected keywords
│   └── evaluation_results.json  # Auto-generated results
└── README.md
```

## How It Works

1. **PDF Extraction**: Reads PDF files using `pdf-parse` and saves raw text
2. **Preprocessing**: Lowercases text, removes noise while preserving dietary terms (e.g., `omega-3`, `vitamin-rich`)
3. **Chunking**: Splits text into ~500 character paragraph-level chunks suitable for retrieval
4. **TF-IDF Indexing**: Builds a term frequency–inverse document frequency index across all chunks
5. **Query Processing**: User queries are cleaned and matched against the index
6. **Answer Retrieval**: Returns the highest-scoring chunk if it exceeds the similarity threshold; otherwise returns "information not available"
7. **Traceability**: Each answer includes the source document name and chunk ID