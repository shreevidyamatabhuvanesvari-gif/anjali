/* =========================================================
   admin/admin_bulk_loader.js
   Role: BULK Q/A IMPORTER (LEVEL-3 SAFE)
   GUARANTEE:
   - 1000+ Q/A mobile-safe
   - Single transaction only
   - KnowledgeBase.js untouched
   - No schema change
   - No async loop abuse
   ========================================================= */

(function () {
  "use strict";

  if (!window.KnowledgeBase) {
    console.error("❌ KnowledgeBase not loaded");
    return;
  }

  /* =========================================================
     UI REFERENCES
     ========================================================= */
  const bulkBtn     = document.getElementById("bulkBtn");
  const bulkInput   = document.getElementById("bulkInput");
  const bulkSubject = document.getElementById("bulkSubject");
  const bulkInfo    = document.getElementById("bulkInfo");
  const bulkSave    = document.getElementById("bulkSave");
  const bulkCancel  = document.getElementById("bulkCancel");
  const modal       = document.getElementById("bulkLearningModal");

  if (!bulkBtn || !bulkInput || !bulkSave) {
    console.warn("⚠️ Bulk UI elements missing");
    return;
  }

  /* =========================================================
     OPEN / CLOSE MODAL
     ========================================================= */
  bulkBtn.onclick = () => {
    modal.style.display = "flex";
    bulkInfo.textContent = "Bulk मोड तैयार है";
    bulkInfo.style.color = "#9fdf9f";
  };

  bulkCancel.onclick = () => {
    modal.style.display = "none";
  };

  modal.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
  };

  /* =========================================================
     PARSER (Q/A BLOCK SAFE)
     ========================================================= */
  function parseBulkText(rawText, subject) {
    const blocks = rawText.split(/\n\s*\n+/);
    const list = [];

    for (const block of blocks) {
      const qMatch = block.match(/Q:\s*(.+)/i);
      const aMatch = block.match(/A:\s*(.+)/i);

      if (!qMatch || !aMatch) continue;

      list.push({
        question: qMatch[1].trim(),
        answer:   aMatch[1].trim(),
        subject:  subject
      });
    }

    return list;
  }

  /* =========================================================
     SAVE BULK (1000+ SAFE)
     ========================================================= */
  bulkSave.onclick = async () => {
    const raw     = bulkInput.value.trim();
    const subject = bulkSubject.value.trim();

    if (!raw || !subject) {
      bulkInfo.style.color = "#ff9f9f";
      bulkInfo.textContent = "❌ विषय और प्रश्नोत्तर आवश्यक हैं";
      return;
    }

    let list;
    try {
      list = parseBulkText(raw, subject);
    } catch (e) {
      bulkInfo.style.color = "#ff9f9f";
      bulkInfo.textContent = "❌ डेटा पार्स नहीं हो पाया";
      return;
    }

    if (list.length === 0) {
      bulkInfo.style.color = "#ff9f9f";
      bulkInfo.textContent = "❌ वैध प्रश्नोत्तर नहीं मिले";
      return;
    }

    bulkInfo.style.color = "#ccc";
    bulkInfo.textContent = "⏳ सेव हो रहा है… कृपया प्रतीक्षा करें";

    try {
      await KnowledgeBase.init();

      // 🔑 ROOT FIX — SINGLE TRANSACTION BULK SAVE
      const savedCount = await KnowledgeBase.saveMany(list);

      bulkInfo.style.color = "#9fdf9f";
      bulkInfo.textContent =
        `✅ सफलतापूर्वक सेव किए गए प्रश्न: ${savedCount}`;

      bulkInput.value = "";

    } catch (e) {
      bulkInfo.style.color = "#ff9f9f";
      bulkInfo.textContent = "❌ Bulk सेव विफल";
      console.error(e);
    }
  };

})();
