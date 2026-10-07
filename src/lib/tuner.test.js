import { describe, it, expect } from 'vitest';
import { TunerTracker } from './tuner';
import { getStringMidis, midiToFrequency, INSTRUMENT_PRESETS } from './fretLogic';

const guitar = getStringMidis(INSTRUMENT_PRESETS.find(i => i.id === 'guitar_standard')); // E2 A2 D3 G3 B3 E4
const bass = getStringMidis(INSTRUMENT_PRESETS.find(i => i.id === 'bass_standard')); // E1 A1 D2 G2
const hz = (midi, cents = 0) => midiToFrequency(midi + cents / 100);

// Feed frames 30 ms apart; returns every reading
function feed(tracker, frames, { startTime = 0 } = {}) {
  return frames.map((frame, i) => tracker.update({ clarity: 1, ...frame, time: startTime + i * 30 }));
}
const note = (midi, cents, n, clarity = 1) => Array.from({ length: n }, () => ({ frequency: hz(midi, cents), clarity }));

describe('TunerTracker', () => {
  it('measures against the nearest string', () => {
    const tracker = new TunerTracker({ stringMidis: guitar });
    const reading = feed(tracker, note(45, 30, 6)).at(-1);
    expect(reading).toMatchObject({ stringIndex: 1, heardMidi: 45, octaveSlip: false, live: true });
    expect(reading.cents).toBeCloseTo(30, 0);
  });

  it('ignores a stray frame but switches once another string holds for a few frames', () => {
    const tracker = new TunerTracker({ stringMidis: guitar, switchFrames: 3 });
    const readings = feed(tracker, [
      ...note(45, 0, 5),
      ...note(50, 0, 1), // one frame of D
      ...note(45, 0, 2),
      ...note(50, 0, 3) // D for real
    ]);
    expect(readings.slice(0, 10).map(r => r.stringIndex)).toEqual(Array(10).fill(1));
    expect(readings[10].stringIndex).toBe(2);
    // The stray frame didn't move the needle either
    expect(readings.slice(0, 8).every(r => Math.abs(r.cents) < 1)).toBe(true);
  });

  it('steadies a jittery needle without lagging a real change', () => {
    const tracker = new TunerTracker({ stringMidis: guitar });
    const jitter = Array.from({ length: 12 }, (_, i) => ({ frequency: hz(45, i % 2 ? 3 : -3) }));
    const steady = feed(tracker, jitter).slice(4);
    expect(steady.every(r => Math.abs(r.cents) < 2.5)).toBe(true);

    // The peg is turned: 40 cents sharp shows within a couple of frames
    const after = feed(tracker, note(45, 40, 3), { startTime: 12 * 30 });
    expect(after[2].cents).toBeGreaterThan(35);
  });

  it('holds the last reading through a short dropout, then clears it', () => {
    const tracker = new TunerTracker({ stringMidis: guitar, holdMs: 1000 });
    feed(tracker, note(45, 10, 6)); // last live frame at 150 ms
    const held = tracker.update({ frequency: null, time: 500 });
    expect(held).toMatchObject({ stringIndex: 1, live: false });
    expect(held.cents).toBeCloseTo(10, 0);

    const gone = tracker.update({ frequency: null, time: 1300 });
    expect(gone).toMatchObject({ stringIndex: 1, cents: null, heardMidi: null, live: false, inTune: false });
  });

  it('treats an unclear frame like silence', () => {
    const tracker = new TunerTracker({ stringMidis: guitar, minClarity: 0.6 });
    const readings = feed(tracker, note(45, 0, 4, 0.4));
    expect(readings.every(r => r.cents === null)).toBe(true);
  });

  it('calls a string in tune only once it has sat in the band for a few frames', () => {
    const tracker = new TunerTracker({ stringMidis: guitar, inTuneCents: 5, inTuneFrames: 4 });
    const readings = feed(tracker, note(45, 2, 6));
    expect(readings.slice(0, 3).map(r => r.inTune)).toEqual([false, false, false]);
    expect(readings[3].inTune).toBe(true);
    expect(readings[5].inTune).toBe(true);

    // Swinging out of the band drops it again
    const out = feed(tracker, note(45, 20, 2), { startTime: 180 });
    expect(out.at(-1).inTune).toBe(false);
  });

  it('reads a string heard an octave high as that string', () => {
    const tracker = new TunerTracker({ stringMidis: guitar });
    // A2 on a phone mic comes through as A3, 20 cents flat
    const reading = feed(tracker, note(57, -20, 4)).at(-1);
    expect(reading).toMatchObject({ stringIndex: 1, octaveSlip: true, heardMidi: 45 });
    expect(reading.cents).toBeCloseTo(-20, 0);
  });

  it('measures against a locked string, even one heard an octave high and well flat', () => {
    const tracker = new TunerTracker({ stringMidis: guitar });
    tracker.lock(1);
    // A string 140 cents flat and heard an octave up: by ear that is nearly a G#
    const locked = feed(tracker, note(55.6, 0, 4)).at(-1);
    expect(locked).toMatchObject({ stringIndex: 1, octaveSlip: true, heardMidi: 44 });
    expect(locked.cents).toBeCloseTo(-140, 0);

    // Unlocked, the same pitch follows the nearest string again
    tracker.lock(null);
    const auto = feed(tracker, note(55.6, 0, 4), { startTime: 200 }).at(-1);
    expect(auto.stringIndex).toBe(3);
  });

  it('starts over when the strings change', () => {
    const tracker = new TunerTracker({ stringMidis: guitar });
    feed(tracker, note(45, 0, 4));
    tracker.setStrings(bass);
    const reading = tracker.update({ frequency: hz(33, 10), time: 500 });
    expect(reading.stringIndex).toBe(1);
    expect(reading.cents).toBeCloseTo(10, 0);
    expect(tracker.update({ frequency: null, time: 2000 }).cents).toBeNull();
  });
});
