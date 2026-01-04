/* =========================================================
   core/ReasoningEngine.js
   Level: 3 (Maximum Practical Reasoning)
   RAM Profile: up to ~150 MB (SOFT, bounded)
   Role:
   - Deterministic offline reasoning
   - Context-weighted answer synthesis
   - NO control over STT / TTS / Index
   ========================================================= */

(function (window) {
  "use strict";

  /* ==================================================
     🔒 SAFETY CHECKS
     ================================================== */
  if (!window.KnowledgeBase) {
    console.error("ReasoningEngine: KnowledgeBase missing");
    return;
  }

  /* ==================================================
     ⚙️ HARD CONFIG (NON-NEGOTIABLE)
     ================================================== */
  const MAX_KNOWLEDGE_SCAN = 3000;     // bounded scan
  const MAX_CONTEXT_TURNS = 12;        // safe RAM window
  const MAX_RAM_MB        = 150;       // DESIGN CEILING

  /* ==================================================
     🧠 SIGNAL / CONNECTOR WORDS
     ================================================== */
  const SIGNAL_WORDS = [
    "और","फिर","उसके बाद","इसमें","उसमें","इसलिए","क्योंकि",
    "यदि","तो","भी","लेकिन","हालांकि","अतः","परिणामस्वरूप"
  ];

  const STOP_WORDS = [
    "क्या","है","हैं","कब","कहाँ","कैसे","क्यों",
    "का","की","के","से","में","पर","और","तो","भी"
  ];

  /* ==================================================
     🧹 TEXT NORMALIZATION
     ================================================== */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function extractKeywords(text) {
    return normalize(text)
      .split(" ")
      .filter(w => w.length > 1 && !STOP_WORDS.includes(w));
  }

  function hasSignalWord(text) {
    return SIGNAL_WORDS.some(w => text.includes(w));
  }

  /* ==================================================
     🧠 LOCAL CONTEXT BUFFER (READ-ONLY USE)
     ================================================== */
  const contextBuffer = [];

  function pushContext(question, answer) {
    contextBuffer.push({
      q: normalize(question),
      a: String(answer || "")
    });
    if (contextBuffer.length > MAX_CONTEXT_TURNS) {
      contextBuffer.shift();
    }
  }

  function contextScore(keywords) {
    let score = 0;
    for (const turn of contextBuffer) {
      for (const k of keywords) {
        if (turn.q.includes(k)) score += 0.5;
      }
    }
    return score;
  }

  /* ==================================================
     🧠 CORE REASONING (PURE FUNCTIONAL)
     ================================================== */
  async function reason(questionText) {
    if (!questionText) {
      return "मैं आपकी बात समझ नहीं पाई।";
    }

    await KnowledgeBase.init();
    const knowledge = await KnowledgeBase.getAll();

    if (!Array.isArray(knowledge) || knowledge.length === 0) {
      return "मेरे पास अभी पर्याप्त ज्ञान नहीं है।";
    }

    const qNorm = normalize(questionText);
    const qKeys = extractKeywords(questionText);
    const hasSignal = hasSignalWord(qNorm);

    /* ---------- 1️⃣ DIRECT MATCH ---------- */
    for (let i = 0; i < knowledge.length && i < MAX_KNOWLEDGE_SCAN; i++) {
      const kq = normalize(knowledge[i].question);
      if (!kq) continue;

      if (qNorm.includes(kq) || kq.includes(qNorm)) {
        pushContext(questionText, knowledge[i].answer);
        return knowledge[i].answer;
      }
    }

    /* ---------- 2️⃣ WEIGHTED SEMANTIC MATCH ---------- */
    let best = null;
    let bestScore = 0;

    for (let i = 0; i < knowledge.length && i < MAX_KNOWLEDGE_SCAN; i++) {
      const item = knowledge[i];
      const kKeys = extractKeywords(item.question);
      if (kKeys.length === 0) continue;

      let score = 0;

      for (const qk of qKeys) {
        if (kKeys.includes(qk)) score += 1;
      }

      // Context influence (bounded)
      score += contextScore(qKeys);

      // Signal words → reasoning depth bias
      if (hasSignal) score += 0.75;

      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    }

    if (best && bestScore > 0) {
      pushContext(questionText, best.answer);
      return best.answer;
    }

    /* ---------- 3️⃣ CAUSE–EFFECT FALLBACK ---------- */
    if (hasSignal) {
      const causal =
        "आपके प्रश्न में कारण और परिणाम का संबंध दिखता है। " +
        "यदि आप थोड़ा और स्पष्ट करें तो मैं अधिक सटीक उत्तर दे सकूँगी।";
      pushContext(questionText, causal);
      return causal;
    }

    /* ---------- 4️⃣ HUMAN-STYLE SAFE FALLBACK ---------- */
    const fallback =
      "इस प्रश्न पर मेरा सीधा ज्ञान नहीं है, " +
      "लेकिन मैं इसे समझने का प्रयास कर रही हूँ।";

    pushContext(questionText, fallback);
    return fallback;
  }

  /* ==================================================
     🌐 EXPOSE (READ-ONLY • NO SIDE EFFECT)
     ================================================== */
  Object.defineProperty(window, "ReasoningEngine", {
    value: Object.freeze({ reason }),
    writable: false,
    configurable: false
  });

  // readiness flag (informational only)
  window.__REASONING_READY__ = true;

})(window);
