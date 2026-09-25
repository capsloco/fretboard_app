// Pure stats aggregation/bucketing helpers — no I/O (mirrors fretLogic.js's split from supabase.js)
import { getNoteIndex, formatNoteName } from './fretLogic';

export const ACCURACY_RANGES = [
  { key: '7d', label: '7D', days: 7 },
  { key: '30d', label: '30D', days: 30 },
  { key: '90d', label: '90D', days: 90 },
  { key: '180d', label: '180D', days: 180 },
  { key: '1y', label: '1Y', days: 365 },
  { key: 'max', label: 'Max', days: Infinity }
];

// A note needs this many answers before it can be called weak or mastered
export const MIN_ATTEMPTS_FOR_VERDICT = 3;
export const MASTERED_ACCURACY_PCT = 85;
export const MAX_FOCUS_NOTES = 4;

/**
 * Filter session accuracy rows down to a given range key, oldest first.
 * Rounds with no answers are left out: they have no accuracy to plot.
 */
export function bucketAccuracyByRange(sessions, rangeKey) {
  const range = ACCURACY_RANGES.find((r) => r.key === rangeKey) || ACCURACY_RANGES[ACCURACY_RANGES.length - 1];
  const cutoff = range.days === Infinity ? 0 : Date.now() - range.days * 86400000;

  return sessions
    .filter((s) => s.totalPrompts !== 0 && new Date(s.createdAt).getTime() >= cutoff)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((s) => ({
      date: s.createdAt,
      accuracyPct: Number(s.accuracyPct)
    }));
}

/**
 * Lifetime totals across every saved round.
 */
export function summarizeSessions(sessions) {
  let totalPrompts = 0;
  let totalCorrect = 0;
  let totalPracticeSeconds = 0;
  let bestStreak = 0;
  const days = new Set();

  sessions.forEach((s) => {
    totalPrompts += s.totalPrompts || 0;
    totalCorrect += s.correctCount || 0;
    totalPracticeSeconds += s.durationSeconds || 0;
    bestStreak = Math.max(bestStreak, s.bestStreak || 0);
    if (s.createdAt) days.add(new Date(s.createdAt).toDateString());
  });

  return {
    totalSessions: sessions.length,
    totalPrompts,
    totalPracticeSeconds,
    lifetimeAccuracyPct: totalPrompts > 0 ? Math.round((totalCorrect / totalPrompts) * 100) : 0,
    bestStreak,
    daysPractised: days.size
  };
}

/** Miss rate with one imaginary hit and miss added, so 0/1 isn't "100% weak" and 1/1 isn't "mastered" */
export function smoothedMissRate(misses, attempts) {
  return (misses + 1) / (attempts + 2);
}

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * 'untried' | 'learning' | 'mastered' for a note's (or string's) record
 */
export function masteryLevel({ attempts, accuracyPct }) {
  if (attempts === 0) return 'untried';
  if (attempts >= MIN_ATTEMPTS_FOR_VERDICT && accuracyPct >= MASTERED_ACCURACY_PCT) return 'mastered';
  return 'learning';
}

/**
 * Per-note record for all twelve pitch classes, in chromatic order from C.
 * C# and D♭ are the same note, so they share a record whatever the spelling was.
 * `medianResponseMs` is the typical time to find the note, from correct answers only.
 */
export function buildNoteStats(attempts, noteDisplay = 'sharps') {
  const records = Array.from({ length: 12 }, (_, pitchClass) => ({
    pitchClass,
    note: formatNoteName(pitchClass, noteDisplay),
    attempts: 0,
    correct: 0,
    times: []
  }));

  attempts.forEach(({ note, isCorrect, responseTimeMs }) => {
    if (!note) return;
    const record = records[getNoteIndex(note)];
    record.attempts += 1;
    if (isCorrect) {
      record.correct += 1;
      if (responseTimeMs > 0) record.times.push(responseTimeMs);
    }
  });

  return records.map(({ times, ...record }) => {
    const accuracyPct = record.attempts > 0 ? Math.round((record.correct / record.attempts) * 100) : 0;
    const withAccuracy = { ...record, accuracyPct, medianResponseMs: median(times) };
    return { ...withAccuracy, level: masteryLevel(withAccuracy) };
  });
}

/**
 * Notes worth drilling, weakest first: enough answers to judge, and not yet mastered.
 * Returns note records from buildNoteStats().
 */
