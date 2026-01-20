/* ==================================================
   Anjali Core — REAL OPERATIONAL RUNTIME KERNEL
   ================================================== */
(function () {
  "use strict";

  /* ---------- INTERNAL STATE ---------- */
  let _active = false;
  let _startedAt = null;
  let _errorLog = [];

  const CORE_KEY = "__ANJALI_CORE__v1";

  /* ---------- UTILITIES ---------- */
  function now() {
    return new Date().toISOString();
  }

  function checksum(obj) {
    try {
      return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).length;
    } catch {
      return 0;
    }
  }

  function persist() {
    try {
      const payload = {
        a: _active ? 1 : 0,
        s: _startedAt,
      };
      const pack = {
        d: payload,
        c: checksum(payload)
      };
      localStorage.setItem(CORE_KEY, JSON.stringify(pack));
    } catch (e) {
      _errorLog.push({ t: "persist", m: e.message, at: now() });
    }
  }

  function restore() {
    try {
      const raw = localStorage.getItem(CORE_KEY);
      if (!raw) return;

      const pack = JSON.parse(raw);
      if (!pack || !pack.d || pack.c !== checksum(pack.d)) return;

      _active = pack.d.a === 1;
      _startedAt = pack.d.s || null;
    } catch {
      /* ignore corrupted storage */
    }
  }

  restore();

  /* ---------- CORE LIFECYCLE ---------- */
  function start() {
    if (_active) return;

    _active = true;
    _startedAt = now();

    try {
      if (window.TTS && typeof window.TTS.init === "function") {
        window.TTS.init();
      }
    } catch (e) {
      _errorLog.push({ t: "TTS_INIT", m: e.message, at: now() });
    }

    persist();
  }

  function stop() {
    _active = false;
    persist();
  }

  /* ---------- INPUT FLOW ---------- */
  function onUserSpeech(text) {
  if (!_active || typeof text !== "string") return;

  try {
    /* ===============================
       EMOTION PIPELINE (LAYER 1 → 2)
       =============================== */
    if (window.EmotionPipelineBridge) {
      EmotionPipelineBridge.processUserEmotion(text);
    }

    /* ===============================
       REASONING
       =============================== */
    if (
      window.ReasoningEngine &&
      typeof window.ReasoningEngine.process === "function"
    ) {
      window.ReasoningEngine.process(text);
    }
  } catch (e) {
    _errorLog.push({ t: "REASONING", m: e.message, at: now() });
  }
}

  /* ---------- OUTPUT FLOW ---------- */
  function speak(text) {
    if (!_active || !text) return;

    try {
      if (window.TTS && typeof window.TTS.speak === "function") {
        window.TTS.speak(text);
      }
    } catch (e) {
      _errorLog.push({ t: "TTS_SPEAK", m: e.message, at: now() });
    }
  }

  /* ---------- DIAGNOSTIC ---------- */
  function status() {
    return {
      active: _active,
      startedAt: _startedAt,
      subsystems: {
        stt: !!(window.STT && typeof window.STT.start === "function"),
        tts: !!(window.TTS && typeof window.TTS.speak === "function"),
        reasoning: !!(
          window.ReasoningEngine &&
          typeof window.ReasoningEngine.process === "function"
        )
      },
      errorCount: _errorLog.length
    };
  }

  /* ---------- PUBLIC KERNEL ---------- */
  window.AnjaliCore = Object.freeze({
    start,
    stop,
    isActive: () => _active,
    onUserSpeech,
    speakResponse: speak,
    getStatus: status
  });

   window.addEventListener("load", () => {
  console.log("🧠 Anjali Booting...");

  if(window.ContextMemory) ContextMemory.init();
  console.log("✅ Memory Online");

  if(window.KnowledgeBase) KnowledgeBase.init();
  console.log("✅ Knowledge Ready");

  if(window.ReasoningEngine) ReasoningEngine.init();
  console.log("✅ Reasoning Active");

  if(window.KnowledgeAnswerEngine) KnowledgeAnswerEngine.init();
  console.log("✅ Answer Engine Ready");

  if(window.ResponseEngine) ResponseEngine.init();
  console.log("✅ Response Engine Ready");

  if(window.TTS) TTS.init();
  if(window.STT) STT.init();
  console.log("✅ Voice Synced");

  if(window.AnjaliPresence) AnjaliPresence.init();
  console.log("✅ Presence Alive");

  console.log("🚀 Anjali Fully Online");
});

})();
