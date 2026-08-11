-- FretLearn: Practice Tracking Rebuild
-- Run this entire file once, manually, via the Supabase SQL Editor
-- (Dashboard -> SQL Editor -> paste -> Run). There is no linked Supabase
-- CLI/project in this repo, so this migration is not applied automatically.
--
-- Extends practice_sessions with config-snapshot + best_streak columns and
-- adds practice_attempts for per-prompt granularity (target note, correctness,
-- response time, input method). Also reserves nullable columns for a future
-- real pitch/note-detection feature (detected_note/detected_octave/
-- detected_frequency_hz) so that follow-up won't need another migration.

-- =========================================================
-- 1. practice_sessions (create if missing, extend either way)
-- =========================================================
-- Assumes practice_sessions already exists per guitar_app.md section 6;
-- IF NOT EXISTS guards make this safe to run on a fresh project too.

CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instrument_name TEXT NOT NULL,
  session_type TEXT NOT NULL,       -- 'tracked' (flashcard sessions are no longer persisted)
  prompt_type TEXT NOT NULL,        -- 'global' | 'string_specific'
  total_prompts INT NOT NULL,
  correct_count INT,
  incorrect_count INT,
  accuracy_pct NUMERIC(5, 2),
  duration_seconds INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE practice_sessions
  ADD COLUMN IF NOT EXISTS instrument_id TEXT,
  ADD COLUMN IF NOT EXISTS tuning_id TEXT,
  ADD COLUMN IF NOT EXISTS tuning TEXT[],
  ADD COLUMN IF NOT EXISTS min_fret INT,
  ADD COLUMN IF NOT EXISTS max_fret INT,
  ADD COLUMN IF NOT EXISTS include_accidentals BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS note_display TEXT,       -- 'sharps' | 'flats' | 'both'
  ADD COLUMN IF NOT EXISTS best_streak INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_created
  ON practice_sessions (user_id, created_at DESC);

-- =========================================================
-- 2. practice_attempts (new — per-prompt granularity)
-- =========================================================

CREATE TABLE IF NOT EXISTS practice_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- prompt context (mirrors generatePrompt() output in src/lib/fretLogic.js)
  target_note TEXT NOT NULL,
  prompt_type TEXT NOT NULL,             -- 'global' | 'string_specific'
  string_index INT,                      -- null for global prompts
  string_display_number INT,             -- null for global prompts
  string_open_note TEXT,                 -- null for global prompts

  -- outcome
  is_correct BOOLEAN NOT NULL,
  response_time_ms INT,                  -- prompt-shown -> answered; null if unmeasurable
  input_source TEXT NOT NULL,            -- 'button' | 'keyboard' | 'voice' | 'pluck'

  -- reserved for a future real pitch/note-detection feature (not used by this migration's app code)
  detected_note TEXT,
  detected_octave INT,
  detected_frequency_hz NUMERIC,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_attempts_session
  ON practice_attempts (session_id);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_created
  ON practice_attempts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_note
  ON practice_attempts (user_id, target_note);

-- =========================================================
-- 3. Row Level Security
-- =========================================================
-- NOTE: if RLS was not already enabled on practice_sessions, this is a real
-- security tightening (previously any holder of the anon key may have been
-- able to read/write all rows depending on default grants) — confirm this
-- is expected before running in production.

ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_attempts ENABLE ROW LEVEL SECURITY;

-- practice_sessions: owner-only, append-only from the client (no update/delete policy yet)
DROP POLICY IF EXISTS "practice_sessions_select_own" ON practice_sessions;
CREATE POLICY "practice_sessions_select_own" ON practice_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "practice_sessions_insert_own" ON practice_sessions;
CREATE POLICY "practice_sessions_insert_own" ON practice_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- practice_attempts: owner-only, append-only from the client
DROP POLICY IF EXISTS "practice_attempts_select_own" ON practice_attempts;
CREATE POLICY "practice_attempts_select_own" ON practice_attempts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "practice_attempts_insert_own" ON practice_attempts;
CREATE POLICY "practice_attempts_insert_own" ON practice_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
