/* ==========================================================
   ToneAnalysisEngine — v1.0
   ROLE:
   Detect emotional tone from sentence structure,
   punctuation, intensity and phrasing.
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     TONE SIGNALS
     =============================== */

  const TONE_RULES = [
    { tone: "aggressive", test: t => /!{2,}|!!|गुस्सा|चुप रहो/.test(t) },
    { tone: "distress",   test: t => /\?\?|\.\.\.|क्यों मेरे साथ|अब नहीं/.test(t) },
    { tone: "calm",       test: t => /शांति|ठीक है|समझ गया/.test(t) },
    { tone: "respectful", test: t => /कृपया|धन्यवाद|आदर/.test(t) },
    { tone: "assertive",  test: t => /मैं मानता हूँ|मैं कहता हूँ|स्पष्ट/.test(t) },
    { tone: "curious",    test: t => /\?$|कैसे|क्यों/.test(t) }
  ];

  /* ===============================
     NORMALIZATION
     =============================== */

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  /* ===============================
     CORE TONE ANALYSIS
     =============================== */

  function analyze(inputText) {
    const text = normalize(inputText);
    if (!text) {
      return {
        tone: "neutral",
        confidence: 0
      };
    }

    for (const rule of TONE_RULES) {
      if (rule.test(text)) {
        return {
          tone: rule.tone,
          confidence: 0.7
        };
      }
    }

    return {
      tone: "neutral",
      confidence: 0.3
    };
  }

  /* ===============================
     GLOBAL EXPOSURE
     =============================== */

  window.ToneAnalysisEngine = Object.freeze({
    analyze,
    version: "1.0",
    role: "tone-detection"
  });

})();
