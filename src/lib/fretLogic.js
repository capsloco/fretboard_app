// Fretboard Logic & Pure Math Functions

export const CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const CHROMATIC_FLATS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
export const CHROMATIC_BOTH = ['C', 'C#', 'D♭', 'D', 'D#', 'E♭', 'E', 'F', 'F#', 'G♭', 'G', 'A♭', 'A', 'A#', 'B♭', 'B'];
export const NATURAL_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const INSTRUMENT_PRESETS = [
  {
    id: 'guitar_standard',
    title: '6-String Guitar',
    stringCount: 6,
    fretCount: 24,
    type: 'guitar',
    defaultTuningId: 'guitar_6_e_std',
    tuning: ['E', 'A', 'D', 'G', 'B', 'E'] // Lowest to highest pitch
  },
  {
    id: 'guitar_7_standard',
    title: '7-String Guitar',
    stringCount: 7,
    fretCount: 24,
    type: 'guitar',
    defaultTuningId: 'guitar_7_std',
    tuning: ['B', 'E', 'A', 'D', 'G', 'B', 'E']
  },
  {
    id: 'bass_standard',
    title: '4-String Bass',
    stringCount: 4,
    fretCount: 24,
    type: 'bass',
    defaultTuningId: 'bass_4_std',
    tuning: ['E', 'A', 'D', 'G']
  },
  {
    id: 'bass_5_standard',
    title: '5-String Bass',
    stringCount: 5,
    fretCount: 24,
    type: 'bass',
    defaultTuningId: 'bass_5_std',
    tuning: ['B', 'E', 'A', 'D', 'G']
  }
];

