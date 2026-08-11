// Pure stats aggregation/bucketing helpers — no I/O (mirrors fretLogic.js's split from supabase.js)

export const ACCURACY_RANGES = [
  { key: '7d', label: '7D', days: 7 },
  { key: '30d', label: '30D', days: 30 },
  { key: '90d', label: '90D', days: 90 },
  { key: '180d', label: '180D', days: 180 },
  { key: '1y', label: '1Y', days: 365 },
  { key: 'max', label: 'Max', days: Infinity }
];

/**
 * Filter session accuracy rows down to a given range key, oldest first.
 */
export function bucketAccuracyByRange(sessions, rangeKey) {
  const range = ACCURACY_RANGES.find((r) => r.key === rangeKey) || ACCURACY_RANGES[ACCURACY_RANGES.length - 1];
  const cutoff = range.days === Infinity ? 0 : Date.now() - range.days * 86400000;

  return sessions
    .filter((s) => new Date(s.createdAt).getTime() >= cutoff)
    .map((s) => ({
      date: s.createdAt,
      accuracyPct: s.accuracyPct
    }));
}

/**
 * Group per-attempt rows by target note, sorted weakest-accuracy first.
 */
export function groupWeakNotes(attempts) {
  const byNote = new Map();

  attempts.forEach(({ note, isCorrect }) => {
    if (!byNote.has(note)) byNote.set(note, { note, attempts: 0, correct: 0 });
    const entry = byNote.get(note);
    entry.attempts += 1;
    if (isCorrect) entry.correct += 1;
  });

  return Array.from(byNote.values())
    .map((entry) => ({
      ...entry,
      accuracyPct: entry.attempts > 0 ? Math.round((entry.correct / entry.attempts) * 100) : 0
    }))
    .sort((a, b) => a.accuracyPct - b.accuracyPct);
}
