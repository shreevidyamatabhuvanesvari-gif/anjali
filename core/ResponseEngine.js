class ResponseEngine {
    constructor(reasoningEngine, answerEngine) {
        this.reasoning = reasoningEngine;
        this.answerEngine = answerEngine;
        // फॉलबैक संदेश यदि कोई उत्तर न मिले
        this.fallbackMessage = "माफ़ कीजिये, मुझे इसका उत्तर ज्ञात नहीं है।";
    }

    // प्रश्न के लिए प्रतिक्रिया प्राप्त करें (Reasoning → Answer → Fallback)
    getResponse(question) {
        // चरण 1: प्रश्न को सामान्यीकृत करें
        const normalizedTokens = this.reasoning.normalize(question);
        const normalizedQ = normalizedTokens.join(" ");
        // चरण 2: KnowledgeAnswerEngine से उत्तर प्राप्त करें
        const answer = this.answerEngine.getAnswer(normalizedQ);
        if (answer) {
            return answer;
        }
        // चरण 3: यदि कोई उत्तर नहीं मिला तो फॉलबैक संदेश लौटाएँ
        return this.fallbackMessage;
    }
}
