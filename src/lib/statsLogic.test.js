import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  bucketAccuracyByRange,
  buildNoteStats,
  buildNoteWeights,
  buildStringStats,
  pickFocusNotes,
  summarizeSessions
} from './statsLogic';
import { generatePrompt, getNoteIndex, INSTRUMENT_PRESETS } from './fretLogic';
import { loadPracticeHistory, recordRound, clearDeviceHistory, withSavedRound } from './practiceHistory';

const answers = (note, correct, missed, extra = {}) => [
  ...Array.from({ length: correct }, () => ({ note, isCorrect: true, responseTimeMs: 2000, ...extra })),
  ...Array.from({ length: missed }, () => ({ note, isCorrect: false, responseTimeMs: 5000, ...extra }))
];

describe('buildNoteStats', () => {
  it('returns all twelve notes and counts enharmonic spellings as one note', () => {
    const stats = buildNoteStats([...answers('C#', 1, 1), ...answers('D♭', 2, 0)]);
    expect(stats).toHaveLength(12);
    expect(stats[1]).toMatchObject({ note: 'C#', attempts: 4, correct: 3, accuracyPct: 75 });
    expect(stats[0]).toMatchObject({ note: 'C', attempts: 0, level: 'untried' });
  });

  it('labels notes in the chosen spelling', () => {
    expect(buildNoteStats([], 'flats')[1].note).toBe('D♭');
    expect(buildNoteStats([], 'both')[1].note).toBe('C#/D♭');
  });

  it('takes the typical find time from correct answers only', () => {
    const stats = buildNoteStats([
      { note: 'E', isCorrect: true, responseTimeMs: 1000 },
      { note: 'E', isCorrect: true, responseTimeMs: 3000 },
      { note: 'E', isCorrect: true, responseTimeMs: 90000 },
      { note: 'E', isCorrect: false, responseTimeMs: 100 }
    ]);
    expect(stats[4].medianResponseMs).toBe(3000);
  });

  it('only calls a note known after enough answers', () => {
    const stats = buildNoteStats([...answers('A', 2, 0), ...answers('B', 5, 0)]);
    expect(stats[9].level).toBe('learning');
    expect(stats[11].level).toBe('mastered');
  });
});

describe('pickFocusNotes', () => {
  it('ranks by missed share, trusting notes with more answers', () => {
    const stats = buildNoteStats([
      ...answers('F', 2, 8), // 20%
      ...answers('B', 1, 2), // 33%, few answers
      ...answers('G', 6, 4), // 60%
      ...answers('E', 10, 0), // known
      ...answers('A', 0, 2) // too few answers to judge
    ]);
    expect(pickFocusNotes(stats).map(n => n.note)).toEqual(['F', 'B', 'G']);
  });

  it('caps the number of notes', () => {
    const stats = buildNoteStats(['C', 'D', 'E', 'F', 'G', 'A'].flatMap(n => answers(n, 1, 3)));
    expect(pickFocusNotes(stats, 4)).toHaveLength(4);
  });
});

describe('buildNoteWeights', () => {
  it('weights missed notes above known ones, with new notes in between', () => {
    const weights = buildNoteWeights([...answers('F', 0, 6), ...answers('E', 10, 0)]);
    expect(weights).toHaveLength(12);
    expect(weights[5]).toBeGreaterThan(weights[0]);
    expect(weights[0]).toBeGreaterThan(weights[4]);
    weights.forEach(w => {
      expect(w).toBeGreaterThanOrEqual(1);
      expect(w).toBeLessThanOrEqual(3);
    });
  });
});

describe('buildStringStats', () => {
  it('groups string prompts by string and ignores anywhere prompts', () => {
    const stats = buildStringStats([
      ...answers('C', 1, 1, { promptType: 'string_specific', stringDisplayNumber: 5, stringOpenNote: 'A' }),
      ...answers('C', 3, 0, { promptType: 'string_specific', stringDisplayNumber: 1, stringOpenNote: 'E' }),
      ...answers('C', 5, 0, { promptType: 'global' })
    ]);
    expect(stats.map(s => [s.stringNumber, s.openNote, s.accuracyPct])).toEqual([[1, 'E', 100], [5, 'A', 50]]);
  });
});

