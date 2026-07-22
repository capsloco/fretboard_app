import React, { useState } from 'react';
import { INSTRUMENT_PRESETS, CHROMATIC_SHARPS } from '../../lib/fretLogic';
import { Plus, Check, Music, Sliders, Trash2 } from 'lucide-react';
import { saveCustomInstrument } from '../../lib/supabase';

export default function InstrumentBuilder({
  currentInstrument,
  onSelectInstrument,
  userCustomInstruments = [],
  onInstrumentSaved
}) {
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'custom'
  
  // Custom Configurator state
  const [title, setTitle] = useState('');
  const [stringCount, setStringCount] = useState(6);
  const [fretCount, setFretCount] = useState(22);
  const [tuning, setTuning] = useState(['E', 'A', 'D', 'G', 'B', 'E']);
  const [saving, setSaving] = useState(false);

  // Handle string count change
  const handleStringCountChange = (newCount) => {
    const count = parseInt(newCount, 10);
    setStringCount(count);
    let newTuning = [...tuning];
    if (count > newTuning.length) {
      // Add default 'E' for extra strings
      while (newTuning.length < count) {
        newTuning.push('E');
      }
    } else {
      newTuning = newTuning.slice(0, count);
    }
    setTuning(newTuning);
  };

  // Handle tuning change for individual string
  const handleTuningChange = (stringIndex, newNote) => {
    const updated = [...tuning];
    updated[stringIndex] = newNote;
    setTuning(updated);
  };

  const handleSaveCustom = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    const customObj = {
      title: title.trim(),
      stringCount,
      fretCount,
      tuning
    };

    const saved = await saveCustomInstrument(customObj);
    setSaving(false);
    
    if (saved) {
      if (onInstrumentSaved) onInstrumentSaved(saved);
      onSelectInstrument(saved);
      setTitle('');
      setActiveTab('presets');
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-6">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Music className="w-5 h-5 text-cyan-400" />
          Instrument Setup
        </h3>
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'presets'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Presets
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'custom'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            + Create Custom
          </button>
        </div>
      </div>

      {activeTab === 'presets' ? (
        <div className="space-y-4">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Standard Presets
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {INSTRUMENT_PRESETS.map((preset) => {
              const isSelected = currentInstrument?.id === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => onSelectInstrument(preset)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-100 text-sm">{preset.title}</span>
                    {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <span>{preset.stringCount} Strings</span>
                    <span>•</span>
                    <span>{preset.fretCount} Frets</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1 overflow-x-auto">
                    <span className="text-[10px] font-mono text-slate-500 mr-1">Tuning:</span>
                    {preset.tuning.map((n, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 text-xs font-mono font-bold">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* User Custom Saved Instruments */}
          {userCustomInstruments.length > 0 && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Your Saved Custom Setups
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
                      <div className="mt-2 flex gap-1">
                        {inst.tuning.map((n, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 text-xs font-mono font-bold">
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Custom Builder Form */
        <form onSubmit={handleSaveCustom} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Setup Title</label>
            <input
              type="text"
              placeholder="e.g. 7-String Drop A or Open D"
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
                onChange={(e) => handleStringCountChange(e.target.value)}
                className="w-full accent-cyan-500"
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
                className="w-full accent-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
              Individual String Tunings (Low Pitch to High Pitch)
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {tuning.map((note, sIdx) => (
                <div key={sIdx} className="flex flex-col items-center">
                  <span className="text-[10px] font-mono text-slate-500 mb-1">
                    Str {tuning.length - sIdx}
                  </span>
                  <select
                    value={note}
                    onChange={(e) => handleTuningChange(sIdx, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-cyan-300 font-mono font-bold text-center text-sm focus:outline-none focus:border-cyan-500"
                  >
                    {CHROMATIC_SHARPS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              {saving ? 'Saving...' : 'Save & Select Custom Instrument'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
