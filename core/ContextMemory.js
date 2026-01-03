/* =========================================================
   core/ContextMemory.js
   Role: Short-Term / Live Conversation Memory (RAM Based)
   Purpose:
   - Maintain recent conversational context
   - Support reasoning & follow-up questions
   - Auto-expire old context safely
   ========================================================= */

(function (window) {
  "use strict";

  /* ---------- CONFIG ---------- */
  const MAX_ITEMS = 50;              // कितने Q-A RAM में रहें
  const MAX_AGE_MS = 15 * 60 * 1000; // 15 मिनट (auto-expire)
  const MAX_RAM_MB = 150;            // Design limit (soft)

  /* ---------- INTERNAL STATE ---------- */
  let memory = [];

  /* ---------- UTILS ---------- */
  function now() {
    return Date.now();
  }

  function cleanup() {
    const cutoff = now() - MAX_AGE_MS;

    // समय से पुराने context हटाओ
    memory = memory.filter(item => item.time >= cutoff);

    // अधिक entries हों तो oldest हटाओ
    if (memory.length > MAX_ITEMS) {
      memory = memory.slice(memory.length - MAX_ITEMS);
    }
  }

  /* ---------- CORE API ---------- */
  const ContextMemory = {

    /* 🔹 नया context जोड़ो */
    add({ question, answer }) {
      if (!question) return;

      memory.push({
        question: String(question),
        answer: answer ? String(answer) : "",
        time: now()
      });

      cleanup();
    },

    /* 🔹 पूरा active context (ReasoningEngine के लिए) */
    getAll() {
      cleanup();
      return memory.map(item => ({
        question: item.question,
        answer: item.answer
      }));
    },

    /* 🔹 सबसे हाल का context */
    getLast() {
      cleanup();
      return memory.length ? memory[memory.length - 1] : null;
    },

    /* 🔹 पिछले N context */
    getRecent(n = 5) {
      cleanup();
      return memory.slice(-n);
    },

    /* 🔹 Context clear (safe reset) */
    clear() {
      memory = [];
    },

    /* 🔹 Debug / inspection (optional) */
    stats() {
      cleanup();
      return {
        items: memory.length,
        approxRAM_MB: (JSON.stringify(memory).length / (1024 * 1024)).toFixed(2),
        maxDesignRAM_MB: MAX_RAM_MB
      };
    }
  };

  /* ---------- EXPOSE (READ-ONLY) ---------- */
  Object.defineProperty(window, "ContextMemory", {
    value: ContextMemory,
    writable: false,
    configurable: false
  });

})(window);
