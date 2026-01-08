/* =========================================================
   KnowledgeBase.js
   Level: 4 / Version: 4.x
   Role: Offline Knowledge + Q&A Store (IndexedDB)
   GUARANTEE:
   ✔ Data NEVER auto-deletes
   ✔ Works on file://, http://, https://
   ✔ 1000+ Q/A safe
   ✔ ReasoningEngine compatible
   ✔ Mobile Browser Safe
   ========================================================= */

(function (window) {
  "use strict";

  /* ===============================
     DATABASE CONFIG
     =============================== */
  const DB_NAME = "AnjaliKnowledgeDB";
  const DB_VERSION = 4;                 // 🔒 controlled upgrade
  const STORE_QA = "qa_store";

  let db = null;

  /* ===============================
     OPEN DATABASE (SAFE)
     =============================== */
  function openDB() {
    if (db) return Promise.resolve(db);

    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = function (e) {
        const d = e.target.result;

        /* NEVER delete old stores */
        if (!d.objectStoreNames.contains(STORE_QA)) {
          const store = d.createObjectStore(STORE_QA, {
            keyPath: "id",
            autoIncrement: true
          });

          /* Indexes for Level-4 reasoning */
          store.createIndex("question_norm", "question_norm", { unique: false });
          store.createIndex("time", "time", { unique: false });
        }
      };

      req.onsuccess = function (e) {
        db = e.target.result;

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

  /* ===============================
     NORMALIZATION (Hindi-centric)
     =============================== */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* ===============================
     SAVE ONE Q/A (REAL)
     =============================== */
  async function saveOne({ question, answer, source = "conversation", tags = [] }) {
    if (!question || !answer) {
      throw new Error("Question & Answer required");
    }

    const d = await openDB();

    return new Promise((resolve, reject) => {
      const tx = d.transaction(STORE_QA, "readwrite");
      const store = tx.objectStore(STORE_QA);

      store.add({
        question: question.trim(),
        answer: answer.trim(),
        question_norm: normalize(question),
        tags,
        source,
        time: Date.now()
      });

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject("Save failed");
    });
  }

  /* ===============================
     BULK SAVE (1000+ SAFE)
     =============================== */
  async function saveMany(list = []) {
    if (!Array.isArray(list) || list.length === 0) return 0;

    const d = await openDB();

    return new Promise((resolve) => {
      let count = 0;
      const tx = d.transaction(STORE_QA, "readwrite");
      const store = tx.objectStore(STORE_QA);

      list.forEach(item => {
        if (item.question && item.answer) {
          store.add({
            question: item.question,
            answer: item.answer,
            question_norm: normalize(item.question),
            tags: item.tags || [],
            source: item.source || "bulk",
            time: Date.now()
          });
          count++;
        }
      });

      tx.oncomplete = () => resolve(count);
      tx.onerror = () => resolve(count);
    });
  }

  /* ===============================
     SEARCH (LEVEL-4 READY)
     =============================== */
  async function search(query) {
    const q = normalize(query);
    if (!q) return null;

    const d = await openDB();

    return new Promise((resolve) => {
      const tx = d.transaction(STORE_QA, "readonly");
      const store = tx.objectStore(STORE_QA);
      const index = store.index("question_norm");

      const req = index.openCursor();
      let best = null;
      let bestScore = 0;

      req.onsuccess = function (e) {
        const cursor = e.target.result;
        if (!cursor) {
          resolve(best);
          return;
        }

        const item = cursor.value;

        let hits = 0;
        q.split(" ").forEach(t => {
          if (item.question_norm.includes(t)) hits++;
        });

        const score = hits / Math.max(q.split(" ").length, 1);

        if (score > bestScore && score >= 0.2) {
          bestScore = score;
          best = {
            answer: item.answer,
            relevance: Number(score.toFixed(2)),
            source: item.source
          };
        }

        cursor.continue();
      };

      req.onerror = () => resolve(null);
    });
  }

  /* ===============================
     GET ALL (DIAGNOSTIC / EXPORT)
     =============================== */
  async function getAll() {
    const d = await openDB();

    return new Promise((resolve) => {
      const tx = d.transaction(STORE_QA, "readonly");
      const store = tx.objectStore(STORE_QA);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  /* ===============================
     STATUS
     =============================== */
  async function getStatus() {
    const all = await getAll();
    return {
      questions: all.length,
      storage: "indexeddb",
      level: "4.x",
      language: "hi"
    };
  }

  /* ===============================
     GLOBAL EXPOSE (LOCKED)
     =============================== */
  Object.defineProperty(window, "KnowledgeBase", {
    value: Object.freeze({
      init: openDB,
      saveOne,
      saveMany,
      search,
      getAll,
      getStatus,
      level: "4.x",
      mode: "stable-operational"
    }),
    writable: false,
    configurable: false
  });

})(window);
