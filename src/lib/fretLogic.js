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

/**
 * Generate a prompt based on session parameters
 */
export function generatePrompt({
  promptType = 'global', // 'global' | 'string_specific'
  includeAccidentals = false,
  minFret = 0,
  maxFret = 12,
  instrument = INSTRUMENT_PRESETS[0],
  noteDisplay = 'sharps',
  useFlats = false,
  previousNote = null
}) {
  const displayMode = noteDisplay || (useFlats ? 'flats' : 'sharps');

  let pool = NATURAL_NOTES;
  if (includeAccidentals) {
    if (displayMode === 'flats') {
      pool = CHROMATIC_FLATS;
    } else if (displayMode === 'both') {
      pool = CHROMATIC_BOTH;
    } else {
      pool = CHROMATIC_SHARPS;
    }
  }
  
  // Filter out previous note if pool has > 1 options
  let availableNotes = pool;
  if (previousNote && pool.length > 1) {
    availableNotes = pool.filter(n => getNoteIndex(n) !== getNoteIndex(previousNote));
  }

  const selectedNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];

  if (promptType === 'string_specific') {
    // Pick a random string index (0 to stringCount - 1)
    const stringIndex = Math.floor(Math.random() * instrument.tuning.length);
    const openNote = instrument.tuning[stringIndex];
    // Convert 0-index string to standard string number (String 1 = highest pitch, String N = lowest pitch)
    const displayStringNum = instrument.tuning.length - stringIndex;
    
    // Find matching frets on this string within minFret to maxFret
    const positionsOnString = [];
    const maxFretToSearch = Math.min(maxFret, instrument.fretCount || 24);
    for (let fret = Math.max(0, minFret); fret <= maxFretToSearch; fret++) {
      if (getNoteIndex(getNoteAtFret(openNote, fret, displayMode)) === getNoteIndex(selectedNote)) {
        positionsOnString.push(fret);
      }
    }

    return {
      id: `${Date.now()}-${Math.random()}`,
      note: selectedNote,
      promptType: 'string_specific',
      stringIndex: stringIndex,
      stringDisplayNumber: displayStringNum,
      stringOpenNote: openNote,
      targetFrets: positionsOnString,
      promptText: `Find ${selectedNote} on String ${displayStringNum} (${openNote})`,
      subText: `Frets ${minFret}–${maxFret}`
    };
  }

  // Global prompt: Find targetNote across all strings in fret range
  const validPositions = findNotePositionsOnNeck(selectedNote, instrument, minFret, maxFret);

  return {
    id: `${Date.now()}-${Math.random()}`,
    note: selectedNote,
    promptType: 'global',
    validPositions: validPositions,
    promptText: `Find all ${selectedNote} notes`,
    subText: `${validPositions.length} position${validPositions.length === 1 ? '' : 's'} between Frets ${minFret}–${maxFret}`
  };
}
