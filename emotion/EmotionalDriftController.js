/* ==========================================================
   EmotionalDriftController — v1.0
   ROLE:
   Gradually reduce emotional intensity over time.
   ========================================================== */

(function () {
  "use strict";

  const DRIFT_RATE = 0.02; // प्रति कॉल decay

  function applyDrift() {
    const state = window.EmotionalStateCore?.getState?.();
    if (!state) return;

    if (state.intensity <= 0.3) return;

    const newIntensity = Math.max(0.3, state.intensity - DRIFT_RATE);
    window.EmotionalStateCore.update(state.emotion, newIntensity);
  }

  window.EmotionalDriftController = Object.freeze({
    applyDrift,
    role: "emotion-decay-controller",
    version: "1.0"
  });

})();
