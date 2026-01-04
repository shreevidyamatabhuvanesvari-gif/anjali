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
