import React, { useEffect, useRef, useState } from 'react';
import { Mic, Speech, Keyboard, HelpCircle, Flag } from 'lucide-react';
import NoteMeter from './NoteMeter';
import InputHelpDialog from './InputHelpDialog';
import { usePitchListener } from '../../hooks/usePitchListener';
import { VoiceControllerHandler, isSpeechRecognitionSupported } from '../../lib/voice';

const MODES = [
  { id: 'mic', label: 'Mic', icon: Mic },
  { id: 'voice', label: 'Voice', icon: Speech },
  { id: 'manual', label: 'Manual', icon: Keyboard }
];

const MIC_MESSAGES = {
  starting: 'Waiting for the mic…',
  listening: 'Play the note. It is graded as soon as it rings clearly.',
  denied: 'The mic is blocked. Allow it in your browser’s site settings, or switch to Voice or Manual.',
  unavailable: 'No microphone found. Plug one in, or switch to Voice or Manual.',
  unsupported: 'This browser can’t listen to the mic. Try Chrome, Edge, Firefox or Safari.'
};

const VOICE_ERRORS = {
  'not-allowed': 'The mic is blocked for voice commands. Allow it in your browser’s site settings.',
  'service-not-allowed': 'This browser won’t run voice commands here. Switch to Mic or Manual.',
  network: 'Voice commands need an internet connection in this browser. Switch to Mic or Manual.',
  'audio-capture': 'No microphone found for voice commands.',
  default: 'Voice commands stopped working. Switch to Mic or Manual.'
};

