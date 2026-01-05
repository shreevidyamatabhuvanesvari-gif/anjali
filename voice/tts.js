/* =========================================================
   voice/tts.js
   Role: STRICT, SESSION-BASED Hindi TTS
   BEHAVIOR GUARANTEE:
   - सिर्फ पूछा गया उत्तर बोलेगा
   - पूरा उत्तर बोलेगा (। के बाद भी)
   - अपने आप कभी नहीं बोलेगा
   - उत्तर के बाद पूरी तरह चुप
   - बीच में नया निर्देश आए तो तुरंत रुक जाएगा
   - STT / Reasoning / Memory untouched
   ========================================================= */

(function (window, document) {
  "use strict";

  if (!("speechSynthesis" in window)) {
    console.error("SpeechSynthesis not supported");
    return;
  }

  /* ==================================================
     🔐 INTERNAL STATE
     ================================================== */
  let unlocked = false;
  let currentSession = 0;   // 🔒 session authority
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
     ✂️ HINDI-SAFE CHUNKER
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
     ▶️ PLAY NEXT CHUNK (SESSION-SAFE)
     ================================================== */
  function playNext(sessionId) {
    // ❌ यदि session बदल गया → तुरंत चुप
    if (sessionId !== currentSession) return;

    if (queue.length === 0) {
      speaking = false;     // ✅ पूर्ण विराम
      return;
    }

    speaking = true;
    const text = queue.shift();

    const u = new SpeechSynthesisUtterance(text);
    u.lang   = "hi-IN";
    u.rate   = 0.78;   // कोमल, मानवीय गति
    u.pitch  = 1.22;   // स्त्री-स्वर
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
     🌐 PUBLIC API (ONLY CONTROL POINT)
     ================================================== */
  const TTS = {

    init() {
      unlockAudio();
    },

    speak(text) {
      if (!text) return;

      unlockAudio();

      // 🔒 नया सत्र = पुराना तुरंत अमान्य
      currentSession++;
      speechSynthesis.cancel();

      queue = [];
      speaking = false;

      queue = splitIntoChunks(text);
      if (queue.length === 0) return;

      playNext(currentSession);
    },

    stop() {
      currentSession++;        // ❌ सभी callbacks अमान्य
      queue = [];
      speaking = false;
      speechSynthesis.cancel();
    },

    isSpeaking() {
      return speaking;
    }
  };

  // 🔐 SAFE EXPOSE
  window.TTS = TTS;

})(window, document);
