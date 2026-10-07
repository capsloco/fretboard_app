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
 * status:   'off' | 'starting' | 'listening' | 'suspended' | 'denied' | 'unavailable' | 'unsupported'
 * frame:    latest analysis frame ({ frequency, clarity, levelDb, ... }) for meters, ~30 per second
 * onFrame:  also called with every frame, for callers that process each one (the tuner)
 * windowMs: how much audio each analysis looks at; the tuner asks for more than practice does
 */
export function usePitchListener({ enabled, instrument, sensitivity, onNote, onFrame, windowMs }) {
  const [status, setStatus] = useState('off');
  const [frame, setFrame] = useState(null);
  const listenerRef = useRef(null);
  const callbacksRef = useRef({ onNote, onFrame });
  const windowMsRef = useRef(windowMs);

  useEffect(() => {
    callbacksRef.current = { onNote, onFrame };
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
      windowMs: windowMsRef.current,
      onFrame: (nextFrame) => {
        setFrame(nextFrame);
        callbacksRef.current.onFrame?.(nextFrame);
      },
      onNote: (note) => callbacksRef.current.onNote?.(note)
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
