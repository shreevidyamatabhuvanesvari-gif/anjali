/* ==========================================================
   KnowledgeBridge.js
   Role:
   Direct bridge between IndexedDB KnowledgeBase
   and KnowledgeAnswerEngine (READ ONLY)
   ========================================================== */

(function () {
  "use strict";

  if (!window.KnowledgeBase || !window.KnowledgeAnswerEngine) {
    console.error("KnowledgeBridge: dependency missing");
    return;
  }

  let cachedQA = [];
  let loaded = false;

  /* ===============================
     LOAD FROM INDEXEDDB
     =============================== */
  async function loadFromDB() {
    if (loaded) return cachedQA;

    try {
      if (typeof KnowledgeBase.getAll !== "function") {
        console.error("KnowledgeBridge: getAll() missing");
        return [];
      }

      const all = await KnowledgeBase.getAll();

      cachedQA = all
        .filter(x => x.question && x.answer)
        .map(x => ({
          source: "IndexedDB",
          text: x.answer,
          tokens: normalize(x.question)
        }));

      loaded = true;
      return cachedQA;

    } catch (e) {
      console.error("KnowledgeBridge load failed", e);
      return [];
    }
  }

  /* ===============================
     NORMALIZE
     =============================== */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(w => w.length > 2);
  }

  /* ===============================
     INJECT INTO KnowledgeAnswerEngine
     =============================== */
  const originalRetrieve = KnowledgeAnswerEngine.retrieve;

  KnowledgeAnswerEngine.retrieve = async function (query) {

    // 1️⃣ पहले IndexedDB से पढ़ो
    const qa = await loadFromDB();
    const qTokens = normalize(query);

    let best = null;
    let bestScore = 0;

    qa.forEach(entry => {
      let hit = 0;
      qTokens.forEach(t => {
        if (entry.tokens.includes(t)) hit++;
      });
      const score = hit / Math.max(qTokens.length, 1);

      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    });

    if (best && bestScore >= 0.15) {
      return {
        source: best.source,
        content: best.text,
        relevance: Number(bestScore.toFixed(2))
      };
    }

    // 2️⃣ fallback → पुराना logic
    return originalRetrieve(query);
  };

  console.log("✅ KnowledgeBridge ACTIVE");

})();
