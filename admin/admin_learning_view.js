/* =========================================================
   admin_learning_view.js
   Role: View Learned Q&A (Read Only)
   Stage: 2 (Stable)
   Depends on: KnowledgeBase.js
   ========================================================= */

(function () {
  "use strict";

  if (!window.KnowledgeBase) {
    console.error("KnowledgeBase not loaded");
    return;
  }

  // ---------- CREATE MODAL ----------
  const modal = document.createElement("div");
  modal.id = "learningViewModal";
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
      max-width:700px;
      background:#1e1e1e;
      color:#eee;
      border-radius:18px;
      padding:16px;
      box-shadow:0 20px 44px rgba(0,0,0,.65)
    ">
      <h3 style="margin:0 0 8px;color:#ffd6d6;">
        📚 सीखा हुआ ज्ञान
      </h3>

      <div id="learnCount"
        style="font-size:12px;color:#ccc;margin-bottom:8px;">
        लोड हो रहा है…
      </div>

      <div id="learnList"
        style="
          max-height:360px;
          overflow:auto;
          border:1px solid #333;
          border-radius:12px;
          padding:10px;
          background:#121212;
        ">
      </div>

      <div style="display:flex;justify-content:flex-end;margin-top:10px;">
        <button id="closeLearnView"
          style="
            padding:10px 14px;
            border-radius:12px;
            background:#2a2a2a;
            color:#eee;
            border:1px solid #333;
          ">
          बंद करें
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // ---------- RENDER ----------
  function render(items) {
    const box = document.getElementById("learnList");
    box.innerHTML = "";

    if (!items.length) {
      box.innerHTML =
        "<div style='color:#aaa;'>कोई प्रश्न–उत्तर सुरक्षित नहीं है।</div>";
      return;
    }

    items.forEach((it, i) => {
      const div = document.createElement("div");
      div.style.cssText = `
        border-bottom:1px dashed #333;
        padding:8px 4px;
        margin-bottom:6px;
      `;

      div.innerHTML = `
        <div style="font-size:12px;color:#ffb3b3;">
          ${i + 1}.
        </div>
        <div style="font-size:13px;margin-top:4px;">
          <b>Q:</b> ${it.question}
        </div>
        <div style="font-size:13px;margin-top:2px;">
          <b>A:</b> ${it.answer}
        </div>
        <div style="font-size:11px;color:#aaa;margin-top:2px;">
          ${it.tags && it.tags.length ? "टैग: " + it.tags.join(", ") : ""}
        </div>
      `;
      box.appendChild(div);
    });
  }

  // ---------- OPEN BUTTON ----------
  const openBtn = document.getElementById("viewLearnBtn");
  if (openBtn) {
    openBtn.onclick = async function () {
      modal.style.display = "flex";

      try {
        await KnowledgeBase.init();
        const items = await KnowledgeBase.getAll();

        document.getElementById("learnCount").textContent =
          "कुल सुरक्षित प्रश्न–उत्तर: " + items.length;

        render(items);
      } catch (e) {
        document.getElementById("learnCount").textContent =
          "डेटा लोड करने में त्रुटि हुई।";
        console.error(e);
      }
    };
  }

  // ---------- CLOSE ----------
  modal.addEventListener("click", function (e) {
    if (e.target === modal) modal.style.display = "none";
  });

  document.getElementById("closeLearnView").onclick = function () {
    modal.style.display = "none";
  };

})();
