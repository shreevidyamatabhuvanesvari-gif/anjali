/* =========================================================
   core/ReasoningEngine.js
   Role: Deep Offline Reasoning + Contextual Answer Synthesis
   RAM Profile: ~30–50 MB (bounded, safe under 150 MB)
   ========================================================= */

(function (window) {
  "use strict";

  if (!window.KnowledgeBase) {
    console.error("ReasoningEngine: KnowledgeBase missing");
    return;
  }

  /* ---------- CONFIG ---------- */
  const MAX_KNOWLEDGE_SCAN = 3000;
  const MAX_CONTEXT_TURNS  = 6;

  /* ---------- संकेत शब्द ---------- */

  // 🔹 मुख्य प्रश्न संकेत (High Priority)
  const CORE_SIGNALS = [
    "क्या","कौन","कहाँ","कब","कैसे","क्यों",
    "किस","किसका","किसकी","किससे",
    "यदि","तो","भी"
  ];

  // 🔹 बातचीत दिशा / follow-up संकेत
  const FLOW_SIGNALS = [
    "और","फिर","उसके बाद","इसके बाद",
    "इसमें","उसमें","आगे","साथ ही"
  ];

  // 🔹 भाव / अनिश्चितता संकेत
  const SOFT_SIGNALS = [
    "शायद","संभवतः","लगता","प्रतीत","हो सकता","अनुमान",
    "अरे","अच्छा","ठीक","हाँ","नहीं","ओह","सुनो","देखो","बताओ"
  ];

  // 🔹 गौण लेकिन महत्त्वपूर्ण संकेत (ignore नहीं करने हैं)
  const SECONDARY_SIGNALS = [
    "कितना","कितनी","इसके अलावा","भी तो",
    "इसी कारण","परिणामस्वरूप","इस वजह से","अतः",
    "जैसा","वैसा","जैसे","वैसे","तुलना","के मुकाबले",
    "से बेहतर","से कम","क्योंकि","इसलिए",
    "ही","ही तो","ही नहीं","अवश्य","निश्चय"
  ];

  const STOP_WORDS = [
    ...CORE_SIGNALS,
    ...FLOW_SIGNALS,
    ...SOFT_SIGNALS,
    "है","हैं","था","थे","में","पर","से","का","की","के"
  ];

  /* ---------- TEXT UTILITIES ---------- */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, "")
      .trim();
  }

  function extractKeywords(text) {
    return normalize(text)
      .split(/\s+/)
      .filter(w => w.length > 1 && !STOP_WORDS.includes(w));
  }

  function containsAny(text, list) {
    return list.some(w => text.includes(w));
  }

  /* ---------- CONTEXT HELPERS ---------- */
  function getContext() {
    return window.ContextMemory
      ? ContextMemory.getRecent(MAX_CONTEXT_TURNS)
      : [];
  }

  function contextBiasScore(keywords, context) {
    let score = 0;
    for (const turn of context) {
      const tq = normalize(turn.question || "");
      for (const k of keywords) {
        if (tq.includes(k)) score += 0.6;
      }
    }
    return score;
  }

  /* ---------- MAIN REASONING ---------- */
  async function reason(questionText) {
    if (!questionText) {
      return "मैं आपकी बात समझ नहीं पाई।";
    }

    await KnowledgeBase.init();
    const all = await KnowledgeBase.getAll();

    if (!Array.isArray(all) || all.length === 0) {
      return "मेरे पास अभी पर्याप्त ज्ञान नहीं है।";
    }

    const qNorm   = normalize(questionText);
    const qKeys   = extractKeywords(questionText);
    const context = getContext();

    const hasFollowUp =
      containsAny(qNorm, FLOW_SIGNALS) ||
      context.length > 0 && qKeys.length < 3;

    /* ---------- 1️⃣ DIRECT MATCH ---------- */
    for (let i = 0; i < all.length && i < MAX_KNOWLEDGE_SCAN; i++) {
      const kq = normalize(all[i].question);
      if (!kq) continue;

      if (qNorm.includes(kq) || kq.includes(qNorm)) {
        if (window.ContextMemory) {
          ContextMemory.add({ question: questionText, answer: all[i].answer });
        }
        return all[i].answer;
      }
    }

    /* ---------- 2️⃣ CONTEXTUAL + SEMANTIC SCORING ---------- */
    let best = null;
    let bestScore = 0;

    for (let i = 0; i < all.length && i < MAX_KNOWLEDGE_SCAN; i++) {
      const k = all[i];
      const kKeys = extractKeywords(k.question);
      if (kKeys.length === 0) continue;

      let score = 0;

      // keyword overlap
      for (const qw of qKeys) {
        if (kKeys.includes(qw)) score += 1;
      }

      // context influence
      score += contextBiasScore(qKeys, context);

      // follow-up boost
      if (hasFollowUp) score += 1;

      // reasoning signal boost
      if (containsAny(qNorm, CORE_SIGNALS)) score += 0.5;
      if (containsAny(qNorm, SECONDARY_SIGNALS)) score += 0.3;

      if (score > bestScore) {
        bestScore = score;
        best = k;
      }
    }

    if (best && bestScore > 0) {
      if (window.ContextMemory) {
        ContextMemory.add({ question: questionText, answer: best.answer });
      }
      return best.answer;
    }

    /* ---------- 3️⃣ HUMAN-STYLE FALLBACK ---------- */
    const fallback =
      hasFollowUp
        ? "आप उसी विषय को आगे बढ़ा रहे हैं। कृपया थोड़ा और स्पष्ट करें।"
        : "इस प्रश्न पर मेरा सीधा ज्ञान नहीं है, लेकिन मैं इसे समझने की कोशिश कर रही हूँ।";

    if (window.ContextMemory) {
      ContextMemory.add({ question: questionText, answer: fallback });
    }
    return fallback;
  }

  /* ---------- EXPOSE ---------- */
  Object.defineProperty(window, "ReasoningEngine", {
    value: { reason },
    writable: false,
    configurable: false
  });

  window.__REASONING_READY__ = true;

})(window);
