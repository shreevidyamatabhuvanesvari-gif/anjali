class KnowledgeAnswerEngine {
    constructor(reasoningEngine) {
        this.reasoning = reasoningEngine;
    }

    // प्रश्न के लिए उत्तर खोजें (multi-strategy retrieval)
    getAnswer(question) {
        // चरण 1: प्रश्न को सामान्यीकृत करें
        const queryTokens = this.reasoning.normalize(question);
        const normalizedQuery = queryTokens.join(" ");

        // रणनीति 1: समान (exact) मिलान
        for (let item of KnowledgeBase) {
            const kbTokens = this.reasoning.normalize(item.question).join(" ");
            if (normalizedQuery === kbTokens) {
                return item.answer;
            }
        }

        // रणनीति 2: फ़ज़ी और पर्यायवाची के साथ मिलान
        let bestScore = 0;
        let bestAnswer = null;
        for (let item of KnowledgeBase) {
            const kbTokens = this.reasoning.normalize(item.question);
            let score = 0;
            // प्रत्येक token पर विचार करें
            for (let qt of queryTokens) {
                // exact token मिलान
                if (kbTokens.includes(qt)) {
                    score += 2;
                } else {
                    // synonyms के आधार पर मिलान
                    const syns = this.reasoning.getSynonyms(qt);
                    for (let syn of syns) {
                        if (kbTokens.includes(syn)) {
                            score += 1.5;
                        }
                    }
                    // फ़ज़ी मिलान
                    for (let kt of kbTokens) {
                        const fs = this.reasoning.fuzzyScore(qt, kt);
                        if (fs > 0.8) { // यदि similarity उच्च हो
                            score += fs;
                        }
                    }
                }
            }
            // सर्वोत्तम स्कोर के आधार पर जवाब चुनें
            if (score > bestScore) {
                bestScore = score;
                bestAnswer = item.answer;
            }
        }

        // यदि किसी का स्कोर मिल गया हो, तो उत्तर लौटाएँ
        if (bestAnswer) {
            return bestAnswer;
        }
        // कुछ नहीं मिला
        return null;
    }
}
