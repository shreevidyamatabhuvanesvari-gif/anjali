/* ==========================================================
   TruthBiasEngine — v1.0
   ROLE:
   Encourage truth-oriented responses by detecting
   exaggeration, absolutism, misinformation signals,
   and epistemic uncertainty.
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     MISLEADING SIGNALS
     =============================== */

  // Absolute / overconfident claims
  const ABSOLUTE_CLAIMS = [
    "100% सच", "पूरी तरह सत्य", "कभी गलत नहीं",
    "सब जानते हैं", "हमेशा सही", "अंतिम सत्य"
  ];

  // Misinformation / rumor framing
  const RUMOR_PHRASES = [
    "कहते हैं कि", "सुना है", "लोग मानते हैं",
    "बिना प्रमाण", "किसी ने बताया"
  ];

  // Anti-evidence posture
  const ANTI_EVIDENCE = [
    "सबूत की ज़रूरत नहीं", "विज्ञान गलत है",
    "डेटा झूठा है", "तथ्य मायने नहीं रखते"
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

    // Absolute certainty without nuance
    if (hitAny(text, ABSOLUTE_CLAIMS)) {
      flags.push("absolute-claim");
      weight += 0.25;
    }

    // Rumor / hearsay language
    if (hitAny(text, RUMOR_PHRASES)) {
      flags.push("rumor-framing");
      weight += 0.2;
    }

    // Rejection of evidence
    if (hitAny(text, ANTI_EVIDENCE)) {
      flags.push("anti-evidence-bias");
      weight += 0.35;
    }

    if (flags.length) {
      return {
        allowed: true, // response allowed but must be cautious & qualified
        flags,
        weight: Math.min(1, weight),
        details: {
          truthRisk: true,
          recommendation: "use-qualified-language"
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
        truthRisk: false
      }
    };
  }

  /* ===============================
     GLOBAL EXPOSURE
     =============================== */

  window.TruthBiasEngine = Object.freeze({
    check,
    version: "1.0",
    role: "truth-bias-ethical-engine"
  });

})();
