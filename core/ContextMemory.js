/* =========================================================
   core/ContextMemory.js
   Level: 3 (Maximum Practical – Passive Only)
   Role: High-Capacity Context Buffer (RAM Based)
   SAFETY GUARANTEE:
   - NO control
   - NO timers
   - NO async
   - NO STT / TTS interaction
   ========================================================= */

(function (window) {
  "use strict";

  /* =====================================================
     CONFIG (SOFT LIMITS – NOT HARD BLOCKS)
     ===================================================== */
  const MAX_ITEMS = 12000;                 // ~150 MB possible
  const MAX_AGE_MS = 30 * 60 * 1000;       // 30 minutes
  const MAX_RAM_MB = 150;                  // design ceiling

  /* =====================================================
     INTERNAL STATE (PASSIVE ONLY)
     ===================================================== */
  let memory = [];

  /* =====================================================
     UTILS (PURE, NO SIDE EFFECTS)
     ===================================================== */
  function now() {
    return Date.now();
  }

  function approximateRAM_MB() {
    try {
      return JSON.stringify(memory).length / (1024 * 1024);
    } catch (_) {
      return 0;
    }
  }

  function cleanup() {
    const cutoff = now() - MAX_AGE_MS;

    // ⛔ Only data trimming — NO control logic
    memory = memory.filter(item => item.time >= cutoff);

    // soft length cap
    if (memory.length > MAX_ITEMS) {
      memory = memory.slice(memory.length - MAX_ITEMS);
    }
  }

  /* =====================================================
     PUBLIC API (PASSIVE STORAGE)
     ===================================================== */
  const ContextMemory = {

    /* ---------- USER SAID ---------- */
    addUserUtterance(text) {
      if (!text) return;

      memory.push({
        role: "user",
        text: String(text),
        time: now()
      });

      cleanup();
    },

    /* ---------- ANJALI REPLIED ---------- */
    addAnjaliReply(text) {
      if (!text) return;

      memory.push({
        role: "anjali",
        text: String(text),
        time: now()
      });

      cleanup();
    },

    /* ---------- FULL CONTEXT ---------- */
    getAll() {
      cleanup();
      return memory.slice(); // copy only
    },

    /* ---------- RECENT CONTEXT ---------- */
    getRecent(n = 10) {
      cleanup();
      return memory.slice(-n);
    },

    /* ---------- LAST ITEM ---------- */
    getLast() {
      cleanup();
      return memory.length ? memory[memory.length - 1] : null;
    },

    /* ---------- CLEAR (MANUAL ONLY) ---------- */
    clear() {
      memory = [];
    },

    /* ---------- INSPECTION (DEBUG SAFE) ---------- */
    stats() {
      return {
        items: memory.length,
        approxRAM_MB: approximateRAM_MB().toFixed(2),
        maxDesignRAM_MB: MAX_RAM_MB
      };
    }
  };

  /* =====================================================
     EXPOSE (READ-ONLY, NO OVERRIDE)
     ===================================================== */
  Object.defineProperty(window, "ContextMemory", {
    value: ContextMemory,
    writable: false,
    configurable: false
  });

})(window);
