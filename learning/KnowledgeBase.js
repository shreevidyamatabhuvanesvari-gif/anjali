/* ==========================================================
   KnowledgeBase — Level-4 / Version-4.x (Hindi Only)
   PURPOSE:
   अंजली एप का एकमात्र, विश्वसनीय, ऑफलाइन ज्ञान + प्रश्नोत्तर भंडार।
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     INTERNAL STATE
     =============================== */
  const ARTICLES = [];
  const QUESTIONS = [];
  const ERROR_LOG = [];

  const ARTICLE_KEY = "ANJALI_KNOWLEDGE_BASE";
  const QUESTION_KEY = "ANJALI_QUESTION_STORE";

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
     SAFE STEMMER
     =============================== */
  function stem(word) {
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
      .map(w => stem(w))
      .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  }

  /* ===============================
     RESTORE (ARTICLES + QUESTIONS)
     =============================== */
  (function restore() {
    try {
      const a = JSON.parse(localStorage.getItem(ARTICLE_KEY) || "[]");
      if (Array.isArray(a)) a.forEach(x => ARTICLES.push(x));

      const q = JSON.parse(localStorage.getItem(QUESTION_KEY) || "[]");
      if (Array.isArray(q)) q.forEach(x => QUESTIONS.push(x));
    } catch (e) {
      ERROR_LOG.push({ at: now(), source: "RESTORE", message: e.message });
    }
  })();

  /* ===============================
     PERSIST
     =============================== */
  function persist() {
    try {
      localStorage.setItem(ARTICLE_KEY, JSON.stringify(ARTICLES));
      localStorage.setItem(QUESTION_KEY, JSON.stringify(QUESTIONS));
    } catch (e) {
      ERROR_LOG.push({ at: now(), source: "PERSIST", message: e.message });
    }
  }

  /* ===============================
     ADD ARTICLE
     =============================== */
  function addArticle(article) {
    if (!article || typeof article.title !== "string" || typeof article.text !== "string") {
      return false;
    }

    ARTICLES.push({
      id: "A-" + (ARTICLES.length + 1),
      title: article.title.trim(),
      text: article.text.trim(),
      tokens: tokenize(article.text),
      addedAt: now(),
      source: article.source || "manual"
    });

    persist();
    return true;
  }

  /* ===============================
     ADD QUESTION
     =============================== */
  function addQuestion(question, answer, source = "conversation") {
    if (typeof question !== "string" || typeof answer !== "string") return false;

    QUESTIONS.push({
      id: "Q-" + (QUESTIONS.length + 1),
      question: question.trim(),
      answer: answer.trim(),
      tokens: tokenize(question),
      addedAt: now(),
      source
    });

    persist();
    return true;
  }

  /* ===============================
     SEARCH (ARTICLE + Q&A)
     =============================== */
  function search(query) {
    const qTokens = tokenize(query);
    if (!qTokens.length) return null;

    let best = null;
    let bestScore = 0;

    function score(tokens) {
      let hit = 0;
      qTokens.forEach(t => { if (tokens.includes(t)) hit++; });
      return hit / Math.max(qTokens.length, 1);
    }

    ARTICLES.forEach(a => {
      const s = score(a.tokens);
      if (s > bestScore) {
        bestScore = s;
        best = { title: a.title, content: a.text, source: a.source };
      }
    });

    QUESTIONS.forEach(q => {
      const s = score(q.tokens);
      if (s > bestScore) {
        bestScore = s;
        best = { title: "प्रश्नोत्तर", content: q.answer, source: q.source };
      }
    });

    if (!best || bestScore < 0.18) return null;

    return {
      ...best,
      relevance: Number(bestScore.toFixed(2))
    };
  }

  /* ===============================
     STATUS
     =============================== */
  function getStatus() {
    return {
      articles: ARTICLES.length,
      questions: QUESTIONS.length,
      errors: ERROR_LOG.length,
      level: "4.x",
      language: "hi"
    };
  }

  /* ===============================
     GLOBAL EXPOSE
     =============================== */
  window.KnowledgeBase = Object.freeze({
    addArticle,
    addQuestion,
    search,
    getStatus,
    level: "4.x",
    mode: "operational"
  });

})();
