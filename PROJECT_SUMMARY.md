# 🎸 FretLearn — Project Summary & Architecture Guide

> **Live Production URL**: [https://fretlearn.app](https://fretlearn.app) (also [https://www.fretlearn.app](https://www.fretlearn.app))  
> **GitHub Repository**: [https://github.com/capsloco/fretboard_app](https://github.com/capsloco/fretboard_app)  
> **Active Feature Branch**: `v1.1`  
> **Vercel Project**: `mr-cheese/fretboard_learn`  
> **GTM Tag ID**: `GTM-5THRLVG4`  

---

## 🚀 Overview & Vision

**FretLearn** is a high-visibility, hands-free visual training application for guitarists and bassists. Players place their device 4 to 6 feet away at eye level, pick up their physical instrument, and react to note prompts displayed on screen using voice recognition, audio pluck triggers, or footswitch hotkeys.

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

### 1. 🎯 Practice Modes & Viewport Optimization
* **Pass / Fail Mode (Tracked)**: Prompts ➔ Countdown ➔ Answer Reveal. Logs results via Voice (`"Got it"`, `"Missed"`), Audio Plucks, Hotkeys (`Spacebar`/`Backspace`), or Green/Red On-Screen Buttons. Calculates accuracy %, practice duration, and streak 🔥.
* **Timed Flashcard Mode**: Continuous hands-free loop with custom note interval timers.
* **Dead-Centered Arrow Header Toggle**: In active session mode, the top header auto-hides into a single dead-centered `▼` arrow handle at the top edge of the viewport.
* **Single Viewport Fit**: All session controls, prompt cards, and fretboard elements scale to fit inside mobile viewports without vertical scrolling.

### 2. 🎸 Realistic Fretboard & Gauge Engine
* **Solid Bone-White Guitar Nut**: Fret 0 (`isNut`) renders as a solid white bone nut block across all string rows with a `NUT` header badge.
* **Wide-Spaced 12th & 24th Fret Inlays**: Double dots are positioned across upper and lower string rows (e.g. String 2 & String 5).
* **Accurate String Gauges**: String 1 (highest pitch, e.g. High E) renders as thin wire (~1.0px) and the lowest string renders as thick wire (~5.0px).
* **Dynamic 24-Fret Width**: Dynamically calculates neck width (`headerWidth + frets * 40px`) so string wires and wood background span all 24 frets continuously.

### 3. 🎼 Categorized Tuning Library & Quick-Selector
* **Presets**: Standard, Transposed (Half Step Down, Full Step Down), Drop (Drop D, Drop C, Drop A), Open & Modal (DADGAD, Open G, Open D) tunings for 6/7-String Guitars and 4/5-String Basses.
* **Header Tuning Selector**: Change tuning presets on the fly directly from the header bar.

### 4. 📜 Legal & Compliance Modals
* **LegalModal.jsx**: Tabbed Privacy Policy and Terms of Service covering Google OAuth verification requirements, Supabase storage, and analytics.

---

## 📁 Repository Structure Map

```
/Users/ct/apps/fretboard_learn/
├── index.html                           # GTM script + noscript tags & Google Fonts (Outfit, JetBrains Mono)
├── guitar_app.md                        # Original product specifications document
├── guitar_app_structure.txt             # Proposed directory structure
├── PROJECT_SUMMARY.md                   # AGY CLI startup reference guide
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
    │       ├── AuthModal.jsx            # Google OAuth, Magic Link & Email authentication modal
    │       ├── FretRangeSlider.jsx      # Fret range boundary sliders & position presets
    │       ├── Header.jsx               # Header bar with dead-center arrow toggle during practice
    │       ├── LegalModal.jsx           # Privacy Policy & Terms of Service modal
    │       └── SessionSettingsModal.jsx # Session & mechanics settings modal
    └── lib/
        ├── fretLogic.js                 # Pure math functions for note calculations & prompt generation
        ├── voice.js                     # SpeechRecognition event handler & command parser
        ├── soundTrigger.js              # Web Audio API microphone peak / string pluck detector
        └── supabase.js                  # Supabase DB/Auth client & localStorage fallback helpers
```

---

## 🔧 Git & Branching Strategy

* **Git Author**: Configured to `Chris Tamayo <chris.tamayo@outlook.com>`
* **Production Branch**: `main` (serves live production [fretlearn.app](https://fretlearn.app))
* **Active Feature Branch**: `v1.1` (contains collapsible header, white nut, spaced double dots, dynamic neck width, string gauge fix, legal modal)
* **Remote Origin**: `https://github.com/capsloco/fretboard_app.git`
