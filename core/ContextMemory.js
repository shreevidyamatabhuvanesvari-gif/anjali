/* =========================================================
   core/ReasoningEngine.js
   Role: Level-3 Context-Aware Offline Reasoning
   RAM Profile: ~30–60 MB (safe under 150 MB)
   ========================================================= */

(function (window) {
  "use strict";

  if (!window.KnowledgeBase) {
    console.error("ReasoningEngine: KnowledgeBase missing");
    return;
  }

  /* ---------- CONFIG ---------- */
  const MAX_KNOWLEDGE_SCAN = 3000;
  const MAX_CONTEXT_USE = 20; // contextMemory से अधिकतम उपयोग

  const STOP_WORDS = [
    "क्या","है","हैं","कैसे","क्यों","कब","कहाँ",
    "का","की","के","से","में","पर","और","तो","भी"
  ];

  /* ---------- TEXT UTIL ---------- */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, "")
      .trim();
  }

  function extractKeywords(text) {
    return normalize(text)
      .split(/\s+/)
      .filter(w => w.length > 1 && !STOP_WORDS.includes(w));
  }

  /* ---------- CONTEXT WEIGHTING ---------- */
  function contextWeightScore(qKeys) {
    if (!window.ContextMemory) return 0;

    const recent = ContextMemory.getRecent(MAX_CONTEXT_USE);
    let score = 0;
    let weight = recent.length;

    for (const item of recent) {
      const ctxKeys = extractKeywords(item.question);
      for (const k of qKeys) {
        if (ctxKeys.includes(k)) {
          score += weight * 0.4; // 🔑 recency + frequency
        }
      }
      weight--;
    }
    return score;
  }

  /* ---------- MAIN REASON ---------- */
  async function reason(questionText) {
    if (!questionText) {
      return "मैं आपकी बात समझ नहीं पाई।";
    }

    await KnowledgeBase.init();
    const knowledge = await KnowledgeBase.getAll();

    if (!Array.isArray(knowledge) || knowledge.length === 0) {
      return "मेरे पास अभी पर्याप्त ज्ञान नहीं है।";
    }

    const qNorm = normalize(questionText);
    const qKeys = extractKeywords(questionText);

    /* ---------- 1️⃣ DIRECT MATCH ---------- */
    for (let i = 0; i < knowledge.length && i < MAX_KNOWLEDGE_SCAN; i++) {
      const kq = normalize(knowledge[i].question);
      if (qNorm.includes(kq) || kq.includes(qNorm)) {
        return knowledge[i].answer;
      }
    }

    /* ---------- 2️⃣ SEMANTIC + CONTEXT SCORING ---------- */
    let best = null;
    let bestScore = 0;

    for (let i = 0; i < knowledge.length && i < MAX_KNOWLEDGE_SCAN; i++) {
      const item = knowledge[i];
      const kKeys = extractKeywords(item.question);
      if (kKeys.length === 0) continue;

      let score = 0;

      for (const qk of qKeys) {
        if (kKeys.includes(qk)) score += 1;
      }

      // 🔥 Level-3 Context Influence
      score += contextWeightScore(qKeys);

      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    }

    if (best && bestScore > 0) {
      return best.answer;
    }

    /* ---------- 3️⃣ HUMAN FALLBACK ---------- */
    return (
      "इस प्रश्न पर मेरा सीधा उत्तर उपलब्ध नहीं है, " +
      "लेकिन हम जिस विषय पर बात कर रहे हैं, उसे देखते हुए " +
      "आप थोड़ा और स्पष्ट करें तो मैं बेहतर उत्तर दे पाऊँगी।"
    );
  }

  /* ---------- EXPOSE ---------- */
  Object.defineProperty(window, "ReasoningEngine", {
    value: { reason },
    writable: false,
    configurable: false
  });

  window.__REASONING_READY__ = true;

})(window);
