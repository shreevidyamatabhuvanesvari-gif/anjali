/* ==========================================================
   ReasoningEngine — Level-4 / Version-4.x
   REAL OPERATIONAL THINKING CORE
   PURPOSE:
   Transform user input into a reasoned, reflective,
   self-corrected response using memory, emotion,
   and runtime confidence calibration — for mobile browsers.
   ========================================================== */

(function () {
  "use strict";

  /* ======================================================
     ENGINE STATE
     ====================================================== */
  let running = false;
  let lastDecision = null;

  const ERROR_JOURNAL = [];
  const MAX_ERRORS = 50;

  /* ======================================================
     ERROR MANAGEMENT (REAL)
     ====================================================== */
  function recordError(source, error) {
    ERROR_JOURNAL.push({
      time: new Date().toISOString(),
      source,
      message: error && error.message ? error.message : String(error)
    });
    if (ERROR_JOURNAL.length > MAX_ERRORS) {
      ERROR_JOURNAL.shift();
    }
  }

  function safeExecute(fn, source) {
    try {
      return fn();
    } catch (e) {
      recordError(source, e);
      return null;
    }
  }

  /* ======================================================
     INPUT NORMALIZATION
     ====================================================== */
  function normalizeInput(input) {
    if (typeof input !== "string") return "";
    return input
      .replace(/\s+/g, " ")
      .replace(/[^\S\r\n]+/g, " ")
      .trim();
  }

  /* ======================================================
     MEMORY INTERFACE (REAL)
     ====================================================== */
  function fetchMemoryContext(text) {
    if (!window.LongTermMemory) return null;

    return safeExecute(() => {
      return window.LongTermMemory.search(text);
    }, "MEMORY_FETCH");
  }

  function persistEpisode(record) {
    if (!window.LongTermMemory) return;

    safeExecute(() => {
      window.LongTermMemory.store(record);
    }, "MEMORY_STORE");
  }

  /* ======================================================
     EMOTION INTERFACE (REAL)
     ====================================================== */
  function analyzeEmotion(text) {
    if (!window.EmotionEngine) return null;

    return safeExecute(() => {
      return window.EmotionEngine.analyze(text);
    }, "EMOTION_ANALYSIS");
  }

  /* ======================================================
     CORE DECISION COMPUTATION
     ====================================================== */
  function computeDecision(input, memory, emotion) {
    let confidence = 0;
    const rationale = [];

    if (memory && typeof memory.matchStrength === "number") {
      confidence += memory.matchStrength;
      rationale.push("memory-aligned");
    }

    if (emotion && typeof emotion.stability === "number") {
      confidence += emotion.stability;
      rationale.push("emotion-stable");
    }

    if (!memory && !emotion) {
      confidence += 0.25;
      rationale.push("context-neutral");
    }

    confidence = Math.max(0, Math.min(1, confidence));

    return {
      text: input,
      confidence,
      rationale: rationale.join(" | "),
      decidedAt: Date.now()
    };
  }

  /* ======================================================
     META-REASONING & SELF-CORRECTION
     ====================================================== */
  function metaCorrect(decision) {
    const adaptiveThreshold = 0.4;

    if (decision.confidence < adaptiveThreshold) {
      return {
        ...decision,
        text:
          "मुझे इस विषय पर और स्पष्टता चाहिए। " +
          decision.text,
        confidence: Math.min(1, decision.confidence + 0.15),
        metaCorrected: true
      };
    }
    return decision;
  }

  /* ======================================================
     MAIN PIPELINE
     ====================================================== */
  function process(input) {
    if (running) return;
    running = true;

    try {
      const text = normalizeInput(input);
      if (!text) return;

      const memory = fetchMemoryContext(text);
      const emotion = analyzeEmotion(text);

      const memory = fetchMemoryContext(text);
const emotion = analyzeEmotion(text);

// ===== KNOWLEDGE RETRIEVAL =====
let knowledge = null;
if (
  window.KnowledgeAnswerEngine &&
  typeof KnowledgeAnswerEngine.retrieve === "function"
) {
  knowledge = KnowledgeAnswerEngine.retrieve(text);
}

// ===== ANSWER SELECTION =====
let answerText = "";
let confidence = 0.4;

if (knowledge && knowledge.content) {
  answerText = knowledge.content;
  confidence = Math.min(0.9, knowledge.relevance || 0.7);
} else {
  answerText = "मैं अभी इस प्रश्न का उत्तर सीख रही हूँ।";
  confidence = 0.35;
}

// ===== FINAL DECISION OBJECT =====
const finalDecision = {
  text: answerText,
  confidence,
  source: knowledge ? knowledge.source : "fallback",
  decidedAt: Date.now()
};

lastDecision = finalDecision;

      /* === OUTPUT DISPATCH (FINALIZED) === */
if (window.AnjaliCore && window.AnjaliCore.isActive()) {
  safeExecute(() => {
    if (window.ResponseEngine) {

      /* ===============================
         MORAL EMOTION EVALUATION (LAYER 3)
         =============================== */
      let ethicalReport = null;

      if (window.ModuleEthicalEmotionEngine) {
        ethicalReport = ModuleEthicalEmotionEngine.evaluate(
          text,
          { decision: finalDecision }
        );
      }

      /* ===============================
         FINAL DECISION DISPATCH
         =============================== */
      window.ResponseEngine.onDecision(
        finalDecision,
        {
          userText: text,
          ethical: ethicalReport,
          source: "reasoning-engine",
          timestamp: Date.now()
        }
      );
    }
  }, "CORE_OUTPUT");
}

      /* === EXPERIENCE PERSISTENCE === */
      persistEpisode({
        input: text,
        output: finalDecision.text,
        confidence: finalDecision.confidence,
        rationale: finalDecision.rationale,
        at: new Date().toISOString()
      });

    } finally {
      running = false;
    }
  }

  /* ======================================================
     DIAGNOSTIC INTROSPECTION
     ====================================================== */
  function getStatus() {
    return {
      running,
      lastDecision,
      errorCount: ERROR_JOURNAL.length,
      recentErrors: ERROR_JOURNAL.slice(-5),
      level: "4.x",
      operational: true
    };
  }

  /* ======================================================
     GLOBAL EXPOSURE
     ====================================================== */
  window.ReasoningEngine = Object.freeze({
    process,
    getStatus,
    level: "4.x",
    mode: "real-operational"
  });

})();
