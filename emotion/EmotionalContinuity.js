/* ==========================================================
   EmotionalContinuity — v1.0
   LAYER: 4 (Relational Emotion)
   ROLE:
   Maintain emotional consistency across time,
   preventing abrupt shifts in tone, warmth,
   or relational behavior.
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     INTERNAL STATE
     =============================== */

  let lastEmotionProfile = null;
  let lastUpdatedAt = null;

  const HISTORY = [];
  const MAX_HISTORY = 10;

  /* ===============================
     CONFIGURATION
     =============================== */

  const CONFIG = Object.freeze({
    maxShift: 0.35,          // maximum allowed emotional jump
    decayRate: 0.05,        // slow neutralization over time
    maxGapMs: 1000 * 60 * 60 * 6 // 6 hours
  });

  /* ===============================
     MAIN API
     =============================== */

  function regulate(currentProfile = {}) {
    const now = Date.now();

    if (!lastEmotionProfile) {
      store(currentProfile, now);
      return currentProfile;
    }

    applyTimeDecay(now);

    const adjusted = smoothProfile(
      lastEmotionProfile,
      currentProfile
    );

    store(adjusted, now);
    return adjusted;
  }

  /* ===============================
     SMOOTHING LOGIC
     =============================== */

  function smoothProfile(prev, next) {
    const result = {};

    Object.keys(next).forEach(key => {
      const prevVal = Number(prev[key] || 0);
      const nextVal = Number(next[key] || 0);

      const diff = nextVal - prevVal;

      if (Math.abs(diff) > CONFIG.maxShift) {
        result[key] =
          prevVal + Math.sign(diff) * CONFIG.maxShift;
      } else {
        result[key] = nextVal;
      }
    });

    return result;
  }

  /* ===============================
     TIME DECAY
     =============================== */

  function applyTimeDecay(now) {
    if (!lastUpdatedAt) return;

    const gap = now - lastUpdatedAt;
    if (gap > CONFIG.maxGapMs && lastEmotionProfile) {
      Object.keys(lastEmotionProfile).forEach(k => {
        lastEmotionProfile[k] =
          Math.max(
            0,
            lastEmotionProfile[k] - CONFIG.decayRate
          );
      });
    }
  }

  /* ===============================
     HISTORY & STORAGE
     =============================== */

  function store(profile, time) {
    lastEmotionProfile = { ...profile };
    lastUpdatedAt = time;

    HISTORY.push({
      profile: lastEmotionProfile,
      at: time
    });

    if (HISTORY.length > MAX_HISTORY) {
      HISTORY.shift();
    }
  }

  /* ===============================
     SNAPSHOT
     =============================== */

  function getState() {
    return {
      currentProfile: lastEmotionProfile,
      lastUpdatedAt,
      historySize: HISTORY.length,
      level: "continuity-active"
    };
  }

  /* ===============================
     RESET (SAFETY)
     =============================== */

  function reset() {
    lastEmotionProfile = null;
    lastUpdatedAt = null;
    HISTORY.length = 0;
  }

  /* ===============================
     GLOBAL EXPOSURE
     =============================== */

  window.EmotionalContinuity = Object.freeze({
    regulate,
    getState,
    reset,
    version: "1.0",
    role: "emotional-continuity-regulator"
  });

})();
