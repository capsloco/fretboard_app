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

      <h2 className="text-3xl sm:text-4xl font-extrabold text-base-content">
        Practice Summary
      </h2>
      <p className="text-base-content/70 text-sm font-mono">
        {instrumentTitle} • {sessionType === 'tracked' ? 'Tracked Round' : 'Timed Flashcard'}
      </p>

      {/* Main Score Wheel / Accuracy Badge */}
      <div className="py-4 flex flex-col items-center justify-center">
        <div className="relative w-40 h-40 rounded-full bg-base-200 border-4 border-primary shadow-xl flex flex-col items-center justify-center">
          <span className="text-4xl sm:text-5xl font-black text-primary font-mono">
            {accuracyPct}%
          </span>
          <span className="text-xs font-mono text-base-content/70 uppercase tracking-widest mt-1">Accuracy</span>
        </div>
      </div>

      {/* Grid Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-base-200 border border-base-300 rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-base-content/70 text-xs font-mono mb-1">
            <Award className="w-3.5 h-3.5 text-primary" /> Prompts
          </div>
          <div className="text-xl font-bold text-base-content font-mono">{totalPrompts}</div>
        </div>

        <div className="bg-base-200 border border-success/30 rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-success text-xs font-mono mb-1">
            <CheckCircle className="w-3.5 h-3.5" /> Correct
          </div>
          <div className="text-xl font-bold text-success font-mono">{correctCount}</div>
        </div>

        <div className="bg-base-200 border border-error/30 rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-error text-xs font-mono mb-1">
            <XCircle className="w-3.5 h-3.5" /> Missed
          </div>
          <div className="text-xl font-bold text-error font-mono">{incorrectCount}</div>
        </div>

        <div className="bg-base-200 border border-warning/30 rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-warning text-xs font-mono mb-1">
            <Zap className="w-3.5 h-3.5" /> Streak
          </div>
          <div className="text-xl font-bold text-warning font-mono">{bestStreak} 🔥</div>
        </div>
      </div>

      {/* Practice Duration */}
      <div className="flex items-center justify-center gap-2 text-base-content/70 text-sm font-mono bg-base-200 py-2.5 rounded-xl border border-base-300">
        <Clock className="w-4 h-4 text-primary" />
        Total Time Practiced: <span className="text-base-content font-semibold">{formatDuration(durationSeconds)}</span>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={onRestart}
          className="btn btn-primary btn-lg flex-1 font-black uppercase tracking-wider gap-2 shadow-lg"
        >
          <RotateCcw className="w-4 h-4" /> Start Next Round
        </button>

        <button
          onClick={onOpenSettings}
          className="btn btn-ghost border border-base-300 btn-lg font-bold uppercase tracking-wider flex items-center justify-center gap-2 text-base-content hover:bg-base-200"
        >
          <Sliders className="w-4 h-4 text-primary" /> Configure Settings
        </button>
      </div>
    </div>
  );
}
