/* ==========================================================
   MoodStabilizer — v1.0
   ROLE:
   Prevent emotional spikes and enforce smooth transitions.
   ========================================================== */

(function () {
  "use strict";

  const MAX_DELTA = 0.25; // एक चक्र में अधिकतम बदलाव

  function stabilize(targetEmotion, targetIntensity) {
    const current = window.EmotionalStateCore?.getState?.();
    if (!current) return { emotion: targetEmotion, intensity: targetIntensity };

    const delta = targetIntensity - current.intensity;

    const adjustedIntensity =
      Math.abs(delta) > MAX_DELTA
        ? current.intensity + Math.sign(delta) * MAX_DELTA
        : targetIntensity;

    return {
      emotion: targetEmotion,
      intensity: Math.min(1, Math.max(0, adjustedIntensity))
    };
  }

  window.MoodStabilizer = Object.freeze({
    stabilize,
    role: "emotion-smoothing-engine",
    version: "1.0"
  });

})();
