import { describe, it, expect } from 'vitest';
import { detectPitch, refinePitch, fftSizeFor, NoteTracker } from './pitchDetection';
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

/** Harmonic tone with a chosen partial balance (e.g. weak fundamental), plus optional white noise */
function harmonicTone(frequency, amplitudes, length = FRAME_SIZE, { rate = SAMPLE_RATE, noise = 0 } = {}) {
  const random = seededRandom(7);
  const output = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const t = i / rate;
    output[i] = amplitudes.reduce(
      (sum, amp, k) => sum + amp * Math.sin(2 * Math.PI * frequency * (k + 1) * t),
      noise * (random() * 2 - 1)
    );
  }
  return output;
}

/** Average sample pairs, as PitchListener does before detecting */
function halveRate(input) {
  const output = new Float32Array(input.length / 2);
  for (let i = 0; i < output.length; i++) output[i] = (input[2 * i] + input[2 * i + 1]) / 2;
  return output;
}

const centsBetween = (frequency, reference) => 1200 * Math.log2(frequency / reference);

/**
 * A plucked string as a small mic hears it: weak fundamental, strong 2nd partial, slightly
 * inharmonic partials that decay faster the higher they are, and some noise.
 */
function phonePluck(frequency, { amplitudes, inharmonicity, noise, decay, seed = 1, length = FRAME_SIZE }) {
  const random = seededRandom(seed);
  const phases = amplitudes.map(() => random() * 2 * Math.PI);
  const output = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    let sample = noise * (random() * 2 - 1);
    amplitudes.forEach((amp, k) => {
      const partial = k + 1;
      const stretched = frequency * partial * Math.sqrt(1 + inharmonicity * partial * partial);
      sample += amp * Math.exp((-decay * t * partial) / 3) * Math.sin(2 * Math.PI * stretched * t + phases[k]);
    });
    output[i] = sample;
  }
  return output;
}

