import React from 'react';
import { Play, SlidersHorizontal, Mic, Speech, Keyboard, Crosshair, Gauge } from 'lucide-react';
import { findMatchingTuningPreset, getStringName } from '../../lib/fretLogic';
import { isPitchDetectionSupported } from '../../lib/pitchDetection';
import { isSpeechRecognitionSupported } from '../../lib/voice';

const INPUT_MODES = [
  { id: 'mic', label: 'Mic', icon: Mic, blurb: 'Play the note. FretLearn hears it and scores it.' },
  { id: 'voice', label: 'Voice', icon: Speech, blurb: 'Say “got it” or “missed” after each note.' },
  { id: 'manual', label: 'Manual', icon: Keyboard, blurb: 'Tap the buttons, or use Space and M.' }
];

const STEPS = [
  { title: 'Plug in', body: 'Allow the mic when your browser asks, then tune up with the Tuner.' },
  { title: 'Read the note', body: 'Every round shows a note, and sometimes the string to find it on.' },
  { title: 'Play it', body: 'Right note, next prompt. Wrong note counts as a miss.' }
];

function Screw({ className }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute size-2.5 rounded-full border border-black/30 bg-[radial-gradient(circle_at_35%_35%,#ffffff,#a8a49a_55%,#5a564e)] ${className}`}
    />
  );
}

export default function Launchpad({ instrument, config, onChangeConfig, onStart, onOpenSettings, onOpenTuner, weakSpots = [], onPractiseWeakSpots }) {
  const tuning = findMatchingTuningPreset(instrument.tuning, instrument.stringCount);
  const tuningName = instrument.tuningId === 'custom' || !tuning ? 'Custom' : tuning.name;
  const activeMode = INPUT_MODES.find(m => m.id === config.inputMode) ?? INPUT_MODES[0];

  const specs = [
    ['Instrument', instrument.title],
    ['Tuning', `${tuningName} · ${instrument.tuning.join(' ')}`],
    ['Frets', `${config.minFret} to ${config.maxFret}`],
    ['Notes', config.includeAccidentals ? 'All twelve' : 'Naturals only'],
    ['Prompts', config.promptType !== 'string_specific'
      ? 'Note anywhere'
      : config.promptStringIndex != null && config.promptStringIndex < instrument.tuning.length
        ? `Note on the ${getStringName(instrument.tuning, config.promptStringIndex)} string`
        : 'Note + string'],
    ['Round', config.sessionMode === 'tracked' ? 'Pass / fail, scored' : `Flashcards, ${config.flashcardSecondsPerNote}s each`]
  ];

  const isModeAvailable = (id) =>
    (id !== 'mic' || isPitchDetectionSupported()) && (id !== 'voice' || isSpeechRecognitionSupported());

  return (
    <div className="flex-1 flex flex-col gap-10 py-4 sm:py-8">
      {/* Hero */}
      <section className="text-center flex flex-col items-center">
        <h1 className="font-script text-secondary text-7xl sm:text-9xl leading-none -rotate-3 select-none">FretLearn</h1>
        <p className="mt-4 font-display font-bold uppercase tracking-[0.25em] text-lg sm:text-2xl">
          Learn every note on the neck
        </p>
        <p className="mt-3 max-w-xl text-base sm:text-lg opacity-80">
          Pick up your guitar or bass, press start and play the note on screen.
          FretLearn listens through your mic and scores every answer.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button type="button" onClick={onStart} className="btn btn-primary btn-lg font-display uppercase tracking-widest px-10">
            <Play className="size-5 fill-current" /> Start practice
          </button>
          <button
            type="button"
            onClick={onOpenTuner}
            disabled={!isPitchDetectionSupported()}
            className="btn btn-lg font-display uppercase tracking-widest"
          >
            <Gauge className="size-5" /> Tuner
          </button>
          <button type="button" onClick={onOpenSettings} className="btn btn-lg font-display uppercase tracking-widest">
            <SlidersHorizontal className="size-5" /> Settings
          </button>
        </div>
        {weakSpots.length > 0 && onPractiseWeakSpots && (
          <div className="mt-5 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <span className="text-sm opacity-80">
              Your weak spots: <strong className="font-display text-base tracking-wide">{weakSpots.map(n => n.note).join(' · ')}</strong>
            </span>
            <button type="button" onClick={onPractiseWeakSpots} className="btn btn-sm btn-secondary font-display uppercase tracking-wider">
              <Crosshair className="size-4" /> Drill them
            </button>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full max-w-4xl mx-auto">
        {/* Neck plate: the current setup */}
        <div className="md:col-span-3 relative bg-plate border rounded-box shadow-md px-7 py-6">
          <Screw className="top-2.5 left-2.5" />
          <Screw className="top-2.5 right-2.5" />
          <Screw className="bottom-2.5 left-2.5" />
          <Screw className="bottom-2.5 right-2.5" />
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <h2 className="font-display font-bold uppercase tracking-[0.2em] text-sm">Your setup</h2>
            <button type="button" onClick={onOpenSettings} className="link link-hover text-sm">Change</button>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            {specs.map(([term, value]) => (
              <React.Fragment key={term}>
                <dt className="font-display uppercase tracking-wider opacity-70">{term}</dt>
                <dd className="font-semibold truncate">{value}</dd>
              </React.Fragment>
            ))}
          </dl>
        </div>

        {/* How answers come in */}
        <fieldset className="md:col-span-2 card bg-base-100 shadow-md p-5 gap-3">
          <legend className="sr-only">Answer with</legend>
          <h2 className="font-display font-bold uppercase tracking-[0.2em] text-sm">Answer with</h2>
          <div className="join w-full" role="radiogroup" aria-label="Answer with">
            {INPUT_MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={config.inputMode === id}
                disabled={!isModeAvailable(id)}
                onClick={() => onChangeConfig('inputMode', id)}
                className={`join-item btn flex-1 font-display uppercase tracking-wider ${config.inputMode === id ? 'btn-neutral' : ''}`}
              >
                <Icon className="size-4" aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
          <p className="text-sm opacity-80">{activeMode.blurb}</p>
          {config.inputMode === 'mic' && (
            <p className="text-sm border-t border-base-300 pt-3 mt-auto">
              <span className="font-display font-bold uppercase tracking-wider">Tip</span>{' '}
              <span className="opacity-80">
                Acoustic guitars are fine near a laptop or phone. Electric guitars and basses work best through an amp or audio interface.
              </span>
            </p>
          )}
        </fieldset>
      </section>

      {/* How it works */}
      <section aria-label="How it works" className="w-full max-w-4xl mx-auto">
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="font-display font-extrabold text-5xl leading-none text-primary tabular-nums">{i + 1}</span>
              <div>
                <h3 className="font-display font-bold uppercase tracking-wider text-lg">{step.title}</h3>
                <p className="text-sm opacity-80">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