export function pickFocusNotes(noteStats, max = MAX_FOCUS_NOTES) {
  return noteStats
    .filter((n) => n.attempts >= MIN_ATTEMPTS_FOR_VERDICT && n.level !== 'mastered')
    .sort((a, b) =>
      smoothedMissRate(b.attempts - b.correct, b.attempts) - smoothedMissRate(a.attempts - a.correct, a.attempts)
      || b.attempts - a.attempts)
    .slice(0, max);
}

/**
 * Prompt weights by pitch class (0-11) for adaptive rounds: 1 for a note you always
 * get, up to 3 for one you keep missing. Notes you've never tried sit in the middle.
 */
export function buildNoteWeights(attempts) {
  const misses = new Array(12).fill(0);
  const totals = new Array(12).fill(0);
  attempts.forEach(({ note, isCorrect }) => {
    if (!note) return;
    const pc = getNoteIndex(note);
    totals[pc] += 1;
    if (!isCorrect) misses[pc] += 1;
  });
  return totals.map((total, pc) => 1 + 2 * smoothedMissRate(misses[pc], total));
}

/**
 * Accuracy per string, from string prompts only ("find C on the A string").
 * Strings are told apart by number and open note, so string 6 (E) on a guitar and
 * string 4 (E) on a bass are separate rows.
 */
export function buildStringStats(attempts) {
  const byString = new Map();

  attempts.forEach(({ promptType, stringDisplayNumber, stringOpenNote, isCorrect }) => {
    if (promptType !== 'string_specific' || stringDisplayNumber == null || !stringOpenNote) return;
    const key = `${stringDisplayNumber}:${getNoteIndex(stringOpenNote)}`;
    if (!byString.has(key)) {
      byString.set(key, { key, stringNumber: stringDisplayNumber, openNote: stringOpenNote, attempts: 0, correct: 0 });
    }
    const record = byString.get(key);
    record.attempts += 1;
    if (isCorrect) record.correct += 1;
  });

  return [...byString.values()]
    .map((record) => {
      const accuracyPct = Math.round((record.correct / record.attempts) * 100);
      return { ...record, accuracyPct, level: masteryLevel({ attempts: record.attempts, accuracyPct }) };
    })
    .sort((a, b) => a.stringNumber - b.stringNumber || getNoteIndex(a.openNote) - getNoteIndex(b.openNote));
}

/**
 * How one flashcard went: 'clean' (right note, first try, no peeking), 'slipped' (right note, but after a
 * wrong note or a look at the neck) or 'missed' (time ran out, or skipped with "missed" / M).
 */
export function flashcardOutcome(attempt) {
  if (!attempt.isCorrect) return 'missed';
  return attempt.wrongNotesHeard?.length || attempt.peeked ? 'slipped' : 'clean';
}

/**
 * Recap of a flashcard round from App's answer records, one per card that was finished.
 * `toWorkOn` holds notes with a miss or a slip (most missed first), `solid` the notes found first try every time.
 * `avgFindMs` is the average time to find a note, from found cards only.
 */
export function summarizeFlashcardRound(attempts) {
  const counts = { clean: 0, slipped: 0, missed: 0 };
  const findTimes = [];
  const byNote = new Map();

  attempts.forEach((a) => {
    if (!a.targetNote) return;
    const outcome = flashcardOutcome(a);
    counts[outcome] += 1;
    if (outcome !== 'missed' && a.responseTimeMs > 0) findTimes.push(a.responseTimeMs);

    const pitchClass = getNoteIndex(a.targetNote);
    const record = byNote.get(pitchClass) ?? {
      pitchClass, note: a.targetNote, shown: 0, clean: 0, slipped: 0, missed: 0, timedOut: 0, peeked: 0, heard: []
    };
    record.shown += 1;
    record[outcome] += 1;
    if (a.inputSource === 'timeout') record.timedOut += 1;
    if (a.peeked) record.peeked += 1;
    (a.wrongNotesHeard ?? []).forEach((label) => {
      if (!record.heard.includes(label)) record.heard.push(label);
    });
    byNote.set(pitchClass, record);
  });

  const notes = [...byNote.values()];
  return {
    cards: counts.clean + counts.slipped + counts.missed,
    found: counts.clean + counts.slipped,
    ...counts,
    avgFindMs: findTimes.length ? Math.round(findTimes.reduce((sum, t) => sum + t, 0) / findTimes.length) : null,
    toWorkOn: notes
      .filter((n) => n.missed + n.slipped > 0)
      .sort((a, b) => b.missed - a.missed || b.slipped - a.slipped || b.shown - a.shown),
    solid: notes.filter((n) => n.clean === n.shown).sort((a, b) => a.pitchClass - b.pitchClass)
  };
}
