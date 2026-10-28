/**
 * Argus CAM CNC Shop Floor Operator Tablet & Kiosk Engine
 * 
 * Provides:
 * - Real-time Digital Readout (DRO) coordinate tracking (WCS G54-G59 vs MCS)
 * - Directional jog vector calculations with safety soft limits
 * - Feedrate & Spindle Override (FRO / SSO) mathematical models
 * - MDI (Manual Data Input) block parser and kinematic execution simulation
 * - Web Audio API synthesized CNC industrial acoustic feedback (key click, cycle start chime, alarm buzzer, estop click)
 * - Shift production metrics, part counters, and OEE runtime tracking
 */

// ============================================================================
// DEFAULT MACHINE & OPERATOR STATE
// ============================================================================

export const DEFAULT_MACHINE_DRO = {
  wcs: 'G54',
  coordinateMode: 'WCS', // 'WCS' | 'MCS'
  wcsOffsets: {
    G54: { x: 120.000, y: 85.000, z: -150.000, a: 0.000 },
    G55: { x: 220.000, y: 85.000, z: -150.000, a: 0.000 },
    G56: { x: 320.000, y: 85.000, z: -150.000, a: 0.000 }
  },
  // Work Coordinates relative to selected WCS
  work: {
    x: 0.000,
    y: 0.000,
    z: 25.000,
    a: 0.000
  },
  // Machine Coordinate System (Absolute Encoders)
  machine: {
    x: 120.000,
    y: 85.000,
    z: -125.000,
    a: 0.000
  },
  // Soft limits in machine coordinates
  softLimits: {
    xMin: -500.0, xMax: 500.0,
    yMin: -350.0, yMax: 350.0,
    zMin: -400.0, zMax: 50.0,
    aMin: -120.0, aMax: 120.0
  }
};

export const DEFAULT_CYCLE_STATE = {
  mode: 'IDLE', // 'IDLE' | 'RUNNING' | 'FEED_HOLD' | 'ALARM' | 'ESTOP'
  feedOverridePct: 100, // 10% - 150%
  spindleOverridePct: 100, // 50% - 150%
  spindleState: 'OFF', // 'CW' | 'CCW' | 'OFF'
  commandedRpm: 12000,
  actualRpm: 12000,
  coolant: 'OFF', // 'FLOOD' | 'MIST' | 'AIR' | 'OFF'
  activeToolId: 'T01',
  activeToolName: 'Ø10.0mm Flat Carbide Endmill (4F)',
  activeToolDiameter: 10.0,
  activeToolWearPct: 14.5, // 0 - 100%
  activeToolLifeRemainingMin: 72
};

export const DEFAULT_PRODUCTION_METRICS = {
  partsCompleted: 18,
  partsTarget: 50,
  cycleTimeSec: 462, // 7m 42s
  elapsedCurrentPartSec: 184,
  shiftInCutSec: 8316,
  shiftIdleSec: 1840,
  estimatedCompletionTime: '18:45'
};

// ============================================================================
// WEB AUDIO API INDUSTRIAL SOUND SYNTHESIS
// ============================================================================

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Synthesizes industrial tactile feedback without external MP3 dependencies.
 * @param {'click' | 'start' | 'hold' | 'alarm' | 'estop' | 'zero'} soundType 
 */
export function playCncAudioFeedback(soundType) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (soundType === 'click') {
      // Crisp tactile mechanical pendant key click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.035);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      osc.start(now);
      osc.stop(now + 0.035);
    } else if (soundType === 'start') {
      // Industrial CNC Cycle Start confirmation chord
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (soundType === 'hold') {
      // Feed Hold caution tone
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (soundType === 'alarm' || soundType === 'estop') {
      // E-Stop / Machine Alarm sharp siren
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.linearRampToValueAtTime(440, now + 0.25);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (soundType === 'zero') {
      // Axis zeroing confirmation double pip
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1200, now + 0.06);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.start(now);
      osc.stop(now + 0.14);
    }
  } catch (e) {
    // Audio context may be restricted by autoplay policy
    console.debug('CNC audio feedback skipped:', e);
  }
}

// ============================================================================
// DIRECTIONAL JOG MOTION CALCULATIONS
// ============================================================================

/**
 * Calculates new DRO positions after a jog command.
 * Enforces soft limits in machine coordinates.
 * 
 * @param {Object} currentDro - Current machine DRO state
 * @param {'x' | 'y' | 'z' | 'a'} axis - Axis to jog
 * @param {1 | -1} direction - Positive or negative
 * @param {number} step - Step size in mm or deg (0 for continuous step simulation)
 * @returns {Object} Updated DRO state and limit warning if triggered
 */
