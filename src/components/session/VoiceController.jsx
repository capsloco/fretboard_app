import React, { useState, useEffect, useRef } from 'react';
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
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md ${
              activeMode === 'speech'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <Mic className={`w-4 h-4 ${activeMode === 'speech' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>{activeMode === 'speech' ? 'Voice Control Active' : 'Enable Voice'}</span>
          </button>
        ) : null}

        {/* Universal Pluck / Snap Audio Trigger (Works 100% in Firefox) */}
        <button
          onClick={() => handleModeSelect('sound')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md ${
            activeMode === 'sound'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
          title="Detects guitar string plucks, snaps, or loud notes hands-free in ANY browser"
        >
          <Zap className={`w-4 h-4 ${activeMode === 'sound' ? 'text-cyan-400' : 'text-slate-400'}`} />
          <span>{activeMode === 'sound' ? 'Pluck/Snap Trigger Active' : 'Pluck Trigger (Firefox)'}</span>
        </button>

        {/* Cheat Sheet Toggle */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
          title="Hands-Free Controls Guide"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Firefox Web Speech API info banner */}
      {!speechSupported && (
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-mono">
          <AlertCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Firefox detected: Use <strong>Pluck Trigger</strong> or <strong>Spacebar</strong> for hands-free practice!</span>
        </div>
      )}

      {/* Last Heard Feedback Badge */}
      {lastHeard && (
        <div className="text-xs font-mono text-cyan-300 bg-cyan-950/90 px-3 py-1 rounded-md border border-cyan-800/80 animate-bounce shadow-md">
          Triggered: <span className="font-bold text-white">"{lastHeard}"</span>
        </div>
      )}

      {/* Controls Cheat Sheet Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-cyan-400" />
                Hands-Free Controls Guide
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-cyan-900/40">
                <div className="font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> 1. Pluck / Snap Audio Trigger (Works Everywhere)
                </div>
                <div className="text-xs text-slate-300">
                  Pluck a string loudly, snap your fingers, or tap your guitar body! FretFlow registers any audio peak hands-free.
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-emerald-900/40">
                <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <Mic className="w-4 h-4" /> 2. Voice Recognition (Chrome / Edge / Safari)
                </div>
                <div className="text-xs text-slate-300 font-mono">
                  Say: <span className="text-white font-semibold font-sans">"Got it"</span>, <span className="text-white font-semibold font-sans">"Hit"</span>, <span className="text-white font-semibold font-sans">"Pass"</span> for correct ➔ <span className="text-white font-semibold font-sans">"Missed"</span> for wrong.
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-purple-900/40">
                <div className="font-bold text-purple-400 mb-1 flex items-center gap-1.5">
                  <Keyboard className="w-4 h-4" /> 3. Keyboard / Footswitch Hotkeys
                </div>
                <div className="text-xs text-slate-300 font-mono">
                  Press <span className="text-white font-bold">Spacebar</span> or <span className="text-white font-bold">Enter</span> = Got it! <br />
                  Press <span className="text-white font-bold">Backspace</span> or <span className="text-white font-bold">M</span> = Missed.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-colors text-sm"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
