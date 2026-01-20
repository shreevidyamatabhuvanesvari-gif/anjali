/* ==========================================================
   TrustMemory — v1.0
   LAYER: 4 (Relational Emotion)
   ROLE:
   Store, evaluate, and protect relational trust
   over time, preventing blind trust or misuse.
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     INTERNAL STATE
     =============================== */

  let trustScore = 0;          // 0 → 1
  let trustEvents = [];
  let lastInteractionAt = null;

  const MAX_EVENTS = 20;
  const MAX_TRUST = 1;
  const MIN_TRUST = 0;

  /* ===============================
     CONFIGURATION
     =============================== */

  const CONFIG = Object.freeze({
    trustGain: 0.07,
    trustLoss: 0.15,
    decayRate: 0.03,
    maxGapMs: 1000 * 60 * 60 * 12 // 12 hours
  });

  /* ===============================
     CORE API
     =============================== */

  function record(event = {}) {
    const now = Date.now();

    applyTimeDecay(now);

    if (event.type === "positive") {
      trustScore += CONFIG.trustGain;
    }

    if (event.type === "negative") {
      trustScore -= CONFIG.trustLoss;
    }

    trustScore = clamp(trustScore);
    lastInteractionAt = now;

    trustEvents.push({
      type: event.type || "neutral",
      reason: event.reason || null,
      at: now
    });

    if (trustEvents.length > MAX_EVENTS) {
      trustEvents.shift();
    }

    return snapshot();
  }

  /* ===============================
     TIME DECAY
     =============================== */

  function applyTimeDecay(now) {
    if (!lastInteractionAt) return;

    const gap = now - lastInteractionAt;
    if (gap > CONFIG.maxGapMs) {
      trustScore -= CONFIG.decayRate;
      trustScore = clamp(trustScore);
    }
  }

  /* ===============================
   SNAPSHOT
   =============================== */

function snapshot() {
  const level = classify(trustScore);

  return {
    trustScore: Number(trustScore.toFixed(2)),
    level,
    recentEvents: trustEvents.slice(-5),
    lastInteractionAt,

    /* 🔑 LAYER-4 CONTROL SIGNALS */
    allowKnowledge: trustScore > 0.25,
    allowPersonalTone: trustScore > 0.4,
    requireCaution: trustScore < 0.2
  };
}

function classify(score) {
  if (score > 0.75) return "high-trust";
  if (score > 0.45) return "moderate-trust";
  if (score > 0.2)  return "low-trust";
  return "guarded";
}

  /* ===============================
     SAFETY RESET
     =============================== */

  function reset() {
    trustScore = 0;
    trustEvents = [];
    lastInteractionAt = null;
  }

  /* ===============================
     UTILITIES
     =============================== */

  function clamp(v) {
    return Math.max(MIN_TRUST, Math.min(MAX_TRUST, v));
  }

  /* ===============================
     GLOBAL EXPOSURE
     =============================== */

  window.TrustMemory = Object.freeze({
    record,
    getState: snapshot,
    reset,
    version: "1.0",
    role: "relational-trust-memory"
  });

})();
