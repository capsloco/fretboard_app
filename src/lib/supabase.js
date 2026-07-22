import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// LocalStorage Fallback Keys
const LOCAL_CUSTOM_INSTRUMENTS_KEY = 'fretflow_custom_instruments';
const LOCAL_SESSION_HISTORY_KEY = 'fretflow_session_history';

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
  } catch (e) {
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
 * Practice Session History Data Methods
 */
export async function savePracticeSession(sessionData, userId = null) {
  if (supabase && userId) {
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
          duration_seconds: sessionData.durationSeconds
        }
      ]);
    if (!error) return true;
  }

  // LocalStorage fallback
  try {
    const existing = getLocalPracticeHistory();
    const entry = {
      id: `session_${Date.now()}`,
      ...sessionData,
      createdAt: new Date().toISOString()
    };
    const updated = [entry, ...existing];
    localStorage.setItem(LOCAL_SESSION_HISTORY_KEY, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.error('Error saving session locally:', e);
    return false;
  }
}

export function getLocalPracticeHistory() {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
