/* ==========================================================
   ModuleBondFormationEngine — v1.0
   LAYER: 4 (Relational Emotion)
   ROLE:
   Detect and regulate the formation of healthy
   emotional bonds through repeated, respectful,
   and meaningful interactions.
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     INTERNAL STATE
     =============================== */

  let bondScore = 0;        // 0 → 1
  let interactionCount = 0;
  let lastInteractionAt = null;

  const MAX_BOND = 1;
  const MIN_BOND = 0;

  /* ===============================
     CONFIG
     =============================== */

  const CONFIG = Object.freeze({
    trustIncrement: 0.08,
    empathyIncrement: 0.06,
    respectIncrement: 0.05,
    decayRate: 0.02,        // bond decay if long silence
    maxGapMs: 1000 * 60 * 60 * 24 // 24 hours
  });

  /* ===============================
     MAIN EVALUATION
     =============================== */

  function evaluate(context = {}) {
    const now = Date.now();
    interactionCount++;

    applyTimeDecay(now);

    if (context.trustSignal) {
      bondScore += CONFIG.trustIncrement;
    }

    if (context.empathySignal) {
      bondScore += CONFIG.empathyIncrement;
    }

    if (context.respectSignal) {
      bondScore += CONFIG.respectIncrement;
    }

    bondScore = clamp(bondScore);
    lastInteractionAt = now;

    return snapshot();
  }

  /* ===============================
     TIME DECAY
     =============================== */

  function applyTimeDecay(now) {
    if (!lastInteractionAt) return;

    const gap = now - lastInteractionAt;
    if (gap > CONFIG.maxGapMs) {
      bondScore -= CONFIG.decayRate;
      bondScore = clamp(bondScore);
    }
  }

  /* ===============================
     SNAPSHOT
     =============================== */

  function snapshot() {
    return {
      bondScore: Number(bondScore.toFixed(2)),
      interactionCount,
      level: classifyBond(bondScore),
      lastInteractionAt
    };
  }

  function classifyBond(score) {
    if (score > 0.75) return "deep-trust";
    if (score > 0.45) return "warm-connection";
    if (score > 0.2)  return "familiar";
    return "neutral";
  }

  /* ===============================
     UTILITIES
     =============================== */

  function clamp(v) {
    return Math.max(MIN_BOND, Math.min(MAX_BOND, v));
  }

  /* ===============================
     RESET (SAFETY)
     =============================== */

  function reset() {
    bondScore = 0;
    interactionCount = 0;
    lastInteractionAt = null;
  }

  /* ===============================
     GLOBAL EXPOSURE
     =============================== */

  window.ModuleBondFormationEngine = Object.freeze({
    evaluate,
    getState: snapshot,
    reset,
    version: "1.0",
    role: "relational-bond-formation"
  });

})();
