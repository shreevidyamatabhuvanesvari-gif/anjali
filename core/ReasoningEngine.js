/* =========================================================
   core/ReasoningEngine.js
   Role: Deterministic Question → Answer Resolver
   GUARANTEE:
   - Saved knowledge से ही उत्तर देगा
   - return path कभी नहीं टूटेगा
   - STT / TTS / UI untouched
   ========================================================= */

(function (window) {
  "use strict";

  /* ---------- SAFETY CHECK ---------- */
  if (!window.KnowledgeBase) {
    console.error("ReasoningEngine: KnowledgeBase missing");
  }

  /* ---------- NORMALIZER ---------- */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* ---------- CORE ENGINE ---------- */
  const ReasoningEngine = {

    async reason(userQuestion) {
      // ❌ invalid input guard
      if (!userQuestion || typeof userQuestion !== "string") {
        return "मैं प्रश्न समझ नहीं पाई।";
      }

      // ❌ KnowledgeBase unavailable
      if (!window.KnowledgeBase || !KnowledgeBase.getAll) {
        return "मेरे ज्ञान स्रोत उपलब्ध नहीं हैं।";
      }

      let knowledge = [];

      try {
        knowledge = await KnowledgeBase.getAll();
      } catch (e) {
        return "ज्ञान पढ़ने में समस्या आई।";
      }

      if (!Array.isArray(knowledge) || knowledge.length === 0) {
        return "मेरे पास अभी कोई संग्रहीत ज्ञान नहीं है।";
      }

      const qNorm = normalize(userQuestion);

      // 🔍 EXACT + PARTIAL MATCH
      for (let i = 0; i < knowledge.length; i++) {
        const item = knowledge[i];
        if (!item || !item.question || !item.answer) continue;

        const storedNorm = normalize(item.question);

        if (
          storedNorm === qNorm ||
          storedNorm.includes(qNorm) ||
          qNorm.includes(storedNorm)
        ) {
          return String(item.answer); // ✅ FINAL RETURN
        }
      }

      // ❌ No match found
      return "इस प्रश्न का उत्तर मेरे ज्ञान में उपलब्ध नहीं है।";
    }
  };

  /* ---------- EXPOSE (SAFE) ---------- */
  Object.defineProperty(window, "ReasoningEngine", {
    value: ReasoningEngine,
    writable: false,
    configurable: false
  });

})(window);
