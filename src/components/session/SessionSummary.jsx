import React from 'react';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { formatDuration } from '../../lib/formatters';

/** Missed notes for this round, most-missed first, with what the mic heard instead */
function summarizeMisses(attempts) {
  const byNote = new Map();
  attempts.filter(a => !a.isCorrect).forEach((a) => {
    const entry = byNote.get(a.targetNote) ?? { note: a.targetNote, misses: 0, heard: new Set() };
    entry.misses += 1;
    if (a.detectedNote) entry.heard.add(`${a.detectedNote}${a.detectedOctave}`);
    byNote.set(a.targetNote, entry);
  });
  return [...byNote.values()].sort((a, b) => b.misses - a.misses);
}

export default function SessionSummary({ stats, attempts = [], onRestart, onOpenSettings }) {
  const {
    totalPrompts = 0,
    correctCount = 0,
    incorrectCount = 0,
    accuracyPct = 0,
    durationSeconds = 0,
    bestStreak = 0,
    instrumentTitle = '',
    sessionType = 'tracked'
  } = stats || {};

  const misses = summarizeMisses(attempts);
  const verdict = totalPrompts === 0
    ? 'No notes answered this round.'
    : accuracyPct >= 90
      ? 'Stage ready.'
      : accuracyPct >= 70
        ? 'Getting there. Keep the streak going.'
        : 'Slow down and say each note out loud as you find it.';

  return (
    <section className="card bg-base-100 shadow-lg w-full max-w-2xl mx-auto p-2">
      <div className="rounded-[calc(var(--radius-box)-0.25rem)] border-4 border-double border-base-300 p-5 sm:p-8 flex flex-col items-center text-center gap-6">
        <header>
          <p className="font-display uppercase tracking-[0.25em] text-xs sm:text-sm opacity-70">
            {instrumentTitle} · {sessionType === 'tracked' ? 'Pass / fail' : 'Flashcards'}
          </p>
          <h2 className="font-display font-extrabold uppercase tracking-wide text-4xl sm:text-5xl mt-1">Round complete</h2>
        </header>

        <div
          className="radial-progress text-primary bg-base-200 border-4 border-base-200"
          style={{ '--value': accuracyPct, '--size': '10rem', '--thickness': '0.75rem' }}
          role="progressbar"
          aria-valuenow={accuracyPct}
          aria-label="Accuracy"
        >
          <span className="flex flex-col items-center text-base-content">
            <span className="font-display font-extrabold text-5xl tabular-nums leading-none">{accuracyPct}%</span>
            <span className="font-display uppercase tracking-widest text-xs opacity-70 mt-1">Accuracy</span>
          </span>
        </div>
        <p className="font-script text-2xl sm:text-3xl text-secondary -mt-2">{verdict}</p>

        <div className="stats stats-vertical sm:stats-horizontal w-full bg-base-200 shadow-none">
          <div className="stat place-items-center">
            <div className="stat-title font-display uppercase tracking-wider">Correct</div>
            <div className="stat-value font-display text-success tabular-nums">{correctCount}</div>
          </div>
          <div className="stat place-items-center">
            <div className="stat-title font-display uppercase tracking-wider">Missed</div>
            <div className="stat-value font-display text-error tabular-nums">{incorrectCount}</div>
          </div>
          <div className="stat place-items-center">
            <div className="stat-title font-display uppercase tracking-wider">Best streak</div>
            <div className="stat-value font-display tabular-nums">{bestStreak}</div>
          </div>
          <div className="stat place-items-center">
            <div className="stat-title font-display uppercase tracking-wider">Time</div>
            <div className="stat-value font-display tabular-nums text-3xl">{formatDuration(durationSeconds)}</div>
          </div>
        </div>

        {misses.length > 0 && (
          <div className="w-full text-left">
            <h3 className="font-display font-bold uppercase tracking-[0.2em] text-sm mb-2">Notes to work on</h3>
            <ul className="divide-y divide-base-300 border-y border-base-300">
              {misses.map(({ note, misses: count, heard }) => (
                <li key={note} className="flex items-center gap-4 py-2">
                  <span className="font-display font-extrabold text-3xl w-16">{note}</span>
                  <span className="flex-1 text-sm opacity-80">
                    {heard.size > 0 ? `Heard ${[...heard].join(', ')}` : 'Marked missed'}
                  </span>
                  <span className="badge badge-error badge-soft font-display tabular-nums">
                    {count} miss{count === 1 ? '' : 'es'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button type="button" onClick={onRestart} className="btn btn-primary btn-lg flex-1 font-display uppercase tracking-widest">
            <RotateCcw className="size-5" /> Play again
          </button>
          <button type="button" onClick={onOpenSettings} className="btn btn-lg font-display uppercase tracking-widest">
            <SlidersHorizontal className="size-5" /> Settings
          </button>
        </div>
      </div>
    </section>
  );
}
