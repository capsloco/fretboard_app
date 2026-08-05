import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mic, MicOff, HelpCircle, Volume2, AlertCircle, Zap, Keyboard } from 'lucide-react';
import { VoiceControllerHandler, isSpeechRecognitionSupported } from '../../lib/voice';
import { SoundTrigger } from '../../lib/soundTrigger';

export default function VoiceController({ onCommand }) {
  const [speechSupported, setSpeechSupported] = useState(true);
  const [activeMode, setActiveMode] = useState('speech'); // 'speech' | 'sound' | 'off'
  const [showHelp, setShowHelp] = useState(false);
  const [lastHeard, setLastHeard] = useState(null);
  
  // Sound trigger state
  const [sensitivity, setSensitivity] = useState(35);
  const soundTriggerRef = useRef(null);
  const voiceHandlerRef = useRef(null);

  useEffect(() => {
    const isSupported = isSpeechRecognitionSupported();
    setSpeechSupported(isSupported);
    if (!isSupported) {
      setActiveMode('off');
    }

    return () => {
      stopAll();
    };
  }, []);

  const stopAll = () => {
    if (voiceHandlerRef.current) {
      voiceHandlerRef.current.stop();
      voiceHandlerRef.current = null;
    }
    if (soundTriggerRef.current) {
      soundTriggerRef.current.stop();
      soundTriggerRef.current = null;
    }
  };

  // Keyboard hotkeys handler for all browsers
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        setLastHeard('Keyboard [Space/Enter]');
        onCommand({ type: 'PASS', transcript: 'Keyboard' });
        setTimeout(() => setLastHeard(null), 2000);
      } else if (e.code === 'KeyM' || e.key === 'Backspace') {
        e.preventDefault();
        setLastHeard('Keyboard [Missed]');
        onCommand({ type: 'MISS', transcript: 'Keyboard' });
        setTimeout(() => setLastHeard(null), 2000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCommand]);

  // Toggle Voice Recognition Mode
  const startSpeechMode = () => {
    stopAll();
    const handler = new VoiceControllerHandler({
      onCommand: (cmd) => {
        setLastHeard(cmd.transcript);
        onCommand(cmd);
        setTimeout(() => setLastHeard(null), 2500);
      },
      onListeningStateChange: (state) => {
        if (!state) setActiveMode('off');
      },
      onError: (err) => {
        console.warn('Speech error:', err);
      }
    });

    const ok = handler.start();
    if (ok) {
      voiceHandlerRef.current = handler;
      setActiveMode('speech');
    }
  };

  // Toggle Sound Pluck Trigger Mode (Firefox / Cross-Browser)
  const startSoundMode = async () => {
    stopAll();
    const trigger = new SoundTrigger({
      threshold: sensitivity,
      onPeak: (vol) => {
        setLastHeard(`Guitar Pluck / Snap (Vol: ${vol})`);
        onCommand({ type: 'PASS', transcript: 'Sound Peak' });
        setTimeout(() => setLastHeard(null), 2000);
      }
    });

    const ok = await trigger.start();
    if (ok) {
      soundTriggerRef.current = trigger;
      setActiveMode('sound');
    } else {
      alert('Microphone access was denied or is unavailable.');
    }
  };

  const handleModeSelect = (mode) => {
    if (mode === activeMode) {
      stopAll();
      setActiveMode('off');
      return;
    }

    if (mode === 'speech') {
      startSpeechMode();
    } else if (mode === 'sound') {
      startSoundMode();
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* Voice Command Button (Speech API) */}
        {speechSupported ? (
          <button
            onClick={() => handleModeSelect('speech')}
            className={`btn btn-sm ${activeMode === 'speech' ? 'btn-success animate-pulse' : 'btn-neutral btn-outline'} font-bold uppercase gap-1.5`}
          >
            <Mic className="w-4 h-4" />
            <span>{activeMode === 'speech' ? 'Voice Active' : 'Enable Voice'}</span>
          </button>
        ) : null}

        {/* Universal Pluck / Snap Audio Trigger (Works 100% in Firefox) */}
        <button
          onClick={() => handleModeSelect('sound')}
          className={`btn btn-sm ${activeMode === 'sound' ? 'btn-primary animate-pulse' : 'btn-neutral btn-outline'} font-bold uppercase gap-1.5`}
          title="Detects guitar string plucks, snaps, or loud notes hands-free in ANY browser"
        >
          <Zap className="w-4 h-4" />
          <span>{activeMode === 'sound' ? 'Pluck Active' : 'Pluck Trigger'}</span>
        </button>

        {/* Cheat Sheet Toggle */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="btn btn-sm btn-square btn-ghost text-base-content/70 hover:text-base-content"
          title="Hands-Free Controls Guide"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Firefox Web Speech API info banner */}
      {!speechSupported && (
        <div className="alert alert-info py-1.5 px-3 text-xs font-mono max-w-md">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Firefox detected: Use <strong>Pluck Trigger</strong> or <strong>Spacebar</strong> for hands-free practice!</span>
        </div>
      )}

      {/* Last Heard Feedback Badge */}
      {lastHeard && (
        <div className="badge badge-primary badge-outline font-mono text-xs animate-bounce shadow-md py-2">
          Triggered: <span className="font-bold ml-1">"{lastHeard}"</span>
        </div>
      )}

      {/* Controls Cheat Sheet Modal */}
      {showHelp && createPortal(
        <div 
          className="modal modal-open bg-base-900/80 backdrop-blur-sm z-[100]"
          onClick={() => setShowHelp(false)}
        >
          <div 
            className="modal-box bg-base-100 border border-base-300 max-w-md shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-primary" />
                Hands-Free Controls Guide
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="btn btn-sm btn-ghost btn-circle font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-base-200 rounded-box border border-primary/20">
                <div className="font-bold text-primary mb-1 flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> 1. Pluck / Snap Audio Trigger (Works Everywhere)
                </div>
                <div className="text-xs text-base-content/80">
                  Pluck a string loudly, snap your fingers, or tap your guitar body! FretLearn registers any audio peak hands-free.
                </div>
              </div>

              <div className="p-3 bg-base-200 rounded-box border border-success/20">
                <div className="font-bold text-success mb-1 flex items-center gap-1.5">
                  <Mic className="w-4 h-4" /> 2. Voice Recognition (Chrome / Edge / Safari)
                </div>
                <div className="text-xs text-base-content/80 font-mono">
                  Say: <span className="text-base-content font-bold font-sans">"Got it"</span>, <span className="text-base-content font-bold font-sans">"Hit"</span>, <span className="text-base-content font-bold font-sans">"Pass"</span> for correct ➔ <span className="text-base-content font-bold font-sans">"Missed"</span> for wrong.
                </div>
              </div>

              <div className="p-3 bg-base-200 rounded-box border border-secondary/20">
                <div className="font-bold text-secondary mb-1 flex items-center gap-1.5">
                  <Keyboard className="w-4 h-4" /> 3. Keyboard / Footswitch Hotkeys
                </div>
                <div className="text-xs text-base-content/80 font-mono">
                  Press <span className="font-bold text-base-content">Spacebar</span> or <span className="font-bold text-base-content">Enter</span> = Got it! <br />
                  Press <span className="font-bold text-base-content">Backspace</span> or <span className="font-bold text-base-content">M</span> = Missed.
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button
                onClick={() => setShowHelp(false)}
                className="btn btn-primary btn-block"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
