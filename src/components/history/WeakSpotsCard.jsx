import React from 'react';
import { Crosshair } from 'lucide-react';
import { MIN_ATTEMPTS_FOR_VERDICT } from '../../lib/statsLogic';

/**
 * The notes you miss most, with a one-tap drill round on them.
 */
export default function WeakSpotsCard({ weakSpots, noteStats, onPractise }) {
  const tried = noteStats.filter(n => n.attempts >= MIN_ATTEMPTS_FOR_VERDICT);
  const allKnown = tried.length > 0 && tried.every(n => n.level === 'mastered');

  return (
    <div className="card bg-plate border shadow-md p-4 sm:p-5">
      <h3 className="flex items-center gap-2 font-display font-bold uppercase tracking-[0.15em] mb-3">
        <Crosshair className="size-4 text-secondary" aria-hidden="true" />
        Weak spots
      </h3>

      {weakSpots.length > 0 ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <ul className="flex flex-wrap gap-2 flex-1">
            {weakSpots.map(n => (
              <li key={n.pitchClass} className="flex items-baseline gap-2 rounded-field bg-base-100 border border-base-300 px-3 py-1.5">
                <span className="font-display font-extrabold text-2xl leading-none">{n.note}</span>
                <span className="text-sm tabular-nums opacity-80">{n.accuracyPct}% of {n.attempts}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onPractise(weakSpots.map(n => n.pitchClass))}
            className="btn btn-secondary btn-lg font-display uppercase tracking-widest"
          >
            <Crosshair className="size-5" /> Drill these notes
          </button>
        </div>
      ) : (
        <p className="text-sm opacity-80">
          {allKnown
            ? 'No weak spots right now. For a bigger challenge, add sharps and flats or widen the fret range in Settings.'
            : `Answer each note ${MIN_ATTEMPTS_FOR_VERDICT} or more times in pass / fail rounds and the notes you miss most will show up here.`}
        </p>
      )}
    </div>
  );
}
