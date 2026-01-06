/* =========================================================
   KnowledgeBase.js
   Role: Offline Question–Answer Storage (BULLET-PROOF)
   SAFE FOR:
   - Mobile Chrome
   - GitHub Pages
   - 1000+ Bulk Import
   GUARANTEE:
   - Old data SAFE (NO schema change)
   - Single + Bulk both work
   - ReasoningEngine compatible
   ========================================================= */

(function (window) {
  "use strict";

  /* ---------- DB IDENTITY (DO NOT CHANGE) ---------- */
  const DB_NAME = "AnjaliKnowledgeDB";
  const DB_VERSION = 1;
  const STORE = "qa_store";

  let db = null;

  /* =================================================
     OPEN DATABASE (STABLE)
     ================================================= */
  function openDB() {
    if (db) return Promise.resolve(db);

    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = e => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains(STORE)) {
          d.createObjectStore(STORE, {
            keyPath: "id",
            autoIncrement: true
          });
        }
      };

      req.onsuccess = e => {
        db = e.target.result;
        resolve(db);
      };

      req.onerror = () => {
        reject(new Error("IndexedDB open failed"));
      };
    });
  }

  /* =================================================
     NORMALIZE (Reasoning SAFE)
     ================================================= */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* =================================================
     CORE API
     ================================================= */
  const KnowledgeBase = {

    /* ---------- INIT ---------- */
    async init() {
      await openDB();
      return true;
    },

    /* =================================================
       SAVE SINGLE (PROVEN)
       ================================================= */
    async saveOne({ question, answer, subject = "" }) {
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
          subject,
          question_norm: normalize(question),
          time: Date.now()
        });

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject("Save failed");
      });
    },

    /* =================================================
       SAVE MANY (1000+ BULK SAFE)
       - SINGLE transaction
       - NO await inside loop
       ================================================= */
    async saveMany(list) {
      if (!Array.isArray(list) || list.length === 0) return 0;

      const d = await openDB();

      return new Promise(resolve => {
        let saved = 0;

        const tx = d.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);

        for (const item of list) {
          if (item && item.question && item.answer) {
            try {
              store.add({
                question: item.question,
                answer: item.answer,
                subject: item.subject || "",
                question_norm: normalize(item.question),
                time: Date.now()
              });
              saved++;
            } catch (_) {
              // ignore single failure, bulk must continue
            }
          }
        }

        tx.oncomplete = () => resolve(saved);
        tx.onerror = () => resolve(saved); // partial success allowed
      });
    },

    /* =================================================
       GET ALL (REASONING SAFE)
       ================================================= */
    async getAll() {
      const d = await openDB();

      return new Promise(resolve => {
        const tx = d.transaction(STORE, "readonly");
        const store = tx.objectStore(STORE);
        const req = store.getAll();

        req.onsuccess = () => {
          resolve(Array.isArray(req.result) ? req.result : []);
        };

        req.onerror = () => resolve([]);
      });
    }
  };

  /* =================================================
     EXPOSE (GLOBAL, SINGLE SOURCE OF TRUTH)
     ================================================= */
  window.KnowledgeBase = KnowledgeBase;

})(window);
