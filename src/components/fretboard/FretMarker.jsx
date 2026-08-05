import React from 'react';

/**
 * Returns whether a fret number gets single or double inlay markers
 */
export function getFretMarkerType(fret) {
  if (fret === 12 || fret === 24) return 'double';
  if ([3, 5, 7, 9, 15, 17, 19, 21].includes(fret)) return 'single';
  return null;
}

export default function FretMarker({ isLightWood = false }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80 z-0">
      <div
        className={
          isLightWood
            ? 'w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-stone-700/80 border border-stone-900/40 shadow-inner'
            : 'w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gradient-to-tr from-slate-300 via-white to-slate-200 border border-slate-400/50 shadow-[0_0_6px_rgba(255,255,255,0.4)]'
        }
      />
    </div>
  );
}
