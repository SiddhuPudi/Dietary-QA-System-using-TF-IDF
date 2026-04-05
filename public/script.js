/**
 * Dietary QA System — Client-side Script
 * Handles form submission, API calls, answer rendering, and query history.
 */

// ═══════════════════ DOM References ═══════════════════
const form            = document.getElementById("question-form");
const input           = document.getElementById("question-input");
const submitBtn       = document.getElementById("submit-btn");
const charCount       = document.getElementById("char-count");
const warningMsg      = document.getElementById("warning-msg");

const answerSection   = document.getElementById("answer-section");
const loadingIndicator= document.getElementById("loading-indicator");
const answerContent   = document.getElementById("answer-content");
const answerText      = document.getElementById("answer-text");
const sourceText      = document.getElementById("source-text");
const scoreText       = document.getElementById("score-text");
const sourceBadge     = document.getElementById("source-badge");
const scoreBadge      = document.getElementById("score-badge");
const confidenceFill  = document.getElementById("confidence-fill");
const confBarWrapper  = document.getElementById("confidence-bar-wrapper");
const noAnswer        = document.getElementById("no-answer");
const errorDisplay    = document.getElementById("error-display");
const errorText       = document.getElementById("error-text");

const historySection  = document.getElementById("history-section");
const historyList     = document.getElementById("history-list");

// ═══════════════════ State ═══════════════════
const MAX_HISTORY = 5;
let queryHistory = []; // { question, answer, source, score }

// ═══════════════════ Helpers ═══════════════════

/** Show an element (remove .hidden) */
function show(el) { el.classList.remove("hidden"); }

/** Hide an element (add .hidden) */
function hide(el) { el.classList.add("hidden"); }

/** Briefly display a warning message */
function showWarning(msg) {
  warningMsg.textContent = msg;
  show(warningMsg);
  // Auto-hide after 4 seconds
  setTimeout(() => hide(warningMsg), 4000);
}

/** Truncate text to a given length */
function truncate(str, len = 80) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

/** Format a confidence score as a percentage string */
function formatScore(score) {
  if (score == null || isNaN(score)) return "N/A";
  return (score * 100).toFixed(1) + "%";
}

// ═══════════════════ Character Counter ═══════════════════
input.addEventListener("input", () => {
  const len = input.value.length;
  charCount.textContent = `${len} / 500`;
});

// Submit on Enter (Shift + Enter = new line)
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault(); // prevent newline
    form.requestSubmit(); // trigger form submit
  }
});

// ═══════════════════ Form Submission ═══════════════════
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hide(warningMsg);

  const question = input.value.trim();

  // ── Validation ──
  if (!question) {
    showWarning("Please type a question before submitting.");
    input.focus();
    return;
  }

  // ── Prepare UI for loading ──
  show(answerSection);
  show(loadingIndicator);
  hide(answerContent);
  hide(noAnswer);
  hide(errorDisplay);
  submitBtn.disabled = true;

  try {
    // ── API Call ──
    const response = await fetch("/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }
    const data = await response.json();
    // ── Check for server-level error field ──
    if (data.error) {
      throw new Error(data.error);
    }
    hide(loadingIndicator);
    // ── No-answer case ──
    if (!data.source && data.answer) {
      show(noAnswer);
      addToHistory(question, data.answer, null, null);
      input.value = "";
      charCount.textContent = "0 / 500";
      return;
    }
    // ── Render answer ──
    renderAnswer(data);
    addToHistory(question, data.answer, data.source, data.score);
    // ── Clear input ──
    input.value = "";
    charCount.textContent = "0 / 500";
  } catch (err) {
    hide(loadingIndicator);
    errorText.textContent = err.message || "Something went wrong. Please try again.";
    show(errorDisplay);
    console.error("QA Error:", err);
  } finally {
    submitBtn.disabled = false;
    input.focus();
  }
});

// ═══════════════════ Render Answer ═══════════════════
function renderAnswer(data) {
  answerText.textContent = data.answer;
  // Source
  if (data.source) {
    sourceText.textContent = data.source;
    show(sourceBadge);
  } else {
    hide(sourceBadge);
  }
  // Score
  if (data.score != null) {
    scoreText.textContent = formatScore(data.score);
    show(scoreBadge);
    // Confidence bar
    const pct = Math.min(Math.max(data.score * 100, 0), 100);
    confidenceFill.style.width = "0%";
    show(confBarWrapper);
    // Trigger reflow for animation
    requestAnimationFrame(() => {
      confidenceFill.style.width = pct + "%";
    });
  } else {
    hide(scoreBadge);
    hide(confBarWrapper);
  }
  show(answerContent);
}

// ═══════════════════ Query History ═══════════════════

/**
 * Add a query to the history, keeping only the last MAX_HISTORY items.
 */
function addToHistory(question, answer, source, score) {
  queryHistory.unshift({ question, answer, source, score });
  if (queryHistory.length > MAX_HISTORY) {
    queryHistory = queryHistory.slice(0, MAX_HISTORY);
  }
  renderHistory();
}

/**
 * Render the history list in the DOM.
 */
function renderHistory() {
  if (queryHistory.length === 0) {
    hide(historySection);
    return;
  }
  show(historySection);
  historyList.innerHTML = "";
  queryHistory.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "history-item";
    li.setAttribute("tabindex", "0");
    li.setAttribute("role", "button");
    li.setAttribute("aria-label", `Reload query: ${item.question}`);
    li.style.animationDelay = `${index * 0.06}s`;
    li.innerHTML = `
      <span class="history-question">${escapeHTML(item.question)}</span>
      <span class="history-preview">${escapeHTML(truncate(item.answer, 90))}</span>
    `;
    // Click → reload the query
    li.addEventListener("click", () => reloadQuery(item));
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        reloadQuery(item);
      }
    });
    historyList.appendChild(li);
  });
}

/**
 * Reload a previous query: fill the input and display the cached answer.
 */
function reloadQuery(item) {
  input.value = item.question;
  charCount.textContent = `${item.question.length} / 500`;
  input.focus();
  // Show the cached answer
  show(answerSection);
  hide(loadingIndicator);
  hide(noAnswer);
  hide(errorDisplay);
  if (!item.source && item.answer) {
    show(noAnswer);
    hide(answerContent);
  } else {
    renderAnswer(item);
  }
  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ═══════════════════ Security Helper ═══════════════════

/**
 * Escape HTML to prevent XSS in dynamic content.
 */
function escapeHTML(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
