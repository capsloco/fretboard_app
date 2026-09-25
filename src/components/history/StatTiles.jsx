import React from 'react';
import { formatDuration } from '../../lib/formatters';

export default function StatTiles({ stats }) {
  const {
    totalSessions = 0,
    totalPracticeSeconds = 0,
    lifetimeAccuracyPct = 0,
    bestStreak = 0
  } = stats || {};

  const tiles = [
    ['Rounds', totalSessions],
    ['Accuracy', `${lifetimeAccuracyPct}%`],
    ['Practiced', formatDuration(totalPracticeSeconds)],
    ['Best streak', bestStreak]
  ];

  return (
    <div className="stats stats-vertical sm:stats-horizontal w-full bg-base-100 shadow-md">
      {tiles.map(([title, value]) => (
        <div key={title} className="stat place-items-center">
          <div className="stat-title font-display uppercase tracking-wider">{title}</div>
          <div className="stat-value font-display tabular-nums">{value}</div>
        </div>
      ))}
    </div>
  );
}
