/**
 * aiVoiceEngine.js
 * Browser-native Web Speech API wrapper for Argus Master CAM.
 * Provides bi-directional voice interaction:
 * - Speech Recognition (STT via SpeechRecognition / webkitSpeechRecognition)
 * - Speech Synthesis (TTS via window.speechSynthesis)
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
    this.onTranscriptCallback = null;
    this.onStateChangeCallback = null;
    this.onErrorCallback = null;
    this.muted = false;
    this.speechRate = 1.05;
    this.speechPitch = 1.0;

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
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
          this.isListening = true;
          this.notifyStateChange();
        };

        this.recognition.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (this.onTranscriptCallback) {
            this.onTranscriptCallback({
              final: finalTranscript.trim(),
              interim: interimTranscript.trim()
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
        // Prefer natural English voices (Google US English, Microsoft Jenny/Guy/David/Zira, Samantha)
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

  notifyStateChange() {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({
        isListening: this.isListening,
        isSpeaking: this.isSpeaking,
        isSupported: this.isSupported,
        muted: this.muted
      });
    }
  }

  startListening(onTranscript, onStateChange, onError) {
    if (onTranscript) this.onTranscriptCallback = onTranscript;
    if (onStateChange) this.onStateChangeCallback = onStateChange;
    if (onError) this.onErrorCallback = onError;

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
      // Might already be started
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
      // Cancel any ongoing speech to avoid overlapping
      this.synthesis.cancel();

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
        this.notifyStateChange();
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.warn('[AIVoiceEngine] Synthesis error:', e);
        this.isSpeaking = false;
        this.notifyStateChange();
        if (onEnd) onEnd();
      };

      this.synthesis.speak(utterance);
    } catch (err) {
      console.warn('[AIVoiceEngine] Error during speech synthesis:', err);
      this.isSpeaking = false;
      this.notifyStateChange();
      if (onEnd) onEnd();
    }
  }

  stopSpeaking() {
    if (this.synthesis) {
      try {
        this.synthesis.cancel();
      } catch {
        // ignore
      }
    }
    this.isSpeaking = false;
    this.notifyStateChange();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopSpeaking();
    }
    this.notifyStateChange();
    return this.muted;
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
