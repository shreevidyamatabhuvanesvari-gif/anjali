/* =========================================================
   voice/stt.js
   Role: PURE Speech-To-Text Driver (LEVEL-3 CLEAN)
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
  function startListening() {
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
      if (listening) startListening();
      return;
    }

    const transcript = event.results[0][0].transcript.trim();
    if (!transcript) {
      if (listening) startListening();
      return;
    }

    // Duplicate guard
    if (transcript === lastUserQuestion) {
      resetIdleTimer();
      if (listening) startListening();
      return;
    }
    lastUserQuestion = transcript;

    // Noise/short input filter
    if (transcript.length < 4) {
      resetIdleTimer();
      if (listening) startListening();
      return;
    }

    console.log("👂 Heard:", transcript);
    resetIdleTimer();

    // User barge-in: stop any TTS in progress
    if (window.TTS && typeof window.TTS.stop === "function") {
      TTS.stop();
    }

    // User stop command detection
    const stopWords = ["अब बात बंद", "बाद में बात", "चुप हो जाओ"];
    if (stopWords.some(w => transcript.includes(w))) {
      listening = false;
      try { recognition.stop(); } catch (_) {}
      return;
    }

    /* ==================================================
       👉 PASS TRANSCRIPT FOR DECISION
    ================================================== */
    try {
      let answerText;
      // प्राथमिकता: AnswerEngine (जिसे KnowledgeAnswerEngine भी कहा गया हो)
      if (window.AnswerEngine && typeof AnswerEngine.answer === "function") {
        answerText = await AnswerEngine.answer(transcript);
      } else if (window.ReasoningEngine && typeof ReasoningEngine.reason === "function") {
        const decision = await ReasoningEngine.reason(transcript);
        // अगर decision ऑब्जेक्ट है तो text निकालें, नहीं तो fallback
        answerText = decision.text || (typeof decision === 'string' ? decision : "");
      }

      if (answerText) {
        ResponseEngine.onDecision({ text: answerText }, transcript);
      } else {
        ResponseEngine.onDecision(
          { text: "मैं इस समय उत्तर नहीं दे पा रही हूँ।" },
          transcript
        );
      }
    } catch (e) {
      console.error("STT processing error:", e);
      if (window.ResponseEngine) {
        ResponseEngine.onDecision(
          { text: "मुझे उत्तर समझने में क्षणिक कठिनाई हुई।" },
          transcript
        );
      }
    }

    /* ================= Memory (passive) ================= */
    try {
      if (window.ContextMemory) {
        ContextMemory.addUserUtterance(transcript);
      }
    } catch (_) {}

    /* ==================================================
       🔚 CONTINUOUS LOOP
    ================================================== */
    recognition.onend = function () {
      active = false;
      if (listening) setTimeout(startListening, 300);
    };

    recognition.onerror = function () {
      active = false;
      if (listening) setTimeout(startListening, 600);
    };

    // Continue listening if still active
    if (listening) startListening();
  };

  /* ==================================================
     🔚 END / START CONTROL
  ================================================== */
  window.STT = Object.freeze({
    start() {
      listening = true;
      startListening();
    },
    stop() {
      listening = false;
      clearTimeout(idleTimer);
      try { recognition.stop(); } catch (_) {}
    }
  });

})(window);
