/* =========================================================
   admin/admin_bulk_loader.js
   Role: Bulk Q/A Importer (WORKING VERSION)
   NOTE:
   - यही structure पहले bulk में सफल था
   - saveOne को loop में call करता है (safe)
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

  if (!saveBtn) return;

  saveBtn.onclick = async () => {
    const raw = input.value.trim();
    const subject = subjectInput.value.trim();

    if (!raw) {
      info.textContent = "कोई प्रश्नोत्तर नहीं मिला।";
      return;
    }

    const blocks = raw.split(/\n\s*\n/);
    let saved = 0;

    try {
      await KnowledgeBase.init();

      for (const block of blocks) {
        const q = block.match(/Q:\s*(.+)/i);
        const a = block.match(/A:\s*(.+)/i);

        if (q && a) {
          await KnowledgeBase.saveOne({
            question: q[1].trim(),
            answer: a[1].trim(),
            subject
          });
          saved++;
        }
      }

      info.textContent = `✅ सेव हुए प्रश्न: ${saved}`;
      input.value = "";

    } catch (e) {
      console.error(e);
      info.textContent = "❌ Bulk सेव विफल";
    }
  };

})();
