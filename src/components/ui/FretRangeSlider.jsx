import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

export default function FretRangeSlider({ minFret, maxFret, onChangeMin, onChangeMax, maxInstrumentFrets = 24 }) {
  const quickPresets = [
    { label: 'Open Position (0–5)', min: 0, max: 5 },
    { label: 'Mid Neck (5–12)', min: 5, max: 12 },
    { label: 'Upper Frets (12–24)', min: 12, max: maxInstrumentFrets },
    { label: 'Full Fretboard (0–24)', min: 0, max: maxInstrumentFrets },
  ];

  return (
    <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
          Fret Range Boundaries
        </label>
        <span className="text-xs font-mono text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
          Frets {minFret} – {maxFret}
        </span>
      </div>

      {/* Quick Boundary Preset Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {quickPresets.map((preset, idx) => {
          const isActive = minFret === preset.min && maxFret === preset.max;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onChangeMin(preset.min);
                onChangeMax(preset.max);
              }}
              className={`py-1.5 px-2 rounded-xl text-xs font-semibold font-mono transition-all ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Dual Sliders */}
      <div className="grid grid-cols-2 gap-4 pt-1">
        <div>
          <span className="text-[10px] font-mono text-slate-500">Min Fret ({minFret})</span>
          <input
            type="range"
            min="0"
            max={maxFret}
            value={minFret}
            onChange={(e) => onChangeMin(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-500"
          />
        </div>
        <div>
          <span className="text-[10px] font-mono text-slate-500">Max Fret ({maxFret})</span>
          <input
            type="range"
            min={minFret}
            max={maxInstrumentFrets}
            value={maxFret}
            onChange={(e) => onChangeMax(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-500"
          />
        </div>
      </div>
    </div>
  );
}
