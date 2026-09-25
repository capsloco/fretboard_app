export function formatDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/** Time to find a note, e.g. 2140 -> '2.1s' */
export function formatResponseTime(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}
