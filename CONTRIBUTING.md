# Contributing to FretLearn

Thanks for helping out. Issues and pull requests are both welcome; for anything bigger than a bug fix, open an issue
first so we can agree on the approach.

## Setup

```bash
npm install
npm run dev
```

Node.js 22.12 or newer. No accounts or keys are needed; see the README for the optional Supabase and analytics
variables.

## Before you open a pull request

```bash
npm run lint
npm test
npm run build
```

All three should pass. If you change detection or grading, add or update tests in `src/lib/*.test.js`.

## Testing note detection without an instrument

Chromium can use a WAV file as a fake microphone:

```bash
chromium --use-fake-ui-for-media-stream --use-fake-device-for-media-stream \
  --use-file-for-fake-audio-capture=/path/to/notes.wav http://localhost:5173
```

A mono 48 kHz WAV of a few plucked notes with short gaps between them works well. The file loops.

## Code style

- **UI**: use daisyUI component classes and Tailwind utilities. The daisyUI reference lives in
  `.agents/skills/daisyui/`.
- **Colour**: use theme colours (`base-*`, `primary`, `secondary`, ...) and the material utilities in `src/index.css`
  (`bg-cabinet`, `bg-plate`, `bg-fingerboard`) so both themes work. Fixed colours are only for physical hardware
  that looks the same in any light, like the meter bezel or the pilot lamp.
- **Logic**: keep music and pitch maths in pure functions in `src/lib/` so it can be unit tested.
- **Copy**: plain and specific. Say what happens ("Wrong note counts as a miss"), skip the hype and emoji.

## Adding a tuning preset

Add it to `TUNING_PRESETS` in `src/lib/fretLogic.js` with an `octaves` string such as `'D2 - A2 - D3 - G3 - B3 - E4'`.
The test suite checks that the octave the app infers for each string matches what you wrote, which is what string
prompts are graded against.

## Database changes

Supabase migrations live in `supabase/migrations/` and are run by hand in the Supabase SQL editor. Add a new numbered
file rather than editing an existing one.
