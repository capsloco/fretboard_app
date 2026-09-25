import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { PitchListener, isPitchDetectionSupported } from '../lib/pitchDetection';
import { getInstrumentFrequencyRange } from '../lib/fretLogic';

/** Sensitivity 1-10 -> noise gate in dBFS (1 = only loud notes, 10 = picks up a whisper) */
export function sensitivityToGateDb(sensitivity) {
  return -25 - 4 * sensitivity;
}

/**
 * Runs note detection on the microphone while `enabled` is true.
 *
 * status: 'off' | 'starting' | 'listening' | 'suspended' | 'denied' | 'unavailable' | 'unsupported'
 * frame:  latest analysis frame ({ frequency, levelDb, ... }) for meters, ~30 per second
 */
export function usePitchListener({ enabled, instrument, sensitivity, onNote }) {
  const [status, setStatus] = useState('off');
  const [frame, setFrame] = useState(null);
  const listenerRef = useRef(null);
  const onNoteRef = useRef(onNote);

  useEffect(() => {
    onNoteRef.current = onNote;
  });

  const { minFrequency, maxFrequency } = useMemo(
    () => getInstrumentFrequencyRange(instrument),
    [instrument]
  );
  const gateDb = sensitivityToGateDb(sensitivity);

  useEffect(() => {
    if (!enabled) return undefined;
    if (!isPitchDetectionSupported()) {
      setStatus('unsupported');
      return undefined;
    }

    let cancelled = false;
    const listener = new PitchListener({
      onFrame: setFrame,
      onNote: (note) => onNoteRef.current?.(note)
    });
    listenerRef.current = listener;
    setStatus('starting');

    listener.start()
      .then((result) => {
        if (!cancelled && result !== 'stopped') setStatus(result);
      })
      .catch((error) => {
        if (!cancelled) setStatus(error?.name === 'NotAllowedError' ? 'denied' : 'unavailable');
      });

    return () => {
      cancelled = true;
      listener.stop();
      listenerRef.current = null;
      setStatus('off');
      setFrame(null);
    };
  }, [enabled]);

  // Runs after the effect above on mount, so a new listener is configured before its first frame
  useEffect(() => {
    listenerRef.current?.configure({ minFrequency, maxFrequency, gateDb });
  }, [enabled, minFrequency, maxFrequency, gateDb]);

  /** Retry after the browser kept audio suspended (needs to run inside a click) */
  const resume = useCallback(async () => {
    if (listenerRef.current) setStatus(await listenerRef.current.resume());
  }, []);

  return { status, frame, gateDb, resume };
}
