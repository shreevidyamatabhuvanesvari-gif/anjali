/* =========================================
   Anjali REAL Diagnostic Engine (Level-1)
   Truth-based Runtime Checks
   ========================================= */

(function () {
  "use strict";

  const report = {
    timestamp: new Date().toISOString(),
    results: [],
    errors: []
  };

  function addResult(module, status, proof) {
    report.results.push({
      module,
      status,      // "OK" | "ERROR" | "MISSING"
      proof
    });
  }

  /* ---------- CORE CHECK ---------- */
  addResult(
    "Core / AnjaliCore",
    typeof window.AnjaliCore !== "undefined" ? "OK" : "MISSING",
    "window.AnjaliCore"
  );

  /* ---------- VOICE INPUT ---------- */
  addResult(
    "Voice Input (STT)",
    window.STT && typeof STT.start === "function" ? "OK" : "ERROR",
    "STT.start()"
  );

  /* ---------- VOICE OUTPUT ---------- */
  addResult(
    "Voice Output (TTS)",
    window.TTS && typeof TTS.init === "function" ? "OK" : "ERROR",
    "TTS.init()"
  );

  /* ---------- CONVERSATION HOOK ---------- */
  addResult(
    "Conversation Hook",
    typeof window.onAnjaliAnswered === "function" ? "OK" : "MISSING",
    "window.onAnjaliAnswered"
  );

  /* ---------- DOM CHECK ---------- */
  addResult(
    "UI Start Button",
    document.getElementById("startBtn") ? "OK" : "MISSING",
    "#startBtn"
  );

  addResult(
    "Admin Button",
    document.getElementById("adminBtn") ? "OK" : "MISSING",
    "#adminBtn"
  );

  /* ---------- RUNTIME ERROR CAPTURE ---------- */
  window.onerror = function (msg, src, line, col) {
    report.errors.push({
      message: msg,
      source: src,
      line,
      column: col
    });
  };

  window.onunhandledrejection = function (e) {
    report.errors.push({
      message: e.reason,
      source: "Promise Rejection"
    });
  };

  /* ---------- EXPOSE REPORT ---------- */
  window.AnjaliRealDiagnosticReport = report;

})();
