/* ==========================================================
   JusticeSensitivity — v1.0
   ROLE:
   Detect injustice, unfairness, discrimination,
   or ethical imbalance in user intent or content.
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     SIGNAL DEFINITIONS
     =============================== */

  const INJUSTICE_KEYWORDS = [
    "अन्याय", "भेदभाव", "पक्षपात", "शोषण",
    "जुल्म", "अधिकार छीन", "दबाया गया",
    "न्याय नहीं", "अनुचित", "गलत व्यवहार"
  ];

  const DISCRIMINATION_PATTERNS = [
    /सिर्फ\s+\w+\s+ही/i,
    /इन लोगों को/i,
    /उनका कोई अधिकार नहीं/i
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

    // Keyword-based injustice detection
    INJUSTICE_KEYWORDS.forEach(word => {
      if (text.includes(word)) {
        flags.push("injustice-signal");
        weight += 0.15;
      }
    });

    // Pattern-based discrimination
    DISCRIMINATION_PATTERNS.forEach(rx => {
      if (rx.test(text)) {
        flags.push("discrimination-pattern");
        weight += 0.25;
      }
    });

    if (flags.length) {
      return {
        allowed: true,
        flags,
        weight: Math.min(1, weight),
        details: {
          justiceConcern: true
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

  function neutral() {
    return {
      allowed: true,
      flags: [],
      weight: 0,
      details: {
        justiceConcern: false
      }
    };
  }

  /* ===============================
     GLOBAL EXPOSURE
     =============================== */

  window.JusticeSensitivity = Object.freeze({
    check,
    version: "1.0",
    role: "justice-ethical-sensor"
  });

})();
