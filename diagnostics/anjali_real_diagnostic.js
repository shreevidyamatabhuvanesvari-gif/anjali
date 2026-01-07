/* =========================================
   Re-runnable Diagnostic Engine
   ========================================= */

(function () {
  "use strict";

  function runAnjaliDiagnostic() {

    const report = {
      timestamp: new Date().toISOString(),
      results: [],
      errors: []
    };

    function add(module, status, proof) {
      report.results.push({ module, status, proof });
    }

    /* ---- CHECKS (अब सही समय पर) ---- */

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
      "UI / Start Button",
      document.getElementById("startBtn") ? "OK" : "MISSING",
      "#startBtn"
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

    /* ---- SAVE ---- */
    window.AnjaliRealDiagnosticReport = report;
    localStorage.setItem(
      "ANJALI_REAL_DIAGNOSTIC",
      JSON.stringify(report)
    );
  }

  /* expose runner */
  window.runAnjaliDiagnostic = runAnjaliDiagnostic;

})();
