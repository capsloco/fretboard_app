# 🎸 FretLearn — Hands-Free Fretboard Trainer 🚀

> **Master your fretboard from 4 to 6 feet away — zero hands on your screen required!** ⚡

Welcome to **FretLearn** ([fretlearn.app](https://fretlearn.app)), the ultimate visual training companion for guitarists, bassists, and string instrument players! ⚡ Pick up your physical instrument, set your device down at eye level, start a practice round, and call out your results hands-free using voice commands, string plucks, or footswitch hotkeys! 🎙️🔥

---

## ✨ Features That Rock 🤘

### 🗣️ 1. Hands-Free Voice & Audio Pluck Controls
* **Web Speech API**: Say **"Got it"**, **"Hit"**, **"Pass"**, or **"Correct"** to log a successful note recall; say **"Missed"**, **"Wrong"**, or **"Skip"** to log a miss.
* **Universal Audio Pluck Trigger (Firefox & Safari Compatible)**: Uses Web Audio API peak analysis to detect guitar string plucks or snaps.
* **Keyboard Hotkeys**: Use **Spacebar** / **Enter** for Pass, **M** / **Backspace** for Miss.

### 👁️ 2. Distance Ergonomics & Collapsible Practice Viewport
* **Dead-Centered Arrow Header Toggle**: When a practice session starts, the main header auto-hides into a single dead-centered `▼` arrow handle at the top of the screen for zero screen clutter!
* **Single Viewport Fit**: Compact note prompt cards, voice controls, and action buttons designed to fit 100% inside your mobile viewport without scrolling.
* **Massive Typography**: High-contrast 4–6 ft viewing distance note display.

### 🎸 3. Realistic Interactive Fretboard
* **Solid Bone-White Guitar Nut**: Fret 0 features a continuous solid white bone-style nut block with a dedicated `NUT` header badge.
* **Wide-Spaced Double Inlays**: 12th and 24th fret double dots are placed across upper and lower string rows matching authentic Fender/Gibson neck layouts.
* **Accurate String Gauges**: String 1 (highest pitch, e.g. High E) renders as thin wire (~1.0px) and the lowest string renders as thick wire (~5.0px).
* **24-Fret Dynamic Width**: Seamless horizontal scrolling supporting 12 to 24 frets without background or string cutoff.

### 🎯 4. Game Modes & Notation Customization
* **🎯 Pass / Fail Mode (Tracked)**: React to prompts, track round accuracy %, session duration, and build 🔥 **Streaks**!
* **⏱️ Timed Flashcard Mode**: Continuous hands-free loop with custom note interval timers.
* **🎵 3-Way Notation Switcher**: Toggle between **Sharps (#)**, **Both (C#/D♭)**, or **Flats (♭)**.
* **🔍 Scope & Range Sliders**: Practice *Global Notes* or *String-Specific* prompts across custom fret ranges (e.g. Frets 5–12).

### 🎼 5. Categorized Tuning Presets & Header Quick-Switch
* **Preset Library**: Standard, Transposed (Half Step Down, Full Step Down), Drop (Drop D, Drop C, Drop A), Open & Modal (DADGAD, Open G, Open D) tunings for 6-String & 7-String Guitars and 4-String & 5-String Basses.
* **Header Tuning Selector**: Switch tunings on the fly directly from the top header bar.

### 📜 6. Legal & Google OAuth Verification Ready
* **Privacy Policy & Terms of Service**: Modal (`LegalModal.jsx`) and footer links covering Supabase Auth, practice stats, Google Tag Manager telemetry, and user data rights.

---

## 🛠️ Tech Stack 🧰

* ⚛️ **Frontend**: React 19 + Vite 8
* 🎨 **Styling**: Tailwind CSS v4 (`@tailwindcss/vite` with dark mode & glowing animations)
* 🎙️ **Voice Control**: Web Speech API (`webkitSpeechRecognition`) + Web Audio API (`AnalyserNode`)
* ⚡ **Icons**: Lucide React Icons
* 🗄️ **Database & Auth**: Supabase (Google OAuth + Postgres DB) with `localStorage` fallback
* 📊 **Analytics**: Google Tag Manager (`GTM-5THRLVG4`)

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

<p align="center">
  Made with ❤️ for guitarists & bassists everywhere. Keep shredding! ⚡🎸
</p>
