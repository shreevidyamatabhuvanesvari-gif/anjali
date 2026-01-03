/* =========================================================
   voice/stt.js
   Role: Idle-based Continuous Listening (USER-DRIVEN)
   RAM Profile: ~5–10 MB (safe, bounded)
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
  recognition.continuous = false; // browser constraint

  let active = false;        // recognition engine running
  let listening = false;     // conversation session alive
  let idleTimer = null;      // silence timer

  const IDLE_LIMIT = 120000; // 2 minutes (user-defined)

  /* ---------- IDLE TIMER ---------- */
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      listening = false;
      try {
        recognition.stop();
      } catch (_) {}
      console.log("⏹️ Mic closed after 2 minutes of silence");
    }, IDLE_LIMIT);
  }

  /* ---------- START LISTENING ---------- */
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

  /* ---------- RESULT (USER SPOKE) ---------- */
  recognition.onresult = async function (event) {
    active = false;

    if (!event.results || !event.results[0]) return;

    const transcript = event.results[0][0].transcript.trim();
    if (!transcript) return;

    console.log("👂 Heard:", transcript);

    // 🔁 User spoke → reset silence timer
    resetIdleTimer();

    let reply = "इस प्रश्न का उत्तर मेरे ज्ञान में नहीं है।";

    try {
      if (window.ReasoningEngine) {
        reply = await ReasoningEngine.reason(transcript);
      } else if (window.AnswerEngine) {
        reply = await AnswerEngine.answer(transcript);
      }
    } catch (e) {
      console.error("Answer error:", e);
      reply = "उत्तर देने में मुझे कठिनाई हुई।";
    }

    // 🔊 Speak answer ONLY ONCE
    if (window.TTS) {
      TTS.speak(reply);
    }

    // 🔕 After answer → stay silent, keep ear open
    waitForSpeechEnd(() => {
      if (listening) {
        start();
      }
    });
  };

  /* ---------- END ---------- */
  recognition.onend = function () {
    active = false;

    // Restart only if conversation alive and not speaking
    if (listening && !speechSynthesis.speaking) {
      setTimeout(start, 300);
    }
  };

  recognition.onerror = function () {
    active = false;
    if (listening) {
      setTimeout(start, 600);
    }
  };

  /* ---------- UTILITY ---------- */
  function waitForSpeechEnd(cb) {
    const i = setInterval(() => {
      if (!speechSynthesis.speaking) {
        clearInterval(i);
        cb();
      }
    }, 120);
  }

  /* ---------- EXPOSE ---------- */
  window.STT = {
    start() {
      listening = true;
      start();
    },
    stop() {
      listening = false;
      clearTimeout(idleTimer);
      try {
        recognition.stop();
      } catch (_) {}
    }
  };

})(window);
