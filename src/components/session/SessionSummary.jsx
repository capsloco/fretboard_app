import React from 'react';
import { Trophy, CheckCircle, XCircle, Clock, Zap, RotateCcw, Sliders, Award } from 'lucide-react';

export default function SessionSummary({ stats, onRestart, onOpenSettings }) {
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

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="card bg-base-100 border border-base-300 shadow-2xl w-full max-w-xl mx-auto p-6 sm:p-8 text-center space-y-6 animate-fade-in">
      {/* Header Badge */}
      <div className="badge badge-primary badge-lg gap-2 font-mono text-xs uppercase tracking-widest mx-auto">
        <Trophy className="w-4 h-4" />
        Session Complete
      </div>

      <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
        Practice Summary
      </h2>
      <p className="text-slate-400 text-sm font-mono">
        {instrumentTitle} • {sessionType === 'tracked' ? 'Tracked Round' : 'Timed Flashcard'}
      </p>

      {/* Main Score Wheel / Accuracy Badge */}
      <div className="py-4 flex flex-col items-center justify-center">
        <div className="relative w-40 h-40 rounded-full bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 border-4 border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.3)] flex flex-col items-center justify-center">
          <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-300 font-mono">
            {accuracyPct}%
          </span>
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest mt-1">Accuracy</span>
        </div>
      </div>

      {/* Grid Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-mono mb-1">
            <Award className="w-3.5 h-3.5 text-cyan-400" /> Prompts
          </div>
          <div className="text-xl font-bold text-white font-mono">{totalPrompts}</div>
        </div>

        <div className="bg-slate-950/60 border border-emerald-900/40 rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-mono mb-1">
            <CheckCircle className="w-3.5 h-3.5" /> Correct
          </div>
          <div className="text-xl font-bold text-emerald-300 font-mono">{correctCount}</div>
        </div>

        <div className="bg-slate-950/60 border border-rose-900/40 rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-rose-400 text-xs font-mono mb-1">
            <XCircle className="w-3.5 h-3.5" /> Missed
          </div>
          <div className="text-xl font-bold text-rose-300 font-mono">{incorrectCount}</div>
        </div>

        <div className="bg-slate-950/60 border border-amber-900/40 rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-mono mb-1">
            <Zap className="w-3.5 h-3.5" /> Streak
          </div>
          <div className="text-xl font-bold text-amber-300 font-mono">{bestStreak} 🔥</div>
        </div>
      </div>

      {/* Practice Duration */}
      <div className="flex items-center justify-center gap-2 text-slate-400 text-sm font-mono bg-slate-950/40 py-2.5 rounded-xl border border-slate-800/50">
        <Clock className="w-4 h-4 text-cyan-400" />
        Total Time Practiced: <span className="text-white font-semibold">{formatDuration(durationSeconds)}</span>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={onRestart}
          className="flex-1 py-3.5 px-6 rounded-xl font-extrabold text-sm uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95"
        >
          <RotateCcw className="w-4 h-4" /> Start Next Round
        </button>

        <button
          onClick={onOpenSettings}
          className="py-3.5 px-6 rounded-xl font-bold text-sm uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center gap-2"
        >
          <Sliders className="w-4 h-4 text-slate-400" /> Configure Settings
        </button>
      </div>
    </div>
  );
}