export function computeJogMove(currentDro, axis, direction, step) {
  const stepAmount = step === 0 ? 5.0 : step; // Continuous default pulse: 5mm
  const delta = direction * stepAmount;

  const newWork = { ...currentDro.work };
  const newMachine = { ...currentDro.machine };

  const targetWork = newWork[axis] + delta;
  const targetMachine = newMachine[axis] + delta;

  // Soft limit validation
  const minKey = `${axis}Min`;
  const maxKey = `${axis}Max`;
  const minLimit = currentDro.softLimits[minKey];
  const maxLimit = currentDro.softLimits[maxKey];

  let limitHit = false;
  let clampedMachine = targetMachine;

  if (targetMachine < minLimit) {
    clampedMachine = minLimit;
    limitHit = true;
  } else if (targetMachine > maxLimit) {
    clampedMachine = maxLimit;
    limitHit = true;
  }

  const effectiveDelta = clampedMachine - newMachine[axis];
  newWork[axis] = parseFloat((newWork[axis] + effectiveDelta).toFixed(4));
  newMachine[axis] = parseFloat(clampedMachine.toFixed(4));

  return {
    dro: {
      ...currentDro,
      work: newWork,
      machine: newMachine
    },
    limitHit,
    gcodeEquivalent: `G91 G00 ${axis.toUpperCase()}${delta > 0 ? '+' : ''}${delta.toFixed(3)} G90`
  };
}

/**
 * Zeroes an individual axis in the current WCS coordinate system.
 * 
 * @param {Object} currentDro - Current machine DRO state
 * @param {'x' | 'y' | 'z' | 'a'} axis - Axis to zero
 * @returns {Object} Updated DRO
 */
export function zeroWorkAxis(currentDro, axis) {
  const currentWcs = currentDro.wcs;
  const oldOffset = currentDro.wcsOffsets[currentWcs] || { x: 0, y: 0, z: 0, a: 0 };
  
  // New WCS offset = current machine position
  const newOffsets = {
    ...currentDro.wcsOffsets,
    [currentWcs]: {
      ...oldOffset,
      [axis]: currentDro.machine[axis]
    }
  };

  const newWork = {
    ...currentDro.work,
    [axis]: 0.000
  };

  return {
    ...currentDro,
    wcsOffsets: newOffsets,
    work: newWork
  };
}

/**
 * Halves the current work coordinate (Center Finder / Edge Finder feature).
 * Used when probing opposite edges to find the workpiece center.
 */
export function halfWorkAxis(currentDro, axis) {
  const halfVal = parseFloat((currentDro.work[axis] / 2.0).toFixed(4));
  const newWork = {
    ...currentDro.work,
    [axis]: halfVal
  };
  return {
    ...currentDro,
    work: newWork
  };
}

// ============================================================================
// MDI (MANUAL DATA INPUT) COMMAND INTERPRETER
// ============================================================================

/**
 * Simulates MDI execution of standard CNC G-code and M-codes.
 * 
 * Supported:
 * - G00 / G01 X Y Z
 * - G28 (Home return)
 * - M03 / M04 S[RPM] (Spindle CW/CCW)
 * - M05 (Spindle Stop)
 * - M08 / M09 (Coolant On/Off)
 * - M06 T[ToolNum] (Tool Change)
 * - G54 / G55 / G56 (WCS Select)
 * 
 * @param {string} rawCommand - Input block
 * @param {Object} currentDro - Machine DRO
 * @param {Object} cycleState - Machine cycle state
 * @returns {Object} Resulting state and response message
 */
