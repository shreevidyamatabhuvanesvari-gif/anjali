class AnswerEngine {
    constructor(knowledgeAnswerEngine) {
        this.kAE = knowledgeAnswerEngine;
    }

    // प्रश्न का उत्तर प्राप्त करें
    getAnswer(question) {
        return this.kAE.getAnswer(question);
    }
}
