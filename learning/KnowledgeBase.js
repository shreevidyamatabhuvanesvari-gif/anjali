/* =========================================================
   learning/KnowledgeBase.js
   Level: 3 (STABLE BASE)
   Purpose:
   - Offline Question–Answer Storage (IndexedDB)
   - Safe for 1000+ Q/A
   - Stable retrieval for ReasoningEngine
   - ZERO impact on STT / TTS / UI
   ========================================================= */

(function (window) {
  "use strict";

  /* =====================================================
     🔐 DATABASE IDENTITY (NEVER CHANGE THESE)
     ===================================================== */
  const DB_NAME = "AnjaliKnowledgeDB";
  const DB_VERSION = 1;          // ❗ NEVER auto-increase
  const STORE = "qa_store";

  let db = null;

  /* =====================================================
     📂 OPEN DATABASE (ABSOLUTELY STABLE)
     ===================================================== */
  function openDB() {
    if (db) return Promise.resolve(db);

    return new Promise((resolve, reject) => {
      let req;
      try {
        req = indexedDB.open(DB_NAME, DB_VERSION);
      } catch (e) {
        reject(e);
        return;
      }

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

        // 🔒 Safety: version change protection
        db.onversionchange = function () {
          try { db.close(); } catch (_) {}
          db = null;
        };

        resolve(db);
      };

      req.onerror = function () {
        reject(new Error("IndexedDB open failed"));
      };

      req.onblocked = function () {
        console.warn("IndexedDB blocked by another tab");
      };
    });
  }

  /* =====================================================
     🧠 NORMALIZE (Reasoning-friendly, SAFE)
     ===================================================== */
  function normalize(text) {
    if (!text) return "";
    return String(text)
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* =====================================================
     🌐 PUBLIC API (LEVEL-3)
     ===================================================== */
  const KnowledgeBase = {

    /* ---------- INIT (SAFE) ---------- */
    async init() {
      try {
        await openDB();
        return true;
      } catch (e) {
        console.warn("KnowledgeBase init failed:", e);
        return false;
      }
    },

    /* ---------- SAVE SINGLE (100% RELIABLE) ---------- */
    async saveOne({ question, answer, tags = [] }) {
      if (!question || !answer) {
        throw new Error("Question and Answer required");
      }

      const d = await openDB();

      return new Promise((resolve, reject) => {
        try {
          const tx = d.transaction(STORE, "readwrite");
          const store = tx.objectStore(STORE);

          store.add({
            question,
            answer,
            question_norm: normalize(question),
            tags: Array.isArray(tags) ? tags : [],
            time: Date.now()
          });

          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject("Save failed");
        } catch (e) {
          reject(e);
        }
      });
    },

    /* ---------- BULK SAVE (1000+ SAFE) ---------- */
    async saveMany(list = []) {
      if (!Array.isArray(list) || list.length === 0) return 0;

      const d = await openDB();

      return new Promise((resolve) => {
        let count = 0;
        try {
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
        } catch (_) {
          resolve(count);
        }
      });
    },

    /* ---------- GET ALL (REASONING-SAFE) ---------- */
    async getAll() {
      let d;
      try {
        d = await openDB();
      } catch (_) {
        return [];
      }

      return new Promise((resolve) => {
        try {
          const tx = d.transaction(STORE, "readonly");
          const store = tx.objectStore(STORE);
          const req = store.getAll();

          req.onsuccess = () => {
            resolve(Array.isArray(req.result) ? req.result.slice() : []);
          };

          req.onerror = () => resolve([]);
        } catch (_) {
          resolve([]);
        }
      });
    }
  };

  /* =====================================================
     🔐 EXPOSE (LOCKED, IMMUTABLE)
     ===================================================== */
  Object.defineProperty(window, "KnowledgeBase", {
    value: KnowledgeBase,
    writable: false,
    configurable: false
  });

})(window);
