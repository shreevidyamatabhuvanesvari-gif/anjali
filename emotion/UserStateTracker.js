/* ==========================================================
   UserStateTracker — v1.0
   ROLE:
   Track ongoing emotional patterns of the user across
   multiple interactions to infer mental state trends.
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     INTERNAL STATE
     =============================== */

  const STATE_WINDOW = 6; // कितनी हालिया बातचीत देखें
  const emotionHistory = [];

  /* ===============================
     UTILITIES
     =============================== */

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function average(arr) {
    if (!arr.length) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  /* ===============================
     CORE TRACKING LOGIC
     =============================== */

  function record(emotionResult) {
    if (!emotionResult || !emotionResult.emotion) return;

    emotionHistory.push({
      emotion: emotionResult.emotion,
      strength: emotionResult.strength || 0.3,
      time: Date.now()
    });

    // Sliding window
    if (emotionHistory.length > STATE_WINDOW) {
      emotionHistory.shift();
    }
  }

  function getState() {
    if (!emotionHistory.length) {
      return {
        dominantState: "neutral",
        stability: 0.5,
        trend: "unknown"
      };
    }

    const count = {};
    const strengthMap = {};

    emotionHistory.forEach(e => {
      count[e.emotion] = (count[e.emotion] || 0) + 1;
      strengthMap[e.emotion] = (strengthMap[e.emotion] || 0) + e.strength;
    });

    let dominant = null;
    let maxScore = 0;

    Object.keys(count).forEach(emotion => {
      const score = count[emotion] * average([strengthMap[emotion]]);
      if (score > maxScore) {
        maxScore = score;
        dominant = emotion;
      }
    });

    // Stability: emotion repetition consistency
    const stability = clamp(count[dominant] / STATE_WINDOW, 0, 1);

    // Trend: rising or easing
    const recent = emotionHistory.slice(-2);
    let trend = "stable";
    if (recent.length === 2) {
      trend =
        recent[1].strength > recent[0].strength
          ? "intensifying"
          : recent[1].strength < recent[0].strength
          ? "easing"
          : "stable";
    }

    return {
      dominantState: dominant || "neutral",
      stability: Number(stability.toFixed(2)),
      trend
    };
  }

  /* ===============================
     RESET (OPTIONAL)
     =============================== */

  function reset() {
    emotionHistory.length = 0;
  }

  /* ===============================
     GLOBAL EXPOSURE
     =============================== */

  window.UserStateTracker = Object.freeze({
    record,
    getState,
    reset,
    version: "1.0",
    role: "user-mental-state-tracking"
  });

})();
