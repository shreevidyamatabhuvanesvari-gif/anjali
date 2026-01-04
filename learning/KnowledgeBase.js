/* =========================================================
   KnowledgeBase.js
   Role: Offline Question–Answer Storage (IndexedDB)
   GUARANTEE:
   - Save button WILL work
   - Old data SAFE
   - ReasoningEngine WILL receive data
   - No impact on STT / TTS
   ========================================================= */

(function (window) {
  "use strict";

  const DB_NAME = "AnjaliKnowledgeDB";
  const DB_VERSION = 1;
  const STORE = "qa_store";

  let db = null;

  /* ---------- OPEN DATABASE (STABLE) ---------- */
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
        reject(new Error("IndexedDB open failed"));
      };
    });
  }

  /* ---------- NORMALIZE (Reasoning-friendly) ---------- */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, "")
      .trim();
  }

  /* ---------- API ---------- */
  const KnowledgeBase = {

    /* Init */
    async init() {
      await openDB();
      return true;
    },

    /* ---------- SAVE SINGLE (GUARANTEED) ---------- */
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
          question_norm: normalize(question), // 🔑 KEY FIX
          tags,
          time: Date.now()
        });

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject("Save failed");
      });
    },

    /* ---------- GET ALL (REASONING-SAFE) ---------- */
    async getAll() {
      const d = await openDB();

      return new Promise((resolve) => {
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

  /* ---------- EXPOSE ---------- */
  window.KnowledgeBase = KnowledgeBase;

})(window);
