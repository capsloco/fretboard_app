import React from 'react';

export default function FretRangeSlider({ minFret, maxFret, onChangeMin, onChangeMax, maxInstrumentFrets = 24 }) {
  const presets = [
    { label: 'Open', min: 0, max: 5 },
    { label: 'Middle', min: 5, max: 12 },
    { label: 'Upper', min: 12, max: maxInstrumentFrets },
    { label: 'Whole neck', min: 0, max: maxInstrumentFrets }
  ];

  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend font-display uppercase tracking-[0.15em] text-sm">
        Fret range <span className="badge badge-neutral font-display tabular-nums ml-2">{minFret}–{maxFret}</span>
      </legend>

      <div className="join w-full flex-wrap" role="group" aria-label="Fret range presets">
        {presets.map(preset => {
          const isActive = minFret === preset.min && maxFret === preset.max;
          return (
            <button
              key={preset.label}
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                onChangeMin(preset.min);
                onChangeMax(preset.max);
              }}
              className={`join-item btn btn-sm flex-1 font-display uppercase tracking-wider ${isActive ? 'btn-neutral' : ''}`}
            >
              {preset.label}
              <span className="opacity-60 tabular-nums normal-case">{preset.min}–{preset.max}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm">Lowest fret: <strong className="tabular-nums">{minFret}</strong></span>
          <input
            type="range"
            min="0"
            max={maxFret}
            value={minFret}
            onChange={(e) => onChangeMin(parseInt(e.target.value, 10))}
            className="range range-sm range-primary"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Highest fret: <strong className="tabular-nums">{maxFret}</strong></span>
          <input
            type="range"
            min={minFret}
            max={maxInstrumentFrets}
            value={maxFret}
            onChange={(e) => onChangeMax(parseInt(e.target.value, 10))}
            className="range range-sm range-primary"
          />
        </label>
      </div>
    </fieldset>
  );
}
