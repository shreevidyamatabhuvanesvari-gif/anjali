/* =========================================================
   core/AnswerEngine.js
   Role: Read + Match + Balanced Answer Engine (OFFLINE)
   Safe: Does NOT modify existing systems
   ========================================================= */

(function (window) {
  "use strict";

  if (!window.KnowledgeBase) {
    console.error("AnswerEngine: KnowledgeBase missing");
    return;
  }

  const AnswerEngine = {

    // ---------- MAIN ANSWER ----------
    async answer(questionText) {
      if (!questionText) {
        return "मैं प्रश्न समझ नहीं पाई।";
      }

      await KnowledgeBase.init();
      const knowledge = await KnowledgeBase.getAll();

      if (!knowledge || knowledge.length === 0) {
        return "मेरे ज्ञान में अभी कुछ भी सुरक्षित नहीं है।";
      }

      const q = questionText.toLowerCase();

      // 1️⃣ Exact / Partial Match
      const direct = knowledge.find(k =>
        q.includes(k.question.toLowerCase()) ||
        k.question.toLowerCase().includes(q)
      );

      if (direct) {
        return direct.answer;
      }

      // 2️⃣ Similarity Match (keyword based)
      const scored = knowledge
        .map(k => {
          let score = 0;
          const words = k.question.toLowerCase().split(/\s+/);
          words.forEach(w => {
            if (q.includes(w)) score++;
          });
          return { ...k, score };
        })
        .filter(k => k.score > 0)
        .sort((a, b) => b.score - a.score);

      if (scored.length > 0) {
        // संतुलित उत्तर
        const top = scored.slice(0, 2);
        return top.map(k => k.answer).join(" ");
      }

      // 3️⃣ Nothing matched
      return "इस प्रश्न का उत्तर मेरे ज्ञान में नहीं है।";
    }
  };

  // ---------- EXPOSE ----------
  Object.defineProperty(window, "AnswerEngine", {
    value: AnswerEngine,
    writable: false,
    configurable: false
  });

})(window);
