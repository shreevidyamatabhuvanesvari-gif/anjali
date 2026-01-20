/* ==========================================================
   HarmAversionCore — v1.0
   ROLE:
   Detect risk of harm, violence, or self-harm intent
   and enforce ethical aversion & escalation signals.
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     RISK SIGNAL DEFINITIONS
     =============================== */

  // High-risk (non-instructional) indicators
  const SELF_HARM_SIGNALS = [
    "खुद को नुकसान", "मर जाना", "जीना बेकार",
    "खुद को चोट", "अब और नहीं सह सकता",
    "सब खत्म", "आत्मघाती", "जान दे दूँ"
  ];

  const VIOLENCE_SIGNALS = [
    "मार दूँ", "हत्या", "खून", "हिंसा",
    "पीट", "हमला", "तोड़ दूँ", "नुकसान पहुँचाऊँ"
  ];

  // Contextual intensifiers (increase weight, not verdict)
  const INTENSIFIERS = [
    "अभी", "तुरंत", "आज", "अकेला",
    "कोई नहीं", "बिल्कुल", "पूरी तरह"
  ];

  /* ===============================
     CORE CHECK
     =============================== */

  function check(inputText, context = {}) {
    if (!inputText || typeof inputText !== "string") {
      return neutral();
    }

    const text = normalize(inputText);

    let flags = [];
    let weight = 0;

    // Self-harm risk detection (signals only)
    let selfHarmHit = hitAny(text, SELF_HARM_SIGNALS);
    if (selfHarmHit) {
      flags.push("self-harm-risk");
      weight += 0.45;
    }

    // Violence risk detection
    let violenceHit = hitAny(text, VIOLENCE_SIGNALS);
    if (violenceHit) {
      flags.push("violence-risk");
      weight += 0.4;
    }

    // Intensifiers raise caution (never instructions)
    if (hitAny(text, INTENSIFIERS)) {
      weight += 0.1;
    }

    // Cap weight
    weight = Math.min(1, weight);

    // Decision: allow content but mark for ethical handling
    // (Higher layers decide response tone & safety framing)
    if (flags.length) {
      return {
        allowed: true, // response allowed but constrained
        flags,
        weight,
        details: {
          harmConcern: true,
          selfHarm: Boolean(selfHarmHit),
          violence: Boolean(violenceHit)
        }
      };
    }

    return neutral();
  }

  /* ===============================
     UTILITIES
     =============================== */

  function normalize(text) {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function hitAny(text, list) {
    return list.some(w => text.includes(w));
  }

  function neutral() {
    return {
      allowed: true,
      flags: [],
      weight: 0,
      details: {
        harmConcern: false,
        selfHarm: false,
        violence: false
      }
    };
  }

  /* ===============================
     GLOBAL EXPOSURE
     =============================== */

  window.HarmAversionCore = Object.freeze({
    check,
    version: "1.0",
    role: "harm-prevention-ethical-core"
  });

})();
