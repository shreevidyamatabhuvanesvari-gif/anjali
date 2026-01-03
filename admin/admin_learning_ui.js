/* =========================================================
   admin_learning_ui.js
   Role: Admin Single Learning (FINAL, STABLE)
   ========================================================= */

(function () {
  "use strict";

  if (!window.KnowledgeBase) {
    alert("❌ KnowledgeBase लोड नहीं हुई");
    return;
  }

  const modal = document.getElementById("learningModal");
  const saveBtn = document.getElementById("learnSave");
  const cancelBtn = document.getElementById("learnCancel");
  const msg = document.getElementById("learnMsg");

  if (!modal || !saveBtn) {
    alert("❌ Learning Modal HTML में नहीं मिला");
    return;
  }

  // ❌ Cancel
  cancelBtn.onclick = () => {
    modal.style.display = "none";
  };

  // ✅ SAVE (निर्णायक)
  saveBtn.onclick = async () => {
    msg.textContent = "";

    const question = document.getElementById("learnQuestion").value.trim();
    const answer = document.getElementById("learnAnswer").value.trim();
    const tags = document.getElementById("learnTags").value
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    if (!question || !answer) {
      msg.style.color = "#ff9f9f";
      msg.textContent = "❌ प्रश्न और उत्तर दोनों आवश्यक हैं";
      return;
    }

    try {
      await KnowledgeBase.init();

      await KnowledgeBase.saveOne({
        question,
        answer,
        tags
      });

      msg.style.color = "#9fdf9f";
      msg.textContent = "✅ प्रश्न सफलतापूर्वक सेव हो गया";

      // Clear fields
      document.getElementById("learnQuestion").value = "";
      document.getElementById("learnAnswer").value = "";
      document.getElementById("learnTags").value = "";

    } catch (e) {
      msg.style.color = "#ff9f9f";
      msg.textContent = "❌ सेव करते समय त्रुटि हुई";
      console.error(e);
    }
  };

})();
