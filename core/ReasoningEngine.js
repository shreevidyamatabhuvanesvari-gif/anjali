/* =========================================================
   core/ReasoningEngine.js
   Role: Human-like Offline Reasoning Engine
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
    return normalize(text)
      .split(" ")
      .filter(w => w.length > 1);
  }

  /* ---------- MAIN REASONING ---------- */
  async function reason(questionText) {
    if (!questionText) {
      return { text: "मैं आपकी बात समझ नहीं पाई।" };
    }

    let all;
    try {
      await KnowledgeBase.init();
      all = await KnowledgeBase.getAll();
    } catch (_) {
      return { text: "मेरे ज्ञान तक पहुँचने में समस्या आ रही है।" };
    }

    if (!Array.isArray(all) || all.length === 0) {
      return { text: "मेरे पास अभी कोई सुरक्षित ज्ञान नहीं है।" };
    }

    const qWords = words(questionText);
    if (qWords.length === 0) {
      return { text: "मैं आपकी बात स्पष्ट रूप से समझ नहीं पाई।" };
    }

    let bestMatch = null;
    let bestScore = 0;

    for (const item of all) {
      if (!item.question || !item.answer) continue;

      const kWords = words(item.question);
      if (kWords.length === 0) continue;

      let matchCount = 0;
      for (const w of qWords) {
        if (kWords.includes(w)) matchCount++;
      }

      const score = matchCount / kWords.length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    // अगर स्कोर 0.25 से अधिक हुआ तो उत्तर दें
    if (bestMatch && bestScore >= 0.25) {
      return { text: bestMatch.answer };
    }

    return { text: "इस प्रश्न का उत्तर मेरे ज्ञान में अभी उपलब्ध नहीं है।" };
  }

  /* ---------- EXPOSE ---------- */
  Object.defineProperty(window, "ReasoningEngine", {
    value: { reason },
    writable: false,
    configurable: false
  });

  console.log("🧠 ReasoningEngine ready (fixed Hindi keyword threshold)");
})(window);
