/* =========================================================
   KnowledgeBase.js
   Level: 3 (STABLE & SCALABLE)
   Role: Offline Question–Answer Storage (IndexedDB)
   GUARANTEE:
   - Old data SAFE
   - Single + 1000+ Q/A supported
   - ReasoningEngine ready
   - Zero impact on STT / TTS / Audio
   ========================================================= */

(function (window) {
  "use strict";

  const DB_NAME = "AnjaliKnowledgeDB";
  const DB_VERSION = 2;              // 🔺 controlled upgrade
  const STORE = "qa_store";

  let db = null;

  /* ---------- OPEN DATABASE (SAFE) ---------- */
  function openDB() {
    if (db) return Promise.resolve(db);

    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = function (e) {
        const d = e.target.result;

        // 🧠 पुराने data को छुए बिना structure सुनिश्चित
        if (!d.objectStoreNames.contains(STORE)) {
          d.createObjectStore(STORE, {
            keyPath: "id",
            autoIncrement: true
          });
        }
      };

      req.onsuccess = function (e) {
        db = e.target.result;

        // ⚠️ version change safety
        db.onversionchange = function () {
          db.close();
          db = null;
        };

        resolve(db);
      };

      req.onerror = function () {
        reject(new Error("IndexedDB open failed"));
      };
    });
  }

  /* ---------- NORMALIZE (Reasoning-friendly) ---------- */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* ---------- API ---------- */
  const KnowledgeBase = {

    /* Init (SAFE) */
    async init() {
      await openDB();
      return true;
    },

    /* ---------- SAVE SINGLE (WORKING & SAFE) ---------- */
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
          question_norm: normalize(question), // 🔑 Level-3 ready
          tags,
          time: Date.now()
        });

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject("Save failed");
      });
    },

    /* ---------- BULK SAVE (1000+ READY) ---------- */
    async saveMany(list = []) {
      if (!Array.isArray(list) || list.length === 0) return 0;

      const d = await openDB();

      return new Promise((resolve) => {
        let count = 0;
        const tx = d.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);

        list.forEach(item => {
          if (item.question && item.answer) {
            store.add({
              question: item.question,
              answer: item.answer,
              question_norm: normalize(item.question),
              tags: item.tags || [],
              time: Date.now()
            });
            count++;
          }
        });

        tx.oncomplete = () => resolve(count);
        tx.onerror = () => resolve(count);
      });
    },

    /* ---------- GET ALL (Reasoning SAFE) ---------- */
    async getAll() {
      const d = await openDB();

      return new Promise((resolve) => {
        const tx = d.transaction(STORE, "readonly");
        const store = tx.objectStore(STORE);
        const req = store.getAll();

        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    }
  };

  /* ---------- EXPOSE (LOCKED) ---------- */
  Object.defineProperty(window, "KnowledgeBase", {
    value: KnowledgeBase,
    writable: false,
    configurable: false
  });

})(window);
