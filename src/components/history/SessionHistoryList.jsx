import React from 'react';
import { History, Guitar, Clock, ChevronDown } from 'lucide-react';
import { formatDuration, formatDate } from '../../lib/formatters';

export default function SessionHistoryList({ sessions, hasMore, onLoadMore, loading }) {
  return (
    <div className="bg-base-100 border border-base-300 rounded-2xl p-4 sm:p-5 shadow-md">
      <div className="flex items-center gap-2 font-bold text-base-content mb-4">
        <History className="w-4 h-4 text-primary" />
        Session History
      </div>

      {sessions.length === 0 ? (
        <div className="h-24 flex items-center justify-center text-base-content/90 text-sm font-mono">
          No sessions yet — start a tracked practice round!
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 bg-base-200 border border-base-300 rounded-xl px-3 py-2.5 text-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Guitar className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-base-content truncate">{s.instrumentName}</div>
                  <div className="text-xs text-base-content/90 font-mono">
                    {formatDate(s.createdAt)} • {s.promptType === 'string_specific' ? 'String-Specific' : 'Global'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-1 text-base-content/90 text-xs font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDuration(s.durationSeconds)}
                </div>
                <div className={`badge font-mono font-bold ${s.accuracyPct >= 80 ? 'badge-success' : s.accuracyPct >= 50 ? 'badge-warning' : 'badge-error'}`}>
                  {s.accuracyPct}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={loading}
          className="btn btn-ghost btn-sm border border-base-300 w-full mt-3 font-bold gap-1.5"
        >
          {loading ? 'Loading...' : 'Load More'} <ChevronDown className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
