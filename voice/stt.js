/* =========================================================
   voice/stt.js
   Role: Speech To Text + Continuous Conversation (FINAL)
   ========================================================= */

(function (window) {
  "use strict";

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.error("❌ SpeechRecognition not supported");
    return;
  }

  const recognition = new SpeechRecognition();

  // ---------- CONFIG ----------
  recognition.lang = "hi-IN";
  recognition.interimResults = false;
  recognition.continuous = false;

  let isListening = false;

  // ---------- START LISTENING ----------
  function start() {
    if (isListening) return;

    try {
      recognition.start();
      isListening = true;
      console.log("🎤 STT started");
    } catch (e) {
      console.error("STT start error:", e);
      isListening = false;
    }
  }

  // ---------- RESULT ----------
  recognition.onresult = async function (event) {
    const transcript =
      event.results[0][0].transcript.trim();

    console.log("👂 Heard:", transcript);

    // 🔒 तुरंत listening बंद करो
    isListening = false;

    let reply = "इस प्रश्न का उत्तर मेरे ज्ञान में नहीं है।";

    try {
      if (window.AnswerEngine) {
        reply = await AnswerEngine.answer(transcript);
      }
    } catch (e) {
      console.error("Answer error:", e);
    }

    // 🔊 उत्तर बोलो
    if (window.TTS) {
      TTS.speak(reply);
    }

    // 🔁 उत्तर के बाद फिर से सुनने का संकेत
    if (window.onAnjaliAnswered) {
      window.onAnjaliAnswered();
    }
  };

  // ---------- END ----------
  recognition.onend = function () {
    console.log("🎤 STT ended");
    isListening = false;
  };

  recognition.onerror = function (e) {
    console.error("STT error:", e);
    isListening = false;
  };

  // ---------- EXPOSE ----------
  window.STT = {
    start
  };

})(window);