export const TUNING_PRESETS = [
  // --- 6-String Guitar ---
  {
    id: 'guitar_6_e_std',
    name: 'E Standard',
    category: 'Standard & Transposed',
    stringCount: 6,
    type: 'guitar',
    octaves: 'E2 - A2 - D3 - G3 - B3 - E4',
    tuning: ['E', 'A', 'D', 'G', 'B', 'E']
  },
  {
    id: 'guitar_6_eb_std',
    name: 'E♭ (Half-Step Down)',
    category: 'Standard & Transposed',
    stringCount: 6,
    type: 'guitar',
    octaves: 'E♭2 - A♭2 - D♭3 - G♭3 - B♭3 - E♭4',
    tuning: ['E♭', 'A♭', 'D♭', 'G♭', 'B♭', 'E♭']
  },
  {
    id: 'guitar_6_d_std',
    name: 'D Standard (Whole-Step Down)',
    category: 'Standard & Transposed',
    stringCount: 6,
    type: 'guitar',
    octaves: 'D2 - G2 - C3 - F3 - A3 - D4',
    tuning: ['D', 'G', 'C', 'F', 'A', 'D']
  },
  {
    id: 'guitar_6_drop_d',
    name: 'Drop D',
    category: 'Drop Tunings',
    stringCount: 6,
    type: 'guitar',
    octaves: 'D2 - A2 - D3 - G3 - B3 - E4',
    tuning: ['D', 'A', 'D', 'G', 'B', 'E']
  },
  {
    id: 'guitar_6_drop_c',
    name: 'Drop C',
    category: 'Drop Tunings',
    stringCount: 6,
    type: 'guitar',
    octaves: 'C2 - G2 - C3 - F3 - A3 - D4',
    tuning: ['C', 'G', 'C', 'F', 'A', 'D']
  },
  {
    id: 'guitar_6_open_g',
    name: 'Open G',
    category: 'Open & Modal',
    stringCount: 6,
    type: 'guitar',
    octaves: 'D2 - G2 - D3 - G3 - B3 - D4',
    tuning: ['D', 'G', 'D', 'G', 'B', 'D']
  },
  {
    id: 'guitar_6_open_d',
    name: 'Open D',
    category: 'Open & Modal',
    stringCount: 6,
    type: 'guitar',
    octaves: 'D2 - A2 - D3 - F♯3 - A3 - D4',
    tuning: ['D', 'A', 'D', 'F#', 'A', 'D']
  },
  {
    id: 'guitar_6_dadgad',
    name: 'DADGAD',
    category: 'Open & Modal',
    stringCount: 6,
    type: 'guitar',
    octaves: 'D2 - A2 - D3 - G3 - A3 - D4',
    tuning: ['D', 'A', 'D', 'G', 'A', 'D']
  },

  // --- 7-String Guitar ---
  {
    id: 'guitar_7_std',
    name: '7-String Standard',
    category: 'Standard & Transposed',
    stringCount: 7,
    type: 'guitar',
    octaves: 'B1 - E2 - A2 - D3 - G3 - B3 - E4',
    description: 'The default baseline for 7-string guitar; adds a low B.',
    tuning: ['B', 'E', 'A', 'D', 'G', 'B', 'E']
  },
  {
    id: 'guitar_7_drop_a',
    name: '7-String Drop A',
    category: 'Drop Tunings',
    stringCount: 7,
    type: 'guitar',
    octaves: 'A1 - E2 - A2 - D3 - G3 - B3 - E4',
    description: 'The most popular 7-string drop tuning; lowers only the 7th string.',
    tuning: ['A', 'E', 'A', 'D', 'G', 'B', 'E']
  },
  {
    id: 'guitar_7_drop_g',
    name: '7-String Drop G',
    category: 'Drop Tunings',
    stringCount: 7,
    type: 'guitar',
    octaves: 'G1 - D2 - G2 - C3 - F3 - A3 - D4',
    description: 'A whole-step down version of Drop A; massive in modern progressive metal and djent.',
    tuning: ['G', 'D', 'G', 'C', 'F', 'A', 'D']
  },

  // --- 4-String Bass ---
  {
    id: 'bass_4_std',
    name: '4-String Standard',
    category: 'Standard & Transposed',
    stringCount: 4,
    type: 'bass',
    octaves: 'E1 - A1 - D2 - G2',
    description: 'Matches the lowest four strings of a standard guitar, exactly one octave lower.',
    tuning: ['E', 'A', 'D', 'G']
  },
  {
    id: 'bass_4_d_std',
    name: '4-String D Standard',
    category: 'Standard & Transposed',
    stringCount: 4,
    type: 'bass',
    octaves: 'D1 - G1 - C2 - F2',
    description: 'A whole-step down across all strings to match D Standard guitars.',
    tuning: ['D', 'G', 'C', 'F']
  },
  {
    id: 'bass_4_drop_d',
    name: '4-String Drop D',
    category: 'Drop Tunings',
    stringCount: 4,
    type: 'bass',
    octaves: 'D1 - A1 - D2 - G2',
    description: 'Drops the lowest string for heavier rock and metal basslines.',
    tuning: ['D', 'A', 'D', 'G']
  },

  // --- 5-String Bass ---
  {
    id: 'bass_5_std',
    name: '5-String Standard',
    category: 'Standard & Transposed',
    stringCount: 5,
    type: 'bass',
    octaves: 'B0 - E1 - A1 - D2 - G2',
    description: 'Adds a low B string below the standard E; standard for modern pop, gospel, and metal.',
    tuning: ['B', 'E', 'A', 'D', 'G']
  },
  {
    id: 'bass_5_drop_a',
    name: '5-String Drop A',
    category: 'Drop Tunings',
    stringCount: 5,
    type: 'bass',
    octaves: 'A0 - E1 - A1 - D2 - G2',
    description: 'Drops the lowest string to A; targets ultra-low sub-bass frequencies.',
    tuning: ['A', 'E', 'A', 'D', 'G']
  }
];

/**
 * Get available tuning presets for a given string count & optional type
 */
