/* =========================================================
   ResponseEngine.js — निर्णय को आवाज़ या अन्य प्रतिक्रिया में बदलना
   ========================================================= */
(function () {
  "use strict";

  /* =========================
     CONFIG
     ========================= */
  const CONFIG = Object.freeze({
    maxErrorLog: 50,
    maxQueueSize: 5,
    persistKey: "ANJALI_RESPONSE_LOG"
  });

  /* =========================
     STATE
     ========================= */
  let speaking = false;
  let responseQueue = [];
  let lastResponse = null;
  const ERROR_LOG = [];

  /* =========================
     ERROR HANDLING
     ========================= */
  function recordError(source, error) {
    ERROR_LOG.push({
      time: new Date().toISOString(),
      source,
      message:
        error && error.message
          ? error.message
          : typeof error === "string"
          ? error
          : JSON.stringify(error)
    });
    if (ERROR_LOG.length > CONFIG.maxErrorLog) ERROR_LOG.shift();
  }
  function safeExecute(fn, source) {
    try {
      return fn();
    } catch (e) {
      recordError(source, e);
      return null;
    }
  }

  /* =========================
     PERSISTENCE
     ========================= */
  function persistResponse(record) {
    safeExecute(() => {
      const existing =
        JSON.parse(localStorage.getItem(CONFIG.persistKey)) || [];
      existing.push(record);
      localStorage.setItem(
        CONFIG.persistKey,
        JSON.stringify(existing.slice(-20))
      );
    }, "PERSISTENCE");
  }

  /* =========================
     VALIDATION (RELAXED BUT SAFE)
     ========================= */
  function validateDecision(decision) {
    if (!decision || typeof decision !== "object") return false;
    if (typeof decision.text !== "string") return false;
    if (!decision.text.trim()) return false;
    return true;
  }

  /* =========================
     QUEUE
     ========================= */
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

  /* =========================
     SPEAK (HARDENED)
     ========================= */
  function speak(decision) {
    if (speaking) return;

    if (
      window.AnjaliCore &&
      typeof window.AnjaliCore.isActive === "function" &&
      !window.AnjaliCore.isActive()
    ) {
      recordError("ANJALI_INACTIVE", "Fallback mode used");
    }

    if (!window.TTS || typeof window.TTS.speak !== "function") {
      recordError("TTS_MISSING", "Speech skipped, text delivered logically");
      speaking = false;
      processQueue();
      return;
    }

    speaking = true;
    lastResponse = {
      text: decision.text,
      confidence: decision.confidence ?? null,
      at: new Date().toISOString()
    };
    persistResponse(lastResponse);

    let completed = false;
    const watchdog = setTimeout(() => {
      if (!completed) {
        recordError("TTS_TIMEOUT", "Forced release");
        speaking = false;
        processQueue();
      }
    }, 8000);

    safeExecute(() => {
      window.TTS.speak(decision.text, () => {
        completed = true;
        clearTimeout(watchdog);
        speaking = false;
        processQueue();
      });
    }, "TTS_SPEAK");
  }

  /* =========================
     EMOTION ENHANCER (SAFE)
     ========================= */
  function enhanceWithEmotion(decision, userText) {
    try {
      if (
        !userText ||
        !window.ContextEmotionMapper ||
        typeof ContextEmotionMapper.map !== "function"
      ) {
        return decision;
      }
      const emotionMap = ContextEmotionMapper.map(userText) || {};
      let prefix = "";
      if (window.RespectTrigger?.shouldTrigger?.(emotionMap, userText)) {
        prefix = "गरिमा के साथ कहूँ तो— ";
      } else if (window.EmpathyTrigger?.shouldTrigger?.(emotionMap)) {
        prefix = "मैं आपकी बात समझ रही हूँ। ";
      }
      return {
        ...decision,
        text: (prefix + decision.text).trim()
      };
    } catch (e) {
      recordError("EMOTION_LAYER", e);
      return decision;
    }
  }

  /* =========================
     ETHICAL FRAMING (SAFE)
     ========================= */
  function applyEthicalFraming(text, report) {
    if (!report || !Array.isArray(report.flags)) return text;
    let prefix = "";
    if (report.flags.includes("self-harm-risk")) {
      prefix = "आपकी सुरक्षा सबसे महत्वपूर्ण है। ";
    } else if (report.flags.includes("violence-risk")) {
      prefix = "शांति और संयम के साथ— ";
    }
    return (prefix + text).trim();
  }

  /* =========================
     PUBLIC ENTRY
     ========================= */
  function onDecision(decision, userText) {
    if (!validateDecision(decision)) {
      recordError("INVALID_DECISION", decision);
      return;
    }
    let finalDecision = { ...decision };
    if (
      window.ModuleEthicalEmotionEngine &&
      typeof ModuleEthicalEmotionEngine.evaluate === "function"
    ) {
      const report = ModuleEthicalEmotionEngine.evaluate(userText, {
        decisionText: decision.text
      });
      if (report && Array.isArray(report.flags) && report.flags.length) {
        finalDecision.text = applyEthicalFraming(
          finalDecision.text,
          report
        );
      }
    }
    finalDecision = enhanceWithEmotion(finalDecision, userText);
    if (!finalDecision.text || !finalDecision.text.trim()) {
      recordError("EMPTY_FINAL_TEXT", finalDecision);
      return;
    }
    enqueueDecision(finalDecision);
  }

  /* =========================
     DIAGNOSTICS
     ========================= */
  function getStatus() {
    return {
      speaking,
      queued: responseQueue.length,
      lastResponse,
      errorCount: ERROR_LOG.length,
      recentErrors: ERROR_LOG.slice(-5),
      level: "4.x-stable",
      mode: "fully-operational"
    };
  }

  /* =========================
     GLOBAL EXPORT
     ========================= */
  Object.defineProperty(window, "ResponseEngine", {
    value: Object.freeze({
      onDecision,
      getStatus,
      level: "4.x-stable",
      purpose: "knowledge → decision → output"
    }),
    writable: false
  });
})();
