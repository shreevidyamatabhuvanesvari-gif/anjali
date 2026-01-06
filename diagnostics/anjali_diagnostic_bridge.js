(function () {
  "use strict";

  // ⏳ wait until engine is ready
  if (!window.AnjaliRealDiagnosticReport) {
    console.error("❌ Real Diagnostic Engine not loaded");
    window.AnjaliUIDiagnosticData = null;
    return;
  }

  const raw = window.AnjaliRealDiagnosticReport;

  window.AnjaliUIDiagnosticData = {
    generatedAt: raw.timestamp,
    modules: raw.results || [],
    runtimeErrors: raw.errors || []
  };

  console.log("✅ Diagnostic data prepared", window.AnjaliUIDiagnosticData);

})();
