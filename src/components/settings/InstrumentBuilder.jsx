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
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'profiles'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Base Profiles & Tunings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'custom'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
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
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                1. Choose Base Instrument Profile
              </span>
              <span className="text-xs font-mono text-cyan-400">
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
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-100 text-sm">{preset.title}</span>
                      {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <span>{preset.stringCount} Strings</span>
                      <span>•</span>
                      <span>{preset.fretCount} Frets</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Saved Setups */}
            {userCustomInstruments.length > 0 && (
              <div className="pt-2">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                  Your Custom Saved Instruments
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {userCustomInstruments.map((inst) => {
                    const isSelected = currentInstrument?.id === inst.id;
                    return (
                      <div
                        key={inst.id}
                        onClick={() => onSelectInstrument(inst)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-950/60 border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                            : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-100 text-sm">{inst.title}</span>
                          {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                        </div>
                        <div className="text-xs font-mono text-slate-400">
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
          <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  2. Select Tuning for {currentInstrument?.title}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Easily switch tuning presets or lock custom notes on the fly
                </div>
              </div>

              {/* Tuning Selector Dropdown */}
              <select
                value={activeTuningId}
                onChange={(e) => handleSelectTuningForActive(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-cyan-300 font-mono font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-sm"
              >
                {Object.entries(groupedTuningsForCurrent).map(([category, tunings]) => (
                  <optgroup key={category} label={category} className="bg-slate-900 text-slate-300 font-bold">
                    {tunings.map(t => (
                      <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">
                        {t.name} ({t.tuning.join(' ')})
                      </option>
                    ))}
                  </optgroup>
                ))}
                <option value="custom" className="bg-slate-900 text-cyan-400 font-bold">
                  ⚙️ Custom Tuning (Manual Per-String)
                </option>
              </select>
            </div>

            {/* Display Active Tuning Info Card */}
            {currentMatchingPreset && activeTuningId !== 'custom' ? (
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    {currentMatchingPreset.name}
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                      {currentMatchingPreset.category}
                    </span>
                  </span>
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Preset Locked
                  </span>
                </div>

                {currentMatchingPreset.octaves && (
                  <div className="text-xs font-mono text-cyan-300 bg-cyan-950/40 p-2 rounded-lg border border-cyan-900/40">
                    <span className="text-slate-400 mr-2">Octaves:</span>
                    <strong className="text-white">{currentMatchingPreset.octaves}</strong>
                  </div>
                )}

                {currentMatchingPreset.description && (
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{currentMatchingPreset.description}"
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-3 flex items-center justify-between text-xs font-mono text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Unlock className="w-4 h-4 text-amber-400" /> Custom per-string tuning active
                </span>
                <span className="text-[11px] text-slate-400">Edit notes below</span>
              </div>
            )}

            {/* Per-String Note Display / Pickers */}
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>String Notes (Low Pitch to High Pitch)</span>
                {activeTuningId !== 'custom' && (
                  <span className="text-[10px] text-slate-500">
                    Switch tuning to "Custom Tuning" above to edit individual notes
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {(currentInstrument?.tuning || []).map((note, sIdx) => {
                  const displayStrNum = (currentInstrument?.stringCount || 6) - sIdx;
                  return (
                    <div key={sIdx} className="flex flex-col items-center">
                      <span className="text-[10px] font-mono text-slate-500 mb-1">
                        Str {displayStrNum}
                      </span>
                      {activeTuningId === 'custom' ? (
                        <select
                          value={note}
                          onChange={(e) => handleActiveStringNoteChange(sIdx, e.target.value)}
                          className="w-full bg-slate-900 border border-cyan-500/80 rounded-lg p-2 text-cyan-300 font-mono font-bold text-center text-sm focus:outline-none focus:border-cyan-400 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                        >
                          {CHROMATIC_SHARPS.map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-cyan-300 font-mono font-bold text-center text-sm">
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
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Instrument Profile Title</label>
            <input
              type="text"
              placeholder="e.g. My 8-String Djent Rig or Studio Bass"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                Number of Strings ({stringCount})
              </label>
              <input
                type="range"
                min="4"
                max="8"
                value={stringCount}
                onChange={(e) => setStringCount(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                Number of Frets ({fretCount})
              </label>
              <input
                type="range"
                min="12"
                max="24"
                value={fretCount}
                onChange={(e) => setFretCount(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs text-slate-400 font-mono space-y-1">
            <div className="text-cyan-400 font-bold flex items-center gap-1.5">
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
              className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              {saving ? 'Saving...' : 'Save & Select Instrument Profile'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
