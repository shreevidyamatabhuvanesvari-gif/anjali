/* =========================================================
   core/ReasoningEngine.js
   Role: Human-like Offline Reasoning Engine
   GUARANTEE:
   - Uses saved KnowledgeBase correctly
   - No impact on STT / TTS
   - Keyword-based flexible matching
   ========================================================= */

(function (window) {
  "use strict";

  if (!window.KnowledgeBase) {
    console.error("❌ ReasoningEngine: KnowledgeBase missing");
    return;
  }

  /* ---------- TEXT UTILS ---------- */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, "") // Hindi only
      .replace(/\s+/g, " ")
      .trim();
  }

  function words(text) {
    return normalize(text).split(" ").filter(w => w.length > 1);
  }

  /* ---------- MAIN REASONING ---------- */
  async function reason(questionText) {
    if (!questionText) {
      return "मैं आपकी बात समझ नहीं पाई।";
    }

    let all;
    try {
      await KnowledgeBase.init();
      all = await KnowledgeBase.getAll();
    } catch (e) {
      return "मेरे ज्ञान तक पहुँचने में समस्या आ रही है।";
    }

    if (!Array.isArray(all) || all.length === 0) {
      return "मेरे पास अभी कोई सुरक्षित ज्ञान नहीं है।";
    }

    const qWords = words(questionText);

    let bestMatch = null;
    let bestScore = 0;

    for (const item of all) {
      if (!item.question || !item.answer) continue;

      const kWords = words(item.question);
      if (kWords.length === 0) continue;

      let matchCount = 0;
      qWords.forEach(w => {
        if (kWords.includes(w)) matchCount++;
      });

      const score = matchCount / kWords.length;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    /* ---------- DECISION ---------- */
    if (bestMatch && bestScore >= 0.6) {
      return bestMatch.answer;
    }

    return "इस प्रश्न का उत्तर मेरे ज्ञान में अभी उपलब्ध नहीं है।";
  }

  /* ---------- EXPOSE ---------- */
  Object.defineProperty(window, "ReasoningEngine", {
    value: { reason },
    writable: false,
    configurable: false
  });

  console.log("🧠 ReasoningEngine ready (human-like)");

})(window);
