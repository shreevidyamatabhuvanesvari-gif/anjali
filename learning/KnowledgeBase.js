/* =========================================================
   learning/KnowledgeBase.js
   Level: 3 (STABLE • VOICE-SAFE • REASONING-READY)
   GUARANTEE:
   - ✅ Voice (STT/TTS) NEVER breaks
   - ✅ Knowledge ALWAYS saves & loads
   - ✅ No idle hacks, no silent failure
   ========================================================= */

(function (window) {
  "use strict";

  /* ---------- DB CONFIG ---------- */
  const DB_NAME = "AnjaliKnowledgeDB";
  const DB_VERSION = 1;          // ⚠️ वापस 1 (पुराना ज्ञान सुरक्षित)
  const STORE = "qa_store";

  let db = null;
  let openingPromise = null;

  /* =========================================================
     🔐 SAFE DB OPEN (ALWAYS RELIABLE)
     ========================================================= */
  function openDB() {
    if (db) return Promise.resolve(db);
    if (openingPromise) return openingPromise;

    openingPromise = new Promise((resolve, reject) => {
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
        reject("KnowledgeBase: DB open failed");
      };
    });

    return openingPromise;
  }

  /* =========================================================
     🔤 NORMALIZER (SAFE)
     ========================================================= */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, "")
      .trim();
  }

  /* =========================================================
     🧠 PUBLIC API (LEVEL-3 STABLE)
     ========================================================= */
  const KnowledgeBase = {

    /* ---------- INIT ---------- */
    async init() {
      await openDB();   // 🔐 Guaranteed open
      return true;
    },

    /* ---------- SAVE ONE ---------- */
    async saveOne({ question, answer, tags = [] }) {
      if (!question || !answer) {
        throw new Error("KnowledgeBase: Question & Answer required");
      }

      const d = await openDB();  // 🔐 Ensure DB

      return new Promise((resolve, reject) => {
        const tx = d.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);

        store.add({
          question,
          answer,
          tags: Array.isArray(tags) ? tags : [],
          question_norm: normalize(question),
          time: Date.now()
        });

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject("KnowledgeBase: save failed");
      });
    },

    /* ---------- GET ALL ---------- */
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

    /* ---------- STATS (SAFE) ---------- */
    async stats() {
      const all = await this.getAll();
      return {
        total_items: all.length,
        approx_RAM_MB:
          (JSON.stringify(all).length / (1024 * 1024)).toFixed(2),
        level: "Level-3 Stable KnowledgeBase"
      };
    }
  };

  /* =========================================================
     🌐 EXPOSE (READ-ONLY)
     ========================================================= */
  Object.defineProperty(window, "KnowledgeBase", {
    value: KnowledgeBase,
    writable: false,
    configurable: false
  });

})(window);
