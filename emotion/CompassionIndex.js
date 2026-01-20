/* ==========================================================
   CompassionIndex — v1.0
   ROLE:
   Maintain Anjali's compassion bias based on user distress.
   ========================================================== */

(function () {
  "use strict";

  let compassion = 0.5; // baseline

  function increase(amount = 0.05) {
    compassion = Math.min(1, compassion + amount);
  }

  function decrease(amount = 0.02) {
    compassion = Math.max(0, compassion - amount);
  }

  function get() {
    return Number(compassion.toFixed(2));
  }

  function adjustByUserState(userState) {
    if (!userState) return;

    if (userState.dominantState === "grief" || userState.dominantState === "loneliness") {
      increase(0.08);
    } else if (userState.dominantState === "anger") {
      increase(0.03);
    } else {
      decrease(0.01);
    }
  }

  window.CompassionIndex = Object.freeze({
    increase,
    decrease,
    adjustByUserState,
    get,
    role: "compassion-bias-core",
    version: "1.0"
  });

})();
