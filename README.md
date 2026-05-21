# Document Grounded Dietary QA System using TF-IDF

A document-grounded dietary question answering system using classical NLP techniques (TF-IDF retrieval).
The system processes diet-related PDF books and answers user questions by retrieving the most relevant passages.

> ⚠️ Note: This is NOT a neural LLM. It is a small, explainable, retrieval-based system designed for academic purposes.

---

## 📌 Project Objective

To design and implement a **small-scale, explainable NLP system** that:
- Answers dietary questions using **only provided documents**
- Avoids hallucination by **strict document grounding**
- Uses **classical techniques (TF-IDF)** instead of deep learning

---

## 🧠 Architecture

```
PDF Documents (data/raw/)
        │
        ▼
┌─────────────────┐
│ Text Extraction │  extractText.js — pdf-parse
└────────┬────────┘
         ▼
┌─────────────────┐
│  Preprocessing  │  preprocess.js — lowercase, normalize
└────────┬────────┘
         ▼
┌─────────────────┐
│    Chunking     │  chunkText.js — paragraph-level splitting
└────────┬────────┘
         ▼
┌─────────────────┐
│   TF-IDF Index  │  tfidf.js — natural library
└────────┬────────┘
         ▼
┌─────────────────┐
│  Query → Answer │  qa.js — cosine similarity matching
└─────────────────┘
```

---

## ⚙️ Tech Stack

- **Runtime**: Node.js  
- **NLP Technique**: TF-IDF (Term Frequency–Inverse Document Frequency)  
- **Library**: `natural`  
- **PDF Parsing**: `pdf-parse` (v1.1.1 for stability)  
- **Storage**: JSON-based document chunks

---

## 🗄️ Dataset

- ~45 diet and nutrition-related books (PDF format)
```
The books can be accessed at: https://drive.google.com/drive/folders/1oO7vnhs-HDNpeb8qGnN9nX8kxY6HoCBA?usp=drive_link
```
- Store in: `data/raw/` 
- System operates strictly on this dataset (no external knowledge)

---

## 🚀 Setup

```bash
# Install dependencies
npm install

# Place PDF diet books in data/raw/:
data/raw/
```

## ▶️ Usage

### Run the Full Pipeline

```bash
# Extract → Preprocess → Chunk
npm run pipeline
```

### Run Individual Steps

```bash
npm run extract
npm run preprocess
npm run chunk
npm run index
```

### Interactive Question Answering

```bash
npm run qa
```
Features:
- Enter dietary questions
- Returns best matching answer
- Displays source document and score
- Type debug to see top-3 results
- Type exit to quit

### Evaluation

```bash
npm run evaluate
# or
npm test
```
Runs 15 test questions and reports accuracy, scores, and saves results to `test/evaluation_results.json`.

---

## 📂 Project Structure

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

---

## ⚙️ How the System Works

1. **Text Extraction**
   - Reads PDF documents using `pdf-parse`
   - Converts them into raw text

2. **Preprocessing**
   - Converts text to lowercase
   - Removes unwanted characters
   - Normalizes whitespace

3. **Chunking**
   - Splits text into paragraph-level chunks
   - Each chunk has:
     - Unique ID
     - Source reference

4. **TF-IDF Indexing**
   - Converts text into numerical representation
   - Captures importance of words across documents

5. **Query Processing**
   - User query is cleaned using same preprocessing
   - Converted into comparable form

6. **Similarity Matching**
   - Cosine similarity used to compare query with chunks
   - Top-scoring chunk selected

7. **Answer Retrieval**
   - If similarity ≥ threshold → return answer
   - Else → "Information not available in provided documents"

8. **Traceability**
   - Each answer includes:
     - Source document
     - Confidence score

---

## 📊 Evaluation Methodology

- **Test set**: 15 manually created dietary questions
- **Ground truth**: Derived from the same documents
- **Metrics**:
  - Accuracy: Percentage of correctly retrieved answers
  - Precision: Relevance of retrieved answers (manually evaluated)
  - Coverage: Percentage of questions answerable from the dataset

---

## ⚠️ Limitations

- Cannot answer questions outside the provided documents
- No semantic understanding beyond keyword matching
- Performance depends on document quality and chunking
- TF-IDF does not capture deep semantic meaning, which may affect performance for complex queries

---

## ✅ Key Features

- Fully explainable pipeline
- No hallucination (document-grounded)
- Scalable to 100+ documents (Provided ~45 documents currently)
- Lightweight and efficient
- Guarantees that all answers are derived strictly from the provided documents

---

## 📌 Conclusion

This project demonstrates how a small, explainable NLP system can perform question answering using classical techniques without relying on large-scale neural models.

--- 

## 🧑🏻‍💻 Team Members

- **B. Sai Gokul**
- **B. Gunavardhan Royal**
- **C. Panay**
- **C. Manoj Kumar Yadav**
