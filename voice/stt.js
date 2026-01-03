/* =========================================================
   voice/stt.js
   Role: CONTINUOUS Speech To Text (2-Min Loop)
   Purpose: Mouth + Ear open together (SAFE)
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

  let active = false;
  let keepAlive = false;
  let stopTimer = null;

  /* ---------- START LISTENING ---------- */
  function start() {
    if (active) return;

    try {
      recognition.start();
      active = true;
      keepAlive = true;
      console.log("🎤 STT started");

      // ⏱️ 2 मिनट बाद खुद बंद
      clearTimeout(stopTimer);
      stopTimer = setTimeout(() => {
        keepAlive = false;
        active = false;
        recognition.stop();
        console.log("⏹️ STT auto-stopped after 2 minutes");
      }, 120000);

    } catch (e) {
      console.error("STT start error", e);
    }
  }

  /* ---------- RESULT ---------- */
  recognition.onresult = async function (event) {
    const transcript = event.results[0][0].transcript.trim();
    console.log("👂 Heard:", transcript);

    // 🧠 उत्तर निकालो
    let reply = "इस प्रश्न का उत्तर मेरे ज्ञान में नहीं है।";

    if (window.AnswerEngine) {
      reply = await AnswerEngine.answer(transcript);
    }

    // 🔊 उत्तर बोलो
    if (window.TTS) {
      TTS.speak(reply);
    }

    // index.html को संकेत
    if (window.onAnjaliAnswered) {
      window.onAnjaliAnswered();
    }

    // 🔁 उत्तर के बाद दोबारा सुनना
    if (keepAlive) {
      waitForSpeechEnd(() => {
        if (keepAlive && !active) {
          start();
        }
      });
    }
  };

  /* ---------- END ---------- */
  recognition.onend = function () {
    active = false;

    // अगर user ने बंद नहीं किया और 2 मिनट बाकी हैं
    if (
      keepAlive &&
      window.speechSynthesis &&
      !speechSynthesis.speaking
    ) {
      setTimeout(() => {
        if (!active && keepAlive) start();
      }, 500);
    }
  };

  recognition.onerror = function () {
    active = false;
    if (keepAlive) {
      setTimeout(() => {
        if (!active) start();
      }, 800);
    }
  };

  /* ---------- WAIT FOR TTS END ---------- */
  function waitForSpeechEnd(cb) {
    const i = setInterval(() => {
      if (
        !window.speechSynthesis ||
        !speechSynthesis.speaking
      ) {
        clearInterval(i);
        cb();
      }
    }, 120);
  }

  /* ---------- EXPOSE ---------- */
  window.STT = {
    start
  };

})(window);
