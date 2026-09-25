import React, { useState } from 'react';
import { History, Guitar, Clock, ChevronDown } from 'lucide-react';
import { formatDuration, formatDate } from '../../lib/formatters';

const PAGE_SIZE = 20;

const roundLabel = (s) => [
  s.sessionType === 'weak_spots' ? 'Weak spots' : null,
  s.promptType === 'string_specific' ? 'On a string' : 'Anywhere',
  s.minFret != null && s.maxFret != null ? `frets ${s.minFret}–${s.maxFret}` : null
].filter(Boolean).join(' • ');

export default function SessionHistoryList({ sessions }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = sessions.slice(0, visibleCount);

  return (
    <div className="card bg-base-100 shadow-md p-4 sm:p-5">
      <h3 className="flex items-center gap-2 font-display font-bold uppercase tracking-[0.15em] mb-4">
        <History className="size-4 text-secondary" aria-hidden="true" />
        Session History
      </h3>

      {sessions.length === 0 ? (
        <div className="h-24 flex items-center justify-center text-sm opacity-70 text-center px-4">
          No rounds yet. Finish a pass / fail round to see it here.
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 bg-base-200 rounded-field px-3 py-2.5 text-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Guitar className="size-4 opacity-60 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <div className="font-bold text-base-content truncate">{s.instrumentName}</div>
                  <div className="text-xs opacity-70">
                    {formatDate(s.createdAt)} • {roundLabel(s)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-1 text-xs opacity-70 tabular-nums">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDuration(s.durationSeconds)}
                </div>
                <div className={`badge font-display font-bold ${s.accuracyPct >= 80 ? 'badge-success' : s.accuracyPct >= 50 ? 'badge-warning' : 'badge-error'}`}>
                  {Math.round(s.accuracyPct)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sessions.length > visibleCount && (
        <button
          type="button"
          onClick={() => setVisibleCount(count => count + PAGE_SIZE)}
          className="btn btn-sm w-full mt-3"
        >
          Show more <ChevronDown className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
