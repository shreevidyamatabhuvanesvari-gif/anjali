/* =========================================
   Anjali Diagnostic Weights
   Step 2: Weight per Check
   ========================================= */

(function () {
  "use strict";

  /*
    Weight नियम:
    - Mandatory checks का weight ज़्यादा
    - Optional checks का weight कम
    - Total weight = 100
  */

  const WEIGHTS = {
    index_loaded: 30,
    core_available: 30,
    ui_start_button: 20,
    voice_tts: 10,
    voice_stt: 10
  };

  window.AnjaliDiagnosticWeights = {
    weights: WEIGHTS
  };

})();
