/* =========================================
   Anjali Diagnostic Weights
   Defines importance of each check
   ========================================= */

(function () {
  "use strict";

  /*
    Weight rules:
    - Higher weight = more impact on overall health
    - Sum does NOT need to be 100 (normalized later)
  */

  window.AnjaliDiagnosticWeights = {
    index_loaded: 20,        // App loaded correctly
    core_available: 30,      // Core consciousness (most important)
    ui_start_button: 20,     // User interaction possible
    voice_tts: 15,           // Speaking ability
    voice_stt: 15            // Listening ability
  };

})();
