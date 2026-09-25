// Voice Recognition Helper using Web Speech API (webkitSpeechRecognition)

const wordPattern = (words) => new RegExp(`\\b(${words.join('|')})\\b`);
const PASS_PATTERN = wordPattern(['got it', 'got', 'correct', 'pass', 'yes', 'yeah', 'hit', 'right', 'good', 'check']);
const MISS_PATTERN = wordPattern(['missed', 'miss', 'wrong', 'no', 'nope', 'not', 'fail', 'skip', 'bad', 'oops']);
const FATAL_ERRORS = ['not-allowed', 'service-not-allowed', 'audio-capture', 'network'];

export function isSpeechRecognitionSupported() {
  return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
}

export class VoiceControllerHandler {
  constructor({ onCommand, onListeningStateChange, onError }) {
    this.onCommand = onCommand;
    this.onListeningStateChange = onListeningStateChange;
    this.onError = onError;
    this.recognition = null;
    this.isListening = false;
    this.shouldAutoRestart = false;

    this.init();
  }

  init() {
    if (!isSpeechRecognitionSupported()) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onListeningStateChange) this.onListeningStateChange(true);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onListeningStateChange) this.onListeningStateChange(false);

      // Auto-restart if user enabled listening mode
      if (this.shouldAutoRestart) {
        try {
          this.recognition.start();
        } catch (e) {
          console.warn('Speech recognition restart suppressed:', e);
        }
      }
    };

    this.recognition.onerror = (event) => {
      // Restarting after these just fails again in a tight loop
      if (FATAL_ERRORS.includes(event.error)) this.shouldAutoRestart = false;
      if (this.onError) this.onError(event.error);
    };

    this.recognition.onresult = (event) => {
      const resultsLength = event.results.length;
      for (let i = event.resultIndex; i < resultsLength; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript.trim().toLowerCase();
          this.processTranscript(transcript);
        }
      }
    };
  }

  processTranscript(transcript) {
    // Whole words only, and misses win ties ("not right" is a miss)
    if (MISS_PATTERN.test(transcript)) {
      this.onCommand?.({ type: 'MISS', transcript, source: 'voice' });
    } else if (PASS_PATTERN.test(transcript)) {
      this.onCommand?.({ type: 'PASS', transcript, source: 'voice' });
    }
  }

  start() {
    if (!this.recognition) return false;
    this.shouldAutoRestart = true;
    try {
      this.recognition.start();
      return true;
    } catch (e) {
      console.warn('Voice start exception:', e);
      return false;
    }
  }

  stop() {
    this.shouldAutoRestart = false;
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch (e) {
      console.warn('Voice stop exception:', e);
    }
  }
}
