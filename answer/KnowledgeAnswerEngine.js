/* ==========================================================
   KnowledgeAnswerEngine — Level-4 / Version-4.x
   PURPOSE:
   Retrieve factual knowledge relevant to a user query
   from local knowledge stores (mobile-browser safe).
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     INTERNAL STATE
     =============================== */
  let initialized = false;
  let knowledgeIndex = []; // normalized searchable index
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
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(text) {
    return normalize(text).split(" ").filter(w => w.length > 2);
  }

  /* ===============================
     LOAD KNOWLEDGE (REAL SOURCE)
     =============================== */
  function loadKnowledge() {
    if (initialized) return;

    initialized = true;

    /* Priority 1: LongTermMemory (dynamic knowledge) */
    if (window.LongTermMemory && typeof window.LongTermMemory.dump === "function") {
      safe(() => {
        const records = window.LongTermMemory.dump();
        records.forEach(r => {
          if (r && r.content) {
            knowledgeIndex.push({
              source: r.source || "LongTermMemory",
              text: r.content,
              tokens: tokenize(r.content)
            });
          }
        });
      }, "LOAD_LTM");
    }

    /* Priority 2: Static KnowledgeBase (articles) */
    if (window.KnowledgeBase && typeof window.KnowledgeBase.search === "function") {
      safe(() => {
        const probe = window.KnowledgeBase.search(" ");
        if (probe && probe.content) {
          knowledgeIndex.push({
            source: probe.source || "KnowledgeBase",
            text: probe.content,
            tokens: tokenize(probe.content)
          });
        }
      }, "LOAD_KB");
    }
  }

  /* ===============================
     MATCHING LOGIC (REAL)
     =============================== */
  function scoreMatch(queryTokens, entryTokens) {
    let hits = 0;
    queryTokens.forEach(t => {
      if (entryTokens.includes(t)) hits++;
    });
    return hits / Math.max(queryTokens.length, 1);
  }

  /* ===============================
     MAIN RETRIEVAL FUNCTION
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

    if (!best || bestScore < 0.15) {
      return null; // ईमानदार अस्वीकार
    }

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

  /* ===============================
     GLOBAL EXPOSURE
     =============================== */
  window.KnowledgeAnswerEngine = Object.freeze({
    retrieve,
    getStatus,
    level: "4.x",
    mode: "operational"
  });

})();
