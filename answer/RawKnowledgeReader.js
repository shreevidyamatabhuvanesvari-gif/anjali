/* ==========================================================
   RawKnowledgeReader — EMERGENCY BRUTE FORCE READER
   PURPOSE:
   Read saved knowledge by ANY means necessary.
   No elegance. No layers. Just truth.
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     TEXT HELPERS
     =============================== */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function score(q, t) {
    let hits = 0;
    q.forEach(w => {
      if (t.includes(w)) hits++;
    });
    return hits;
  }

  /* ===============================
     LOCALSTORAGE FALLBACK
     =============================== */
  function readFromLocalStorage(query) {
    const q = normalize(query).split(" ");
    let best = null;
    let bestScore = 0;

    for (let i = 0; i < localStorage.length; i++) {
      try {
        const key = localStorage.key(i);
        const raw = JSON.parse(localStorage.getItem(key));

        if (Array.isArray(raw)) {
          raw.forEach(item => {
            if (item.question && item.answer) {
              const t = normalize(item.question + " " + item.answer);
              const s = score(q, t);
              if (s > bestScore) {
                bestScore = s;
                best = item.answer;
              }
            }
          });
        }
      } catch (_) {}
    }

    return best;
  }

  /* ===============================
     INDEXED DB FORCE READ
     =============================== */
  function readFromIndexedDB(query) {
    return new Promise(resolve => {
      if (!window.indexedDB) return resolve(null);

      const q = normalize(query).split(" ");
      let found = null;
      let foundScore = 0;

      const req = indexedDB.open("AnjaliKnowledgeDB");
      req.onerror = () => resolve(null);

      req.onsuccess = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("qa_store")) {
          resolve(null);
          return;
        }

        const tx = db.transaction("qa_store", "readonly");
        const store = tx.objectStore("qa_store");

        store.openCursor().onsuccess = ev => {
          const cursor = ev.target.result;
          if (!cursor) {
            resolve(found);
            return;
          }

          const v = cursor.value;
          if (v.question && v.answer) {
            const t = normalize(v.question + " " + v.answer);
            const s = score(q, t);
            if (s > foundScore) {
              foundScore = s;
              found = v.answer;
            }
          }
          cursor.continue();
        };
      };
    });
  }

  /* ===============================
     PUBLIC API
     =============================== */
  async function retrieve(query) {
    if (!query) return null;

    // 1️⃣ IndexedDB first
    const dbResult = await readFromIndexedDB(query);
    if (dbResult) return {
      content: dbResult,
      source: "IndexedDB",
      relevance: 0.9
    };

    // 2️⃣ LocalStorage fallback
    const lsResult = readFromLocalStorage(query);
    if (lsResult) return {
      content: lsResult,
      source: "LocalStorage",
      relevance: 0.7
    };

    return null;
  }

  window.RawKnowledgeReader = Object.freeze({
    retrieve
  });

})();
