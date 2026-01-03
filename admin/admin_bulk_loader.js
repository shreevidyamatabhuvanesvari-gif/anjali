/* =========================================================
   admin_bulk_loader.js
   Role: Bulk Learning (100+/1000+ Q&A with Subject Control)
   Stage: 2 (Stable, Offline, Subject-Aware)
   Depends on: KnowledgeBase.js
   ========================================================= */

(function () {
  "use strict";

  if (!window.KnowledgeBase) {
    console.error("KnowledgeBase not loaded");
    return;
  }

  // ---------- MODAL ----------
  const modal = document.createElement("div");
  modal.id = "bulkLearningModal";
  modal.style.cssText = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.6);
    display:none;
    align-items:center;
    justify-content:center;
    z-index:10000;
  `;

  modal.innerHTML = `
    <div style="
      width:96%;
      max-width:760px;
      background:#1e1e1e;
      color:#eee;
      border-radius:18px;
      padding:16px;
      box-shadow:0 20px 44px rgba(0,0,0,.65)
    ">
      <h3 style="margin:0 0 10px;color:#ffd6d6;">
        📦 Bulk Learning (100+ / 1000+ प्रश्न)
      </h3>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
        <input id="bulkSubject"
          placeholder="नया विषय लिखें या नीचे से चुनें"
          style="
            flex:1;
            padding:10px;
            border-radius:10px;
            border:1px solid #333;
            background:#121212;
            color:#eee;
          ">
        <button id="loadSubjects"
          style="
            padding:10px 14px;
            border-radius:12px;
            background:#2a2a2a;
            color:#eee;
            border:1px solid #333;
          ">
          सभी विषय
        </button>
      </div>

      <div id="subjectList"
        style="
          display:none;
          max-height:120px;
          overflow:auto;
          border:1px solid #333;
          border-radius:10px;
          padding:6px;
          background:#121212;
          margin-bottom:10px;
        ">
      </div>

      <div style="font-size:12px;color:#ccc;margin-bottom:6px;">
        फॉर्मेट (हर प्रश्न–उत्तर के बीच एक खाली लाइन):
        <br>
        <code>
        Q: प्रश्न...?<br>
        A: उत्तर...
        </code>
      </div>

      <textarea id="bulkInput"
        placeholder="यहाँ 100+ / 1000+ प्रश्नोत्तर पेस्ट करें…"
        style="
          width:100%;
          min-height:220px;
          padding:10px;
          border-radius:12px;
          border:1px solid #333;
          background:#121212;
          color:#eee;
          resize:vertical;
        ">
      </textarea>

      <div style="display:flex;gap:8px;margin-top:10px;justify-content:space-between;flex-wrap:wrap;">
        <div id="bulkInfo" style="font-size:12px;color:#9fdf9f;">
          अभी कोई डेटा सेव नहीं हुआ
        </div>
        <div>
          <button id="bulkCancel"
            style="
              padding:10px 14px;
              border-radius:12px;
              background:#2a2a2a;
              color:#eee;
              border:1px solid #333;
            ">
            रद्द
          </button>
          <button id="bulkSave"
            style="
              padding:10px 14px;
              border-radius:12px;
              background:linear-gradient(180deg,#ffd6d6,#ffb3b3);
              color:#1b1b1b;
              border:none;
            ">
            सेव करें
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // ---------- OPEN ----------
  const openBtn = document.getElementById("bulkBtn");
  if (openBtn) {
    openBtn.onclick = () => {
      modal.style.display = "flex";
      document.getElementById("bulkInfo").textContent =
        "Bulk मोड तैयार है";
    };
  }

  // ---------- CLOSE ----------
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.style.display = "none";
  });
  document.getElementById("bulkCancel").onclick = () => {
    modal.style.display = "none";
  };

  // ---------- LOAD SUBJECTS ----------
  document.getElementById("loadSubjects").onclick = async () => {
    const box = document.getElementById("subjectList");
    box.innerHTML = "";
    box.style.display = "block";

    await KnowledgeBase.init();
    const items = await KnowledgeBase.getAll();

    const subjects = [...new Set(
      items.map(i => i.subject).filter(Boolean)
    )];

    if (!subjects.length) {
      box.innerHTML =
        "<div style='color:#aaa;'>कोई विषय उपलब्ध नहीं है।</div>";
      return;
    }

    subjects.forEach(s => {
      const div = document.createElement("div");
      div.textContent = s;
      div.style.cssText = `
        padding:6px 8px;
        cursor:pointer;
        border-radius:8px;
      `;
      div.onclick = () => {
        document.getElementById("bulkSubject").value = s;
        box.style.display = "none";
      };
      box.appendChild(div);
    });
  };

  // ---------- SAVE BULK ----------
  document.getElementById("bulkSave").onclick = async () => {
    const info = document.getElementById("bulkInfo");
    const subject =
      document.getElementById("bulkSubject").value.trim();
    const raw =
      document.getElementById("bulkInput").value.trim();

    if (!subject || !raw) {
      info.style.color = "#ff9f9f";
      info.textContent = "विषय और प्रश्नोत्तर दोनों आवश्यक हैं।";
      return;
    }

    const blocks = raw.split(/\n\s*\n/);
    let saved = 0;

    try {
      await KnowledgeBase.init();

      for (const b of blocks) {
        const q = b.match(/Q:\s*(.+)/i);
        const a = b.match(/A:\s*(.+)/i);
        if (q && a) {
          await KnowledgeBase.saveOne({
            subject,
            question: q[1].trim(),
            answer: a[1].trim()
          });
          saved++;
        }
      }

      info.style.color = "#9fdf9f";
      info.textContent =
        `सफलतापूर्वक सेव किए गए प्रश्न: ${saved}`;

      document.getElementById("bulkInput").value = "";

    } catch (e) {
      info.style.color = "#ff9f9f";
      info.textContent = "Bulk सेव में त्रुटि हुई।";
      console.error(e);
    }
  };

})();
