# Product Plan: Hands-Free Fretboard Trainer (MVP)

## 1. Overview & Core Vision
A hands-free, high-visibility visual training companion for guitarists and bassists practicing on physical instruments. Users configure their instrument, set their device down at eye level, start a session, and react to prompts shown on screen.

---

## 2. Technical Stack & Infrastructure
* **Frontend:** React (Vite) + Tailwind CSS + Lucide Icons
* **Hosting:** Vercel (Free Tier — Continuous Integration from GitHub)
* **Auth & DB:** Supabase (Google OAuth + Postgres DB — Free Tier)
* **Voice Control:** Web Speech API (`webkitSpeechRecognition`) for hands-free "Got it" / "Missed" commands
* **Data Persistence:** `localStorage` for guest users; Supabase DB for logged-in users

---

## 3. Game & Session Mechanics

### A. Session Modes
1. **Pass / Fail Mode (Tracked):**
   * Prompt -> Countdown -> Reveal.
   * User logs result via Voice ("Got it" / "Missed") or On-Screen Buttons (Large Green / Red).
   * Calculates round accuracy %, speed, and streak.
2. **Timed Flashcard Mode (No Tracking):**
   * Continuous hands-free loop.
   * User inputs: *Seconds per note* (e.g., 4s) and *Total practice duration* (e.g., 5 mins).
   * App displays dynamic stats: *"Practicing ~75 notes over 5 minutes."*

### B. Session Customization & Filters
* **Prompt Type:** 
  * *Global Note* (e.g., "Find all C notes")
  * *String-Specific* (e.g., "Find C on the A String")
* **Accidentals Toggle:**
  * *Naturals Only* (A, B, C, D, E, F, G)
  * *Include Sharps & Flats* (C#, Db, D#, Eb, etc.)
* **Fret Range Boundary:**
  * Custom range sliders (e.g., Frets 0–5 for open position, Frets 7–12 for neck middle, or 0–24 full neck).

---

## 4. Custom Instrument Engine
Allows dynamic note mapping across any string instrument setup:
* **Preset Standards:** 6-String Guitar (Standard `E A D G B E`), 4-String Bass (Standard `E A D G`).
* **Custom Configurator:**
  * Custom Setup Title (e.g., "7-String Drop A")
  * Number of Strings (4 to 8)
  * Number of Frets (12 to 24)
  * Individual String Tuning (Dropdown/picker for each string)

---

## 5. UI/UX Design Standards
* **Distance Ergonomics:** Massive typography, high contrast, dark mode default (readable from 4–6 feet away).
* **Fretboard Renderer:** Responsive horizontal/vertical grid with inlay markers (3, 5, 7, 9, 12, 15, 17, 19, 21, 24).
* **Voice Feedback Indicator:** Visual icon/pulse showing active listening state so the user knows voice commands are ready.

---

## 6. Database Schema (Supabase)

```sql
-- Users (Managed automatically by Supabase Auth)

-- Custom Instruments Table
CREATE TABLE custom_instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  string_count INT NOT NULL,
  fret_count INT NOT NULL,
  tuning TEXT[] NOT NULL, -- Array of note names e.g., ['B', 'E', 'A', 'D', 'G', 'B', 'E']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Practice History & Stats
CREATE TABLE practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instrument_name TEXT NOT NULL,
  session_type TEXT NOT NULL, -- 'tracked' or 'flashcard'
  prompt_type TEXT NOT NULL,   -- 'global' or 'string_specific'
  total_prompts INT NOT NULL,
  correct_count INT,
  incorrect_count INT,
  accuracy_pct NUMERIC(5, 2),
  duration_seconds INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);