// Real-time pitch detection for plucked strings (guitar & bass).
//
// - detectPitch()  estimates the fundamental of one buffer with YIN
//                  (de Cheveigné & Kawahara, 2002), loosened so a noisy phone
//                  mic still gets a reading.
// - refinePitch()  sharpens that estimate on the full-rate signal.
// - NoteTracker    turns the jittery per-frame estimates into discrete
//                  "note played" events (stability + attack detection).
// - PitchListener  wires it all to the microphone via the Web Audio API.

import { frequencyToMidi } from './fretLogic';

// A dip in YIN's normalised difference this deep is the pitch outright (the classic threshold).
const YIN_THRESHOLD = 0.15;
// When nothing dips that deep (a phone mic, most of the time a string rings), any dip within
// this of the deepest one will do, taking the shortest lag among them: the true period still
// makes the deepest dip, and its sub-harmonics (2x, 3x the period) dip as deep but lose on lag.
const OCTAVE_MARGIN = 0.1;
// Deepest dip above this: the buffer isn't periodic enough to call a pitch
const MAX_DIFFERENCE = 0.5;
// Samples compared per lag. Caps the cost of the difference function (newest audio is used).
const MAX_WINDOW = 2048;
// When refining, fit the minimum over lags this fraction of the period apart: for a long period,
// neighbouring lags differ by less than the noise does, so a wider fit is steadier.
const REFINE_LAG_FRACTION = 1 / 256;
const ANALYSIS_INTERVAL_MS = 30;
const TARGET_ANALYSIS_RATE = 22050;
const PITCH_HOLD_MS = 600;
// Audio per analysis. Practice wants a quick answer; the tuner asks for more (steadier cents).
const DEFAULT_WINDOW_MS = 85;

