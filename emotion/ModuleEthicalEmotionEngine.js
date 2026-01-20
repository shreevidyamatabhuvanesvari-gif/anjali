/* ==========================================================
   ModuleEthicalEmotionEngine — v1.0
   ROLE:
   Central moral-emotion orchestrator.
   Coordinates all ethical checks before response.
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     INTERNAL STATE
     =============================== */

  let lastAssessment = null;

  /* ===============================
     CORE EVALUATION PIPELINE
     =============================== */

  function evaluate(inputText, context = {}) {
    const report = {
      allowed: true,
      flags: [],
      weight: 0,
      details: {}
    };

    try {
      /* ---------- Justice Sensitivity ---------- */
      if (window.JusticeSensitivity) {
        const r = JusticeSensitivity.check(inputText, context);
        merge(report, r);
      }

      /* ---------- Harm Aversion ---------- */
      if (window.HarmAversionCore) {
        const r = HarmAversionCore.check(inputText, context);
        merge(report, r);
      }

      /* ---------- Human Dignity ---------- */
      if (window.HumanDignityGuard) {
        const r = HumanDignityGuard.check(inputText, context);
        merge(report, r);
      }

      /* ---------- Truth Bias ---------- */
      if (window.TruthBiasEngine) {
        const r = TruthBiasEngine.check(inputText, context);
        merge(report, r);
      }

      /* ---------- Exploitation Detection ---------- */
      if (window.ExploitationDetector) {
        const r = ExploitationDetector.check(inputText, context);
        merge(report, r);
      }

      /* ---------- Power Abuse ---------- */
      if (window.PowerAbuseFilter) {
        const r = PowerAbuseFilter.check(inputText, context);
        merge(report, r);
      }

    } catch (e) {
      report.flags.push("ethical-evaluation-error");
      report.allowed = false;
    }

    finalize(report);
    lastAssessment = report;
    return report;
  }

  /* ===============================
     MERGE LOGIC
     =============================== */

  function merge(base, incoming) {
    if (!incoming) return;

    if (incoming.allowed === false) {
      base.allowed = false;
    }

    if (incoming.flags && incoming.flags.length) {
      base.flags.push(...incoming.flags);
    }

    if (typeof incoming.weight === "number") {
      base.weight += incoming.weight;
    }

    if (incoming.details) {
      Object.assign(base.details, incoming.details);
    }
  }

  function finalize(report) {
    report.weight = Math.min(1, Math.max(0, report.weight));
    report.flags = Array.from(new Set(report.flags));
  }

  /* ===============================
     DIAGNOSTICS
     =============================== */

  function getLastAssessment() {
    return lastAssessment ? { ...lastAssessment } : null;
  }

  /* ===============================
     GLOBAL EXPOSURE
     =============================== */

  window.ModuleEthicalEmotionEngine = Object.freeze({
    evaluate,
    getLastAssessment,
    version: "1.0",
    role: "moral-emotion-orchestrator"
  });

})();
