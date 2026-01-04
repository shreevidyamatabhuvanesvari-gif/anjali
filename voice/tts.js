/* =========================================================
   voice/tts.js
   Role: LONG ANSWER SAFE Hindi TTS (Chunked)
   GUARANTEE:
   - 10–20 लाइन का उत्तर पूरा बोलेगा
   - आवाज कभी बीच में नहीं कटेगी
   ========================================================= */

(function (window, document) {
  "use strict";

  if (!("speechSynthesis" in window)) {
    console.error("SpeechSynthesis not supported");
    return;
  }

  let unlocked = false;
  let speakingQueue = [];
  let isSpeaking = false;

  function unlockAudio() {
    if (unlocked) return;
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    speechSynthesis.speak(u);
    unlocked = true;
  }

  document.addEventListener("click", unlockAudio, { once: true });
  document.addEventListener("touchstart", unlockAudio, { once: true });

  /* ---------- TEXT CHUNKER ---------- */
  function splitText(text, maxLen = 220) {
    const parts = [];
    let current = "";

    text.split(" ").forEach(word => {
      if ((current + word).length > maxLen) {
        parts.push(current.trim());
        current = word + " ";
      } else {
        current += word + " ";
      }
    });

    if (current.trim()) parts.push(current.trim());
    return parts;
  }

  /* ---------- SPEAK QUEUE ---------- */
  function speakNext() {
    if (speakingQueue.length === 0) {
      isSpeaking = false;
      return;
    }

    isSpeaking = true;
    const text = speakingQueue.shift();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "hi-IN";
    u.rate = 0.85;
    u.pitch = 1.15;
    u.volume = 1;

    u.onend = () => {
      setTimeout(speakNext, 120); // natural pause
    };

    speechSynthesis.speak(u);
  }

  const TTS = {
    init() {
      unlockAudio();
    },

    speak(text) {
      if (!text) return;

      unlockAudio();
      speechSynthesis.cancel();
      speakingQueue = splitText(String(text));
      speakNext();
    },

    stop() {
      speakingQueue = [];
      speechSynthesis.cancel();
      isSpeaking = false;
    }
  };

  window.TTS = TTS;

})(window, document);
