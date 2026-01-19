/* ==============================
   STT Long Listening Controller
   ============================== */

window.STT_LongListening = {
  active: false,
  silenceTimer: null,

  start() {
    if (!window.STT) {
      console.warn("STT not available");
      return;
    }

    this.active = true;
    this._startCycle();
  },

  stop() {
    this.active = false;
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    if (window.STT) STT.stop();
  },

  _startCycle() {
    if (!this.active) return;

    STT.start();

    // अगर 8 सेकंड तक कुछ न बोले तो फिर से सुनना
    this.silenceTimer = setTimeout(() => {
      if (this.active) {
        STT.stop();
        setTimeout(() => {
          this._startCycle();
        }, 300);
      }
    }, 8000);
  }
};
