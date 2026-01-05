/* =========================================================
   voice/tts.js
   Role: CLEAN, RELIABLE, LONG-FORM Hindi TTS
   GUARANTEE:
   - '।' के बाद रुकने वाला bug FIX
   - Random बोलना समाप्त
   - Session-safe
   - Auto welcome (user-gesture safe)
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
    try {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      speechSynthesis.speak(u);
      unlocked = true;
    } catch (_) {}
  }

/* ================= TEXT CHUNKER (CHAR-LENGTH SAFE) ================= */
function splitIntoChunks(text) {
  if (!text) return [];

  const cleaned = String(text)
    .replace(/\s+/g, " ")
    .trim();

  const MAX_CHARS = 140;
  const chunks = [];

  let buffer = "";

  for (let i = 0; i < cleaned.length; i++) {
    buffer += cleaned[i];

    // यदि सीमा के पास पहुँच गए
    if (buffer.length >= MAX_CHARS) {

      // 🔒 सुरक्षित कट ढूँढो (space या punctuation)
      let cutIndex = Math.max(
        buffer.lastIndexOf(" "),
        buffer.lastIndexOf("।"),
        buffer.lastIndexOf(",")
      );

      // यदि कुछ नहीं मिला → ज़बरदस्ती मत काटो
      if (cutIndex < 20) {
        cutIndex = buffer.length;
      }

      let chunk = buffer.slice(0, cutIndex).trim();

      // 🔑 विराम संकेत अनिवार्य
      if (!/[।,]$/.test(chunk)) {
        chunk += "।";
      }

      chunks.push(chunk);
      buffer = buffer.slice(cutIndex).trim();
    }
  }

  // अंतिम हिस्सा
  if (buffer.length > 0) {
    if (!/[।,]$/.test(buffer)) {
      buffer += "।";
    }
    chunks.push(buffer.trim());
  }

  return chunks;
}
  /* ================= CORE SPEAKER ================= */
  function playNext(sessionId) {
    if (sessionId !== currentSession) return;

    if (!queue || queue.length === 0) {
      speaking = false;
      return;
    }

    speaking = true;
    const text = queue.shift();

    if (!text) {
      setTimeout(() => playNext(sessionId), 60);
      return;
    }

    const u = new SpeechSynthesisUtterance(text);
    u.lang   = "hi-IN";
    u.rate   = 0.80;
    u.pitch  = 1.21;
    u.volume = 1;

    const safeNext = () => {
      if (sessionId !== currentSession) return;
      setTimeout(() => playNext(sessionId), 120);
    };

    u.onend = safeNext;
    u.onerror = safeNext;

    try {
      speechSynthesis.speak(u);
    } catch (_) {
      safeNext();
    }
  }

  /* ================= PUBLIC API ================= */
  const TTS = {

    init() {
      unlockAudio();

      if (!greeted) {
        greeted = true;
        setTimeout(() => {
          TTS.speak(
            "नमस्ते। मैं अंजली हूँ। " +
            "आपसे बात करके मुझे अच्छा लगेगा। " +
            "जब चाहें, मुझसे दिल से कुछ भी पूछ सकते हैं।"
          );
        }, 300);
      }
    },

    speak(text) {
      if (!text) return;

      unlockAudio();

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
      speechSynthesis.cancel();
      speaking = false;
    },

    isSpeaking() {
      return speaking;
    }
  };

  /* ================= EXPOSE ================= */
  window.TTS = TTS;

  /* ================= USER INTERRUPT LISTENER ================= */
  window.addEventListener("anjali-user-interrupt", () => {
    if (window.TTS && typeof TTS.stop === "function") {
      TTS.stop();
    }
  });

  /* ================= AUTO INIT (USER-GESTURE SAFE) ================= */
  (function autoInitOnce() {
    let initialized = false;
    function safeInit() {
      if (initialized) return;
      initialized = true;
      if (window.TTS && typeof window.TTS.init === "function") {
        window.TTS.init();
      }
    }
    document.addEventListener("click", safeInit, { once: true });
    document.addEventListener("touchstart", safeInit, { once: true });
  })();
})(window, document);
