import React, { useState } from 'react';
import { X, Play, Mic, Speech, Keyboard } from 'lucide-react';
import Modal from './Modal';
import InstrumentBuilder from '../settings/InstrumentBuilder';
import FretRangeSlider from './FretRangeSlider';
import { THEMES } from '../../lib/theme';

const TABS = [
  { id: 'practice', label: 'Practice' },
  { id: 'instrument', label: 'Instrument' },
  { id: 'look', label: 'Look' }
];

function OptionCard({ selected, onSelect, title, children }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`card text-left p-4 border-2 transition-colors ${
        selected ? 'border-primary bg-base-200' : 'border-base-300 bg-base-100 hover:border-base-content/30'
      }`}
    >
      <span className="font-display font-bold uppercase tracking-wider">{title}</span>
      <span className="text-sm opacity-80 mt-1">{children}</span>
    </button>
  );
}

function Segmented({ label, value, options, onChange }) {
  return (
    <div className="join w-full" role="radiogroup" aria-label={label}>
      {options.map(({ id, label: optionLabel, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          onClick={() => onChange(id)}
          className={`join-item btn btn-sm flex-1 font-display uppercase tracking-wider ${value === id ? 'btn-neutral' : ''}`}
        >
          {Icon && <Icon className="size-4" aria-hidden="true" />}
          {optionLabel}
        </button>
      ))}
    </div>
  );
}

const legendClass = 'fieldset-legend font-display uppercase tracking-[0.15em] text-sm';

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
  const [activeTab, setActiveTab] = useState('practice');
  const noteDisplay = config.noteDisplay || (config.useFlats ? 'flats' : 'sharps');
  const flashcardTotalNotes = Math.floor((config.flashcardDurationMins * 60) / config.flashcardSecondsPerNote);

  return (
    <Modal open={isOpen} onClose={onClose} labelledBy="settings-title" className="max-w-3xl p-0 flex flex-col max-h-[90vh]">
      <header className="flex items-center justify-between px-5 py-3 bg-cabinet border-b-4 border-(--piping)">
        <h2 id="settings-title" className="font-display font-bold uppercase tracking-[0.2em] text-lg">Settings</h2>
        <button type="button" onClick={onClose} className="btn btn-sm btn-ghost btn-square" aria-label="Close settings">
          <X className="size-5" />
        </button>
      </header>

      <div role="tablist" className="tabs tabs-border px-3 border-b border-base-300">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab font-display uppercase tracking-wider ${activeTab === tab.id ? 'tab-active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-5 overflow-y-auto flex-1 space-y-2">
        {activeTab === 'practice' && (
          <>
            <fieldset className="fieldset">
              <legend className={legendClass}>Round type</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Round type">
                <OptionCard selected={config.sessionMode === 'tracked'} onSelect={() => onChangeConfig('sessionMode', 'tracked')} title="Pass / fail">
                  Every answer is scored. Accuracy, streaks and weak notes are saved to your stats.
                </OptionCard>
                <OptionCard selected={config.sessionMode === 'flashcard'} onSelect={() => onChangeConfig('sessionMode', 'flashcard')} title="Flashcards">
                  Notes change on a timer. Nothing is scored or saved. Good for warming up.
                </OptionCard>
              </div>
            </fieldset>

            {config.sessionMode === 'flashcard' && (
              <fieldset className="fieldset grid grid-cols-1 sm:grid-cols-2 gap-4">
                <legend className={legendClass}>Flashcard timing</legend>
                <label className="flex flex-col gap-1">
                  <span className="text-sm">Seconds per note: <strong className="tabular-nums">{config.flashcardSecondsPerNote}</strong></span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={config.flashcardSecondsPerNote}
                    onChange={(e) => onChangeConfig('flashcardSecondsPerNote', Number(e.target.value))}
                    className="range range-sm range-primary"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm">Round length: <strong className="tabular-nums">{config.flashcardDurationMins} min</strong></span>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={config.flashcardDurationMins}
                    onChange={(e) => onChangeConfig('flashcardDurationMins', Number(e.target.value))}
                    className="range range-sm range-primary"
                  />
                </label>
                <p className="label sm:col-span-2">About {flashcardTotalNotes} notes per round.</p>
              </fieldset>
            )}

            <fieldset className="fieldset">
              <legend className={legendClass}>Answer with</legend>
              <Segmented
                label="Answer with"
                value={config.inputMode}
                onChange={(v) => onChangeConfig('inputMode', v)}
                options={[
                  { id: 'mic', label: 'Mic', icon: Mic },
                  { id: 'voice', label: 'Voice', icon: Speech },
                  { id: 'manual', label: 'Manual', icon: Keyboard }
                ]}
              />
              {config.inputMode === 'mic' && (
                <label className="flex items-center gap-3 mt-2">
                  <span className="text-sm shrink-0">Mic sensitivity</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={config.micSensitivity}
                    onChange={(e) => onChangeConfig('micSensitivity', Number(e.target.value))}
                    className="range range-sm range-primary"
                  />
                  <span className="tabular-nums w-5 text-sm">{config.micSensitivity}</span>
                </label>
              )}
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              <fieldset className="fieldset">
                <legend className={legendClass}>Prompts</legend>
                <Segmented
                  label="Prompts"
                  value={config.promptType}
                  onChange={(v) => onChangeConfig('promptType', v)}
                  options={[
                    { id: 'global', label: 'Anywhere' },
                    { id: 'string_specific', label: 'On a string' }
                  ]}
                />
                <p className="label">
                  {config.promptType === 'global' ? '“Find C” anywhere in your fret range.' : '“Find C on the A string.”'}
                </p>
              </fieldset>

              <fieldset className="fieldset">
                <legend className={legendClass}>Spelling</legend>
                <Segmented
                  label="Note spelling"
                  value={noteDisplay}
                  onChange={(v) => onChangeConfig('noteDisplay', v)}
                  options={[
                    { id: 'sharps', label: 'Sharps ♯' },
                    { id: 'both', label: 'Both' },
                    { id: 'flats', label: 'Flats ♭' }
                  ]}
                />
                <label className="label cursor-pointer mt-2 gap-3">
                  <input
                    type="checkbox"
                    checked={config.includeAccidentals}
                    onChange={(e) => onChangeConfig('includeAccidentals', e.target.checked)}
                    className="toggle toggle-sm toggle-primary"
                  />
                  <span className="text-base-content">Include sharps and flats in prompts</span>
                </label>
              </fieldset>
            </div>

            <FretRangeSlider
              minFret={config.minFret}
              maxFret={config.maxFret}
              onChangeMin={(v) => onChangeConfig('minFret', v)}
              onChangeMax={(v) => onChangeConfig('maxFret', v)}
              maxInstrumentFrets={currentInstrument?.fretCount || 24}
            />
          </>
        )}

        {activeTab === 'instrument' && (
          <InstrumentBuilder
            currentInstrument={currentInstrument}
            onSelectInstrument={onSelectInstrument}
            userCustomInstruments={userCustomInstruments}
            onInstrumentSaved={onInstrumentSaved}
          />
        )}

        {activeTab === 'look' && (
          <fieldset className="fieldset">
            <legend className={legendClass}>Theme</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Theme">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  type="button"
                  role="radio"
                  aria-checked={currentTheme === theme.id}
                  onClick={() => onChangeTheme(theme.id)}
                  className={`card overflow-hidden text-left border-2 ${currentTheme === theme.id ? 'border-primary' : 'border-base-300'}`}
                >
                  <div data-theme={theme.id} className="bg-base-200">
                    <div className="bg-cabinet h-10 px-3 flex items-center border-b-4 border-(--piping)">
                      <span className="font-script text-2xl leading-none">FretLearn</span>
                    </div>
                    <div className="p-3 flex items-center gap-2">
                      <span className="btn btn-xs btn-primary pointer-events-none" aria-hidden="true">Start</span>
                      <span className="badge badge-sm badge-secondary" aria-hidden="true">Streak 3</span>
                      <span className="h-5 flex-1 rounded-field bg-fingerboard" />
                    </div>
                  </div>
                  <div className="p-3 bg-base-100">
                    <div className="font-display font-bold uppercase tracking-wider">{theme.name}</div>
                    <div className="text-sm opacity-80">{theme.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-base-300 bg-base-200">
        <span className="text-xs opacity-70 mr-auto hidden sm:inline">Changes save automatically.</span>
        <button type="button" onClick={onClose} className="btn font-display uppercase tracking-wider">Done</button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onStartSession?.();
          }}
          className="btn btn-primary font-display uppercase tracking-wider"
        >
          <Play className="size-4 fill-current" /> Start practice
        </button>
      </footer>
    </Modal>
  );
}
