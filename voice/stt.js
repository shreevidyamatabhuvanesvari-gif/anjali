/* =========================================================
   voice/stt.js
   Role: PURE Speech-To-Text Driver (LEVEL-3 CLEAN)
   RESPONSIBILITY:
   - Voice → Text only
   - No answering
   - No fallback replies
   - No TTS speak
   - Pass transcript forward safely
   ========================================================= */

(function (window) {
  "use strict";

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.error("STT not supported in this browser");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "hi-IN";
  recognition.interimResults = false;
  recognition.continuous = false;

  let active = false;
  let listening = false;
  let idleTimer = null;
  let lastUserQuestion = "";

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
    } catch (_) {}
  }

  /* ==================================================
     🎧 RESULT (USER SPOKE)
     ================================================== */
  recognition.onresult = async function (event) {
    active = false;

    if (!event.results || !event.results[0] || !event.results[0][0]) {
      if (listening) start();
      return;
    }

    const transcript = event.results[0][0].transcript.trim();
    if (!transcript) {
      if (listening) start();
      return;
    }

    /* -------------------------------
       DUPLICATE GUARD
       ------------------------------- */
    if (transcript === lastUserQuestion) {
      resetIdleTimer();
      if (listening) start();
      return;
    }
    lastUserQuestion = transcript;

    /* -------------------------------
       NOISE / SHORT INPUT FILTER
       ------------------------------- */
    if (transcript.length < 4) {
      resetIdleTimer();
      if (listening) start();
      return;
    }

    console.log("👂 Heard:", transcript);
    resetIdleTimer();

    /* -------------------------------
       USER BARGE-IN
       ------------------------------- */
    if (window.TTS && typeof window.TTS.stop === "function") {
      TTS.stop();
    }

    /* -------------------------------
       USER STOP COMMAND
       ------------------------------- */
    const stopWords = ["अब बात बंद", "बाद में बात", "चुप हो जाओ"];
    if (stopWords.some(w => transcript.includes(w))) {
      listening = false;
      try { recognition.stop(); } catch (_) {}
      return;
    }

    /* ==================================================
       👉 PASS TRANSCRIPT FOR DECISION
       STT DOES NOT ANSWER
       ================================================== */
    try {
      if (window.ReasoningEngine && window.ResponseEngine) {
        const decision = await ReasoningEngine.reason(transcript);

        if (decision && decision.text) {
          ResponseEngine.onDecision(decision, transcript);
        } else {
          ResponseEngine.onDecision(
            { text: "मैं इस समय उत्तर नहीं दे पा रही हूँ।" },
            transcript
          );
        }
      } else if (window.ResponseEngine) {
        ResponseEngine.onDecision(
          { text: "प्रणाली अभी तैयार नहीं है।" },
          transcript
        );
      }
    } catch (e) {
      if (window.ResponseEngine) {
        ResponseEngine.onDecision(
          { text: "मुझे उत्तर समझने में क्षणिक कठिनाई हुई।" },
          transcript
        );
      }
    }

    /* -------------------------------
       PASSIVE MEMORY (OPTIONAL)
       ------------------------------- */
    setTimeout(() => {
      try {
        if (window.ContextMemory) {
          ContextMemory.addUserUtterance(transcript);
        }
      } catch (_) {}
    }, 0);

    /* -------------------------------
       CONTINUOUS LOOP
       ------------------------------- */
    waitForSpeechEnd(() => {
      if (listening) start();
    });
  };

  /* ==================================================
     🔚 END / ERROR (SELF-HEAL)
     ================================================== */
  recognition.onend = function () {
    active = false;
    if (listening) setTimeout(start, 300);
  };

  recognition.onerror = function () {
    active = false;
    if (listening) setTimeout(start, 600);
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
  window.STT = Object.freeze({
    start() {
      listening = true;
      start();
    },
    stop() {
      listening = false;
      clearTimeout(idleTimer);
      try { recognition.stop(); } catch (_) {}
    }
  });

})(window);
