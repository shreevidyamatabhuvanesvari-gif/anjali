/* =========================================
   Anjali Diagnostic Scoring Engine
   Step 3: Percentage Calculation
   ========================================= */

(function () {
  "use strict";

  function calculateScore(report) {
    if (
      !report ||
      !report.results ||
      !window.AnjaliDiagnosticSpec ||
      !window.AnjaliDiagnosticWeights
    ) {
      return null;
    }

    const expected = window.AnjaliDiagnosticSpec.expectedChecks;
    const weights = window.AnjaliDiagnosticWeights.weights;

    let score = 0;

    expected.forEach(spec => {
      const found = report.results.find(r =>
        r.module.toLowerCase().includes(spec.label.toLowerCase())
      );

      const weight = weights[spec.id] || 0;

      if (!found) return;

      if (found.status === "OK") {
        score += weight;
      } else if (found.status === "PARTIAL") {
        score += weight * 0.5;
      }
      // MISSING → 0
    });

    return Math.round(score);
  }

  /* attach score to existing report safely */
  try {
    const report = window.AnjaliRealDiagnosticReport;
    const percent = calculateScore(report);

    if (percent !== null) {
      report.scorePercent = percent;
    }
  } catch (e) {
    /* silent by design */
  }

})();
