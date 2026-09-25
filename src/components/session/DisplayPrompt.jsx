import React from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';

function Feedback({ result }) {
  if (!result) return <span className="h-8" aria-hidden="true" />;

  const detail = result.correct
    ? result.heard && `heard ${result.heard}`
    : result.heard
      ? `heard ${result.heard}${result.wrongOctave ? ', right note on the wrong string or octave' : `, wanted ${result.target}`}`
      : `wanted ${result.target}`;

  return (
    <span
      key={result.id}
      role="status"
      className={`badge badge-lg gap-1.5 font-display uppercase tracking-wide ${result.correct ? 'badge-success' : 'badge-error'}`}
    >
      {result.correct ? <Check className="size-4" /> : <X className="size-4" />}
      {result.correct ? 'Got it' : 'Missed'}
      {detail && <span className="normal-case tracking-normal font-sans font-medium opacity-90">· {detail}</span>}
    </span>
  );
}

export default function DisplayPrompt({
  prompt,
  sessionMode, // 'tracked' | 'flashcard'
  isWeakSpotRound = false,
  timeLeft,
  secondsPerNote,
  isRevealed,
  onRevealToggle,
  stats,
  lastResult
}) {
  if (!prompt) return null;

  const isLongName = prompt.note.length > 2;
  const showTimer = sessionMode === 'flashcard' && timeLeft !== null && timeLeft !== undefined;

  return (
    <section aria-live="polite" className="card bg-base-100 shadow-lg w-full max-w-3xl mx-auto p-2">
      <div className="rounded-[calc(var(--radius-box)-0.25rem)] border-4 border-double border-base-300 px-4 py-4 sm:px-8 sm:py-6 flex flex-col items-center text-center">
        {/* Round readout */}
        <div className="w-full flex items-center justify-between font-display text-xs sm:text-sm uppercase tracking-[0.2em]">
          <span className="opacity-70">{isWeakSpotRound ? 'Weak spots' : sessionMode === 'tracked' ? 'Pass / Fail' : 'Flashcards'}</span>
          {sessionMode === 'tracked' ? (
            <span className="flex items-center gap-3">
              {stats.currentStreak > 1 && <span className="badge badge-sm badge-secondary tracking-wider">Streak {stats.currentStreak}</span>}
              <span className="tabular-nums opacity-70">{stats.correctCount}/{stats.totalPrompts}</span>
            </span>
          ) : (
            showTimer && <span className="tabular-nums opacity-70">Next in {timeLeft}s</span>
          )}
        </div>

        {/* The prompt */}
        <div className="font-script text-3xl sm:text-4xl text-secondary -mb-4 sm:-mb-6 mt-1 select-none">find</div>
        <h2
          className={`font-display font-extrabold leading-none tracking-tight text-stamped ${
            isLongName ? 'text-[4.5rem] sm:text-[7.5rem]' : 'text-[7.5rem] sm:text-[11rem]'
          }`}
        >
          {prompt.note}
        </h2>
        <p className="font-display font-bold uppercase tracking-[0.12em] text-2xl sm:text-4xl -mt-1 sm:-mt-3">
          {prompt.promptText}
        </p>
        {prompt.subText && (
          <p className="mt-1 text-sm sm:text-base opacity-70">{prompt.subText}</p>
        )}

        {showTimer && (
          <progress
            className="progress progress-primary w-full max-w-sm mt-3"
            value={timeLeft}
            max={secondsPerNote}
            aria-label="Time left on this note"
          />
        )}

        {/* Feedback + reveal */}
        <div className="w-full mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Feedback result={lastResult} />
          <button type="button" onClick={onRevealToggle} className="btn btn-sm btn-ghost font-display uppercase tracking-wider">
            {isRevealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {isRevealed ? 'Hide answer' : 'Show on neck'}
          </button>
        </div>
      </div>
    </section>
  );
}
