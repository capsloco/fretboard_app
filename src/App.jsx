import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { generatePrompt, gradeDetectedNote, midiToNoteLabel, findNotePositionsOnNeck, formatNoteName, INSTRUMENT_PRESETS } from './lib/fretLogic';
import { isSupabaseConfigured, loadCustomInstruments, getCurrentUser, loadUserSettings, saveUserSettings, subscribeToAuthChanges } from './lib/supabase';
import { EMPTY_HISTORY, loadPracticeHistory, recordRound, withSavedRound, clearDeviceHistory } from './lib/practiceHistory';
import { buildNoteStats, buildNoteWeights, pickFocusNotes } from './lib/statsLogic';
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
  const [authReady, setAuthReady] = useState(false);

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
    micSensitivity: 6, // 1-10
    adaptivePrompts: true // notes you miss come up more often
  });
  const noteDisplay = config.noteDisplay || (config.useFlats ? 'flats' : 'sharps');

  // Active Session State
  const [sessionState, setSessionState] = useState('idle'); // 'idle' | 'running' | 'summary' | 'history'
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  // Pitch classes a weak-spot round is limited to; null for a normal round
  const [roundFocus, setRoundFocus] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'account' | 'device' | 'failed'

  // Timers
  const [timeLeft, setTimeLeft] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionDurationSecs, setSessionDurationSecs] = useState(0);

  const [stats, setStats] = useState(EMPTY_STATS);

  // Per-attempt records for the currently running session (persisted at finishSession)
  const [attempts, setAttempts] = useState([]);
  const promptShownAtRef = useRef(null);
  // Bumped each round, so a slow save from an earlier round can't overwrite the current one's status
  const roundIdRef = useRef(0);
  const userIdRef = useRef(null);

  // Saved rounds and recent answers (account when signed in, else this device)
  const [practiceHistory, setPracticeHistory] = useState(EMPTY_HISTORY);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Load saved user settings, custom instruments & auth on mount
  useEffect(() => {
    async function initData() {
      const u = await getCurrentUser();
      setUser(u);
      setAuthReady(true);

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

  const userId = user?.id ?? null;
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    if (!authReady) return undefined;
    let cancelled = false;
    setHistoryLoading(true);
    loadPracticeHistory(userId).then((history) => {
      if (cancelled) return;
      setPracticeHistory(history);
      setHistoryLoading(false);
    });
    return () => { cancelled = true; };
  }, [authReady, userId]);

  const noteStats = useMemo(
    () => buildNoteStats(practiceHistory.attempts, noteDisplay),
    [practiceHistory.attempts, noteDisplay]
  );
  const weakSpots = useMemo(() => pickFocusNotes(noteStats), [noteStats]);

  // Adaptive rounds: weight prompts by saved answers plus this round's
  const noteWeights = useMemo(() => {
    if (!config.adaptivePrompts) return null;
    const roundAnswers = attempts.map(a => ({ note: a.targetNote, isCorrect: a.isCorrect }));
    return buildNoteWeights([...roundAnswers, ...practiceHistory.attempts]);
  }, [config.adaptivePrompts, attempts, practiceHistory.attempts]);

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
    // Keep the fret range on the new neck, and save config + instrument together
    const maxFret = Math.min(config.maxFret, inst.fretCount || 24);
    const updatedConfig = { ...config, maxFret, minFret: Math.min(config.minFret, maxFret) };
    setCurrentInstrument(inst);
    setConfig(updatedConfig);
    saveSettingsToStorage(updatedConfig, inst);
  };

  const makePrompt = useCallback((previousNote = null, focusNotes = roundFocus) => generatePrompt({
    promptType: config.promptType,
    includeAccidentals: config.includeAccidentals,
    minFret: config.minFret,
    maxFret: config.maxFret,
    instrument: currentInstrument,
    noteDisplay,
    previousNote,
    focusNotes,
    noteWeights
  }), [config.promptType, config.includeAccidentals, config.minFret, config.maxFret, currentInstrument, noteDisplay, roundFocus, noteWeights]);

  const showPrompt = useCallback((prompt, sessionMode = config.sessionMode) => {
    setIsRevealed(false);
    setCurrentPrompt(prompt);
    promptShownAtRef.current = Date.now();
    setTimeLeft(sessionMode === 'flashcard' ? config.flashcardSecondsPerNote : null);
  }, [config.sessionMode, config.flashcardSecondsPerNote]);

  const nextPrompt = useCallback(() => {
    showPrompt(makePrompt(currentPrompt?.note));
  }, [showPrompt, makePrompt, currentPrompt]);

  /** @param focusNotes pitch classes (0-11) for a weak-spot round, or null for a normal round */
  const startNewSession = (focusNotes = null, sessionMode = config.sessionMode) => {
    const focus = focusNotes?.length ? focusNotes : null;
    roundIdRef.current += 1;
    setStats(EMPTY_STATS);
    setAttempts([]);
    setLastResult(null);
    setSaveStatus(null);
    setRoundFocus(focus);
    setSessionStartTime(Date.now());
    showPrompt(makePrompt(null, focus), sessionMode);
    setSessionState('running');
  };

  // Weak-spot rounds are always scored, so they show up in stats
  const startWeakSpotRound = (focusNotes) => {
    // Weak spots come from every saved round, so some may not fit this neck and fret range
    const playable = focusNotes.filter(pc =>
      findNotePositionsOnNeck(formatNoteName(pc), currentInstrument, config.minFret, config.maxFret).length > 0);
    if (playable.length === 0) {
      const names = focusNotes.map(pc => formatNoteName(pc, noteDisplay)).join(', ');
      window.alert(`${names} isn’t between frets ${config.minFret} and ${config.maxFret}. Widen the fret range in Settings to drill it.`);
      return;
    }
    if (config.sessionMode !== 'tracked') handleConfigChange('sessionMode', 'tracked');
    startNewSession(playable, 'tracked');
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

    // Flashcard mode is explicitly "no tracking", and an empty round has nothing to save
    if (config.sessionMode !== 'tracked' || stats.totalPrompts === 0) return;

    const roundId = roundIdRef.current;
    setSaveStatus('saving');
    const saved = await recordRound({
      instrumentName: currentInstrument.title,
      sessionType: roundFocus ? 'weak_spots' : 'tracked',
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
    }, attempts, userId);

    // A new round or a sign-in/out while saving: this result no longer belongs on screen
    if (roundId !== roundIdRef.current || userIdRef.current !== userId) return;
    if (saved) setPracticeHistory(prev => withSavedRound(prev, saved));
    setSaveStatus(!saved ? 'failed' : saved.partial ? 'partial' : userId ? 'account' : 'device');
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
            onStart={() => startNewSession()}
            onOpenSettings={() => setIsSettingsOpen(true)}
            weakSpots={weakSpots}
            onPractiseWeakSpots={() => startWeakSpotRound(weakSpots.map(n => n.pitchClass))}
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
              isWeakSpotRound={Boolean(roundFocus)}
              saveStatus={saveStatus}
              onRestart={() => startNewSession(roundFocus)}
              onPractiseNotes={startWeakSpotRound}
              onOpenAuth={isSupabaseConfigured ? () => setIsAuthOpen(true) : undefined}
              onOpenSettings={() => {
                setSessionState('idle');
                setIsSettingsOpen(true);
              }}
            />
          </div>
        ) : sessionState === 'history' ? (
          <HistoryStatsScreen
            user={user}
            history={practiceHistory}
            loading={historyLoading}
            noteStats={noteStats}
            weakSpots={weakSpots}
            noteDisplay={noteDisplay}
            onPractiseWeakSpots={startWeakSpotRound}
            onClearDeviceHistory={() => {
              clearDeviceHistory();
              setPracticeHistory(EMPTY_HISTORY);
            }}
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
              isWeakSpotRound={Boolean(roundFocus)}
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
          <span>Free and open source.</span>
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
        onStartSession={() => startNewSession()}
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
