import React, { useMemo } from 'react';
import { ArrowLeft, LogIn, Trash2, AlertTriangle } from 'lucide-react';
import StatTiles from './StatTiles';
import WeakSpotsCard from './WeakSpotsCard';
import NoteMastery from './NoteMastery';
import StringBreakdown from './StringBreakdown';
import AccuracyChart from './AccuracyChart';
import SessionHistoryList from './SessionHistoryList';
import { summarizeSessions, buildStringStats } from '../../lib/statsLogic';
import { isSupabaseConfigured } from '../../lib/supabase';

/** Where these stats live, and (on a device) the way to keep them or wipe them */
function SourceBar({ user, onOpenAuth, onClear, hasHistory }) {
  if (user) {
    return <p className="text-sm opacity-70 text-center">Saved to your account, on every device you sign in on.</p>;
  }
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-x-4 gap-y-2 text-sm text-center">
      <span className="opacity-80">Saved on this device only.</span>
      {isSupabaseConfigured && (
        <button type="button" onClick={onOpenAuth} className="btn btn-xs btn-ghost font-display uppercase tracking-wider">
          <LogIn className="size-3.5" /> Sign in to save rounds to an account
        </button>
      )}
      {hasHistory && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Delete every round saved on this device? This can’t be undone.')) onClear();
          }}
          className="btn btn-xs btn-ghost font-display uppercase tracking-wider"
        >
          <Trash2 className="size-3.5" /> Clear device stats
        </button>
      )}
    </div>
  );
}

export default function HistoryStatsScreen({
  user,
  history,
  loading,
  noteStats,
  weakSpots,
  onPractiseWeakSpots,
  onClearDeviceHistory,
  onBack,
  onOpenAuth
}) {
  const { sessions, attempts, failed } = history;
  const lifetime = useMemo(() => summarizeSessions(sessions), [sessions]);
  const stringStats = useMemo(() => buildStringStats(attempts), [attempts]);
  const knownNotes = noteStats.filter(n => n.level === 'mastered').length;

  return (
    <div className="flex-1 flex flex-col gap-4 py-2">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="btn btn-ghost btn-sm font-display uppercase tracking-wider">
          <ArrowLeft className="size-4" /> Back
        </button>
        <h2 className="font-display font-extrabold uppercase tracking-[0.15em] text-2xl sm:text-3xl">Your progress</h2>
        <div className="w-20" />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-16">
          <span className="loading loading-dots loading-lg" aria-label="Loading stats" />
        </div>
      ) : (
        <div className="space-y-4">
          {failed && (
            <div role="alert" className="alert alert-warning">
              <AlertTriangle className="size-5" />
              <span>Some of your stats couldn’t be loaded. Check your connection and open this page again.</span>
            </div>
          )}

          <SourceBar user={user} onOpenAuth={onOpenAuth} onClear={onClearDeviceHistory} hasHistory={sessions.length > 0} />

          <StatTiles stats={lifetime} knownNotes={knownNotes} />
          <WeakSpotsCard weakSpots={weakSpots} noteStats={noteStats} onPractise={onPractiseWeakSpots} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <NoteMastery notes={noteStats} onDrillNote={(pitchClass) => onPractiseWeakSpots([pitchClass])} />
            <div className="space-y-4">
              <AccuracyChart sessions={sessions} />
              <StringBreakdown strings={stringStats} />
            </div>
          </div>

          <SessionHistoryList sessions={sessions} />
        </div>
      )}
    </div>
  );
}
