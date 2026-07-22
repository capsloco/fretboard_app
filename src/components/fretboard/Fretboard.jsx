import React from 'react';
import FretMarker from './FretMarker';
import { getNoteAtFret, getNoteIndex } from '../../lib/fretLogic';

export default function Fretboard({
  instrument,
  highlightPositions = [], // [{ stringIndex, fret }]
  revealed = false,
  minFret = 0,
  maxFret = 12,
  useFlats = false,
  targetNote = null,
  onCellClick = null
}) {
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
    displayNumber: instrument.stringCount - originalIndex,
    openNote
  })).reverse();

  // Helper to check if a specific string & fret position is highlighted
  const isPositionHighlighted = (origIndex, fret) => {
    return highlightPositions.some(
      pos => pos.stringIndex === origIndex && pos.fret === fret
    );
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md overflow-x-auto selection:bg-transparent">
      {/* Top Fret Header Labels */}
      <div className="flex items-center mb-2 min-w-[700px]">
        <div className="w-20 sm:w-28 text-center text-xs font-mono tracking-wider font-semibold text-slate-500 uppercase">
          String
        </div>
        <div className="flex-1 grid gap-0 text-center" style={{ gridTemplateColumns: `repeat(${fretsToDisplay.length}, minmax(40px, 1fr))` }}>
          {fretsToDisplay.map(fret => (
            <div key={`head-${fret}`} className="text-xs font-mono text-slate-400 font-semibold py-1">
              {fret === 0 ? 'NUT' : `F${fret}`}
            </div>
          ))}
        </div>
      </div>

      {/* Fretboard Grid Container */}
      <div className="relative min-w-[700px] border-t border-b border-slate-700/80 rounded-lg bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 py-2 shadow-inner">
        {displayStrings.map((str, displayIdx) => {
          // Calculate string thickness based on position (thicker for lower pitch strings)
          const thicknessPx = Math.max(1, Math.min(5, (str.originalIndex + 1) * 0.7));

          return (
            <div key={`string-${str.originalIndex}`} className="relative flex items-center h-14 sm:h-16 group">
              {/* String Wire Visual */}
              <div 
                className="absolute left-20 sm:left-28 right-0 bg-gradient-to-r from-slate-400 via-slate-300 to-slate-400 z-0 opacity-80 group-hover:opacity-100 transition-opacity shadow-[0_1px_3px_rgba(0,0,0,0.8)]" 
                style={{ height: `${thicknessPx}px` }} 
              />

              {/* String Header Label */}
              <div className="w-20 sm:w-28 z-10 flex items-center justify-between pr-4 pl-2 font-mono border-r border-slate-700/60 bg-slate-950/80 h-full">
                <span className="text-xs font-semibold text-slate-400">Str {str.displayNumber}</span>
                <span className="text-sm font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                  {str.openNote}
                </span>
              </div>

              {/* Fret Cells for this string */}
              <div className="flex-1 grid h-full z-10" style={{ gridTemplateColumns: `repeat(${fretsToDisplay.length}, minmax(40px, 1fr))` }}>
                {fretsToDisplay.map(fret => {
                  const currentNote = getNoteAtFret(str.openNote, fret, useFlats);
                  const isHighlighted = isPositionHighlighted(str.originalIndex, fret);
                  const isTargetNoteMatch = targetNote && getNoteIndex(currentNote) === getNoteIndex(targetNote);
                  
                  const isNut = fret === 0;

                  return (
                    <div
                      key={`cell-${str.originalIndex}-${fret}`}
                      onClick={() => onCellClick && onCellClick({ stringIndex: str.originalIndex, fret, note: currentNote })}
                      className={`relative flex items-center justify-center cursor-pointer transition-all duration-200 ${
                        isNut 
                          ? 'border-r-4 border-slate-400 bg-slate-900/60' 
                          : 'border-r border-slate-700/70 hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Inlay Dots on Middle String row */}
                      {displayIdx === Math.floor(displayStrings.length / 2) && !isNut && (
                        <FretMarker fret={fret} />
                      )}

                      {/* Note Badge / Marker */}
                      {revealed && isHighlighted ? (
                        <div className="z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.9)] animate-bounce-subtle ring-2 ring-emerald-200">
                          {currentNote}
                        </div>
                      ) : revealed && isTargetNoteMatch ? (
                        <div className="z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-cyan-900/80 text-cyan-200 font-bold text-xs sm:text-sm flex items-center justify-center border border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                          {currentNote}
                        </div>
                      ) : (
                        <span className="text-[10px] sm:text-xs font-mono font-medium text-slate-600 opacity-0 hover:opacity-100 transition-opacity">
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

      {/* Fret Legend / Note Count Footer */}
      <div className="flex items-center justify-between mt-3 px-2 text-xs font-mono text-slate-400">
        <div>Frets shown: <span className="text-cyan-400 font-semibold">{startFret} to {fretCount}</span></div>
        {revealed && (
          <div className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            {highlightPositions.length} Matching Position{highlightPositions.length === 1 ? '' : 's'} Highlighted
          </div>
        )}
      </div>
    </div>
  );
}
