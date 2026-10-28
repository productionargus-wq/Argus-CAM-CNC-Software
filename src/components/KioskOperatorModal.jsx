import React, { useState, useEffect, useRef } from 'react';
import {
  X, Maximize2, Minimize2, Play, Pause, AlertOctagon, Volume2, VolumeX,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  RotateCcw, RotateCw, Check, CheckCircle2, Zap, Sliders, Gauge,
  Cpu, Clock, Wrench, ShieldAlert, Radio,
  Droplets, Wind, Power, Terminal, Hash, Disc
} from 'lucide-react';
import {
  DEFAULT_MACHINE_DRO,
  DEFAULT_CYCLE_STATE,
  DEFAULT_PRODUCTION_METRICS,
  SAMPLE_RUNNING_GCODE,
  computeJogMove,
  zeroWorkAxis,
  halfWorkAxis,
  executeMdiCommand,
  playCncAudioFeedback
} from '../utils/kioskEngine.js';

export default function KioskOperatorModal({
  isOpen,
  onClose,
  activeMachine = null,
  activeOperations = [],
  tools = []
}) {

  // Kiosk Window & Audio Settings
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const modalContainerRef = useRef(null);

  // Machine States
  const [dro, setDro] = useState(DEFAULT_MACHINE_DRO);
  const [cycleState, setCycleState] = useState(DEFAULT_CYCLE_STATE);
  const [productionMetrics, setProductionMetrics] = useState(DEFAULT_PRODUCTION_METRICS);

  // Jog Settings
  const [jogStep, setJogStep] = useState(1.0); // 0 (Continuous), 0.001, 0.01, 0.1, 1.0, 10.0
  const [jogFeedrate, setJogFeedrate] = useState(2000); // mm/min

  // G-Code Execution Simulation
  const [activeBlockIdx, setActiveBlockIdx] = useState(7);
  const [lastMdiResponse, setLastMdiResponse] = useState('System Ready. WCS G54 Active.');
  const [mdiInput, setMdiInput] = useState('');
  const [mdiHistory, setMdiHistory] = useState([
    'G90 G21 G17 G54',
    'G28 G91 Z0',
    'M06 T01',
    'S12000 M03',
    'M08'
  ]);

  // Audio helper
  const triggerAudio = (soundType) => {
    if (audioEnabled) {
      playCncAudioFeedback(soundType);
    }
  };

  // Fullscreen Handler (uses native HTML5 Fullscreen API if available)
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      modalContainerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Real-time Cycle Timer when in 'RUNNING' state
  useEffect(() => {
    let interval = null;
    if (cycleState.mode === 'RUNNING') {
      interval = setInterval(() => {
        setProductionMetrics(prev => ({
          ...prev,
          elapsedCurrentPartSec: prev.elapsedCurrentPartSec + 1,
          shiftInCutSec: prev.shiftInCutSec + 1
        }));

        // Advance G-Code blocks continuously
        setActiveBlockIdx(prev => (prev + 1) % SAMPLE_RUNNING_GCODE.length);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cycleState.mode]);

  // Handle Jog Move
  const handleJog = (axis, direction) => {
    if (cycleState.mode === 'ESTOP') {
      triggerAudio('alarm');
      return;
    }
    triggerAudio('click');
    const result = computeJogMove(dro, axis, direction, jogStep);
    setDro(result.dro);
    if (result.limitHit) {
      triggerAudio('alarm');
      setLastMdiResponse(`SOFT LIMIT REACHED ON ${axis.toUpperCase()} AXIS!`);
    } else {
      setLastMdiResponse(`JOG: ${result.gcodeEquivalent}`);
    }
  };

  // Handle Zero Axis
  const handleZero = (axis) => {
    triggerAudio('zero');
    setDro(prev => zeroWorkAxis(prev, axis));
    setLastMdiResponse(`Zeroed ${axis.toUpperCase()} Work Coordinate in ${dro.wcs}`);
  };

  // Handle Half Axis (/2 Center Finder)
  const handleHalf = (axis) => {
    triggerAudio('click');
    setDro(prev => halfWorkAxis(prev, axis));
    setLastMdiResponse(`Halved ${axis.toUpperCase()} Coordinate (${axis.toUpperCase()}/2)`);
  };

  // Zero All Axes
  const handleZeroAll = () => {
    triggerAudio('zero');
    let d = zeroWorkAxis(dro, 'x');
    d = zeroWorkAxis(d, 'y');
    d = zeroWorkAxis(d, 'z');
    setDro(d);
    setLastMdiResponse(`Zeroed All Primary Axes (XYZ) in ${dro.wcs}`);
  };

  // Switch WCS (G54, G55, G56)
  const handleSelectWcs = (wcsName) => {
    triggerAudio('click');
    setDro(prev => ({ ...prev, wcs: wcsName }));
    setLastMdiResponse(`Selected Work Coordinate System: ${wcsName}`);
  };

  // Cycle Start
  const handleCycleStart = () => {
    if (cycleState.mode === 'ESTOP') {
      triggerAudio('alarm');
      setLastMdiResponse('CANNOT START: Emergency Stop is Active. Reset E-Stop first.');
      return;
    }
    triggerAudio('start');
    setCycleState(prev => ({
      ...prev,
      mode: 'RUNNING',
      spindleState: 'CW',
      coolant: prev.coolant === 'OFF' ? 'FLOOD' : prev.coolant
    }));
    setLastMdiResponse('CYCLE STARTED - Machining Active Operation.');
  };

  // Feed Hold
  const handleFeedHold = () => {
    triggerAudio('hold');
    setCycleState(prev => ({
      ...prev,
      mode: 'FEED_HOLD'
    }));
    setLastMdiResponse('FEED HOLD ACTIVE - Toolpath Paused. Spindle Retained.');
  };

  // Emergency Stop (E-STOP)
  const handleEmergencyStop = () => {
    triggerAudio('estop');
    setCycleState(prev => ({
      ...prev,
      mode: prev.mode === 'ESTOP' ? 'IDLE' : 'ESTOP',
      spindleState: 'OFF',
      coolant: 'OFF',
      actualRpm: 0
    }));
    setLastMdiResponse(
      cycleState.mode === 'ESTOP'
        ? 'E-Stop Reset. Machine Drives Ready (IDLE).'
        : 'EMERGENCY STOP ENGAGED! All axes and spindle locked.'
    );
  };

  // Override Sliders
  const handleFeedOverrideChange = (val) => {
    triggerAudio('click');
    setCycleState(prev => ({ ...prev, feedOverridePct: val }));
  };

  const handleSpindleOverrideChange = (val) => {
    triggerAudio('click');
    setCycleState(prev => {
      const actual = Math.round(prev.commandedRpm * (val / 100));
      return {
        ...prev,
        spindleOverridePct: val,
        actualRpm: prev.spindleState !== 'OFF' ? actual : 0
      };
    });
  };

  // Spindle Manual Buttons
  const toggleSpindle = (action) => {
    triggerAudio('click');
    setCycleState(prev => {
      if (action === 'STOP') {
        return { ...prev, spindleState: 'OFF', actualRpm: 0 };
      }
      const actual = Math.round(prev.commandedRpm * (prev.spindleOverridePct / 100));
      return { ...prev, spindleState: action, actualRpm: actual };
    });
    setLastMdiResponse(`Spindle Manual Mode: ${action}`);
  };

  // Coolant Manual Toggle
  const cycleCoolant = () => {
    triggerAudio('click');
    const modes = ['OFF', 'FLOOD', 'MIST', 'AIR'];
    const nextIdx = (modes.indexOf(cycleState.coolant) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    setCycleState(prev => ({ ...prev, coolant: nextMode }));
    setLastMdiResponse(`Coolant System: ${nextMode}`);
  };

  // MDI Send
  const handleSendMdi = (cmdToSend = null) => {
    const cmd = cmdToSend || mdiInput;
    if (!cmd.trim()) return;

    triggerAudio('click');
    const result = executeMdiCommand(cmd, dro, cycleState);
    if (result.success) {
      setDro(result.dro);
      setCycleState(result.cycleState);
      setLastMdiResponse(result.message);
      if (!cmdToSend) {
        setMdiHistory(prev => [cmd, ...prev.slice(0, 7)]);
        setMdiInput('');
      }
    } else {
      triggerAudio('alarm');
      setLastMdiResponse(`MDI Error: ${result.message}`);
    }
  };

  // Part Completed Counter
  const handleIncrementPart = () => {
    triggerAudio('zero');
    setProductionMetrics(prev => ({
      ...prev,
      partsCompleted: prev.partsCompleted + 1,
      elapsedCurrentPartSec: 0
    }));
    setLastMdiResponse(`Part Count Incremented: ${productionMetrics.partsCompleted + 1} / ${productionMetrics.partsTarget}`);
  };

  // Format Helper for Coordinates
  const formatCoord = (val) => {
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val.toFixed(3)}`;
  };

  // Format Seconds to mm:ss
  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Active Machine Display Name
  const machineName = activeMachine?.name || 'DMG MORI DMU 50 (5-Axis VMC)';

  if (!isOpen) return null;

  return (
    <div
      ref={modalContainerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md overflow-hidden select-none"
    >
      <div
        className={`bg-[#0a0e17] border border-slate-700/80 shadow-2xl flex flex-col transition-all duration-150 ${
          isFullscreen ? 'w-full h-full border-none rounded-none' : 'w-[98vw] max-w-[1550px] h-[95vh] rounded-2xl'
        }`}
      >
        {/* ================================================================== */}
        {/* TOP STATUS BEACON & HEADER BAR */}
        {/* ================================================================== */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-[#070a10]">
          {/* Machine & Status Indicator */}
          <div className="flex items-center gap-4">
            {/* Status Beacon */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border bg-slate-900/90 border-slate-700">
              <span
                className={`w-3.5 h-3.5 rounded-full ${
                  cycleState.mode === 'RUNNING'
                    ? 'bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]'
                    : cycleState.mode === 'FEED_HOLD'
                    ? 'bg-amber-500 animate-pulse shadow-[0_0_12px_#f59e0b]'
                    : cycleState.mode === 'ESTOP'
                    ? 'bg-rose-600 animate-bounce shadow-[0_0_14px_#e11d48]'
                    : 'bg-sky-500 shadow-[0_0_8px_#0ea5e9]'
                }`}
              />
              <span className="font-mono font-bold text-xs tracking-wider text-slate-100 uppercase">
                {cycleState.mode === 'RUNNING'
                  ? 'IN CYCLE'
                  : cycleState.mode === 'FEED_HOLD'
                  ? 'FEED HOLD'
                  : cycleState.mode === 'ESTOP'
                  ? 'EMERGENCY STOP'
                  : 'READY (IDLE)'}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-slate-100 tracking-wide">
                  ARGUS OPERATOR TABLET KIOSK
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-sky-500/20 text-sky-300 rounded border border-sky-500/30">
                  {machineName}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Pendant Console • High-Contrast Touch Control • ISO 6983 Dynamic DRO
              </p>
            </div>
          </div>

          {/* WCS Select & Global Actions */}
          <div className="flex items-center gap-3">
            {/* WCS Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-1 gap-1">
              {['G54', 'G55', 'G56'].map(wcsKey => (
                <button
                  key={wcsKey}
                  onClick={() => handleSelectWcs(wcsKey)}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                    dro.wcs === wcsKey
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {wcsKey}
                </button>
              ))}
            </div>

            {/* Audio Toggle */}
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-2 rounded-lg border transition-colors ${
                audioEnabled
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title={audioEnabled ? 'CNC Acoustic Feedback ON' : 'Acoustic Feedback Muted'}
            >
              {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            {/* Fullscreen Kiosk Mode */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors"
              title="Fullscreen Tablet Kiosk"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            {/* Close Studio */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 transition-colors"
              title="Exit Operator Kiosk"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* MAIN BODY: 3-COLUMN INDUSTRIAL CNC CONSOLE */}
        {/* ================================================================== */}
        <div className="flex-1 grid grid-cols-12 gap-3.5 p-4 overflow-hidden bg-[#06090f]">
          {/* ---------------------------------------------------------------- */}
          {/* COLUMN 1: DIGITAL READOUT (DRO) (COL-SPAN 4) */}
          {/* ---------------------------------------------------------------- */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-3 bg-[#0a0f18] p-4 rounded-xl border border-slate-800/80 shadow-lg">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Gauge size={18} className="text-sky-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Digital Readout (DRO)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <button
                  onClick={() => setDro(prev => ({ ...prev, coordinateMode: 'WCS' }))}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    dro.coordinateMode === 'WCS'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'text-slate-400'
                  }`}
                >
                  WCS ({dro.wcs})
                </button>
                <button
                  onClick={() => setDro(prev => ({ ...prev, coordinateMode: 'MCS' }))}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    dro.coordinateMode === 'MCS'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400'
                  }`}
                >
                  MCS (Machine)
                </button>
              </div>
            </div>

            {/* Large 7-Segment Style Coordinate Displays */}
            <div className="space-y-2.5 flex-1 flex flex-col justify-around">
              {['x', 'y', 'z', 'a'].map(axisKey => {
                const isRotary = axisKey === 'a';
                const coordVal = dro.coordinateMode === 'WCS' ? dro.work[axisKey] : dro.machine[axisKey];
                const axisColors = {
                  x: 'text-rose-400 border-rose-500/30',
                  y: 'text-emerald-400 border-emerald-500/30',
                  z: 'text-sky-400 border-sky-500/30',
                  a: 'text-purple-400 border-purple-500/30'
                };

                return (
                  <div
                    key={axisKey}
                    className="p-3 bg-[#05070d] rounded-xl border border-slate-800/80 flex items-center justify-between"
                  >
                    {/* Axis Name */}
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-black text-lg uppercase bg-slate-900 border ${axisColors[axisKey]}`}
                      >
                        {axisKey}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-mono uppercase">
                          {dro.coordinateMode === 'WCS' ? `${dro.wcs} Offset` : 'Encoder Absolute'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          DTG: 0.000 mm
                        </span>
                      </div>
                    </div>

                    {/* Numeric Value */}
                    <div className="flex items-baseline gap-1 text-right">
                      <span
                        className={`font-mono font-black tracking-widest text-2xl md:text-3xl drop-shadow-[0_0_8px_rgba(56,189,248,0.25)] ${
                          axisKey === 'x'
                            ? 'text-rose-400'
                            : axisKey === 'y'
                            ? 'text-emerald-400'
                            : axisKey === 'z'
                            ? 'text-sky-400'
                            : 'text-purple-400'
                        }`}
                      >
                        {formatCoord(coordVal)}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {isRotary ? '°' : 'mm'}
                      </span>
                    </div>

                    {/* Quick Zero & /2 Buttons */}
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        onClick={() => handleZero(axisKey)}
                        className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-mono font-bold border border-slate-700 transition-colors"
                        title={`Set ${axisKey.toUpperCase()} = 0.000 in ${dro.wcs}`}
                      >
                        ZERO
                      </button>
                      {!isRotary && (
                        <button
                          onClick={() => handleHalf(axisKey)}
                          className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 rounded text-[11px] font-mono font-bold border border-slate-800 transition-colors"
                          title={`Half ${axisKey.toUpperCase()} coordinate (Center Finder)`}
                        >
                          /2
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Zero All Primary Axes */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                Work Coordinate Zeroing
              </span>
              <button
                onClick={handleZeroAll}
                className="px-4 py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <CheckCircle2 size={14} />
                ZERO ALL (XYZ)
              </button>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* COLUMN 2: DIRECTIONAL JOG PENDANT & OVERRIDES (COL-SPAN 4) */}
          {/* ---------------------------------------------------------------- */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-3 bg-[#0a0f18] p-4 rounded-xl border border-slate-800/80 shadow-lg">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-emerald-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Manual Jog &amp; Overrides
                </span>
              </div>
              <div className="text-[11px] font-mono text-emerald-400">
                F{jogFeedrate} mm/min
              </div>
            </div>

            {/* Step Size Selector Pills */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                <span>Jog Step Increment</span>
                <span>{jogStep === 0 ? 'Continuous' : `${jogStep} mm`}</span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {[
                  { label: 'Cont.', val: 0 },
                  { label: '10', val: 10.0 },
                  { label: '1.0', val: 1.0 },
                  { label: '0.1', val: 0.1 },
                  { label: '0.01', val: 0.01 },
                  { label: '0.001', val: 0.001 }
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={() => {
                      triggerAudio('click');
                      setJogStep(item.val);
                    }}
                    className={`py-1.5 rounded text-[11px] font-mono font-bold transition-all ${
                      jogStep === item.val
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-900/50'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tactile Diamond Jog Keypad */}
            <div className="grid grid-cols-4 gap-2.5 p-3 bg-[#05070d] rounded-xl border border-slate-800/80 items-center justify-items-center">
              {/* Row 1 */}
              <div />
              <button
                onClick={() => handleJog('y', 1)}
                className="w-16 h-16 rounded-xl bg-slate-800 hover:bg-emerald-600 active:bg-emerald-700 text-slate-100 flex flex-col items-center justify-center font-mono font-bold text-sm shadow-md border border-slate-700 transition-all hover:scale-105 active:scale-95"
              >
                <ArrowUp size={20} className="text-emerald-400" />
                <span>Y+</span>
              </button>
              <div />
              {/* Z+ (Retract) */}
              <button
                onClick={() => handleJog('z', 1)}
                className="w-16 h-16 rounded-xl bg-slate-800 hover:bg-sky-600 active:bg-sky-700 text-slate-100 flex flex-col items-center justify-center font-mono font-bold text-sm shadow-md border border-slate-700 transition-all hover:scale-105 active:scale-95"
              >
                <ArrowUp size={20} className="text-sky-400" />
                <span>Z+</span>
              </button>

              {/* Row 2 */}
              <button
                onClick={() => handleJog('x', -1)}
                className="w-16 h-16 rounded-xl bg-slate-800 hover:bg-rose-600 active:bg-rose-700 text-slate-100 flex flex-col items-center justify-center font-mono font-bold text-sm shadow-md border border-slate-700 transition-all hover:scale-105 active:scale-95"
              >
                <ArrowLeft size={20} className="text-rose-400" />
                <span>X-</span>
              </button>
              <div className="w-16 h-16 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center text-slate-600 font-mono text-xs font-bold">
                JOG
              </div>
              <button
                onClick={() => handleJog('x', 1)}
                className="w-16 h-16 rounded-xl bg-slate-800 hover:bg-rose-600 active:bg-rose-700 text-slate-100 flex flex-col items-center justify-center font-mono font-bold text-sm shadow-md border border-slate-700 transition-all hover:scale-105 active:scale-95"
              >
                <ArrowRight size={20} className="text-rose-400" />
                <span>X+</span>
              </button>
              {/* Z- (Plunge) */}
              <button
                onClick={() => handleJog('z', -1)}
                className="w-16 h-16 rounded-xl bg-slate-800 hover:bg-sky-600 active:bg-sky-700 text-slate-100 flex flex-col items-center justify-center font-mono font-bold text-sm shadow-md border border-slate-700 transition-all hover:scale-105 active:scale-95"
              >
                <ArrowDown size={20} className="text-sky-400" />
                <span>Z-</span>
              </button>

              {/* Row 3 */}
              <div />
              <button
                onClick={() => handleJog('y', -1)}
                className="w-16 h-16 rounded-xl bg-slate-800 hover:bg-emerald-600 active:bg-emerald-700 text-slate-100 flex flex-col items-center justify-center font-mono font-bold text-sm shadow-md border border-slate-700 transition-all hover:scale-105 active:scale-95"
              >
                <ArrowDown size={20} className="text-emerald-400" />
                <span>Y-</span>
              </button>
              <div />
              {/* Rotary A Jog */}
              <div className="flex gap-1">
                <button
                  onClick={() => handleJog('a', -1)}
                  className="w-7 h-16 rounded-lg bg-slate-800 hover:bg-purple-600 active:bg-purple-700 text-slate-100 flex items-center justify-center font-mono text-[10px] font-bold border border-slate-700"
                  title="Rotary A- CCW"
                >
                  A-
                </button>
                <button
                  onClick={() => handleJog('a', 1)}
                  className="w-7 h-16 rounded-lg bg-slate-800 hover:bg-purple-600 active:bg-purple-700 text-slate-100 flex items-center justify-center font-mono text-[10px] font-bold border border-slate-700"
                  title="Rotary A+ CW"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Overrides: FRO and SSO */}
            <div className="space-y-3 pt-1">
              {/* Feedrate Override (FRO) */}
              <div className="p-2.5 bg-[#05070d] rounded-xl border border-slate-800">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-300 font-semibold">Feedrate Override (FRO)</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {cycleState.feedOverridePct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="150"
                  step="5"
                  value={cycleState.feedOverridePct}
                  onChange={e => handleFeedOverrideChange(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between gap-1 mt-1.5">
                  {[50, 80, 100, 120, 150].map(pct => (
                    <button
                      key={pct}
                      onClick={() => handleFeedOverrideChange(pct)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
                        cycleState.feedOverridePct === pct
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Spindle Speed Override (SSO) */}
              <div className="p-2.5 bg-[#05070d] rounded-xl border border-slate-800">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-300 font-semibold">Spindle Speed Override (SSO)</span>
                  <span className="font-mono font-bold text-cyan-400 text-sm">
                    {cycleState.spindleOverridePct}% ({cycleState.actualRpm} RPM)
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  step="5"
                  value={cycleState.spindleOverridePct}
                  onChange={e => handleSpindleOverrideChange(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between gap-1 mt-1.5">
                  {[50, 80, 100, 120, 150].map(pct => (
                    <button
                      key={pct}
                      onClick={() => handleSpindleOverrideChange(pct)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
                        cycleState.spindleOverridePct === pct
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Spindle & Coolant Manual Toggles */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleSpindle(cycleState.spindleState === 'CW' ? 'STOP' : 'CW')}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    cycleState.spindleState === 'CW'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <RotateCw size={14} />
                  SPINDLE CW
                </button>
              </div>
              <button
                onClick={cycleCoolant}
                className={`py-2 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  cycleState.coolant !== 'OFF'
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Droplets size={14} />
                COOLANT: {cycleState.coolant}
              </button>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* COLUMN 3: CYCLE EXECUTION, G-CODE STREAM & MDI (COL-SPAN 4) */}
          {/* ---------------------------------------------------------------- */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-3 bg-[#0a0f18] p-4 rounded-xl border border-slate-800/80 shadow-lg">
            {/* THE BIG THREE CNC BUTTONS */}
            <div className="grid grid-cols-3 gap-2 pb-2 border-b border-slate-800">
              {/* CYCLE START */}
              <button
                onClick={handleCycleStart}
                className="py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white flex flex-col items-center justify-center gap-1 font-mono font-black text-sm shadow-xl shadow-emerald-950/80 border border-emerald-400/50 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Play size={22} className="fill-white" />
                <span>CYCLE START</span>
              </button>

              {/* FEED HOLD */}
              <button
                onClick={handleFeedHold}
                className="py-4 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white flex flex-col items-center justify-center gap-1 font-mono font-black text-sm shadow-xl shadow-amber-950/80 border border-amber-400/50 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Pause size={22} className="fill-white" />
                <span>FEED HOLD</span>
              </button>

              {/* EMERGENCY STOP */}
              <button
                onClick={handleEmergencyStop}
                className={`py-4 rounded-xl flex flex-col items-center justify-center gap-1 font-mono font-black text-sm shadow-xl border transition-all hover:scale-[1.02] active:scale-95 ${
                  cycleState.mode === 'ESTOP'
                    ? 'bg-rose-700 text-white border-rose-400 shadow-rose-950/90 animate-pulse'
                    : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400/50 shadow-rose-950/80'
                }`}
              >
                <AlertOctagon size={22} className="fill-white text-rose-600" />
                <span>{cycleState.mode === 'ESTOP' ? 'RESET E-STOP' : 'E-STOP'}</span>
              </button>
            </div>

            {/* ACTIVE RUNNING G-CODE BLOCK TICKER */}
            <div className="p-3 bg-[#05070d] rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <Terminal size={12} className="text-sky-400" />
                  Active Program Block Stream
                </span>
                <span className="text-emerald-400">
                  Block {activeBlockIdx + 1} / {SAMPLE_RUNNING_GCODE.length}
                </span>
              </div>

              {/* Previous Block */}
              <div className="text-[11px] font-mono text-slate-600 truncate">
                {activeBlockIdx > 0 ? SAMPLE_RUNNING_GCODE[activeBlockIdx - 1].line : '; Header Start'}
              </div>

              {/* CURRENT EXECUTING BLOCK */}
              <div className="p-2 rounded bg-sky-950/40 border border-sky-500/40 text-sky-200 font-mono font-bold text-xs truncate flex items-center justify-between">
                <span>{SAMPLE_RUNNING_GCODE[activeBlockIdx].line}</span>
                <span className="text-[10px] text-sky-400 font-normal">
                  ({SAMPLE_RUNNING_GCODE[activeBlockIdx].comment})
                </span>
              </div>

              {/* Next Block */}
              <div className="text-[11px] font-mono text-slate-500 truncate">
                {activeBlockIdx < SAMPLE_RUNNING_GCODE.length - 1
                  ? SAMPLE_RUNNING_GCODE[activeBlockIdx + 1].line
                  : '; Program End'}
              </div>
            </div>

            {/* ACTIVE TOOL & TAYLOR WEAR MONITOR */}
            <div className="p-3 bg-[#05070d] rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Wrench size={13} className="text-amber-400" />
                  Active Tool: {cycleState.activeToolId}
                </span>
                <span className="font-mono text-emerald-400 text-[11px]">
                  {cycleState.activeToolLifeRemainingMin} min life remaining
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono truncate">
                {cycleState.activeToolName}
              </div>
              {/* Wear Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${100 - cycleState.activeToolWearPct}%` }}
                />
              </div>
            </div>

            {/* PRODUCTION SHIFT COUNTER & TIMER */}
            <div className="p-3 bg-[#05070d] rounded-xl border border-slate-800 grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">
                  Parts Completed Today
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono font-black text-xl text-slate-100">
                    {productionMetrics.partsCompleted}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    / {productionMetrics.partsTarget}
                  </span>
                </div>
                <button
                  onClick={handleIncrementPart}
                  className="mt-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-mono font-semibold border border-slate-700 transition-colors"
                >
                  +1 Part Made
                </button>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">
                  Active Part Runtime
                </span>
                <div className="font-mono font-black text-xl text-emerald-400 mt-0.5">
                  {formatTimer(productionMetrics.elapsedCurrentPartSec)}
                </div>
                <span className="text-[10px] text-slate-400 font-mono block mt-1">
                  Est. Shift Target: {productionMetrics.estimatedCompletionTime}
                </span>
              </div>
            </div>

            {/* MDI (MANUAL DATA INPUT) CONSOLE */}
            <div className="space-y-1.5 flex-1 flex flex-col justify-end">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>MDI (Manual Data Input)</span>
                <span className="text-slate-500 text-[10px]">Enter G-Code block</span>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={mdiInput}
                  onChange={e => setMdiInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMdi()}
                  placeholder="e.g. G00 X0 Y0 or M06 T1"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                />
                <button
                  onClick={() => handleSendMdi()}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-mono font-bold transition-colors"
                >
                  EXEC
                </button>
              </div>
              {/* Quick Preset Macros */}
              <div className="flex gap-1 overflow-x-auto pb-1">
                {['G28 Z0', 'G00 X0 Y0', 'M06 T01', 'M08', 'M09'].map(macro => (
                  <button
                    key={macro}
                    onClick={() => handleSendMdi(macro)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 whitespace-nowrap"
                  >
                    {macro}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* BOTTOM NOTIFICATION TICKER */}
        {/* ================================================================== */}
        <div className="px-6 py-2 border-t border-slate-800 bg-[#05070d] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 truncate">
            <Radio size={14} className="text-sky-400 shrink-0 animate-pulse" />
            <span className="text-slate-400 shrink-0">OPERATOR BUS:</span>
            <span className="text-slate-200 font-semibold truncate">{lastMdiResponse}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 shrink-0">
            <span>Interpolation: 100 Hz</span>
            <span>Safety Interlocks: ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

