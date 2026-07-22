# 🎸 FretFlow / FretLearn — Project Summary & Architecture Guide

> **Live Production URL**: [https://fretlearn.app](https://fretlearn.app) (also [https://www.fretlearn.app](https://www.fretlearn.app))  
> **GitHub Repository**: [https://github.com/capsloco/fretboard_app](https://github.com/capsloco/fretboard_app)  
> **Vercel Project**: `mr-cheese/fretboard_learn`  
> **GTM Tag ID**: `GTM-5THRLVG4`  

---

## 🚀 Overview & Vision

**FretFlow (FretLearn)** is a high-visibility, hands-free visual training application for guitarists and bassists. Players place their device 4 to 6 feet away at eye level, pick up their physical instrument, and react to note prompts displayed on screen using voice recognition, audio pluck triggers, or footswitch hotkeys.

---

## 🛠️ Technology Stack

* **Frontend**: React 19 + Vite 8
* **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) with dark mode default & glowing animations
* **Icons**: `lucide-react`
* **Voice Control**: Web Speech API (`webkitSpeechRecognition`)
* **Audio Pluck Trigger (Firefox & Universal)**: Web Audio API (`AudioContext` + `AnalyserNode`)
* **Database & Auth**: Supabase (`@supabase/supabase-js`) + `localStorage` fallback
* **Analytics**: Google Tag Manager (`GTM-5THRLVG4`) in `index.html` `<head>` and `<body>`
* **Hosting**: Vercel Continuous Deployment connected to GitHub `main` branch

---

## ⚙️ Core Mechanics & Architecture

### 1. 🎯 Practice Modes
* **Pass / Fail Mode (Tracked)**: Prompts ➔ Countdown ➔ Answer Reveal. Logs results via Voice (`"Got it"`, `"Missed"`), Audio Plucks, Hotkeys (`Spacebar`/`Backspace`), or Green/Red On-Screen Buttons. Calculates accuracy %, practice duration, and streak 🔥.
* **Timed Flashcard Mode**: Continuous hands-free loop. Custom interval timer (e.g. *4 seconds per note for 5 minutes*) displaying estimated note count.

### 2. 🎸 Custom Instrument Engine (4 to 8 Strings)
* **Presets**: 6-String Guitar (Standard E), 7-String Guitar (Standard B & Drop A), 4-String Bass (Standard E), 5-String Bass (Standard B).
* **Configurator**: Custom title, string count (4–8), fret count (12–24), and individual tuning pickers per string.

### 3. 🔍 Fretboard & Note Filtering
* **Prompt Scopes**: *Global Note* ("Find all C# notes") vs *String-Specific* ("Find C on the A string").
* **Accidentals Toggle**: *Naturals Only* (A–G) vs *Include Sharps (♯) & Flats (♭)*.
* **Fret Range Boundaries**: Open position (0–5), Mid neck (5–12), Upper frets (12–24), or custom dual sliders.

### 4. 💾 State Persistence
* **Guest Users**: Settings, custom tunings, and fret boundaries auto-save to `localStorage` (`fretflow_user_settings`, `fretflow_custom_instruments`, `fretflow_session_history`).
* **Logged-in Users**: Preferences sync to Supabase `user_metadata`, custom setups to `custom_instruments` DB table, and stats to `practice_sessions` DB table.

---

## 📁 Repository Structure Map

```
/Users/ct/apps/fretboard_learn/
├── index.html                           # GTM script + noscript tags & Google Fonts (Outfit, JetBrains Mono)
├── guitar_app.md                        # Original product specifications document
├── guitar_app_structure.txt             # Proposed directory structure
├── PROJECT_SUMMARY.md                   # This AGY CLI startup reference guide
├── README.md                            # Public GitHub repository documentation
├── package.json                         # Vite + React + Tailwind v4 + Supabase dependencies
├── vite.config.js                       # Vite plugin configuration for Tailwind CSS
└── src/
    ├── main.jsx                         # App entrypoint
    ├── index.css                        # Tailwind v4 import & custom glowing keyframes
    ├── App.jsx                          # Main application container & state orchestration
    ├── components/
    │   ├── fretboard/
    │   │   ├── Fretboard.jsx            # Dynamic string gauge visual fretboard & note highlight renderer
    │   │   └── FretMarker.jsx           # Single & double inlay dots (3, 5, 7, 9, 12, 15, 17, 19, 21, 24)
    │   ├── session/
    │   │   ├── DisplayPrompt.jsx        # 4-6 ft distance-ergonomic massive prompt card
    │   │   ├── VoiceController.jsx      # Web Speech API + Web Audio Pluck Trigger + Hotkey handler
    │   │   └── SessionSummary.jsx       # End-of-round score card & streak stats
    │   ├── settings/
    │   │   └── InstrumentBuilder.jsx    # Custom tuning & string count configurator
    │   └── ui/
    │       ├── FretRangeSlider.jsx      # Fret range boundary sliders & position presets
    │       ├── Header.jsx               # Header bar with logo, active instrument pill, Supabase auth
    │       └── SessionSettingsModal.jsx # Session & mechanics settings modal
    └── lib/
        ├── fretLogic.js                 # Pure math functions for note calculations & prompt generation
        ├── voice.js                     # SpeechRecognition event handler & command parser
        ├── soundTrigger.js              # Web Audio API microphone peak / string pluck detector
        └── supabase.js                  # Supabase DB/Auth client & localStorage fallback helpers
```

---

## 🔧 Important Git & Vercel Configuration Notes

* **Git Author**: Configured to `Chris Tamayo <chris.tamayo@outlook.com>` (matching GitHub account so Vercel automatic builds succeed).
* **Remote Origin**: `https://github.com/capsloco/fretboard_app.git`
* **Vercel Project**: `mr-cheese/fretboard_learn` linked to custom domain `fretlearn.app` & `www.fretlearn.app`.
