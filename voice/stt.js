/* ==========================================================
   STT — Speech To Text (FINAL COMPLETE)
   ROLE:
   - User की आवाज़ सुनना
   - Text निकालना
   - ReasoningEngine.process() को देना
   - बातचीत को लगातार चालू रखना
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

    recognition.onerror = (e) => {
      listening = false;
      console.error("❌ STT Error:", e);
    };

    recognition.onresult = async (event) => {
      try {
        const transcript =
          event.results[0][0].transcript.trim();

        console.log("👤 User said:", transcript);

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

    recognition.onend = () => {
      listening = false;
      console.log("🛑 STT Stopped");

      // 🔁 AUTO-RESTART — यही बातचीत को जीवित रखता है
      if (
        window.AnjaliCore &&
        typeof window.AnjaliCore.isActive === "function" &&
        window.AnjaliCore.isActive()
      ) {
        setTimeout(() => {
          start();
        }, 600); // हल्का विराम (echo से बचाव)
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
