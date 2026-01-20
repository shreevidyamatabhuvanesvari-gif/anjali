/* ==========================================================
   RespectTrigger — v1.0
   ROLE:
   Decide when a response must prioritize dignity, respect,
   boundaries, and ethical firmness over empathy.
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     RESPECT RULES
     =============================== */

  const RESPECT_RULES = {
    dignity: { minStrength: 0.5 },
    anger: { minStrength: 0.6 },
    dominance: { minStrength: 0.6 },
    disrespect: { minStrength: 0.4 }
  };

  /* ===============================
     KEYWORD SIGNALS
     =============================== */

  const DISRESPECT_SIGNALS = [
    "बेकार", "बकवास", "चुप", "तुम कुछ नहीं",
    "औकात", "अपमान", "नौकर", "गाली"
  ];

  /* ===============================
     CORE LOGIC
     =============================== */

  function shouldTrigger(latestEmotionMap, inputText) {
    if (!latestEmotionMap) return { trigger: false };

    const emotion = latestEmotionMap.emotion;
    const strength = latestEmotionMap.strength || 0;

    // Rule-based dignity / anger trigger
    const rule = RESPECT_RULES[emotion];
    if (rule && strength >= rule.minStrength) {
      return {
        trigger: true,
        mode: "dignified-firm",
        reason: "emotion-requires-respect-boundary"
      };
    }

    // Explicit disrespect detection from text
    if (inputText) {
      const text = String(inputText).toLowerCase();
      const hit = DISRESPECT_SIGNALS.some(w => text.includes(w));
      if (hit) {
        return {
          trigger: true,
          mode: "boundary-setting",
          reason: "explicit-disrespect-detected"
        };
      }
    }

    return { trigger: false };
  }

  /* ===============================
     RESPECT PROFILE
     =============================== */

  function getRespectProfile(triggerResult) {
    if (!triggerResult || !triggerResult.trigger) {
      return {
        mode: "normal",
        guidance: "standard-tone"
      };
    }

    switch (triggerResult.mode) {
      case "boundary-setting":
        return {
          mode: "respect-boundary",
          guidance: "firm-tone, clear-limits, no-provocation"
        };

      case "dignified-firm":
      default:
        return {
          mode: "dignified",
          guidance: "calm-firm, uphold-dignity, avoid-softening"
        };
    }
  }

  /* ===============================
     GLOBAL EXPOSURE
     =============================== */

  window.RespectTrigger = Object.freeze({
    shouldTrigger,
    getRespectProfile,
    version: "1.0",
    role: "respect-boundary-decision-engine"
  });

})();
