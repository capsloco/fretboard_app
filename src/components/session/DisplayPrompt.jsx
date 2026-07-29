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
      <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-4 flex-wrap justify-center">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide uppercase bg-slate-800/90 text-cyan-400 border border-slate-700/80 shadow-sm">
          <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          {sessionMode === 'tracked' ? 'Pass / Fail' : 'Flashcard'}
        </span>

        {sessionMode === 'tracked' && streak > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-extrabold bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 animate-spin-slow" />
            STREAK: {streak} 🔥
          </span>
        )}

        {/* Voice Listening Badge */}
        {listening && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse">
            <Mic className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
            Voice Active
          </span>
        )}
      </div>

      {/* Primary Massive Card Display for 4-6 ft viewing distance */}
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-slate-700/80 rounded-3xl p-4 sm:p-10 text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden">
        {/* Glow backdrop effect */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-cyan-500/15 blur-3xl rounded-full pointer-events-none" />

        {/* Time Progress Bar / Timer */}
        {timeLeft !== null && timeLeft !== undefined && (
          <div className="mb-3 sm:mb-6 flex items-center justify-center gap-2 text-slate-400 font-mono text-sm sm:text-lg">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            <span>Next Prompt in:</span>
            <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/50">
              {timeLeft}s
            </span>
          </div>
        )}

        {/* Prompt Header */}
        <div className="text-slate-400 font-mono text-xs sm:text-base font-medium tracking-widest uppercase mb-1 sm:mb-2">
          {prompt.promptType === 'string_specific' ? 'String Specific Prompt' : 'Global Note Prompt'}
        </div>

        {/* Massive Target Note Banner */}
        <div className="relative my-1 sm:my-2 select-none">
          <h1 className="text-5xl sm:text-9xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-cyan-200 drop-shadow-[0_10px_25px_rgba(6,182,212,0.4)]">
            {prompt.note}
          </h1>
        </div>

        {/* Prompt Instructional Subtitle */}
        <p className="text-lg sm:text-4xl font-extrabold text-cyan-400 mt-1 sm:mt-2 tracking-wide">
          {prompt.promptText}
        </p>

        {prompt.subText && (
          <p className="text-slate-400 text-xs sm:text-base font-mono mt-1 sm:mt-3">
            {prompt.subText}
          </p>
        )}

        {/* Answer Reveal Button / State */}
        <div className="mt-3 sm:mt-8">
          <button
            onClick={onRevealToggle}
            className={`px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 shadow-lg cursor-pointer ${
              isRevealed
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 hover:bg-slate-700'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 active:scale-95'
            }`}
          >
            {isRevealed ? 'Hide Answer on Neck' : 'Reveal Answer on Neck'}
          </button>
        </div>
      </div>
    </div>
  );
}
