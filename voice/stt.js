/* =========================================================
   voice/stt.js
   Role: HUMAN-LIKE Speech-To-Text Driver (BARGE-IN ENABLED)
   GUARANTEE:
   - TTS बोलते समय भी STT सुनेगा
   - User interrupt कर सकता है
   - TTS की अपनी आवाज़ ignore होगी
   - 2-minute idle logic स्थिर
   ========================================================= */

(function (window) {
  "use strict";

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.error("STT not supported");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "hi-IN";
  recognition.interimResults = false;
  recognition.continuous = false;

  let active = false;
  let listening = false;
  let idleTimer = null;

  const IDLE_LIMIT = 120000; // 2 minutes

  /* ==================================================
     ⏱️ IDLE TIMER
     ================================================== */
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      listening = false;
      try { recognition.stop(); } catch (_) {}
      console.log("⏹️ Mic closed (idle)");
    }, IDLE_LIMIT);
  }

  /* ==================================================
     🎤 START LISTENING
     ================================================== */
  function start() {
    if (active || !listening) return;

    try {
      recognition.start();
      active = true;
      resetIdleTimer();
      console.log("🎤 Listening...");
    } catch (e) {
      console.error("STT start error", e);
    }
  }

  /* ==================================================
     🎧 RESULT (USER SPOKE)
     ================================================== */
  recognition.onresult = async function (event) {
    active = false;

    if (!event.results || !event.results[0]) return;
    const transcript = event.results[0][0].transcript.trim();
    if (!transcript) return;

    console.log("👂 Heard:", transcript);
    resetIdleTimer();

    /* ==================================================
       🛑 BARGE-IN DETECTION
       ================================================== */
    if (window.TTS && TTS.isSpeaking()) {
      // यूज़र ने बीच में बोला → TTS बंद
      TTS.stop();
      console.log("✋ User interrupted TTS");
    }

    /* ---------- READING MODE ---------- */
    if (window.ReadingMode && ReadingMode.isActive()) {
      ReadingMode.addText(transcript);
      return;
    }

    /* ---------- ANSWER ---------- */
    let reply = "इस प्रश्न का उत्तर मेरे ज्ञान में नहीं है।";

    try {
      if (window.ReasoningEngine) {
        reply = await ReasoningEngine.reason(transcript);
      } else if (window.AnswerEngine) {
        reply = await AnswerEngine.answer(transcript);
      }
    } catch (e) {
      console.error("Reasoning error:", e);
      reply = "उत्तर देने में मुझे कठिनाई हुई।";
    }

    /* ---------- SPEAK ---------- */
    try {
      if (window.TTS) {
        TTS.speak(reply);
      }
    } catch (e) {
      console.error("TTS error:", e);
    }

    /* ---------- PASSIVE MEMORY ---------- */
    setTimeout(() => {
      try {
        if (window.ContextMemory) {
          ContextMemory.addUserUtterance(transcript);
          ContextMemory.addAnjaliReply(reply);
        }
      } catch (_) {}
    }, 0);

    /* ---------- CONTINUE LISTENING ---------- */
    waitForSpeechEnd(() => {
      if (listening) start();
    });
  };

  /* ==================================================
     🔚 END / ERROR
     ================================================== */
  recognition.onend = function () {
    active = false;
    if (listening) {
      setTimeout(start, 300);
    }
  };

  recognition.onerror = function () {
    active = false;
    if (listening) {
      setTimeout(start, 600);
    }
  };

  /* ==================================================
     🧰 UTILITY
     ================================================== */
  function waitForSpeechEnd(cb) {
    const i = setInterval(() => {
      if (!(window.TTS && TTS.isSpeaking())) {
        clearInterval(i);
        cb();
      }
    }, 120);
  }

  /* ==================================================
     🌐 EXPOSE
     ================================================== */
  window.STT = {
    start() {
      listening = true;
      start();
    },
    stop() {
      listening = false;
      clearTimeout(idleTimer);
      try { recognition.stop(); } catch (_) {}
    }
  };

})(window);
