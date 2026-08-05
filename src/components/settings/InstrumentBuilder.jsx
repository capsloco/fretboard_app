import React, { useState, useRef, useEffect } from 'react';
import {
  INSTRUMENT_PRESETS,
  TUNING_PRESETS,
  CHROMATIC_SHARPS,
  getTuningsForInstrument,
  groupTuningsByCategory,
  findMatchingTuningPreset
} from '../../lib/fretLogic';
import { Check, Music, Lock, Unlock, Zap, ChevronDown } from 'lucide-react';
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

  // Dropdown states for custom UI
  const [isTuningDropdownOpen, setIsTuningDropdownOpen] = useState(false);
  const [openStringIdx, setOpenStringIdx] = useState(null);
  const tuningDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (tuningDropdownRef.current && !tuningDropdownRef.current.contains(event.target)) {
        setIsTuningDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <div className="space-y-6">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base-200 pb-4">
        <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          Instrument & Tuning Manager
        </h3>
        <div className="flex bg-base-200 p-1 rounded-xl border border-base-300 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            className={activeTab === 'profiles' ? 'btn btn-xs btn-primary font-bold' : 'btn btn-xs btn-ghost font-bold'}
          >
            Base Profiles & Tunings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={activeTab === 'custom' ? 'btn btn-xs btn-primary font-bold' : 'btn btn-xs btn-ghost font-bold'}
          >
            + Create Custom Instrument
          </button>
        </div>
      </div>

      {activeTab === 'profiles' ? (
        <div className="space-y-6">
          {/* Step 1: Base Instrument Profile Selection */}
          <fieldset className="fieldset bg-base-200/40 border border-base-300 rounded-box p-4 space-y-3">
            <legend className="fieldset-legend flex items-center justify-between w-full font-mono text-xs uppercase tracking-wider text-base-content/80 font-bold">
              <span>1. Choose Base Instrument Profile</span>
              <span className="text-primary font-bold">
                Active: {currentInstrument?.title}
              </span>
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
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
                    className={isSelected ? 'card bg-base-200 border-2 border-primary p-4 cursor-pointer transition-colors shadow-md' : 'card bg-base-100 border border-base-300 p-4 cursor-pointer transition-colors hover:border-base-content/40'}
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
                        className={isSelected ? 'card bg-base-200 border-2 border-primary p-4 cursor-pointer transition-colors shadow-md' : 'card bg-base-100 border border-base-300 p-4 cursor-pointer transition-colors hover:border-base-content/40'}
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
          </fieldset>

          {/* Step 2: On-The-Fly Tuning Selector & Details */}
          <fieldset className="fieldset bg-base-200/50 border border-base-300 rounded-box p-5 space-y-4 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base-300 pb-3">
              <div>
                <legend className="fieldset-legend font-mono text-xs uppercase tracking-wider text-base-content/80 font-bold flex items-center gap-1.5 p-0">
                  <Zap className="w-4 h-4 text-primary" /> 2. Select Tuning for {currentInstrument?.title}
                </legend>
                <p className="label text-[11px] text-base-content/70 p-0 mt-0.5">
                  Easily switch tuning presets or lock custom notes on the fly
                </p>
              </div>

              {/* Custom daisyUI Tuning Selector Dropdown */}
              <div className="relative" ref={tuningDropdownRef}>
                <button
                  type="button"
                  id="tuning-preset-selector"
                  aria-label="Select tuning preset"
                  onClick={() => setIsTuningDropdownOpen(!isTuningDropdownOpen)}
                  className="btn btn-sm bg-base-100 hover:bg-base-200 border border-base-300 text-base-content font-mono font-bold flex items-center justify-between gap-2 shadow-sm min-w-[200px]"
                >
                  <span className="truncate">
                    {activeTuningId === 'custom'
                      ? '⚙️ Custom Tuning'
                      : currentMatchingPreset
                      ? `${currentMatchingPreset.name} (${currentMatchingPreset.tuning.join(' ')})`
                      : 'Select Tuning'}
                  </span>
                  <ChevronDown className={isTuningDropdownOpen ? 'w-4 h-4 text-primary transition-transform rotate-180 shrink-0' : 'w-4 h-4 text-primary transition-transform shrink-0'} />
                </button>

                {isTuningDropdownOpen && (
                  <div className="absolute right-0 mt-2 z-50 w-72 sm:w-80 bg-base-100 border border-base-300 rounded-2xl shadow-2xl p-2 max-h-72 overflow-y-auto space-y-3">
                    {Object.entries(groupedTuningsForCurrent).map(([category, tunings]) => (
                      <div key={category} className="space-y-1">
                        <div className="text-[10px] font-bold text-primary uppercase font-mono px-2 py-1 tracking-wider bg-base-200/60 rounded-lg">
                          {category}
                        </div>
                        {tunings.map((t) => {
                          const isSelected = activeTuningId === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                handleSelectTuningForActive(t.id);
                                setIsTuningDropdownOpen(false);
                              }}
                              className={isSelected ? 'btn btn-sm btn-primary justify-between w-full font-mono text-xs shadow-sm' : 'btn btn-sm btn-ghost justify-between w-full font-mono text-xs border border-base-200/80 hover:bg-base-200 text-base-content'}
                            >
                              <span className="font-bold truncate">{t.name}</span>
                              <span className="text-[11px] opacity-80 shrink-0">({t.tuning.join(' ')})</span>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                    <div className="pt-1 border-t border-base-200">
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectTuningForActive('custom');
                          setIsTuningDropdownOpen(false);
                        }}
                        className={activeTuningId === 'custom' ? 'btn btn-sm btn-primary justify-start w-full font-mono text-xs shadow-sm' : 'btn btn-sm btn-ghost justify-start w-full font-mono text-xs border border-base-200/80 hover:bg-base-200 text-base-content'}
                      >
                        ⚙️ Custom Tuning (Manual Per-String)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Display Active Tuning Info Card */}
            {currentMatchingPreset && activeTuningId !== 'custom' ? (
              <div className="card bg-base-100 border border-base-300 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-base-content">
                    {currentMatchingPreset.name}
                  </span>
                  <span className="text-xs font-mono text-success flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Preset Active
                  </span>
                </div>

                {currentMatchingPreset.octaves && (
                  <div className="text-xs font-mono text-base-content/80 bg-base-200 p-2 rounded-lg border border-base-300">
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
              <div className="badge badge-warning badge-outline w-full justify-between py-3 px-4 rounded-xl text-xs font-mono">
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
                        <div className="relative w-full">
                          <button
                            type="button"
                            aria-label={`String ${displayStrNum} note selector`}
                            onClick={() => setOpenStringIdx(openStringIdx === sIdx ? null : sIdx)}
                            className="btn btn-xs btn-primary border border-base-300 w-full font-mono font-bold flex items-center justify-center gap-0.5 shadow-sm"
                          >
                            <span>{note}</span>
                            <ChevronDown className="w-3 h-3 shrink-0" />
                          </button>

                          {openStringIdx === sIdx && (
                            <div className="absolute left-1/2 -translate-x-1/2 mt-1 z-50 w-24 bg-base-100 border border-base-300 rounded-xl shadow-2xl p-1.5 grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                              {CHROMATIC_SHARPS.map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => {
                                    handleActiveStringNoteChange(sIdx, n);
                                    setOpenStringIdx(null);
                                  }}
                                  className={note === n ? 'btn btn-xs btn-primary font-mono font-bold w-full' : 'btn btn-xs btn-ghost font-mono font-bold hover:bg-base-200 w-full text-base-content'}
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
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
          </fieldset>
        </div>
      ) : (
        /* Custom Builder Form */
        <form onSubmit={handleSaveCustom} className="space-y-5">
          <fieldset className="fieldset bg-base-200/40 border border-base-300 rounded-box p-4 space-y-4">
            <legend className="fieldset-legend font-mono text-xs uppercase tracking-wider text-base-content/80 font-bold">
              Custom Instrument Setup
            </legend>

            <div>
              <label htmlFor="inst-profile-title" className="label text-xs font-mono text-base-content/80 uppercase mb-1 cursor-pointer block">Instrument Profile Title</label>
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
                <label htmlFor="custom-string-count" className="label text-xs font-mono text-base-content/80 uppercase mb-1 cursor-pointer block">
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
                <label htmlFor="custom-fret-count" className="label text-xs font-mono text-base-content/80 uppercase mb-1 cursor-pointer block">
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

            <div className="p-4 bg-base-100 border border-base-300 rounded-2xl text-xs text-base-content/70 font-mono space-y-1">
              <div className="text-primary font-bold flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> Dynamic Tuning Management
              </div>
              <p>
                Tuning presets and custom string notes can be selected or edited anytime using the Tuning Selector once your instrument is saved!
              </p>
            </div>
          </fieldset>

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
