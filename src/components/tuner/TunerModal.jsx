import React, { useMemo, useState } from 'react';
import { X, Mic, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import NoteMeter from '../session/NoteMeter';
import { usePitchListener } from '../../hooks/usePitchListener';
import {
  frequencyToMidi,
  getStringMidis,
  midiToFrequency,
  midiToNoteLabel,
  readTuner,
  findMatchingTuningPreset
} from '../../lib/fretLogic';

// Close enough to call a string in tune (the meter's green band matches)
const IN_TUNE_CENTS = 5;

const MIC_MESSAGES = {
  starting: 'Waiting for the mic…',
  denied: 'The mic is blocked. Allow it in your browser’s site settings to use the tuner.',
  unavailable: 'No microphone found. Plug one in to use the tuner.',
  unsupported: 'This browser can’t listen to the mic. Try Chrome, Edge, Firefox or Safari.'
};

const noop = () => {};

function verdictFor(cents) {
  if (cents === null) return { text: 'Play one string and let it ring', tone: 'opacity-80' };
  if (Math.abs(cents) <= IN_TUNE_CENTS) return { text: 'In tune', tone: 'text-success', icon: true };
  return cents < 0
    ? { text: 'Too low · tighten the string', tone: '' }
    : { text: 'Too high · loosen the string', tone: '' };
}

// The tuner has to follow a string as it fades, so it hears quieter sound than practice rounds
// (the same threshold it had before practice rounds got stricter)
const TUNER_GATE_OFFSET_DB = -18;

/** Mounted only while the tuner is open, so the mic is off the rest of the time */
function Tuner({ instrument, sensitivity, noteDisplay }) {
  const { status, frame, gateDb, resume } = usePitchListener({
    enabled: true, instrument, sensitivity, onNote: noop, gateOffsetDb: TUNER_GATE_OFFSET_DB
  });
  const stringMidis = useMemo(() => getStringMidis(instrument), [instrument]);
  const [chosenString, setChosenString] = useState(null); // null = pick the nearest string

  const frequency = frame?.frequency ?? frame?.heldFrequency ?? null;
  const midiFloat = frequency ? frequencyToMidi(frequency) : null;
  const reading = midiFloat === null ? null : readTuner(midiFloat, stringMidis, chosenString);
  const targetIndex = chosenString ?? reading?.stringIndex ?? null;
  const targetMidi = targetIndex === null ? null : stringMidis[targetIndex];
  const cents = reading?.cents ?? null;
  // Heard an octave high: show the meter the string's real octave, so the dial matches the words
  const meterFrame = reading?.octaveSlip
    ? { ...frame, frequency: frame.frequency && frame.frequency / 2, heldFrequency: frame.heldFrequency && frame.heldFrequency / 2 }
    : frame;
  const verdict = verdictFor(cents);

  const label = (midi) => midiToNoteLabel(midi, noteDisplay);
  const target = targetMidi === null ? null : label(targetMidi);
  // Lowest string first, like the string row on a clip-on tuner
  const strings = stringMidis.map((midi, index) => ({ index, midi, number: stringMidis.length - index, ...label(midi) }));

  return (
    <div className="flex flex-col items-center gap-4">
      <NoteMeter
        frame={meterFrame}
        gateDb={gateDb}
        noteDisplay={noteDisplay}
        targetMidi={targetMidi}
        inTuneCents={IN_TUNE_CENTS}
        className="w-full max-w-xs"
      />

      <div className="text-center min-h-16">
        <p role="status" className={`flex items-center justify-center gap-2 font-display font-bold uppercase tracking-wider text-2xl ${verdict.tone}`}>
          {verdict.icon && <Check className="size-6" aria-hidden="true" />}
          {verdict.text}
        </p>
        <p className="text-sm opacity-80 tabular-nums" aria-hidden="true">
          {target
            ? <>Target {target.name}{target.octave} · {midiToFrequency(targetMidi).toFixed(1)} Hz{cents !== null && <> · {cents > 0 ? '+' : ''}{cents} cents</>}</>
            : ' '}
        </p>
      </div>

      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <h3 id="tuner-strings" className="font-display font-bold uppercase tracking-[0.15em] text-sm">String</h3>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              checked={chosenString === null}
              onChange={(e) => setChosenString(e.target.checked ? null : targetIndex ?? 0)}
            />
            Pick automatically
          </label>
        </div>
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${strings.length}, minmax(0, 1fr))` }}
          role="radiogroup"
          aria-labelledby="tuner-strings"
        >
          {strings.map(s => {
            const locked = chosenString === s.index;
            const active = targetIndex === s.index;
            return (
              <button
                key={s.index}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`String ${s.number}, ${s.name}${s.octave}`}
                onClick={() => setChosenString(locked ? null : s.index)}
                className={`btn h-auto flex-col gap-0 px-1 py-1.5 font-display ${active ? (locked ? 'btn-neutral' : 'btn-primary') : ''}`}
              >
                <span className="text-lg font-extrabold leading-none">{s.name}<sub className="text-xs font-bold">{s.octave}</sub></span>
                <span className="text-[0.65rem] opacity-80 tabular-nums">{s.number}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs opacity-80 text-center mt-2">
          {chosenString === null
            ? 'Follows the string nearest to what you play. Tap a string to lock onto it if it’s far out of tune.'
            : 'Locked onto this string. Tap it again, or switch on Pick automatically, to follow what you play.'}
        </p>
      </div>

      {status === 'suspended' ? (
        <button type="button" className="btn btn-primary" onClick={resume}>
          <Mic className="size-4" /> Tap to turn on the mic
        </button>
      ) : MIC_MESSAGES[status] ? (
        <p className={`text-sm text-center ${status === 'starting' ? 'opacity-80' : 'text-error font-semibold'}`} role="alert">
          {MIC_MESSAGES[status]}
        </p>
      ) : null}
    </div>
  );
}

export default function TunerModal({ isOpen, onClose, instrument, sensitivity, noteDisplay }) {
  const preset = findMatchingTuningPreset(instrument.tuning, instrument.stringCount);

  return (
    <Modal open={isOpen} onClose={onClose} labelledBy="tuner-title" className="max-w-lg p-0 flex flex-col max-h-[90vh]">
      <header className="flex items-center justify-between px-5 py-3 bg-cabinet border-b-4 border-(--piping)">
        <h2 id="tuner-title" className="font-display font-bold uppercase tracking-[0.2em] text-lg">Tuner</h2>
        <button type="button" onClick={onClose} className="btn btn-sm btn-ghost btn-square" aria-label="Close tuner">
          <X className="size-5" />
        </button>
      </header>

      <div className="p-5 overflow-y-auto">
        <p className="text-sm text-center opacity-80 mb-4">
          {instrument.title} · {preset && instrument.tuningId !== 'custom' ? preset.name : 'Custom'} ({instrument.tuning.join(' ')})
        </p>
        {isOpen && <Tuner instrument={instrument} sensitivity={sensitivity} noteDisplay={noteDisplay} />}
      </div>

      <footer className="flex justify-end px-5 py-3 border-t border-base-300 bg-base-200">
        <button type="button" onClick={onClose} className="btn btn-primary font-display uppercase tracking-wider">Done</button>
      </footer>
    </Modal>
  );
}