export function getTuningsForInstrument(stringCount, type = null) {
  return TUNING_PRESETS.filter(t => {
    if (t.stringCount !== stringCount) return false;
    if (type && t.type && t.type !== type) return false;
    return true;
  });
}

/**
 * Group tunings array by category
 */
export function groupTuningsByCategory(tunings) {
  const categories = {};
  tunings.forEach(t => {
    const cat = t.category || 'Other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(t);
  });
  return categories;
}

/**
 * Match a tuning array to a preset ID if possible
 */
export function findMatchingTuningPreset(tuningArray = [], stringCount = 6) {
  if (!tuningArray || tuningArray.length === 0) return null;
  return TUNING_PRESETS.find(p => {
    if (p.stringCount !== stringCount) return false;
    if (p.tuning.length !== tuningArray.length) return false;
    return p.tuning.every((note, idx) => getNoteIndex(note) === getNoteIndex(tuningArray[idx]));
  });
}

/**
 * Standardize note name to index in chromatic scale (0-11)
 */
export function getNoteIndex(noteName) {
  if (!noteName) return 0;
  const clean = noteName.split('/')[0].trim().toUpperCase().replace('♭', 'B').replace('♯', '#');
  const sharpIdx = CHROMATIC_SHARPS.indexOf(clean);
  if (sharpIdx !== -1) return sharpIdx;
  
  const flatIdx = CHROMATIC_FLATS.map(n => n.toUpperCase().replace('♭', 'B')).indexOf(clean);
  if (flatIdx !== -1) return flatIdx;
  
  // Handle edge cases like E# -> F, B# -> C, Cb -> B, Fb -> E
  if (clean === 'E#') return 5; // F
  if (clean === 'B#') return 0; // C
  if (clean === 'CB') return 11; // B
  if (clean === 'FB') return 4; // E
  
  return 0;
}

/**
 * Normalize note name output format (e.g. C# vs D♭ vs C#/D♭)
 */
export function formatNoteName(noteIndex, noteDisplay = 'sharps') {
  const idx = ((noteIndex % 12) + 12) % 12;
  if (noteDisplay === 'flats' || noteDisplay === true) {
    return CHROMATIC_FLATS[idx];
  }
  if (noteDisplay === 'both') {
    const sharp = CHROMATIC_SHARPS[idx];
    const flat = CHROMATIC_FLATS[idx];
    return sharp === flat ? sharp : `${sharp}/${flat}`;
  }
  return CHROMATIC_SHARPS[idx];
}

/**
 * Get the note at a specific string and fret
 * @param {string} openNote - Open string note (e.g., 'E')
 * @param {number} fret - Fret number (0 for open string)
 * @param {string|boolean} noteDisplay - Note display mode ('sharps', 'flats', 'both')
 */
export function getNoteAtFret(openNote, fret, noteDisplay = 'sharps') {
  const openIdx = getNoteIndex(openNote);
  const targetIdx = (openIdx + fret) % 12;
  return formatNoteName(targetIdx, noteDisplay);
}

/**
 * Inlay dots: 'double' at 12 and 24, 'single' at the usual frets, else null
 */
export function getFretMarkerType(fret) {
  if (fret === 12 || fret === 24) return 'double';
  if ([3, 5, 7, 9, 15, 17, 19, 21].includes(fret)) return 'single';
  return null;
}

/**
 * Find all fretboard positions for a target note within given fret boundaries
 */
export function findNotePositionsOnNeck(targetNote, instrument, minFret = 0, maxFret = 24) {
  const targetIdx = getNoteIndex(targetNote);
  const positions = [];

  instrument.tuning.forEach((openNote, sIndex) => {
    const maxFretToSearch = Math.min(maxFret, instrument.fretCount || 24);
    for (let fret = Math.max(0, minFret); fret <= maxFretToSearch; fret++) {
      const openIdx = getNoteIndex(openNote);
      if ((openIdx + fret) % 12 === targetIdx) {
        positions.push({
          stringIndex: sIndex, // 0 is lowest pitch string (e.g. String 6 on standard guitar)
          stringDisplayNumber: instrument.stringCount - sIndex, // 1 is high E, 6 is low E in standard notation
          stringOpenNote: openNote,
          fret: fret
        });
      }
    }
  });

  return positions;
}

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

