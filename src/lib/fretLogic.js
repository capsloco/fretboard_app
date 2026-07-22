// Fretboard Logic & Pure Math Functions

export const CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const CHROMATIC_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
export const NATURAL_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const INSTRUMENT_PRESETS = [
  {
    id: 'guitar_standard',
    title: '6-String Guitar (Standard E)',
    stringCount: 6,
    fretCount: 24,
    tuning: ['E', 'A', 'D', 'G', 'B', 'E'] // From lowest pitch (string 6) to highest (string 1)
  },
  {
    id: 'bass_standard',
    title: '4-String Bass (Standard E)',
    stringCount: 4,
    fretCount: 24,
    tuning: ['E', 'A', 'D', 'G']
  },
  {
    id: 'guitar_7_standard',
    title: '7-String Guitar (Standard B)',
    stringCount: 7,
    fretCount: 24,
    tuning: ['B', 'E', 'A', 'D', 'G', 'B', 'E']
  },
  {
    id: 'guitar_7_drop_a',
    title: '7-String Guitar (Drop A)',
    stringCount: 7,
    fretCount: 24,
    tuning: ['A', 'E', 'A', 'D', 'G', 'B', 'E']
  },
  {
    id: 'bass_5_standard',
    title: '5-String Bass (Standard B)',
    stringCount: 5,
    fretCount: 24,
    tuning: ['B', 'E', 'A', 'D', 'G']
  }
];

/**
 * Standardize note name to index in chromatic scale (0-11)
 */
export function getNoteIndex(noteName) {
  const clean = noteName.trim().toUpperCase();
  const sharpIdx = CHROMATIC_SHARPS.indexOf(clean);
  if (sharpIdx !== -1) return sharpIdx;
  const flatIdx = CHROMATIC_FLATS.indexOf(clean);
  if (flatIdx !== -1) return flatIdx;
  
  // Handle edge cases like E# -> F, B# -> C, Cb -> B, Fb -> E
  if (clean === 'E#') return 5; // F
  if (clean === 'B#') return 0; // C
  if (clean === 'CB') return 11; // B
  if (clean === 'FB') return 4; // E
  
  return 0;
}

/**
 * Normalize note name output format (e.g. C# vs Db)
 */
export function formatNoteName(noteIndex, useFlats = false) {
  return useFlats ? CHROMATIC_FLATS[noteIndex % 12] : CHROMATIC_SHARPS[noteIndex % 12];
}

/**
 * Get the note at a specific string and fret
 * @param {string} openNote - Open string note (e.g., 'E')
 * @param {number} fret - Fret number (0 for open string)
 * @param {boolean} useFlats - Return flat notation if true
 */
export function getNoteAtFret(openNote, fret, useFlats = false) {
  const openIdx = getNoteIndex(openNote);
  const targetIdx = (openIdx + fret) % 12;
  return formatNoteName(targetIdx, useFlats);
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
  useFlats = false,
  previousNote = null
}) {
  const pool = includeAccidentals 
    ? (useFlats ? CHROMATIC_FLATS : CHROMATIC_SHARPS)
    : NATURAL_NOTES;
  
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
      if (getNoteAtFret(openNote, fret) === formatNoteName(getNoteIndex(selectedNote), false)) {
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
