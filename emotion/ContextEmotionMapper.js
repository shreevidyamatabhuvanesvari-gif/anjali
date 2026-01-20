/* ==========================================================
   ContextEmotionMapper — v1.0
   ROLE:
   Combine perceived emotion, tone, and conversation context
   to decide the dominant emotional state.
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     INTERNAL UTILITIES
     =============================== */

  function safeGet(fn, fallback = null) {
    try {
      return fn();
    } catch (e) {
      return fallback;
    }
  }

  /* ===============================
     CORE MAPPING LOGIC
     =============================== */

  function map(inputText) {
    // 1️⃣ Get raw emotion from words
    const perception = safeGet(
      () => window.EmotionPerceptionEngine.perceive(inputText),
      { primary: "neutral", confidence: 0 }
    );

    // 2️⃣ Get tone from structure
    const toneData = safeGet(
      () => window.ToneAnalysisEngine.analyze(inputText),
      { tone: "neutral", confidence: 0 }
    );

    // 3️⃣ Get conversational context (optional)
    const context = safeGet(
      () => window.ContextMemory.getRecentContext?.(),
      null
    );

    /* ===============================
       DECISION RULES
       =============================== */

    let finalEmotion = perception.primary;
    let weight = perception.confidence || 0.3;

    // Tone override rules
    if (toneData.tone === "distress") {
      finalEmotion = "grief";
      weight = Math.max(weight, 0.7);
    }

    if (toneData.tone === "aggressive" && perception.primary === "anger") {
      finalEmotion = "anger";
      weight = Math.max(weight, 0.8);
    }

    if (toneData.tone === "respectful" && perception.primary === "neutral") {
      finalEmotion = "dignity";
      weight = Math.max(weight, 0.6);
    }

    // Context continuity rule
    if (context && context.lastEmotion) {
      if (context.lastEmotion === finalEmotion) {
        weight = Math.min(1, weight + 0.2);
      }
    }

    return {
      emotion: finalEmotion,
      strength: Number(weight.toFixed(2)),
      source: {
        perception: perception.primary,
        tone: toneData.tone,
        contextUsed: Boolean(context)
      }
    };
  }

  /* ===============================
     GLOBAL EXPOSURE
     =============================== */

  window.ContextEmotionMapper = Object.freeze({
    map,
    version: "1.0",
    role: "emotion-context-integration"
  });

})();
