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

### 🎸 3. Realistic Wood Grain Interactive Fretboard
* **Real Wood Textures (Theme-Aware)**: Dynamically switches between **Light Maple Wood** (for Clean, Light & Acid themes) and **Dark Rosewood / Laurel Wood** (for Dark & Neon themes) with subtle linear wood grain striations.
* **Narrow Ivory/Bone Nut**: Fret 0 features a dedicated narrow, realistic bone/ivory nut strip (`bg-amber-50 text-amber-950`) with an `N` header badge.
* **Pearl & Dark Walnut Inlays**: Real-time switching between mother-of-pearl dots on Rosewood and dark walnut dots on Maple.
* **Accurate String Gauges & Fret Wires**: String 1 (highest pitch, e.g. High E) renders as thin wire (~1.2px) and the lowest string renders as thick wire (~5.5px) with theme-reactive metallic fret wire dividers.
* **100% Desktop Width & 24-Fret Responsive Layout**: Expands cleanly to fill full desktop screens while offering smooth horizontal scrolling for 12 to 24 frets.

### 🎯 4. Custom daisyUI Popovers & Controls
* **Custom Dropdown Menus**: Replaced native browser OS selects with custom daisyUI popover dropdown cards for tunings and per-string custom note selectors.
* **Sleek Floating Chevron Handle**: Minimal, non-intrusive floating chevron handle (`▼`) that expands the top navbar during practice sessions.

### 🎯 5. Game Modes & Notation Customization
* **🎯 Pass / Fail Mode (Tracked)**: React to prompts, track round accuracy %, session duration, and build 🔥 **Streaks**!
* **⏱️ Timed Flashcard Mode**: Continuous hands-free loop with custom note interval timers.
* **🎵 3-Way Notation Switcher**: Toggle between **Sharps (#)**, **Both (C#/D♭)**, or **Flats (♭)**.
* **🔍 Scope & Range Sliders**: Practice *Global Notes* or *String-Specific* prompts across custom fret ranges (e.g. Frets 5–12).

### 🎼 6. Categorized Tuning Presets & Instrument Builder
* **Preset Library**: Standard, Transposed (Half Step Down, Full Step Down), Drop (Drop D, Drop C, Drop A), Open & Modal (DADGAD, Open G, Open D) tunings for 6-String & 7-String Guitars and 4-String & 5-String Basses.
* **Custom Per-String Note Selector**: Build and save custom tunings note-by-note using custom daisyUI popovers.

### 📜 7. Legal, Privacy & Consent Mode v2
* **Google Consent Mode v2 & Cookie Consent Banner**: Integrated `analytics_storage` consent default blocking before GTM load with an interactive consent banner and footer preference controls.
* **Privacy Policy & Terms of Service**: Modal (`LegalModal.jsx`) and footer links covering Supabase Auth, practice stats, Google Tag Manager telemetry, and user data rights.

---

## 🛠️ Tech Stack 🧰

* ⚛️ **Frontend**: React 19 + Vite 8
* 🌼 **UI System**: daisyUI v5 + Tailwind CSS v4 (`@tailwindcss/vite`)
* 🪵 **Graphics & Motion**: Pure CSS Real Wood Grain Textures + Lucide Icons
* 🎙️ **Voice Control**: Web Speech API (`webkitSpeechRecognition`) + Web Audio API (`AnalyserNode`)
* 🗄️ **Database & Auth**: Supabase (Google OAuth + Postgres DB) with `localStorage` fallback
* 📊 **Analytics & Compliance**: Google Tag Manager (`GTM-5THRLVG4`) + Google Consent Mode v2

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