export function rootMeanSquare(samples) {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

export function toDecibels(rms) {
  return rms > 0 ? 20 * Math.log10(rms) : -Infinity;
}

/**
 * YIN steps 2 & 3: the difference function for lags 0..tauMax, normalised by its running mean.
 * Compares the newest `maxWindow` samples (fewer if the buffer is short) with the samples
 * `tau` earlier, so the result reflects what was played last, not the start of the buffer.
 * Values near 0 mean "repeats at this lag"; around 1 means "no better than chance".
 */
export function cumulativeMeanDifference(samples, tauMax, maxWindow = MAX_WINDOW) {
  const windowSize = Math.min(samples.length - tauMax, maxWindow);
  const start = samples.length - windowSize - tauMax;
  const end = start + windowSize;
  const cmnd = new Float32Array(tauMax + 1);
  cmnd[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    let sum = 0;
    for (let i = start; i < end; i++) {
      const delta = samples[i] - samples[i + tau];
      sum += delta * delta;
    }
    runningSum += sum;
    cmnd[tau] = runningSum > 0 ? (sum * tau) / runningSum : 1;
  }
  return cmnd;
}

/** Parabolic interpolation (YIN step 5): where the minimum sits between samples */
function interpolateMinimum(values, index) {
  const before = values[index - 1];
  const at = values[index];
  const after = values[index + 1];
  const curvature = before + after - 2 * at;
  if (!(curvature > 0)) return index;
  return index + (before - after) / (2 * curvature);
}

/**
 * The lag to call the pitch for a limit: the bottom of the first run of lags whose difference
 * is under it. Taking the whole run rather than the first local minimum keeps a ripple on the
 * way down from stealing the pick from the real dip just after it.
 * @returns {number} the lag, or -1 when nothing dips under the limit
 */
function firstDipUnder(cmnd, tauMin, tauMax, limit) {
  for (let t = tauMin; t <= tauMax; t++) {
    if (cmnd[t] >= limit) continue;
    let bottom = t;
    while (t < tauMax && cmnd[t + 1] < limit) {
      t++;
      if (cmnd[t] < cmnd[bottom]) bottom = t;
    }
    return bottom;
  }
  return -1;
}

/**
 * Estimate the fundamental frequency of `samples` with YIN.
 *
 * Classic YIN takes the first dip under a fixed threshold and gives up when there is none,
 * which on a phone mic means no reading for most of the time a string rings. This takes that
 * dip when there is one (so a clear note reads exactly as plain YIN would), and otherwise the
 * shortest lag whose dip is nearly as deep as the deepest, giving up only when the deepest dip
 * is shallow (not periodic). `clarity` (1 = perfectly periodic) lets callers be as strict as
 * they need: a clear note scores above 1 - threshold, a lenient pick below it.
 *
 * @returns {{ frequency: number, clarity: number } | null} null when the buffer isn't periodic
 */
export function detectPitch(samples, sampleRate, {
  minFrequency = 27,
  maxFrequency = 1400,
  threshold = YIN_THRESHOLD,
  octaveMargin = OCTAVE_MARGIN,
  maxDifference = MAX_DIFFERENCE,
  maxWindow = MAX_WINDOW
} = {}) {
  const tauMin = Math.max(2, Math.floor(sampleRate / maxFrequency));
  const tauMax = Math.min(Math.ceil(sampleRate / minFrequency), Math.floor(samples.length / 2));
  if (tauMax <= tauMin + 1) return null;

  const cmnd = cumulativeMeanDifference(samples, tauMax, maxWindow);

  let deepest = Infinity;
  for (let t = tauMin; t <= tauMax; t++) {
    if (cmnd[t] < deepest) deepest = cmnd[t];
  }
  if (deepest > maxDifference) return null;

  // Step 4: the first dip under the classic threshold, else the first nearly as deep as the deepest
  let tau = firstDipUnder(cmnd, tauMin, tauMax, threshold);
  if (tau === -1) tau = firstDipUnder(cmnd, tauMin, tauMax, deepest + octaveMargin);
  if (tau === -1) return null;

  return { frequency: sampleRate / interpolateMinimum(cmnd, tau), clarity: 1 - cmnd[tau] };
}

/**
 * Sharpen a pitch estimate on the full-rate signal.
 *
 * Detecting on downsampled audio is cheap but quantises the lag coarsely; evaluating the
 * difference function at full rate for a few lags around the estimate and interpolating the
 * minimum recovers the precision, worth a couple of cents on a guitar's high strings.
 *
 * @param spread lags either side of the estimate to search (the decimation factor is plenty)
 * @returns {number} the refined frequency, or `frequency` unchanged if the minimum isn't nearby
 */
export function refinePitch(samples, sampleRate, frequency, { spread = 2, maxWindow = 4 * MAX_WINDOW } = {}) {
  const center = Math.round(sampleRate / frequency);
  const step = Math.max(1, Math.round(center * REFINE_LAG_FRACTION));
  const low = center - spread * step;
  const high = center + spread * step;
  if (low < 2 || samples.length - high < high) return frequency;

  const windowSize = Math.min(samples.length - high, maxWindow);
  const start = samples.length - windowSize - high;
  const end = start + windowSize;
  const diffs = new Float64Array(2 * spread + 1);
  let best = 0;
  for (let k = 0; k < diffs.length; k++) {
    const tau = low + k * step;
    let sum = 0;
    for (let i = start; i < end; i++) {
      const delta = samples[i] - samples[i + tau];
      sum += delta * delta;
    }
    diffs[k] = sum;
    if (sum < diffs[best]) best = k;
  }
  // The minimum has to sit inside the searched lags to be interpolated
  if (best === 0 || best === diffs.length - 1) return frequency;
  return sampleRate / (low + interpolateMinimum(diffs, best) * step);
}

/**
 * Turns per-frame pitch readings into note events.
 *
 * A note is reported once it has held the same semitone for a few frames.
 * It is not reported again while it rings on; re-plucking it (a jump in level)
 * or playing a different note reports again. A pitch change without a fresh
 * attack has to hold much longer, so a decaying string drifting onto a
 * harmonic doesn't register as a new note.
 *
 * Frames below `minClarity` count as silence: grading wants a note that rings
 * clearly, not the detector's best guess at a noisy buffer.
 */
export class NoteTracker {
  constructor({
    stableFrames = 3,
    unattackedStableFrames = 9,
    releaseFrames = 5,
    onsetRatio = 1.8,
    onsetMemory = 8,
    attackWindowMs = 350,
    refractoryMs = 200,
    minClarity = 0.85
  } = {}) {
    Object.assign(this, {
      stableFrames,
      unattackedStableFrames,
      releaseFrames,
      onsetRatio,
      onsetMemory,
      attackWindowMs,
      refractoryMs,
      minClarity
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
   * @param {{ frequency: number|null, clarity?: number, rms: number, time: number }} frame
   * @returns {{ midi: number, frequency: number, cents: number } | null}
   */
  update({ frequency, clarity = 1, rms, time }) {
    const quietest = this.levels.length > 0 ? Math.min(...this.levels) : rms;
    this.levels.push(rms);
    if (this.levels.length > this.onsetMemory) this.levels.shift();

    if (rms > quietest * this.onsetRatio && time - this.lastOnsetTime > this.refractoryMs) {
      this.lastOnsetTime = time;
      this.attackPending = true;
      this.levels = [rms]; // measure the next attack against this note, not the silence before it
      this.clearCandidate();
    }

    if (!frequency || clarity < this.minClarity) {
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

/** Smallest power of two holding `windowMs` of audio (AnalyserNode sizes are powers of two) */
export function fftSizeFor(sampleRate, windowMs) {
  const wanted = (sampleRate * windowMs) / 1000;
  let size = 1024;
  while (size < wanted && size < 32768) size *= 2;
  return size;
}

export function isPitchDetectionSupported() {
  return typeof window !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && Boolean(window.AudioContext || window.webkitAudioContext);
}

/**
 * Listens to the microphone and reports frames (for meters) and note events.
 * A frame's `clear` flag says whether its pitch was clear enough for the note
 * tracker to count, so a meter can show a faint reading that won't be graded.
 * Browser voice-call processing (echo cancellation, noise suppression, auto
 * gain) is switched off: it smears pitch and pumps the level of a guitar.
 *
 * Analysis runs on a timer rather than the animation frame, so its cadence
 * doesn't depend on how fast the page can paint.
 *
 * @param windowMs how much audio each analysis looks at
 */
export class PitchListener {
  constructor({ onFrame, onNote, windowMs = DEFAULT_WINDOW_MS }) {
    this.onFrame = onFrame;
    this.onNote = onNote;
    this.windowMs = windowMs;
    this.tracker = new NoteTracker();
    this.minFrequency = 27;
    this.maxFrequency = 1400;
    this.gateDb = -50;
    this.timer = null;
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
    this.sampleRate = this.audioContext.sampleRate;

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = fftSizeFor(this.sampleRate, this.windowMs);
    this.analyser.smoothingTimeConstant = 0;
    this.audioContext.createMediaStreamSource(this.stream).connect(this.analyser);

    this.decimation = Math.max(1, Math.floor(this.sampleRate / TARGET_ANALYSIS_RATE));
    this.analysisRate = this.sampleRate / this.decimation;
    this.rawBuffer = new Float32Array(this.analyser.fftSize);
    this.analysisBuffer = new Float32Array(Math.floor(this.analyser.fftSize / this.decimation));

    this.tracker.reset();
    this.lastPitch = null;
    this.timer = setTimeout(this.tick, ANALYSIS_INTERVAL_MS);
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

  tick = () => {
    this.timer = null;
    if (this.stopped || !this.analyser) return;
    const now = performance.now();

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
      if (pitch && this.decimation > 1) {
        pitch.frequency = refinePitch(this.rawBuffer, this.sampleRate, pitch.frequency, { spread: this.decimation + 1 });
      }
    }

    if (pitch) this.lastPitch = { frequency: pitch.frequency, time: now };
    const held = this.lastPitch && now - this.lastPitch.time < PITCH_HOLD_MS ? this.lastPitch.frequency : null;

    const frame = {
      frequency: pitch?.frequency ?? null,
      heldFrequency: held, // last pitch, kept briefly so displays don't flicker
      clarity: pitch?.clarity ?? 0,
      clear: Boolean(pitch) && pitch.clarity >= this.tracker.minClarity, // clear enough to count as a note
      rms,
      levelDb,
      time: now
    };
    const note = this.tracker.update(frame);
    this.onFrame?.(frame);
    if (note) this.onNote?.(note);

    this.timer = setTimeout(this.tick, ANALYSIS_INTERVAL_MS);
  };

  stop() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }
    this.audioContext = null;
    this.analyser = null;
  }
}
