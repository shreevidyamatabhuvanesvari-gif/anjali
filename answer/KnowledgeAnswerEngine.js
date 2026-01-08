/* ==========================================================
   KnowledgeAnswerEngine — Level-4 / Version-4.x (FINAL)
   ROLE:
   - IndexedDB आधारित KnowledgeBase से प्रश्न–उत्तर पढ़ना
   - वास्तविक matching + scoring
   - मोबाइल ब्राउज़र सुरक्षित (offline)
   - “उत्तर देने में कठिनाई” केवल अंतिम स्थिति में
   ========================================================== */

(function (window) {
  "use strict";

  if (!window.KnowledgeBase) {
    console.error("KnowledgeAnswerEngine: KnowledgeBase missing");
    return;
  }

  /* ===============================
     INTERNAL STATE
     =============================== */
  let initialized = false;
  let CACHE = [];
  const ERROR_LOG = [];

  /* ===============================
     SAFE EXECUTION
     =============================== */
  function safe(fn, source) {
    try {
      return fn();
    } catch (e) {
      ERROR_LOG.push({
        at: new Date().toISOString(),
        source,
        message: e.message
      });
      return null;
    }
  }

  /* ===============================
     TEXT UTILITIES (REAL)
     =============================== */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(text) {
    return normalize(text).split(" ").filter(w => w.length > 2);
  }

  /* ===============================
     LOAD KNOWLEDGE (INDEXEDDB)
     =============================== */
  async function loadKnowledge() {
    if (initialized) return;
    initialized = true;

    await window.KnowledgeBase.init();

    const records = await window.KnowledgeBase.getAll();
    if (!Array.isArray(records)) return;

    records.forEach(r => {
      if (r && r.question && r.answer) {
        CACHE.push({
          question: r.question,
          answer: r.answer,
          qTokens: tokenize(r.question)
        });
      }
    });
  }

  /* ===============================
     MATCH SCORING (REAL)
     =============================== */
  function scoreMatch(queryTokens, entryTokens) {
    let hit = 0;
    queryTokens.forEach(t => {
      if (entryTokens.includes(t)) hit++;
    });
    return hit / Math.max(queryTokens.length, 1);
  }

  /* ===============================
     MAIN ANSWER FUNCTION
     =============================== */
  async function answer(questionText) {
    if (!questionText || typeof questionText !== "string") {
      return "मैं प्रश्न समझ नहीं पाई।";
    }

    await loadKnowledge();

    if (!CACHE.length) {
      return "मेरे ज्ञान में अभी कोई प्रश्न सुरक्षित नहीं है।";
    }

    const qTokens = tokenize(questionText);
    if (!qTokens.length) {
      return "कृपया प्रश्न थोड़ा स्पष्ट करें।";
    }

    let best = null;
    let bestScore = 0;

    CACHE.forEach(entry => {
      const score = scoreMatch(qTokens, entry.qTokens);
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    });

    /* ===== HONEST THRESHOLD ===== */
    if (!best || bestScore < 0.15) {
      return "इस प्रश्न का उत्तर मेरे ज्ञान में अभी उपलब्ध नहीं है।";
    }

    return best.answer;
  }

  /* ===============================
     DIAGNOSTICS
     =============================== */
  function getStatus() {
    return {
      initialized,
      cachedQA: CACHE.length,
      errorCount: ERROR_LOG.length,
      recentErrors: ERROR_LOG.slice(-3),
      level: "4.x",
      role: "answer-engine"
    };
  }

  /* ===============================
     GLOBAL EXPOSE
     =============================== */
  Object.defineProperty(window, "KnowledgeAnswerEngine", {
    value: Object.freeze({
      answer,
      getStatus,
      level: "4.x",
      mode: "final-operational"
    }),
    writable: false,
    configurable: false
  });

})(window);
