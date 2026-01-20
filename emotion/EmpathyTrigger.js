/* ==========================================================
   EmpathyTrigger — v1.0
   ROLE:
   Decide when empathetic response is REQUIRED based on
   user's emotional state trends and intensity.
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     CONFIGURATION
     =============================== */

  const EMPATHY_RULES = {
    grief: { minStability: 0.4, minStrength: 0.5 },
    fear: { minStability: 0.3, minStrength: 0.5 },
    loneliness: { minStability: 0.4, minStrength: 0.4 },
    anger: { minStability: 0.5, minStrength: 0.6 }
  };

  /* ===============================
     CORE LOGIC
     =============================== */

  function shouldTrigger(latestEmotionMap) {
    if (!latestEmotionMap) return false;

    const userState = window.UserStateTracker?.getState?.();
    if (!userState) return false;

    const emotion = userState.dominantState;
    const stability = userState.stability;
    const strength = latestEmotionMap.strength || 0;

    const rule = EMPATHY_RULES[emotion];
    if (!rule) return false;

    // Trigger empathy if user is consistently in distress
    if (stability >= rule.minStability && strength >= rule.minStrength) {
      return {
        trigger: true,
        emotion,
        level: calculateLevel(stability, strength),
        reason: "sustained-emotional-distress"
      };
    }

    return {
      trigger: false
    };
  }

  function calculateLevel(stability, strength) {
    const score = (stability + strength) / 2;
    if (score >= 0.75) return "high";
    if (score >= 0.55) return "medium";
    return "low";
  }

  /* ===============================
     EMPATHY PROFILE
     =============================== */

  function getEmpathyProfile(triggerResult) {
    if (!triggerResult || !triggerResult.trigger) {
      return {
        mode: "neutral",
        guidance: "standard-response"
      };
    }

    switch (triggerResult.level) {
      case "high":
        return {
          mode: "deep-empathy",
          guidance: "slow-pace, validate-feelings, reassure-presence"
        };

      case "medium":
        return {
          mode: "supportive",
          guidance: "acknowledge-feelings, gentle-guidance"
        };

      default:
        return {
          mode: "light-empathy",
          guidance: "soft-tone, brief-validation"
        };
    }
  }

  /* ===============================
     GLOBAL EXPOSURE
     =============================== */

  window.EmpathyTrigger = Object.freeze({
    shouldTrigger,
    getEmpathyProfile,
    version: "1.0",
    role: "empathy-decision-engine"
  });

})();
