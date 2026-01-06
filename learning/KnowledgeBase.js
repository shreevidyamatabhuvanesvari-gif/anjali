/* =========================================================
   learning/KnowledgeBase.js
   Role: Offline Q&A Storage (STABLE – PROVEN)
   ========================================================= */

(function (window) {
  "use strict";

  const DB_NAME = "AnjaliKnowledgeDB";
  const DB_VERSION = 1;              // ❗ NEVER change
  const STORE = "qa_store";

  let db = null;

  /* ---------- OPEN DB ---------- */
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

      req.onerror = () => reject("IndexedDB open failed");
    });
  }

  /* ---------- NORMALIZE ---------- */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* ---------- API ---------- */
  const KnowledgeBase = {

    async init() {
      await openDB();
      return true;
    },

    /* ===== SINGLE SAVE (WORKING) ===== */
    async saveOne({ question, answer, subject = "" }) {
      if (!question || !answer) throw new Error("Q/A required");

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

    /* ===== BULK SAVE (1000+ SAFE) ===== */
    async saveMany(list = []) {
      if (!Array.isArray(list) || !list.length) return 0;

      const d = await openDB();

      return new Promise(resolve => {
        let saved = 0;
        const tx = d.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);

        list.forEach(item => {
          if (item.question && item.answer) {
            store.add({
              question: item.question,
              answer: item.answer,
              subject: item.subject || "",
              question_norm: normalize(item.question),
              time: Date.now()
            });
            saved++;
          }
        });

        tx.oncomplete = () => resolve(saved);
        tx.onerror = () => resolve(saved);
      });
    },

    async getAll() {
      const d = await openDB();
      return new Promise(resolve => {
        const tx = d.transaction(STORE, "readonly");
        const store = tx.objectStore(STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    }
  };

  Object.defineProperty(window, "KnowledgeBase", {
    value: KnowledgeBase,
    writable: false,
    configurable: false
  });

})(window);
