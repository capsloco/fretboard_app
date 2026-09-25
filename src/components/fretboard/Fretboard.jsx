import React from 'react';
import { getNoteAtFret, getStringMidis, getFretMarkerType } from '../../lib/fretLogic';

const LABEL_REM = 3.5;
const NUT_REM = 0.875;
const MIN_FRET_REM = 2.4;

// Frets narrow as they climb the neck (softened so high frets stay readable)
const fretScale = (fret, startFret) => 2 ** (-(fret - startFret) / 36);

// Thicker for lower pitches: high E ≈ 1px, low E ≈ 3.2px, bass low B ≈ 4.7px
const stringThickness = (midi) => Math.min(5.5, Math.max(1, 1 + (64 - midi) * 0.09));

function NoteDot({ note }) {
  return (
    <span className="relative z-20 shrink-0 flex items-center justify-center size-7 sm:size-8 rounded-full bg-primary text-primary-content font-display font-bold text-sm sm:text-base shadow-md ring-2 ring-base-100/70">
      {note}
    </span>
  );
}

function Inlays({ type, stringCount }) {
  if (!type) return null;
  const dot = 'absolute left-1/2 -translate-x-1/2 -translate-y-1/2 size-2.5 sm:size-3 rounded-full bg-(--inlay) shadow-inner';
  if (type === 'single') return <span className={dot} style={{ top: '50%' }} />;
  const gap = Math.max(1, Math.floor(stringCount / 3)) / stringCount;
  return (
    <>
      <span className={dot} style={{ top: `${gap * 100}%` }} />
      <span className={dot} style={{ top: `${(1 - gap) * 100}%` }} />
    </>
  );
}

export default function Fretboard({
  instrument,
  highlightPositions = [], // [{ stringIndex, fret }]
  revealed = false,
  minFret = 0,
  maxFret = 12,
  noteDisplay = 'sharps'
}) {
  if (!instrument?.tuning?.length) return null;

  const lastFret = Math.min(instrument.fretCount || 24, maxFret);
  const startFret = Math.max(0, minFret);
  const hasNut = startFret === 0;
  const frets = [];
  for (let f = Math.max(1, startFret); f <= lastFret; f++) frets.push(f);

  const scales = frets.map(f => fretScale(f, frets[0]));
  const columns = scales.map(s => `minmax(${(MIN_FRET_REM * s).toFixed(2)}rem, ${s.toFixed(3)}fr)`).join(' ');
  const minWidthRem = LABEL_REM + (hasNut ? NUT_REM : 0) + scales.reduce((sum, s) => sum + MIN_FRET_REM * s, 0);

  const stringMidis = getStringMidis(instrument);
  // Highest string on top, like looking down at the neck in playing position
  const strings = instrument.tuning
    .map((openNote, index) => ({
      index,
      openNote,
      number: instrument.tuning.length - index,
      midi: stringMidis[index]
    }))
    .reverse();

  const isHighlighted = (stringIndex, fret) =>
    revealed && highlightPositions.some(p => p?.stringIndex === stringIndex && p.fret === fret);

  return (
    <section aria-label="Fretboard" className="card bg-base-100 shadow-lg p-2 sm:p-4 overflow-x-auto">
      <div style={{ minWidth: `${minWidthRem}rem` }} className="select-none">
        {/* Fret numbers */}
        <div className="flex font-display text-xs sm:text-sm tabular-nums">
          <div style={{ width: `${LABEL_REM}rem` }} className="shrink-0" />
          {hasNut && <div style={{ width: `${NUT_REM}rem` }} className="shrink-0" />}
          <div className="flex-1 grid" style={{ gridTemplateColumns: columns }}>
            {frets.map(f => (
              <div key={f} className={`text-center pb-1 ${getFretMarkerType(f) ? 'font-bold' : 'opacity-50'}`}>{f}</div>
            ))}
          </div>
        </div>

        <div className="flex rounded-field overflow-hidden shadow-inner">
          {/* String labels */}
          <div style={{ width: `${LABEL_REM}rem` }} className="shrink-0">
            {strings.map(s => (
              <div key={s.index} className="h-9 sm:h-11 flex items-center justify-between pl-1.5 pr-4 font-display">
                <span className="text-xs opacity-60 tabular-nums">{s.number}</span>
                <span className="font-bold text-sm sm:text-base">{s.openNote}</span>
              </div>
            ))}
          </div>

          {/* Nut, with open-string answers on it */}
          {hasNut && (
            <div style={{ width: `${NUT_REM}rem` }} className="shrink-0 relative z-10 bg-(--nut) bg-linear-to-r from-black/10 via-white/30 to-black/15 border-l-2 border-black/40 shadow-[2px_0_3px_rgb(0_0_0/0.35)]">
              {strings.map(s => (
                <div key={s.index} className="h-9 sm:h-11 flex items-center justify-center">
                  {isHighlighted(s.index, 0) && <NoteDot note={getNoteAtFret(s.openNote, 0, noteDisplay)} />}
                </div>
              ))}
            </div>
          )}

          {/* Fingerboard */}
          <div className="relative flex-1 bg-fingerboard">
            <div className="absolute inset-0 grid" style={{ gridTemplateColumns: columns }} aria-hidden="true">
              {frets.map(f => (
                <div key={f} className="relative border-r-[3px] border-(--fret) shadow-[1px_0_0_rgb(0_0_0/0.25)]">
                  <Inlays type={getFretMarkerType(f)} stringCount={strings.length} />
                </div>
              ))}
            </div>

            {strings.map(s => (
              <div key={s.index} className="relative h-9 sm:h-11 grid" style={{ gridTemplateColumns: columns }}>
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 top-1/2 -translate-y-1/2 z-10 shadow-[0_1px_1.5px_rgb(0_0_0/0.45)] ${s.midi < 53 ? 'string-wound' : 'string-plain'}`}
                  style={{ height: `${stringThickness(s.midi)}px` }}
                />
                {frets.map(f => (
                  <div key={f} className="flex items-center justify-center">
                    {isHighlighted(s.index, f) && <NoteDot note={getNoteAtFret(s.openNote, f, noteDisplay)} />}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
