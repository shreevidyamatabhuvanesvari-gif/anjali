/* ==========================================================
   ExperienceMemory.js — Level-4 / FINAL
   ROLE:
   Living emotional + contextual memory for Anjali.
   Stores not just words, but meaning, tone, and relationship.
   ========================================================== */

(function (window) {
  "use strict";

  /* ===============================
     INTERNAL STATE
     =============================== */
  const MEMORY_KEY = "ANJALI_EXPERIENCE_MEMORY_V4";
  const MAX_RECORDS = 1200;

  let records = [];

  /* ===============================
     LOAD / SAVE
     =============================== */
  function load() {
    try {
      const raw = localStorage.getItem(MEMORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) records = parsed;
      }
    } catch (_) {
      records = [];
    }
  }

  function save() {
    try {
      localStorage.setItem(MEMORY_KEY, JSON.stringify(records));
    } catch (_) {}
  }

  load();

  /* ===============================
     UTILITIES
     =============================== */
  function now() {
    return Date.now();
  }

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function extractKeywords(text) {
    return normalize(text)
      .split(" ")
      .filter(w => w.length > 2)
      .slice(0, 10);
  }

  function detectTone(text) {
    const t = text.toLowerCase();

    if (t.includes("दुख") || t.includes("रो") || t.includes("खो") || t.includes("याद"))
      return "sad";

    if (t.includes("खुश") || t.includes("अच्छा") || t.includes("हँस"))
      return "warm";

    if (t.includes("क्यों") || t.includes("कैसे") || t.includes("समझ"))
      return "thinking";

    if (t.includes("अंजली"))
      return "attachment";

    return "neutral";
  }

  /* ===============================
     STORE EXPERIENCE
     =============================== */
  function record(userText, anjaliText) {
    if (!userText) return;

    const entry = {
      id: "E-" + now() + "-" + Math.floor(Math.random() * 9999),
      time: now(),
      user: userText,
      anjali: anjaliText || null,
      keywords: extractKeywords(userText),
      tone: detectTone(userText),
      importance: userText.includes("अंजली") ? 1.0 : 0.6
    };

    records.push(entry);

    if (records.length > MAX_RECORDS) {
      records = records.slice(records.length - MAX_RECORDS);
    }

    save();
  }

  /* ===============================
     QUERY MEMORY
     =============================== */
  function findSimilar(queryText) {
    const qk = extractKeywords(queryText);
    if (!qk.length) return [];

    return records
      .map(r => {
        let score = 0;
        qk.forEach(k => {
          if (r.keywords.includes(k)) score++;
        });
        return { ...r, score };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }

  function emotionalSummary() {
    const summary = {
      sad: 0,
      warm: 0,
      thinking: 0,
      attachment: 0,
      neutral: 0
    };

    records.forEach(r => {
      if (summary[r.tone] !== undefined) summary[r.tone]++;
    });

    return summary;
  }

  /* ===============================
     PROVIDE TO ETHOS / REASONING
     =============================== */
  function getContextForEthos(query) {
    const similar = findSimilar(query);
    const emotions = emotionalSummary();

    return {
      similarMemories: similar.map(r => ({
        user: r.user,
        tone: r.tone,
        time: r.time
      })),
      emotionalProfile: emotions,
      totalMemories: records.length
    };
  }

  /* ===============================
     PUBLIC API
     =============================== */
  window.ExperienceMemory = Object.freeze({
    record,
    findSimilar,
    getContextForEthos,
    stats() {
      return {
        count: records.length,
        emotions: emotionalSummary(),
        role: "experience-memory",
        level: "4.x"
      };
    }
  });

})(window);
