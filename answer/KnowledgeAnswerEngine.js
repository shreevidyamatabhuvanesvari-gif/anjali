/* ==========================================================
   KnowledgeAnswerEngine — FIXED CORE
   ========================================================== */

(function () {
  "use strict";

  let initialized = false;
  let knowledgeIndex = [];

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

    if (!window.KnowledgeBase) return;

    const all = await KnowledgeBase.dump(); // 🔴 यही missing था

    all.forEach(item => {
      if (item.question && item.answer) {
        const text = item.question + " " + item.answer;
        knowledgeIndex.push({
          source: "KnowledgeBase",
          content: item.answer,
          tokens: tokenize(text)
        });
      }
    });

    console.log("📚 Knowledge Indexed:", knowledgeIndex.length);
  }

  function scoreMatch(q, e) {
    let hits = 0;
    q.forEach(t => {
      if (e.includes(t)) hits++;
    });
    return hits / Math.max(q.length, 1);
  }

  async function retrieve(query) {
    await loadKnowledge();

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

    if (!best || bestScore < 0.15) return null;

    return {
      content: best.content,
      relevance: Number(bestScore.toFixed(2)),
      source: best.source
    };
  }

  window.KnowledgeAnswerEngine = Object.freeze({
    retrieve
  });

})();
