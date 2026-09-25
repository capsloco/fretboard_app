import React from 'react';
import { AlignJustify } from 'lucide-react';

const progressTone = ({ level, accuracyPct }) =>
  level === 'mastered' ? 'progress-success' : accuracyPct < 50 ? 'progress-error' : 'progress-warning';

/**
 * Accuracy per string, from "find C on the A string" prompts.
 */
export default function StringBreakdown({ strings }) {
  return (
    <div className="card bg-base-100 shadow-md p-4 sm:p-5">
      <h3 className="flex items-center gap-2 font-display font-bold uppercase tracking-[0.15em] mb-4">
        <AlignJustify className="size-4 text-secondary" aria-hidden="true" />
        String by string
      </h3>

      {strings.length === 0 ? (
        <p className="h-24 flex items-center justify-center text-sm opacity-70 text-center px-4">
          Play a round with “On a string” prompts to see which strings you know best.
        </p>
      ) : (
        <ul className="space-y-3">
          {strings.map(s => (
            <li key={s.key} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 text-sm">
              <span className="font-display font-bold uppercase tracking-wider">
                <span className="opacity-60 tabular-nums">{s.stringNumber}</span> {s.openNote} string
              </span>
              <progress
                className={`progress ${progressTone(s)} h-3`}
                value={s.accuracyPct}
                max="100"
                aria-label={`String ${s.stringNumber} (${s.openNote}) accuracy`}
              />
              <span className="tabular-nums text-right w-24">
                <strong className="font-display">{s.accuracyPct}%</strong>
                <span className="opacity-70"> of {s.attempts}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
