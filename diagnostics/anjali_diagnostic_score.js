/* =========================================
   Anjali Diagnostic Score Calculator
   Computes overall system health percentage
   ========================================= */

(function () {
  "use strict";

  function calculateScore() {

    const report = window.AnjaliRealDiagnosticReport;
    const spec = window.AnjaliDiagnosticSpec;
    const weights = window.AnjaliDiagnosticWeights;

    /* Safety checks */
    if (!report || !Array.isArray(report.results)) return;
    if (!Array.isArray(spec) || !weights) return;

    let totalWeight = 0;
    let achievedWeight = 0;

    /* Helper: status → multiplier */
    function statusFactor(status) {
      if (status === "OK") return 1;
      if (status === "PARTIAL") return 0.5;
      return 0; // MISSING / ERROR
    }

    /* Iterate through spec-defined checks */
    spec.forEach(item => {
      const weight = Number(weights[item.id]) || 0;
      totalWeight += weight;

      /* Find matching diagnostic result */
      const result = report.results.find(r =>
        r.module.toLowerCase().includes(item.label.toLowerCase())
      );

      if (result) {
        achievedWeight += weight * statusFactor(result.status);
      }
    });

    /* Normalize to percentage */
    const percent =
      totalWeight > 0
        ? Math.round((achievedWeight / totalWeight) * 100)
        : 0;

    /* Attach to report */
    report.scorePercent = percent;

    /* Persist updated report */
    try {
      localStorage.setItem(
        "ANJALI_REAL_DIAGNOSTIC",
        JSON.stringify(report)
      );
    } catch (e) {
      console.error("Diagnostic score save failed", e);
    }
  }

  /* Run once after scripts load */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", calculateScore);
  } else {
    calculateScore();
  }

})();
