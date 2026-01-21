/* ==========================================================
   KnowledgeAnswerEngine — FINAL FIXED CORE
   PURPOSE:
   Read ALL saved Q/A from KnowledgeBase (IndexedDB),
   build searchable index, and return correct answers.
   ========================================================== */

(function () {
  "use strict";

  let initialized = false;
  let knowledgeIndex = [];

  /* ===============================
     TEXT NORMALIZATION
     =============================== */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(text) {
    return normalize(text)
      .split(" ")
      .filter(w => w.length > 2);
  }

  /* ===============================
     LOAD ALL KNOWLEDGE (REAL FIX)
     =============================== */
  async function loadKnowledge() {
    if (initialized) return;
    initialized = true;

    if (
      !window.KnowledgeBase ||
      typeof KnowledgeBase.dump !== "function"
    ) {
      console.warn("⚠️ KnowledgeBase.dump() उपलब्ध नहीं");
      return;
    }

    let all = [];

    try {
      all = await KnowledgeBase.dump(); // ✅ CRITICAL FIX
    } catch (e) {
      console.error("❌ Knowledge dump failed", e);
      return;
    }

    if (!Array.isArray(all)) {
      console.warn("⚠️ Knowledge dump invalid");
      return;
    }

    all.forEach(item => {
      if (!item || !item.question || !item.answer) return;

      const combinedText =
        item.question + " " + item.answer;

      knowledgeIndex.push({
        source: "KnowledgeBase",
        content: item.answer,
        tokens: tokenize(combinedText)
      });
    });

    console.log(
      "📚 KnowledgeAnswerEngine Indexed:",
      knowledgeIndex.length,
      "records"
    );
  }

  /* ===============================
     MATCH SCORING
     =============================== */
  function scoreMatch(queryTokens, entryTokens) {
    let hits = 0;
    queryTokens.forEach(t => {
      if (entryTokens.includes(t)) hits++;
    });
    return hits / Math.max(queryTokens.length, 1);
  }

  /* ===============================
     RETRIEVE ANSWER
     =============================== */
  async function retrieve(query) {
    await loadKnowledge();

    if (!knowledgeIndex.length) return null;

    const qTokens = tokenize(query);
    if (!qTokens.length) return null;

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
      return null;
    }

    return {
      content: best.content,
      relevance: Number(bestScore.toFixed(2)),
      source: best.source
    };
  }

  /* ===============================
     PUBLIC API
     =============================== */
  window.KnowledgeAnswerEngine = Object.freeze({
    retrieve,
    status() {
      return {
        indexed: knowledgeIndex.length,
        initialized,
        role: "knowledge-answer-engine",
        level: "4.x-fixed"
      };
    }
  });

})();
