/* ==========================================================
   ResponseEngine — Level-4 / Version-4.x
   PURPOSE:
   Receive verified decisions from ReasoningEngine,
   validate + persist them, and deliver controlled
   spoken responses via TTS with full runtime safety.
   ========================================================== */

(function () {
  "use strict";

  /* ======================================================
     CONFIGURATION
     ====================================================== */
  const CONFIG = Object.freeze({
    maxErrorLog: 50,
    maxQueueSize: 5,
    persistKey: "ANJALI_RESPONSE_LOG"
  });

  /* ======================================================
     RUNTIME STATE
     ====================================================== */
  let speaking = false;
  let responseQueue = [];
  let lastResponse = null;
  const ERROR_LOG = [];

  /* ======================================================
     ERROR HANDLING
     ====================================================== */
  function recordError(source, error) {
    ERROR_LOG.push({
      time: new Date().toISOString(),
      source,
      message: error?.message || String(error)
    });
    if (ERROR_LOG.length > CONFIG.maxErrorLog) {
      ERROR_LOG.shift();
    }
  }

  function safeExecute(fn, source) {
    try {
      return fn();
    } catch (e) {
      recordError(source, e);
      return null;
    }
  }

  /* ======================================================
     PERSISTENCE
     ====================================================== */
  function persistResponse(record) {
    safeExecute(() => {
      const existing =
        JSON.parse(localStorage.getItem(CONFIG.persistKey)) || [];
      existing.push(record);
      localStorage.setItem(
        CONFIG.persistKey,
        JSON.stringify(existing.slice(-20))
      );
    }, "RESPONSE_PERSIST");
  }

  /* ======================================================
     VALIDATION
     ====================================================== */
  function validateDecision(decision) {
    return (
      decision &&
      typeof decision.text === "string" &&
      decision.text.trim().length > 0
    );
  }

  /* ======================================================
     QUEUE MANAGEMENT
     ====================================================== */
  function enqueueDecision(decision) {
    if (responseQueue.length >= CONFIG.maxQueueSize) {
      responseQueue.shift();
    }
    responseQueue.push(decision);
    processQueue();
  }

  function processQueue() {
    if (speaking) return;
    const next = responseQueue.shift();
    if (!next) return;
    speak(next);
  }

  /* ======================================================
     SPEAK
     ====================================================== */
  function speak(decision) {
    if (speaking) return;
    if (!window.AnjaliCore?.isActive?.()) return;
    if (!window.TTS?.speak) return;

    speaking = true;

    lastResponse = {
      text: decision.text,
      confidence: decision.confidence,
      at: new Date().toISOString()
    };

    persistResponse(lastResponse);

    safeExecute(() => {
      TTS.speak(decision.text, () => {
        speaking = false;
        processQueue();
      });
    }, "TTS_SPEAK");
  }

  /* ======================================================
     EMOTION ENHANCER (NON-DESTRUCTIVE)
     ====================================================== */
  function enhanceWithEmotion(decision, context = {}) {
    try {
      if (!window.ContextEmotionMapper) return decision;

      const emotionMap = ContextEmotionMapper.map(context.userText || "");
      UserStateTracker?.record?.(emotionMap);

      let finalText = decision.text;

      // 🔑 CareResponseEngine integration
      if (window.CareResponseEngine?.shapeText) {
        finalText = CareResponseEngine.shapeText(finalText, {
          hasKnowledge: context.hasKnowledge,
          ethical: context.ethical
        });
      }

      return {
        ...decision,
        text: finalText,
        emotion: emotionMap?.emotion || "neutral"
      };
    } catch (e) {
      recordError("EMOTION_ENHANCER", e);
      return decision;
    }
  }

  /* ======================================================
     ETHICAL FRAMING
     ====================================================== */
  function applyEthicalFraming(text, report) {
    if (!report?.flags) return text;

    let prefix = "";

    if (report.flags.includes("self-harm-risk")) {
      prefix = "मैं आपकी सुरक्षा को प्राथमिकता देते हुए कहना चाहूँगी— ";
    } else if (report.flags.includes("violence-risk")) {
      prefix = "इस विषय पर शांत दृष्टि ज़रूरी है। ";
    } else if (report.flags.includes("dehumanization-risk")) {
      prefix = "हर व्यक्ति की गरिमा महत्वपूर्ण है। ";
    }

    return prefix + text;
  }

  /* ======================================================
     PUBLIC ENTRY (FROM REASONING)
     ====================================================== */
  function onDecision(decision, userText) {
    if (!validateDecision(decision)) {
      recordError("INVALID_DECISION", decision);
      return;
    }

    let ethicalReport = null;

    if (window.ModuleEthicalEmotionEngine && userText) {
      ethicalReport =
        ModuleEthicalEmotionEngine.evaluate(userText, {
          decisionText: decision.text
        });
    }

    let finalDecision = decision;

    if (ethicalReport?.flags?.length) {
      finalDecision = {
        ...decision,
        text: applyEthicalFraming(decision.text, ethicalReport),
        ethical: ethicalReport
      };
    }

    /* 🔑 यही वह line है जो आपने माँगी थी */
    const enhanced = enhanceWithEmotion(finalDecision, {
      userText,
      hasKnowledge: finalDecision.source !== "fallback",
      ethical: finalDecision.ethical
    });

    enqueueDecision(enhanced);
  }

  /* ======================================================
     DIAGNOSTICS
     ====================================================== */
  function getStatus() {
    return {
      speaking,
      queued: responseQueue.length,
      lastResponse,
      errorCount: ERROR_LOG.length,
      recentErrors: ERROR_LOG.slice(-5),
      level: "4.x"
    };
  }

  /* ======================================================
     GLOBAL EXPOSURE
     ====================================================== */
  window.ResponseEngine = Object.freeze({
    onDecision,
    getStatus,
    level: "4.x",
    purpose: "validated-decision → controlled-speech"
  });

})();
