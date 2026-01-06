/* =========================================
   Anjali REAL Diagnostic Engine (Compatible)
   - index.html के FORCED write के साथ अनुकूल
   - overwrite नहीं करता
   - data न हो तो भी सुरक्षित
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "ANJALI_REAL_DIAGNOSTIC";

  // पहले से मौजूद data पढ़ो (अगर हो)
  let existing = null;
  try {
    existing = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (e) {
    existing = null;
  }

  // नया runtime snapshot
  const runtimeReport = {
    timestamp: new Date().toISOString(),
    results: [],
    errors: []
  };

  function add(module, status, proof) {
    runtimeReport.results.push({ module, status, proof });
  }

  /* ===== SAFE CHECKS (index पर निर्भर) ===== */

  add(
    "Index Loaded",
    "OK",
    "index.html executed"
  );

  add(
    "Core / AnjaliCore",
    window.AnjaliCore ? "OK" : "MISSING",
    "window.AnjaliCore"
  );

  add(
    "Voice / TTS",
    window.TTS && typeof TTS.init === "function" ? "OK" : "PARTIAL",
    "TTS.init()"
  );

  add(
    "Voice / STT",
    window.STT && typeof STT.start === "function" ? "OK" : "PARTIAL",
    "STT.start()"
  );

  add(
    "UI / Start Button",
    document.getElementById("startBtn") ? "OK" : "MISSING",
    "#startBtn"
  );

  /* ===== ERROR CAPTURE (NON-INTRUSIVE) ===== */

  window.addEventListener("error", function (e) {
    runtimeReport.errors.push({
      message: e.message,
      source: e.filename,
      line: e.lineno
    });
  });

  window.addEventListener("unhandledrejection", function (e) {
    runtimeReport.errors.push({
      message: e.reason
    });
  });

  /* ===== MERGE LOGIC (यही असली FIX है) ===== */

  let finalReport;

  if (existing && existing.results) {
    // index ने कुछ लिखा है → उसे आधार मानो
    finalReport = existing;

    // runtime checks जोड़ दो (duplicate से बचते हुए)
    runtimeReport.results.forEach(r => {
      const already = finalReport.results.find(x => x.module === r.module);
      if (!already) {
        finalReport.results.push(r);
      }
    });

    // errors merge
    if (runtimeReport.errors.length) {
      finalReport.errors = finalReport.errors || [];
      finalReport.errors.push(...runtimeReport.errors);
    }
  } else {
    // index ने कुछ नहीं लिखा → engine अकेला काम करे
    finalReport = runtimeReport;
  }

  /* ===== SAVE BACK (NO CONFLICT) ===== */

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalReport));
  } catch (e) {
    /* intentionally silent */
  }

  // expose (debug / UI के लिए)
  window.AnjaliRealDiagnosticReport = finalReport;

})();
