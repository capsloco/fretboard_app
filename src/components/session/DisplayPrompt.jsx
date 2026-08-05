import React from 'react';
import { Mic, Volume2, Sparkles, Clock, Target } from 'lucide-react';

export default function DisplayPrompt({
  prompt,
  sessionMode, // 'tracked' | 'flashcard'
  timeLeft, // Countdown for prompt or overall flashcard time
  isRevealed,
  onRevealToggle,
  listening,
  streak = 0
}) {
  if (!prompt) return null;

  return (
    <div className="w-full flex flex-col items-center justify-center py-2 sm:py-6 px-2 sm:px-4">
      {/* Top Banner: Mode badge & Streak */}
      <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap justify-center">
        <span className="badge badge-neutral badge-lg gap-1.5 font-bold uppercase tracking-wider text-xs shadow-sm">
          <Target className="w-3.5 h-3.5 text-primary" />
          {sessionMode === 'tracked' ? 'Pass / Fail' : 'Flashcard'}
        </span>

        {sessionMode === 'tracked' && streak > 0 && (
          <span className="badge badge-warning badge-lg gap-1.5 font-extrabold text-xs shadow-md animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            STREAK: {streak} 🔥
          </span>
        )}

        {/* Voice Listening Badge */}
        {listening && (
          <span className="badge badge-success badge-lg gap-1.5 font-bold text-xs shadow-md animate-pulse">
            <Mic className="w-3.5 h-3.5" />
            Voice Active
          </span>
        )}
      </div>

      {/* Primary Massive Card Display for 4-6 ft viewing distance */}
      <div className="card bg-base-100 border-2 border-base-300 shadow-2xl w-full max-w-2xl text-center backdrop-blur-xl overflow-hidden p-6 sm:p-10">
        <div className="card-body items-center p-0">
          {/* Time Progress Bar / Timer */}
          {timeLeft !== null && timeLeft !== undefined && (
            <div className="badge badge-neutral badge-xl font-mono gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Next Prompt:</span>
              <span className="text-primary font-black">{timeLeft}s</span>
            </div>
          )}

          {/* Prompt Header */}
          <div className="font-mono text-xs sm:text-sm font-semibold tracking-widest uppercase text-base-content/60 mt-1">
            {prompt.promptType === 'string_specific' ? 'String Specific Prompt' : 'Global Note Prompt'}
          </div>

          {/* Massive Target Note Banner */}
          <div className="relative my-2 select-none">
            <h1 className="text-6xl sm:text-9xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-base-content via-base-content/90 to-primary drop-shadow-md">
              {prompt.note}
            </h1>
          </div>

          {/* Prompt Instructional Subtitle */}
          <p className="text-xl sm:text-4xl font-black text-primary tracking-wide">
            {prompt.promptText}
          </p>

          {prompt.subText && (
            <p className="text-base-content/70 text-xs sm:text-base font-mono mt-1">
              {prompt.subText}
            </p>
          )}

          {/* Answer Reveal Button / State */}
          <div className="card-actions justify-center mt-6">
            <button
              onClick={onRevealToggle}
              className={`btn ${isRevealed ? 'btn-neutral btn-outline' : 'btn-primary'} btn-md sm:btn-lg font-extrabold uppercase tracking-wider shadow-lg`}
            >
              {isRevealed ? 'Hide Answer on Neck' : 'Reveal Answer on Neck'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
