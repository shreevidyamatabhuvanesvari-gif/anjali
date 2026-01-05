/* =========================================================
   voice/tts.js
   Role: CLEAN, RELIABLE, LONG-FORM Hindi TTS
   FIXES:
   - '।' के बाद रुकने वाला bug पूरी तरह ठीक
   - Random बोलना समाप्त
   - Session-safe
   - Auto welcome (once, on load)
   ========================================================= */

(function (window, document) {
  "use strict";

  if (!("speechSynthesis" in window)) {
    console.error("SpeechSynthesis not supported");
    return;
  }

  /* ================= STATE ================= */
  let unlocked = false;
  let currentSession = 0;
  let queue = [];
  let speaking = false;
  let greeted = false;

  /* ================= AUDIO UNLOCK ================= */
  function unlockAudio() {
    if (unlocked) return;
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    speechSynthesis.speak(u);
    unlocked = true;
  }

  document.addEventListener("click", unlockAudio, { once: true });
  document.addEventListener("touchstart", unlockAudio, { once: true });

  /* ================= TEXT CHUNKER ================= */
  function splitIntoChunks(text) {
    if (!text) return [];

    return String(text)
      .replace(/\s+/g, " ")
      .split("।")
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => s + "।");
  }

  /* ================= CORE SPEAKER ================= */
  function playNext(sessionId) {
    // ❌ session बदल चुका → रुक जाओ
    if (sessionId !== currentSession) return;

    if (queue.length === 0) {
      speaking = false;
      return;
    }

    speaking = true;
    const text = queue.shift();

    const u = new SpeechSynthesisUtterance(text);
    u.lang   = "hi-IN";
    u.rate   = 0.80;   // प्राकृतिक, मधुर
    u.pitch  = 1.20;   // स्त्री-स्वर
    u.volume = 1;

    // ⚠️ onend भरोसेमंद नहीं → micro-delay अनिवार्य
    const next = () => {
      setTimeout(() => playNext(sessionId), 120);
    };

    u.onend = next;
    u.onerror = next;

    speechSynthesis.speak(u);
  }

  /* ================= PUBLIC API ================= */
  const TTS = {

    init() {
      unlockAudio();

      // 🌸 स्वागत — केवल एक बार
      if (!greeted) {
        greeted = true;
        setTimeout(() => {
          TTS.speak(
            "नमस्ते। मैं अंजली हूँ। " +
            "आपसे बात करके मुझे अच्छा लगेगा। " +
            "जब चाहें, मुझसे कुछ भी पूछ सकते हैं।"
          );
        }, 400);
      }
    },

    speak(text) {
      if (!text) return;

      unlockAudio();

      // 🔒 नया session — पुराने सभी callbacks अमान्य
      currentSession++;
      speechSynthesis.cancel();
      queue = [];
      speaking = false;

      queue = splitIntoChunks(text);
      if (queue.length === 0) return;

      playNext(currentSession);
    },

    stop() {
      currentSession++;
      queue = [];
      speaking = false;
      speechSynthesis.cancel();
    },

    isSpeaking() {
      return speaking;
    }
  };

  window.TTS = TTS;

  // 🔁 auto-init (बिना refresh बातचीत के लिए)
  setTimeout(() => {
    if (window.TTS) TTS.init();
  }, 300);

})(window, document);
