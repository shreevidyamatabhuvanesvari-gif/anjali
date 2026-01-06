/* =========================================================
   admin/admin_bulk_loader.js
   Role: Bulk Q/A Importer (FINAL, STABLE)
   GUARANTEE:
   - 1000+ Q/A mobile-safe
   - KnowledgeBase.js untouched
   - No transaction break
   ========================================================= */

(function () {
  "use strict";

  if (!window.KnowledgeBase) {
    console.error("KnowledgeBase missing");
    return;
  }

  const saveBtn = document.getElementById("bulkSave");
  const input = document.getElementById("bulkInput");
  const subjectInput = document.getElementById("bulkSubject");
  const info = document.getElementById("bulkInfo");

  if (!saveBtn || !input || !info) return;

  saveBtn.onclick = async () => {
    const raw = input.value.trim();
    const subject = subjectInput?.value.trim() || "";

    if (!raw) {
      info.textContent = "कोई प्रश्नोत्तर नहीं मिला।";
      return;
    }

    // 🔑 SAFE SPLIT
    const blocks = raw.split(/\n\s*\n/);
    let saved = 0;

    try {
      await KnowledgeBase.init();

      // 🔑 collect first (NO await in loop)
      const items = [];

      for (const block of blocks) {
        const q = block.match(/Q:\s*([\s\S]+?)(?:\n|$)/i);
        const a = block.match(/A:\s*([\s\S]+)/i);

        if (q && a) {
          items.push({
            question: q[1].trim(),
            answer: a[1].trim(),
            subject
          });
        }
      }

      // 🔑 sequential but SAFE
      for (let i = 0; i < items.length; i++) {
        await KnowledgeBase.saveOne(items[i]);
        saved++;
      }

      info.textContent = `✅ सफलतापूर्वक सेव हुए प्रश्न: ${saved}`;
      input.value = "";

    } catch (e) {
      console.error(e);
      info.textContent = "❌ Bulk सेव विफल";
    }
  };

})();