export function executeMdiCommand(rawCommand, currentDro, cycleState) {
  const cmd = rawCommand.trim().toUpperCase();
  if (!cmd) return { success: false, message: 'Empty MDI block' };

  let updatedDro = { ...currentDro };
  let updatedCycle = { ...cycleState };
  let responseMsg = `Executed: ${cmd}`;

  // Spindle Speed S[number]
  const sMatch = cmd.match(/S(\d+)/);
  if (sMatch) {
    const rpm = parseInt(sMatch[1], 10);
    updatedCycle.commandedRpm = rpm;
    updatedCycle.actualRpm = Math.round(rpm * (updatedCycle.spindleOverridePct / 100));
  }

  // Spindle CW (M03 / M3)
  if (cmd.includes('M03') || cmd.includes('M3')) {
    updatedCycle.spindleState = 'CW';
    responseMsg = `Spindle CW @ ${updatedCycle.actualRpm} RPM`;
  }

  // Spindle CCW (M04 / M4)
  if (cmd.includes('M04') || cmd.includes('M4')) {
    updatedCycle.spindleState = 'CCW';
    responseMsg = `Spindle CCW @ ${updatedCycle.actualRpm} RPM`;
  }

  // Spindle Stop (M05 / M5)
  if (cmd.includes('M05') || cmd.includes('M5')) {
    updatedCycle.spindleState = 'OFF';
    responseMsg = 'Spindle Stopped (M05)';
  }

  // Coolant ON (M08 / M8)
  if (cmd.includes('M08') || cmd.includes('M8')) {
    updatedCycle.coolant = 'FLOOD';
    responseMsg = 'Flood Coolant ON (M08)';
  }

  // Coolant OFF (M09 / M9)
  if (cmd.includes('M09') || cmd.includes('M9')) {
    updatedCycle.coolant = 'OFF';
    responseMsg = 'Coolant OFF (M09)';
  }

  // Tool Change M06 T[num]
  const tMatch = cmd.match(/T0?(\d+)/);
  if (tMatch) {
    const tNum = parseInt(tMatch[1], 10);
    updatedCycle.activeToolId = `T${String(tNum).padStart(2, '0')}`;
    responseMsg = `Tool Change ATC -> Tool ${updatedCycle.activeToolId}`;
  }

  // WCS Change G54 - G56
  const wcsMatch = cmd.match(/G5([4-9])/);
  if (wcsMatch) {
    const newWcs = `G5${wcsMatch[1]}`;
    if (updatedDro.wcsOffsets[newWcs]) {
      updatedDro.wcs = newWcs;
      responseMsg = `Active WCS set to ${newWcs}`;
    }
  }

  // Home Return G28
  if (cmd.includes('G28')) {
    if (cmd.includes('Z')) {
      updatedDro.machine.z = updatedDro.softLimits.zMax;
      updatedDro.work.z = 150.0;
      responseMsg = 'Z-Axis Homed to Machine Zero';
    } else {
      updatedDro.machine = { x: 0, y: 0, z: updatedDro.softLimits.zMax, a: 0 };
      updatedDro.work = { x: 0, y: 0, z: 150.0, a: 0 };
      responseMsg = 'All Axes Homed (G28)';
    }
  }

  // Coordinate Move: G00 / G01
  const xM = cmd.match(/X([+-]?\d*\.?\d+)/);
  const yM = cmd.match(/Y([+-]?\d*\.?\d+)/);
  const zM = cmd.match(/Z([+-]?\d*\.?\d+)/);

  if (xM) updatedDro.work.x = parseFloat(parseFloat(xM[1]).toFixed(4));
  if (yM) updatedDro.work.y = parseFloat(parseFloat(yM[1]).toFixed(4));
  if (zM) updatedDro.work.z = parseFloat(parseFloat(zM[1]).toFixed(4));

  return {
    success: true,
    message: responseMsg,
    dro: updatedDro,
    cycleState: updatedCycle
  };
}

// ============================================================================
// SAMPLE G-CODE PROGRAM EXECUTION STREAM FOR KIOSK
// ============================================================================

export const SAMPLE_RUNNING_GCODE = [
  { line: 'N10 G90 G21 G17 G94 G54 G40 G80 G49', comment: 'Safe Start Block' },
  { line: 'N20 G00 Z25.000', comment: 'Retract to Safe Clearance' },
  { line: 'N30 T01 M06 (Flat Endmill D10mm)', comment: 'Auto Tool Change' },
  { line: 'N40 S12000 M03', comment: 'Spindle CW 12000 RPM' },
  { line: 'N50 M08', comment: 'Flood Coolant ON' },
  { line: 'N60 G00 X15.000 Y10.000', comment: 'Rapid to Pocket Entry' },
  { line: 'N70 G01 Z-5.000 F600', comment: 'Helical Ramp Plunge' },
  { line: 'N80 G01 X85.000 F2200', comment: 'Rough Pass Wall 1' },
  { line: 'N90 G01 Y65.000', comment: 'Rough Pass Wall 2' },
  { line: 'N100 G01 X15.000', comment: 'Rough Pass Wall 3' },
  { line: 'N110 G01 Y10.000', comment: 'Rough Pass Wall 4' },
  { line: 'N120 G01 Z-10.000 F600', comment: 'Stepdown Depth Layer 2' },
  { line: 'N130 G01 X85.000 F2200', comment: 'Pocket Bottom Facing' },
  { line: 'N140 G02 X75.000 Y20.000 R10.000', comment: 'Corner Relief Arc' },
  { line: 'N150 G00 Z25.000 M09', comment: 'Retract & Coolant Stop' },
  { line: 'N160 M05', comment: 'Spindle Stop' },
  { line: 'N170 G28 G91 Z0.0', comment: 'Return to Z Home' },
  { line: 'N180 M30', comment: 'Program End & Reset' }
];
