// Saved rounds and answers: in the Supabase account when signed in, otherwise in this browser.
// Both sources return the same shapes, so the stats screen and adaptive prompts don't care which.
import { savePracticeSession, savePracticeAttempts, getPracticeSessions, getRecentAttempts } from './supabase';

// How many recent answers feed note stats and adaptive prompts (recent skill matters more than old)
export const RECENT_ATTEMPT_LIMIT = 2000;

const LOCAL_HISTORY_KEY = 'fretlearn_practice_history';
// Caps keep device history well under the browser's ~5 MB localStorage allowance
const LOCAL_MAX_SESSIONS = 1000;
const LOCAL_MAX_ATTEMPTS = 5000;

export const EMPTY_HISTORY = { sessions: [], attempts: [] };

/**
 * An answer as App records it -> the shape stats work with (see getRecentAttempts in supabase.js)
 */
export function toHistoryAttempt(attempt, sessionId = null, createdAt = new Date().toISOString()) {
  return {
    sessionId,
    note: attempt.targetNote,
    promptType: attempt.promptType,
    stringIndex: attempt.stringIndex ?? null,
    stringDisplayNumber: attempt.stringDisplayNumber ?? null,
    stringOpenNote: attempt.stringOpenNote ?? null,
    isCorrect: attempt.isCorrect,
    responseTimeMs: attempt.responseTimeMs ?? null,
    inputSource: attempt.inputSource,
    createdAt
  };
}

function readLocalHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY));
    if (Array.isArray(parsed?.sessions) && Array.isArray(parsed?.attempts)) return parsed;
  } catch {
    // unreadable or blocked storage: start fresh
  }
  return EMPTY_HISTORY;
}

function writeLocalHistory(history) {
  try {
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(history));
    return true;
  } catch (e) {
    console.warn('Failed to save practice history to localStorage:', e);
    return false;
  }
}

export function clearDeviceHistory() {
  try {
    localStorage.removeItem(LOCAL_HISTORY_KEY);
  } catch {
    // nothing to clear
  }
}

/**
 * Save a finished round: to the account when signed in, otherwise to this device.
 * `session` uses the savePracticeSession() field names; `roundAttempts` are App's answer records.
 * Returns the saved { session, attempts, partial } (newest answer first) or null if it couldn't be saved.
 * `partial` means the round's totals were saved but its answers weren't, so note stats won't include it.
 */
export async function recordRound(session, roundAttempts, userId = null) {
  const createdAt = new Date().toISOString();
  let sessionId;
  let partial = false;

  if (userId) {
    sessionId = await savePracticeSession(session, userId);
    if (!sessionId) return null;
    partial = roundAttempts.length > 0 && !(await savePracticeAttempts(sessionId, roundAttempts, userId));
  } else {
    sessionId = globalThis.crypto?.randomUUID?.() ?? `local_${Date.now()}`;
  }

  const saved = {
    session: { ...session, id: sessionId, createdAt },
    attempts: partial ? [] : roundAttempts.map(a => toHistoryAttempt(a, sessionId, createdAt)).reverse(),
    partial
  };

  if (!userId) {
    const history = readLocalHistory();
    const written = writeLocalHistory({
      sessions: [saved.session, ...history.sessions].slice(0, LOCAL_MAX_SESSIONS),
      attempts: [...saved.attempts, ...history.attempts].slice(0, LOCAL_MAX_ATTEMPTS)
    });
    if (!written) return null;
  }

  return saved;
}

/**
 * Every saved round (newest first) and the most recent answers (newest first).
 * `failed` is true when the account couldn't be read, so the screen can say so instead of showing zeros.
 */
export async function loadPracticeHistory(userId = null) {
  if (!userId) {
    const { sessions, attempts } = readLocalHistory();
    return { sessions, attempts: attempts.slice(0, RECENT_ATTEMPT_LIMIT), failed: false };
  }

  const [sessions, attempts] = await Promise.all([
    getPracticeSessions(userId),
    getRecentAttempts(userId, RECENT_ATTEMPT_LIMIT)
  ]);
  return { sessions: sessions ?? [], attempts: attempts ?? [], failed: !sessions || !attempts };
}

/**
 * Add a just-saved round to already-loaded history without reading it back.
 */
export function withSavedRound(history, saved) {
  return {
    ...history,
    sessions: [saved.session, ...history.sessions],
    attempts: [...saved.attempts, ...history.attempts].slice(0, RECENT_ATTEMPT_LIMIT)
  };
}
