/* ==========================================================
   EmotionalStateCore — v1.0
   ROLE:
   Maintain Anjali's current internal emotional state
   based on processed emotional signals.
   ========================================================== */

(function () {
  "use strict";

  let currentState = {
    emotion: "neutral",
    intensity: 0.3,
    since: Date.now()
  };

  function update(emotion, intensity) {
    if (!emotion) return;

    currentState = {
      emotion,
      intensity: Math.min(1, Math.max(0, intensity || 0.3)),
      since: Date.now()
    };
  }

  function getState() {
    return { ...currentState };
  }

  function reset() {
    currentState = {
      emotion: "neutral",
      intensity: 0.3,
      since: Date.now()
    };
  }

  window.EmotionalStateCore = Object.freeze({
    update,
    getState,
    reset,
    role: "internal-emotion-core",
    version: "1.0"
  });

})();
