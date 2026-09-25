import React from 'react';
import { formatDuration } from '../../lib/formatters';

export default function StatTiles({ stats, knownNotes = 0 }) {
  const {
    totalSessions = 0,
    totalPrompts = 0,
    totalPracticeSeconds = 0,
    lifetimeAccuracyPct = 0,
    bestStreak = 0,
    daysPractised = 0
  } = stats || {};

  const tiles = [
    ['Accuracy', totalPrompts > 0 ? `${lifetimeAccuracyPct}%` : '–', `${totalPrompts} answer${totalPrompts === 1 ? '' : 's'}`],
    ['Notes known', `${knownNotes}/12`, 'of all twelve'],
    ['Rounds', totalSessions, `on ${daysPractised} day${daysPractised === 1 ? '' : 's'}`],
    ['Practised', formatDuration(totalPracticeSeconds), 'in scored rounds'],
    ['Best streak', bestStreak, 'in a row']
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {tiles.map(([title, value, desc], i) => (
        <div key={title} className={`stat place-items-center card bg-base-100 shadow-md py-4 ${i === 0 ? 'col-span-2 md:col-span-1' : ''}`}>
          <div className="stat-title font-display uppercase tracking-wider">{title}</div>
          <div className="stat-value font-display tabular-nums text-3xl sm:text-4xl">{value}</div>
          <div className="stat-desc">{desc}</div>
        </div>
      ))}
    </div>
  );
}
