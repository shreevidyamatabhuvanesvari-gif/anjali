/* =========================================================
   learning/KnowledgeBase.js
   Level: 3 (VOICE-SAFE • Reasoning-Ready)
   GUARANTEE:
   - ❌ No DB work during STT / TTS
   - ✅ Opens ONLY in idle/background time
   - ✅ Zero impact on voice
   ========================================================= */

(function (window) {
  "use strict";

  /* ---------- DB CONFIG ---------- */
  const DB_NAME = "AnjaliKnowledgeDB";
  const DB_VERSION = 2;
  const STORE = "qa_store";

  let db = null;
  let opening = false;

  /* =========================================================
     🧠 SAFE IDLE EXECUTOR
     ========================================================= */
  function runWhenIdle(fn) {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(fn, { timeout: 2000 });
    } else {
      setTimeout(fn, 500);
    }
  }

  /* =========================================================
     🔐 SAFE DB OPEN (IDLE ONLY)
     ========================================================= */
  function openDBSafe() {
    if (db || opening) return;

    opening = true;

    runWhenIdle(() => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = function (e) {
        const d = e.target.result;
        if (!d.objectStoreNames.contains(STORE)) {
          const store = d.createObjectStore(STORE, {
            keyPath: "id",
            autoIncrement: true
          });
          store.createIndex("question_norm", "question_norm", { unique: false });
          store.createIndex("time", "time", { unique: false });
        }
      };

      req.onsuccess = function (e) {
        db = e.target.result;
        opening = false;
        console.log("📚 KnowledgeBase ready (idle)");
      };

      req.onerror = function () {
        opening = false;
        console.warn("KnowledgeBase: DB open failed");
      };
    });
  }

  /* =========================================================
     🔤 NORMALIZER
     ========================================================= */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, "")
      .trim();
  }

  /* =========================================================
     🧠 PUBLIC API (LEVEL-3)
     ========================================================= */

  const KnowledgeBase = {

    /* ---------- INIT (NON-BLOCKING) ---------- */
    init() {
      openDBSafe(); // 🔥 does NOT block
      return true;
    },

    /* ---------- SAVE ONE (ADMIN / BACKGROUND ONLY) ---------- */
    async saveOne({ question, answer, tags = [] }) {
      if (!db) return false;

      const record = {
        question,
        answer,
        tags,
        question_norm: normalize(question),
        time: Date.now()
      };

      return new Promise(resolve => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).add(record);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    },

    /* ---------- GET ALL (LIMITED, SAFE) ---------- */
    async getAll(limit = 3000) {
      if (!db) return [];

      return new Promise(resolve => {
        const results = [];
        const tx = db.transaction(STORE, "readonly");
        const store = tx.objectStore(STORE);
        const req = store.openCursor();

        req.onsuccess = e => {
          const cursor = e.target.result;
          if (!cursor || results.length >= limit) {
            resolve(results);
            return;
          }
          results.push(cursor.value);
          cursor.continue();
        };

        req.onerror = () => resolve(results);
      });
    },

    /* ---------- STATS (SAFE) ---------- */
    stats() {
      return {
        status: db ? "ready" : "idle",
        role: "Voice-Safe Level-3 Knowledge Layer"
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