function PilotLamp({ on }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-3.5 rounded-full border border-black/40 transition-shadow ${
        on
          ? 'bg-[radial-gradient(circle_at_35%_35%,#ffd9a0,#e8452c_55%,#8a1f12)] shadow-[0_0_10px_3px_rgb(232_69_44/0.55)]'
          : 'bg-[radial-gradient(circle_at_35%_35%,#8a4a3a,#4a1a12)]'
      }`}
    />
  );
}

/**
 * The practice "control plate": how answers come in (mic note detection,
 * voice commands or manual buttons/keys), plus the live meter.
 * Keyboard shortcuts work in every mode.
 */
export default function InputPanel({
  mode,
  onModeChange,
  instrument,
  noteDisplay,
  sensitivity,
  onSensitivityChange,
  onNote,
  onCommand,
  onEndRound
}) {
  const helpRef = useRef(null);
  const onCommandRef = useRef(onCommand);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [lastHeard, setLastHeard] = useState(null);
  const speechSupported = isSpeechRecognitionSupported();

  useEffect(() => {
    onCommandRef.current = onCommand;
  });

  const { status, frame, gateDb, resume } = usePitchListener({
    enabled: mode === 'mic',
    instrument,
    sensitivity,
    onNote
  });

  // Voice commands
  useEffect(() => {
    if (mode !== 'voice' || !speechSupported) return undefined;
    const handler = new VoiceControllerHandler({
      onCommand: (cmd) => {
        setLastHeard(cmd.transcript);
        onCommandRef.current(cmd);
      },
      onListeningStateChange: (listening) => {
        setVoiceListening(listening);
        if (listening) setVoiceError(null);
      },
      onError: (error) => {
        // 'no-speech' and 'aborted' are routine; the handler restarts itself
        if (error !== 'no-speech' && error !== 'aborted') setVoiceError(error);
      }
    });
    handler.start();
    return () => {
      handler.stop();
      setVoiceListening(false);
      setVoiceError(null);
    };
  }, [mode, speechSupported]);

  useEffect(() => {
    if (!lastHeard) return undefined;
    const timer = setTimeout(() => setLastHeard(null), 2500);
    return () => clearTimeout(timer);
  }, [lastHeard]);

  // Keyboard / footswitch shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (document.querySelector('dialog[open]')) return;

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        onCommandRef.current({ type: 'PASS', transcript: 'Keyboard', source: 'keyboard' });
      } else if (e.code === 'KeyM' || e.key === 'Backspace') {
        e.preventDefault();
        onCommandRef.current({ type: 'MISS', transcript: 'Keyboard', source: 'keyboard' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const lampOn = (mode === 'mic' && status === 'listening') || (mode === 'voice' && voiceListening);

  return (
    <section
      aria-label="Answer input"
      className="bg-plate border rounded-box shadow-md px-3 py-3 sm:px-4 flex flex-col sm:flex-row sm:items-center gap-3"
    >
      {/* Left: lamp + mode switch */}
      <div className="flex items-center justify-between sm:justify-start gap-3">
        <div className="flex items-center gap-2">
          <PilotLamp on={lampOn} />
          <span className="font-display font-bold uppercase tracking-[0.2em] text-xs">Input</span>
        </div>

        <div className="join" role="radiogroup" aria-label="Input mode">
          {MODES.map(({ id, label, icon: Icon }) => {
            const disabled = id === 'voice' && !speechSupported;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={mode === id}
                disabled={disabled}
                title={disabled ? 'Voice commands need Chrome, Edge or Safari' : undefined}
                onClick={() => onModeChange(id)}
                className={`join-item btn btn-sm font-display uppercase tracking-wider ${mode === id ? 'btn-neutral' : ''}`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 sm:hidden">
          <button type="button" className="btn btn-sm btn-ghost btn-square" onClick={() => helpRef.current?.showModal()} aria-label="How answering works">
            <HelpCircle className="size-4" />
          </button>
        </div>
      </div>

      {/* Middle: live readout for the active mode */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        {mode === 'mic' && (
          <>
            <NoteMeter frame={frame} gateDb={gateDb} noteDisplay={noteDisplay} className="w-32 sm:w-40 shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              {status === 'suspended' ? (
                <button type="button" className="btn btn-sm btn-primary" onClick={resume}>
                  <Mic className="size-4" /> Tap to turn on the mic
                </button>
              ) : (
                <p className={`text-sm leading-snug ${['denied', 'unavailable', 'unsupported'].includes(status) ? 'text-error font-semibold' : 'opacity-80'}`} role="status">
                  {MIC_MESSAGES[status] ?? ''}
                </p>
              )}
              <label className="flex items-center gap-2 text-xs font-display uppercase tracking-wider">
                <span className="shrink-0">Sensitivity</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sensitivity}
                  onChange={(e) => onSensitivityChange(Number(e.target.value))}
                  className="range range-xs range-primary max-w-40"
                  aria-label="Mic sensitivity"
                />
                <span className="tabular-nums w-4">{sensitivity}</span>
              </label>
            </div>
          </>
        )}

        {mode === 'voice' && (
          <p className="text-sm opacity-80" role="status">
            {voiceError ? (
              <span className="text-error font-semibold">{VOICE_ERRORS[voiceError] ?? VOICE_ERRORS.default}</span>
            ) : lastHeard ? (
              <>Heard <strong className="font-semibold">“{lastHeard}”</strong></>
            ) : voiceListening ? (
              <>Say <strong>“got it”</strong> or <strong>“missed”</strong>.</>
            ) : (
              'Starting voice commands…'
            )}
          </p>
        )}

        {mode === 'manual' && (
          <p className="text-sm opacity-80 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span><kbd className="kbd kbd-sm">Space</kbd> got it</span>
            <span><kbd className="kbd kbd-sm">M</kbd> missed</span>
          </p>
        )}
      </div>

      {/* Right: help + end */}
      <div className="flex items-center justify-end gap-2">
        <button type="button" className="btn btn-sm btn-ghost btn-square hidden sm:inline-flex" onClick={() => helpRef.current?.showModal()} aria-label="How answering works">
          <HelpCircle className="size-4" />
        </button>
        <button type="button" onClick={onEndRound} className="btn btn-sm font-display uppercase tracking-wider">
          <Flag className="size-4" /> End round
        </button>
      </div>

      <InputHelpDialog ref={helpRef} />
    </section>
  );
}
