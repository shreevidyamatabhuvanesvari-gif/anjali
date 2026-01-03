/* =========================================================
   KnowledgeBase.js
   Role: Offline Question–Answer Storage (IndexedDB)
   Safe for: Mobile Chrome, GitHub Pages
   ========================================================= */

(function (window) {
  "use strict";

  const DB_NAME = "AnjaliKnowledgeDB";
  const DB_VERSION = 1;
  const STORE = "qa_store";

  let db = null;

  // ---------- OPEN DATABASE ----------
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
        reject("IndexedDB open failed");
      };
    });
  }

  // ---------- API ----------
  const KnowledgeBase = {

    // Init (call once)
    async init() {
      await openDB();
      return true;
    },

    // ---------- SAVE SINGLE ----------
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
          tags,
          time: Date.now()
        });

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject("Save failed");
      });
    },

    // ---------- GET ALL ----------
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

  // ---------- EXPOSE ----------
  window.KnowledgeBase = KnowledgeBase;

})(window);
