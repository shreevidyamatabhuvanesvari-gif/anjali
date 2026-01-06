/* =========================================================
   voice/stt.js
   Role: HUMAN-LIKE Speech-To-Text Driver (LEVEL-3)
   BEHAVIOR:
   (A) बिना refresh लगातार बातचीत
   (B) TTS के समय अर्ध-सुनना (noise ignore)
   (C) User बोले → TTS तुरंत रुके
   (D) अनंत संवाद चक्र (user बोले तब तक)
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
  recognition.continuous = false;

  let active = false;
  let listening = false;
  let idleTimer = null;
   let lastUserQuestion = "";

  const IDLE_LIMIT = 120000; // 2 minutes

  /* ==================================================
     ⏱️ IDLE TIMER (जीवित रहने हेतु)
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

  /* ===============================
     🛑 DUPLICATE QUESTION GUARD
     =============================== */
  if (transcript === lastUserQuestion) {
    resetIdleTimer();
    if (listening) start();
    return;
  }
  lastUserQuestion = transcript;
    /* -------------------------------
       (B) SEMI-LISTENING FILTER
       शोर / साँस / mic-click ignore
       ------------------------------- */
    if (transcript.length < 4) {
      resetIdleTimer();
      if (listening) start();
      return;
    }

    console.log("👂 Heard:", transcript);
    resetIdleTimer();

    /* -------------------------------
       (C) USER BARGE-IN
       User बोला → TTS तुरंत रुके
       ------------------------------- */
    if (window.TTS && typeof TTS.stop === "function") {
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

    /* -------------------------------
       ANSWER (Reasoning untouched)
       ------------------------------- */
    let reply = "इस प्रश्न का उत्तर मेरे ज्ञान में नहीं है।";

    try {
      if (window.ReasoningEngine) {
        reply = await ReasoningEngine.reason(transcript);
      } else if (window.AnswerEngine) {
        reply = await AnswerEngine.answer(transcript);
      }
    } catch (_) {
      reply = "उत्तर देने में मुझे कठिनाई हुई।";
    }

    /* -------------------------------
       SPEAK FULL ANSWER
       ------------------------------- */
    if (window.TTS && reply) {
      TTS.speak(reply);
    }

    /* -------------------------------
       PASSIVE MEMORY (non-blocking)
       ------------------------------- */
    setTimeout(() => {
      try {
        if (window.ContextMemory) {
          ContextMemory.addUserUtterance(transcript);
          ContextMemory.addAnjaliReply(reply);
        }
      } catch (_) {}
    }, 0);

    /* -------------------------------
       (A + D) CONTINUOUS LOOP
       उत्तर → चुप → फिर सुनना
       ------------------------------- */
    waitForSpeechEnd(() => {
      if (listening) start();
    });
  };

  /* ==================================================
     🔚 END / ERROR (SELF-HEALING)
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
