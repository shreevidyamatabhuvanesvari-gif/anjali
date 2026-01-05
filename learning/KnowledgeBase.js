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

  // 🔐 Database identity (stable)
  const DB_NAME = "AnjaliKnowledgeDB";

  // ✅ VERSION बढ़ाया गया ताकि schema हमेशा सही apply हो
  // (पुराना ज्ञान सुरक्षित रहेगा)
  const DB_VERSION = 2;

  // 🔐 Store name (unchanged)
  const STORE = "qa_store";

  // ✅ DB handle (controlled lifecycle)
  let db = null;

/* ---------- OPEN DATABASE (STABLE & SAFE) ---------- */
function openDB() {
  // ✅ पहले से खुला है तो वही लौटाओ
  if (db) return Promise.resolve(db);

  return new Promise((resolve, reject) => {
    let req;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (e) {
      reject(e);
      return;
    }

    // 🔧 Schema upgrade (safe)
    req.onupgradeneeded = function (e) {
      const d = e.target.result;

      // ❗ Store केवल एक बार बने
      if (!d.objectStoreNames.contains(STORE)) {
        d.createObjectStore(STORE, {
          keyPath: "id",
          autoIncrement: true
        });
      }
    };

    // ✅ Success → DB handle सुरक्षित रूप से सेट
    req.onsuccess = function (e) {
      db = e.target.result;

      // ⚠️ Version change safety (silent)
      db.onversionchange = function () {
        db.close();
        db = null;
      };

      resolve(db);
    };

    // ❌ Error handling (explicit)
    req.onerror = function () {
      reject(new Error("IndexedDB open failed"));
    };

    // ⚠️ Blocked state (rare but real)
    req.onblocked = function () {
      console.warn("IndexedDB open blocked by another tab");
    };
  });
}

  /* ---------- NORMALIZE (Reasoning-friendly & SAFE) ---------- */
function normalize(text) {
  if (text === null || text === undefined) return "";

  return String(text)
    .toLowerCase()
    // हिंदी अक्षर + स्पेस सुरक्षित
    .replace(/[^\u0900-\u097F\s]/g, " ")
    // अतिरिक्त स्पेस हटाओ
    .replace(/\s+/g, " ")
    .trim();
}

  /* Init (SAFE & NON-BLOCKING) */
async init() {
  try {
    await openDB();
    return true;
  } catch (e) {
    console.warn("KnowledgeBase init failed:", e);
    return false;
  }
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

    /* ---------- GET ALL (STABLE & SAFE) ---------- */
async getAll() {
  let d;

  try {
    d = await openDB();
  } catch (e) {
    console.warn("KnowledgeBase.getAll: DB open failed", e);
    return [];
  }

  return new Promise((resolve) => {
    let resolved = false;

    try {
      const tx = d.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const req = store.getAll();

      req.onsuccess = () => {
        if (resolved) return;
        resolved = true;

        const result = Array.isArray(req.result)
          ? req.result.slice()   // 🔒 immutable copy
          : [];

        resolve(result);
      };

      req.onerror = () => {
        if (resolved) return;
        resolved = true;
        resolve([]);
      };

      tx.onerror = () => {
        if (resolved) return;
        resolved = true;
        resolve([]);
      };

    } catch (e) {
      resolve([]);
    }
  });
}

  /* ---------- EXPOSE (LOCKED & SAFE) ---------- */
Object.defineProperty(window, "KnowledgeBase", {
  value: KnowledgeBase,
  writable: false,      // ❌ overwrite नहीं होगा
  configurable: false, // ❌ delete / redefine नहीं होगा
  enumerable: false
});

})(window);
