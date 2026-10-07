// The tuner's reading of the mic: which string is being tuned, how far off it is, and a
// needle that moves without jitter. Pure logic so it can be unit tested; the frames come
// from PitchListener.

import { frequencyToMidi, readTuner } from './fretLogic';

/**
 * @typedef {Object} TunerReading
 * @property {number|null} stringIndex  string the needle measures against (0 = lowest); null before anything was heard
 * @property {number|null} cents        how far off that string, smoothed; null when nothing is being heard
 * @property {number|null} heardMidi    nearest note to what is heard, in the string's octave (the meter's window)
 * @property {boolean} octaveSlip       the mic heard the string an octave high (cents are still right)
 * @property {boolean} live             this frame carried a usable pitch (false while the last reading is held)
 * @property {boolean} inTune           sat inside the in-tune band for a few frames running
 * @property {number} clarity           how periodic the frame was, 0-1
 */

function medianOf(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length >> 1;
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/**
 * Turns pitch frames into tuner readings.
 *
 * - String: the nearest string to what is heard, kept until another string wins `switchFrames`
 *   frames running, so a stray frame doesn't flip the target. A locked string is always the target.
 * - Cents: a `medianFrames` median drops single-frame glitches, then an exponential average
 *   (quicker when the pitch is clear) steadies the needle; a jump past `snapCents` is followed at once.
 * - Hold: when the pitch drops out (between plucks, or a frame too noisy to read), the last reading
 *   is kept for `holdMs`, flagged not live, then cleared.
 * - In tune: reported once the needle has sat inside the band for `inTuneFrames` frames running,
 *   so the verdict doesn't flash as the needle swings through zero.
 */
export class TunerTracker {
  constructor({
    stringMidis = [],
    minClarity = 0.6,
    inTuneCents = 5,
    inTuneFrames = 4,
    switchFrames = 3,
    holdMs = 1000,
    medianFrames = 3,
    snapCents = 15
  } = {}) {
    Object.assign(this, { minClarity, inTuneCents, inTuneFrames, switchFrames, holdMs, medianFrames, snapCents });
    this.lockedIndex = null;
    this.setStrings(stringMidis);
  }

  /** Open-string MIDI pitches, low to high (see getStringMidis); starts over */
  setStrings(stringMidis) {
    this.stringMidis = stringMidis;
    if (this.lockedIndex !== null && this.lockedIndex >= stringMidis.length) this.lockedIndex = null;
    this.stringIndex = null;
    this.pendingIndex = null;
    this.pendingCount = 0;
    this.last = null;
    this.lastLiveTime = -Infinity;
    this.resetNeedle();
  }

  /** Measure against this string only; null follows whatever is played */
  lock(index) {
    const locked = Number.isInteger(index) && index >= 0 && index < this.stringMidis.length ? index : null;
    if (locked === this.lockedIndex) return;
    this.lockedIndex = locked;
    this.pendingIndex = null;
    this.pendingCount = 0;
    if (locked !== null) this.stringIndex = locked;
    this.resetNeedle();
  }

  resetNeedle() {
    this.recentCents = [];
    this.smoothedCents = null;
    this.inTuneRun = 0;
  }

  idleReading() {
    return {
      stringIndex: this.lockedIndex ?? this.stringIndex,
      cents: null,
      heardMidi: null,
      octaveSlip: false,
      live: false,
      inTune: false,
      clarity: 0
    };
  }

  /** The string to measure against for a heard pitch, with hysteresis in auto mode */
  chooseString(midiFloat) {
    if (this.lockedIndex !== null) return this.lockedIndex;
    const nearest = readTuner(midiFloat, this.stringMidis).stringIndex;
    if (this.stringIndex === null || nearest === this.stringIndex) {
      this.pendingIndex = null;
      this.pendingCount = 0;
      return nearest;
    }
    this.pendingCount = this.pendingIndex === nearest ? this.pendingCount + 1 : 1;
    this.pendingIndex = nearest;
    if (this.pendingCount < this.switchFrames) return this.stringIndex;
    this.pendingIndex = null;
    this.pendingCount = 0;
    return nearest;
  }

  /**
   * @param {{ frequency: number|null, clarity?: number, time: number }} frame
   * @returns {TunerReading}
   */
  update({ frequency, clarity = 1, time }) {
    if (!frequency || clarity < this.minClarity || this.stringMidis.length === 0) {
      if (this.last && time - this.lastLiveTime <= this.holdMs) {
        return { ...this.last, live: false, clarity: 0 };
      }
      this.last = null;
      this.resetNeedle();
      return this.idleReading();
    }

    const midiFloat = frequencyToMidi(frequency);
    const stringIndex = this.chooseString(midiFloat);
    if (stringIndex !== this.stringIndex) {
      this.stringIndex = stringIndex;
      this.resetNeedle();
    }
    const { cents: rawCents, octaveSlip } = readTuner(midiFloat, this.stringMidis, stringIndex);

    this.recentCents.push(rawCents);
    if (this.recentCents.length > this.medianFrames) this.recentCents.shift();
    const median = medianOf(this.recentCents);
    if (this.smoothedCents === null || Math.abs(median - this.smoothedCents) > this.snapCents) {
      this.smoothedCents = median;
    } else {
      const weight = 0.3 + 0.4 * Math.min(1, clarity);
      this.smoothedCents += weight * (median - this.smoothedCents);
    }
    const cents = this.smoothedCents;
    this.inTuneRun = Math.abs(cents) <= this.inTuneCents ? this.inTuneRun + 1 : 0;

    const reading = {
      stringIndex,
      cents,
      heardMidi: this.stringMidis[stringIndex] + Math.round(cents / 100),
      octaveSlip,
      live: true,
      inTune: this.inTuneRun >= this.inTuneFrames,
      clarity
    };
    this.last = reading;
    this.lastLiveTime = time;
    return reading;
  }
}
