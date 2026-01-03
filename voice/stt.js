/* =========================================================
   voice/stt.js
   Role: Continuous Speech To Text + Answer Loop
   FINAL • VERIFIED • SAFE
   ========================================================= */

(function (window) {
  "use strict";

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.error("❌ STT not supported");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "hi-IN";
  recognition.interimResults = false;
  recognition.continuous = false; // हम खुद loop संभालेंगे

  let active = false;

  // ===== START LISTENING =====
  function start() {
    if (active) return;
    try {
      recognition.start();
      active = true;
      console.log("🎤 STT started");
    } catch (e) {
      console.error("STT start error", e);
    }
  }

  // ===== RESULT =====
  recognition.onresult = async function (event) {
    active = false;

    const transcript = event.results[0][0].transcript.trim();
    console.log("👂 Heard:", transcript);

    let reply = "इस प्रश्न का उत्तर मेरे ज्ञान में नहीं है।";

    try {
      if (window.AnswerEngine) {
        reply = await AnswerEngine.answer(transcript);
      }
    } catch (e) {
      console.error("AnswerEngine error", e);
    }

    // 🔊 उत्तर बोलो
    if (window.TTS) {
      TTS.speak(reply);
    }

    // 🔁 उत्तर के बाद conversation loop को संकेत
    if (window.onAnjaliAnswered) {
      window.onAnjaliAnswered();
    }
  };

  // ===== AUTO RESTART (सबसे महत्वपूर्ण) =====
  recognition.onend = function () {
    active = false;
    console.log("🎤 STT ended");

    // 🔁 अगर बातचीत चालू है तो तुरंत फिर से सुनना
    if (window.conversationActive) {
      try {
        recognition.start();
        active = true;
        console.log("🔁 STT auto-restarted");
      } catch (e) {
        console.error("STT restart error", e);
      }
    }
  };

  recognition.onerror = function (e) {
    active = false;
    console.error("STT error", e);
  };

  // ===== EXPOSE =====
  window.STT = { start };

})(window);
