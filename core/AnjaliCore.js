(function () {
  "use strict";

  const STORAGE_KEY = "ANJALI_CORE_STATE_v1";

  /* ---------- INTERNAL STATE ---------- */
  let state = {
    active: false,
    startedAt: null,
    sessionId: null,
    lastInput: null,
    lastOutput: null,
    errorLog: []
  };

  /* ---------- STATE RECOVERY ---------- */
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        state = { ...state, ...parsed };
      }
    }
  } catch (_) {
    // corrupt state ignored deliberately
  }

  /* ---------- PERSISTENCE ---------- */
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      state.errorLog.push({
        type: "PERSISTENCE",
        at: Date.now(),
        message: e.message
      });
    }
  }

  /* ---------- LIFECYCLE ---------- */
  function start() {
    if (state.active) return;

    state.active = true;
    state.startedAt = Date.now();
    state.sessionId = "sess_" + Math.random().toString(36).slice(2);

    if (window.TTS && typeof window.TTS.init === "function") {
      try {
        window.TTS.init();
      } catch (e) {
        state.errorLog.push({
          type: "TTS_INIT",
          at: Date.now(),
          message: e.message
        });
      }
    }

    persist();
  }

  function stop() {
    state.active = false;
    persist();
  }

  /* ---------- INPUT PIPELINE ---------- */
  function ingestUserText(text) {
    if (!state.active || typeof text !== "string") return;

    state.lastInput = {
      text,
      at: Date.now()
    };

    if (
      window.ReasoningEngine &&
      typeof window.ReasoningEngine.process === "function"
    ) {
      try {
        window.ReasoningEngine.process(text);
      } catch (e) {
        state.errorLog.push({
          type: "REASONING",
          at: Date.now(),
          message: e.message
        });
      }
    }

    persist();
  }

  /* ---------- OUTPUT PIPELINE ---------- */
  function emitResponse(text) {
    if (!state.active || typeof text !== "string") return;

    state.lastOutput = {
      text,
      at: Date.now()
    };

    if (window.TTS && typeof window.TTS.speak === "function") {
      try {
        window.TTS.speak(text);
      } catch (e) {
        state.errorLog.push({
          type: "TTS_SPEAK",
          at: Date.now(),
          message: e.message
        });
      }
    }

    persist();
  }

  /* ---------- DIAGNOSTIC TRUTH ---------- */
  function getStatus() {
    return {
      active: state.active,
      sessionId: state.sessionId,
      uptimeMs: state.startedAt ? Date.now() - state.startedAt : 0,
      io: {
        hasInput: !!state.lastInput,
        hasOutput: !!state.lastOutput
      },
      voice: {
        stt: !!(window.STT && typeof window.STT.start === "function"),
        tts: !!(window.TTS && typeof window.TTS.speak === "function")
      },
      reasoningReady:
        !!(window.ReasoningEngine &&
           typeof window.ReasoningEngine.process === "function"),
      errorCount: state.errorLog.length
    };
  }

  /* ---------- PUBLIC CORE ---------- */
  window.AnjaliCore = {
    start,
    stop,
    isActive: () => state.active,
    ingestUserText,
    emitResponse,
    getStatus
  };

})();