/** Random item, with the chance of each proportional to weightOf(item) */
function pickWeighted(items, weightOf) {
  const weights = items.map(item => Math.max(0, weightOf(item)));
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (!(total > 0)) return pickRandom(items);
  let roll = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll < 0) return items[i];
  }
  return items[items.length - 1];
}

/** Spellings of a pitch class for the display mode ('both' asks for C# and D♭ separately) */
function spellingsFor(pitchClass, displayMode) {
  if (displayMode !== 'both') return [formatNoteName(pitchClass, displayMode)];
  const sharp = CHROMATIC_SHARPS[pitchClass];
  const flat = CHROMATIC_FLATS[pitchClass];
  return sharp === flat ? [sharp] : [sharp, flat];
}

/**
 * A string's name for prompts: 'A', or 'low E' / 'high E' (and 'middle D' in tunings
 * like DADGAD) when more than one string has the same open note.
 */
export function getStringName(tuning, stringIndex) {
  const note = tuning[stringIndex];
  const sameNote = tuning
    .map((n, i) => (getNoteIndex(n) === getNoteIndex(note) ? i : -1))
    .filter(i => i !== -1);
  if (sameNote.length === 1) return note;
  if (stringIndex === sameNote[0]) return `low ${note}`;
  if (stringIndex === sameNote.at(-1)) return `high ${note}`;
  return `middle ${note}`;
}

/**
 * Generate a prompt based on session parameters.
 * Only picks notes (and, for string-specific prompts, strings) that actually
 * have a position inside the fret range, so every prompt is answerable.
 *
 * focusNotes:  pitch classes (0-11) to ask about instead of the usual pool (weak-spot drills)
 * noteWeights: 12 weights by pitch class; heavier notes come up more often (adaptive rounds)
 * stringIndex: for string prompts, always this string (0 = lowest) instead of a random one.
 *              Falls back to any string if none of the notes are on it inside the fret range.
 */
