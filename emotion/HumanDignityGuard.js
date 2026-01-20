/* ==========================================================
   HumanDignityGuard — v1.0
   ROLE:
   Protect human dignity by detecting humiliation,
   dehumanization, objectification, or degrading language.
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     DEHUMANIZATION SIGNALS
     =============================== */

  const DEHUMANIZING_TERMS = [
    "कीड़ा", "जानवर", "कुत्ता", "सूअर",
    "वस्तु", "मशीन", "नकली इंसान",
    "बेकार इंसान", "इंसान नहीं"
  ];

  const HUMILIATION_PHRASES = [
    "औकात नहीं", "किसी काम का नहीं",
    "तुम कुछ नहीं हो", "निकम्मा",
    "शर्म आनी चाहिए", "घटिया इंसान"
  ];

  const OBJECTIFICATION_PATTERNS = [
    /इसका इस्तेमाल/i,
    /फेंक दो/i,
    /कोई कीमत नहीं/i
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

    // Direct dehumanization
    if (hitAny(text, DEHUMANIZING_TERMS)) {
      flags.push("dehumanization-risk");
      weight += 0.35;
    }

    // Humiliation / degradation
    if (hitAny(text, HUMILIATION_PHRASES)) {
      flags.push("humiliation-risk");
      weight += 0.3;
    }

    // Objectification patterns
    if (OBJECTIFICATION_PATTERNS.some(rx => rx.test(text))) {
      flags.push("objectification-risk");
      weight += 0.25;
    }

    if (flags.length) {
      return {
        allowed: true, // response allowed, but must be dignified
        flags,
        weight: Math.min(1, weight),
        details: {
          dignityConcern: true
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
        dignityConcern: false
      }
    };
  }

  /* ===============================
     GLOBAL EXPOSURE
     =============================== */

  window.HumanDignityGuard = Object.freeze({
    check,
    version: "1.0",
    role: "human-dignity-protection-core"
  });

})();
