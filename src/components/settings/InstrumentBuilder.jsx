import React, { useState } from 'react';
import {
  INSTRUMENT_PRESETS,
  TUNING_PRESETS,
  CHROMATIC_SHARPS,
  getTuningsForInstrument,
  groupTuningsByCategory,
  findMatchingTuningPreset
} from '../../lib/fretLogic';
import { Check, Music, Lock, Unlock, Zap, Sliders } from 'lucide-react';
import { saveCustomInstrument } from '../../lib/supabase';

export default function InstrumentBuilder({
  currentInstrument,
  onSelectInstrument,
  userCustomInstruments = [],
  onInstrumentSaved
}) {
  const [activeTab, setActiveTab] = useState('profiles'); // 'profiles' | 'custom'

  // Custom Configurator state
  const [title, setTitle] = useState('');
  const [stringCount, setStringCount] = useState(6);
  const [fretCount, setFretCount] = useState(24);
  const [saving, setSaving] = useState(false);

  // Available tunings for current active instrument
  const availableTuningsForCurrent = getTuningsForInstrument(
    currentInstrument?.stringCount || 6,
    currentInstrument?.type
  );
  const groupedTuningsForCurrent = groupTuningsByCategory(availableTuningsForCurrent);
  const currentMatchingPreset = findMatchingTuningPreset(
    currentInstrument?.tuning,
    currentInstrument?.stringCount
  );
  const activeTuningId = currentInstrument?.tuningId || (currentMatchingPreset ? currentMatchingPreset.id : 'custom');

  // Handle tuning change for active instrument
  const handleSelectTuningForActive = (tuningId) => {
    if (tuningId === 'custom') {
      onSelectInstrument({
        ...currentInstrument,
        tuningId: 'custom'
      });
      return;
    }
    const preset = TUNING_PRESETS.find(t => t.id === tuningId);
    if (preset) {
      onSelectInstrument({
        ...currentInstrument,
        tuningId: preset.id,
        tuningName: preset.name,
        tuning: [...preset.tuning]
      });
    }
  };

  // Handle individual string note edit for active instrument in custom mode
  const handleActiveStringNoteChange = (stringIndex, newNote) => {
    const updated = [...(currentInstrument?.tuning || [])];
    updated[stringIndex] = newNote;
    onSelectInstrument({
      ...currentInstrument,
      tuningId: 'custom',
      tuning: updated
    });
  };

  // Save new custom instrument setup
  const handleSaveCustom = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    const available = getTuningsForInstrument(stringCount);
    const defaultTuning = available.length > 0 ? available[0].tuning : Array(stringCount).fill('E');
    const defaultTuningId = available.length > 0 ? available[0].id : 'custom';

    const customObj = {
      title: title.trim(),
      stringCount,
      fretCount,
      tuningId: defaultTuningId,
      tuning: defaultTuning
    };

    const saved = await saveCustomInstrument(customObj);
    setSaving(false);

    if (saved) {
      if (onInstrumentSaved) onInstrumentSaved(saved);
      onSelectInstrument(saved);
      setTitle('');
      setActiveTab('profiles');
    }
  };

  return (
    <div className="card bg-base-100 border border-base-300 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Top Header & Tab Navigation */}
      <div className="flex items-center justify-between border-b border-base-200 pb-4">
        <h3 className="text-xl font-bold text-base-content flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          Instrument & Tuning Manager
        </h3>
        <div className="flex bg-base-200 p-1 rounded-xl border border-base-300">
          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            className={`btn btn-xs font-bold ${
              activeTab === 'profiles'
                ? 'btn-primary'
                : 'btn-ghost'
            }`}
          >
            Base Profiles & Tunings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`btn btn-xs font-bold ${
              activeTab === 'custom'
                ? 'btn-primary'
                : 'btn-ghost'
            }`}
          >
            + Create Custom Instrument
          </button>
        </div>
      </div>

      {activeTab === 'profiles' ? (
        <div className="space-y-6">
          {/* Step 1: Base Instrument Profile Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-base-content/70 uppercase tracking-wider">
                1. Choose Base Instrument Profile
              </span>
              <span className="text-xs font-mono text-primary font-bold">
                Active: <strong>{currentInstrument?.title}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INSTRUMENT_PRESETS.map((preset) => {
                const isSelected = currentInstrument?.id === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      // Switch instrument profile and set default tuning
                      const defaultTuning = TUNING_PRESETS.find(t => t.id === preset.defaultTuningId);
                      onSelectInstrument({
                        ...preset,
                        tuningId: defaultTuning ? defaultTuning.id : 'custom',
                        tuningName: defaultTuning ? defaultTuning.name : 'Standard',
                        tuning: defaultTuning ? [...defaultTuning.tuning] : [...preset.tuning]
                      });
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-colors duration-200 ${
                      isSelected
                        ? 'bg-base-200 border-primary shadow-md'
                        : 'bg-base-100 border-base-300 hover:border-base-content/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-base-content text-sm">{preset.title}</span>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="text-xs font-mono text-base-content/70">
                      {preset.stringCount} Strings ({preset.fretCount} Frets) • Standard Tuning
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Instruments Saved by User */}
            {userCustomInstruments.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-mono text-base-content/70 uppercase tracking-wider block">
                  Your Custom Saved Rig Profiles
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {userCustomInstruments.map((inst) => {
                    const isSelected = currentInstrument?.id === inst.id;
                    return (
                      <div
                        key={inst.id}
                        onClick={() => onSelectInstrument(inst)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-colors duration-200 ${
                          isSelected
                            ? 'bg-base-200 border-primary shadow-md'
                            : 'bg-base-100 border-base-300 hover:border-base-content/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-base-content text-sm">{inst.title}</span>
                          {isSelected && <Check className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="text-xs font-mono text-base-content/70">
                          {inst.stringCount} Strings ({inst.fretCount} Frets)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: On-The-Fly Tuning Selector & Details */}
          <div className="p-5 bg-base-200 border border-base-300 rounded-2xl space-y-4 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-base-300 pb-3">
              <div>
                <div className="text-xs font-mono text-base-content/70 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-primary" />
                  2. Select Tuning for {currentInstrument?.title}
                </div>
                <div className="text-[11px] text-base-content/70 mt-0.5">
                  Easily switch tuning presets or lock custom notes on the fly
                </div>
              </div>

              {/* Tuning Selector Dropdown */}
              <select
                aria-label="Select tuning preset"
                value={activeTuningId}
                onChange={(e) => handleSelectTuningForActive(e.target.value)}
                className="select select-sm select-ghost bg-base-100 border border-base-300 text-primary font-mono font-bold cursor-pointer"
              >
                {Object.entries(groupedTuningsForCurrent).map(([category, tunings]) => (
                  <optgroup key={category} label={category} className="bg-base-200 text-base-content font-bold">
                    {tunings.map(t => (
                      <option key={t.id} value={t.id} className="bg-base-100 text-base-content">
                        {t.name} ({t.tuning.join(' ')})
                      </option>
                    ))}
                  </optgroup>
                ))}
                <option value="custom" className="bg-base-100 text-primary font-bold">
                  ⚙️ Custom Tuning (Manual Per-String)
                </option>
              </select>
            </div>

            {/* Display Active Tuning Info Card */}
            {currentMatchingPreset && activeTuningId !== 'custom' ? (
              <div className="bg-base-100 border border-base-300 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-base-content flex items-center gap-2">
                    {currentMatchingPreset.name}
                    <span className="badge badge-primary badge-sm font-mono">
                      {currentMatchingPreset.category}
                    </span>
                  </span>
                  <span className="text-xs font-mono text-success flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Preset Locked
                  </span>
                </div>

                {currentMatchingPreset.octaves && (
                  <div className="text-xs font-mono text-primary bg-base-200 p-2 rounded-lg border border-base-300">
                    <span className="text-base-content/70 mr-2">Octaves:</span>
                    <strong className="text-base-content">{currentMatchingPreset.octaves}</strong>
                  </div>
                )}

                {currentMatchingPreset.description && (
                  <p className="text-xs text-base-content/80 leading-relaxed italic">
                    "{currentMatchingPreset.description}"
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 flex items-center justify-between text-xs font-mono text-warning">
                <span className="flex items-center gap-1.5 font-bold">
                  <Unlock className="w-4 h-4" /> Custom per-string tuning active
                </span>
                <span className="text-[11px] text-base-content/70">Edit notes below</span>
              </div>
            )}

            {/* Per-String Note Display / Pickers */}
            <div>
              <div className="text-[11px] font-mono text-base-content/70 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>String Notes (Low Pitch to High Pitch)</span>
                {activeTuningId !== 'custom' && (
                  <span className="text-[10px] text-base-content/50">
                    Switch tuning to "Custom Tuning" above to edit individual notes
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {(currentInstrument?.tuning || []).map((note, sIdx) => {
                  const displayStrNum = (currentInstrument?.stringCount || 6) - sIdx;
                  return (
                    <div key={sIdx} className="flex flex-col items-center">
                      <span className="text-[10px] font-mono text-base-content/60 mb-1">
                        Str {displayStrNum}
                      </span>
                      {activeTuningId === 'custom' ? (
                        <select
                          aria-label={`String ${displayStrNum} note`}
                          value={note}
                          onChange={(e) => handleActiveStringNoteChange(sIdx, e.target.value)}
                          className="select select-xs select-primary w-full font-mono font-bold text-center"
                        >
                          {CHROMATIC_SHARPS.map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full bg-base-100 border border-base-300 rounded-lg p-2 text-primary font-mono font-bold text-center text-sm">
                          {note}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Custom Builder Form */
        <form onSubmit={handleSaveCustom} className="space-y-5">
          <div>
            <label htmlFor="inst-profile-title" className="block text-xs font-mono text-base-content/70 uppercase mb-1 cursor-pointer">Instrument Profile Title</label>
            <input
              id="inst-profile-title"
              aria-label="Instrument profile title"
              type="text"
              placeholder="e.g. My 8-String Djent Rig or Studio Bass"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="input w-full text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="custom-string-count" className="block text-xs font-mono text-base-content/70 uppercase mb-1 cursor-pointer">
                Number of Strings ({stringCount})
              </label>
              <input
                id="custom-string-count"
                aria-label="Number of strings"
                type="range"
                min="4"
                max="8"
                value={stringCount}
                onChange={(e) => setStringCount(parseInt(e.target.value, 10))}
                className="range range-primary range-xs"
              />
            </div>
            <div>
              <label htmlFor="custom-fret-count" className="block text-xs font-mono text-base-content/70 uppercase mb-1 cursor-pointer">
                Number of Frets ({fretCount})
              </label>
              <input
                id="custom-fret-count"
                aria-label="Number of frets"
                type="range"
                min="12"
                max="24"
                value={fretCount}
                onChange={(e) => setFretCount(parseInt(e.target.value, 10))}
                className="range range-primary range-xs"
              />
            </div>
          </div>

          <div className="p-4 bg-base-200 border border-base-300 rounded-2xl text-xs text-base-content/70 font-mono space-y-1">
            <div className="text-primary font-bold flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Dynamic Tuning Management
            </div>
            <p>
              Tuning presets and custom string notes can be selected or edited anytime using the Tuning Selector once your instrument is saved!
            </p>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary flex-1 uppercase tracking-wider font-extrabold"
            >
              {saving ? 'Saving...' : 'Save & Select Instrument Profile'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
