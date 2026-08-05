import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

export default function FretRangeSlider({ minFret, maxFret, onChangeMin, onChangeMax, maxInstrumentFrets = 24 }) {
  const quickPresets = [
    { label: 'Open (0–5)', min: 0, max: 5 },
    { label: 'Mid (5–12)', min: 5, max: 12 },
    { label: 'Upper (12–24)', min: 12, max: maxInstrumentFrets },
    { label: 'Full (0–24)', min: 0, max: maxInstrumentFrets },
  ];

  return (
    <div className="bg-base-200 border border-base-300 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <label htmlFor="min-fret-slider" className="text-xs font-mono text-base-content/70 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
          <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
          Fret Range Boundaries
        </label>
        <span className="badge badge-primary font-mono text-xs font-bold">
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
              className={`btn btn-xs font-mono font-bold ${
                isActive
                  ? 'btn-primary'
                  : 'btn-ghost'
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
          <label htmlFor="min-fret-slider" className="text-[10px] font-mono text-base-content/70 block mb-1">
            Min Fret ({minFret})
          </label>
          <input
            id="min-fret-slider"
            aria-label="Minimum fret boundary"
            type="range"
            min="0"
            max={maxFret}
            value={minFret}
            onChange={(e) => onChangeMin(parseInt(e.target.value, 10))}
            className="range range-primary range-xs"
          />
        </div>
        <div>
          <label htmlFor="max-fret-slider" className="text-[10px] font-mono text-base-content/70 block mb-1">
            Max Fret ({maxFret})
          </label>
          <input
            id="max-fret-slider"
            aria-label="Maximum fret boundary"
            type="range"
            min={minFret}
            max={maxInstrumentFrets}
            value={maxFret}
            onChange={(e) => onChangeMax(parseInt(e.target.value, 10))}
            className="range range-primary range-xs"
          />
        </div>
      </div>
    </div>
  );
}
