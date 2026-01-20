/* ==========================================================
   CareResponseEngine — v1.0
   LAYER: 4 (Relational Emotion)
   ROLE:
   Regulate care, empathy, and warmth in responses
   while preventing emotional dependency or over-attachment.
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     INTERNAL STATE
     =============================== */

  let careLevel = 0.5; // 0 → neutral, 1 → high care

  const MIN_CARE = 0.2;
  const MAX_CARE = 0.85;

  /* ===============================
     CONFIGURATION
     =============================== */

  const CONFIG = Object.freeze({
    empathyBoost: 0.15,
    distressBoost: 0.25,
    overusePenalty: 0.1,
    decayRate: 0.05
  });

  /* ===============================
     MAIN API
     =============================== */

  function evaluate(context = {}) {
    let delta = 0;

    if (context.userDistress === true) {
      delta += CONFIG.distressBoost;
    }

    if (context.empathySignal === true) {
      delta += CONFIG.empathyBoost;
    }

    if (context.repeatedComfortSeeking === true) {
      delta -= CONFIG.overusePenalty;
    }

    careLevel = clamp(careLevel + delta);

    return snapshot();
  }

  function shapeText(text, state = {}) {
  if (!text || typeof text !== "string") return text;

  /* 🔑 IMPORTANT:
     Knowledge answer को कभी suppress मत करो */
  if (state.hasKnowledge === true) {
    return text;
  }

  let prefix = "";

  if (careLevel > 0.7) {
    prefix = "मैं आपकी बात समझती हूँ। ";
  } else if (careLevel > 0.5) {
    prefix = "मैं समझने की कोशिश कर रही हूँ। ";
  }

  if (state.ethical && state.ethical.flags?.length) {
    prefix += "आपकी भलाई को ध्यान में रखते हुए— ";
  }

  return prefix + text;
}

  /* ===============================
     TIME DECAY
     =============================== */

  function decay() {
    careLevel = Math.max(
      MIN_CARE,
      careLevel - CONFIG.decayRate
    );
  }

  /* ===============================
     SNAPSHOT
     =============================== */

  function snapshot() {
    return {
      careLevel: Number(careLevel.toFixed(2)),
      mode: classify(careLevel)
    };
  }

  function classify(level) {
    if (level > 0.7) return "high-care";
    if (level > 0.45) return "balanced-care";
    return "reserved-care";
  }

  /* ===============================
     RESET (SAFETY)
     =============================== */

  function reset() {
    careLevel = 0.5;
  }

  /* ===============================
     UTILITIES
     =============================== */

  function clamp(v) {
    return Math.max(MIN_CARE, Math.min(MAX_CARE, v));
  }

  /* ===============================
     GLOBAL EXPOSURE
     =============================== */

  window.CareResponseEngine = Object.freeze({
    evaluate,
    shapeText,
    decay,
    getState: snapshot,
    reset,
    version: "1.0",
    role: "care-response-regulator"
  });

})();
