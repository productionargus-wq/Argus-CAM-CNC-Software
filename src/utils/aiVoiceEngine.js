/**
 * aiVoiceEngine.js
 * Advanced Browser-native Web Speech API wrapper for Argus Master CAM.
 * Provides Full-Duplex Voice Interaction:
 * - Simultaneous Speech Recognition & Speech Synthesis
 * - Real-Time Barge-In / Interruption Handling: Instantly cancels AI speech when user talks
 * - Self-Echo Cancellation: Rejects speaker acoustic feedback
 */

class AIVoiceEngine {
  constructor() {
    this.recognition = null;
    this.synthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.isListening = false;
    this.isSpeaking = false;
    this.isSupported = false;
    this.selectedVoice = null;
    this.voices = [];
    this.currentSpeakingText = '';
    this.recentSpokenPhrases = [];
    this.onTranscriptCallback = null;
    this.onStateChangeCallback = null;
    this.onErrorCallback = null;
    this.onInterruptedCallback = null;
    this.muted = false;
    this.speechRate = 1.08;
    this.speechPitch = 1.0;

    const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem('argus_ai_speech_lang') : null;
    this.language = savedLang || 'en-IN'; // Default to English (India) for superior phonetic matching

    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;

    // Check Speech Recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.language;
        this.recognition.maxAlternatives = 5; // Multi-hypothesis candidate ranking

        // Inject JSGF grammar for CAD/CAM domain biasing if supported
        const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
        if (SpeechGrammarList) {
          try {
            const grammar = '#JSGF V1.0; grammar camCommands; public <camCommand> = move | rotate | top view | front view | isometric | right view | left view | bottom view | fit view | simulation | backplot | toolpaths | wireframe | shaded | dimensions | stop | wait ;';
            const speechRecognitionList = new SpeechGrammarList();
            speechRecognitionList.addFromString(grammar, 1);
            this.recognition.grammars = speechRecognitionList;
          } catch {
            // ignore if not supported
          }
        }

        this.recognition.onstart = () => {
          this.isListening = true;
          this.notifyStateChange();
        };

        // Instant interruption hook when sound is detected
        if ('onspeechstart' in this.recognition) {
          this.recognition.onspeechstart = () => {
            // When user starts speaking while AI is speaking, handle potential barge-in
            if (this.isSpeaking) {
              this.handlePotentialBargeIn();
            }
          };
        }

        this.recognition.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';
          const alternatives = [];

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            const transcript = res[0].transcript;
            if (res.isFinal) {
              finalTranscript += transcript;
              for (let j = 0; j < res.length; ++j) {
                if (res[j]?.transcript) {
                  alternatives.push(res[j].transcript);
                }
              }
            } else {
              interimTranscript += transcript;
              // Also collect interim alternatives if present
              for (let j = 0; j < res.length; ++j) {
                if (res[j]?.transcript && !alternatives.includes(res[j].transcript)) {
                  alternatives.push(res[j].transcript);
                }
              }
            }
          }

          const cleanInterim = interimTranscript.trim();
          const cleanFinal = finalTranscript.trim();

          // Interruption check: If AI is speaking and user talks with non-empty transcript
          if (this.isSpeaking && (cleanInterim || cleanFinal)) {
            const detected = cleanInterim || cleanFinal;
            if (!this.isEchoOfAISpeech(detected)) {
              // Real user interruption!
              this.stopSpeaking(true);
            }
          }

