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
        <div role="tablist" className="tabs tabs-border bg-base-200/50 px-6 pt-2 border-b border-base-300">
          <button
            role="tab"
            onClick={() => setActiveTab('session')}
            className={activeTab === 'session' ? 'tab tab-active font-bold text-xs uppercase tracking-wider gap-2' : 'tab font-bold text-xs uppercase tracking-wider text-base-content/70 gap-2'}
          >
            <Target className="w-4 h-4" /> Session & Mechanics
          </button>
          <button
            role="tab"
            onClick={() => setActiveTab('instrument')}
            className={activeTab === 'instrument' ? 'tab tab-active font-bold text-xs uppercase tracking-wider gap-2' : 'tab font-bold text-xs uppercase tracking-wider text-base-content/70 gap-2'}
          >
            <Music className="w-4 h-4" /> Instrument Setup
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'session' ? (
            <>
              {/* Section 1: Practice Mode Selector */}
              <div className="space-y-3">
                <label className="text-xs font-mono text-base-content/70 uppercase tracking-wider">
                  Select Game / Practice Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => onChangeConfig('sessionMode', 'tracked')}
                    className={config.sessionMode === 'tracked' ? 'p-4 rounded-2xl border cursor-pointer transition-colors bg-base-200 border-primary shadow-lg' : 'p-4 rounded-2xl border cursor-pointer transition-colors bg-base-100 border-base-300 hover:border-base-content/40'}
                  >
                    <div className="font-bold text-base-content text-sm mb-1 flex items-center justify-between">
                      Pass / Fail Mode (Tracked)
                    </div>
                    <p className="text-xs text-base-content/70">
                      Prompt ➔ Countdown ➔ Reveal. Log results via Voice or Buttons. Tracks round accuracy %, speed & streak.
                    </p>
                  </div>

                  <div
                    onClick={() => onChangeConfig('sessionMode', 'flashcard')}
                    className={config.sessionMode === 'flashcard' ? 'p-4 rounded-2xl border cursor-pointer transition-colors bg-base-200 border-primary shadow-lg' : 'p-4 rounded-2xl border cursor-pointer transition-colors bg-base-100 border-base-300 hover:border-base-content/40'}
                  >
                    <div className="font-bold text-base-content text-sm mb-1">
                      Timed Flashcard (No Tracking)
                    </div>
                    <p className="text-xs text-base-content/70">
                      Continuous hands-free loop. Displays notes automatically based on your custom interval timer.
                    </p>
                  </div>
                </div>
              </div>

              {/* Flashcard Settings if Flashcard mode active */}
              {config.sessionMode === 'flashcard' && (
                <div className="bg-base-200 border border-base-300 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                    <Clock className="w-4 h-4" />
                    Flashcard Loop Parameters
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="flashcard-sec-input" className="text-xs font-mono text-base-content/70 block mb-1 cursor-pointer">
                        Seconds Per Note ({config.flashcardSecondsPerNote}s)
                      </label>
                      <input
                        id="flashcard-sec-input"
                        aria-label="Flashcard seconds per note"
                        type="range"
                        min="1"
                        max="10"
                        value={config.flashcardSecondsPerNote}
                        onChange={(e) => onChangeConfig('flashcardSecondsPerNote', Number(e.target.value))}
                        className="range range-primary range-xs"
                      />
                    </div>
                    <div>
                      <label htmlFor="flashcard-min-input" className="text-xs font-mono text-base-content/70 block mb-1 cursor-pointer">
                        Loop Duration ({config.flashcardDurationMins} min)
                      </label>
                      <input
                        id="flashcard-min-input"
                        aria-label="Flashcard duration in minutes"
                        type="range"
                        min="1"
                        max="30"
                        value={config.flashcardDurationMins}
                        onChange={(e) => onChangeConfig('flashcardDurationMins', Number(e.target.value))}
                        className="range range-primary range-xs"
                      />
                    </div>
                  </div>
                  <div className="text-center font-mono text-xs text-primary bg-base-100 py-2 rounded-xl border border-base-300">
                    Est. Notes Per Session: <span className="font-bold">{flashcardTotalNotes}</span>
                  </div>
                </div>
              )}

              {/* Section 2: Prompt Style */}
              <div className="space-y-3">
                <label className="text-xs font-mono text-base-content/70 uppercase tracking-wider">
                  Target Note Prompt Scope
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => onChangeConfig('promptType', 'global')}
                    className={config.promptType === 'global' ? 'btn btn-sm btn-primary font-extrabold font-mono uppercase text-xs' : 'btn btn-sm btn-neutral btn-ghost font-mono uppercase text-xs'}
                  >
                    Global Note (e.g. "Find C")
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeConfig('promptType', 'string_specific')}
                    className={config.promptType === 'string_specific' ? 'btn btn-sm btn-primary font-extrabold font-mono uppercase text-xs' : 'btn btn-sm btn-neutral btn-ghost font-mono uppercase text-xs'}
                  >
                    String Specific (e.g. "Find C on A string")
                  </button>
                </div>
              </div>

              {/* Section 3: Accidentals Toggle & Notation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-base-200 border border-base-300 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <label htmlFor="accidentals-toggle" className="font-bold text-base-content text-xs uppercase font-mono cursor-pointer block">Include Sharps and Flats</label>
                    <div className="text-[11px] text-base-content/70">
                      {config.includeAccidentals ? 'Sharps & Flats included' : 'Naturals Only (A-G)'}
                    </div>
                  </div>
                  <input
                    id="accidentals-toggle"
                    aria-label="Include sharps and flats"
                    type="checkbox"
                    checked={config.includeAccidentals}
                    onChange={(e) => onChangeConfig('includeAccidentals', e.target.checked)}
                    className="toggle toggle-primary"
                  />
                </div>

                <div className="bg-base-200 border border-base-300 rounded-2xl p-4 flex flex-col justify-between gap-2">
                  <div>
                    <div className="font-bold text-base-content text-xs uppercase font-mono">Note Display</div>
                    <div className="text-[11px] text-base-content/70">
                      {(config.noteDisplay || (config.useFlats ? 'flats' : 'sharps')) === 'flats'
                        ? 'Display Flats (♭)'
                        : (config.noteDisplay || (config.useFlats ? 'flats' : 'sharps')) === 'both'
                        ? 'Display Sharps & Flats'
                        : 'Display Sharps (♯)'}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 bg-base-100 p-1 rounded-xl border border-base-300">
                    <button
                      type="button"
                      onClick={() => onChangeConfig('noteDisplay', 'sharps')}
                      className={`btn btn-xs font-mono font-bold ${
                        (config.noteDisplay || (config.useFlats ? 'flats' : 'sharps')) === 'sharps'
                          ? 'btn-primary'
                          : 'btn-ghost'
                      }`}
                    >
                      # Sharps
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeConfig('noteDisplay', 'both')}
                      className={`btn btn-xs font-mono font-bold ${
                        config.noteDisplay === 'both'
                          ? 'btn-primary'
                          : 'btn-ghost'
                      }`}
                    >
                      Both
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeConfig('noteDisplay', 'flats')}
                      className={`btn btn-xs font-mono font-bold ${
                        (config.noteDisplay || (config.useFlats ? 'flats' : 'sharps')) === 'flats'
                          ? 'btn-primary'
                          : 'btn-ghost'
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
        <div className="p-4 border-t border-base-200 bg-base-200 flex items-center gap-3">
          <button
            onClick={onClose}
            className="btn btn-neutral btn-outline font-bold text-xs uppercase"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              onClose();
              if (onStartSession) onStartSession();
            }}
            className="btn btn-primary flex-1 font-black text-xs uppercase tracking-wider gap-2 shadow-lg"
          >
            <Play className="w-4 h-4 fill-current" /> Save & Start Practice
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
