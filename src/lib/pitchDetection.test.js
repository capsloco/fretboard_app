import { describe, it, expect } from 'vitest';
import { detectPitch, NoteTracker } from './pitchDetection';
import { frequencyToMidi, midiToFrequency } from './fretLogic';

const SAMPLE_RATE = 22050;
const FRAME_SIZE = 2048;

// Deterministic PRNG so tests don't flake
function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

// This Karplus-Strong variant averages each sample with the one after it
// (y[n] = (y[n-N] + y[n-N+1]) / 2), so a delay line of N samples rings with
// a period of N - 0.5 samples.
const delayLength = (midi) => Math.round(SAMPLE_RATE / midiToFrequency(midi) + 0.5);
const synthFrequency = (midi) => SAMPLE_RATE / (delayLength(midi) - 0.5);

/** Karplus-Strong plucked string: a decent stand-in for a real guitar/bass note */
function pluckedString(midi, { seconds = 0.4 } = {}) {
  const random = seededRandom(midi);
  const period = delayLength(midi);
  const delayLine = Array.from({ length: period }, () => random() * 2 - 1);
  const output = new Float32Array(Math.floor(SAMPLE_RATE * seconds));
  for (let i = 0; i < output.length; i++) {
    const current = delayLine[i % period];
    const next = delayLine[(i + 1) % period];
    output[i] = current;
    delayLine[i % period] = 0.996 * 0.5 * (current + next);
  }
  return output;
}

/** Harmonic tone with a chosen partial balance (e.g. weak fundamental) */
function harmonicTone(frequency, amplitudes, length = FRAME_SIZE) {
  const output = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    output[i] = amplitudes.reduce(
      (sum, amp, k) => sum + amp * Math.sin(2 * Math.PI * frequency * (k + 1) * t),
      0
    );
  }
  return output;
}

function frameAt(signal, seconds) {
  const start = Math.floor(seconds * SAMPLE_RATE);
  return signal.subarray(start, start + FRAME_SIZE);
}

describe('detectPitch', () => {
  it('finds every note on a 6-string guitar neck (E2 to E6)', () => {
    for (let midi = 40; midi <= 88; midi++) {
      const expected = synthFrequency(midi);
      const pitch = detectPitch(frameAt(pluckedString(midi), 0.05), SAMPLE_RATE, { minFrequency: 73, maxFrequency: 1480 });
      expect(pitch, `midi ${midi}`).not.toBeNull();
      const centsOff = 1200 * Math.log2(pitch.frequency / expected);
      expect(Math.abs(centsOff), `midi ${midi}`).toBeLessThan(5);
    }
  });

  it('finds every note on a 5-string bass neck (B0 to G4)', () => {
    for (let midi = 23; midi <= 67; midi++) {
      const pitch = detectPitch(frameAt(pluckedString(midi), 0.05), SAMPLE_RATE, { minFrequency: 27, maxFrequency: 415 });
      expect(pitch, `midi ${midi}`).not.toBeNull();
      expect(Math.round(frequencyToMidi(pitch.frequency)), `midi ${midi}`).toBe(midi);
    }
  });

  it('keeps the right octave when the fundamental is weak (phone mic + bass)', () => {
    const lowE = midiToFrequency(28); // E1, 41 Hz
    const signal = harmonicTone(lowE, [0.15, 1, 0.7, 0.5, 0.3]);
    const pitch = detectPitch(signal, SAMPLE_RATE, { minFrequency: 27, maxFrequency: 415 });
    expect(Math.round(frequencyToMidi(pitch.frequency))).toBe(28);
  });

  it('reports nothing for noise', () => {
    const random = seededRandom(42);
    const noise = Float32Array.from({ length: FRAME_SIZE }, () => random() * 2 - 1);
    expect(detectPitch(noise, SAMPLE_RATE)).toBeNull();
  });

  it('reports nothing for silence', () => {
    expect(detectPitch(new Float32Array(FRAME_SIZE), SAMPLE_RATE)).toBeNull();
  });
});

describe('NoteTracker', () => {
  const C3 = midiToFrequency(48);
  const D3 = midiToFrequency(50);

  // Feed frames 30 ms apart; returns the emitted events
  function run(tracker, frames, startTime = 0) {
    return frames
      .map((frame, i) => tracker.update({ ...frame, time: startTime + i * 30 }))
      .filter(Boolean);
  }
  const silence = (n) => Array.from({ length: n }, () => ({ frequency: null, rms: 0.001 }));
  const note = (frequency, n, rms = 0.05) => Array.from({ length: n }, () => ({ frequency, rms }));

  it('reports a plucked note once it holds steady', () => {
    const tracker = new NoteTracker();
    const events = run(tracker, [...silence(3), ...note(C3, 3)]);
    expect(events).toHaveLength(1);
    expect(events[0].midi).toBe(48);
  });

  it('does not repeat a note that keeps ringing', () => {
    const tracker = new NoteTracker();
    const events = run(tracker, [...silence(3), ...note(C3, 40)]);
    expect(events).toHaveLength(1);
  });

  it('reports the same note again when it is re-plucked', () => {
    const tracker = new NoteTracker();
    const events = run(tracker, [
      ...silence(3),
      ...note(C3, 10, 0.05),
      ...note(C3, 10, 0.01), // decaying
      ...note(C3, 5, 0.06) // new attack
    ]);
    expect(events.map(e => e.midi)).toEqual([48, 48]);
  });

  it('needs a long hold before a pitch change without an attack counts', () => {
    const tracker = new NoteTracker();
    const brief = run(tracker, [...silence(3), ...note(C3, 15), ...note(D3, 4)]);
    expect(brief.map(e => e.midi)).toEqual([48]);

    const held = run(new NoteTracker(), [...silence(3), ...note(C3, 15), ...note(D3, 10)]);
    expect(held.map(e => e.midi)).toEqual([48, 50]);
  });

  it('ignores a one-frame glitch', () => {
    const tracker = new NoteTracker();
    const events = run(tracker, [...silence(3), { frequency: D3, rms: 0.05 }, ...silence(3)]);
    expect(events).toHaveLength(0);
  });

  it('forgets the last note after silence', () => {
    const tracker = new NoteTracker();
    const events = run(tracker, [...silence(3), ...note(C3, 5), ...silence(6), ...note(C3, 5)]);
    expect(events.map(e => e.midi)).toEqual([48, 48]);
  });
});
