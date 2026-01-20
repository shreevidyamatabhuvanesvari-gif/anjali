/* ==========================================================
   EmotionPerceptionEngine — v1.0
   ROLE:
   Detect primary human emotions from natural language input
   This is NOT sentiment analysis.
   This is emotion intent perception.
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     EMOTION DEFINITIONS
     =============================== */

  const EMOTIONS = {
    grief: ["दुख", "पीड़ा", "टूट", "खो", "मृत्यु", "रोना"],
    fear: ["डर", "भय", "चिंता", "घबराहट", "असुरक्षित"],
    anger: ["गुस्सा", "क्रोध", "नफरत", "अन्याय", "अपमान"],
    hope: ["आशा", "उम्मीद", "भरोसा", "विश्वास"],
    gratitude: ["धन्यवाद", "आभार", "कृतज्ञ"],
    loneliness: ["अकेला", "एकाकी", "कोई नहीं", "सुनने वाला नहीं"],
    dignity: ["सम्मान", "गरिमा", "अधिकार", "स्वाभिमान"],
    curiosity: ["क्यों", "कैसे", "क्या", "समझाइए"],
    neutral: []
  };

  /* ===============================
     NORMALIZATION
     =============================== */

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* ===============================
     CORE PERCEPTION LOGIC
     =============================== */

  function perceive(inputText) {
    const text = normalize(inputText);
    if (!text) {
      return {
        primary: "neutral",
        confidence: 0,
        detected: []
      };
    }

    const detected = [];

    Object.keys(EMOTIONS).forEach(emotion => {
      EMOTIONS[emotion].forEach(keyword => {
        if (text.includes(keyword)) {
          detected.push(emotion);
        }
      });
    });

    if (detected.length === 0) {
      return {
        primary: "neutral",
        confidence: 0.2,
        detected: []
      };
    }

    const frequency = {};
    detected.forEach(e => {
      frequency[e] = (frequency[e] || 0) + 1;
    });

    let primary = null;
    let score = 0;

    Object.keys(frequency).forEach(e => {
      if (frequency[e] > score) {
        score = frequency[e];
        primary = e;
      }
    });

    return {
      primary,
      confidence: Math.min(1, score / 3),
      detected: Object.keys(frequency)
    };
  }

  /* ===============================
     GLOBAL EXPOSURE
     =============================== */

  window.EmotionPerceptionEngine = Object.freeze({
    perceive,
    version: "1.0",
    role: "emotion-intent-detection"
  });

})();
