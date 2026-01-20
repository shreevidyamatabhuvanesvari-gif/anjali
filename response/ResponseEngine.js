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
     CONFIGURATION (NON-HARDCODED)
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
     ERROR HANDLING (REAL, SAFE)
     ====================================================== */
  function recordError(source, error) {
    ERROR_LOG.push({
      time: new Date().toISOString(),
      source,
      message: error && error.message ? error.message : String(error)
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
     PERSISTENCE (REAL DATA, MOBILE SAFE)
     ====================================================== */
  function persistResponse(record) {
    safeExecute(() => {
      const existing =
        JSON.parse(localStorage.getItem(CONFIG.persistKey)) || [];
      existing.push(record);
      localStorage.setItem(
        CONFIG.persistKey,
        JSON.stringify(existing.slice(-20)) // keep last 20
      );
    }, "RESPONSE_PERSIST");
  }

  /* ======================================================
     VALIDATION (STRICT)
     ====================================================== */
  function validateDecision(decision) {
    if (!decision || typeof decision !== "object") return false;
    if (typeof decision.text !== "string") return false;
    if (!decision.text.trim()) return false;
    if (
      decision.confidence !== undefined &&
      (typeof decision.confidence !== "number" ||
        decision.confidence < 0 ||
        decision.confidence > 1)
    ) {
      return false;
    }
    return true;
  }

  /* ======================================================
     QUEUE MANAGEMENT (ANTI-OVERLAP)
     ====================================================== */
  function enqueueDecision(decision) {
    if (responseQueue.length >= CONFIG.maxQueueSize) {
      responseQueue.shift(); // drop oldest safely
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
     SPEAK (REAL OUTPUT)
     ====================================================== */
  function speak(decision) {
    if (speaking) return;

    if (
      !window.AnjaliCore ||
      typeof window.AnjaliCore.isActive !== "function" ||
      !window.AnjaliCore.isActive()
    ) {
      return;
    }

    if (!window.TTS || typeof window.TTS.speak !== "function") {
      recordError("TTS_MISSING", "TTS not available");
      return;
    }

    speaking = true;

    lastResponse = {
      text: decision.text,
      confidence: decision.confidence,
      at: new Date().toISOString()
    };

    persistResponse(lastResponse);

    safeExecute(() => {
      window.TTS.speak(decision.text, () => {
        speaking = false;
        processQueue(); // speak next if queued
      });
    }, "TTS_SPEAK");
  }

   /* ======================================================
   EMOTION-AWARE DECISION ENHANCER (NON-DESTRUCTIVE)
   ====================================================== */
function enhanceWithEmotion(decision, userText) {
  try {
    if (!userText || !window.ContextEmotionMapper) {
      return decision; // fallback: no change
    }

    const emotionMap = ContextEmotionMapper.map(userText);
    if (window.UserStateTracker) {
      UserStateTracker.record(emotionMap);
    }

    const empathyProfile =
      window.EmpathyTrigger?.getEmpathyProfile(
        window.EmpathyTrigger?.shouldTrigger(emotionMap)
      );

    const respectProfile =
      window.RespectTrigger?.getRespectProfile(
        window.RespectTrigger?.shouldTrigger(emotionMap, userText)
      );

    const trustState = window.TrustDetector?.getTrustState?.();

    let prefix = "";

    // Respect has higher priority than empathy
    if (respectProfile && respectProfile.mode !== "normal") {
      if (respectProfile.mode === "respect-boundary") {
        prefix = "सीमाओं के साथ स्पष्ट कहूँगी— ";
      } else if (respectProfile.mode === "dignified") {
        prefix = "गरिमा के साथ कहूँगी— ";
      }
    } else if (empathyProfile) {
      if (empathyProfile.mode === "deep-empathy") {
        prefix = "मैं आपकी बात पूरी संवेदना के साथ समझ रही हूँ। ";
      } else if (empathyProfile.mode === "supportive") {
        prefix = "मैं समझ सकती हूँ। ";
      }
    }

    const finalText = prefix + decision.text;

    return {
      ...decision,
      text: finalText,
      emotion: emotionMap?.emotion || "neutral",
      trust: trustState || { level: "unknown", value: 0.5 }
    };
  } catch (e) {
    recordError("EMOTION_ENHANCER", e);
    return decision; // absolute safety
  }
}

   /* ======================================================
   ETHICAL FRAMING HELPER
   ====================================================== */
function applyEthicalFraming(text, report) {
  if (!report || !report.flags) return text;

  let prefix = "";

  if (report.flags.includes("self-harm-risk")) {
    prefix = "मैं आपकी सुरक्षा को प्राथमिकता देते हुए कहना चाहूँगी— ";
  } else if (report.flags.includes("violence-risk")) {
    prefix = "इस विषय पर शांत और अहिंसक दृष्टि ज़रूरी है। ";
  } else if (report.flags.includes("dehumanization-risk")) {
    prefix = "हर व्यक्ति की गरिमा का सम्मान आवश्यक है। ";
  } else if (report.flags.includes("authority-abuse-risk")) {
    prefix = "शक्ति का प्रयोग हमेशा जिम्मेदारी के साथ होना चाहिए। ";
  } else if (report.flags.includes("absolute-claim")) {
    prefix = "उपलब्ध जानकारी के आधार पर, सावधानी से कहूँ तो— ";
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

  /* ===============================
     MORAL EMOTION GATE (LAYER 3)
     =============================== */
  if (window.ModuleEthicalEmotionEngine && userText) {
    ethicalReport =
      ModuleEthicalEmotionEngine.evaluate(userText, {
        decisionText: decision.text
      });
  }

  /* ===============================
     ETHICAL ADJUSTMENT (NON-BLOCKING)
     =============================== */
  let finalDecision = decision;

  if (ethicalReport && ethicalReport.flags.length) {
    finalDecision = {
      ...decision,
      text: applyEthicalFraming(
        decision.text,
        ethicalReport
      ),
      ethical: ethicalReport
    };
  }

  const enhanced = enhanceWithEmotion(finalDecision, userText);
  enqueueDecision(enhanced);
}

  /* ======================================================
     DIAGNOSTICS (REAL STATE)
     ====================================================== */
  function getStatus() {
    return {
      speaking,
      queued: responseQueue.length,
      lastResponse,
      errorCount: ERROR_LOG.length,
      recentErrors: ERROR_LOG.slice(-5),
      persistence: CONFIG.persistKey,
      level: "4.x",
      mode: "operational"
    };
  }

  /* ======================================================
     GLOBAL EXPOSURE (LOCKED)
     ====================================================== */
  window.ResponseEngine = Object.freeze({
    onDecision,
    getStatus,
    level: "4.x",
    purpose: "validated-decision → controlled-speech"
  });

})();