          if (this.onTranscriptCallback) {
            this.onTranscriptCallback({
              final: cleanFinal,
              interim: cleanInterim,
              alternatives: alternatives.length > 0 ? alternatives : [cleanFinal || cleanInterim]
            });
          }
        };

        this.recognition.onerror = (event) => {
          // 'no-speech' is normal during silent pauses
          if (event.error !== 'no-speech') {
            console.warn('[AIVoiceEngine] Recognition error:', event.error);
            if (this.onErrorCallback) this.onErrorCallback(event.error);
          }
        };

        this.recognition.onend = () => {
          // Auto restart if user still has AI active
          if (this.isListening) {
            try {
              this.recognition.start();
            } catch {
              this.isListening = false;
              this.notifyStateChange();
            }
          } else {
            this.notifyStateChange();
          }
        };

        this.isSupported = true;
      } catch (err) {
        console.warn('[AIVoiceEngine] Failed to initialize SpeechRecognition:', err);
      }
    }

    // Populate voices for TTS
    if (this.synthesis) {
      const loadVoices = () => {
        this.voices = this.synthesis.getVoices() || [];
        // Prefer natural English voices
        this.selectedVoice =
          this.voices.find((v) => /Google US English|Microsoft.*Natural|Jenny|David|Guy|Samantha/i.test(v.name)) ||
          this.voices.find((v) => v.lang.startsWith('en')) ||
          this.voices[0] || null;
      };

      loadVoices();
      if (this.synthesis.onvoiceschanged !== undefined) {
        this.synthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  handlePotentialBargeIn() {
    // If speaking, prepare to yield if distinct user tokens follow
    if (this.isSpeaking) {
      this.notifyStateChange({ potentialBargeIn: true });
    }
  }

  /**
   * Checks if an incoming transcript is just an echo of recent AI speech
   */
  isEchoOfAISpeech(text) {
    if (!text || !this.currentSpeakingText) return false;
    const cleanIn = text.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanAI = this.currentSpeakingText.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (cleanIn.length < 3) return false;

    // Direct substring match with what AI is saying
    if (cleanAI.includes(cleanIn) || cleanIn.includes(cleanAI)) {
      return true;
    }

    // Check recent phrases
    for (const phrase of this.recentSpokenPhrases) {
      const cleanP = phrase.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanP && (cleanP.includes(cleanIn) || cleanIn.includes(cleanP))) {
        return true;
      }
    }

    return false;
  }

  notifyStateChange(extra = {}) {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({
        isListening: this.isListening,
        isSpeaking: this.isSpeaking,
        isSupported: this.isSupported,
        muted: this.muted,
        ...extra
      });
    }
  }

  startListening(onTranscript, onStateChange, onError, onInterrupted) {
    if (onTranscript) this.onTranscriptCallback = onTranscript;
    if (onStateChange) this.onStateChangeCallback = onStateChange;
    if (onError) this.onErrorCallback = onError;
    if (onInterrupted) this.onInterruptedCallback = onInterrupted;

    if (!this.recognition) {
      if (this.onErrorCallback) this.onErrorCallback('Speech recognition is not supported in this browser.');
      return false;
    }

    try {
      this.isListening = true;
      this.recognition.start();
      this.notifyStateChange();
      return true;
    } catch {
      // Might already be active
      return true;
    }
  }

  stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.notifyStateChange();
  }

  speak(text, onEnd) {
    if (!this.synthesis || this.muted || !text) {
      if (onEnd) onEnd();
      return;
    }

    try {
      // Cancel any ongoing speech
      this.synthesis.cancel();

      this.currentSpeakingText = text;
      this.recentSpokenPhrases.push(text);
      if (this.recentSpokenPhrases.length > 5) {
        this.recentSpokenPhrases.shift();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      utterance.rate = this.speechRate;
      utterance.pitch = this.speechPitch;

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.notifyStateChange();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentSpeakingText = '';
        this.notifyStateChange();
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        this.isSpeaking = false;
        this.currentSpeakingText = '';
        this.notifyStateChange();
        if (onEnd) onEnd();
      };

      this.synthesis.speak(utterance);
    } catch (err) {
      console.warn('[AIVoiceEngine] Error during speech synthesis:', err);
      this.isSpeaking = false;
      this.currentSpeakingText = '';
      this.notifyStateChange();
      if (onEnd) onEnd();
    }
  }

  stopSpeaking(wasInterrupted = false) {
    if (this.synthesis) {
      try {
        this.synthesis.cancel();
      } catch {
        // ignore
      }
    }
    const hadBeenSpeaking = this.isSpeaking;
    this.isSpeaking = false;
    this.currentSpeakingText = '';

    if (hadBeenSpeaking && wasInterrupted && this.onInterruptedCallback) {
      this.onInterruptedCallback();
    }

    this.notifyStateChange({ interrupted: wasInterrupted });
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopSpeaking();
    }
    this.notifyStateChange();
    return this.muted;
  }

  setLanguage(lang) {
    if (!lang) return;
    this.language = lang;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('argus_ai_speech_lang', lang);
      } catch {
        // ignore
      }
    }
    if (this.recognition) {
      this.recognition.lang = lang;
      if (this.isListening) {
        try {
          this.recognition.stop();
          setTimeout(() => {
            if (this.isListening) {
              try {
                this.recognition.start();
              } catch {
                // ignore
              }
            }
          }, 150);
        } catch {
          // ignore
        }
      }
    }
    this.notifyStateChange({ language: lang });
  }

  getLanguage() {
    return this.language || 'en-IN';
  }

  setMuted(val) {
    this.muted = Boolean(val);
    if (this.muted) {
      this.stopSpeaking();
    }
    this.notifyStateChange();
  }
}

export const aiVoiceEngine = new AIVoiceEngine();
export default aiVoiceEngine;
