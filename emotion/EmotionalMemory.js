/* ==========================================================
   EmotionalMemory — v1.0 (Part A)
   ROLE:
   Store recent internal emotional states of Anjali.
   ========================================================== */

(function () {
  "use strict";

  const MAX_MEMORY = 20;
  const memory = [];

  function record(state) {
    if (!state || !state.emotion) return;

    memory.push({
      emotion: state.emotion,
      intensity: state.intensity,
      time: Date.now()
    });

    if (memory.length > MAX_MEMORY) {
      memory.shift();
    }
  }

  function getRecent(n = 5) {
    return memory.slice(-n);
  }

  function getDominant() {
    if (!memory.length) return "neutral";

    const count = {};
    memory.forEach(m => {
      count[m.emotion] = (count[m.emotion] || 0) + 1;
    });

    return Object.keys(count).reduce((a, b) =>
      count[a] > count[b] ? a : b
    );
  }

  window.EmotionalMemory = Object.freeze({
    record,
    getRecent,
    getDominant,
    role: "internal-emotion-memory",
    version: "1.0"
  });

})();
