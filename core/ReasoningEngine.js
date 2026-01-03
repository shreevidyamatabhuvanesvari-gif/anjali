/* =========================================================
   core/ReasoningEngine.js
   Role: Ultra-Fast Offline Reasoning + Answer Synthesis
   Safe: Read-only access to KnowledgeBase
   ========================================================= */

(function (window) {
  "use strict";

  if (!window.KnowledgeBase) {
    console.error("ReasoningEngine: KnowledgeBase missing");
    return;
  }

  const STOP_WORDS = [
    "क्या", "है", "हैं", "कैसे", "क्यों", "कब", "कहाँ",
    "का", "की", "के", "से", "में", "पर", "और"
  ];

  function normalize(text) {
    return text
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, "") // हिंदी safe
      .trim();
  }

  function extractKeywords(text) {
    return normalize(text)
      .split(/\s+/)
      .filter(w => w.length > 1 && !STOP_WORDS.includes(w));
  }

  async function reason(questionText) {
    if (!questionText) {
      return "मैं आपकी बात समझ नहीं पाई।";
    }

    await KnowledgeBase.init();
    const all = await KnowledgeBase.getAll();

    if (!all || all.length === 0) {
      return "मेरे पास अभी सीखने के लिए पर्याप्त ज्ञान नहीं है।";
    }

    const qNorm = normalize(questionText);
    const qKeys = extractKeywords(questionText);

    // 1️⃣ Direct meaning match
    const direct = all.find(k =>
      qNorm.includes(normalize(k.question)) ||
      normalize(k.question).includes(qNorm)
    );

    if (direct) {
      return direct.answer;
    }

    // 2️⃣ Conceptual reasoning (keyword overlap)
    const scored = all.map(k => {
      const kKeys = extractKeywords(k.question);
      let score = 0;
      qKeys.forEach(qw => {
        if (kKeys.includes(qw)) score++;
      });
      return { ...k, score };
    }).filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      const best = scored.slice(0, 2);
      return best.map(x => x.answer).join(" ");
    }

    // 3️⃣ Logical fallback (human style)
    return "इस विषय पर मेरा ज्ञान सीमित है, लेकिन मैं इसे समझने की कोशिश कर रही हूँ।";
  }

  Object.defineProperty(window, "ReasoningEngine", {
    value: { reason },
    writable: false
  });

})(window);
