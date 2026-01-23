/* ==========================================================
   KnowledgeAnswerEngine.js — Core for retrieving saved Q/A
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

  async function loadKnowledge() {
    if (initialized) return;
    initialized = true;
    if (!window.KnowledgeBase || typeof KnowledgeBase.getAll !== "function") {
      console.warn("⚠️ KnowledgeBase.getAll() उपलब्ध नहीं");
      return;
    }
    let all = [];
    try {
      all = await KnowledgeBase.getAll(); // Fetch all saved Q/A
    } catch (e) {
      console.error("❌ KnowledgeBase.getAll() failed", e);
      return;
    }
    if (!Array.isArray(all)) {
      console.warn("⚠️ Knowledge data invalid");
      return;
    }
    all.forEach(item => {
      if (!item || !item.question || !item.answer) return;
      const combinedText = item.question + " " + item.answer;
      knowledgeIndex.push({
        source: "KnowledgeBase",
        content: item.answer,
        tokens: tokenize(combinedText)
      });
    });
    console.log("📚 Indexed Knowledge records:", knowledgeIndex.length);
  }

  function scoreMatch(queryTokens, entryTokens) {
    let hits = 0;
    queryTokens.forEach(t => {
      if (entryTokens.includes(t)) hits++;
    });
    return hits / Math.max(queryTokens.length, 1);
  }

  async function retrieve(query) {
    await loadKnowledge();  // सुनिश्चित करें कि डेटा लोड है
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
      return null;  // कोई उपयुक्त मिलान नहीं मिला
    }
    return {
      content: best.content,
      relevance: Number(bestScore.toFixed(2)),
      source: best.source
    };
  }

  window.KnowledgeAnswerEngine = Object.freeze({
    retrieve,
    status() {
      return {
        indexed: knowledgeIndex.length,
        initialized,
        role: "knowledge-answer-engine",
        level: "4.x-corrected"
      };
    }
  });
})();
