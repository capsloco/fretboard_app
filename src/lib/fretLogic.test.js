import { describe, it, expect } from 'vitest';
import {
  INSTRUMENT_PRESETS,
  TUNING_PRESETS,
  generatePrompt,
  getNoteIndex,
  getStringMidis,
  gradeDetectedNote,
  midiToNoteLabel,
  readTuner,
  getStringName
} from './fretLogic';

// 'E♭2' -> 39, 'F♯3' -> 54
function parseScientificPitch(label) {
  const match = label.trim().match(/^(.+?)(-?\d)$/);
  return (Number(match[2]) + 1) * 12 + getNoteIndex(match[1]);
}

const guitar = INSTRUMENT_PRESETS.find(i => i.id === 'guitar_standard');

describe('getStringMidis', () => {
  it.each(TUNING_PRESETS)('infers the documented octaves for $name', (preset) => {
    const instrument = { tuning: preset.tuning, type: preset.type };
    const documented = preset.octaves.split(' - ').map(parseScientificPitch);
    expect(getStringMidis(instrument)).toEqual(documented);
  });

  it('handles custom instruments without a type', () => {
    expect(getStringMidis({ tuning: ['E', 'A', 'D', 'G'] })).toEqual([28, 33, 38, 43]);
    expect(getStringMidis({ tuning: ['C', 'G', 'C', 'G', 'C', 'E'] })).toEqual([36, 43, 48, 55, 60, 64]);
    expect(getStringMidis({ tuning: ['F#', 'B', 'E', 'A', 'D', 'G', 'B', 'E'] })).toEqual([30, 35, 40, 45, 50, 55, 59, 64]);
  });
});

describe('midiToNoteLabel', () => {
  it('uses scientific pitch octaves', () => {
    expect(midiToNoteLabel(60)).toEqual({ name: 'C', octave: 4 });
    expect(midiToNoteLabel(40)).toEqual({ name: 'E', octave: 2 });
    expect(midiToNoteLabel(58, 'flats')).toEqual({ name: 'B♭', octave: 3 });
  });
});

describe('gradeDetectedNote', () => {
  const globalC = { promptType: 'global', note: 'C' };
  // C on the A string, frets 0-12: only fret 3 (C3, MIDI 48)
  const cOnA = { promptType: 'string_specific', note: 'C', stringIndex: 1, targetFrets: [3] };

  it('accepts any octave for global prompts', () => {
    expect(gradeDetectedNote(globalC, 48, guitar).correct).toBe(true);
    expect(gradeDetectedNote(globalC, 72, guitar).correct).toBe(true);
    expect(gradeDetectedNote(globalC, 50, guitar).correct).toBe(false);
  });

  it('needs the exact pitch for string-specific prompts', () => {
    expect(gradeDetectedNote(cOnA, 48, guitar)).toMatchObject({ correct: true, expectedMidis: [48] });
    const wrongOctave = gradeDetectedNote(cOnA, 60, guitar);
    expect(wrongOctave).toMatchObject({ correct: false, pitchClassMatch: true });
    expect(gradeDetectedNote(cOnA, 50, guitar)).toMatchObject({ correct: false, pitchClassMatch: false });
  });

  it('matches enharmonic spellings', () => {
    expect(gradeDetectedNote({ promptType: 'global', note: 'D♭' }, 49, guitar).correct).toBe(true);
    expect(gradeDetectedNote({ promptType: 'global', note: 'C#/D♭' }, 61, guitar).correct).toBe(true);
  });
});

describe('generatePrompt', () => {
  it('always produces an answerable prompt, even in a tiny fret range', () => {
    for (const promptType of ['global', 'string_specific']) {
      for (let i = 0; i < 200; i++) {
        const prompt = generatePrompt({
          promptType,
          includeAccidentals: i % 2 === 0,
          minFret: 5,
          maxFret: 6,
          instrument: guitar
        });
        expect(prompt.validPositions.length).toBeGreaterThan(0);
      }
    }
  });

  it('never repeats the previous note', () => {
    for (let i = 0; i < 100; i++) {
      const prompt = generatePrompt({ instrument: guitar, previousNote: 'C' });
      expect(prompt.note).not.toBe('C');
    }
  });
});

