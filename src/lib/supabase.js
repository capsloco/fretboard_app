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
    
    if (!error && data) return data[0];
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
      return data.map(item => ({
        id: item.id,
        title: item.title,
        stringCount: item.string_count,
        fretCount: item.fret_count,
        tuning: item.tuning
      }));
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

export async function getSessionHistory(userId, { page = 0, pageSize = 20 } = {}) {
  if (!supabase || !userId) return { sessions: [], hasMore: false };

  const from = page * pageSize;
  const to = from + pageSize; // fetch one extra row to detect hasMore without a count query

  const { data, error } = await supabase
    .from('practice_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error || !data) {
    console.error('Error fetching session history:', error);
    return { sessions: [], hasMore: false };
  }

  const hasMore = data.length > pageSize;
  const rows = hasMore ? data.slice(0, pageSize) : data;

  return {
    sessions: rows.map(mapSessionRow),
    hasMore
  };
}

export async function getLifetimeStats(userId) {
  const empty = { totalSessions: 0, totalPracticeSeconds: 0, lifetimeAccuracyPct: 0, bestStreak: 0, firstSessionDate: null };
  if (!supabase || !userId) return empty;

  const { data, error } = await supabase
    .from('practice_sessions')
    .select('total_prompts, correct_count, duration_seconds, best_streak, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error || !data || data.length === 0) return empty;

  const totalPrompts = data.reduce((sum, s) => sum + (s.total_prompts || 0), 0);
  const totalCorrect = data.reduce((sum, s) => sum + (s.correct_count || 0), 0);
  const totalPracticeSeconds = data.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
  const bestStreak = data.reduce((max, s) => Math.max(max, s.best_streak || 0), 0);

  return {
    totalSessions: data.length,
    totalPracticeSeconds,
    lifetimeAccuracyPct: totalPrompts > 0 ? Math.round((totalCorrect / totalPrompts) * 100) : 0,
    bestStreak,
    firstSessionDate: data[0].created_at
  };
}

export async function getAccuracyOverTime(userId) {
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from('practice_sessions')
    .select('created_at, accuracy_pct, total_prompts, correct_count')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    console.error('Error fetching accuracy history:', error);
    return [];
  }

  return data.map((s) => ({
    createdAt: s.created_at,
    accuracyPct: s.accuracy_pct,
    totalPrompts: s.total_prompts,
    correctCount: s.correct_count
  }));
}

export async function getWeakNotes(userId) {
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from('practice_attempts')
    .select('target_note, is_correct')
    .eq('user_id', userId);

  if (error || !data) {
    console.error('Error fetching attempt history:', error);
    return [];
  }

  return data.map((a) => ({ note: a.target_note, isCorrect: a.is_correct }));
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
    accuracyPct: row.accuracy_pct,
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
