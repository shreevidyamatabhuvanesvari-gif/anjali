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
    const blocks = raw.split(/\n\s*\n/);

    let count = 0;

    for (const block of blocks) {
      try {
        const q = block.match(/Q:\s*(.+)/i);
        const a = block.match(/A:\s*(.+)/i);
        const t = block.match(/TAGS:\s*(.+)/i);

        if (!q || !a) continue; // गलत block को skip

        await KnowledgeBase.saveOne({
          question: q[1].trim(),
          answer: a[1].trim(),
          tags: t ? t[1].split(",").map(x => x.trim()) : []
        });

        saved++;
      });

      } catch (innerErr) {
        console.warn("⚠️ इस block को छोड़ दिया:", block);
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

      // 🔑 DIRECT BULK WRITE (single transaction)
      const db = await (async () => {
        await KnowledgeBase.init();
        return new Promise(res => {
          const req = indexedDB.open("AnjaliKnowledgeDB", 1);
          req.onsuccess = e => res(e.target.result);
        });
      })();

      const tx = db.transaction("qa_store", "readwrite");
      const store = tx.objectStore("qa_store");

      let saved = 0;
      items.forEach(item => {
        store.add({
          question: item.question,
          answer: item.answer,
          subject: item.subject,
          time: Date.now()
        });
        saved++;
      });

      tx.oncomplete = () => {
        info.textContent = `✅ सफलतापूर्वक सेव हुए प्रश्न: ${saved}`;
        input.value = "";
      };

      tx.onerror = () => {
        info.textContent = "❌ Bulk सेव विफल";
      };

    } catch (e) {
      console.error(e);
      info.textContent = "❌ Bulk सेव विफल";
    }
  };

})();
