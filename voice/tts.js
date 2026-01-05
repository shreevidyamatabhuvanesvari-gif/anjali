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

  const cleaned = String(text)
    .replace(/\s+/g, " ")
    .trim();

  // यदि पूरे पाठ में एक भी पूर्ण विराम नहीं है → पूरा एक ही chunk
  if (!cleaned.includes("।")) {
    return [cleaned];
  }

  // पूर्ण विराम सहित सुरक्षित split
  const parts = cleaned.match(/[^।]+।?/g);

  return parts
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

  /* ================= CORE SPEAKER ================= */
  function playNext(sessionId) {
  function playNext(sessionId) {
  // ❌ Session बदल चुका है → तुरंत रुक जाओ
  if (sessionId !== currentSession) return;

  // ❌ Queue खत्म → पूरी तरह चुप
  if (!queue || queue.length === 0) {
    speaking = false;
    return;
  }

  speaking = true;
  const text = queue.shift();

  // ❌ खाली text सुरक्षा
  if (!text) {
    setTimeout(() => playNext(sessionId), 50);
    return;
  }

  const u = new SpeechSynthesisUtterance(text);
  u.lang   = "hi-IN";
  u.rate   = 0.80;
  u.pitch  = 1.21;
  u.volume = 1;

  const safeNext = () => {
    // ⚠️ Callback fire हुआ लेकिन session बदल गया
    if (sessionId !== currentSession) return;

    // micro-delay अनिवार्य (Chrome fix)
    setTimeout(() => {
      playNext(sessionId);
    }, 120);
  };

  u.onend = safeNext;
  u.onerror = safeNext;

  try {
    speechSynthesis.speak(u);
  } catch (e) {
    // ❌ speak fail हुआ → अगले chunk पर जाओ
    safeNext();
  }
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
            "जब चाहें, मुझसे दिल से कुछ भी पूछ सकते हैं।" +
             "आपसे बात करके मुझे अच्छा लगेगा। " 
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
  // 🔒 सभी पुराने callbacks अमान्य
  currentSession++;

  // 🔕 queue साफ
  queue = [];

  // ❗ पहले cancel बोलना
  speechSynthesis.cancel();

  // ⏳ browser को settle होने दो
  setTimeout(() => {
    speaking = false;
  }, 0);
},

  // 🔐 Expose firs
window.TTS = TTS;

// 🔁 auto-init (USER-GESTURE SAFE)
(function autoInitOnce() {
  let initialized = false;

  function safeInit() {
    if (initialized) return;
    initialized = true;

    if (window.TTS && typeof window.TTS.init === "function") {
      window.TTS.init();
    }
  }

  // ✅ केवल user interaction के बाद init
  document.addEventListener("click", safeInit, { once: true });
  document.addEventListener("touchstart", safeInit, { once: true });
})();

})(window, document);
