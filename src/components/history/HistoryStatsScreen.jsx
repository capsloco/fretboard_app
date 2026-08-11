import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, LineChart } from 'lucide-react';
import SignInGate from './SignInGate';
import StatTiles from './StatTiles';
import AccuracyChart from './AccuracyChart';
import SessionHistoryList from './SessionHistoryList';
import WeakNotesBreakdown from './WeakNotesBreakdown';
import { getLifetimeStats, getAccuracyOverTime, getWeakNotes, getSessionHistory } from '../../lib/supabase';
import { groupWeakNotes } from '../../lib/statsLogic';

const PAGE_SIZE = 20;

export default function HistoryStatsScreen({ user, onBack, onOpenAuth }) {
  const [loading, setLoading] = useState(true);
  const [lifetimeStats, setLifetimeStats] = useState(null);
  const [accuracySessions, setAccuracySessions] = useState([]);
  const [weakNotes, setWeakNotes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const [lifetime, accuracyRows, weakNoteRows, historyPage] = await Promise.all([
        getLifetimeStats(user.id),
        getAccuracyOverTime(user.id),
        getWeakNotes(user.id),
        getSessionHistory(user.id, { page: 0, pageSize: PAGE_SIZE })
      ]);

      if (cancelled) return;
      setLifetimeStats(lifetime);
      setAccuracySessions(accuracyRows);
      setWeakNotes(groupWeakNotes(weakNoteRows));
      setSessions(historyPage.sessions);
      setHasMore(historyPage.hasMore);
      setPage(0);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user]);

  const loadMore = useCallback(async () => {
    if (!user || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const result = await getSessionHistory(user.id, { page: nextPage, pageSize: PAGE_SIZE });
    setSessions((prev) => [...prev, ...result.sessions]);
    setHasMore(result.hasMore);
    setPage(nextPage);
    setLoadingMore(false);
  }, [user, page, loadingMore]);

  if (!user) {
    return <SignInGate onOpenAuth={onOpenAuth} onBack={onBack} />;
  }

  return (
    <div className="flex-1 flex flex-col gap-4 py-2">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="btn btn-ghost btn-sm gap-1.5 font-bold text-base-content hover:bg-base-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2 font-black text-lg text-base-content">
          <LineChart className="w-5 h-5 text-primary" />
          History &amp; Stats
        </div>
        <div className="w-16" />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          <StatTiles stats={lifetimeStats} />
          <AccuracyChart sessions={accuracySessions} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <SessionHistoryList
              sessions={sessions}
              hasMore={hasMore}
              onLoadMore={loadMore}
              loading={loadingMore}
            />
            <WeakNotesBreakdown notes={weakNotes} />
          </div>
        </div>
      )}
    </div>
  );
}
