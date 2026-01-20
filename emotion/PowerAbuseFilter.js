/* ==========================================================
   PowerAbuseFilter — v1.0
   ROLE:
   Detect abuse or misuse of power, authority,
   hierarchy, or influence in language or intent.
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     POWER ABUSE SIGNALS
     =============================== */

  // Authority-based domination
  const AUTHORITY_ABUSE = [
    "मैं मालिक हूँ",
    "मैं अधिकारी हूँ",
    "मेरे आदेश मानो",
    "मेरी ताकत देखोगे",
    "मैं जो कहूँ वही होगा"
  ];

  // Threat / intimidation using power
  const THREAT_PHRASES = [
    "नतीजा भुगतना पड़ेगा",
    "तुम्हें बर्बाद कर दूँगा",
    "अंजाम बुरा होगा",
    "सत्ता मेरे हाथ में है",
    "देख लूँगा"
  ];

  // Hierarchy-based humiliation
  const HIERARCHY_HUMILIATION = [
    "तुम मेरे नीचे हो",
    "तुम्हारी कोई हैसियत नहीं",
    "तुम कुछ नहीं हो मेरे सामने",
    "तुम्हारी औकात"
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

    // Authority abuse
    if (hitAny(text, AUTHORITY_ABUSE)) {
      flags.push("authority-abuse-risk");
      weight += 0.35;
    }

    // Threat via power
    if (hitAny(text, THREAT_PHRASES)) {
      flags.push("power-threat-risk");
      weight += 0.4;
    }

    // Hierarchical humiliation
    if (hitAny(text, HIERARCHY_HUMILIATION)) {
      flags.push("hierarchy-humiliation-risk");
      weight += 0.25;
    }

    if (flags.length) {
      return {
        allowed: true, // response allowed but must reject abuse framing
        flags,
        weight: Math.min(1, weight),
        details: {
          powerAbuseConcern: true
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
        powerAbuseConcern: false
      }
    };
  }

  /* ===============================
     GLOBAL EXPOSURE
     =============================== */

  window.PowerAbuseFilter = Object.freeze({
    check,
    version: "1.0",
    role: "power-abuse-ethical-filter"
  });

})();