export function generatePrompt({
  promptType = 'global', // 'global' | 'string_specific'
  includeAccidentals = false,
  minFret = 0,
  maxFret = 12,
  instrument = INSTRUMENT_PRESETS[0],
  noteDisplay = 'sharps',
  useFlats = false,
  previousNote = null,
  focusNotes = null,
  noteWeights = null,
  stringIndex: fixedStringIndex = null
}) {
  const displayMode = noteDisplay || (useFlats ? 'flats' : 'sharps');

  let pool = NATURAL_NOTES;
  if (focusNotes?.length) {
    pool = focusNotes.flatMap(pc => spellingsFor(pc, displayMode));
  } else if (includeAccidentals) {
    if (displayMode === 'flats') {
      pool = CHROMATIC_FLATS;
    } else if (displayMode === 'both') {
      pool = CHROMATIC_BOTH;
    } else {
      pool = CHROMATIC_SHARPS;
    }
  }

  // Don't repeat the previous note, unless it's the only one (C# and D♭ count as one note)
  let availableNotes = pool;
  if (previousNote && new Set(pool.map(getNoteIndex)).size > 1) {
    availableNotes = pool.filter(n => getNoteIndex(n) !== getNoteIndex(previousNote));
  }

  const onNeck = n => findNotePositionsOnNeck(n, instrument, minFret, maxFret);
  let fixedString = promptType === 'string_specific'
    && Number.isInteger(fixedStringIndex)
    && fixedStringIndex >= 0
    && fixedStringIndex < instrument.tuning.length
    ? fixedStringIndex
    : null;
  let playableNotes = availableNotes.filter(n => onNeck(n).some(p => fixedString === null || p.stringIndex === fixedString));
  if (fixedString !== null && playableNotes.length === 0) {
    fixedString = null;
    playableNotes = availableNotes.filter(n => onNeck(n).length > 0);
  }
  const candidates = playableNotes.length > 0 ? playableNotes : availableNotes;
  const selectedNote = noteWeights
    ? pickWeighted(candidates, n => noteWeights[getNoteIndex(n)] ?? 1)
    : pickRandom(candidates);
  const positions = findNotePositionsOnNeck(selectedNote, instrument, minFret, maxFret);

  if (promptType === 'string_specific') {
    const stringsWithNote = [...new Set(positions.map(p => p.stringIndex))];
    const stringIndex = fixedString ?? (stringsWithNote.length > 0
      ? pickRandom(stringsWithNote)
      : Math.floor(Math.random() * instrument.tuning.length));
    const openNote = instrument.tuning[stringIndex];
    // Convert 0-index string to standard string number (String 1 = highest pitch, String N = lowest pitch)
    const displayStringNum = instrument.tuning.length - stringIndex;
    const positionsOnString = positions.filter(p => p.stringIndex === stringIndex);
    const targetFrets = positionsOnString.map(p => p.fret);

    return {
      id: `${Date.now()}-${Math.random()}`,
      note: selectedNote,
      promptType: 'string_specific',
      stringIndex: stringIndex,
      stringDisplayNumber: displayStringNum,
      stringOpenNote: openNote,
      targetFrets,
      validPositions: positionsOnString.map(p => ({ stringIndex, fret: p.fret })),
      promptText: `on the ${getStringName(instrument.tuning, stringIndex)} string`,
      subText: `String ${displayStringNum} · frets ${minFret}–${maxFret}`
    };
  }

  return {
    id: `${Date.now()}-${Math.random()}`,
    note: selectedNote,
    promptType: 'global',
    validPositions: positions,
    promptText: 'anywhere on the neck',
    subText: `${positions.length} position${positions.length === 1 ? '' : 's'} · frets ${minFret}–${maxFret}`
  };
}

/* ------------------------------------------------------------------ */
/* Pitch math: MIDI numbers, open-string octaves & grading             */
/* MIDI 60 = C4 (middle C), A4 = 440 Hz. Octaves use scientific pitch. */
/* ------------------------------------------------------------------ */

const A4_MIDI = 69;
const A4_FREQUENCY = 440;

export function frequencyToMidi(frequency) {
  return A4_MIDI + 12 * Math.log2(frequency / A4_FREQUENCY);
}

export function midiToFrequency(midi) {
  return A4_FREQUENCY * 2 ** ((midi - A4_MIDI) / 12);
}

/**
 * Note name + octave for a MIDI number, e.g. 48 -> { name: 'C', octave: 3 }
 */
export function midiToNoteLabel(midi, noteDisplay = 'sharps') {
  const rounded = Math.round(midi);
  return {
    name: formatNoteName(rounded, noteDisplay),
    octave: Math.floor(rounded / 12) - 1
  };
}

// Standard open-string pitches, low to high. Used as anchors to work out
// which octave each string of any tuning sits in.
const GUITAR_REFERENCE_MIDIS = [30, 35, 40, 45, 50, 55, 59, 64]; // F#1 B1 E2 A2 D3 G3 B3 E4
const BASS_REFERENCE_MIDIS = [23, 28, 33, 38, 43, 48]; // B0 E1 A1 D2 G2 C3

