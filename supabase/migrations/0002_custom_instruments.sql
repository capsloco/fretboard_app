-- FretLearn: custom instruments table
-- Run this file once, manually, via the Supabase SQL Editor (after 0001).
--
-- The app has always saved custom instruments to this table when signed in, but it was
-- only described in guitar_app.md, never in a migration. Without it, self-hosted projects
-- silently fall back to localStorage. Safe to run on a project that already has the table.

CREATE TABLE IF NOT EXISTS custom_instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  title TEXT NOT NULL,
  string_count INT NOT NULL CHECK (string_count BETWEEN 4 AND 8),
  fret_count INT NOT NULL CHECK (fret_count BETWEEN 12 AND 24),
  tuning TEXT[] NOT NULL, -- open-string note names, lowest pitch first, e.g. {B,E,A,D,G,B,E}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_instruments_user_created
  ON custom_instruments (user_id, created_at DESC);

ALTER TABLE custom_instruments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_instruments_select_own" ON custom_instruments;
CREATE POLICY "custom_instruments_select_own" ON custom_instruments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "custom_instruments_insert_own" ON custom_instruments;
CREATE POLICY "custom_instruments_insert_own" ON custom_instruments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Weak-spot drill rounds are saved with practice_sessions.session_type = 'weak_spots'
-- (alongside 'tracked'); no schema change is needed for them.
