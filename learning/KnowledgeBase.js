/* =========================================================
   learning/KnowledgeBase.js
   Level: 3 (VOICE-SAFE • SAVE-SAFE • REASONING-READY)
   GUARANTEE:
   - ✅ Old data preserved
   - ✅ Save works immediately
   - ✅ Voice (STT/TTS) unaffected
   ========================================================= */

(function (window) {
  "use strict";

  const DB_NAME = "AnjaliKnowledgeDB";
  const DB_VERSION = 1; // ⚠️ DO NOT CHANGE (data safety)
  const STORE = "qa_store";

  let db = null;

  /* ---------- OPEN DATABASE (SAFE) ---------- */
  function openDB() {
    if (db) return Promise.resolve(db);

    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = function (e) {
        const d = e.target.result;
        if (!d.objectStoreNames.contains(STORE)) {
          d.createObjectStore(STORE, {
            keyPath: "id",
            autoIncrement: true
          });
        }
      };

      req.onsuccess = function (e) {
        db = e.target.result;
        resolve(db);
      };

      req.onerror = function () {
        reject("KnowledgeBase: IndexedDB open failed");
      };
    });
  }

  /* ---------- NORMALIZER (Level-3 Ready) ---------- */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, "")
      .trim();
  }

  /* =========================================================
     PUBLIC API
     ========================================================= */

  const KnowledgeBase = {

    /* ---------- INIT ---------- */
    async init() {
      await openDB();
      return true;
    },

    /* ---------- SAVE ONE (SAFE + CONFIRMED) ---------- */
    async saveOne({ question, answer, tags = [] }) {
      if (!question || !answer) {
        throw new Error("Question and Answer required");
      }

      const d = await openDB();

      return new Promise((resolve, reject) => {
        const tx = d.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);

        store.add({
          question,
          answer,
          tags: Array.isArray(tags) ? tags : [],
          question_norm: normalize(question), // Level-3 ready
          time: Date.now()
        });

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject("Save failed");
      });
    },

    /* ---------- GET ALL (VIEW / REASONING SAFE) ---------- */
    async getAll() {
      const d = await openDB();

      return new Promise((resolve) => {
        const tx = d.transaction(STORE, "readonly");
        const store = tx.objectStore(STORE);
        const req = store.getAll();

        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    },

    /* ---------- STATS (DEBUG SAFE) ---------- */
    async stats() {
      const all = await this.getAll();
      return {
        total_items: all.length,
        approx_RAM_MB:
          (JSON.stringify(all).length / (1024 * 1024)).toFixed(2),
        level: "Level-3 (Stable)",
        voice_safe: true
      };
    }
  };

  /* ---------- EXPOSE (NON-INTRUSIVE) ---------- */
  Object.defineProperty(window, "KnowledgeBase", {
    value: KnowledgeBase,
    writable: false,
    configurable: false
  });

})(window);
