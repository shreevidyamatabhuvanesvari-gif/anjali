/* ==========================================================
   KnowledgeBase — Level-4 / Version-4.x (Hindi Only)
   PURPOSE:
   अंजली एप का एकमात्र, विश्वसनीय, ऑफलाइन ज्ञान भंडार।
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     INTERNAL STATE
     =============================== */
  const ARTICLES = [];
  const ERROR_LOG = [];

  /* ===============================
     TIME
     =============================== */
  function now() {
    return new Date().toISOString();
  }

  /* ===============================
     STOP WORDS (हिन्दी)
     =============================== */
  const STOP_WORDS = new Set([
    "और","का","की","के","को","में","से","पर","यह","वह",
    "था","थे","है","हैं","हो","भी","ही","तो","जो","कि"
  ]);

  /* ===============================
     LEMMA + SUFFIX DATA
     =============================== */
  const LEMMA_MAP = {
    "किया": "कर","करता": "कर","करती": "कर","करेगा": "कर","करेगी": "कर",
    "गया": "जा","जाती": "जा","जाएगा": "जा",
    "आया": "आ","आती": "आ","आएगा": "आ"
  };

  const SUFFIXES = [
    "ताओं","ाओं","ियों","ियाँ","ेंगी","ेंगा",
    "ाना","ाने","ाता","ाती","ाते",
    "ाकर","ायी","ाये","ों","ें","ी","ा"
  ];

  /* ===============================
     SAFE STEMMER (Hindi)
     =============================== */
  function safeStemHindi(word) {
    try {
      if (typeof word !== "string" || !word) return "";
      if (LEMMA_MAP[word]) return LEMMA_MAP[word];

      let w = word;
      for (let i = 0; i < SUFFIXES.length; i++) {
        const suf = SUFFIXES[i];
        if (w.endsWith(suf) && w.length > suf.length + 1) {
          w = w.slice(0, -suf.length);
          break;
        }
      }
      return w;
    } catch {
      return word;
    }
  }

  /* ===============================
     NORMALIZE + TOKENIZE
     =============================== */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(text) {
    return normalize(text)
      .split(" ")
      .map(w => safeStemHindi(w))
      .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  }

  /* ===============================
     PERSISTENCE LAYER (SAFE)
     =============================== */
  const STORAGE_KEY = "ANJALI_KNOWLEDGE_BASE";

  (function restoreArticles() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach(a => {
            if (
              a &&
              typeof a.title === "string" &&
              typeof a.text === "string" &&
              Array.isArray(a.tokens)
            ) {
              ARTICLES.push(a);
            }
          });
        }
      }
    } catch (e) {
      ERROR_LOG.push({
        at: now(),
        source: "KB_RESTORE",
        message: e.message
      });
    }
  })();

  function persistArticles() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(ARTICLES)
      );
    } catch (e) {
      ERROR_LOG.push({
        at: now(),
        source: "KB_PERSIST",
        message: e.message
      });
    }
  }

  /* ===============================
     ARTICLE MANAGEMENT (FINAL)
     =============================== */
  function addArticle(article) {
    if (
      !article ||
      typeof article.title !== "string" ||
      typeof article.text !== "string"
    ) {
      return false;
    }

    const record = {
      id: "KB-" + (ARTICLES.length + 1),
      title: article.title.trim(),
      text: article.text.trim(),
      tokens: tokenize(article.text),
      addedAt: now(),
      source: article.source || "manual"
    };

    ARTICLES.push(record);
    persistArticles();
    return true;
  }

  function listArticles() {
    return ARTICLES.map(a => ({
      id: a.id,
      title: a.title,
      source: a.source,
      addedAt: a.addedAt
    }));
  }

  /* ===============================
     SEARCH
     =============================== */
  function search(query) {
    const qTokens = tokenize(query);
    if (!qTokens.length) return null;

    let best = null;
    let bestScore = 0;

    ARTICLES.forEach(article => {
      let hits = 0;
      qTokens.forEach(t => {
        if (article.tokens.includes(t)) hits++;
      });
      const score = hits / Math.max(qTokens.length, 1);
      if (score > bestScore) {
        bestScore = score;
        best = article;
      }
    });

    if (!best || bestScore < 0.18) return null;

    return {
      title: best.title,
      content: best.text,
      relevance: Number(bestScore.toFixed(2)),
      source: best.source
    };
  }

  /* ===============================
     DIAGNOSTICS
     =============================== */
  function getStatus() {
    return {
      articleCount: ARTICLES.length,
      errorCount: ERROR_LOG.length,
      language: "hi",
      level: "4.x",
      role: "knowledge-store"
    };
  }

  /* ===============================
     GLOBAL EXPOSE
     =============================== */
  window.KnowledgeBase = Object.freeze({
    addArticle,
    listArticles,
    search,
    getStatus,
    level: "4.x",
    mode: "operational"
  });

})();
