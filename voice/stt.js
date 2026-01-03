/* =========================================================
   voice/stt.js
   Role: Idle-based Continuous Listening
   Logic:
   - User बोले → timer reset
   - 2 मिनट तक कुछ न बोले → mic बंद
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
  recognition.continuous = false; // browser limit

  let active = false;
  let listening = false;
  let idleTimer = null;

  const IDLE_LIMIT = 120000; // 2 minutes

  /* ---------- IDLE TIMER ---------- */
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      listening = false;
      recognition.stop();
      console.log("⏹️ Mic closed (idle timeout)");
    }, IDLE_LIMIT);
  }

  /* ---------- START LISTENING ---------- */
  function start() {
    if (active) return;

    try {
      recognition.start();
      active = true;
      listening = true;
      resetIdleTimer();
      console.log("🎤 Listening...");
    } catch (e) {
      console.error("STT start error", e);
    }
  }

  /* ---------- RESULT ---------- */
  recognition.onresult = async function (event) {
    active = false;

    const transcript = event.results[0][0].transcript.trim();
    console.log("👂 Heard:", transcript);

    // 🔁 यूज़र बोला → idle reset
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

    // 🔊 एक बार उत्तर
    if (window.TTS) {
      TTS.speak(reply);
    }

    // 🔁 उत्तर के बाद चुपचाप सुनते रहो
    waitForSpeechEnd(() => {
      if (listening) {
        start();
      }
    });
  };

  /* ---------- END ---------- */
  recognition.onend = function () {
    active = false;
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
  window.STT = { start };

})(window);
