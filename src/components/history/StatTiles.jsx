import React from 'react';
import { Award, Target, Clock, Zap } from 'lucide-react';
import { formatDuration } from '../../lib/formatters';

export default function StatTiles({ stats }) {
  const {
    totalSessions = 0,
    totalPracticeSeconds = 0,
    lifetimeAccuracyPct = 0,
    bestStreak = 0
  } = stats || {};

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-base-100 border border-base-300 rounded-2xl p-3 text-center shadow-sm">
        <div className="flex items-center justify-center gap-1 text-base-content/90 text-xs font-mono mb-1">
          <Award className="w-3.5 h-3.5 text-primary" /> Sessions
        </div>
        <div className="text-xl font-bold text-base-content font-mono">{totalSessions}</div>
      </div>

      <div className="bg-base-100 border border-base-300 rounded-2xl p-3 text-center shadow-sm">
        <div className="flex items-center justify-center gap-1 text-base-content/90 text-xs font-mono mb-1">
          <Target className="w-3.5 h-3.5 text-success" /> Accuracy
        </div>
        <div className="text-xl font-bold text-base-content font-mono">{lifetimeAccuracyPct}%</div>
      </div>

      <div className="bg-base-100 border border-base-300 rounded-2xl p-3 text-center shadow-sm">
        <div className="flex items-center justify-center gap-1 text-base-content/90 text-xs font-mono mb-1">
          <Clock className="w-3.5 h-3.5 text-primary" /> Practiced
        </div>
        <div className="text-xl font-bold text-base-content font-mono">{formatDuration(totalPracticeSeconds)}</div>
      </div>

      <div className="bg-base-100 border border-base-300 rounded-2xl p-3 text-center shadow-sm">
        <div className="flex items-center justify-center gap-1 text-base-content/90 text-xs font-mono mb-1">
          <Zap className="w-3.5 h-3.5 text-warning" /> Best Streak
        </div>
        <div className="text-xl font-bold text-base-content font-mono">{bestStreak} 🔥</div>
      </div>
    </div>
  );
}
