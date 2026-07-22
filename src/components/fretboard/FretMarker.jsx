import React from 'react';

/**
 * Returns whether a fret number gets single or double inlay markers
 */
export function getFretMarkerType(fret) {
  if (fret === 12 || fret === 24) return 'double';
  if ([3, 5, 7, 9, 15, 17, 19, 21].includes(fret)) return 'single';
  return null;
}

export default function FretMarker({ fret }) {
  const markerType = getFretMarkerType(fret);

  if (!markerType) return null;

  if (markerType === 'double') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-around py-3 pointer-events-none opacity-40">
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gradient-to-tr from-cyan-400 to-sky-200 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gradient-to-tr from-cyan-400 to-sky-200 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gradient-to-tr from-cyan-400 to-sky-200 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
    </div>
  );
}
