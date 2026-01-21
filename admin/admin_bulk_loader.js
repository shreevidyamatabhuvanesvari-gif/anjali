/* =========================================================
   admin_bulk_loader.js
   Role: Admin Bulk Learning (FINAL, STABLE)
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  if (!window.KnowledgeBase) {
    console.error("KnowledgeBase not loaded");
    return;
  }

  const bulk = document.getElementById("bulk");
  const msg = document.getElementById("msg2");

  if (!bulk || !msg) {
    // Bulk panel not present on this page
    return;
  }

  window.saveBulk = async function () {
    msg.textContent = "";
    msg.style.color = "#ccc";

    const raw = bulk.value.trim();
    if (!raw) {
      msg.style.color = "#ff9f9f";
      msg.textContent = "❌ कोई Bulk डेटा नहीं मिला";
      return;
    }

    const blocks = raw.split(/\n\s*\n/);
    let saved = 0;

    try {
      await KnowledgeBase.init();

      for (const block of blocks) {
        const qMatch = block.match(/Q:\s*([^\n]+)/i);
        const aMatch = block.match(/A:\s*([^\n]+)/i);

        if (!qMatch || !aMatch) continue;

        await KnowledgeBase.saveOne({
          question: qMatch[1].trim(),
          answer: aMatch[1].trim(),
          tags: []
        });

        saved++;
      }

      if (window.KnowledgeAnswerEngine?.resetIndex) {
        KnowledgeAnswerEngine.resetIndex();
      }

      msg.style.color = "#9fdf9f";
      msg.textContent = `✅ ${saved} प्रश्न Bulk से सफलतापूर्वक सेव हुए`;

    } catch (e) {
      console.error(e);
      msg.style.color = "#ff9f9f";
      msg.textContent = "❌ Bulk सेव करते समय त्रुटि हुई";
    }
  };
});
