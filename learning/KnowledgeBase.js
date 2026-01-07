/* ==========================================================
   KnowledgeBase — Level-4 / Version-4.x (Hindi Only)
   PURPOSE:
   अंजली एप का एकमात्र, विश्वसनीय, ऑफलाइन ज्ञान भंडार।
   यह लेख संग्रहित करता है, खोजता है, स्टेमिंग + लेम्मेटाइजेशन
   के माध्यम से वास्तविक प्रश्नों से उत्तर निकालने में सहायता करता है।
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     INTERNAL STATE
     =============================== */
  const ARTICLES = [];
  const ERROR_LOG = [];

  /* ===============================
     TIME UTILITY
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
     ADVANCED HINDI STEM + LEMMA
     (Rule-based, Offline)
     =============================== */

  const LEMMA_MAP = {
    "किया": "कर",
    "करता": "कर",
    "करती": "कर",
    "करेगा": "कर",
    "करेगी": "कर",
    "गया": "जा",
    "जाती": "जा",
    "जाएगा": "जा",
    "आया": "आ",
    "आती": "आ",
    "आएगा": "आ"
  };

  const SUFFIXES = [
    "ताओं","ाओं","ियों","ियाँ","ेंगी","ेंगा",
    "ाना","ाने","ाता","ाती","ाते",
    "ाकर","ायी","ाये","ों","ें","ी","ा"
  ];

  function stemHindi(word) {
    if (LEMMA_MAP[word]) return LEMMA_MAP[word];

    let w = word;
    for (const suf of SUFFIXES) {
      if (w.endsWith(suf) && w.length > suf.length + 1) {
        w = w.slice(0, -suf.length);
        break;
      }
    }
    return w;
  }

  /* ===============================
     NORMALIZATION + TOKENIZATION
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
      .map(w => stemHindi(w))
      .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  }

  /* ===============================
     SAFE EXECUTION
     =============================== */
  function safe(fn, source) {
    try {
      return fn();
    } catch (e) {
      ERROR_LOG.push({
        at: now(),
        source,
        message: e.message
      });
      return null;
    }
  }

  /* ===============================
     ARTICLE MANAGEMENT
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
     SEARCH (REAL, HONEST)
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

    if (!best || bestScore < 0.18) {
      return null; // ईमानदार अस्वीकार
    }

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
      recentErrors: ERROR_LOG.slice(-5),
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

  /* ======================================================
     BASE ARTICLES (REAL, COPY-WORTHY, HINDI)
     ====================================================== */

  addArticle({
    title: "मानव सोच और निर्णय",
    source: "Anjali Foundation",
    text: `
मानव सोच तर्क, अनुभव और भावना के संयोजन से विकसित होती है।
जब कोई प्रश्न पूछा जाता है, तो मन पहले स्मृति में उपलब्ध
अनुभवों को खोजता है। यदि समान स्थिति पहले आई हो,
तो निर्णय अधिक स्पष्ट और तेज़ होता है।

जब अनुभव उपलब्ध न हो, तब तर्क और अनुमान का सहारा लिया जाता है।
इस स्थिति में निर्णय में अनिश्चितता स्वाभाविक होती है।
`
  });

  addArticle({
    title: "ज्ञान और समझ का अंतर",
    source: "Anjali Foundation",
    text: `
ज्ञान तथ्यों का संग्रह है, जबकि समझ उन तथ्यों को
परिस्थिति के अनुसार लागू करने की क्षमता है।
समझ अनुभव, आत्मचिंतन और समय के साथ विकसित होती है।
`
  });

  addArticle({
    title: "प्रश्न पूछने की शक्ति",
    source: "Anjali Foundation",
    text: `
सही प्रश्न किसी भी उत्तर से अधिक महत्वपूर्ण होता है।
स्पष्ट प्रश्न सोच को दिशा देता है और उत्तर को सरल बनाता है।
अस्पष्ट प्रश्नों में उत्तर देने से पहले प्रश्न को समझना आवश्यक होता है।
`
  });

})();
