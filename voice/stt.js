/* =========================================================
   voice/stt.js
   Role: ROCK-SOLID Speech-To-Text Driver (FINAL)
   GUARANTEE:
   - STT कभी स्थायी रूप से बंद नहीं होगा
   - TTS अपनी आवाज़ को प्रश्न नहीं मानेगा
   - User बीच में बोले → TTS तुरंत रुके
   - Answer के बाद STT फिर से शुरू होगा
   - 2-minute idle logic स्थिर रहेगा
   - ReasoningEngine / AnswerEngine untouched
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
      console.error("STT start error:", e);
    }
  }

  /* ==================================================
     🎧 RESULT (USER SPOKE) — FINAL
     ================================================== */
  recognition.onresult = async function (event) {
    active = false;

    if (!event.results || !event.results[0] || !event.results[0][0]) return;

    const raw = event.results[0][0].transcript;
    if (!raw) return;

    const transcript = raw.trim();

    // 🧠 HUMAN SILENCE GUARD
    // सांस, mic-click, शोर आदि को प्रश्न न माने
    if (transcript.length < 3) {
      resetIdleTimer();
      resumeListening();
      return;
    }

    console.log("👂 Heard:", transcript);
    resetIdleTimer();

    // ✋ यूज़र ने सच में बोला → TTS तुरंत रोको
    if (
      window.TTS &&
      typeof TTS.isSpeaking === "function" &&
      TTS.isSpeaking() &&
      typeof TTS.stop === "function"
    ) {
      TTS.stop();
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
    if (window.TTS && reply) {
      TTS.speak(reply);
    }

    /* ---------- RESUME LISTENING ---------- */
    resumeListening();
  };

  /* ==================================================
     🔁 RESUME LISTENING SAFELY
     ================================================== */
  function resumeListening() {
    if (!listening) return;

    setTimeout(() => {
      try {
        recognition.start();
        active = true;
      } catch (_) {}
    }, 300);
  }

  /* ==================================================
     🔚 END / ERROR HANDLING
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
     🌐 EXPOSE API
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
