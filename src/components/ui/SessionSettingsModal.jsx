import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Sliders, Music, ToggleLeft, ToggleRight, Clock, Target, HelpCircle } from 'lucide-react';
import InstrumentBuilder from '../settings/InstrumentBuilder';
import FretRangeSlider from './FretRangeSlider';

export default function SessionSettingsModal({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  currentInstrument,
  onSelectInstrument,
  userCustomInstruments,
  onInstrumentSaved,
  onStartSession
}) {
  const [activeTab, setActiveTab] = useState('session'); // 'session' | 'instrument'

  if (!isOpen) return null;

  // Calculate estimated notes for flashcard mode
  const flashcardTotalNotes = Math.floor(
    (config.flashcardDurationMins * 60) / config.flashcardSecondsPerNote
  );

  return createPortal(
    <div
      className="modal modal-open bg-base-900/80 backdrop-blur-md z-[100]"
      onClick={onClose}
    >
      <div
        className="modal-box bg-base-100 border border-base-300 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200 bg-base-200/50">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-base-content">Practice Session Settings</h2>
          </div>

          <button
            onClick={onClose}
            className="btn btn-sm btn-ghost btn-circle font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('session')}
            className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'session'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="w-4 h-4" /> Session & Mechanics
          </button>
          <button
            onClick={() => setActiveTab('instrument')}
            className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'instrument'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-4 h-4" /> Instrument Setup
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'session' ? (
            <>
              {/* Section 1: Session Mode */}
              <div className="space-y-3">
                <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Select Game / Practice Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => onChangeConfig('sessionMode', 'tracked')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      config.sessionMode === 'tracked'
                        ? 'bg-cyan-950/60 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-white text-sm mb-1 flex items-center justify-between">
                      Pass / Fail Mode (Tracked)
                    </div>
                    <p className="text-xs text-slate-400">
                      Prompt ➔ Countdown ➔ Reveal. Log results via Voice or Buttons. Tracks round accuracy %, speed & streak.
                    </p>
                  </div>

                  <div
                    onClick={() => onChangeConfig('sessionMode', 'flashcard')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      config.sessionMode === 'flashcard'
                        ? 'bg-cyan-950/60 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-white text-sm mb-1">
                      Timed Flashcard (No Tracking)
                    </div>
                    <p className="text-xs text-slate-400">
                      Continuous hands-free loop. Displays notes automatically based on your custom interval timer.
                    </p>
                  </div>
                </div>
              </div>

              {/* Flashcard Settings if Flashcard mode active */}
              {config.sessionMode === 'flashcard' && (
                <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Flashcard Loop Parameters
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-mono text-slate-400 block mb-1">
                        Seconds Per Note ({config.flashcardSecondsPerNote}s)
                      </span>
                      <input
                        type="range"
                        min="2"
                        max="10"
                        value={config.flashcardSecondsPerNote}
                        onChange={(e) => onChangeConfig('flashcardSecondsPerNote', parseInt(e.target.value, 10))}
                        className="w-full accent-cyan-500"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-mono text-slate-400 block mb-1">
                        Duration ({config.flashcardDurationMins} mins)
                      </span>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        value={config.flashcardDurationMins}
                        onChange={(e) => onChangeConfig('flashcardDurationMins', parseInt(e.target.value, 10))}
                        className="w-full accent-cyan-500"
                      />
                    </div>
                  </div>
                  {/* Stats calculation display requirement from PRD */}
                  <div className="text-center font-mono text-xs text-cyan-300 bg-slate-950/80 py-2 rounded-xl border border-cyan-900/40">
                    Practicing ~<span className="font-extrabold text-white">{flashcardTotalNotes} notes</span> over {config.flashcardDurationMins} minute{config.flashcardDurationMins === 1 ? '' : 's'}.
                  </div>
                </div>
              )}

              {/* Section 2: Prompt Type */}
              <div className="space-y-3">
                <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Prompt Scope
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => onChangeConfig('promptType', 'global')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold font-mono transition-all ${
                      config.promptType === 'global'
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    Global Note (e.g. "Find C")
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeConfig('promptType', 'string_specific')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold font-mono transition-all ${
                      config.promptType === 'string_specific'
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    String Specific (e.g. "Find C on A string")
                  </button>
                </div>
              </div>

              {/* Section 3: Accidentals Toggle & Notation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-xs uppercase font-mono">Include Sharps and Flats</div>
                    <div className="text-[11px] text-slate-400">
                      {config.includeAccidentals ? 'Sharps & Flats included' : 'Naturals Only (A-G)'}
                    </div>
                  </div>
                  <button
                    onClick={() => onChangeConfig('includeAccidentals', !config.includeAccidentals)}
                    className="p-1 rounded-full text-cyan-400 transition-colors"
                  >
                    {config.includeAccidentals ? (
                      <ToggleRight className="w-8 h-8 text-cyan-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-600" />
                    )}
                  </button>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-2">
                  <div>
                    <div className="font-bold text-white text-xs uppercase font-mono">Note Display</div>
                    <div className="text-[11px] text-slate-400">
                      {(config.noteDisplay || (config.useFlats ? 'flats' : 'sharps')) === 'flats'
                        ? 'Display Flats (♭)'
                        : (config.noteDisplay || (config.useFlats ? 'flats' : 'sharps')) === 'both'
                        ? 'Display Sharps & Flats'
                        : 'Display Sharps (♯)'}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => onChangeConfig('noteDisplay', 'sharps')}
                      className={`py-1.5 px-1 sm:px-2 rounded-lg text-xs font-bold font-mono transition-all text-center ${
                        (config.noteDisplay || (config.useFlats ? 'flats' : 'sharps')) === 'sharps'
                          ? 'bg-cyan-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      # Sharps
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeConfig('noteDisplay', 'both')}
                      className={`py-1.5 px-1 sm:px-2 rounded-lg text-xs font-bold font-mono transition-all text-center ${
                        config.noteDisplay === 'both'
                          ? 'bg-cyan-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Both
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeConfig('noteDisplay', 'flats')}
                      className={`py-1.5 px-1 sm:px-2 rounded-lg text-xs font-bold font-mono transition-all text-center ${
                        (config.noteDisplay || (config.useFlats ? 'flats' : 'sharps')) === 'flats'
                          ? 'bg-cyan-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Flats ♭
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 4: Fret Range Slider */}
              <FretRangeSlider
                minFret={config.minFret}
                maxFret={config.maxFret}
                onChangeMin={(v) => onChangeConfig('minFret', v)}
                onChangeMax={(v) => onChangeConfig('maxFret', v)}
                maxInstrumentFrets={currentInstrument?.fretCount || 24}
              />
            </>
          ) : (
            <InstrumentBuilder
              currentInstrument={currentInstrument}
              onSelectInstrument={onSelectInstrument}
              userCustomInstruments={userCustomInstruments}
              onInstrumentSaved={onInstrumentSaved}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center gap-3">
          <button
            onClick={onClose}
            className="py-3 px-5 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              onClose();
              if (onStartSession) onStartSession();
            }}
            className="flex-1 py-3 px-6 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-current" /> Save & Start Practice
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
