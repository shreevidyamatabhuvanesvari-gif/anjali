/* =========================================================
   voice/stt.js
   Role: Speech To Text + Answer + Safe Conversation Loop
   FINAL • SAFE • ISOLATED
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

  // ▶️ Start listening
  function start() {
    if (active) return;
    try {
      recognition.start();
      active = true;
      console.log("🎤 Listening started");
    } catch (e) {
      console.error("STT start error:", e);
    }
  }

  // ▶️ जब यूज़र बोल चुका हो
  recognition.onresult = async function (event) {
    active = false;

    const transcript = event.results[0][0].transcript.trim();
    console.log("👂 Heard:", transcript);

    // 🧠 Default fallback
    let reply = "इस प्रश्न का उत्तर मेरे ज्ञान में नहीं है।";

    try {
      if (window.AnswerEngine) {
        reply = await AnswerEngine.answer(transcript);
      }
    } catch (e) {
      console.error("AnswerEngine error:", e);
      reply = "उत्तर देने में त्रुटि हुई।";
    }

    // 🔊 उत्तर बोलो
    if (window.TTS) {
      TTS.speak(reply);
    }

    // 🔁 Safe Conversation Loop को signal
    if (window.onAnjaliAnswered) {
      window.onAnjaliAnswered();
    }
  };

  recognition.onend = function () {
    active = false;
    console.log("🎤 Listening ended");
  };

  recognition.onerror = function (e) {
    active = false;
    console.error("STT error:", e);
  };

  // ▶️ Expose STT API
  window.STT = {
    start
  };

})(window);
