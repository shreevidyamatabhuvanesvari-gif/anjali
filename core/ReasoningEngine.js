/* =========================================================
   core/ReasoningEngine.js
   Role: Modern Offline Reasoning + Answer Synthesis
   RAM Profile: ~20–40 MB worst case (safe under 150 MB)
   ========================================================= */

(function (window) {
  "use strict";

  if (!window.KnowledgeBase) {
    console.error("ReasoningEngine: KnowledgeBase missing");
    return;
  }

  /* ---------- CONFIG ---------- */
  const MAX_KNOWLEDGE_SCAN = 3000;   // hard upper bound
  const MAX_CONTEXT_TURNS = 6;

  const STOP_WORDS = [
    "क्या","है","हैं","कैसे","क्यों","कब","कहाँ",
    "का","की","के","से","में","पर","और","तो","भी"
  ];

  /* ---------- UTILITIES ---------- */
  function normalize(text) {
    return text
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, "")
      .trim();
  }

  function extractKeywords(text) {
    return normalize(text)
      .split(/\s+/)
      .filter(w => w.length > 1 && !STOP_WORDS.includes(w));
  }

  /* ---------- CONTEXT MEMORY (LIGHT) ---------- */
  const contextBuffer = [];

  function pushContext(question, answer) {
    contextBuffer.push({
      q: normalize(question),
      a: answer
    });
    if (contextBuffer.length > MAX_CONTEXT_TURNS) {
      contextBuffer.shift();
    }
  }

  function contextBiasScore(keywords) {
    let score = 0;
    contextBuffer.forEach(turn => {
      keywords.forEach(k => {
        if (turn.q.includes(k)) score += 0.5;
      });
    });
    return score;
  }

  /* ---------- MAIN REASONING ---------- */
  async function reason(questionText) {
    if (!questionText) {
      return "मैं आपकी बात समझ नहीं पाई।";
    }

    await KnowledgeBase.init();
    const all = await KnowledgeBase.getAll();

    if (!all || all.length === 0) {
      return "मेरे पास अभी पर्याप्त ज्ञान नहीं है।";
    }

    const qNorm = normalize(questionText);
    const qKeys = extractKeywords(questionText);

    /* ---------- 1️⃣ DIRECT MATCH ---------- */
    for (let i = 0; i < all.length && i < MAX_KNOWLEDGE_SCAN; i++) {
      const kq = normalize(all[i].question);
      if (qNorm.includes(kq) || kq.includes(qNorm)) {
        pushContext(questionText, all[i].answer);
        return all[i].answer;
      }
    }

    /* ---------- 2️⃣ SCORED SEMANTIC MATCH ---------- */
    let best = null;
    let bestScore = 0;

    for (let i = 0; i < all.length && i < MAX_KNOWLEDGE_SCAN; i++) {
      const k = all[i];
      const kKeys = extractKeywords(k.question);

      let score = 0;
      qKeys.forEach(qw => {
        if (kKeys.includes(qw)) score += 1;
      });

      // context bias
      score += contextBiasScore(qKeys);

      if (score > bestScore) {
        bestScore = score;
        best = k;
      }
    }

    if (best && bestScore > 0) {
      pushContext(questionText, best.answer);
      return best.answer;
    }

    /* ---------- 3️⃣ HUMAN-STYLE FALLBACK ---------- */
    const fallback =
      "इस प्रश्न पर मेरा सीधा ज्ञान नहीं है, " +
      "लेकिन यदि आप थोड़ा और स्पष्ट करें तो मैं बेहतर समझ पाऊँगी।";

    pushContext(questionText, fallback);
    return fallback;
  }

  /* ---------- EXPOSE ---------- */
  Object.defineProperty(window, "ReasoningEngine", {
    value: { reason },
    writable: false,
    configurable: false
  });

  // readiness flag (for index / stt coordination)
  window.__REASONING_READY__ = true;

})(window);
