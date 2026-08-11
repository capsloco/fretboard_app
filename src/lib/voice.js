// Voice Recognition Helper using Web Speech API (webkitSpeechRecognition)

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
      console.warn('Speech recognition error:', event.error);
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
    console.log('[Voice Recognition Heard]:', transcript);

    // Pass / Correct commands
    const passPhrases = ['got it', 'got', 'correct', 'pass', 'yes', 'hit', 'right', 'good', 'check', 'next'];
    // Miss / Incorrect commands
    const missPhrases = ['missed', 'miss', 'wrong', 'no', 'fail', 'skip', 'bad', 'oops'];
    // Pause / Resume
    const pausePhrases = ['pause', 'stop', 'hold'];
    const resumePhrases = ['resume', 'start', 'continue'];

    if (passPhrases.some(phrase => transcript.includes(phrase))) {
      if (this.onCommand) this.onCommand({ type: 'PASS', transcript, source: 'voice' });
    } else if (missPhrases.some(phrase => transcript.includes(phrase))) {
      if (this.onCommand) this.onCommand({ type: 'MISS', transcript, source: 'voice' });
    } else if (pausePhrases.some(phrase => transcript.includes(phrase))) {
      if (this.onCommand) this.onCommand({ type: 'PAUSE', transcript, source: 'voice' });
    } else if (resumePhrases.some(phrase => transcript.includes(phrase))) {
      if (this.onCommand) this.onCommand({ type: 'RESUME', transcript, source: 'voice' });
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
