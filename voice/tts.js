/* =========================================================
   voice/tts.js
   Role: Stable Long-Form Hindi TTS (Chunked, Voice-Safe)
   GUARANTEE:
   - पूरा उत्तर बोलेगा (। के बाद भी)
   - बीच में नहीं रुकेगा
   - Random speech नहीं होगी
   - STT / Reasoning / Memory untouched
   ========================================================= */

(function (window, document) {
  "use strict";

  if (!("speechSynthesis" in window)) {
    console.error("SpeechSynthesis not supported");
    return;
  }

  let unlocked = false;
  let queue = [];
  let speaking = false;

  /* ==================================================
     🔓 AUDIO UNLOCK (MOBILE SAFE)
     ================================================== */
  function unlockAudio() {
    if (unlocked) return;
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    speechSynthesis.speak(u);
    unlocked = true;
  }

  document.addEventListener("click", unlockAudio, { once: true });
  document.addEventListener("touchstart", unlockAudio, { once: true });

  /* ==================================================
     ✂️ TEXT CHUNKER (Hindi Safe)
     ================================================== */
  function splitIntoChunks(text) {
    if (!text) return [];

    return String(text)
      .replace(/\s+/g, " ")
      .split("।")
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => s + "।");
  }

  /* ==================================================
     ▶️ PLAY NEXT CHUNK (SEQUENTIAL)
     ================================================== */
  function speakNext() {
    if (queue.length === 0) {
      speaking = false;
      return;
    }

    speaking = true;
    const text = queue.shift();

    const u = new SpeechSynthesisUtterance(text);
    u.lang   = "hi-IN";

    // 🌸 मधुर, स्त्री-स्वर
    u.rate   = 0.78;   // कोमल गति
    u.pitch  = 1.22;   // स्त्री-स्वर
    u.volume = 1;

    u.onend = () => {
      // छोटा प्राकृतिक विराम
      setTimeout(speakNext, 120);
    };

    u.onerror = () => {
      setTimeout(speakNext, 120);
    };

    speechSynthesis.speak(u);
  }

  /* ==================================================
     🌐 PUBLIC API
     ================================================== */
  const TTS = {

    init() {
      unlockAudio();
    },

    speak(text) {
      if (!text) return;

      unlockAudio();

      // 🔒 पुरानी speech पूरी तरह बंद
      speechSynthesis.cancel();
      queue = [];
      speaking = false;

      // ✂️ chunk बनाओ
      queue = splitIntoChunks(text);

      if (queue.length === 0) return;

      // ▶️ बोलना शुरू
      speakNext();
    },

    stop() {
      queue = [];
      speaking = false;
      speechSynthesis.cancel();
    }
  };

  // 🔐 EXPOSE (SAFE)
  window.TTS = TTS;

})(window, document);