// A G3 that reads an octave high with the "first local minimum" rule, but plainly under the classic threshold
const PHONE_G3 = { amplitudes: [0.16, 0.93, 0.1, 0.23, 0.02, 0.08], inharmonicity: 0.00165, noise: 0.32, decay: 4.31 };

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

  it('reads exactly as classic YIN when a dip gets under its threshold', () => {
    // The octave dip sits just above the threshold, the real one well under it: the real one wins,
    // and with the clarity a clear note needs for practice grading
    for (let seed = 1; seed <= 5; seed++) {
      const signal = phonePluck(midiToFrequency(55), { ...PHONE_G3, seed });
      const pitch = detectPitch(signal, SAMPLE_RATE, { minFrequency: 73, maxFrequency: 1400 });
      expect(Math.round(frequencyToMidi(pitch.frequency)), `seed ${seed}`).toBe(55);
      expect(pitch.clarity, `seed ${seed}`).toBeGreaterThan(0.85);
    }
  });

  it('still reads a noisy string that classic YIN gives up on', () => {
    // Noise as loud as the fundamental: no dip gets under the classic threshold
    const signal = harmonicTone(110, [0.3, 1, 0.6, 0.4], 4096, { noise: 1 });
    const classic = detectPitch(signal, SAMPLE_RATE, { minFrequency: 73, maxFrequency: 1400, octaveMargin: 0, maxDifference: 0.15 });
    expect(classic).toBeNull();

    const pitch = detectPitch(signal, SAMPLE_RATE, { minFrequency: 73, maxFrequency: 1400 });
    expect(Math.round(frequencyToMidi(pitch.frequency))).toBe(45);
    expect(pitch.clarity).toBeGreaterThan(0.6);
    expect(pitch.clarity).toBeLessThan(0.85);
  });

  it('gives up when the buffer is barely periodic', () => {
    const signal = harmonicTone(110, [0.3, 1, 0.6, 0.4], 4096, { noise: 3 });
    expect(detectPitch(signal, SAMPLE_RATE, { minFrequency: 73, maxFrequency: 1400 })).toBeNull();
  });

  it('reads the newest audio in the buffer', () => {
    const buffer = new Float32Array(4096);
    buffer.set(harmonicTone(110, [1, 0.5], 2048), 0);
    buffer.set(harmonicTone(146.83, [1, 0.5], 2048), 2048);
    const pitch = detectPitch(buffer, SAMPLE_RATE, { minFrequency: 73, maxFrequency: 1400 });
    expect(Math.round(frequencyToMidi(pitch.frequency))).toBe(50);
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

describe('refinePitch', () => {
  const RATE = 48000;

  it('recovers the precision lost to downsampling', () => {
    // E6 at 48 kHz, 3 cents sharp: on half-rate audio the lag is only a few dozen samples
    const target = midiToFrequency(88) * 2 ** (3 / 1200);
    const raw = harmonicTone(target, [1, 0.5, 0.3, 0.2], 8192, { rate: RATE, noise: 0.05 });
    const coarse = detectPitch(halveRate(raw), RATE / 2, { minFrequency: 73, maxFrequency: 1400 });
    const refined = refinePitch(raw, RATE, coarse.frequency, { spread: 3 });
    expect(Math.abs(centsBetween(coarse.frequency, target))).toBeGreaterThan(1);
    expect(Math.abs(centsBetween(refined, target))).toBeLessThan(0.5);
  });

  it('is within a cent across the guitar and bass ranges', () => {
    for (let midi = 23; midi <= 88; midi++) {
      const target = midiToFrequency(midi) * 2 ** (-7 / 1200);
      const raw = harmonicTone(target, [1, 0.5, 0.3, 0.2], 8192, { rate: RATE, noise: 0.05 });
      const range = midi < 40 ? { minFrequency: 27, maxFrequency: 440 } : { minFrequency: 73, maxFrequency: 1400 };
      const coarse = detectPitch(halveRate(raw), RATE / 2, range);
      expect(coarse, `midi ${midi}`).not.toBeNull();
      const refined = refinePitch(raw, RATE, coarse.frequency, { spread: 3 });
      expect(Math.abs(centsBetween(refined, target)), `midi ${midi}`).toBeLessThan(1);
    }
  });

  it('leaves an estimate alone when no minimum sits nearby', () => {
    const raw = harmonicTone(110, [1], 8192, { rate: RATE });
    expect(refinePitch(raw, RATE, 200, { spread: 3 })).toBe(200);
  });
});

describe('fftSizeFor', () => {
  it('picks the power of two holding the window', () => {
    expect(fftSizeFor(48000, 85)).toBe(4096);
    expect(fftSizeFor(44100, 85)).toBe(4096);
    expect(fftSizeFor(96000, 85)).toBe(8192);
    expect(fftSizeFor(48000, 160)).toBe(8192);
    expect(fftSizeFor(48000, 5000)).toBe(32768);
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

  it('counts a plucked string as a small mic hears it', () => {
    const tracker = new NoteTracker();
    const frames = Array.from({ length: 6 }, (_, i) => {
      const pitch = detectPitch(phonePluck(midiToFrequency(55), { ...PHONE_G3, seed: i + 1 }), SAMPLE_RATE, { minFrequency: 73, maxFrequency: 1400 });
      return { frequency: pitch.frequency, clarity: pitch.clarity, rms: 0.05 };
    });
    expect(run(tracker, [...silence(3), ...frames]).map(e => e.midi)).toEqual([55]);
  });

  it('treats an unclear pitch as silence', () => {
    const unclear = Array.from({ length: 6 }, () => ({ frequency: C3, rms: 0.05, clarity: 0.7 }));
    expect(run(new NoteTracker(), [...silence(3), ...unclear])).toHaveLength(0);

    const clear = Array.from({ length: 6 }, () => ({ frequency: C3, rms: 0.05, clarity: 0.9 }));
    expect(run(new NoteTracker(), [...silence(3), ...clear])).toHaveLength(1);
  });
});
