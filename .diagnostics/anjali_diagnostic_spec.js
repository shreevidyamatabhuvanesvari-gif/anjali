/* =========================================
   Anjali Diagnostic Specification
   Step 1: Total Expected Checks
   ========================================= */

(function () {
  "use strict";

  /*
    यह सूची "कितने checks होने चाहिए"
    इसका canonical source है
  */

  const EXPECTED_CHECKS = [
    {
      id: "index_loaded",
      label: "Index Loaded",
      mandatory: true
    },
    {
      id: "core_available",
      label: "Core / AnjaliCore",
      mandatory: true
    },
    {
      id: "ui_start_button",
      label: "UI / Start Button",
      mandatory: true
    },
    {
      id: "voice_tts",
      label: "Voice / TTS",
      mandatory: false
    },
    {
      id: "voice_stt",
      label: "Voice / STT",
      mandatory: false
    }
  ];

  /* expose safely */
  window.AnjaliDiagnosticSpec = {
    expectedChecks: EXPECTED_CHECKS
  };

})();
