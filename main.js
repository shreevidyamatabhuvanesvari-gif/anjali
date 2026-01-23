// main.js

// सुनिश्चित करें कि DOM पूरी तरह लोड हो चुका है
window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const speakBtn = document.getElementById("speakBtn");

  // AnjaliCore शुरू करें और STT लिसनिंग प्रारंभ करें
  startBtn.onclick = () => {
    AnjaliCore.start();
    STT.start();
    console.log("Anjali सेवा सक्रिय है।");
  };

  // '🔊 Anjali बोले' बटन पर आखिरी उत्तर को आवाज़ में सुनाएं
  speakBtn.onclick = () => {
    const status = document.getElementById("appStatus");
    const lastText = status ? status.textContent.replace(/^Anjali:\s*/, "") : "";
    if (lastText) {
      if (window.TTS) {
        TTS.speak(lastText);
      }
    } else {
      alert("Anjali ने अभी कुछ नहीं कहा है।");
    }
  };
});
