/* =========================================================
   voice/tts.js
   Role: STRICT, SESSION-BASED Hindi TTS
   BEHAVIOR GUARANTEE:
   - सिर्फ पूछा गया उत्तर बोलेगा
   - पूरा उत्तर बोलेगा (। के बाद भी)
   - अपने आप कभी नहीं बोलेगा
   - उत्तर के बाद पूरी तरह चुप
   - STT / Reasoning / Memory untouched
   ========================================================= */

(function (window, document) {
  "use strict";

  if (!("speechSynthesis" in window)) {
    console.error("SpeechSynthesis not supported");
    return;
  }

  let unlocked = false;

  // 🔒 session control (ROOT FIX)
  let currentSession = 0;
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
     ▶️ PLAY NEXT (SESSION SAFE)
     ================================================== */
  function playNext(sessionId) {
    // ❗ session invalid → HARD STOP
    if (sessionId !== currentSession) return;

    if (queue.length === 0) {
      speaking = false;
      return; // ✅ पूरी तरह चुप
    }

    speaking = true;
    const text = queue.shift();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "hi-IN";
    u.rate = 0.78;
    u.pitch = 1.22;
    u.volume = 1;

    u.onend = () => {
      if (sessionId === currentSession) {
        playNext(sessionId);
      }
    };

    u.onerror = () => {
      if (sessionId === currentSession) {
        playNext(sessionId);
      }
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

      // 🔒 NEW SESSION (ROOT FIX)
      currentSession++;
      speechSynthesis.cancel();
      queue = [];
      speaking = false;

      queue = splitIntoChunks(text);
      if (queue.length === 0) return;

      playNext(currentSession);
    },

    stop() {
      currentSession++;   // invalidate all callbacks
      queue = [];
      speaking = false;
      speechSynthesis.cancel();
    },

    isSpeaking() {
      return speaking;
    }
  };

  window.TTS = TTS;

})(window, document);
