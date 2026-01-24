/* =========================================================
   core/ReasoningEngine.js
   Role: Human-like Offline Reasoning Engine
   ========================================================= */
(function (window) {
  "use strict";

  if (!window.KnowledgeBase) {
    console.error("❌ ReasoningEngine: KnowledgeBase missing");
    return;
  }

    class ReasoningEngine {
    constructor() {
        // पर्यायवाची शब्दकोश: यहाँ मुख्य शब्दों के लिए उनके पर्यायवाची (synonyms) निर्धारित करें
        this.synonyms = {
            "राजधानी": ["मुख्य शहर"],
            "बड़ा": ["विशाल", "महान"],
            "सागर": ["समुद्र"]
        };
    }

    // normalize: टेक्स्ट को लोअरकेस में बदलें, विराम चिह्न हटा दें, और शब्दों में विभाजित करें
    normalize(text) {
        // लोअरकेस में परिवर्तन
        text = text.toLowerCase();
        // विराम चिह्न (punctuation) को हटाना (केवल अक्षर और संख्या छोड़कर)
        text = text.replace(/[^\p{L}\p{N}\s]/gu, "");
        // एक से अधिक स्पेस को एक स्पेस में बदलें और लीडिंग/ट्रेलिंग स्पेस हटाएं
        text = text.replace(/\s+/g, " ").trim();
        // स्पेस पर विभाजन करके टोकन (शब्दों) की सूची लौटाएँ
        return text.split(" ");
    }

    // किसी शब्द के पर्यायवाची (synonyms) प्राप्त करें
    getSynonyms(word) {
        return this.synonyms[word] || [];
    }

    // फ़ज़ी स्कोर: दो शब्दों के बीच समानता का स्कोर (Levenshtein दूरी के आधार पर)
    fuzzyScore(s1, s2) {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();
        // Levenshtein distance निकालें
        const dist = this.levenshtein(s1, s2);
        const maxLen = Math.max(s1.length, s2.length);
        if (maxLen === 0) return 1.0; // दोनों शब्द खाली हैं
        // समानता को [0,1] रेंज में परिवर्तित करें
        return (maxLen - dist) / maxLen;
    }

    // Levenshtein distance: दो स्ट्रिंग के बीच संपादन दूरी की गणना
    levenshtein(a, b) {
        const dp = [];
        // प्रारंभिक स्थिति सेटअप
        for (let i = 0; i <= a.length; i++) {
            dp[i] = [i];
        }
        for (let j = 1; j <= b.length; j++) {
            dp[0][j] = j;
        }
        // DP मैट्रिक्स भरें
        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                if (a[i - 1] === b[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1]; // कोई बदलाव नहीं
                } else {
                    dp[i][j] = Math.min(
                        dp[i - 1][j] + 1,    // delete
                        dp[i][j - 1] + 1,    // insert
                        dp[i - 1][j - 1] + 1 // replace
                    );
                }
            }
        }
        return dp[a.length][b.length];
    }
    }

  /* ---------- TEXT UTILS ---------- */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, "") // Hindi only
      .replace(/\s+/g, " ")
      .trim();
  }

  function words(text) {
    return normalize(text)
      .split(" ")
      .filter(w => w.length > 1);
  }

  /* ---------- MAIN REASONING ---------- */
  async function reason(questionText) {
    if (!questionText) {
      return { text: "मैं आपकी बात समझ नहीं पाई।" };
    }

    let all;
    try {
      await KnowledgeBase.init();
      all = await KnowledgeBase.getAll();
    } catch (_) {
      return { text: "मेरे ज्ञान तक पहुँचने में समस्या आ रही है।" };
    }

    if (!Array.isArray(all) || all.length === 0) {
      return { text: "मेरे पास अभी कोई सुरक्षित ज्ञान नहीं है।" };
    }

    const qWords = words(questionText);
    if (qWords.length === 0) {
      return { text: "मैं आपकी बात स्पष्ट रूप से समझ नहीं पाई।" };
    }

    let bestMatch = null;
    let bestScore = 0;

    for (const item of all) {
      if (!item.question || !item.answer) continue;

      const kWords = words(item.question);
      if (kWords.length === 0) continue;

      let matchCount = 0;
      for (const w of qWords) {
        if (kWords.includes(w)) matchCount++;
      }

      const score = matchCount / kWords.length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    // अगर स्कोर 0.25 से अधिक हुआ तो उत्तर दें
    if (bestMatch && bestScore >= 0.25) {
      return { text: bestMatch.answer };
    }

    return { text: "इस प्रश्न का उत्तर मेरे ज्ञान में अभी उपलब्ध नहीं है।" };
  }

  /* ---------- EXPOSE ---------- */
  Object.defineProperty(window, "ReasoningEngine", {
    value: { reason },
    writable: false,
    configurable: false
  });

  console.log("🧠 ReasoningEngine ready (fixed Hindi keyword threshold)");
})(window);
