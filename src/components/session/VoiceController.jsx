import React, { useState, useEffect } from 'react';
import { Mic, MicOff, HelpCircle, Volume2, AlertCircle } from 'lucide-react';
import { VoiceControllerHandler, isSpeechRecognitionSupported } from '../../lib/voice';

export default function VoiceController({ onCommand }) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [voiceHandler, setVoiceHandler] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [lastHeard, setLastHeard] = useState(null);

  useEffect(() => {
    if (!isSpeechRecognitionSupported()) {
      setSupported(false);
      return;
    }

    const handler = new VoiceControllerHandler({
      onCommand: (cmd) => {
        setLastHeard(cmd.transcript);
        onCommand(cmd);
        // Clear last heard badge after 2.5s
        setTimeout(() => setLastHeard(null), 2500);
      },
      onListeningStateChange: (state) => {
        setListening(state);
      },
      onError: (err) => {
        console.warn('Voice error handler:', err);
      }
    });

    setVoiceHandler(handler);

    return () => {
      if (handler) handler.stop();
    };
  }, []);

  const toggleListening = () => {
    if (!voiceHandler) return;
    if (listening) {
      voiceHandler.stop();
    } else {
      voiceHandler.start();
    }
  };

  if (!supported) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs font-mono">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>Voice API not supported in this browser. Use green/red buttons below.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3">
        {/* Toggle Listening Button */}
        <button
          onClick={toggleListening}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md ${
            listening
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          {listening ? (
            <>
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <Mic className="w-4 h-4 text-emerald-400 relative z-10" />
              </div>
              <span>Listening Active</span>
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4 text-slate-400" />
              <span>Enable Voice Control</span>
            </>
          )}
        </button>

        {/* Cheat Sheet Toggle */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
          title="Voice Commands Guide"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Last Heard Feedback Badge */}
      {lastHeard && (
        <div className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-3 py-1 rounded-md border border-cyan-800/60 animate-bounce">
          Heard: <span className="font-bold text-white">"{lastHeard}"</span>
        </div>
      )}

      {/* Voice Commands Cheat Sheet Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-cyan-400" />
                Voice Command Guide
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-emerald-900/40">
                <div className="font-bold text-emerald-400 mb-1">✅ Pass / Correct</div>
                <div className="text-xs text-slate-300 font-mono">
                  Say: <span className="text-white font-semibold font-sans">"Got it"</span>, <span className="text-white font-semibold font-sans font-sans">"Got"</span>, <span className="text-white font-semibold font-sans">"Pass"</span>, <span className="text-white font-semibold font-sans">"Correct"</span>, <span className="text-white font-semibold font-sans">"Hit"</span>, or <span className="text-white font-semibold font-sans">"Next"</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-rose-900/40">
                <div className="font-bold text-rose-400 mb-1">❌ Miss / Incorrect</div>
                <div className="text-xs text-slate-300 font-mono">
                  Say: <span className="text-white font-semibold font-sans">"Missed"</span>, <span className="text-white font-semibold font-sans">"Miss"</span>, <span className="text-white font-semibold font-sans">"Wrong"</span>, <span className="text-white font-semibold font-sans">"No"</span>, or <span className="text-white font-semibold font-sans">"Skip"</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-cyan-900/40">
                <div className="font-bold text-cyan-400 mb-1">⏸️ Control Commands</div>
                <div className="text-xs text-slate-300 font-mono">
                  Say: <span className="text-white font-semibold font-sans">"Pause"</span> or <span className="text-white font-semibold font-sans">"Resume"</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-colors text-sm"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
