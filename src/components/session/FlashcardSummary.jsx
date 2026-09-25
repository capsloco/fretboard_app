import React from 'react';
import { RotateCcw, SlidersHorizontal, Crosshair } from 'lucide-react';
import { formatDuration, formatResponseTime } from '../../lib/formatters';
import { summarizeFlashcardRound, MAX_FOCUS_NOTES } from '../../lib/statsLogic';

// Bar segments and stat tiles share these colours; the counts carry the same meaning in text
const OUTCOMES = [
  { key: 'clean', title: 'First try', desc: 'right note, no help', bar: 'bg-success', text: 'text-success' },
  { key: 'slipped', title: 'After a slip', desc: 'wrong note or a peek first', bar: 'bg-warning', text: 'text-warning' },
  { key: 'missed', title: 'Missed', desc: 'time ran out or skipped', bar: 'bg-error', text: 'text-error' }
];

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
const times = (count, text) => (count === 1 ? text : `${text} ${count} times`);

/** One line on what happened to a note this round, e.g. "Found 1 of 3 · time ran out 2 times · heard A2" */
function describeNote({ shown, missed, timedOut, peeked, heard }) {
  const parts = [
    missed === shown
      ? (shown === 1 ? 'Missed' : `Missed all ${shown}`)
      : `Found ${shown - missed} of ${shown}`
  ];
  if (timedOut > 0) parts.push(times(timedOut, 'time ran out'));
  if (missed > timedOut) parts.push(times(missed - timedOut, 'skipped'));
  if (heard.length > 0) parts.push(`heard ${heard.join(', ')}`);
  if (peeked > 0) parts.push(peeked === 1 ? 'peeked once' : `peeked ${peeked} times`);
  return parts.join(' · ');
}

function verdictFor({ cards, slipped, missed }) {
  if (cards === 0) return 'No cards finished this round.';
  if (missed === 0 && slipped === 0) return 'Every card, first try.';
  if (missed === 0) return 'Every card found.';
  return `${missed} got away.`;
}

/**
 * End of a flashcard round. Nothing here is saved, but every card counts on screen:
 * a card that runs out of time is a miss, and one found after a wrong note or a peek is a slip.
 */
export default function FlashcardSummary({
  attempts = [],
  durationSeconds = 0,
  instrumentTitle = '',
  onRestart,
  onPractiseNotes,
  onOpenSettings
}) {
  const recap = summarizeFlashcardRound(attempts);
  const { cards, found, avgFindMs, toWorkOn, solid } = recap;
  const breakdown = OUTCOMES.map(o => `${recap[o.key]} ${o.title.toLowerCase()}`).join(', ');

  return (
    <section className="card bg-base-100 shadow-lg w-full max-w-2xl mx-auto p-2">
      <div className="rounded-[calc(var(--radius-box)-0.25rem)] border-4 border-double border-base-300 p-5 sm:p-8 flex flex-col items-center text-center gap-6">
        <header>
          <p className="font-display uppercase tracking-[0.25em] text-xs sm:text-sm opacity-70">
            {instrumentTitle} · Flashcards · {formatDuration(durationSeconds)}
          </p>
          <h2 className="font-display font-extrabold uppercase tracking-wide text-4xl sm:text-5xl mt-1">Round complete</h2>
        </header>

        {cards > 0 && (
          <div>
            <p className="font-display font-extrabold tabular-nums leading-none text-6xl sm:text-7xl">
              {found}<span className="text-3xl sm:text-4xl opacity-60"> of {cards}</span>
            </p>
            <p className="font-display uppercase tracking-widest text-xs opacity-70 mt-2">
              Notes found{avgFindMs ? ` · ${formatResponseTime(avgFindMs)} each on average` : ''}
            </p>
          </div>
        )}
        <p className="font-script text-2xl sm:text-3xl text-secondary -mt-2">{verdictFor(recap)}</p>

        {cards > 0 && (
          <div className="w-full flex flex-col gap-3">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-base-200" role="img" aria-label={breakdown}>
              {OUTCOMES.map(o => recap[o.key] > 0 && (
                <span key={o.key} className={o.bar} style={{ width: `${(recap[o.key] / cards) * 100}%` }} />
              ))}
            </div>

            <div className="stats stats-vertical sm:stats-horizontal w-full bg-base-200 shadow-none">
              {OUTCOMES.map(o => (
                <div key={o.key} className="stat place-items-center">
                  <div className="stat-title font-display uppercase tracking-wider flex items-center gap-1.5">
                    <span className={`inline-block size-2.5 rounded-full ${o.bar}`} aria-hidden="true" />
                    {o.title}
                  </div>
                  <div className={`stat-value font-display tabular-nums ${o.text}`}>{recap[o.key]}</div>
                  <div className="stat-desc">{o.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {toWorkOn.length > 0 && (
          <div className="w-full text-left">
            <h3 className="font-display font-bold uppercase tracking-[0.2em] text-sm mb-2">Notes to work on</h3>
            <ul className="divide-y divide-base-300 border-y border-base-300">
              {toWorkOn.map(n => (
                <li key={n.pitchClass} className="flex items-center gap-4 py-2">
                  <span className="font-display font-extrabold text-3xl w-16 shrink-0">{n.note}</span>
                  <span className="flex-1 text-sm opacity-80">{describeNote(n)}</span>
                  <span className="flex flex-col sm:flex-row items-end gap-1">
                    {n.missed > 0 && (
                      <span className="badge badge-error badge-soft font-display tabular-nums">{n.missed} missed</span>
                    )}
                    {n.slipped > 0 && (
                      <span className="badge badge-warning badge-soft font-display tabular-nums">{plural(n.slipped, 'slip')}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {solid.length > 0 && (
          <div className="w-full text-left">
            <h3 className="font-display font-bold uppercase tracking-[0.2em] text-sm mb-2">First try every time</h3>
            <ul className="flex flex-wrap gap-2">
              {solid.map(n => (
                <li key={n.pitchClass} className="badge badge-success badge-soft badge-lg font-display font-bold">{n.note}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-sm opacity-70">Flashcard rounds aren’t saved to your stats. Play a pass / fail round to track your progress.</p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {toWorkOn.length > 0 && onPractiseNotes && (
            <button
              type="button"
              onClick={() => onPractiseNotes(toWorkOn.slice(0, MAX_FOCUS_NOTES).map(n => n.pitchClass))}
              className="btn btn-secondary btn-lg flex-1 font-display uppercase tracking-widest"
            >
              <Crosshair className="size-5" /> Drill {toWorkOn.length === 1 ? 'this note' : 'these notes'}
            </button>
          )}
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
