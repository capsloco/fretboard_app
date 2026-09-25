import React, { useState } from 'react';
import {
  INSTRUMENT_PRESETS,
  TUNING_PRESETS,
  CHROMATIC_SHARPS,
  getTuningsForInstrument,
  groupTuningsByCategory,
  findMatchingTuningPreset
} from '../../lib/fretLogic';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { saveCustomInstrument } from '../../lib/supabase';

const legendClass = 'fieldset-legend font-display uppercase tracking-[0.15em] text-sm';

function InstrumentCard({ title, detail, selected, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`card text-left p-3 border-2 transition-colors ${
        selected ? 'border-primary bg-base-200' : 'border-base-300 bg-base-100 hover:border-base-content/30'
      }`}
    >
      <span className="flex items-center justify-between font-display font-bold uppercase tracking-wider">
        {title}
        {selected && <Check className="size-4 text-primary" aria-hidden="true" />}
      </span>
      <span className="text-sm opacity-70">{detail}</span>
    </button>
  );
}

export default function InstrumentBuilder({
  currentInstrument,
  onSelectInstrument,
  userCustomInstruments = [],
  onInstrumentSaved
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [stringCount, setStringCount] = useState(6);
  const [fretCount, setFretCount] = useState(24);
  const [saving, setSaving] = useState(false);

  const tuningsForCurrent = getTuningsForInstrument(currentInstrument?.stringCount || 6, currentInstrument?.type);
  const groupedTunings = groupTuningsByCategory(tuningsForCurrent);
  const matchingPreset = findMatchingTuningPreset(currentInstrument?.tuning, currentInstrument?.stringCount);
  const activeTuningId = currentInstrument?.tuningId || (matchingPreset ? matchingPreset.id : 'custom');
  const isCustomTuning = activeTuningId === 'custom';

  const selectTuning = (tuningId) => {
    document.getElementById('tuning-menu')?.hidePopover();
    if (tuningId === 'custom') {
      onSelectInstrument({ ...currentInstrument, tuningId: 'custom' });
      return;
    }
    const preset = TUNING_PRESETS.find(t => t.id === tuningId);
    if (preset) {
      onSelectInstrument({ ...currentInstrument, tuningId: preset.id, tuningName: preset.name, tuning: [...preset.tuning] });
    }
  };

  const setStringNote = (stringIndex, note) => {
    document.getElementById(`string-menu-${stringIndex}`)?.hidePopover();
    const tuning = [...(currentInstrument?.tuning || [])];
    tuning[stringIndex] = note;
    onSelectInstrument({ ...currentInstrument, tuningId: 'custom', tuning });
  };

  const handleSaveCustom = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    const available = getTuningsForInstrument(stringCount);
    const saved = await saveCustomInstrument({
      title: title.trim(),
      stringCount,
      fretCount,
      tuningId: available[0]?.id ?? 'custom',
      tuning: available[0]?.tuning ?? Array(stringCount).fill('E')
    });
    setSaving(false);

    if (saved) {
      onInstrumentSaved?.(saved);
      onSelectInstrument(saved);
      setTitle('');
      setIsCreating(false);
    }
  };

  if (isCreating) {
    return (
      <form onSubmit={handleSaveCustom} className="space-y-2">
        <fieldset className="fieldset">
          <legend className={legendClass}>New instrument</legend>
          <label className="flex flex-col gap-1">
            <span className="text-sm">Name</span>
            <input
              type="text"
              placeholder="e.g. 8-string baritone"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="input w-full"
            />
          </label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Strings: <strong className="tabular-nums">{stringCount}</strong></span>
              <input type="range" min="4" max="8" value={stringCount} onChange={(e) => setStringCount(Number(e.target.value))} className="range range-sm range-primary" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Frets: <strong className="tabular-nums">{fretCount}</strong></span>
              <input type="range" min="12" max="24" value={fretCount} onChange={(e) => setFretCount(Number(e.target.value))} className="range range-sm range-primary" />
            </label>
          </div>
          <p className="label">You can pick a tuning or set each string once it’s saved.</p>
        </fieldset>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setIsCreating(false)} className="btn font-display uppercase tracking-wider">Cancel</button>
          <button type="submit" disabled={saving} className="btn btn-primary font-display uppercase tracking-wider">
            {saving ? 'Saving…' : 'Save instrument'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-2">
      <fieldset className="fieldset">
        <legend className={legendClass}>Instrument</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Instrument">
          {INSTRUMENT_PRESETS.map(preset => (
            <InstrumentCard
              key={preset.id}
              title={preset.title}
              detail={`${preset.stringCount} strings · ${preset.fretCount} frets`}
              selected={currentInstrument?.id === preset.id}
              onSelect={() => {
                const tuning = TUNING_PRESETS.find(t => t.id === preset.defaultTuningId);
                onSelectInstrument({
                  ...preset,
                  tuningId: tuning ? tuning.id : 'custom',
                  tuningName: tuning ? tuning.name : 'Standard',
                  tuning: tuning ? [...tuning.tuning] : [...preset.tuning]
                });
              }}
            />
          ))}
          {userCustomInstruments.map(inst => (
            <InstrumentCard
              key={inst.id}
              title={inst.title}
              detail={`${inst.stringCount} strings · ${inst.fretCount} frets · custom`}
              selected={currentInstrument?.id === inst.id}
              onSelect={() => onSelectInstrument(inst)}
            />
          ))}
        </div>
        <button type="button" onClick={() => setIsCreating(true)} className="btn btn-sm btn-ghost self-start mt-1 font-display uppercase tracking-wider">
          <Plus className="size-4" /> New instrument
        </button>
      </fieldset>

      <fieldset className="fieldset">
        <legend className={legendClass}>Tuning</legend>
        <button
          type="button"
          popoverTarget="tuning-menu"
          style={{ anchorName: '--tuning-menu' }}
          className="btn justify-between w-full sm:w-96"
        >
          <span className="truncate">
            {isCustomTuning
              ? 'Custom tuning'
              : matchingPreset
                ? `${matchingPreset.name} · ${matchingPreset.tuning.join(' ')}`
                : 'Choose a tuning'}
          </span>
          <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
        </button>
        <ul
          id="tuning-menu"
          popover="auto"
          style={{ positionAnchor: '--tuning-menu' }}
          className="dropdown menu w-80 max-h-80 flex-nowrap overflow-y-auto rounded-box bg-base-100 shadow-lg border border-base-300 mt-1"
        >
          {Object.entries(groupedTunings).map(([category, tunings]) => (
            <React.Fragment key={category}>
              <li className="menu-title">{category}</li>
              {tunings.map(t => (
                <li key={t.id}>
                  <button type="button" className={activeTuningId === t.id ? 'menu-active' : ''} onClick={() => selectTuning(t.id)}>
                    <span className="flex-1">{t.name}</span>
                    <span className="opacity-60 text-xs">{t.tuning.join(' ')}</span>
                  </button>
                </li>
              ))}
            </React.Fragment>
          ))}
          <li className="menu-title">Other</li>
          <li>
            <button type="button" className={isCustomTuning ? 'menu-active' : ''} onClick={() => selectTuning('custom')}>
              Custom: set each string
            </button>
          </li>
        </ul>

        {!isCustomTuning && matchingPreset?.description && (
          <p className="label">{matchingPreset.description}</p>
        )}
        {!isCustomTuning && matchingPreset?.octaves && (
          <p className="label">Open strings: {matchingPreset.octaves}</p>
        )}
      </fieldset>

      <fieldset className="fieldset">
        <legend className={legendClass}>Strings, low to high</legend>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {(currentInstrument?.tuning || []).map((note, sIdx) => {
            const stringNumber = (currentInstrument?.stringCount || 6) - sIdx;
            return (
              <div key={sIdx} className="flex flex-col items-center gap-1">
                <span className="text-xs opacity-60">String {stringNumber}</span>
                {isCustomTuning ? (
                  <>
                    <button
                      type="button"
                      popoverTarget={`string-menu-${sIdx}`}
                      style={{ anchorName: `--string-menu-${sIdx}` }}
                      className="btn btn-sm w-full font-display font-bold"
                      aria-label={`String ${stringNumber} note`}
                    >
                      {note} <ChevronDown className="size-3" aria-hidden="true" />
                    </button>
                    <ul
                      id={`string-menu-${sIdx}`}
                      popover="auto"
                      style={{ positionAnchor: `--string-menu-${sIdx}` }}
                      className="dropdown menu grid grid-cols-3 w-40 rounded-box bg-base-100 shadow-lg border border-base-300 mt-1 p-1"
                    >
                      {CHROMATIC_SHARPS.map(n => (
                        <li key={n}>
                          <button type="button" className={note === n ? 'menu-active justify-center' : 'justify-center'} onClick={() => setStringNote(sIdx, n)}>
                            {n}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <span className="w-full text-center rounded-field border border-base-300 bg-base-200 py-1 font-display font-bold">{note}</span>
                )}
              </div>
            );
          })}
        </div>
        {!isCustomTuning && <p className="label">Choose “Custom” in the tuning menu to change individual strings.</p>}
      </fieldset>
    </div>
  );
}
