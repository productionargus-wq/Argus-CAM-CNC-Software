import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, MicOff, Volume2, VolumeX, X, Play, RotateCw, Move, CornerDownLeft, Zap } from 'lucide-react';
import aiVoiceEngine from '../utils/aiVoiceEngine';
import { processVoiceCommand, isRecognizableIntent } from '../utils/aiCamDispatcher';

export default function AIVoiceButton({
  isAIActive,
  onToggleAI,
  onSnapCamera,
  onUpdateTransform,
  partTransform,
  partMetrics,
  onExecuteCommand,
  setIsBackplotActive,
  setRenderMode,
  onToggleTheme,
  operations = [],
  showToast
}) {
  const [engineState, setEngineState] = useState({
    isListening: false,
    isSpeaking: false,
    isSupported: true,
    muted: false
  });
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [actionBadge, setActionBadge] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [typedInput, setTypedInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [wasInterrupted, setWasInterrupted] = useState(false);
  const [selectedLang, setSelectedLang] = useState(() => aiVoiceEngine.getLanguage());
  const [correctionInfo, setCorrectionInfo] = useState(null);
  const lastProcessedTranscriptRef = useRef('');

  // Sync mute state
  useEffect(() => {
    aiVoiceEngine.setMuted(isMuted);
  }, [isMuted]);

  // Handle Turn ON / Turn OFF
  useEffect(() => {
    if (isAIActive) {
      setIsExpanded(true);
      setTranscript('');
      setInterimText('');
      setWasInterrupted(false);
      setLastResponse('Listening for your command...');
      setActionBadge('');

      // Full-Duplex: Start listening immediately so user can interrupt the greeting
      startListeningSession();

      // Greet the user with spoken audio
      aiVoiceEngine.speak('Argus AI active. How can I help with your CAM model?');
    } else {
      // Turn off
      aiVoiceEngine.stopSpeaking();
      aiVoiceEngine.stopListening();
      setIsExpanded(false);
      setTranscript('');
      setInterimText('');
      setWasInterrupted(false);
    }

    return () => {
      aiVoiceEngine.stopSpeaking();
      aiVoiceEngine.stopListening();
    };
  }, [isAIActive]);

  const startListeningSession = () => {
    aiVoiceEngine.startListening(
      // onTranscript
      ({ final, interim, alternatives }) => {
        if (interim) {
          setInterimText(interim);

          // Fast Barge-In Trigger: If user is uttering a recognizable command while AI is speaking
          if (aiVoiceEngine.isSpeaking && isRecognizableIntent(interim)) {
            aiVoiceEngine.stopSpeaking(true);
            setWasInterrupted(true);
            setLastResponse(`Listening: "${interim}"...`);
          }
        }

        if (final && final !== lastProcessedTranscriptRef.current) {
          lastProcessedTranscriptRef.current = final;
          setInterimText('');
          setTranscript(final);
          handleExecuteVoiceCommand({
            transcript: final,
            alternatives: alternatives || [final]
          });
        }
      },
      // onStateChange
      (state) => {
        setEngineState((prev) => ({ ...prev, ...state }));
        if (state.interrupted) {
          setWasInterrupted(true);
        }
      },
      // onError
      (error) => {
        console.warn('Voice Engine Error:', error);
        if (error === 'not-allowed') {
          showToast?.('Microphone access denied. You can also type commands into Argus AI.', 'warning');
        }
      },
      // onInterrupted callback
      () => {
        setWasInterrupted(true);
        setLastResponse('Interrupted AI — Listening to you...');
        setTimeout(() => setWasInterrupted(false), 3500);
      }
    );
  };

  // Dispatch and execute parsed command
  const handleExecuteVoiceCommand = (commandInput) => {
    const commandText = typeof commandInput === 'string' ? commandInput : commandInput?.transcript || '';
    if (!commandText || !commandText.trim()) return;

    // If AI was speaking, immediately silence it
    aiVoiceEngine.stopSpeaking();

    const appContext = {
      partTransform,
      partMetrics,
      operations
    };

    const result = processVoiceCommand(commandInput, appContext);

    // Track auto-correction for UI feedback
    if (result.isCorrected && result.correctedFrom) {
      setCorrectionInfo({
        from: result.correctedFrom,
        to: result.normalizedText
      });
    } else {
      setCorrectionInfo(null);
    }

    // Quick stop / interrupt command
    if (result.actionType === 'INTERRUPT') {
      setLastResponse('Ready for your command...');
      setActionBadge('AI Interrupted & Silenced');
      setWasInterrupted(true);
      setTimeout(() => setWasInterrupted(false), 2500);
      return;
    }

    setLastResponse(result.speechText);
    setActionBadge(result.toastText);

    // Speak confirmation response
    if (result.speechText) {
      aiVoiceEngine.speak(result.speechText);
    }

    if (result.toastText && showToast) {
      showToast(result.toastText, result.success ? 'success' : 'info');
    }

    // Execute corresponding CAD/CAM operation
    if (result.success) {
      switch (result.actionType) {
        case 'CAMERA_VIEW':
          if (onSnapCamera && result.payload?.preset) {
            onSnapCamera(result.payload.preset);
          }
          break;

        case 'CAMERA_PAN':
          if (onSnapCamera && result.payload) {
            onSnapCamera({ pan: result.payload });
          }
          break;

        case 'ROTATE_PART':
          if (onUpdateTransform && result.payload) {
            const { axis = 'z', degrees = 180 } = result.payload;
            const rad = (degrees * Math.PI) / 180;
            const curRot = partTransform?.rotation || { x: 0, y: 0, z: 0 };
            const nextTransform = {
              ...partTransform,
              rotation: {
                x: curRot.x + (axis === 'x' ? rad : 0),
                y: curRot.y + (axis === 'y' ? rad : 0),
                z: curRot.z + (axis === 'z' ? rad : 0)
              }
            };
            onUpdateTransform(nextTransform);
          }
          break;

        case 'TRANSLATE_PART':
          if (onUpdateTransform && result.payload) {
            const { dx = 0, dy = 0, dz = 0 } = result.payload;
            const curPos = partTransform?.position || { x: 0, y: 0, z: 0 };
            const nextTransform = {
              ...partTransform,
              position: {
                x: curPos.x + dx,
                y: curPos.y + dy,
                z: curPos.z + dz
              }
            };
            onUpdateTransform(nextTransform);
          }
          break;

        case 'RESET_TRANSFORM':
          if (onUpdateTransform) {
            onUpdateTransform({
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            });
          }
          break;

        case 'CAM_ACTION':
          if (result.payload?.command === 'start_backplot') {
            setIsBackplotActive?.(true);
          } else if (result.payload?.command === 'stop_backplot') {
            setIsBackplotActive?.(false);
          } else if (result.payload?.command === 'regenerate_toolpaths') {
            showToast?.('All active toolpath operations regenerated.', 'success');
          }
          break;

        case 'MODAL_OPEN':
          if (onExecuteCommand && result.payload?.modal) {
            onExecuteCommand(result.payload.modal);
          }
          break;

        case 'RENDER_MODE':
          if (setRenderMode && result.payload?.mode) {
            setRenderMode(result.payload.mode);
          }
          break;

        case 'THEME_MODE':
          if (onToggleTheme && result.payload?.theme) {
            onToggleTheme();
          }
          break;

        default:
          break;
      }
    }
  };

  const handleTypedSubmit = (e) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    setTranscript(typedInput);
    handleExecuteVoiceCommand(typedInput);
    setTypedInput('');
  };

  const handleQuickChip = (cmd) => {
    setTranscript(cmd);
    handleExecuteVoiceCommand(cmd);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '38px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '12px',
        pointerEvents: 'none'
      }}
    >
      {/* Expandable Conversation & Status Capsule */}
      {isAIActive && isExpanded && (
        <div
          style={{
            pointerEvents: 'auto',
            width: '320px',
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '16px',
            padding: '14px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(56, 189, 248, 0.2)',
            color: '#f8fafc',
            fontFamily: 'Inter, system-ui, sans-serif',
            animation: 'fadeInUp 0.25s ease-out',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: engineState.isSpeaking ? '#a855f7' : '#06b6d4',
                  boxShadow: engineState.isSpeaking
                    ? '0 0 10px #a855f7'
                    : '0 0 10px #06b6d4',
                  animation: 'pulse 1.5s infinite'
                }}
              />
              <span style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.5px', color: '#38bdf8' }}>
                ARGUS AI ASSISTANT
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Dialect / Accent Selector */}
              <select
                value={selectedLang}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setSelectedLang(newLang);
                  aiVoiceEngine.setLanguage(newLang);
                  showToast?.(`Speech recognition accent set to ${newLang === 'en-IN' ? 'English (India)' : newLang === 'en-US' ? 'English (US)' : newLang === 'en-GB' ? 'English (UK)' : 'English (Australia)'}`, 'info');
                }}
                title="Select Spoken English Accent / Dialect"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '4px',
                  color: '#38bdf8',
                  fontSize: '10px',
                  fontWeight: '600',
                  padding: '2px 4px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="en-IN" style={{ background: '#0f172a', color: '#f8fafc' }}>🇮🇳 India (en-IN)</option>
                <option value="en-US" style={{ background: '#0f172a', color: '#f8fafc' }}>🇺🇸 US (en-US)</option>
                <option value="en-GB" style={{ background: '#0f172a', color: '#f8fafc' }}>🇬🇧 UK (en-GB)</option>
                <option value="en-AU" style={{ background: '#0f172a', color: '#f8fafc' }}>🇦🇺 AU (en-AU)</option>
              </select>

              <button
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
                style={{
                  background: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px',
                  color: isMuted ? '#f87171' : '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <button
                onClick={() => onToggleAI(false)}
                title="Turn off AI"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Active Listening / Audio wave status */}
          <div
            style={{
              background: wasInterrupted ? 'rgba(234, 179, 8, 0.15)' : 'rgba(2, 132, 199, 0.1)',
              border: wasInterrupted ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {wasInterrupted ? <Zap size={14} className="text-amber-400" /> : <Mic size={14} className="text-cyan-400" />}
              <span style={{ color: wasInterrupted ? '#fde047' : '#bae6fd', fontWeight: '500' }}>
                {wasInterrupted
                  ? 'Interrupted AI — Listening to you...'
                  : engineState.isSpeaking
                  ? 'Speaking response (speak to interrupt)...'
                  : interimText
                  ? `Hearing: "${interimText}"`
                  : 'Listening... speak a command'}
              </span>
            </div>
            {/* Equalizer Wavebars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '14px' }}>
              <span style={{ width: '2px', height: '100%', background: wasInterrupted ? '#eab308' : '#38bdf8', borderRadius: '1px', animation: 'wave 0.8s infinite ease-in-out' }} />
              <span style={{ width: '2px', height: '70%', background: wasInterrupted ? '#eab308' : '#38bdf8', borderRadius: '1px', animation: 'wave 0.6s infinite ease-in-out' }} />
              <span style={{ width: '2px', height: '90%', background: wasInterrupted ? '#eab308' : '#38bdf8', borderRadius: '1px', animation: 'wave 0.9s infinite ease-in-out' }} />
              <span style={{ width: '2px', height: '60%', background: wasInterrupted ? '#eab308' : '#38bdf8', borderRadius: '1px', animation: 'wave 0.7s infinite ease-in-out' }} />
            </div>
          </div>

          {/* Response Box */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '8px',
              padding: '10px',
              minHeight: '52px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            {transcript && (
              <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                <span style={{ color: '#0284c7', fontWeight: '600' }}>You: </span>
                "{transcript}"
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#f1f5f9', fontWeight: '500', lineHeight: '1.4' }}>
              <span style={{ color: '#a855f7', fontWeight: '600' }}>AI: </span>
              {lastResponse}
            </div>
            {correctionInfo && (
              <div
                style={{
                  fontSize: '10px',
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.1)',
                  padding: '3px 7px',
                  borderRadius: '4px',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  marginTop: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>⚡</span>
                <span>Auto-corrected: "<em>{correctionInfo.from}</em>" → "<strong>{correctionInfo.to}</strong>"</span>
              </div>
            )}
            {actionBadge && (
              <div style={{ marginTop: '4px' }}>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.18)',
                    color: '#34d399',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'inline-block'
                  }}
                >
                  ✓ {actionBadge}
                </span>
              </div>
            )}
          </div>

          {/* Quick Action Suggestion Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {[
              { label: '📐 Top View', cmd: 'show top view' },
              { label: '🔄 Rotate 180°', cmd: 'rotate 180 degree' },
              { label: '↔️ Move 20mm', cmd: 'move 20 mm on x' },
              { label: '👈 Pan Left', cmd: 'pan left' },
              { label: '👉 Pan Right', cmd: 'pan right' },
              { label: '🌐 Isometric', cmd: 'isometric view' },
              { label: '▶️ Simulate', cmd: 'start simulation' }
            ].map((chip) => (
              <button
                key={chip.cmd}
                onClick={() => handleQuickChip(chip.cmd)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '3px 8px',
                  fontSize: '10.5px',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)';
                  e.currentTarget.style.borderColor = '#38bdf8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Text Input Fallback */}
          <form onSubmit={handleTypedSubmit} style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder="Or type a command (e.g. rotate 180)..."
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '11px',
                color: '#ffffff',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                background: '#0284c7',
                border: 'none',
                borderRadius: '6px',
                padding: '0 10px',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CornerDownLeft size={13} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Circular AI Orb Button */}
      <button
        onClick={() => onToggleAI(!isAIActive)}
        title={isAIActive ? 'Turn off Argus AI' : 'Click to activate Argus AI (Voice Controlled)'}
        style={{
          pointerEvents: 'auto',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: isAIActive
            ? '2px solid #38bdf8'
            : '2px solid rgba(2, 132, 199, 0.5)',
          background: isAIActive
            ? 'radial-gradient(circle at 35% 35%, #0284c7, #0f172a 90%)'
            : 'radial-gradient(circle at 35% 35%, #1e293b, #090d16 90%)',
          boxShadow: isAIActive
            ? '0 0 24px rgba(56, 189, 248, 0.75), 0 8px 24px rgba(0, 0, 0, 0.5)'
            : '0 4px 16px rgba(0, 0, 0, 0.35)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          if (!isAIActive) {
            e.currentTarget.style.boxShadow = '0 0 16px rgba(56, 189, 248, 0.5)';
            e.currentTarget.style.borderColor = '#38bdf8';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          if (!isAIActive) {
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.35)';
            e.currentTarget.style.borderColor = 'rgba(2, 132, 199, 0.5)';
          }
        }}
      >
        {/* Animated Sound Wave Outer Glow Ring when Active */}
        {isAIActive && (
          <span
            style={{
              position: 'absolute',
              top: '-6px',
              left: '-6px',
              right: '-6px',
              bottom: '-6px',
              borderRadius: '50%',
              border: '2px solid rgba(56, 189, 248, 0.45)',
              animation: 'aiPulseRing 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1)'
            }}
          />
        )}

        {/* Center Icon */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isAIActive ? (
            <Sparkles size={24} className="text-cyan-300" style={{ animation: 'spinSlow 12s linear infinite' }} />
          ) : (
            <Sparkles size={22} className="text-cyan-500" />
          )}
        </div>
      </button>

      {/* Embedded CSS Animations */}
      <style>{`
        @keyframes aiPulseRing {
          0% {
            transform: scale(0.95);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.22);
            opacity: 0;
          }
          100% {
            transform: scale(0.95);
            opacity: 0;
          }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes wave {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
