/* =========================================================
   voice/stt.js
   Role: Advanced Idle-based Continuous Listening
   Supports:
   - Reading Mode (article reading with control commands)
   - Reasoning Mode (Q&A)
   - Stable 2-minute silence logic (resettable)
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
  let listening = false;     // mic allowed
  let idleTimer = null;

  const IDLE_LIMIT = 120000; // 2 minutes

  /* ==================================================
     🎛️ CONTROL COMMANDS (Reading Mode)
     ================================================== */
  const CONTROL_COMMANDS = {
    STOP: ["रुको", "बस", "ठहरो", "बंद"],
    EXIT: ["अब बात करो", "बातचीत शुरू", "रीडिंग बंद"],
    NEXT: ["आगे पढ़ो", "अगला हिस्सा"],
    AGAIN: ["फिर पढ़ो", "दोबारा पढ़ो"]
  };

  function matchCommand(text, list) {
    return list.some(cmd => text.includes(cmd));
  }

  /* ==================================================
     ⏱️ IDLE TIMER (STABLE, MODE-AWARE)
     ================================================== */
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
      console.error("STT start error", e);
    }
  }

  /* ==================================================
     🎧 RESULT (USER SPOKE)
     ================================================== */
  recognition.onresult = async function (event) {
    active = false;

    if (!event.results || !event.results[0]) return;

    const transcript = event.results[0][0].transcript.trim();
    if (!transcript) return;

    console.log("👂 Heard:", transcript);

    // ✅ हर स्थिति में idle reset (बहुत ज़रूरी)
    resetIdleTimer();

    /* ==================================================
       📖 READING MODE — CONTROL COMMAND LISTENING
       ================================================== */
    if (window.ReadingMode && ReadingMode.isActive()) {

      // 🛑 STOP / PAUSE
      if (matchCommand(transcript, CONTROL_COMMANDS.STOP)) {
        ReadingMode.stop();
        if (window.TTS) TTS.speak("ठीक है, मैं रुक गई हूँ।");
        return;
      }

      // 🔁 EXIT READING → REASONING MODE
      if (matchCommand(transcript, CONTROL_COMMANDS.EXIT)) {
        ReadingMode.stop();
        if (window.TTS) TTS.speak("ठीक है, अब हम बात कर सकते हैं।");
        return;
      }

      // ▶️ NEXT PART
      if (matchCommand(transcript, CONTROL_COMMANDS.NEXT)) {
        ReadingMode.next();
        return;
      }

      // 🔄 AGAIN
      if (matchCommand(transcript, CONTROL_COMMANDS.AGAIN)) {
        ReadingMode.repeat();
        return;
      }

      // ❗ Reading Mode में सामान्य शब्द अनदेखे
      console.log("📖 ReadingMode active — content ignored");
      return;
    }

    /* ==================================================
       🧠 CONTEXT MEMORY (USER)
       ================================================== */
    if (window.ContextMemory) {
      ContextMemory.addUserUtterance(transcript);
    }

    /* ==================================================
       🧠 REASONING / ANSWER
       ================================================== */
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

    /* ==================================================
       🧠 CONTEXT MEMORY (ANJALI)
       ================================================== */
    if (window.ContextMemory) {
      ContextMemory.addAnjaliReply(reply);
    }

    /* ==================================================
       🔊 SPEAK ANSWER (ONCE)
       ================================================== */
    if (window.TTS) {
      TTS.speak(reply);
    }

    /* ==================================================
       🔕 उत्तर के बाद → सुनते रहो
       ================================================== */
    waitForSpeechEnd(() => {
      if (listening) {
        start();
      }
    });
  };

  /* ==================================================
     🔚 END / ERROR HANDLING
     ================================================== */
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

  /* ==================================================
     🔧 UTILITY
     ================================================== */
  function waitForSpeechEnd(cb) {
    const i = setInterval(() => {
      if (!speechSynthesis.speaking) {
        clearInterval(i);
        cb();
      }
    }, 120);
  }

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
      try {
        recognition.stop();
      } catch (_) {}
    }
  };

})(window);
