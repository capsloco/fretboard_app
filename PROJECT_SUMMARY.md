# FretLearn: project summary

A quick orientation for contributors and coding agents. For setup and features, see the [README](README.md).

## What it is

A fretboard trainer for guitar and bass. The app shows a note ("find C", or "find C on the A string"), the player
plays it, and the app grades the answer by listening through the microphone. Voice commands, on-screen buttons and
keyboard shortcuts are alternatives. Pass / fail rounds are scored and can be saved; flashcard rounds are untimed
practice with nothing saved.

## Stack

- React 19 + Vite 8, Tailwind CSS 4 + daisyUI 5, lucide-react icons
- Web Audio API (pitch detection), Web Speech API (voice commands)
- Supabase for optional accounts, sync and practice history, with a `localStorage` fallback
- Recharts for the stats screen, Vitest for unit tests, oxlint for linting
- Optional Google Tag Manager (only when `VITE_GTM_ID` is set), Vercel Speed Insights

## How a round works

1. `App.jsx` generates a prompt with `generatePrompt()` (only notes with a position in the fret range).
2. `InputPanel` owns the answer input for the chosen mode:
   - **Mic**: `usePitchListener` runs `PitchListener` (`lib/pitchDetection.js`): YIN pitch detection on the raw mic
     signal, then `NoteTracker` turns steady pitches into note events.
   - **Voice**: `lib/voice.js` wraps the Web Speech API and matches whole words ("got it", "missed").
   - **Keys**: Space / Enter score a point, M / Backspace a miss, in every mode.
3. `App.handleDetectedNote` grades a note with `gradeDetectedNote()`: global prompts accept any octave, string prompts
   need the exact pitch. The string's octave comes from `getStringMidis()`, which infers it from standard tuning.
4. `answer()` records the attempt (including the detected note), updates the streak and moves to the next prompt.
5. `finishSession()` saves the round and its attempts to Supabase when signed in.

## Design system

Two custom daisyUI themes in `src/index.css`:

- **Tweed** (default, light): aged cream lacquer, butterscotch primary, oxblood secondary.
- **Tolex** (dark): black amp covering, amber primary, cream neutral.

Each theme also sets material variables used by the utilities `bg-cabinet` (tweed or tolex covering), `bg-plate`
(chrome or black control plate), `bg-fingerboard` (maple or rosewood), `string-plain` and `string-wound`. Fonts are
self-hosted: Yellowtail (wordmark), Barlow Condensed (display and labels), Barlow (body).

## Data

`supabase/migrations/0001_practice_tracking.sql` defines `practice_sessions` and `practice_attempts`. Attempts from the
mic fill `detected_note`, `detected_octave` and `detected_frequency_hz`. Settings sync through Supabase user metadata.
Migrations are run by hand in the Supabase SQL editor.

## Deployment

The production site deploys from `main`. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` and (for analytics)
`VITE_GTM_ID` in the hosting provider's environment variables.
