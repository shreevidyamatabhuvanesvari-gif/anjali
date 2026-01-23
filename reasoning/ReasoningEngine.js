/* ==========================================================
   ReasoningEngine.js — प्रश्न पर विचार-विमर्श और उत्तर निर्णय
   ========================================================== */
(function () {
  "use strict";

  let running = false;

  async function process(input) {
    if (running) return;
    running = true;
    try {
      const text = String(input || "").trim();
      if (!text) return;
      let knowledge = null;
      if (
        window.KnowledgeAnswerEngine &&
        typeof KnowledgeAnswerEngine.retrieve === "function"
      ) {
        try {
          // ⏩ CRITICAL: await लगाया गया है
          knowledge = await KnowledgeAnswerEngine.retrieve(text);
        } catch (e) {
          console.warn("⚠️ Knowledge retrieve failed", e);
          knowledge = null;
        }
      }
      const decision = {
        text:
          knowledge && knowledge.content
            ? knowledge.content
            : "मैं अभी इस प्रश्न का उत्तर सीख रही हूँ।",
        confidence:
          knowledge && typeof knowledge.relevance === "number"
            ? Math.min(0.9, knowledge.relevance)
            : 0.35,
        source:
          knowledge && knowledge.source
            ? knowledge.source
            : "fallback",
        decidedAt: Date.now()
      };
      if (
        window.ResponseEngine &&
        typeof window.ResponseEngine.onDecision === "function"
      ) {
        ResponseEngine.onDecision(decision, text);
      } else {
        console.warn("⚠️ ResponseEngine unavailable");
      }
    } catch (e) {
      console.error("❌ ReasoningEngine.process ERROR", e);
      if (
        window.ResponseEngine &&
        typeof ResponseEngine.onDecision === "function"
      ) {
        ResponseEngine.onDecision(
          { text: "मुझे उत्तर बनाने में क्षणिक कठिनाई हुई।" },
          input
        );
      }
    } finally {
      running = false;
    }
  }

  window.ReasoningEngine = Object.freeze({
    process
  });
})();
