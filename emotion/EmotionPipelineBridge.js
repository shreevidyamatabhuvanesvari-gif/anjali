/* ==========================================================
   EmotionPipelineBridge — v1.0
   ROLE:
   Wire Layer-1 (Emotion Perception) to
   Layer-2 (Core Emotion Matrix) safely.
   ========================================================== */

(function () {
  "use strict";

  function processUserEmotion(inputText) {
    if (!inputText || !window.ContextEmotionMapper) return;

    /* ===============================
       STEP 1: Perceived Emotion
       =============================== */
    const mapped = ContextEmotionMapper.map(inputText);
    if (!mapped || !mapped.emotion) return;

    /* ===============================
       STEP 2: Stabilize Emotion
       =============================== */
    let stabilized = {
      emotion: mapped.emotion,
      intensity: mapped.strength || 0.3
    };

    if (window.MoodStabilizer && window.EmotionalStateCore) {
      stabilized = MoodStabilizer.stabilize(
        stabilized.emotion,
        stabilized.intensity
      );
    }

    /* ===============================
       STEP 3: Update Core Emotional State
       =============================== */
    if (window.EmotionalStateCore) {
      EmotionalStateCore.update(
        stabilized.emotion,
        stabilized.intensity
      );
    }

    /* ===============================
       STEP 4: Record Emotional Memory
       =============================== */
    if (window.EmotionalMemory) {
      EmotionalMemory.record(stabilized);
    }

    /* ===============================
       STEP 5: Adjust Compassion Bias
       =============================== */
    if (window.UserStateTracker && window.CompassionIndex) {
      const userState = UserStateTracker.getState();
      CompassionIndex.adjustByUserState(userState);
    }

    /* ===============================
       STEP 6: Natural Emotional Drift
       =============================== */
    if (window.EmotionalDriftController) {
      EmotionalDriftController.applyDrift();
    }

    return {
      emotion: stabilized.emotion,
      intensity: stabilized.intensity
    };
  }

  /* ===============================
     GLOBAL EXPOSURE
     =============================== */

  window.EmotionPipelineBridge = Object.freeze({
    processUserEmotion,
    version: "1.0",
    role: "layer1-layer2-emotion-bridge"
  });

})();
