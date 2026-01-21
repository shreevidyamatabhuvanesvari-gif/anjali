/* ==========================================================
   ReasoningEngine — Level-4 / Version-4.x (FIXED & CLEAN)
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
     ERROR MANAGEMENT
     ====================================================== */
  function recordError(source, error) {
    ERROR_JOURNAL.push({
      time: new Date().toISOString(),
      source,
      message: error?.message || String(error)
    });
    if (ERROR_JOURNAL.length > MAX_ERRORS) {
      ERROR_JOURNAL.shift();
    }
  }

  function safe(fn, source) {
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
    return input.replace(/\s+/g, " ").trim();
  }

  /* ======================================================
     MEMORY
     ====================================================== */
  function fetchMemory(text) {
    if (!window.LongTermMemory) return null;
    return safe(() => LongTermMemory.search(text), "MEMORY_FETCH");
  }

  function persistEpisode(record) {
    if (!window.LongTermMemory) return;
    safe(() => LongTermMemory.store(record), "MEMORY_STORE");
  }

  /* ======================================================
     KNOWLEDGE
     ====================================================== */
  function fetchKnowledge(text) {
    if (!window.KnowledgeAnswerEngine) return null;
    return safe(
      () => KnowledgeAnswerEngine.retrieve(text),
      "KNOWLEDGE_FETCH"
    );
  }

  /* ======================================================
     EMOTION
     ====================================================== */
  function analyzeEmotion(text) {
    if (!window.EmotionEngine) return null;
    return safe(() => EmotionEngine.analyze(text), "EMOTION_ANALYSIS");
  }

  /* ======================================================
     DECISION CORE
     ====================================================== */
  function computeDecision(text, memory, knowledge, emotion) {
    let confidence = 0.4;
    let responseText = text;
    const rationale = [];

    if (knowledge?.content) {
      responseText = knowledge.content;
      confidence = Math.max(confidence, knowledge.relevance || 0.7);
      rationale.push("knowledge-used");
    }

    if (memory?.matchStrength) {
      confidence += memory.matchStrength;
      rationale.push("memory-aligned");
    }

    if (emotion?.stability) {
      confidence += emotion.stability;
      rationale.push("emotion-aware");
    }

    confidence = Math.min(1, confidence);

    return {
      text: responseText,
      confidence,
      source: knowledge ? knowledge.source : "fallback",
      rationale: rationale.join(" | "),
      decidedAt: Date.now()
    };
  }

  /* ======================================================
     META CORRECTION
     ====================================================== */
  function metaCorrect(decision) {
    if (decision.confidence < 0.35) {
      return {
        ...decision,
        text: "मैं इस विषय को समझने की प्रक्रिया में हूँ।",
        confidence: decision.confidence + 0.15,
        metaCorrected: true
      };
    }
    return decision;
  }

  /* ======================================================
     MAIN PIPELINE (SINGLE SOURCE OF TRUTH)
     ====================================================== */
  function process(input) {
    if (running) return;
    running = true;

    try {
      const text = normalizeInput(input);
      if (!text) return;

      const memory = fetchMemory(text);
      const knowledge = fetchKnowledge(text);
      const emotion = analyzeEmotion(text);

      const base = computeDecision(text, memory, knowledge, emotion);
      const finalDecision = metaCorrect(base);

      lastDecision = finalDecision;

      if (window.AnjaliCore?.isActive() && window.ResponseEngine) {
        ResponseEngine.onDecision(finalDecision, text);
      }

      persistEpisode({
        input: text,
        output: finalDecision.text,
        confidence: finalDecision.confidence,
        source: finalDecision.source,
        at: new Date().toISOString()
      });

    } catch (e) {
      recordError("PROCESS_PIPELINE", e);
    } finally {
      running = false;
    }
  }

  /* ======================================================
     DIAGNOSTICS
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
    mode: "clean-operational"
  });

})();
