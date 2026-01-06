/* =========================================================
   admin/admin_bulk_loader.js
   Role: BULK Q&A IMPORTER (1000+ SAFE)
   ========================================================= */

(function () {
  "use strict";

  if (!window.KnowledgeBase) {
    alert("KnowledgeBase not loaded");
    return;
  }

  const btn = document.getElementById("bulkSave");
  const textarea = document.getElementById("bulkInput");
  const subjectBox = document.getElementById("bulkSubject");
  const info = document.getElementById("bulkInfo");

  if (!btn || !textarea) return;

  btn.onclick = async () => {
    const raw = textarea.value.trim();
    const subject = (subjectBox?.value || "").trim();

    if (!raw) {
      info.textContent = "कोई डेटा नहीं मिला";
      return;
    }

    const blocks = raw.split(/\n\s*\n/);
    const list = [];

    blocks.forEach(b => {
      const q = b.match(/Q:\s*(.+)/i);
      const a = b.match(/A:\s*(.+)/i);
      if (q && a) {
        list.push({
          question: q[1].trim(),
          answer: a[1].trim(),
          subject
        });
      }
    });

    if (!list.length) {
      info.textContent = "प्रश्न–उत्तर format गलत है";
      return;
    }

    try {
      await KnowledgeBase.init();
      const saved = await KnowledgeBase.saveMany(list);
      info.textContent = `✅ ${saved} प्रश्न सेव हुए`;
      textarea.value = "";
    } catch (e) {
      info.textContent = "❌ Bulk सेव विफल";
    }
  };

})();