describe('readTuner', () => {
  const strings = getStringMidis(guitar); // E2 A2 D3 G3 B3 E4
  const read = (midi, locked) => readTuner(midi, strings, locked);

  it('picks the string being tuned, even when it is well out of tune', () => {
    expect(read(45.3)).toEqual({ stringIndex: 1, cents: 30, octaveSlip: false }); // A2, a bit sharp
    expect(read(43.4)).toMatchObject({ stringIndex: 1, cents: -160 }); // A2 well flat, still nearer A than E
    expect(read(63.2)).toMatchObject({ stringIndex: 5, cents: -80 }); // high E, flat
    expect(read(59)).toMatchObject({ stringIndex: 4, cents: 0 });
  });

  it('reads a string heard an octave high as that string, with the right cents', () => {
    // A2 on a phone mic comes through as A3, which sits between the G and B strings
    expect(read(57.01)).toEqual({ stringIndex: 1, cents: 1, octaveSlip: true });
    expect(read(56.7)).toEqual({ stringIndex: 1, cents: -30, octaveSlip: true });
    expect(read(52.2)).toEqual({ stringIndex: 0, cents: 20, octaveSlip: true }); // low E heard as E3
  });

  it('prefers a plain match over an octave slip', () => {
    const dropD = getStringMidis({ ...guitar, tuning: ['D', 'A', 'D', 'G', 'B', 'E'] }); // D2 ... D3
    expect(readTuner(50.1, dropD)).toEqual({ stringIndex: 2, cents: 10, octaveSlip: false });
  });

  it('does not fold a badly sharp string onto another string', () => {
    // A string tuned up to B2: not B3 an octave down, just too high
    expect(read(47)).toEqual({ stringIndex: 1, cents: 200, octaveSlip: false });
  });

  it('measures against a locked string', () => {
    expect(read(57.01, 1)).toEqual({ stringIndex: 1, cents: 1, octaveSlip: true });
    expect(read(47, 1)).toEqual({ stringIndex: 1, cents: 200, octaveSlip: false });
    expect(read(40.5, 1)).toMatchObject({ stringIndex: 1, cents: -450 });
  });
});

describe('string prompts', () => {
  it('names strings that share a note by low / middle / high', () => {
    const standard = ['E', 'A', 'D', 'G', 'B', 'E'];
    expect(standard.map((_, i) => getStringName(standard, i))).toEqual(['low E', 'A', 'D', 'G', 'B', 'high E']);
    const dadgad = ['D', 'A', 'D', 'G', 'A', 'D'];
    expect(dadgad.map((_, i) => getStringName(dadgad, i))).toEqual(['low D', 'low A', 'middle D', 'G', 'high A', 'high D']);
    expect(getStringName(['E', 'A', 'D', 'G'], 0)).toBe('E');
  });

  it('says which E string the prompt means', () => {
    for (let i = 0; i < 30; i++) {
      const prompt = generatePrompt({ instrument: guitar, promptType: 'string_specific', stringIndex: 5 });
      expect(prompt.promptText).toBe('on the high E string');
    }
  });

  it('keeps to a chosen string, with every note on it inside the fret range', () => {
    for (let i = 0; i < 50; i++) {
      const prompt = generatePrompt({ instrument: guitar, promptType: 'string_specific', stringIndex: 1, minFret: 0, maxFret: 5, includeAccidentals: true });
      expect(prompt.stringIndex).toBe(1);
      expect(prompt.targetFrets.length).toBeGreaterThan(0);
    }
  });

  it('falls back to any string when the chosen one has none of the notes in range', () => {
    // Frets 0-1 on the A string only reach A and A#; a C drill has to use another string
    const prompt = generatePrompt({ instrument: guitar, promptType: 'string_specific', stringIndex: 1, minFret: 0, maxFret: 1, focusNotes: [0] });
    expect(prompt.note).toBe('C');
    expect(prompt.stringIndex).toBe(4); // B string, fret 1
  });

  it('ignores a chosen string that the instrument does not have', () => {
    const bass = INSTRUMENT_PRESETS.find(i => i.id === 'bass_standard');
    const prompt = generatePrompt({ instrument: bass, promptType: 'string_specific', stringIndex: 5 });
    expect(prompt.stringIndex).toBeLessThan(4);
  });
});
