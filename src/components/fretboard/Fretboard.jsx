import React from 'react';
import FretMarker, { getFretMarkerType } from './FretMarker';
import { getNoteAtFret, getNoteIndex } from '../../lib/fretLogic';

export default function Fretboard({
  instrument,
  highlightPositions = [], // [{ stringIndex, fret }]
  revealed = false,
  minFret = 0,
  maxFret = 12,
  noteDisplay = 'sharps',
  useFlats,
  targetNote = null,
  onCellClick = null
}) {
  if (!instrument || !instrument.tuning || !Array.isArray(instrument.tuning)) {
    return null;
  }

  const displayMode = noteDisplay || (useFlats ? 'flats' : 'sharps');
  const fretCount = Math.min(instrument.fretCount || 24, maxFret);
  const startFret = Math.max(0, minFret);
  
  // Create list of frets to display
  const fretsToDisplay = [];
  for (let f = startFret; f <= fretCount; f++) {
    fretsToDisplay.push(f);
  }

  // Reverse tuning so String 1 (highest pitch, e.g., High E) is displayed at TOP
  const displayStrings = [...instrument.tuning].map((openNote, originalIndex) => ({
    originalIndex, // 0 is lowest pitch string in instrument.tuning array
    displayNumber: (instrument.stringCount || instrument.tuning.length) - originalIndex,
    openNote
  })).reverse();

  // Helper to check if a specific string & fret position is highlighted
  const isPositionHighlighted = (origIndex, fret) => {
    return (highlightPositions || []).some(
      pos => pos && pos.stringIndex === origIndex && pos.fret === fret
    );
  };

  // Row indices for inlay dot positioning
  const totalStrings = displayStrings.length;
  const singleDotRow = Math.floor((totalStrings - 1) * 0.5);
  const upperDotRow = Math.max(0, Math.floor((totalStrings - 1) * 0.25));
  const lowerDotRow = Math.min(totalStrings - 1, Math.ceil((totalStrings - 1) * 0.75));

  // Calculate total neck width dynamically based on fret count
  const fretColWidthPx = 40; // min px per fret column
  const headerWidthPx = 96;  // px for string label column
  const minNeckWidthPx = headerWidthPx + (fretsToDisplay.length * fretColWidthPx);

  return (
    <div className="card bg-base-100 border border-base-300 rounded-2xl p-2 sm:p-5 shadow-2xl backdrop-blur-md overflow-x-auto selection:bg-transparent w-full">
      <div className="w-max min-w-full flex flex-col" style={{ minWidth: `${minNeckWidthPx}px` }}>
        {/* Top Fret Header Labels */}
        <div className="flex items-center mb-1 sm:mb-2 w-full">
          <div className="w-16 sm:w-24 text-center text-[10px] sm:text-xs font-mono tracking-wider font-semibold text-base-content/60 uppercase shrink-0">
            String
          </div>
          <div className="flex-1 grid gap-0 text-center" style={{ gridTemplateColumns: `repeat(${fretsToDisplay.length}, minmax(36px, 1fr))` }}>
            {fretsToDisplay.map(fret => (
              <div
                key={`head-${fret}`}
                className={`text-[10px] sm:text-xs font-mono font-bold py-1 ${
                  fret === 0
                    ? 'bg-base-300 text-base-content rounded-t border-b-2 border-base-content/30 font-extrabold shadow-sm'
                    : 'text-base-content/70'
                }`}
              >
                {fret === 0 ? 'NUT' : fret}
              </div>
            ))}
          </div>
        </div>

        {/* Fretboard Grid Container */}
        <div className="relative w-full border-t border-b border-base-300 rounded-lg bg-base-200 py-1 shadow-inner">
          {displayStrings.map((str, displayIdx) => {
            // Calculate string thickness based on pitch (thinnest for High Pitch S1, thickest for Low Pitch S_N)
            const maxIndex = (instrument.stringCount || 6) - 1;
            const thicknessPx = Math.max(1, Math.min(5.5, 1 + (maxIndex - str.originalIndex) * 0.8));

            return (
              <div key={`string-${str.originalIndex}`} className="relative flex items-center h-10 sm:h-14 group">
                {/* String Wire Visual */}
                <div 
                  className="absolute left-16 sm:left-24 right-0 z-0 transition-opacity shadow-[0_1px_3px_rgba(0,0,0,0.8)] bg-gradient-to-r from-base-content/40 via-base-content/70 to-base-content/40 opacity-80 group-hover:opacity-100" 
                  style={{ height: `${thicknessPx}px` }} 
                />

                {/* String Header Label */}
                <div className="w-16 sm:w-24 z-10 flex items-center justify-between pr-2 sm:pr-4 pl-1.5 font-mono border-r border-base-300 bg-base-100 h-full shrink-0">
                  <span className="text-[10px] sm:text-xs font-semibold text-base-content/70">S{str.displayNumber}</span>
                  <span className="badge badge-primary badge-sm font-bold">
                    {str.openNote}
                  </span>
                </div>

                {/* Fret Cells for this string */}
                <div className="flex-1 grid h-full z-10" style={{ gridTemplateColumns: `repeat(${fretsToDisplay.length}, minmax(36px, 1fr))` }}>
                  {fretsToDisplay.map(fret => {
                    const currentNote = getNoteAtFret(str.openNote, fret, displayMode);
                    const isHighlighted = isPositionHighlighted(str.originalIndex, fret);
                    const isTargetNoteMatch = targetNote && getNoteIndex(currentNote) === getNoteIndex(targetNote);
                    
                    const isNut = fret === 0;
                    const markerType = getFretMarkerType(fret);

                  return (
                    <div
                      key={`cell-${str.originalIndex}-${fret}`}
                      onClick={() => onCellClick && onCellClick({ stringIndex: str.originalIndex, fret, note: currentNote })}
                      className={`relative flex items-center justify-center cursor-pointer transition-colors duration-200 ${
                        isNut 
                          ? 'bg-base-300 border-r-4 border-base-content/30 shadow-inner' 
                          : 'border-r border-base-300 hover:bg-base-300/40'
                      }`}
                    >
                      {/* Inlay Dots */}
                      {!isNut && (
                        <>
                          {markerType === 'single' && displayIdx === singleDotRow && (
                            <FretMarker />
                          )}
                          {markerType === 'double' && (displayIdx === upperDotRow || displayIdx === lowerDotRow) && (
                            <FretMarker />
                          )}
                        </>
                      )}

                      {/* Note Badge / Marker */}
                      {revealed && isHighlighted ? (
                        <div className="z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-success text-success-content font-black text-sm sm:text-base flex items-center justify-center shadow-lg animate-bounce-subtle ring-2 ring-success-content/40">
                          {currentNote}
                        </div>
                      ) : revealed && isTargetNoteMatch && (!highlightPositions || highlightPositions.length === 0) ? (
                        <div className="z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-content font-bold text-xs sm:text-sm flex items-center justify-center shadow-md">
                          {currentNote}
                        </div>
                      ) : (
                        <span className={`text-[10px] sm:text-xs font-mono font-bold opacity-0 hover:opacity-100 transition-opacity ${
                          isNut ? 'text-base-content' : 'text-base-content/50'
                        }`}>
                          {currentNote}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Fret Legend / Note Count Footer */}
      <div className="flex items-center justify-between mt-3 px-2 text-xs font-mono text-base-content/70">
        <div>Frets shown: <span className="text-primary font-semibold">{startFret} to {fretCount}</span></div>
        {revealed && (
          <div className="text-success font-semibold flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-success animate-ping" />
            {highlightPositions.length} Matching Position{highlightPositions.length === 1 ? '' : 's'} Highlighted
          </div>
        )}
      </div>
    </div>
  );
}
