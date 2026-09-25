import React from 'react';
import { Grid3x3 } from 'lucide-react';
import { formatResponseTime } from '../../lib/formatters';
import { MIN_ATTEMPTS_FOR_VERDICT, MASTERED_ACCURACY_PCT } from '../../lib/statsLogic';

// Tile colour by how well a note is known; the percentage and legend carry the same meaning in text
function tileTone({ level, accuracyPct }) {
  if (level === 'untried') return 'border-dashed border-base-300 bg-base-100';
  if (level === 'mastered') return 'border-success bg-success/15';
  return accuracyPct < 50 ? 'border-error bg-error/15' : 'border-warning bg-warning/15';
}

const LEGEND = [
  ['border-success bg-success/15', `Known (${MASTERED_ACCURACY_PCT}%+)`],
  ['border-warning bg-warning/15', 'Getting there'],
  ['border-error bg-error/15', 'Needs work'],
  ['border-dashed border-base-300', 'Not tried yet']
];

function describe(n) {
  if (n.attempts === 0) return `${n.note}: not tried yet`;
  const time = n.medianResponseMs ? `, usually found in ${formatResponseTime(n.medianResponseMs)}` : '';
  return `${n.note}: ${n.accuracyPct}% of ${n.attempts} answer${n.attempts === 1 ? '' : 's'}${time}`;
}

/**
 * All twelve notes in chromatic order, so the grid also teaches where the sharps and flats fall.
 * Tapping a note starts a drill on it.
 */
export default function NoteMastery({ notes, onDrillNote }) {
  const knownCount = notes.filter(n => n.level === 'mastered').length;

  return (
    <div className="card bg-base-100 shadow-md p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h3 className="flex items-center gap-2 font-display font-bold uppercase tracking-[0.15em]">
          <Grid3x3 className="size-4 text-secondary" aria-hidden="true" />
          Note by note
        </h3>
        <span className="font-display tabular-nums text-sm opacity-80">{knownCount} of 12 known</span>
      </div>
      <p className="text-sm opacity-70 mb-4">
        Tap a note to drill it. A note counts as known after {MIN_ATTEMPTS_FOR_VERDICT} or more answers at {MASTERED_ACCURACY_PCT}% or better.
      </p>

      <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {notes.map(n => (
          <li key={n.pitchClass}>
            <button
              type="button"
              onClick={() => onDrillNote(n.pitchClass)}
              aria-label={`${describe(n)}. Drill ${n.note}.`}
              title={describe(n)}
              className={`w-full h-full rounded-field border-2 px-2 py-2.5 flex flex-col items-center text-center transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-primary ${tileTone(n)}`}
            >
              <span className="font-display font-extrabold text-2xl sm:text-3xl leading-none">{n.note}</span>
              <span className="font-display font-bold tabular-nums mt-1">
                {n.attempts > 0 ? `${n.accuracyPct}%` : '–'}
              </span>
              <span className="text-xs opacity-70 tabular-nums">
                {n.attempts > 0
                  ? `${n.attempts} tr${n.attempts === 1 ? 'y' : 'ies'}${n.medianResponseMs ? ` · ${formatResponseTime(n.medianResponseMs)}` : ''}`
                  : 'new'}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-xs opacity-80" aria-label="Colour key">
        {LEGEND.map(([tone, label]) => (
          <li key={label} className="flex items-center gap-1.5">
            <span className={`inline-block size-3 rounded-sm border-2 ${tone}`} aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
