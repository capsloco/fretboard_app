// Web Audio API Sound Peak / Guitar Pluck / Clap Trigger (100% Cross-Browser for Firefox, Safari, Chrome)

export class SoundTrigger {
  constructor({ onPeak, threshold = 35 }) {
    this.onPeak = onPeak;
    this.threshold = threshold;
    this.audioCtx = null;
    this.analyser = null;
    this.micStream = null;
    this.isListening = false;
    this.lastTriggerTime = 0;
    this.animFrame = null;
  }

  async start() {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioCtx.createMediaStreamSource(this.micStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);
      
      this.isListening = true;
      this.listenLoop();
      return true;
    } catch (e) {
      console.warn("Sound trigger mic permission denied or failed:", e);
      return false;
    }
  }

  setThreshold(val) {
    this.threshold = val;
  }

  listenLoop = () => {
    if (!this.isListening || !this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avgVolume = Math.round(sum / dataArray.length);

    const now = Date.now();
    // 750ms cooldown between triggers to prevent double hits
    if (avgVolume > this.threshold && now - this.lastTriggerTime > 750) {
      this.lastTriggerTime = now;
      if (this.onPeak) this.onPeak(avgVolume);
    }

    this.animFrame = requestAnimationFrame(this.listenLoop);
  };

  stop() {
    this.isListening = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch (e) {}
    }
  }
}
