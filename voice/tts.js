/* =========================================================
   voice/tts.js
   Role: Stable, Soft, Human-like Hindi TTS (OFFLINE)
   ========================================================= */

(function (window, document) {
  "use strict";

  if (!("speechSynthesis" in window)) {
    console.error("SpeechSynthesis not supported");
    return;
  }

  let unlocked = false;

  function unlockAudio() {
    if (unlocked) return;
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
    unlocked = true;
  }

  document.addEventListener("click", unlockAudio, { once: true });
  document.addEventListener("touchstart", unlockAudio, { once: true });

  const TTS = {
    init() {
      unlockAudio();
    },

    speak(text) {
      if (!text) return;

      unlockAudio();
      window.speechSynthesis.cancel();

      const u = new SpeechSynthesisUtterance(text);
      u.lang   = "hi-IN";
      u.rate   = 0.85;   // 🧠 human-like speed
      u.pitch  = 1.15;   // 🌸 soft feminine tone
      u.volume = 1;

      window.speechSynthesis.speak(u);
    },

    stop() {
      window.speechSynthesis.cancel();
    }
  };

  window.TTS = TTS;

})(window, document);
