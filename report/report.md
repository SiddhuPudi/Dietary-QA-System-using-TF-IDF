## 1. Title Page

<div align="center">
  <br><br>
  <h2>MINI PROJECT REPORT ON</h2>
  <br>
  <h1>Dietary-QA-System-using-TF-IDF</h1>
  <br><br>
  <p><b>Submitted by:</b></p>
  <p>P. Thrivikram</p>
  <p>S. Abdul Sam</p>
  <p>A. Guru Sai Harshai</p>
  <p>U. Karthikeya</p>
  <br><br>
  <p><b>Under the Guidance of:</b></p>
  <p>Dr. Krishnedu Ghosh</p>
  <br><br>
  <p><b>Academic Year:</b></p>
  <p>2025–2026</p>
</div>

<div style="page-break-after: always;"></div>

# Table of Contents
- [1. Title Page](#1-title-page)
- [2. Abstract](#2-abstract)
- [3. Introduction](#3-introduction)
- [4. Problem Statement](#4-problem-statement)
- [5. Objectives](#5-objectives)
- [6. Literature Survey](#6-literature-survey)
- [7. System Architecture](#7-system-architecture)
- [8. Methodology](#8-methodology)
  - [8.1 Data Collection](#81-data-collection)
  - [8.2 Text Extraction](#82-text-extraction)
  - [8.3 Preprocessing](#83-preprocessing)
  - [8.4 Chunking](#84-chunking)
  - [8.5 TF-IDF Indexing](#85-tf-idf-indexing)
  - [8.6 Query Processing](#86-query-processing)
  - [8.7 Answer Retrieval and Ranking](#87-answer-retrieval-and-ranking)
- [9. Implementation Details](#9-implementation-details)
- [10. Results and Evaluation](#10-results-and-evaluation)
- [11. Challenges Faced](#11-challenges-faced)
- [12. Limitations](#12-limitations)
- [13. Future Work](#13-future-work)
- [14. Conclusion](#14-conclusion)
- [15. References](#15-references)

## 2. Abstract

Providing accurate and personalized dietary guidance generally requires significant manual effort or relies on broad, generic internet searches that lack verifiable sourcing. This project introduces a Document-Grounded Dietary Question Answering (QA) System designed to retrieve precise nutritional and dietary answers exclusively from a curated dataset of over 45 academic dietary books. The system is built upon classical Information Retrieval (IR) algorithms, leveraging Term Frequency-Inverse Document Frequency (TF-IDF) rather than adopting opaque neural architectures. By formulating a rigorous pipeline that involves PDF content extraction, sentence-based chunking, advanced text preprocessing, and readability-aware ranking, the system provides correct, explainable, and source-mapped answers. The approach significantly mitigates the issue of hallucination prevalent in ungrounded conversational agents. Evaluation results demonstrate improved answer quality, concise responsiveness to user queries, and an ability to effectively filter out document noise, such as indexes and publisher notes. 

## 3. Introduction

Dietary guidance is essential for maintaining health, preventing nutrition-related diseases, and ensuring well-being. Individuals often seek specific dietary information to address medical conditions, lifestyle choices, or general nutritional awareness. However, generic search engines and traditional rule-based systems face significant limitations when addressing these needs. Generic systems often retrieve conflicting, unverified, or overly generalized information that is disconnected from authoritative source material. 

There is a pressing need for document-grounded question-answering systems capable of anchoring their responses strictly to trusted domain literature. By analyzing and extracting information purely from vetted dietary books, users are guaranteed a verifiable tracing of their nutritional inquiries. The proposed system employs an explainable Information Retrieval pipeline using classical NLP techniques. This ensures the output is predictable, accurate, and completely grounded in the provided contextual literature without hallucinating unverified dietary advice.

## 4. Problem Statement

To design and develop a classical NLP-based Question Answering system that accurately retrieves relevant dietary information directly from a closed corpus of dietary reference books using Term Frequency-Inverse Document Frequency (TF-IDF) and sentence-level ranking formulas, ensuring transparency, relevance, and explainability.

## 5. Objectives

- To establish a closed-domain dataset out of authoritative dietary and nutrition texts in PDF format.
- To design a robust data extraction and text preprocessing pipeline that sanitizes unstructured PDF content.
- To implement TF-IDF indexing for accurate context retrieval matching user queries.
- To refine the answer generation process through sentence-based chunking, relevance scoring, and readability selection.
- To build a highly explainable system where answers are strictly factual and traced directly to the original texts.

## 6. Literature Survey

- **Information Retrieval (TF-IDF):** Information Retrieval forms the backbone of fetching relevant data from a massive collection. TF-IDF is a statistical measure that evaluates how relevant a word is to a document in a collection. This approach has long been effectively utilized to rank documents based on keyword matching to process textual queries.
- **QA Systems:** Extractive Document-QA systems operate by extracting exact snippets directly from the reference material instead of generating new text. These classical systems emphasize precision and context preservation by identifying and returning the exact span or sentence that addresses the given query.
- **Nutrition Information Systems:** In real-world dietary and clinical nutrition scenarios, reliance on validated books constitutes the standard practice. Previous systems that do not use document grounding often fail to deliver specific micro or macro-nutrient criteria directly sourced from literature. Bridging classical QA with nutritional literature enables users to quickly access domain-specific facts seamlessly.

## 7. System Architecture

The core architecture resembles a sequential data processing pipeline spanning from raw data ingest to final answer retrieval. 

```text
[ Raw PDF dietary books (45+) ]
            │
            ▼
[ PDF Text Extraction ] ────► Removes images / visual formatting
            │
            ▼
[ Text Preprocessing ] ─────► Lowercasing, stop-word removal, noise stripping
            │                 (Removal of indexes, Table of Contents)
            ▼
[ Sentence-Based Chunking ] ► Segregates content into manageable logical chunks
            │
            ▼
[ TF-IDF Vectorization ] ───► Creates matrix mapping vocabulary terms to documents
            │
            ▼
[ User Query Input ] ───────► Query tokenization and preprocessing
            │
            ▼
[ Cosine Similarity Scoring]► Measures query vector distance against chunks
            │
            ▼
[ Answer Ranking ] ─────────► Evaluates sentence relevance and readability
            │
            ▼
[ Final Answer Output ] ────► Extracted, concise dietary sentence returned to user
```

## 8. Methodology

### 8.1 Data Collection
The primary dataset consists of more than 45 authoritative books regarding nutrition, clinical dietetics, and human metabolism, entirely in PDF format. These documents serve as the undisputed source of truth grounding the query system.

### 8.2 Text Extraction
The system digests PDF binaries utilizing robust extraction libraries (e.g., pdf-parse), effectively stripping all graphical components, unreadable objects, and pagination metadata, yielding raw, UTF-8 encoded text sequences.

### 8.3 Preprocessing
Text undergoes systematic cleaning. Stop-words, special characters, numerical tables, and structural elements (like publisher notes) are pruned. The removal of trailing blank lines and HTML/symbolic noise ensures the index operates strictly over human-readable linguistic content.

### 8.4 Chunking
Instead of evaluating entire pages or chapters—which could dilute the specificity of retrieved answers—the text is intelligently segmented. The chunking module uses sentence boundary detection to separate content. Crucially, improvements have been added to filter out noise, actively discarding chunks heavily comprised of numbers, bibliographic references, or alphabetical index pages, ensuring that these non-informative chunks do not populate the database.

### 8.5 TF-IDF Indexing
Using the `natural` language processing library, the processed sentence chunks are converted into numerical vectors. Term Frequency (how often words appear in a chunk) multiplied by Inverse Document Frequency (how rare words are globally across the entire corpus) creates a weighted index capable of distinguishing specific dietary terms naturally.

### 8.6 Query Processing
User questions undergo the exact same preprocessing logic applied to the training dataset. The query is lowercased, lemmatized, tokenized, and stripped of non-essential words so that the system vectorizes only the semantically significant vocabulary terms.

### 8.7 Answer Retrieval and Ranking
The vectorized user query is compared against the pre-calculated corpus vectors using Cosine Similarity metrics. The highest-scoring text segment represents the primary context chunk. Secondary improvements within the ranking module include evaluating readability scoring and sentence formulation, ensuring that the highest-ranking sentence is returned cleanly instead of an abruptly cut-off fragment.

## 9. Implementation Details

- **Programming Environment:** Back-end developed using Node.js acting as a server and pipeline orchestrator.
- **NLP Libraries:** Utilizing the `natural` library for basic TF-IDF indexing, stemming, and vectorization. Specialized sentence tokenizers process chunks precisely.
- **File Parsing:** Tools handling raw buffer streams convert the `45+` PDFs into a machine-readable string format efficiently using internal filesystem mapping.
- **Folder Structure:** The data is segregated between raw inputs (`/data/pdfs`), processed and indexed storage files (`/data/indices`), algorithmic processing logic code (`/src/nlp`), and server interfaces (`/src/api`).

## 10. Results and Evaluation

The system was evaluated primarily on Answer Relevance and Context Accuracy via manual inspection of varied query sets. Due to algorithmic improvements in chunking, the query relevance drastically improved because index-like data was eliminated from the scoring race.

**Example Query:** *What is the dietary source of Vitamin C?*
**System Answer:** *Citrus fruits, tomatoes, and potatoes are major dietary sources of Vitamin C, though significant amounts are also found in leafy greens.*

The incorporation of sentence-level answer selection ensured that responses are self-contained statements rather than jumbled paragraph fragments, indicating a high degree of extractive readability.

## 11. Challenges Faced

1. **Noisy PDF Data:** The source books contained substantial noise, such as headers, footers, charts, and copyright pages. This created erratic vector data if not correctly filtered, leading to incorrect term-matching. This was fully solved by creating regex patterns and index pruning functions.
2. **Index Pages Affecting Retrieval:** Text chunks originating from the 'Glossary' or 'Index' of a book often garnered high similarity scores due to keyword spamming (e.g., "Vitamin C...... pg 34, 38, 59"). These were addressed by validating and filtering chunks that lacked proper sentence structure or grammar.
3. **Poor Initial Answers:** Traditional TF-IDF often returns multi-sentence paragraphs where the direct answer is buried. By restricting document granularity down to concise sentence-based limits and validating readability, the system learned to isolate accurate answers.

## 12. Limitations

- **TF-IDF Limitations:** Because TF-IDF is built upon direct word matching rather than an understanding of language, synonym mapping and conceptual inquiries (e.g., phrasing a condition as a symptom instead of its medical name) can result in missed connections.
- **No Semantic Understanding:** The model does not "comprehend" dietetics. It calculates mathematical distributions of text strings. It cannot synthesize multiple sources to create a summarized response; it simply excerpts facts.
- **Dataset Dependency:** The system is completely restricted to the 45+ dietary books input into it. If a user asks a question regarding a subject excluded from the corpus, the system cannot safely return a valid response.

## 13. Future Work

- **Better Ranking Algorithm Check:** Transitioning the pure Cosine Similarity model towards a BM25 ranking algorithm to refine relevance scoring mechanisms with varying document lengths.
- **Expansion of Corpus:** Introducing a larger and more granular dataset featuring recent academic research papers to provide users with up-to-date and specialized clinical dietary facts.
- **Synonym Handlers:** Adding a query expansion module to map common layman terms to medical and scientific vocabulary automatically before executing the vector search.

## 14. Conclusion

The "Dietary-QA-System-using-TF-IDF" demonstrates that functional, transparent, and accurate Question Answering mechanisms do not strictly require heavy neural or deep learning models for domain-specific deployments. By successfully extracting, processing, indexing, and ranking content from over 45 complex PDF books utilizing robust text-processing algorithms, the problem of uncontrolled hallucination was eliminated. The system directly roots its knowledge entirely within factual dietary literature, guaranteeing highly verifiable outputs through an explainable architecture. 

## 15. References

1. Salton, G., & Buckley, C. (1988). *Term-weighting approaches in automatic text retrieval*. Information Processing & Management.
2. Spark Jones, K. (1972). *A statistical interpretation of term specificity and its application in retrieval*. Journal of Documentation.
3. *Natural* NLP Module. Node Package Manager. Available: https://www.npmjs.com/package/natural