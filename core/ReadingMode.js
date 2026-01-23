/* =========================================================
   core/ReadingMode.js
   Role: Reading Mode Controller (Article / Long Text)
   ========================================================= */
(function (window) {
  "use strict";

  let readingActive = false;
  let buffer = [];

  const ReadingMode = {

    /* 🔓 Reading Mode शुरू */
    start() {
      readingActive = true;
      buffer = [];
    },

    /* 📖 लेख का हिस्सा जोड़ें */
    addText(text) {
      if (!readingActive || !text) return;
      buffer.push(String(text));
    },

    /* 🧠 पूरा लेख context के रूप में दो */
    getFullText() {
      return buffer.join("\n");
    },

    /* 🔒 Reading Mode चालू है? */
    isActive() {
      return readingActive;
    },

    /* 🔁 Reading → Reasoning */
    end() {
      readingActive = false;
      const fullText = buffer.join("\n");
      buffer = [];
      return fullText;
    },

    /* 🧹 आपात reset */
    reset() {
      readingActive = false;
      buffer = [];
    }
  };

  Object.defineProperty(window, "ReadingMode", {
    value: ReadingMode,
    writable: false,
    configurable: false
  });

})(window);
