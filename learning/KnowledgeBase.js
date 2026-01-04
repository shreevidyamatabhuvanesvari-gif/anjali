/* =========================================================
   learning/KnowledgeBase.js
   Level: 3 (Reasoning-Ready Knowledge Layer)
   Role:
   - Structured Offline Knowledge Storage (IndexedDB)
   - Fast, safe retrieval for ReasoningEngine
   - Zero control over STT / TTS / UI
   ========================================================= */

(function (window) {
  "use strict";

  /* ---------- DB CONFIG ---------- */
  const DB_NAME = "AnjaliKnowledgeDB";
  const DB_VERSION = 2;
  const STORE = "qa_store";

  let db = null;

  /* =========================================================
     INTERNAL UTILS (PRIVATE)
     ========================================================= */

  function openDB() {
    if (db) return Promise.resolve(db);

    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = function (e) {
        const d = e.target.result;

        if (!d.objectStoreNames.contains(STORE)) {
          const store = d.createObjectStore(STORE, {
            keyPath: "id",
            autoIncrement: true
          });

          // Level-3 indexes (Reasoning-friendly)
          store.createIndex("question_norm", "question_norm", { unique: false });
          store.createIndex("tags", "tags", { unique: false });
          store.createIndex("time", "time", { unique: false });
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

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, "")
      .trim();
  }

  /* =========================================================
     CORE API (LEVEL-3)
     ========================================================= */

  const KnowledgeBase = {

    /* ---------- INIT ---------- */
    async init() {
      await openDB();
      return true;
    },

    /* ---------- SAVE (SAFE, STRUCTURED) ---------- */
    async saveOne({ question, answer, tags = [] }) {
      if (!question || !answer) {
        throw new Error("KnowledgeBase: Question & Answer required");
      }

      const d = await openDB();

      const record = {
        question,
        answer,
        tags: Array.isArray(tags) ? tags : [],
        question_norm: normalize(question),
        time: Date.now()
      };

      return new Promise((resolve, reject) => {
        const tx = d.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);
        store.add(record);

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject("KnowledgeBase: save failed");
      });
    },

    /* ---------- BULK SAVE (ADMIN / FUTURE) ---------- */
    async saveMany(list = []) {
      if (!Array.isArray(list)) return false;

      const d = await openDB();

      return new Promise((resolve) => {
        const tx = d.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);

        list.forEach(item => {
          if (item.question && item.answer) {
            store.add({
              question: item.question,
              answer: item.answer,
              tags: item.tags || [],
              question_norm: normalize(item.question),
              time: Date.now()
            });
          }
        });

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    },

    /* ---------- GET ALL (READ-ONLY) ---------- */
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

    /* ---------- SEARCH (LEVEL-3 READY) ---------- */
    async searchByNormalizedQuestion(normQuestion) {
      const d = await openDB();
      const norm = normalize(normQuestion);

      return new Promise((resolve) => {
        const tx = d.transaction(STORE, "readonly");
        const store = tx.objectStore(STORE);
        const index = store.index("question_norm");

        const results = [];
        const req = index.openCursor();

        req.onsuccess = function (e) {
          const cursor = e.target.result;
          if (!cursor) {
            resolve(results);
            return;
          }

          if (cursor.value.question_norm.includes(norm)) {
            results.push(cursor.value);
          }
          cursor.continue();
        };

        req.onerror = () => resolve(results);
      });
    },

    /* ---------- STATS (DEBUG SAFE) ---------- */
    async stats() {
      const all = await this.getAll();
      return {
        total_items: all.length,
        approx_RAM_MB:
          (JSON.stringify(all).length / (1024 * 1024)).toFixed(2),
        role: "Level-3 Knowledge Layer"
      };
    }
  };

  /* =========================================================
     EXPOSE (READ-ONLY, NON-INTRUSIVE)
     ========================================================= */

  Object.defineProperty(window, "KnowledgeBase", {
    value: KnowledgeBase,
    writable: false,
    configurable: false
  });

})(window);
