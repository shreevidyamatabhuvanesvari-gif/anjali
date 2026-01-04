/* =========================================================
   KnowledgeBase.js
   Role: Offline Question–Answer Storage (IndexedDB)
   GUARANTEE:
   - Save button WILL work
   - No impact on STT / TTS / Reasoning
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
        console.error("❌ IndexedDB open failed");
        reject(new Error("DB open failed"));
      };
    });
  }

  // ---------- API ----------
  const KnowledgeBase = {

    // Init (SAFE)
    async init() {
      try {
        await openDB();
        return true;
      } catch (e) {
        return false;
      }
    },

    // ---------- SAVE SINGLE (FIXED) ----------
    async saveOne({ question, answer, tags = [] }) {
      if (!question || !answer) {
        return Promise.reject("Question and Answer required");
      }

      let d;
      try {
        d = await openDB();
      } catch (e) {
        return Promise.reject("Database not available");
      }

      return new Promise((resolve, reject) => {
        try {
          const tx = d.transaction(STORE, "readwrite");
          const store = tx.objectStore(STORE);

          store.add({
            question,
            answer,
            tags,
            time: Date.now()
          });

          tx.oncomplete = () => {
            resolve(true);   // ✅ SUCCESS SIGNAL
          };

          tx.onerror = () => {
            reject("Save transaction failed");
          };
        } catch (e) {
          reject("Save exception");
        }
      });
    },

    // ---------- GET ALL ----------
    async getAll() {
      let d;
      try {
        d = await openDB();
      } catch (e) {
        return [];
      }

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
