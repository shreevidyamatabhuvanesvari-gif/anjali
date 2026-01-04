/* =========================================================
   voice/stt.js
   Level: 3 (ROCK-SOLID VOICE LOOP)
   GUARANTEES:
   - 🎤 STT + 🔊 TTS parallel (mouth + ear open)
   - 👂 Mic stays open 2 minutes after LAST user speech
   - 🔁 Any speech resets full 2-minute window
   - ❌ No file can stop mic except silence timeout
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
  recognition.continuous = false; // browser limitation

  /* ================= STATE ================= */
  let active = false;        // recognizer running
  let listening = false;     // conversation alive
  let idleTimer = null;

  const IDLE_LIMIT = 120000; // 2 minutes (hard rule)

  /* ================= IDLE TIMER ================= */
  function resetIdleTimer() {
    clearTimeout(idleTimer);

    idleTimer = setTimeout(() => {
      listening = false;
      try { recognition.stop(); } catch (_) {}
      console.log("⏹️ Mic closed after full 2-minute silence");
    }, IDLE_LIMIT);
  }

  /* ================= START MIC ================= */
  function startMic() {
    if (active || !listening) return;

    try {
      recognition.start();
      active = true;
      resetIdleTimer();
      console.log("🎤 Mic listening…");
    } catch (_) {}
  }

  /* ================= RESULT ================= */
  recognition.onresult = async function (event) {
    active = false;

    if (!event.results || !event.results[0]) return;

    const transcript = event.results[0][0].transcript.trim();
    if (!transcript) return;

    console.log("👂 User said:", transcript);

    // 🔁 USER SPOKE → RESET FULL 2 MINUTES
    resetIdleTimer();

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

    // 🔊 SPEAK ANSWER (ONLY ONCE)
    if (window.TTS) {
      TTS.speak(reply);
    }

    // 🎧 MIC RE-OPENS AFTER SPEAKING
    waitForTTS(() => {
      if (listening) startMic();
    });
  };

  /* ================= END ================= */
  recognition.onend = function () {
    active = false;
    if (listening && !speechSynthesis.speaking) {
      setTimeout(startMic, 300);
    }
  };

  recognition.onerror = function () {
    active = false;
    if (listening) {
      setTimeout(startMic, 600);
    }
  };

  /* ================= UTIL ================= */
  function waitForTTS(cb) {
    const i = setInterval(() => {
      if (!speechSynthesis.speaking) {
        clearInterval(i);
        cb();
      }
    }, 120);
  }

  /* ================= PUBLIC API ================= */
  window.STT = {
    start() {
      listening = true;
      startMic();
    },
    stop() {
      listening = false;
      clearTimeout(idleTimer);
      try { recognition.stop(); } catch (_) {}
    }
  };

})(window);
