/* ==========================================================
   STT — Speech To Text (FINAL STABLE)
   ROLE:
   1. User की आवाज़ सुनना
   2. Text निकालना
   3. Text को ReasoningEngine.process() को देना
   ❗ खुद उत्तर बनाना या बोलना नहीं
   ========================================================== */

(function () {
  "use strict";

  let recognition = null;
  let listening = false;

  /* ===============================
     INIT
     =============================== */
  function init() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("❌ SpeechRecognition not supported");
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      listening = true;
      console.log("🎤 STT Listening...");
    };

    recognition.onend = () => {
      listening = false;
      console.log("🛑 STT Stopped");
    };

    recognition.onerror = (e) => {
      listening = false;
      console.error("❌ STT Error:", e);
    };

    recognition.onresult = async (event) => {
      try {
        const transcript =
          event.results[0][0].transcript.trim();

        console.log("👤 User said:", transcript);

        /* ===============================
           🔑 CORE FIX — ONLY THIS LINE
           =============================== */
        if (
          window.ReasoningEngine &&
          typeof window.ReasoningEngine.process === "function"
        ) {
          await window.ReasoningEngine.process(transcript);
        } else {
          console.error("❌ ReasoningEngine.process not available");
        }

      } catch (e) {
        console.error("❌ STT RESULT ERROR", e);
      }
    };
  }

  /* ===============================
     START LISTENING
     =============================== */
  function start() {
    if (!recognition) init();
    if (!recognition || listening) return;

    try {
      recognition.start();
    } catch (e) {
      console.error("❌ STT start failed", e);
    }
  }

  /* ===============================
     STOP LISTENING
     =============================== */
  function stop() {
    if (recognition && listening) {
      recognition.stop();
    }
  }

  /* ===============================
     GLOBAL EXPOSURE
     =============================== */
  window.STT = Object.freeze({
    init,
    start,
    stop
  });

})();
