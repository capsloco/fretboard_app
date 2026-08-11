import React, { useState, useEffect, useRef } from 'react';
import Header from './components/ui/Header';
import DisplayPrompt from './components/session/DisplayPrompt';
import Fretboard from './components/fretboard/Fretboard';
import VoiceController from './components/session/VoiceController';
import SessionSummary from './components/session/SessionSummary';
import SessionSettingsModal from './components/ui/SessionSettingsModal';
import AuthModal from './components/ui/AuthModal';
import LegalModal from './components/ui/LegalModal';
import CookieConsentBanner from './components/ui/CookieConsentBanner';
import HistoryStatsScreen from './components/history/HistoryStatsScreen';
import { generatePrompt, INSTRUMENT_PRESETS, TUNING_PRESETS } from './lib/fretLogic';
import { loadCustomInstruments, savePracticeSession, savePracticeAttempts, getCurrentUser, loadUserSettings, saveUserSettings, subscribeToAuthChanges } from './lib/supabase';
import { Play, CheckCircle2, XCircle, Sliders, RotateCcw, Volume2, Eye, EyeOff, Trophy, Sparkles } from 'lucide-react';
import { SpeedInsights } from '@vercel/speed-insights/react';

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
  const [isCookieConsentOpen, setIsCookieConsentOpen] = useState(false);

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
  const [sessionState, setSessionState] = useState('idle'); // 'idle' | 'running' | 'summary' | 'history'
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

  // Per-attempt records for the currently running session (persisted at finishSession)
  const [attempts, setAttempts] = useState([]);
  const promptShownAtRef = useRef(null);

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
    setAttempts([]);
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
    promptShownAtRef.current = Date.now();

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
    promptShownAtRef.current = Date.now();

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

  // Record a per-prompt attempt (must run before currentPrompt is replaced by nextPrompt())
  const recordAttempt = (isCorrect, source) => {
    const responseTimeMs = promptShownAtRef.current ? Date.now() - promptShownAtRef.current : null;
    setAttempts(prev => [...prev, {
      targetNote: currentPrompt?.note,
      promptType: currentPrompt?.promptType,
      stringIndex: currentPrompt?.stringIndex ?? null,
      stringDisplayNumber: currentPrompt?.stringDisplayNumber ?? null,
      stringOpenNote: currentPrompt?.stringOpenNote ?? null,
      isCorrect,
      responseTimeMs,
      inputSource: source
    }]);
  };

  // Handle Pass / Correct action
  const handlePass = (source = 'button') => {
    recordAttempt(true, source);
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
  const handleMiss = (source = 'button') => {
    recordAttempt(false, source);
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
      handlePass(cmd.source || 'voice');
    } else if (cmd.type === 'MISS') {
      handleMiss(cmd.source || 'voice');
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

    // Flashcard mode is explicitly "no tracking" — don't persist a session/attempts row
    if (config.sessionMode !== 'tracked') return;

    const sessionId = await savePracticeSession({
      instrumentName: currentInstrument.title,
      sessionType: config.sessionMode,
      promptType: config.promptType,
      totalPrompts: stats.totalPrompts,
      correctCount: stats.correctCount,
      incorrectCount: stats.incorrectCount,
      accuracyPct: accuracy,
      durationSeconds: durationSecs,
      bestStreak: stats.bestStreak,
      instrumentId: currentInstrument.id,
      tuningId: currentInstrument.tuningId || currentInstrument.defaultTuningId,
      tuning: currentInstrument.tuning,
      minFret: config.minFret,
      maxFret: config.maxFret,
      includeAccidentals: config.includeAccidentals,
      noteDisplay: config.noteDisplay || (config.useFlats ? 'flats' : 'sharps')
    }, user?.id);

    if (sessionId && attempts.length > 0) {
      await savePracticeAttempts(sessionId, attempts, user?.id);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 text-base-content flex flex-col font-sans selection:bg-primary selection:text-primary-content">
      {/* Header */}
      <Header
        currentInstrument={currentInstrument}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenHistory={() => setSessionState('history')}
        user={user}
        setUser={setUser}
        onSelectTuning={handleTuningSelect}
        isSessionRunning={sessionState === 'running'}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col">
        {sessionState === 'idle' ? (
          /* IDLE / LAUNCHPAD SCREEN */
          <div className="my-auto flex flex-col items-center text-center py-8 px-4">
            <div className="card bg-base-100 border border-base-300 shadow-2xl max-w-2xl w-full p-8 sm:p-12">
              <div className="card-body items-center p-0">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
                  <Play className="w-8 h-8 text-primary ml-1" />
                </div>

                <h2 className="text-3xl sm:text-5xl font-black text-base-content mb-3">
                  Ready to Practice?
                </h2>
                <p className="text-base-content/70 max-w-md text-sm sm:text-base font-medium mb-8">
                  Train note recognition on the fretboard using voice commands, guitar plucks, or hands-free flashcards.
                </p>

                <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={startNewSession}
                    className="btn btn-primary btn-lg font-black uppercase tracking-wider w-full sm:w-auto shadow-xl"
                  >
                    <Play className="w-5 h-5 fill-current" /> Start Practice
                  </button>

                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="btn btn-ghost border border-base-300 hover:bg-base-200 text-base-content btn-lg font-bold w-full sm:w-auto"
                  >
                    <Sliders className="w-5 h-5 text-primary" /> Configure
                  </button>
                </div>
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
        ) : sessionState === 'history' ? (
          /* HISTORY & STATS SCREEN */
          <HistoryStatsScreen
            user={user}
            onBack={() => setSessionState('idle')}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        ) : (
          /* ACTIVE PRACTICE SESSION SCREEN */
          <div className="flex-1 flex flex-col justify-between space-y-3 sm:space-y-4 py-1">
            {/* Top Bar Controls in Active Session */}
            <div className="flex items-center justify-between bg-base-100 border border-base-300 rounded-2xl p-3 shadow-md backdrop-blur-md">
              <div className="flex items-center gap-2">
                <VoiceController onCommand={handleVoiceCommand} />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={finishSession}
                  className="btn btn-ghost border border-base-300 text-base-content hover:bg-base-200 btn-sm font-bold uppercase tracking-wider"
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

            {/* Action Buttons for Tracked Mode */}
            {config.sessionMode === 'tracked' && (
              <div className="w-full max-w-2xl mx-auto grid grid-cols-2 gap-3 sm:gap-4 my-2">
                <button
                  onClick={() => handleMiss('button')}
                  className="btn btn-soft btn-error btn-lg font-extrabold text-base sm:text-lg tracking-wide shadow-md gap-2.5 rounded-2xl hover:scale-[1.01] active:scale-[0.98] transition-transform"
                >
                  <XCircle className="w-6 h-6 stroke-[2.5]" />
                  <span>Missed</span>
                </button>

                <button
                  onClick={() => handlePass('button')}
                  className="btn btn-success btn-lg font-extrabold text-base sm:text-lg tracking-wide shadow-lg gap-2.5 rounded-2xl hover:scale-[1.01] active:scale-[0.98] transition-transform"
                >
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                  <span>Got It</span>
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
      <footer className="footer footer-center p-4 bg-base-100 text-base-content/70 border-t border-base-300 text-xs font-mono">
        <div className="max-w-7xl w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} FretLearn</div>
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
            <button
              onClick={() => {
                setLegalTab('privacy');
                setIsLegalOpen(true);
              }}
              className="link link-hover hover:text-primary transition-colors"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setLegalTab('terms');
                setIsLegalOpen(true);
              }}
              className="link link-hover hover:text-primary transition-colors"
            >
              Terms of Service
            </button>
            <span>•</span>
            <button
              onClick={() => setIsCookieConsentOpen(true)}
              className="link link-hover hover:text-primary transition-colors"
            >
              Cookie Preferences
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

      {/* Cookie Consent Banner */}
      <CookieConsentBanner
        isOpen={isCookieConsentOpen}
        onClose={() => setIsCookieConsentOpen(false)}
        onOpenLegal={() => {
          setLegalTab('privacy');
          setIsLegalOpen(true);
        }}
      />

      {/* Vercel Speed Insights */}
      <SpeedInsights />
    </div>
  );
}
