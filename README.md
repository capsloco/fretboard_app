# 🎸 FretLearn — Hands-Free Fretboard Trainer 🚀

> **Master your fretboard from 4 to 6 feet away — zero hands on your screen required!** ⚡

Welcome to **FretLearn**, the ultimate visual training companion for guitarists, bassists, and string instrument players! ⚡ Pick up your physical instrument, set your device down at eye level, start a practice round, and call out your results hands-free using voice commands or massive high-contrast buttons! 🎙️🔥

---

## ✨ Features That Rock 🤘

### 🗣️ 1. Hands-Free Voice Control (`Web Speech API`)
* No need to touch your device while holding your guitar!
* Say **"Got it"**, **"Hit"**, **"Pass"**, or **"Correct"** to log a successful note recall.
* Say **"Missed"**, **"Wrong"**, or **"Skip"** to log a miss.
* Say **"Pause"** or **"Resume"** anytime during your practice loop!

### 👁️ 2. Distance Ergonomics (4–6 Ft Readability)
* **Massive Typography**: Dynamic high-contrast note prompts designed for crystal-clear readability across your music room or studio.
* **Visual Listening Status**: Active pulsing status indicators show when voice recognition is tuned in and listening.

### 🎮 3. Game & Practice Modes
* **🎯 Pass / Fail Mode (Tracked)**: React to prompts, track your round accuracy %, practice duration, speed, and build epic 🔥 **Streaks**!
* **⏱️ Timed Flashcard Mode (No Tracking)**: Set your custom timer (e.g. *4 seconds per note for 5 minutes*) and let FretLearn loop automatically.

### 🎸 4. Custom Instrument Engine (4 to 8 Strings)
* **Preset Standards**:
  * 🎸 **6-String Guitar** *(Standard E)*
  * 🎸 **7-String Guitar** *(Standard B & Drop A)*
  * 🎸 **4-String Bass** *(Standard E)*
  * 🎸 **5-String Bass** *(Standard B)*
* **🛠️ Custom Configurator**:
  * Set 4 to 8 strings & 12 to 24 frets.
  * Pick individual string tunings from lowest to highest pitch!

### 🔍 5. Precision Neck Filters
* **Prompt Scope**: Toggle between *Global Notes* (e.g., "Find all C# notes") or *String-Specific* prompts (e.g., "Find C on the A string").
* **Accidentals Toggle**: Train *Naturals Only (A–G)* or include *Sharps (♯) & Flats (♭)*.
* **Fret Range Boundary Sliders**: Limit prompts to Open Position (Frets 0–5), Mid Neck (Frets 5–12), Upper Frets (12–24), or custom ranges!

---

## 🛠️ Tech Stack 🧰

* ⚛️ **Frontend**: React 19 + Vite 8
* 🎨 **Styling**: Tailwind CSS v4 (Sleek Dark Mode & Glassmorphism)
* 🎙️ **Voice Control**: Web Speech API (`webkitSpeechRecognition`)
* ⚡ **Icons**: Lucide React Icons
* 🗄️ **Database & Auth**: Supabase (Google OAuth + Postgres DB) with `localStorage` fallback for guest mode

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/capsloco/fretboard_app.git

# 2. Navigate to project folder
cd fretboard_app

# 3. Install dependencies
npm install

# 4. Fire up the local dev server
npm run dev
```

Open your browser at `http://localhost:5173` and start shredding! 🎸🔥

---

## 📄 Database Schema (Supabase)

```sql
-- Custom Instruments Table
CREATE TABLE custom_instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  string_count INT NOT NULL,
  fret_count INT NOT NULL,
  tuning TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Practice History & Stats
CREATE TABLE practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instrument_name TEXT NOT NULL,
  session_type TEXT NOT NULL,
  prompt_type TEXT NOT NULL,
  total_prompts INT NOT NULL,
  correct_count INT,
  incorrect_count INT,
  accuracy_pct NUMERIC(5, 2),
  duration_seconds INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

<p center>
  Made with ❤️ for guitarists & bassists everywhere. Keep shredding! ⚡🎸
</p>
