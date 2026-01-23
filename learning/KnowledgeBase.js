/* =========================================================
   KnowledgeBase.js
   Role: Offline Knowledge + Q&A Store (IndexedDB)
   ========================================================= */
(function (window) {
  "use strict";

  const DB_NAME = "AnjaliKnowledgeDB";
  const DB_VERSION = 4;  // Fixed version for schema changes
  const STORE_QA = "qa_store";
  let db = null;

  function openDB() {
    if (db) return Promise.resolve(db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        const d = e.target.result;
        if (!d.objectStoreNames.contains(STORE_QA)) {
          const store = d.createObjectStore(STORE_QA, {
            keyPath: "id",
            autoIncrement: true
          });
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

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

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

  async function getStatus() {
    const all = await getAll();
    return {
      questions: all.length,
      storage: "indexeddb",
      level: "4.x",
      language: "hi"
    };
  }

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
