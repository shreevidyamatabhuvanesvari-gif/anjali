/* =========================================
   Anjali Diagnostic Specification
   Defines what checks are expected
   ========================================= */

(function () {
  "use strict";

  /*
    Each entry defines:
    - id       : unique key
    - label    : display name
    - expected : whether this check is mandatory
  */

  window.AnjaliDiagnosticSpec = [
    {
      id: "index_loaded",
      label: "Index Loaded",
      expected: true
    },
    {
      id: "core_available",
      label: "Core / AnjaliCore",
      expected: true
    },
    {
      id: "ui_start_button",
      label: "UI / Start Button",
      expected: true
    },
    {
      id: "voice_tts",
      label: "Voice / TTS",
      expected: false
    },
    {
      id: "voice_stt",
      label: "Voice / STT",
      expected: false
    }
  ];

})();
