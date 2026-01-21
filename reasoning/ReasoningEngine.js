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
     MAIN PROCESS (ASYNC)
     =============================== */
  async function process(input) {
    if (running) return;
    running = true;

    try {
      const text = String(input || "").trim();
      if (!text) return;

      let knowledge = null;

      /* ===============================
         KNOWLEDGE RETRIEVAL
         =============================== */
      if (
        window.KnowledgeAnswerEngine &&
        typeof KnowledgeAnswerEngine.retrieve === "function"
      ) {
        knowledge = await KnowledgeAnswerEngine.retrieve(text);
      }

      /* ===============================
         DECISION FORMATION
         =============================== */
      const decision = {
        text: knowledge?.content || "मैं अभी यह सीख रही हूँ।",
        confidence: knowledge?.relevance || 0.3,
        source: knowledge ? knowledge.source : "fallback",
        decidedAt: Date.now()
      };

      /* ===============================
         OUTPUT DISPATCH
         =============================== */
      if (
        window.AnjaliCore &&
        typeof window.AnjaliCore.isActive === "function" &&
        window.AnjaliCore.isActive() &&
        window.ResponseEngine &&
        typeof window.ResponseEngine.onDecision === "function"
      ) {
        window.ResponseEngine.onDecision(decision, text);
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
