/* ==========================================================
   ReasoningEngine — FINAL STABLE CORE
   ROLE:
   Take user input, fetch knowledge, decide answer,
   and hand over to ResponseEngine for speaking.
   ========================================================== */

(function () {
  "use strict";

  let running = false;

  /* ===============================
     MAIN PROCESS
     =============================== */
  async function process(input) {
    if (running) return;
    running = true;

    try {
      const text = String(input || "").trim();
      if (!text) return;

      let knowledge = null;

      /* ===============================
         KNOWLEDGE RETRIEVAL (SAFE)
         =============================== */
      if (
        window.KnowledgeAnswerEngine &&
        typeof window.KnowledgeAnswerEngine.retrieve === "function"
      ) {
        try {
          knowledge = KnowledgeAnswerEngine.retrieve(text);
        } catch (e) {
          console.warn("⚠️ Knowledge retrieve failed", e);
          knowledge = null;
        }
      }

      /* ===============================
         DECISION FORMATION
         =============================== */
      const decision = {
        text: knowledge && knowledge.content
          ? knowledge.content
          : "मैं अभी इस प्रश्न का उत्तर सीख रही हूँ।",
        confidence: knowledge && knowledge.relevance
          ? Math.min(0.9, knowledge.relevance)
          : 0.35,
        source: knowledge && knowledge.source
          ? knowledge.source
          : "fallback",
        decidedAt: Date.now()
      };

      /* ===============================
         OUTPUT DISPATCH (CRITICAL)
         =============================== */
      if (
        window.AnjaliCore &&
        typeof window.AnjaliCore.isActive === "function" &&
        window.AnjaliCore.isActive() &&
        window.ResponseEngine &&
        typeof window.ResponseEngine.onDecision === "function"
      ) {
        window.ResponseEngine.onDecision(decision, text);
      } else {
        console.warn("⚠️ ResponseEngine or AnjaliCore inactive");
      }

    } catch (e) {
      console.error("❌ ReasoningEngine.process ERROR", e);
    } finally {
      running = false;
    }
  }

  /* ===============================
     PUBLIC EXPOSURE
     =============================== */
  window.ReasoningEngine = Object.freeze({
    process
  });

})();
