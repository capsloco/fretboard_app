import React, { useId } from 'react';
import { Minus, Plus } from 'lucide-react';
import { sensitivityToGateDb } from '../../hooks/usePitchListener';

const MIN = 1;
const MAX = 10;
// Fine steps, so the threshold can sit just above fret buzz and just below a normal pluck
const STEP = 0.1;
const RANGE_SIZE = { xs: 'range-xs', sm: 'range-sm' };

const clamp = (value) => Math.round(Math.min(MAX, Math.max(MIN, value)) / STEP) * STEP;

/**
 * Mic sensitivity 1-10 in 0.1 steps: drag for big moves, − / + (or the arrow keys) to fine-tune.
 * Lower numbers need a louder note before the mic reacts.
 */
export default function SensitivityControl({ value, onChange, label = 'Sensitivity', size = 'sm', className = '', labelClassName = '' }) {
  const labelId = useId();
  const set = (next) => onChange(Number(clamp(next).toFixed(1)));
  const shown = Number(value).toFixed(1);
  const nudge = `btn btn-ghost btn-square ${size === 'xs' ? 'btn-xs' : 'btn-sm'}`;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span id={labelId} className={`shrink-0 mr-1 ${labelClassName}`}>{label}</span>
      <button type="button" className={nudge} onClick={() => set(value - STEP)} disabled={value <= MIN} aria-label="Less sensitive">
        <Minus className="size-3.5" />
      </button>
      <input
        type="range"
        min={MIN}
        max={MAX}
        step={STEP}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        className={`range range-primary flex-1 min-w-16 ${RANGE_SIZE[size]}`}
        aria-labelledby={labelId}
        aria-valuetext={`${shown}: ignores sound under ${Math.round(sensitivityToGateDb(value))} dB`}
      />
      <button type="button" className={nudge} onClick={() => set(value + STEP)} disabled={value >= MAX} aria-label="More sensitive">
        <Plus className="size-3.5" />
      </button>
      <span className="tabular-nums w-8 text-right">{shown}</span>
    </div>
  );
}
