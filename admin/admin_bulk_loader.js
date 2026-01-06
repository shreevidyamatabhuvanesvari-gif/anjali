<script>
/* =========================================================
   admin/admin_bulk_loader.js
   Role: Bulk Q/A Importer (100–1000+ SAFE)
   Depends on: KnowledgeBase.js (already loaded)
   GUARANTEE:
   - Bulk save works
   - Single save unaffected
   - No schema change
   ========================================================= */

(function () {
  "use strict";

  if (!window.KnowledgeBase) {
    console.error("❌ KnowledgeBase not loaded");
    return;
  }

  /* ================= UI ================= */

  const modal = document.createElement("div");
  modal.style.cssText = `
    position:fixed; inset:0;
    background:rgba(0,0,0,.6);
    display:none;
    align-items:center;
    justify-content:center;
    z-index:9999;
  `;

  modal.innerHTML = `
    <div style="width:95%;max-width:760px;background:#1e1e1e;
                color:#eee;border-radius:18px;padding:16px;">
      <h3>📦 Bulk Question Loader (1000+)</h3>

      <div style="font-size:13px;margin-bottom:6px;">
        Format:
        <pre style="background:#111;padding:6px;border-radius:8px;">
Q: प्रश्न?
A: उत्तर

Q: प्रश्न?
A: उत्तर
        </pre>
      </div>

      <textarea id="bulkInput"
        placeholder="यहाँ प्रश्नोत्तर पेस्ट करें…"
        style="width:100%;min-height:220px;
               padding:10px;border-radius:12px;
               background:#111;color:#eee;">
      </textarea>

      <div style="display:flex;justify-content:space-between;margin-top:10px;">
        <div id="bulkInfo" style="font-size:12px;color:#9fdf9f;">
          तैयार
        </div>
        <div>
          <button id="bulkClose">बंद</button>
          <button id="bulkSave">सेव करें</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  /* ================= OPEN ================= */

  const openBtn = document.getElementById("bulkBtn");
  if (openBtn) {
    openBtn.onclick = () => {
      modal.style.display = "flex";
      document.getElementById("bulkInfo").textContent =
        "Bulk मोड सक्रिय";
    };
  }

  document.getElementById("bulkClose").onclick = () => {
    modal.style.display = "none";
  };

  modal.onclick = e => {
    if (e.target === modal) modal.style.display = "none";
  };

  /* ================= SAVE LOGIC ================= */

  document.getElementById("bulkSave").onclick = async () => {
    const info = document.getElementById("bulkInfo");
    const raw = document.getElementById("bulkInput").value.trim();

    if (!raw) {
      info.style.color = "#ff9f9f";
      info.textContent = "❌ कोई डेटा नहीं मिला";
      return;
    }

    const blocks = raw.split(/\n\s*\n/);
    const list = [];

    for (const block of blocks) {
      const q = block.match(/^Q:\s*(.+)$/im);
      const a = block.match(/^A:\s*(.+)$/im);

      if (q && a) {
        list.push({
          question: q[1].trim(),
          answer: a[1].trim()
        });
      }
    }

    if (!list.length) {
      info.style.color = "#ff9f9f";
      info.textContent = "❌ सही Q/A फॉर्मेट नहीं मिला";
      return;
    }

    try {
      await KnowledgeBase.init();
      const saved = await KnowledgeBase.saveMany(list);

      info.style.color = "#9fdf9f";
      info.textContent = `✅ ${saved} प्रश्न सफलतापूर्वक सेव हुए`;

      document.getElementById("bulkInput").value = "";
    } catch (e) {
      info.style.color = "#ff9f9f";
      info.textContent = "❌ Bulk सेव में त्रुटि";
      console.error(e);
    }
  };

})();
</script>
