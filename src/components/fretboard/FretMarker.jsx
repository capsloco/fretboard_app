import React from 'react';

/**
 * Returns whether a fret number gets single or double inlay markers
 */
export function getFretMarkerType(fret) {
  if (fret === 12 || fret === 24) return 'double';
  if ([3, 5, 7, 9, 15, 17, 19, 21].includes(fret)) return 'single';
  return null;
}

export default function FretMarker() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60 z-0">
      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-base-content/40 border border-base-content/60 shadow-sm" />
    </div>
  );
}
