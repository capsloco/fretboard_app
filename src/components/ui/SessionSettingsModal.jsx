import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Sliders, Music, Clock, Target, Save, Palette } from 'lucide-react';
import InstrumentBuilder from '../settings/InstrumentBuilder';
import FretRangeSlider from './FretRangeSlider';

const THEME_PRESETS = [
  { group: '☀️ Clean & Light', themes: ['emerald', 'nord', 'silk', 'autumn'] },
  { group: '🌙 Dark & Night', themes: ['dim', 'night', 'sunset', 'dracula', 'abyss'] },
  { group: '⚡ Vibrant & Neon', themes: ['synthwave', 'acid'] }
];

export default function SessionSettingsModal({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  currentInstrument,
  onSelectInstrument,
  userCustomInstruments,
  onInstrumentSaved,
  onStartSession,
  currentTheme,
  onChangeTheme
}) {
  const [activeTab, setActiveTab] = useState('session'); // 'session' | 'instrument' | 'appearance'
  const [isThemeExpanded, setIsThemeExpanded] = useState(false);

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
        className="modal-box bg-base-100 border border-base-300 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden p-0"
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
            aria-label="Close Settings Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector using canonical daisyUI tabs */}
        <div role="tablist" className="tabs tabs-border bg-base-200/50 px-6 pt-2 border-b border-base-300">
          <button
            role="tab"
            onClick={() => setActiveTab('session')}
            className={activeTab === 'session' ? 'tab tab-active font-bold text-xs uppercase tracking-wider gap-2 text-primary' : 'tab font-bold text-xs uppercase tracking-wider text-base-content/70 gap-2'}
          >
            <Target className="w-4 h-4" /> Session & Mechanics
          </button>
          <button
            role="tab"
            onClick={() => setActiveTab('instrument')}
            className={activeTab === 'instrument' ? 'tab tab-active font-bold text-xs uppercase tracking-wider gap-2 text-primary' : 'tab font-bold text-xs uppercase tracking-wider text-base-content/70 gap-2'}
          >
            <Music className="w-4 h-4" /> Instrument Setup
          </button>
          <button
            role="tab"
            onClick={() => setActiveTab('appearance')}
            className={activeTab === 'appearance' ? 'tab tab-active font-bold text-xs uppercase tracking-wider gap-2 text-primary' : 'tab font-bold text-xs uppercase tracking-wider text-base-content/70 gap-2'}
          >
            <Palette className="w-4 h-4" /> Appearance
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'session' ? (
            <>
              {/* Section 1: Practice Mode Selector */}
              <fieldset className="fieldset bg-base-200/40 border border-base-300 rounded-box p-4">
                <legend className="fieldset-legend font-mono text-xs uppercase tracking-wider text-base-content/80 font-bold">
                  Practice Mode Selection
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  <div
                    onClick={() => onChangeConfig('sessionMode', 'tracked')}
                    className={config.sessionMode === 'tracked' ? 'card bg-base-200 border-2 border-primary p-4 cursor-pointer transition-colors shadow-sm' : 'card bg-base-100 border border-base-300 p-4 cursor-pointer transition-colors hover:border-base-content/40'}
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
                    className={config.sessionMode === 'flashcard' ? 'card bg-base-200 border-2 border-primary p-4 cursor-pointer transition-colors shadow-sm' : 'card bg-base-100 border border-base-300 p-4 cursor-pointer transition-colors hover:border-base-content/40'}
                  >
                    <div className="font-bold text-base-content text-sm mb-1">
                      Timed Flashcard (No Tracking)
                    </div>
                    <p className="text-xs text-base-content/70">
                      Continuous hands-free loop. Displays notes automatically based on your custom interval timer.
                    </p>
                  </div>
                </div>
              </fieldset>

              {/* Flashcard Settings if Flashcard mode active */}
              {config.sessionMode === 'flashcard' && (
                <fieldset className="fieldset bg-base-200/60 border border-base-300 rounded-box p-4 space-y-3">
                  <legend className="fieldset-legend font-mono text-xs uppercase tracking-wider text-primary font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Flashcard Loop Parameters
                  </legend>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="flashcard-sec-input" className="label text-xs font-mono text-base-content/80 block mb-1 cursor-pointer">
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
                      <label htmlFor="flashcard-min-input" className="label text-xs font-mono text-base-content/80 block mb-1 cursor-pointer">
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
                </fieldset>
              )}

              {/* Section 2: Prompt Style */}
              <fieldset className="fieldset bg-base-200/40 border border-base-300 rounded-box p-4">
                <legend className="fieldset-legend font-mono text-xs uppercase tracking-wider text-base-content/80 font-bold">
                  Target Note Prompt Scope
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => onChangeConfig('promptType', 'global')}
                    className={config.promptType === 'global' ? 'btn btn-sm btn-primary font-extrabold font-mono uppercase text-xs' : 'btn btn-sm btn-ghost font-mono uppercase text-xs'}
                  >
                    Global Note (e.g. "Find C")
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeConfig('promptType', 'string_specific')}
                    className={config.promptType === 'string_specific' ? 'btn btn-sm btn-primary font-extrabold font-mono uppercase text-xs' : 'btn btn-sm btn-ghost font-mono uppercase text-xs'}
                  >
                    String Specific (e.g. "Find C on A string")
                  </button>
                </div>
              </fieldset>

              {/* Section 3: Accidentals Toggle & Notation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <fieldset className="fieldset bg-base-200/40 border border-base-300 rounded-box p-4 flex items-center justify-between">
                  <div>
                    <label htmlFor="accidentals-toggle" className="font-bold text-base-content text-xs uppercase font-mono cursor-pointer block">Include Sharps & Flats</label>
                    <p className="label text-[11px] text-base-content/70 p-0 mt-0.5">
                      {config.includeAccidentals ? 'Sharps & Flats included' : 'Naturals Only (A-G)'}
                    </p>
                  </div>
                  <input
                    id="accidentals-toggle"
                    aria-label="Include sharps and flats"
                    type="checkbox"
                    checked={config.includeAccidentals}
                    onChange={(e) => onChangeConfig('includeAccidentals', e.target.checked)}
                    className="toggle toggle-primary"
                  />
                </fieldset>

                <fieldset className="fieldset bg-base-200/40 border border-base-300 rounded-box p-4 flex flex-col justify-between gap-2">
                  <div>
                    <legend className="font-bold text-base-content text-xs uppercase font-mono p-0">Note Display Notation</legend>
                    <p className="label text-[11px] text-base-content/70 p-0 mt-0.5">
                      {(config.noteDisplay || (config.useFlats ? 'flats' : 'sharps')) === 'flats'
                        ? 'Display Flats (♭)'
                        : (config.noteDisplay || (config.useFlats ? 'flats' : 'sharps')) === 'both'
                        ? 'Display Sharps & Flats'
                        : 'Display Sharps (♯)'}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-1 bg-base-100 p-1 rounded-xl border border-base-300">
                    <button
                      type="button"
                      onClick={() => onChangeConfig('noteDisplay', 'sharps')}
                      className={(config.noteDisplay || (config.useFlats ? 'flats' : 'sharps')) === 'sharps' ? 'btn btn-xs btn-primary font-mono font-bold' : 'btn btn-xs btn-ghost font-mono font-bold'}
                    >
                      # Sharps
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeConfig('noteDisplay', 'both')}
                      className={config.noteDisplay === 'both' ? 'btn btn-xs btn-primary font-mono font-bold' : 'btn btn-xs btn-ghost font-mono font-bold'}
                    >
                      Both
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeConfig('noteDisplay', 'flats')}
                      className={(config.noteDisplay || (config.useFlats ? 'flats' : 'sharps')) === 'flats' ? 'btn btn-xs btn-primary font-mono font-bold' : 'btn btn-xs btn-ghost font-mono font-bold'}
                    >
                      Flats ♭
                    </button>
                  </div>
                </fieldset>
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
          ) : activeTab === 'instrument' ? (
            <InstrumentBuilder
              currentInstrument={currentInstrument}
              onSelectInstrument={onSelectInstrument}
              userCustomInstruments={userCustomInstruments}
              onInstrumentSaved={onInstrumentSaved}
            />
          ) : (
            <div className="collapse collapse-arrow bg-base-200/40 border border-base-300 rounded-box">
              <input
                type="checkbox"
                checked={isThemeExpanded}
                onChange={(e) => setIsThemeExpanded(e.target.checked)}
                aria-label={isThemeExpanded ? 'Collapse theme picker' : 'Expand theme picker'}
              />
              <div className="collapse-title font-mono text-xs uppercase tracking-wider text-base-content/90 font-bold flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-primary" /> Theme —
                <span className="badge badge-primary badge-sm font-mono uppercase">{currentTheme}</span>
              </div>
              <div className="collapse-content">
                {THEME_PRESETS.map((group) => (
                  <div key={group.group} className="mb-4 last:mb-0">
                    <div className="text-[11px] font-bold text-primary px-1 py-1 uppercase font-mono tracking-wide">
                      {group.group}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                      {group.themes.map((t) => {
                        const isSelected = currentTheme === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => onChangeTheme(t)}
                            className={isSelected ? 'btn btn-sm btn-primary justify-start capitalize font-bold font-mono text-xs w-full shadow-sm' : 'btn btn-sm btn-ghost justify-start capitalize font-bold font-mono text-xs w-full border border-base-200/80 hover:bg-base-200'}
                          >
                            <span className={isSelected ? 'w-2.5 h-2.5 rounded-full bg-primary-content' : 'w-2.5 h-2.5 rounded-full bg-primary'} />
                            <span className="truncate">{t}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-base-200 bg-base-200 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost font-bold text-xs uppercase"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-neutral font-bold text-xs uppercase gap-2"
          >
            <Save className="w-4 h-4" /> Save
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onStartSession) onStartSession();
            }}
            className="btn btn-primary font-black text-xs uppercase tracking-wider gap-2 shadow-lg flex-1 sm:flex-initial"
          >
            <Play className="w-4 h-4 fill-current" /> Save & Start Practice
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
