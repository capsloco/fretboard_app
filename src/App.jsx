import React, { useState, useEffect, useRef } from 'react';
import Header from './components/ui/Header';
import DisplayPrompt from './components/session/DisplayPrompt';
import Fretboard from './components/fretboard/Fretboard';
import VoiceController from './components/session/VoiceController';
import SessionSummary from './components/session/SessionSummary';
import SessionSettingsModal from './components/ui/SessionSettingsModal';
import AuthModal from './components/ui/AuthModal';
import LegalModal from './components/ui/LegalModal';
import { generatePrompt, INSTRUMENT_PRESETS, TUNING_PRESETS } from './lib/fretLogic';
import { loadCustomInstruments, savePracticeSession, getCurrentUser, loadUserSettings, saveUserSettings, subscribeToAuthChanges } from './lib/supabase';
import { Play, CheckCircle2, XCircle, Sliders, RotateCcw, Volume2, Eye, EyeOff, Trophy, Sparkles } from 'lucide-react';

export default function App() {
  // Instrument & Custom Config state
  const [currentInstrument, setCurrentInstrument] = useState(INSTRUMENT_PRESETS[0]);
  const [userCustomInstruments, setUserCustomInstruments] = useState([]);
  const [user, setUser] = useState(null);

  // Modal States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('normal');
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState('privacy');

  // Session Parameters State
  const [config, setConfig] = useState({
    sessionMode: 'tracked', // 'tracked' | 'flashcard'
    promptType: 'global', // 'global' | 'string_specific'
    includeAccidentals: false,
    noteDisplay: 'sharps', // 'sharps' | 'both' | 'flats'
    minFret: 0,
    maxFret: 12,
    flashcardSecondsPerNote: 4,
    flashcardDurationMins: 5
  });

  // Active Session State
  const [sessionState, setSessionState] = useState('idle'); // 'idle' | 'running' | 'summary'
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);

  // Timers & Counter State
  const [timeLeft, setTimeLeft] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Stats Tracker
  const [stats, setStats] = useState({
    totalPrompts: 0,
    correctCount: 0,
    incorrectCount: 0,
    currentStreak: 0,
    bestStreak: 0
  });

  const timerRef = useRef(null);

  // Load saved user settings, custom instruments & auth on mount
  useEffect(() => {
    async function initData() {
      const u = await getCurrentUser();
      setUser(u);
      
      const customInsts = await loadCustomInstruments(u?.id);
      setUserCustomInstruments(customInsts);

      const savedSettings = await loadUserSettings(u?.id);
      if (savedSettings) {
        if (savedSettings.config) {
          setConfig(prev => ({ ...prev, ...savedSettings.config }));
        }
        if (savedSettings.instrumentId) {
          const allInsts = [...INSTRUMENT_PRESETS, ...customInsts];
          const matched = allInsts.find(i => i.id === savedSettings.instrumentId);
          if (matched) {
            if (savedSettings.instrument?.tuning) {
              setCurrentInstrument({ ...matched, ...savedSettings.instrument });
            } else {
              setCurrentInstrument(matched);
            }
          }
        } else if (savedSettings.instrument) {
          setCurrentInstrument(savedSettings.instrument);
        }
      }
    }
    initData();

    // Check if user landed via password reset link (URL hash or search param contains recovery type)
    if (window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery')) {
      setAuthModalMode('update_password');
      setIsAuthOpen(true);
    }

    const sub = subscribeToAuthChanges((u, event) => {
      setUser(u);
      if (event === 'PASSWORD_RECOVERY' || window.location.hash.includes('type=recovery')) {
        setAuthModalMode('update_password');
        setIsAuthOpen(true);
      }
    });
    return () => {
      if (sub?.unsubscribe) sub.unsubscribe();
    };
  }, []);

  // Auto-persist user settings on config / instrument changes
  const saveSettingsToStorage = (updatedConfig, updatedInst) => {
    const targetConfig = updatedConfig || config;
    const targetInst = updatedInst || currentInstrument;
    saveUserSettings({
      config: targetConfig,
      instrumentId: targetInst.id,
      instrument: targetInst
    }, user?.id);
  };

  // Update session config
  const handleConfigChange = (key, value) => {
    setConfig(prev => {
      const updated = { ...prev, [key]: value };
      saveSettingsToStorage(updated, currentInstrument);
      return updated;
    });
  };

  const handleInstrumentSelect = (inst) => {
    setCurrentInstrument(inst);
    if (config.maxFret > inst.fretCount) {
      handleConfigChange('maxFret', inst.fretCount);
    }
    saveSettingsToStorage(config, inst);
  };

  const handleTuningSelect = (tuningId) => {
    if (!tuningId) return;
    if (tuningId === 'custom') {
      const updated = {
        ...currentInstrument,
        tuningId: 'custom'
      };
      setCurrentInstrument(updated);
      saveSettingsToStorage(config, updated);
      return;
    }

    const preset = TUNING_PRESETS.find(t => t.id === tuningId);
    if (preset) {
      const updated = {
        ...currentInstrument,
        tuningId: preset.id,
        tuningName: preset.name,
        tuning: [...preset.tuning]
      };
      setCurrentInstrument(updated);
      saveSettingsToStorage(config, updated);
    }
  };

  // Start new practice session
  const startNewSession = () => {
    setStats({
      totalPrompts: 0,
      correctCount: 0,
      incorrectCount: 0,
      currentStreak: 0,
      bestStreak: 0
    });
    setSessionStartTime(Date.now());
    setIsRevealed(false);
    
    // Generate initial prompt synchronously
    const firstPrompt = generatePrompt({
      promptType: config.promptType,
      includeAccidentals: config.includeAccidentals,
      minFret: config.minFret,
      maxFret: config.maxFret,
      instrument: currentInstrument,
      noteDisplay: config.noteDisplay || (config.useFlats ? 'flats' : 'sharps')
    });
    setCurrentPrompt(firstPrompt);

    if (config.sessionMode === 'flashcard') {
      setTimeLeft(config.flashcardSecondsPerNote);
    } else {
      setTimeLeft(null);
    }

    setSessionState('running');
  };

  // Generate next prompt
  const nextPrompt = () => {
    setIsRevealed(false);
    const newPrompt = generatePrompt({
      promptType: config.promptType,
      includeAccidentals: config.includeAccidentals,
      minFret: config.minFret,
      maxFret: config.maxFret,
      instrument: currentInstrument,
      noteDisplay: config.noteDisplay || (config.useFlats ? 'flats' : 'sharps'),
      previousNote: currentPrompt?.note
    });

    setCurrentPrompt(newPrompt);

    // Setup timer if flashcard mode
    if (config.sessionMode === 'flashcard') {
      setTimeLeft(config.flashcardSecondsPerNote);
    } else {
      setTimeLeft(null);
    }
  };

  // Flashcard mode loop timer effect
  useEffect(() => {
    if (sessionState !== 'running' || config.sessionMode !== 'flashcard') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          nextPrompt();
          return config.flashcardSecondsPerNote;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionState, config.sessionMode, config.flashcardSecondsPerNote, currentPrompt]);

  // Handle Pass / Correct action
  const handlePass = () => {
    setStats(prev => {
      const newCorrect = prev.correctCount + 1;
      const newTotal = prev.totalPrompts + 1;
      const newStreak = prev.currentStreak + 1;
      const newBest = Math.max(prev.bestStreak, newStreak);
      return {
        ...prev,
        totalPrompts: newTotal,
        correctCount: newCorrect,
        currentStreak: newStreak,
        bestStreak: newBest
      };
    });
    nextPrompt();
  };

  // Handle Miss / Incorrect action
  const handleMiss = () => {
    setStats(prev => {
      const newIncorrect = prev.incorrectCount + 1;
      const newTotal = prev.totalPrompts + 1;
      return {
        ...prev,
        totalPrompts: newTotal,
        incorrectCount: newIncorrect,
        currentStreak: 0
      };
    });
    nextPrompt();
  };

  // Handle Voice Command input
  const handleVoiceCommand = (cmd) => {
    if (sessionState !== 'running') return;
    if (cmd.type === 'PASS') {
      handlePass();
    } else if (cmd.type === 'MISS') {
      handleMiss();
    }
  };

  // Finish practice session and calculate stats
  const finishSession = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const durationSecs = sessionStartTime 
      ? Math.max(1, Math.floor((Date.now() - sessionStartTime) / 1000))
      : 0;

    const accuracy = stats.totalPrompts > 0 
      ? Math.round((stats.correctCount / stats.totalPrompts) * 100)
      : 0;

    setSessionState('summary');

    // Save session stats to DB / LocalStorage
    await savePracticeSession({
      instrumentName: currentInstrument.title,
      sessionType: config.sessionMode,
      promptType: config.promptType,
      totalPrompts: stats.totalPrompts,
      correctCount: stats.correctCount,
      incorrectCount: stats.incorrectCount,
      accuracyPct: accuracy,
      durationSeconds: durationSecs
    }, user?.id);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Header */}
      <Header
        currentInstrument={currentInstrument}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        user={user}
        setUser={setUser}
        onSelectTuning={handleTuningSelect}
        isSessionRunning={sessionState === 'running'}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-6 lg:p-8 flex flex-col justify-between space-y-3 sm:space-y-6">
        {sessionState === 'idle' ? (
          /* IDLE / HERO LANDING SCREEN */
          <div className="my-auto flex flex-col items-center text-center space-y-8 py-12 px-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs uppercase tracking-widest shadow-lg shadow-cyan-500/10">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Hands-Free Fretboard Mastery
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              Train Note Recall <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
                From 4 to 6 Feet Away
              </span>
            </h1>

            <p className="text-slate-400 text-base sm:text-lg max-w-xl font-normal leading-relaxed">
              Set your device down, grab your physical guitar or bass, and react hands-free using high-visibility prompts and voice controls.
            </p>

            {/* Quick Session Launch Card */}
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-mono text-slate-500 uppercase">Selected Instrument & Tuning</div>
                    <div className="font-bold text-cyan-300 text-sm mt-1">{currentInstrument.title}</div>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">
                      {currentInstrument.stringCount} Strings ({currentInstrument.fretCount} Frets)
                    </div>
                  </div>
                  <div className="mt-2 text-xs font-mono text-cyan-400 font-semibold bg-cyan-950/50 px-2.5 py-1 rounded-lg border border-cyan-800/40 inline-block self-start">
                    ⚡ {currentInstrument.tuning?.join(' - ')}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs font-mono text-slate-500 uppercase">Selected Mode</div>
                  <div className="font-bold text-white text-sm mt-1">
                    {config.sessionMode === 'tracked' ? 'Pass / Fail Tracked' : 'Timed Flashcard'}
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-1">
                    Frets {config.minFret}–{config.maxFret} • {config.promptType === 'global' ? 'Global' : 'String Specific'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={startNewSession}
                  className="flex-1 py-4 px-8 rounded-2xl font-extrabold text-base uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/25 active:scale-95 transition-all"
                >
                  <Play className="w-5 h-5 fill-current" /> Start Practice Session
                </button>

                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="py-4 px-6 rounded-2xl font-bold text-sm uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Sliders className="w-4 h-4 text-slate-400" /> Configure Settings
                </button>
              </div>
            </div>
          </div>
        ) : sessionState === 'summary' ? (
          /* SESSION SUMMARY SCREEN */
          <div className="my-auto py-8">
            <SessionSummary
              stats={{
                ...stats,
                accuracyPct: stats.totalPrompts > 0 ? Math.round((stats.correctCount / stats.totalPrompts) * 100) : 0,
                durationSeconds: sessionStartTime ? Math.max(1, Math.floor((Date.now() - sessionStartTime) / 1000)) : 0,
                instrumentTitle: currentInstrument.title,
                sessionType: config.sessionMode
              }}
              onRestart={startNewSession}
              onOpenSettings={() => {
                setSessionState('idle');
                setIsSettingsOpen(true);
              }}
            />
          </div>
        ) : (
          /* ACTIVE PRACTICE SESSION SCREEN */
          <div className="flex-1 flex flex-col justify-between space-y-2 sm:space-y-4 py-1">
            {/* Top Bar Controls in Active Session */}
            <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800/80 rounded-2xl px-3 py-2 sm:px-4 sm:py-3 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <VoiceController onCommand={handleVoiceCommand} />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={finishSession}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  End Round
                </button>
              </div>
            </div>

            {/* Main High-Visibility Prompt View */}
            <DisplayPrompt
              prompt={currentPrompt}
              sessionMode={config.sessionMode}
              timeLeft={timeLeft}
              isRevealed={isRevealed}
              onRevealToggle={() => setIsRevealed(!isRevealed)}
              listening={voiceListening}
              streak={stats.currentStreak}
            />

            {/* High-Visibility Action Buttons for Pass / Fail Mode (Green / Red) */}
            {config.sessionMode === 'tracked' && (
              <div className="w-full max-w-2xl mx-auto grid grid-cols-2 gap-3 sm:gap-4 my-1 sm:my-2">
                <button
                  onClick={handleMiss}
                  className="py-3 sm:py-5 px-3 sm:px-6 rounded-2xl font-black text-sm sm:text-xl uppercase tracking-wider bg-gradient-to-tr from-rose-950 via-rose-900 to-rose-950 hover:from-rose-900 hover:to-rose-800 text-rose-200 border-2 border-rose-600/70 shadow-[0_0_25px_rgba(225,29,72,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 sm:gap-3 cursor-pointer"
                >
                  <XCircle className="w-5 h-5 sm:w-7 sm:h-7 text-rose-400 stroke-[2.5]" />
                  <span>MISSED ("Missed")</span>
                </button>

                <button
                  onClick={handlePass}
                  className="py-3 sm:py-5 px-3 sm:px-6 rounded-2xl font-black text-sm sm:text-xl uppercase tracking-wider bg-gradient-to-tr from-emerald-950 via-emerald-900 to-emerald-950 hover:from-emerald-900 hover:to-emerald-800 text-emerald-200 border-2 border-emerald-500/70 shadow-[0_0_25px_rgba(16,185,129,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 sm:gap-3 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-400 stroke-[2.5]" />
                  <span>GOT IT ("Got it")</span>
                </button>
              </div>
            )}

            {/* Visual Interactive Fretboard */}
            <div className="w-full">
              <Fretboard
                instrument={currentInstrument}
                highlightPositions={currentPrompt?.validPositions || []}
                revealed={isRevealed}
                minFret={config.minFret}
                maxFret={config.maxFret}
                noteDisplay={config.noteDisplay || (config.useFlats ? 'flats' : 'sharps')}
                targetNote={currentPrompt?.note}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/60 py-4 px-6 text-xs font-mono text-slate-400 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} FretLearn</div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => {
                setLegalTab('privacy');
                setIsLegalOpen(true);
              }}
              className="hover:text-cyan-400 transition-colors"
            >
              Privacy Policy
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => {
                setLegalTab('terms');
                setIsLegalOpen(true);
              }}
              className="hover:text-cyan-400 transition-colors"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SessionSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onChangeConfig={handleConfigChange}
        currentInstrument={currentInstrument}
        onSelectInstrument={handleInstrumentSelect}
        userCustomInstruments={userCustomInstruments}
        onInstrumentSaved={(savedInst) => {
          setUserCustomInstruments(prev => [savedInst, ...prev]);
        }}
        onStartSession={startNewSession}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setAuthModalMode('normal');
        }}
        user={user}
        setUser={setUser}
        initialMode={authModalMode}
        onOpenLegal={(tab) => {
          setLegalTab(tab || 'privacy');
          setIsLegalOpen(true);
        }}
      />

      {/* Legal & Privacy Modal */}
      <LegalModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        initialTab={legalTab}
      />
    </div>
  );
}
