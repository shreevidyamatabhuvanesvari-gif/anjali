/* ==========================================================
   KnowledgeAnswerEngine — Level-4 / Version-4.x (FIXED)
   ========================================================== */

(function () {
  "use strict";

  let initialized = false;
  let knowledgeIndex = [];
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
     TEXT UTILITIES
     =============================== */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(text) {
    return normalize(text).split(" ").filter(w => w.length > 2);
  }

  /* ===============================
     LOAD KNOWLEDGE (REAL)
     =============================== */
  function loadKnowledge() {
    if (initialized) return;
    initialized = true;

    if (
      window.KnowledgeBase &&
      typeof window.KnowledgeBase.dump === "function"
    ) {
      safe(() => {
        const records = KnowledgeBase.dump();

        records.forEach(r => {
          if (r && r.question && r.answer) {
            const combined = `${r.question} ${r.answer}`;

            knowledgeIndex.push({
              source: "KnowledgeBase",
              text: r.answer,
              tokens: tokenize(combined)
            });
          }
        });
      }, "LOAD_KB_DUMP");
    }
  }

  /* ===============================
     MATCHING LOGIC
     =============================== */
  function scoreMatch(queryTokens, entryTokens) {
    let hits = 0;
    queryTokens.forEach(t => {
      if (entryTokens.includes(t)) hits++;
    });
    return hits / Math.max(queryTokens.length, 1);
  }

  /* ===============================
     RETRIEVE
     =============================== */
  function retrieve(query) {
    loadKnowledge();

    const qTokens = tokenize(query);
    if (!qTokens.length || !knowledgeIndex.length) return null;

    let best = null;
    let bestScore = 0;

    knowledgeIndex.forEach(entry => {
      const score = scoreMatch(qTokens, entry.tokens);
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    });

    if (!best || bestScore < 0.15) return null;

    return {
      source: best.source,
      content: best.text,
      relevance: Number(bestScore.toFixed(2))
    };
  }

  /* ===============================
     DIAGNOSTICS
     =============================== */
  function getStatus() {
    return {
      initialized,
      entriesIndexed: knowledgeIndex.length,
      errorCount: ERROR_LOG.length,
      recentErrors: ERROR_LOG.slice(-3),
      level: "4.x",
      role: "knowledge-retrieval"
    };
  }

  window.KnowledgeAnswerEngine = Object.freeze({
    retrieve,
    getStatus,
    level: "4.x",
    mode: "operational"
  });

})();
