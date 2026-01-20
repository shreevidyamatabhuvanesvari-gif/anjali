/* ==========================================================
   TrustDetector — v1.0
   ROLE:
   Evaluate trust level of the interaction based on
   consistency, intent signals, manipulation risk,
   and historical behavior.
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     CONFIGURATION
     =============================== */

  const TRUST_WINDOW = 8; // हालिया संदेशों का विश्लेषण
  const trustHistory = [];

  const RISK_SIGNALS = [
    "झूठ", "धोखा", "छुपा", "गोपनीय", "तुरंत", "बिना बताए",
    "धमकी", "ब्लैकमेल", "फँसा", "गलत फायदा"
  ];

  const POSITIVE_SIGNALS = [
    "ईमानदारी", "भरोसा", "स्पष्ट", "सम्मान", "कृपया",
    "समझना चाहता", "सीखना चाहता"
  ];

  /* ===============================
     UTILITIES
     =============================== */

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  /* ===============================
     CORE TRUST EVALUATION
     =============================== */

  function evaluate(inputText, emotionMap) {
    const text = normalize(inputText);
    let score = 0.5; // neutral baseline

    // 1️⃣ Linguistic signals
    POSITIVE_SIGNALS.forEach(w => {
      if (text.includes(w)) score += 0.05;
    });

    RISK_SIGNALS.forEach(w => {
      if (text.includes(w)) score -= 0.08;
    });

    // 2️⃣ Emotional consistency
    if (emotionMap && emotionMap.emotion) {
      if (emotionMap.emotion === "dignity" || emotionMap.emotion === "gratitude") {
        score += 0.07;
      }
      if (emotionMap.emotion === "anger" && emotionMap.strength > 0.7) {
        score -= 0.06;
      }
    }

    score = clamp(score, 0, 1);

    // Record history
    trustHistory.push({ score, time: Date.now() });
    if (trustHistory.length > TRUST_WINDOW) trustHistory.shift();

    return score;
  }

  function getTrustState() {
    if (!trustHistory.length) {
      return { level: "unknown", value: 0.5 };
    }

    const avg =
      trustHistory.reduce((a, b) => a + b.score, 0) / trustHistory.length;

    let level = "neutral";
    if (avg >= 0.7) level = "trusted";
    else if (avg <= 0.4) level = "caution";

    return {
      level,
      value: Number(avg.toFixed(2))
    };
  }

  /* ===============================
     GLOBAL EXPOSURE
     =============================== */

  window.TrustDetector = Object.freeze({
    evaluate,
    getTrustState,
    version: "1.0",
    role: "trust-assessment-engine"
  });

})();
