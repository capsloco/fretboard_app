// Real-time pitch detection for plucked strings (guitar & bass).
//
// - detectPitch()  estimates the fundamental of one buffer with YIN
//                  (de Cheveigné & Kawahara, 2002).
// - NoteTracker    turns the jittery per-frame estimates into discrete
//                  "note played" events (stability + attack detection).
// - PitchListener  wires both to the microphone via the Web Audio API.

import { frequencyToMidi } from './fretLogic';

const YIN_THRESHOLD = 0.15;
const ANALYSIS_INTERVAL_MS = 30;
const TARGET_ANALYSIS_RATE = 22050;
const PITCH_HOLD_MS = 600;

export function rootMeanSquare(samples) {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

export function toDecibels(rms) {
  return rms > 0 ? 20 * Math.log10(rms) : -Infinity;
}

/**
 * Estimate the fundamental frequency of `samples` with YIN.
 * @returns {{ frequency: number, clarity: number } | null} null when the buffer isn't periodic
 */
export function detectPitch(samples, sampleRate, {
  minFrequency = 27,
  maxFrequency = 1400,
  threshold = YIN_THRESHOLD
} = {}) {
  const tauMin = Math.max(2, Math.floor(sampleRate / maxFrequency));
  const tauMax = Math.min(Math.ceil(sampleRate / minFrequency), Math.floor(samples.length / 2));
  if (tauMax <= tauMin + 1) return null;

  // Difference function + cumulative mean normalized difference (YIN steps 2 & 3)
  const windowSize = samples.length - tauMax;
  const cmnd = new Float32Array(tauMax + 1);
  cmnd[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    let sum = 0;
    for (let i = 0; i < windowSize; i++) {
      const delta = samples[i] - samples[i + tau];
      sum += delta * delta;
    }
    runningSum += sum;
    cmnd[tau] = runningSum > 0 ? (sum * tau) / runningSum : 1;
  }

  // Absolute threshold (step 4): first dip under the threshold, then walk to its bottom
  let tau = -1;
  for (let t = tauMin; t <= tauMax; t++) {
    if (cmnd[t] < threshold) {
      while (t < tauMax && cmnd[t + 1] < cmnd[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau === -1) return null;

  // Parabolic interpolation (step 5) for sub-sample accuracy
  let refinedTau = tau;
  if (tau > 1 && tau < tauMax) {
    const before = cmnd[tau - 1];
    const at = cmnd[tau];
    const after = cmnd[tau + 1];
    const curvature = before + after - 2 * at;
    if (curvature > 0) refinedTau = tau + (before - after) / (2 * curvature);
  }

  return { frequency: sampleRate / refinedTau, clarity: 1 - cmnd[tau] };
}

/**
 * Turns per-frame pitch readings into note events.
 *
 * A note is reported once it has held the same semitone for a few frames.
 * It is not reported again while it rings on; re-plucking it (a jump in level)
 * or playing a different note reports again. A pitch change without a fresh
 * attack has to hold much longer, so a decaying string drifting onto a
 * harmonic doesn't register as a new note.
 */
export class NoteTracker {
  constructor({
    stableFrames = 3,
    unattackedStableFrames = 9,
    releaseFrames = 5,
    onsetRatio = 1.8,
    onsetMemory = 8,
    attackWindowMs = 350,
    refractoryMs = 200
  } = {}) {
    Object.assign(this, {
      stableFrames,
      unattackedStableFrames,
      releaseFrames,
      onsetRatio,
      onsetMemory,
      attackWindowMs,
      refractoryMs
    });
    this.reset();
  }

  reset() {
    this.levels = [];
    this.lastOnsetTime = -Infinity;
    this.attackPending = false;
    this.lastEmitted = null;
    this.silentFrames = 0;
    this.clearCandidate();
  }

  clearCandidate() {
    this.candidate = null;
    this.count = 0;
    this.centsSum = 0;
    this.frequencySum = 0;
  }

  /**
   * @param {{ frequency: number|null, rms: number, time: number }} frame
   * @returns {{ midi: number, frequency: number, cents: number } | null}
   */
  update({ frequency, rms, time }) {
    const quietest = this.levels.length > 0 ? Math.min(...this.levels) : rms;
    this.levels.push(rms);
    if (this.levels.length > this.onsetMemory) this.levels.shift();

    if (rms > quietest * this.onsetRatio && time - this.lastOnsetTime > this.refractoryMs) {
      this.lastOnsetTime = time;
      this.attackPending = true;
      this.levels = [rms]; // measure the next attack against this note, not the silence before it
      this.clearCandidate();
    }

    if (!frequency) {
      this.silentFrames++;
      if (this.silentFrames >= this.releaseFrames) {
        this.lastEmitted = null;
        this.clearCandidate();
      }
      return null;
    }
    this.silentFrames = 0;

    // Hysteresis: stay on the current candidate unless the pitch moves well away
    const midiFloat = frequencyToMidi(frequency);
    const midi = this.candidate !== null && Math.abs(midiFloat - this.candidate) < 0.65
      ? this.candidate
      : Math.round(midiFloat);

    if (midi !== this.candidate) {
      this.clearCandidate();
      this.candidate = midi;
    }
    this.count++;
    this.centsSum += (midiFloat - midi) * 100;
    this.frequencySum += frequency;

    const recentlyAttacked = time - this.lastOnsetTime <= this.attackWindowMs;
    const needed = recentlyAttacked ? this.stableFrames : this.unattackedStableFrames;
    const isNew = midi !== this.lastEmitted || this.attackPending;

    if (this.count >= needed && isNew) {
      this.lastEmitted = midi;
      this.attackPending = false;
      return {
        midi,
        frequency: this.frequencySum / this.count,
        cents: Math.round(this.centsSum / this.count)
      };
    }
    return null;
  }
}

/** Average adjacent samples: a cheap low-pass + downsample so YIN has less work */
function decimate(input, output, factor) {
  for (let i = 0; i < output.length; i++) {
    let sum = 0;
    for (let j = 0; j < factor; j++) sum += input[i * factor + j];
    output[i] = sum / factor;
  }
}

export function isPitchDetectionSupported() {
  return typeof window !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && Boolean(window.AudioContext || window.webkitAudioContext);
}

/**
 * Listens to the microphone and reports frames (for meters) and note events.
 * Browser voice-call processing (echo cancellation, noise suppression, auto
 * gain) is switched off: it smears pitch and pumps the level of a guitar.
 */
export class PitchListener {
  constructor({ onFrame, onNote }) {
    this.onFrame = onFrame;
    this.onNote = onNote;
    this.tracker = new NoteTracker();
    this.minFrequency = 27;
    this.maxFrequency = 1400;
    this.gateDb = -50;
    this.animationFrame = null;
    this.lastAnalysis = 0;
    this.lastPitch = null;
  }

  configure({ minFrequency, maxFrequency, gateDb }) {
    if (minFrequency) this.minFrequency = minFrequency;
    if (maxFrequency) this.maxFrequency = maxFrequency;
    if (Number.isFinite(gateDb)) this.gateDb = gateDb;
  }

  /**
   * @returns {Promise<'listening' | 'suspended' | 'stopped'>} 'stopped' if stop() was called meanwhile
   * @throws {DOMException} when the mic is blocked or missing
   */
  async start() {
    this.stopped = false;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1
      },
      video: false
    });
    if (this.stopped) {
      stream.getTracks().forEach(track => track.stop());
      return 'stopped';
    }
    this.stream = stream;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContextClass({ latencyHint: 'interactive' });
    const sampleRate = this.audioContext.sampleRate;

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = sampleRate > 50000 ? 8192 : 4096;
    this.analyser.smoothingTimeConstant = 0;
    this.audioContext.createMediaStreamSource(this.stream).connect(this.analyser);

    this.decimation = Math.max(1, Math.floor(sampleRate / TARGET_ANALYSIS_RATE));
    this.analysisRate = sampleRate / this.decimation;
    this.rawBuffer = new Float32Array(this.analyser.fftSize);
    this.analysisBuffer = new Float32Array(Math.floor(this.analyser.fftSize / this.decimation));

    this.tracker.reset();
    this.animationFrame = requestAnimationFrame(this.tick);
    return this.resume();
  }

  /** Browsers may start audio suspended until a user gesture; call again from a click */
  async resume() {
    if (!this.audioContext) return 'suspended';
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch {
        // stays suspended; the caller offers a tap-to-resume button
      }
    }
    return this.audioContext.state === 'running' ? 'listening' : 'suspended';
  }

  tick = (now) => {
    this.animationFrame = requestAnimationFrame(this.tick);
    if (now - this.lastAnalysis < ANALYSIS_INTERVAL_MS) return;
    this.lastAnalysis = now;

    this.analyser.getFloatTimeDomainData(this.rawBuffer);
    const rms = rootMeanSquare(this.rawBuffer);
    const levelDb = toDecibels(rms);

    let pitch = null;
    if (levelDb >= this.gateDb) {
      decimate(this.rawBuffer, this.analysisBuffer, this.decimation);
      pitch = detectPitch(this.analysisBuffer, this.analysisRate, {
        minFrequency: this.minFrequency,
        maxFrequency: this.maxFrequency
      });
    }

    if (pitch) this.lastPitch = { frequency: pitch.frequency, time: now };
    const held = this.lastPitch && now - this.lastPitch.time < PITCH_HOLD_MS ? this.lastPitch.frequency : null;

    const frame = {
      frequency: pitch?.frequency ?? null,
      heldFrequency: held, // last pitch, kept briefly so displays don't flicker
      clarity: pitch?.clarity ?? 0,
      rms,
      levelDb,
      time: now
    };
    const note = this.tracker.update(frame);
    this.onFrame?.(frame);
    if (note) this.onNote?.(note);
  };

  stop() {
    this.stopped = true;
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }
    this.audioContext = null;
  }
}
