/* =========================================================
   voice/stt.js
   Role: Idle-based Continuous Listening (USER-DRIVEN)
   Rules:
   1. Answer only ONCE per question
   2. After answering → stay silent
   3. Mic stays open for 2 minutes
   4. Any user speech resets 2-min timer
   5. Close mic only after full 2 min silence
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

  let active = false;          // recognition running
  let listening = false;       // conversation alive
  let idleTimer = null;        // silence timer

  const IDLE_LIMIT = 120000; // 2 minutes

  /* ---------- IDLE TIMER ---------- */
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      listening = false;
      recognition.stop();
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

    const transcript = event.results[0][0].transcript.trim();
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
      console.error(e);
      reply = "उत्तर देने में मुझे कठिनाई हुई।";
    }

    // 🔊 Speak answer ONCE
    if (window.TTS) {
      TTS.speak(reply);
    }

    // 🔕 After answer → SILENT, only listen
    waitForSpeechEnd(() => {
      if (listening) {
        start();
      }
    });
  };

  /* ---------- END ---------- */
  recognition.onend = function () {
    active = false;

    // Restart only if conversation alive and user silence < 2 min
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
    start: function () {
      listening = true;
      start();
    }
  };

})(window);
