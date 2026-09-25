import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
  import.meta.env.REACT_APP_SUPABASE_URL || 
  import.meta.env.SUPABASE_URL || '';

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  import.meta.env.REACT_APP_SUPABASE_ANON_KEY || 
  import.meta.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// LocalStorage Fallback Keys
const LOCAL_CUSTOM_INSTRUMENTS_KEY = 'fretlearn_custom_instruments';
const LOCAL_USER_SETTINGS_KEY = 'fretlearn_user_settings';

/**
 * Auth Helpers
 */
export async function signInWithGoogle() {
  if (!supabase) return { error: { message: 'Supabase is not configured yet.' } };
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
}

export async function signOut() {
  if (!supabase) return { error: null };
  return await supabase.auth.signOut();
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function subscribeToAuthChanges(callback) {
  if (!supabase) return { unsubscribe: () => {} };
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null, event);
  });
  return subscription;
}

/**
 * User Preference Settings Data Methods (LocalStorage + Supabase User Metadata)
 */
export async function saveUserSettings(settings, userId = null) {
  // Always update LocalStorage for instant zero-latency loading
  try {
    localStorage.setItem(LOCAL_USER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings to localStorage:', e);
  }

  // If logged in via Supabase, sync settings to user metadata
  if (supabase && userId) {
    try {
      await supabase.auth.updateUser({
        data: { fretlearn_settings: settings }
      });
    } catch (e) {
      console.warn('Failed to sync user metadata in Supabase:', e);
    }
  }
}

export async function loadUserSettings(userId = null) {
  // 1. Try Supabase user metadata if user logged in
  if (supabase && userId) {
    try {
      const user = await getCurrentUser();
      if (user?.user_metadata?.fretlearn_settings) {
        return user.user_metadata.fretlearn_settings;
      }
    } catch {
      // fall back to localStorage below
    }
  }

  // 2. Fallback to LocalStorage
  try {
    const raw = localStorage.getItem(LOCAL_USER_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Custom Instrument Engine Data Methods
 */
export async function saveCustomInstrument(instrument, userId = null) {
  if (supabase && userId) {
    const { data, error } = await supabase
      .from('custom_instruments')
      .insert([
        {
          user_id: userId,
          title: instrument.title,
          string_count: instrument.stringCount,
          fret_count: instrument.fretCount,
          tuning: instrument.tuning
        }
      ])
      .select();
    
    if (!error && data?.[0]) return mapCustomInstrumentRow(data[0]);
  }

  // Fallback to LocalStorage
  const existing = getLocalCustomInstruments();
  const newInst = {
    id: `custom_${Date.now()}`,
    ...instrument,
    createdAt: new Date().toISOString()
  };
  const updated = [newInst, ...existing];
  localStorage.setItem(LOCAL_CUSTOM_INSTRUMENTS_KEY, JSON.stringify(updated));
  return newInst;
}

export function getLocalCustomInstruments() {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_INSTRUMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function loadCustomInstruments(userId = null) {
  if (supabase && userId) {
    const { data, error } = await supabase
      .from('custom_instruments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data && data.length > 0) {
      return data.map(mapCustomInstrumentRow);
    }
  }

  return getLocalCustomInstruments();
}

/**
 * Practice Session & Attempt Tracking Data Methods
 * Stats/history require a signed-in account — no localStorage fallback here.
 */
export async function savePracticeSession(sessionData, userId = null) {
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from('practice_sessions')
    .insert([
      {
        user_id: userId,
        instrument_name: sessionData.instrumentName,
        session_type: sessionData.sessionType,
        prompt_type: sessionData.promptType,
        total_prompts: sessionData.totalPrompts,
        correct_count: sessionData.correctCount,
        incorrect_count: sessionData.incorrectCount,
        accuracy_pct: sessionData.accuracyPct,
        duration_seconds: sessionData.durationSeconds,
        best_streak: sessionData.bestStreak,
        instrument_id: sessionData.instrumentId,
        tuning_id: sessionData.tuningId,
        tuning: sessionData.tuning,
        min_fret: sessionData.minFret,
        max_fret: sessionData.maxFret,
        include_accidentals: sessionData.includeAccidentals,
        note_display: sessionData.noteDisplay
      }
    ])
    .select('id')
    .single();

  if (error) {
    console.error('Error saving practice session:', error);
    return null;
  }
  return data.id;
}

export async function savePracticeAttempts(sessionId, attempts, userId = null) {
  if (!supabase || !userId || !sessionId || !attempts?.length) return false;

  const rows = attempts.map((a) => ({
    session_id: sessionId,
    user_id: userId,
    target_note: a.targetNote,
    prompt_type: a.promptType,
    string_index: a.stringIndex ?? null,
    string_display_number: a.stringDisplayNumber ?? null,
    string_open_note: a.stringOpenNote ?? null,
    is_correct: a.isCorrect,
    response_time_ms: a.responseTimeMs ?? null,
    input_source: a.inputSource,
    detected_note: a.detectedNote ?? null,
    detected_octave: a.detectedOctave ?? null,
    detected_frequency_hz: a.detectedFrequencyHz ?? null
  }));

  const { error } = await supabase.from('practice_attempts').insert(rows);
  if (error) {
    console.error('Error saving practice attempts:', error);
    return false;
  }
  return true;
}

// Supabase returns at most 1,000 rows per request (its default max-rows), so longer lists are read in pages
const SUPABASE_PAGE_SIZE = 1000;

/**
 * Read a newest-first query in pages. Later pages are pinned to rows no newer than the
 * first page's newest, so a round saved elsewhere mid-read can't shift rows into two pages.
 */
async function fetchInPages(buildQuery, maxRows = Infinity) {
  const rows = [];
  let newest = null;
  for (let from = 0; from < maxRows; from += SUPABASE_PAGE_SIZE) {
    const to = Math.min(from + SUPABASE_PAGE_SIZE, maxRows) - 1;
    const query = newest ? buildQuery().lte('created_at', newest) : buildQuery();
    const { data, error } = await query.range(from, to);
    if (error || !data) {
      console.error('Error fetching practice history:', error);
      return null;
    }
    rows.push(...data);
    newest ??= data[0]?.created_at ?? null;
    if (data.length < to - from + 1) break;
  }
  return rows;
}

/**
 * Every saved round for a user, newest first. Returns null if the request failed.
 */
export async function getPracticeSessions(userId) {
  if (!supabase || !userId) return [];

  const rows = await fetchInPages(() => supabase
    .from('practice_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id'));

  return rows && rows.map(mapSessionRow);
}

/**
 * A user's most recent answers, newest first. Returns null if the request failed.
 */
export async function getRecentAttempts(userId, limit) {
  if (!supabase || !userId) return [];

  const rows = await fetchInPages(() => supabase
    .from('practice_attempts')
    .select('session_id, target_note, prompt_type, string_index, string_display_number, string_open_note, is_correct, response_time_ms, input_source, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id'), limit);

  return rows && rows.map((a) => ({
    sessionId: a.session_id,
    note: a.target_note,
    promptType: a.prompt_type,
    stringIndex: a.string_index,
    stringDisplayNumber: a.string_display_number,
    stringOpenNote: a.string_open_note,
    isCorrect: a.is_correct,
    responseTimeMs: a.response_time_ms,
    inputSource: a.input_source,
    createdAt: a.created_at
  }));
}

function mapCustomInstrumentRow(row) {
  return {
    id: row.id,
    title: row.title,
    stringCount: row.string_count,
    fretCount: row.fret_count,
    tuning: row.tuning
  };
}

function mapSessionRow(row) {
  return {
    id: row.id,
    instrumentName: row.instrument_name,
    sessionType: row.session_type,
    promptType: row.prompt_type,
    totalPrompts: row.total_prompts,
    correctCount: row.correct_count,
    incorrectCount: row.incorrect_count,
    accuracyPct: Number(row.accuracy_pct),
    durationSeconds: row.duration_seconds,
    bestStreak: row.best_streak,
    instrumentId: row.instrument_id,
    tuningId: row.tuning_id,
    tuning: row.tuning,
    minFret: row.min_fret,
    maxFret: row.max_fret,
    includeAccidentals: row.include_accidentals,
    noteDisplay: row.note_display,
    createdAt: row.created_at
  };
}
