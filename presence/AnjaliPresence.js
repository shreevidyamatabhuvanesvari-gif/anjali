/* ==============================
   Anjali Presence System
   ============================== */

window.AnjaliPresence = {

  audioUnlocked: false,
  conversationActive: false,

  init() {
    console.log("✅ Presence System Online");
  },

  updateEmotion(emotion) {
    const emo = document.getElementById("emotionStatus");
    if (!emo) return;

    const map = {
      happy: "😊 प्रसन्न",
      sad: "😔 उदास",
      caring: "🌸 स्नेहपूर्ण",
      thinking: "🤔 विचारशील",
      neutral: "😌 शांत"
    };

    emo.textContent = "भाव: " + (map[emotion] || map.neutral);
  },

  startConversation() {
    const status = document.getElementById("appStatus");
    if (!status) return;

    if (window.TTS && !this.audioUnlocked) {
      TTS.init();
      this.audioUnlocked = true;
    }

    this.conversationActive = true;
    status.textContent = "मैं सुन रही हूँ…";
    this.updateEmotion("neutral");

    if (window.STT_LongListening) {
      STT_LongListening.start();
    } else if (window.STT) {
      STT.start();
    }

    // Diagnostic केवल एक बार
    if (window.runAnjaliDiagnostic && !window.__anjaliDiagnosticRan) {
      window.__anjaliDiagnosticRan = true;
      setTimeout(() => window.runAnjaliDiagnostic(), 300);
    }
  }
};

/* Called by Answer Engine */
window.onAnjaliAnswered = function (emotion) {
  if (!window.AnjaliPresence.conversationActive) return;

  AnjaliPresence.updateEmotion(emotion || "neutral");

  const status = document.getElementById("appStatus");
  if (status) status.textContent = "मैं सुन रही हूँ…";

  setTimeout(() => {
    if (window.STT_LongListening) {
      STT_LongListening.start();
    } else if (window.STT) {
      STT.start();
    }
  }, 500);
};

/* Button Binding */
window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  if (startBtn) startBtn.onclick = () => AnjaliPresence.startConversation();

  const adminBtn = document.getElementById("adminBtn");
  if (adminBtn) adminBtn.onclick = () => window.open("admin.html", "_blank");
});