describe('session summaries', () => {
  const sessions = [
    { createdAt: new Date().toISOString(), totalPrompts: 10, correctCount: 8, durationSeconds: 60, bestStreak: 5, accuracyPct: 80 },
    { createdAt: new Date().toISOString(), totalPrompts: 0, correctCount: 0, durationSeconds: 5, bestStreak: 0, accuracyPct: 0 },
    { createdAt: '2020-01-01T12:00:00Z', totalPrompts: 10, correctCount: 4, durationSeconds: 90, bestStreak: 3, accuracyPct: 40 }
  ];

  it('totals every round', () => {
    expect(summarizeSessions(sessions)).toEqual({
      totalSessions: 3,
      totalPrompts: 20,
      totalPracticeSeconds: 155,
      lifetimeAccuracyPct: 60,
      bestStreak: 5,
      daysPractised: 2
    });
  });

  it('charts rounds oldest first, skipping empty ones', () => {
    expect(bucketAccuracyByRange(sessions, 'max').map(p => p.accuracyPct)).toEqual([40, 80]);
    expect(bucketAccuracyByRange(sessions, '7d').map(p => p.accuracyPct)).toEqual([80]);
  });
});

describe('generatePrompt with focus notes and weights', () => {
  const guitar = INSTRUMENT_PRESETS[0];

  it('only asks focus notes, in the chosen spelling', () => {
    for (let i = 0; i < 50; i++) {
      const prompt = generatePrompt({ instrument: guitar, focusNotes: [1, 5], noteDisplay: 'flats' });
      expect(['D♭', 'F']).toContain(prompt.note);
    }
  });

  it('asks a single focus note every time', () => {
    const prompt = generatePrompt({ instrument: guitar, focusNotes: [6], previousNote: 'F#', promptType: 'string_specific' });
    expect(getNoteIndex(prompt.note)).toBe(6);
    expect(prompt.targetFrets.length).toBeGreaterThan(0);
  });

  it('favours heavily weighted notes', () => {
    const weights = new Array(12).fill(0);
    weights[7] = 1; // only G
    for (let i = 0; i < 20; i++) {
      expect(generatePrompt({ instrument: guitar, noteWeights: weights }).note).toBe('G');
    }
  });
});

describe('device practice history', () => {
  beforeEach(() => {
    const store = new Map();
    vi.stubGlobal('localStorage', {
      getItem: key => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: key => store.delete(key)
    });
  });

  const round = { instrumentName: '6-String Guitar', sessionType: 'tracked', promptType: 'global', totalPrompts: 2, correctCount: 1, accuracyPct: 50 };
  const roundAttempts = [
    { targetNote: 'C', promptType: 'global', isCorrect: true, responseTimeMs: 1200, inputSource: 'mic' },
    { targetNote: 'F', promptType: 'global', isCorrect: false, responseTimeMs: 4000, inputSource: 'mic' }
  ];

  it('saves rounds without an account and reads them back newest first', async () => {
    const first = await recordRound(round, roundAttempts);
    await recordRound({ ...round, accuracyPct: 100 }, roundAttempts.slice(0, 1));

    const history = await loadPracticeHistory();
    expect(history.failed).toBe(false);
    expect(history.sessions.map(s => s.accuracyPct)).toEqual([100, 50]);
    expect(history.attempts.map(a => a.note)).toEqual(['C', 'F', 'C']);
    expect(history.attempts[1]).toMatchObject({ sessionId: first.session.id, isCorrect: false });
  });

  it('clears device history', async () => {
    await recordRound(round, roundAttempts);
    clearDeviceHistory();
    expect(await loadPracticeHistory()).toMatchObject({ sessions: [], attempts: [] });
  });

  it('adds a saved round to loaded history', async () => {
    const saved = await recordRound(round, roundAttempts);
    const updated = withSavedRound({ sessions: [], attempts: [], failed: false }, saved);
    expect(updated.sessions).toHaveLength(1);
    expect(updated.attempts.map(a => a.note)).toEqual(['F', 'C']);
  });
});

describe('generatePrompt with one enharmonic focus note', () => {
  it('keeps asking it after the previous prompt used the other spelling', () => {
    for (let i = 0; i < 20; i++) {
      const prompt = generatePrompt({ instrument: INSTRUMENT_PRESETS[0], noteDisplay: 'both', focusNotes: [1], previousNote: 'C#' });
      expect(['C#', 'D♭']).toContain(prompt.note);
    }
  });
});