function referenceStringMidis(instrument) {
  const count = instrument.tuning.length;
  const type = instrument.type || (count <= 5 ? 'bass' : 'guitar');

  if (type === 'bass') {
    if (count === 4) return BASS_REFERENCE_MIDIS.slice(1, 5);
    if (count <= BASS_REFERENCE_MIDIS.length) return BASS_REFERENCE_MIDIS.slice(0, count);
  } else if (count <= GUITAR_REFERENCE_MIDIS.length) {
    return GUITAR_REFERENCE_MIDIS.slice(-count);
  }

  // Unusual string counts: extend downward in fourths from the top string
  const top = type === 'bass' ? BASS_REFERENCE_MIDIS.at(-1) : GUITAR_REFERENCE_MIDIS.at(-1);
  return Array.from({ length: count }, (_, i) => top - (count - 1 - i) * 5);
}

/**
 * MIDI pitch of each open string (same order as instrument.tuning, low to high).
 * Tunings only store note names, so each string's octave is inferred as the one
 * closest to the standard-tuning string in the same position (drop tunings go
 * down, e.g. Drop D -> D2, 7-string Drop A -> A1).
 */
export function getStringMidis(instrument) {
  const references = referenceStringMidis(instrument);
  return instrument.tuning.map((note, i) => {
    const reference = references[i];
    const semitonesUp = (getNoteIndex(note) - (reference % 12) + 12) % 12;
    return semitonesUp < 6 ? reference + semitonesUp : reference + semitonesUp - 12;
  });
}

// Small phone and laptop mics barely pick up a low string's fundamental, so the detector
// can hear it an octave high. A tuner reading that fits a string's octave counts as that
// string, but a plain match wins when both fit.
const OCTAVE_SLIP_PENALTY = 0.5;

/**
 * What a tuner should show for a heard (fractional) MIDI pitch: which open string it is and
 * how far off, in cents. Works when a string is several semitones out, and when the pitch was
 * heard an octave high (`octaveSlip`), which keeps the note and cents but not the octave.
 * @param lockedIndex only consider this string (the player picked it)
 * @returns {{ stringIndex: number, cents: number, octaveSlip: boolean }}
 */
export function readTuner(midiFloat, stringMidis, lockedIndex = null) {
  const indexes = lockedIndex === null ? stringMidis.map((_, i) => i) : [lockedIndex];
  let best = null;
  for (const stringIndex of indexes) {
    for (const octaveSlip of [false, true]) {
      const offset = midiFloat - (octaveSlip ? 12 : 0) - stringMidis[stringIndex];
      if (octaveSlip && Math.abs(offset) >= 1) continue;
      const cost = Math.abs(offset) + (octaveSlip ? OCTAVE_SLIP_PENALTY : 0);
      if (!best || cost < best.cost) best = { stringIndex, cents: Math.round(offset * 100), octaveSlip, cost };
    }
  }
  const { cost: _cost, ...reading } = best;
  return reading;
}

/**
 * Frequency window worth listening to for an instrument: a couple of semitones
 * below the lowest open string up to a little above its highest fret.
 */
export function getInstrumentFrequencyRange(instrument) {
  const stringMidis = getStringMidis(instrument);
  const fretCount = instrument.fretCount || 24;
  return {
    minFrequency: midiToFrequency(Math.min(...stringMidis) - 2),
    maxFrequency: midiToFrequency(Math.max(...stringMidis) + fretCount + 2)
  };
}

/**
 * Grade a detected note against a prompt.
 * - Global prompts accept the right note in any octave.
 * - String-specific prompts need the exact pitch that string makes inside the
 *   fret range, which rules out most wrong-string answers.
 */
export function gradeDetectedNote(prompt, detectedMidi, instrument) {
  const midi = Math.round(detectedMidi);
  const pitchClassMatch = ((midi % 12) + 12) % 12 === getNoteIndex(prompt.note);

  if (prompt.promptType !== 'string_specific') {
    return { correct: pitchClassMatch, pitchClassMatch, expectedMidis: null };
  }

  const openMidi = getStringMidis(instrument)[prompt.stringIndex];
  const expectedMidis = (prompt.targetFrets || []).map(fret => openMidi + fret);
  return { correct: expectedMidis.includes(midi), pitchClassMatch, expectedMidis };
}
