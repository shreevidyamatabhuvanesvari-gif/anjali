/* =========================================================
   admin/admin_bulk_loader.js
   Role: Bulk Q/A Importer (BULK-SAFE, FINAL)
   FIX:
   - Single IndexedDB transaction
   - 1000+ mobile-safe
   - KnowledgeBase.js untouched
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
    const subject = subjectInput ? subjectInput.value.trim() : "";

    if (!raw) {
      info.textContent = "कोई प्रश्नोत्तर नहीं मिला।";
      return;
    }

    const blocks = raw.split(/\n\s*\n/);
let count = 0;

for (const block of blocks) {
  const q = block.match(/Q:\s*(.+)/i);
  const a = block.match(/A:\s*(.+)/i);
  const t = block.match(/TAGS:\s*(.+)/i);

  if (q && a) {
    await KnowledgeBase.saveOne({
      question: q[1].trim(),
      answer: a[1].trim(),
      tags: t ? t[1].split(",").map(x => x.trim()) : []
    });
    count++;
  }
}

    async function saveBulk() {
  const msg = document.getElementById("msg2");
  const bulk = document.getElementById("bulk");

  try {
    await KnowledgeBase.init();

    const raw = bulk.value.trim();
    if (!raw) {
      msg.style.color = "#ff9f9f";
      msg.textContent = "❌ इनपुट खाली है";
      return;
    }

    // Windows + Android newline safe split
    const blocks = raw.split(/\r?\n\s*\r?\n/);

    let count = 0;

    for (const block of blocks) {
      const q = block.match(/Q:\s*(.+)/i);
      const a = block.match(/A:\s*(.+)/i);
      const t = block.match(/TAGS:\s*(.+)/i);

      if (!q || !a) continue;

      // 🔴 CRITICAL FIX: sequential DB writes
      await KnowledgeBase.saveOne({
        question: q[1].trim(),
        answer: a[1].trim(),
        tags: t ? t[1].split(",").map(x => x.trim()) : []
      });

      count++;

      // DB को सांस लेने का समय
      await new Promise(r => setTimeout(r, 50));
    }

    msg.style.color = "#9fdf9f";
    msg.textContent = `✔️ ${count} प्रश्न सेव हुए`;

  } catch (e) {
    console.error("Bulk save fatal error:", e);
    msg.style.color = "#ff9f9f";
    msg.textContent = "❌ Bulk सेव विफल";
  }
}

    msg.style.color = "#9fdf9f";
    msg.textContent = `✔️ ${count} प्रश्न सेव हुए`;

  } catch (e) {
    console.error("Bulk save fatal error:", e);
    msg.style.color = "#ff9f9f";
    msg.textContent = "❌ Bulk सेव विफल";
  }
}

    msg.style.color = "#9fdf9f";
    msg.textContent = `✔️ ${count} प्रश्न सेव हुए`;

  } catch (e) {
    console.error("Bulk save error:", e);
    msg.style.color = "#ff9f9f";
    msg.textContent = "❌ Bulk सेव विफल";
  }
}

    if (!items.length) {
      info.textContent = "कोई वैध प्रश्नोत्तर नहीं मिला।";
      return;
    }

    try {
      await KnowledgeBase.init();

      // ✅ PURE BULK WRITE VIA KnowledgeBase (Single-Save Pipe)

async function saveBulk() {
  const info = document.getElementById("msg2");
  const input = document.getElementById("bulk");

  try {
    await KnowledgeBase.init();

    const raw = input.value.trim();
    if (!raw) {
      info.textContent = "❌ इनपुट खाली है";
      return;
    }

    // Android + Windows newline safe split
    const blocks = raw.split(/\r?\n\s*\r?\n/);

    let saved = 0;

    for (const block of blocks) {
      const q = block.match(/Q:\s*(.+)/i);
      const a = block.match(/A:\s*(.+)/i);
      const t = block.match(/TAGS:\s*(.+)/i);

      if (!q || !a) continue;

      // 🔑 यही वही रास्ता है जिससे Single Save चलता है
      await KnowledgeBase.saveOne({
        question: q[1].trim(),
        answer: a[1].trim(),
        tags: t ? t[1].split(",").map(x => x.trim()) : []
      });

      saved++;
    }

    info.textContent = `✅ सफलतापूर्वक सेव हुए प्रश्न: ${saved}`;
    input.value = "";

  } catch (e) {
    console.error(e);
    info.textContent = "❌ Bulk सेव विफल";
     window.saveBulk = saveBulk;
  }
}

})();
