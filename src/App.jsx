import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/ui/Header';
import Launchpad from './components/home/Launchpad';
import DisplayPrompt from './components/session/DisplayPrompt';
import Fretboard from './components/fretboard/Fretboard';
import InputPanel from './components/session/InputPanel';
import SessionSummary from './components/session/SessionSummary';
import SessionSettingsModal from './components/ui/SessionSettingsModal';
import AuthModal from './components/ui/AuthModal';
import LegalModal from './components/ui/LegalModal';
import CookieConsentBanner from './components/ui/CookieConsentBanner';
import HistoryStatsScreen from './components/history/HistoryStatsScreen';
import { generatePrompt, gradeDetectedNote, midiToNoteLabel, INSTRUMENT_PRESETS } from './lib/fretLogic';
import { loadCustomInstruments, savePracticeSession, savePracticeAttempts, getCurrentUser, loadUserSettings, saveUserSettings, subscribeToAuthChanges } from './lib/supabase';
import { getInitialTheme, applyTheme } from './lib/theme';
import { isAnalyticsEnabled } from './lib/analytics';
import { Check, X } from 'lucide-react';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Ignore mic notes this soon after a new prompt: it's the tail of the last answer
const MIC_GRACE_MS = 250;

const EMPTY_STATS = {
  totalPrompts: 0,
  correctCount: 0,
  incorrectCount: 0,
  currentStreak: 0,
  bestStreak: 0
};

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

  // Appearance
  const [currentTheme, setCurrentTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  // Session Parameters State
  const [config, setConfig] = useState({
    sessionMode: 'tracked', // 'tracked' | 'flashcard'
    promptType: 'global', // 'global' | 'string_specific'
    includeAccidentals: false,
    noteDisplay: 'sharps', // 'sharps' | 'both' | 'flats'
    minFret: 0,
    maxFret: 12,
    flashcardSecondsPerNote: 4,
    flashcardDurationMins: 5,
    inputMode: 'mic', // 'mic' | 'voice' | 'manual'
    micSensitivity: 6 // 1-10
  });
  const noteDisplay = config.noteDisplay || (config.useFlats ? 'flats' : 'sharps');

  // Active Session State
  const [sessionState, setSessionState] = useState('idle'); // 'idle' | 'running' | 'summary' | 'history'
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  // Timers
  const [timeLeft, setTimeLeft] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionDurationSecs, setSessionDurationSecs] = useState(0);

  const [stats, setStats] = useState(EMPTY_STATS);

  // Per-attempt records for the currently running session (persisted at finishSession)
  const [attempts, setAttempts] = useState([]);
  const promptShownAtRef = useRef(null);

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

  const makePrompt = useCallback((previousNote = null) => generatePrompt({
    promptType: config.promptType,
    includeAccidentals: config.includeAccidentals,
    minFret: config.minFret,
    maxFret: config.maxFret,
    instrument: currentInstrument,
    noteDisplay,
    previousNote
  }), [config.promptType, config.includeAccidentals, config.minFret, config.maxFret, currentInstrument, noteDisplay]);

  const showPrompt = useCallback((prompt) => {
    setIsRevealed(false);
    setCurrentPrompt(prompt);
    promptShownAtRef.current = Date.now();
    setTimeLeft(config.sessionMode === 'flashcard' ? config.flashcardSecondsPerNote : null);
  }, [config.sessionMode, config.flashcardSecondsPerNote]);

  const nextPrompt = useCallback(() => {
    showPrompt(makePrompt(currentPrompt?.note));
  }, [showPrompt, makePrompt, currentPrompt]);

  const startNewSession = () => {
    setStats(EMPTY_STATS);
    setAttempts([]);
    setLastResult(null);
    setSessionStartTime(Date.now());
    showPrompt(makePrompt());
    setSessionState('running');
  };

  // Flashcards: count down each note, and stop after the chosen loop duration
  useEffect(() => {
    if (sessionState !== 'running' || config.sessionMode !== 'flashcard') return undefined;
    const tick = setInterval(() => setTimeLeft(prev => (prev === null ? prev : Math.max(0, prev - 1))), 1000);
    return () => clearInterval(tick);
  }, [sessionState, config.sessionMode, currentPrompt]);

  useEffect(() => {
    if (timeLeft === 0) nextPrompt();
  }, [timeLeft, nextPrompt]);

  useEffect(() => {
    if (sessionState !== 'running' || config.sessionMode !== 'flashcard') return undefined;
    const stop = setTimeout(() => {
      setSessionDurationSecs(config.flashcardDurationMins * 60);
      setSessionState('summary');
    }, config.flashcardDurationMins * 60000);
    return () => clearTimeout(stop);
  }, [sessionState, config.sessionMode, config.flashcardDurationMins]);

  /**
   * Score the current prompt and move on.
   * @param detected note heard by the mic ({ name, octave, frequency }), if any
   */
  const answer = (isCorrect, source, detected = null) => {
    const responseTimeMs = promptShownAtRef.current ? Date.now() - promptShownAtRef.current : null;
    setAttempts(prev => [...prev, {
      targetNote: currentPrompt?.note,
      promptType: currentPrompt?.promptType,
      stringIndex: currentPrompt?.stringIndex ?? null,
      stringDisplayNumber: currentPrompt?.stringDisplayNumber ?? null,
      stringOpenNote: currentPrompt?.stringOpenNote ?? null,
      isCorrect,
      responseTimeMs,
      inputSource: source,
      detectedNote: detected?.name ?? null,
      detectedOctave: detected?.octave ?? null,
      detectedFrequencyHz: detected ? Math.round(detected.frequency * 100) / 100 : null
    }]);

    setStats(prev => {
      const currentStreak = isCorrect ? prev.currentStreak + 1 : 0;
      return {
        totalPrompts: prev.totalPrompts + 1,
        correctCount: prev.correctCount + (isCorrect ? 1 : 0),
        incorrectCount: prev.incorrectCount + (isCorrect ? 0 : 1),
        currentStreak,
        bestStreak: Math.max(prev.bestStreak, currentStreak)
      };
    });

    setLastResult(prev => ({
      id: (prev?.id ?? 0) + 1,
      correct: isCorrect,
      target: currentPrompt?.note,
      heard: detected ? `${detected.name}${detected.octave}` : null,
      wrongOctave: Boolean(detected?.wrongOctave)
    }));

    nextPrompt();
  };

  const handleDetectedNote = (note) => {
    if (sessionState !== 'running' || !currentPrompt) return;
    if (Date.now() - promptShownAtRef.current < MIC_GRACE_MS) return;

    const { correct, pitchClassMatch } = gradeDetectedNote(currentPrompt, note.midi, currentInstrument);
    const heard = midiToNoteLabel(note.midi, noteDisplay);
    const detected = { ...heard, frequency: note.frequency, wrongOctave: pitchClassMatch && !correct };

    if (correct) {
      answer(true, 'mic', detected);
    } else if (config.sessionMode === 'tracked') {
      answer(false, 'mic', detected);
    } else {
      // Flashcards don't penalise: just say what was heard
      setLastResult(prev => ({
        id: (prev?.id ?? 0) + 1,
        correct: false,
        target: currentPrompt.note,
        heard: `${heard.name}${heard.octave}`,
        wrongOctave: detected.wrongOctave
      }));
    }
  };

  const handleCommand = (cmd) => {
    if (sessionState !== 'running') return;
    if (cmd.type === 'PASS') answer(true, cmd.source || 'voice');
    else if (cmd.type === 'MISS') answer(false, cmd.source || 'voice');
  };

  const finishSession = async () => {
    const durationSecs = sessionStartTime
      ? Math.max(1, Math.floor((Date.now() - sessionStartTime) / 1000))
      : 0;
    setSessionDurationSecs(durationSecs);

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
      noteDisplay
    }, user?.id);

    if (sessionId && attempts.length > 0) {
      await savePracticeAttempts(sessionId, attempts, user?.id);
    }
  };

  const openLegal = (tab) => {
    setLegalTab(tab || 'privacy');
    setIsLegalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenHistory={() => setSessionState('history')}
        onGoHome={sessionState === 'running' ? undefined : () => setSessionState('idle')}
        user={user}
        setUser={setUser}
        isSessionRunning={sessionState === 'running'}
        theme={currentTheme}
        onChangeTheme={setCurrentTheme}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 py-4 sm:px-6 sm:py-6 flex flex-col">
        {sessionState === 'idle' ? (
          <Launchpad
            instrument={currentInstrument}
            config={config}
            onChangeConfig={handleConfigChange}
            onStart={startNewSession}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        ) : sessionState === 'summary' ? (
          <div className="my-auto py-4">
            <SessionSummary
              stats={{
                ...stats,
                accuracyPct: stats.totalPrompts > 0 ? Math.round((stats.correctCount / stats.totalPrompts) * 100) : 0,
                durationSeconds: sessionDurationSecs,
                instrumentTitle: currentInstrument.title,
                sessionType: config.sessionMode
              }}
              attempts={attempts}
              onRestart={startNewSession}
              onOpenSettings={() => {
                setSessionState('idle');
                setIsSettingsOpen(true);
              }}
            />
          </div>
        ) : sessionState === 'history' ? (
          <HistoryStatsScreen
            user={user}
            onBack={() => setSessionState('idle')}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        ) : (
          /* ACTIVE PRACTICE SESSION */
          <div className="flex-1 flex flex-col gap-3 sm:gap-4">
            <InputPanel
              mode={config.inputMode}
              onModeChange={(mode) => handleConfigChange('inputMode', mode)}
              instrument={currentInstrument}
              noteDisplay={noteDisplay}
              sensitivity={config.micSensitivity}
              onSensitivityChange={(value) => handleConfigChange('micSensitivity', value)}
              onNote={handleDetectedNote}
              onCommand={handleCommand}
              onEndRound={finishSession}
            />

            <DisplayPrompt
              prompt={currentPrompt}
              sessionMode={config.sessionMode}
              timeLeft={timeLeft}
              secondsPerNote={config.flashcardSecondsPerNote}
              isRevealed={isRevealed}
              onRevealToggle={() => setIsRevealed(!isRevealed)}
              stats={stats}
              lastResult={lastResult}
            />

            {/* Manual scoring: always available as a fallback, front and centre without the mic */}
            {config.sessionMode === 'tracked' && (
              <div className="w-full max-w-3xl mx-auto grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => answer(false, 'button')}
                  className={`btn btn-error font-display uppercase tracking-wider ${config.inputMode === 'mic' ? 'btn-soft' : 'btn-lg'}`}
                >
                  <X className="size-5" /> Missed
                </button>
                <button
                  type="button"
                  onClick={() => answer(true, 'button')}
                  className={`btn btn-success font-display uppercase tracking-wider ${config.inputMode === 'mic' ? 'btn-soft' : 'btn-lg'}`}
                >
                  <Check className="size-5" /> Got it
                </button>
              </div>
            )}

            <Fretboard
              instrument={currentInstrument}
              highlightPositions={currentPrompt?.validPositions || []}
              revealed={isRevealed}
              minFret={config.minFret}
              maxFret={config.maxFret}
              noteDisplay={noteDisplay}
            />
          </div>
        )}
      </main>

      <footer className="footer sm:footer-horizontal items-center gap-3 px-4 py-5 sm:px-8 border-t-4 border-(--piping) bg-cabinet text-sm">
        <aside className="flex items-baseline gap-2">
          <span className="font-script text-2xl leading-none">FretLearn</span>
          <span className="opacity-80">Free and open source.</span>
        </aside>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 sm:justify-self-end">
          <a className="link link-hover" href="https://github.com/capsloco/fretboard_app" target="_blank" rel="noreferrer">Source code</a>
          <button type="button" onClick={() => openLegal('privacy')} className="link link-hover">Privacy</button>
          <button type="button" onClick={() => openLegal('terms')} className="link link-hover">Terms</button>
          {isAnalyticsEnabled && (
            <button type="button" onClick={() => setIsCookieConsentOpen(true)} className="link link-hover">Cookies</button>
          )}
        </nav>
      </footer>

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
        currentTheme={currentTheme}
        onChangeTheme={setCurrentTheme}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setAuthModalMode('normal');
        }}
        setUser={setUser}
        initialMode={authModalMode}
        onOpenLegal={openLegal}
      />

      <LegalModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        initialTab={legalTab}
      />

      <CookieConsentBanner
        isOpen={isCookieConsentOpen}
        onClose={() => setIsCookieConsentOpen(false)}
        onOpenLegal={() => openLegal('privacy')}
      />

      <SpeedInsights />
    </div>
  );
}
