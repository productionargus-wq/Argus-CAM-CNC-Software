/**
 * Mastercam 2018 Surface Finish & Define Tool Schema, Machine-Aware Capabilities,
 * Coupled Feeds/Speeds Math, Presets, and Defaults Persistence.
 *
 * Pure ES module (safe in both Vite browser runtime and Node unit tests).
 */

import { MACHINING_MATERIALS, calculateMachiningParameters } from '../utils/machiningPhysics.js';

export const DEFAULT_OPERATION_DEFAULTS_STORAGE_KEY = 'argus_cam_surface_finish_defaults_v1';

/**
 * Resolves dynamic UI capabilities and CNC limits from the active machine definition.
 * Every control that depends on kinematics (3X vs 4X vs 5X vs Lathe/Mill-Turn),
 * spindle limits, coolant plumbing, or controller dialect is driven from here.
 */
export function resolveMachineToolpathCapabilities(activeMachine = null) {
  const m = activeMachine || {};
  const category = m.category || 'mill';
  const axesCount = Math.max(2, Number(m.axesCount) || 3);
  const bMin = Number(m.bMin) || 0;
  const bMax = Number(m.bMax) || 0;
  const hasTiltAxis = bMin < 0 || bMax > 0 || axesCount >= 5;
  const hasRotaryAxis =
    axesCount >= 4 || Boolean(m.cRotaryContinuous) || hasTiltAxis || category === 'mill_turn';
  const is5Axis = axesCount >= 5;
  const is4Axis = axesCount === 4;
  const is3Axis = axesCount === 3;
  const isLathe = category === 'lathe';
  const isMillTurn = category === 'mill_turn';

  const maxRpm = Math.max(1000, Number(m.maxRpm) || 12000);
  const maxFeed = Math.max(500, Number(m.maxFeed) || 24000);
  const safeZ = Number.isFinite(Number(m.safeZ)) ? Number(m.safeZ) : 50;
  const spindleTaper = m.spindleTaper || (isLathe ? 'VDI-40 Turret' : 'CAT 40');
  const controller = m.controller || 'Fanuc 31i (Mill 3X)';
  const controllerDialect = m.controllerDialect || controller;

  const toolManagerSuffix =
    category === 'lathe'
      ? 'Lathe_mm'
      : category === 'mill_turn'
        ? 'MillTurn_mm'
        : category === 'router'
          ? 'Router_mm'
          : 'Mill_mm';

  const supportedAxisCombos = is5Axis
    ? [
        'Table / Head (5-Axis Continuous)',
        'Trunnion A/B + C Table (Simultaneous 5X)',
        '3+2 Positional Indexed (G68.2)',
        'Vertical 3-Axis Locked (Z-Normal)'
      ]
    : isMillTurn
      ? [
          'Upper B-Axis Milling + C1 Main Spindle',
          'Lower Turret Fixed X-Z Turning',
          'Y-Axis Live Milling + C1 Indexed'
        ]
      : is4Axis
        ? [
            'Rotary A-Axis on X (Horizontal Indexing)',
            'Rotary B-Axis Tombstone (4-Axis HMC)',
            '3-Axis Vertical Locked'
          ]
        : ['3-Axis Vertical X-Y-Z (Fixed Spindle)'];

  const supportedCoolantModes = [
    { id: 'Flood', label: 'Flood', supported: true },
    { id: 'Mist', label: 'Mist', supported: true },
    {
      id: 'Through Tool',
      label: 'Through tool (TSC)',
      supported: Boolean(m.coolantTSC)
    },
    { id: 'Air Blast', label: 'Air blast', supported: true },
    { id: 'Minimum Quantity', label: 'MQL (Min qty)', supported: is5Axis || isMillTurn }
  ];

  const rotaryModes = is5Axis
    ? ['None (3-Axis / TCP)', '3+2 Tilted Plane (G68.2)', '4-Axis Rotary Substitute', '5-Axis Simultaneous']
    : is4Axis || isMillTurn
      ? ['None', 'Axis Substitution (Cylinder)', '4-Axis Indexing (A/B)']
      : ['None (3-Axis Only)'];

  const multiAxisOptions = is5Axis
    ? ['Vertical (3-Axis Fixed)', 'Lead/Lag Tilt (5-Axis)', 'Swarf / Normal to Drive', '3+2 Indexed Plane']
    : is4Axis || isMillTurn
      ? ['Vertical / Normal to Cplane', 'Indexed 4th Axis (A/B)']
      : ['Vertical (Z-Axis Only)'];

  return {
    machineId: m.id || 'mill_3x_default',
    machineName: m.name || 'MILL 3 - AXIS VMC MM',
    shortType: m.shortType || m.type || `${axesCount}-Axis CNC`,
    category,
    axesCount,
    is3Axis,
    is4Axis,
    is5Axis,
    isLathe,
    isMillTurn,
    hasRotaryAxis,
    hasAxisCombos: axesCount >= 4 || isMillTurn,
    hasTiltedPlanes: axesCount >= 4 || Boolean(m.tcpEnabled) || isMillTurn,
    hasHeadSelection: is5Axis || isMillTurn,
    supportsAngledHead: axesCount >= 4 || isMillTurn,
    supportsThroughCoolant: Boolean(m.coolantTSC),
    tcpEnabled: Boolean(m.tcpEnabled),
    bMin,
    bMax,
    maxRpm,
    maxFeed,
    safeZ,
    spindleTaper,
    atcCapacity: Number(m.atcCapacity) || 24,
    powerKw: Number(m.powerKw) || 14.9,
    torqueNm: Number(m.torqueNm) || 75.0,
    controller,
    controllerDialect,
    toolManagerSuffix,
    axisLabelBadge: `${axesCount}-Axis (${controller})`,
    supportedAxisCombos,
    supportedCoolantModes,
    rotaryModes,
    multiAxisOptions
  };
}

/**
 * Computes cutting speed CS (m/min) from diameter (mm) and spindle RPM.
 */
export function computeSurfaceSpeedCs(diameterMm, rpm) {
  const d = Math.max(0.01, Number(diameterMm) || 10);
  const s = Math.max(0, Number(rpm) || 0);
  return Number(((Math.PI * d * s) / 1000).toFixed(4));
}

/**
 * Computes spindle RPM from cutting speed CS (m/min) and diameter (mm),
 * optionally clamped to machine maximum RPM.
 */
export function computeRpmFromCs(diameterMm, csMMin, maxRpm = null) {
  const d = Math.max(0.01, Number(diameterMm) || 10);
  const cs = Math.max(0, Number(csMMin) || 0);
  const rawRpm = Math.round((cs * 1000) / (Math.PI * d));
  if (maxRpm && Number(maxRpm) > 0) {
    return Math.min(Number(maxRpm), Math.max(0, rawRpm));
  }
  return Math.max(0, rawRpm);
}

/**
 * Computes feed per tooth FPT (mm/tooth) from feed rate (mm/min), RPM, and flute count.
 */
export function computeFeedPerTooth(feedRateMmMin, rpm, flutes = 4) {
  const f = Math.max(0, Number(feedRateMmMin) || 0);
  const s = Math.max(1, Number(rpm) || 1);
  const z = Math.max(1, Number(flutes) || 1);
  return Number((f / (s * z)).toFixed(4));
}

/**
 * Computes table feed rate (mm/min) from FPT, RPM, and flute count,
 * optionally clamped to machine maximum feed rate.
 */
export function computeFeedFromFpt(fptMm, rpm, flutes = 4, maxFeed = null) {
  const fpt = Math.max(0, Number(fptMm) || 0);
  const s = Math.max(0, Number(rpm) || 0);
  const z = Math.max(1, Number(flutes) || 1);
  const rawFeed = Number((fpt * s * z).toFixed(1));
  if (maxFeed && Number(maxFeed) > 0) {
    return Math.min(Number(maxFeed), Math.max(0, rawFeed));
  }
  return Math.max(0, rawFeed);
}

/**
 * Re-initializes feeds & speeds using Kienzle machining physics and active machine limits.
 */
export function reinitializeFeedsSpeeds({
  tool = {},
  activeMachine = null,
  materialKey = 'ALUMINUM_6061_T6',
  axialDepthAp = 0.5,
  radialDepthAe = null
}) {
  const caps = resolveMachineToolpathCapabilities(activeMachine);
  const diameter = Math.max(0.5, Number(tool.diameter ?? tool.toolDiameter) || 10);
  const flutes = Math.max(1, Number(tool.flutes ?? tool.numberOfFlutes) || 4);
  const toolType = (tool.type || tool.toolType || 'flat').toLowerCase();
  const ae = radialDepthAe != null ? Number(radialDepthAe) : Math.max(0.2, diameter * 0.2);

  const calc = calculateMachiningParameters({
    materialKey: MACHINING_MATERIALS[materialKey] ? materialKey : 'ALUMINUM_6061_T6',
    toolDiameter: diameter,
    flutes,
    toolType: toolType.includes('ball') ? 'ball' : 'flat',
    axialDepthAp: Math.max(0.1, Number(axialDepthAp) || 0.5),
    radialDepthAe: ae,
    machineMaxRpm: caps.maxRpm,
    machineMaxPowerKw: caps.powerKw,
    machineMaxTorqueNm: caps.torqueNm
  });

  const spindleSpeed = Math.min(caps.maxRpm, calc.spindleRpm);
  const feedRate = Math.min(caps.maxFeed, Number(calc.feedRate.toFixed(1)));
  const plungeRate = Math.min(caps.maxFeed, Number((feedRate * 0.35).toFixed(1)));
  const retractRate = Math.min(caps.maxFeed, Number((feedRate * 0.65).toFixed(1)));
  const cs = computeSurfaceSpeedCs(diameter, spindleSpeed);
  const fpt = computeFeedPerTooth(feedRate, spindleSpeed, flutes);

  return {
    spindleSpeed,
    feedRate,
    plungeRate,
    retractRate,
    cs,
    fpt,
    physics: calc
  };
}

/**
 * Cut-parameter presets searched via "Search for cut parameters..." in the Toolpath parameters tab.
 */
export const CUT_PARAMETER_PRESETS = [
  {
    id: 'finish_aluminum_hsl',
    label: 'High-Speed Aluminum Surface Finishing (ISO N)',
    materialKey: 'ALUMINUM_6061_T6',
    totalTolerance: 0.015,
    maxStepdown: 0.25,
    cornerRoundingRadius: 1.5,
    transitionType: 'high_speed',
    loopLength: 2.0,
    rampLength: 8.0,
    direction: 'climb',
    openContourDirection: 'zigzag',
    coolantMode: 'Flood',
    vcFactor: 1.0,
    fzFactor: 1.0
  },
  {
    id: 'finish_steel_mold',
    label: 'Mold & Die P20 Steel Waterline Finish (ISO P)',
    materialKey: 'STEEL_1045',
    totalTolerance: 0.02,
    maxStepdown: 0.4,
    cornerRoundingRadius: 2.0,
    transitionType: 'broken',
    loopLength: 2.0,
    rampLength: 10.0,
    direction: 'climb',
    openContourDirection: 'one_way',
    coolantMode: 'Flood',
    vcFactor: 0.9,
    fzFactor: 0.9
  },
  {
    id: 'finish_stainless_steady',
    label: '316L Stainless Anti-Work-Harden Climb Finish (ISO M)',
    materialKey: 'STAINLESS_316L',
    totalTolerance: 0.025,
    maxStepdown: 0.35,
    cornerRoundingRadius: 2.5,
    transitionType: 'ramp',
    loopLength: 2.5,
    rampLength: 12.0,
    direction: 'climb',
    openContourDirection: 'one_way',
    coolantMode: 'Flood',
    vcFactor: 0.85,
    fzFactor: 1.0
  },
  {
    id: 'finish_titanium_5x',
    label: 'Ti-6Al-4V Aerospace Surface Contour (ISO S / TSC)',
    materialKey: 'TITANIUM_6AL4V',
    totalTolerance: 0.01,
    maxStepdown: 0.2,
    cornerRoundingRadius: 3.0,
    transitionType: 'follow_surface',
    loopLength: 2.0,
    rampLength: 10.0,
    direction: 'climb',
    openContourDirection: 'one_way',
    coolantMode: 'Through Tool',
    vcFactor: 0.85,
    fzFactor: 0.95
  },
  {
    id: 'semi_finish_standard',
    label: 'Standard General Surface Contour (0.025mm / 0.5mm stepdown)',
    materialKey: 'ALUMINUM_6061_T6',
    totalTolerance: 0.025,
    maxStepdown: 0.5,
    cornerRoundingRadius: 2.0,
    transitionType: 'broken',
    loopLength: 2.0,
    rampLength: 10.0,
    direction: 'climb',
    openContourDirection: 'one_way',
    coolantMode: 'Flood',
    vcFactor: 0.75,
    fzFactor: 0.85
  }
];

/**
 * Applies a named cut-parameter preset to toolpath + feeds/speeds respecting active machine limits.
 */
export function buildPresetApplication({ presetId, tool = {}, activeMachine = null }) {
  const preset = CUT_PARAMETER_PRESETS.find((p) => p.id === presetId) || CUT_PARAMETER_PRESETS[0];
  const caps = resolveMachineToolpathCapabilities(activeMachine);
  const reinit = reinitializeFeedsSpeeds({
    tool,
    activeMachine,
    materialKey: preset.materialKey,
    axialDepthAp: preset.maxStepdown
  });

  const preferredCoolant =
    preset.coolantMode === 'Through Tool' && !caps.supportsThroughCoolant
      ? 'Flood'
      : preset.coolantMode;

  return {
    preset,
    feedsSpeeds: {
      feedRate: Math.min(caps.maxFeed, Number((reinit.feedRate * preset.fzFactor).toFixed(1))),
      spindleSpeed: Math.min(caps.maxRpm, Math.round(reinit.spindleSpeed * preset.vcFactor)),
      plungeRate: reinit.plungeRate,
      retractRate: reinit.retractRate,
      coolantMode: preferredCoolant
    },
    contourPatch: {
      totalTolerance: preset.totalTolerance,
      maxStepdown: preset.maxStepdown,
      cornerRoundingRadius: preset.cornerRoundingRadius,
      transitionType: preset.transitionType,
      loopLength: preset.loopLength,
      rampLength: preset.rampLength,
      direction: preset.direction,
      openContourDirection: preset.openContourDirection
    }
  };
}

/**
 * Generates baseline Surface Finish operation state anchored to the active machine & optional stock top.
 */
export function createDefaultSurfaceFinishState({
  activeMachine = null,
  stockConfig = null,
  strategyMode = 'contour',
  tool = null
} = {}) {
  const caps = resolveMachineToolpathCapabilities(activeMachine);
  const diameter = Number(tool?.diameter) || 10.0;
  const cornerRadius = Number(tool?.cornerRadius ?? (tool?.type === 'ball' ? diameter / 2 : tool?.type === 'flat' ? 0 : 4.0));
  const flutes = Math.max(1, Number(tool?.flutes) || 4);
  const defaultRpm = Math.min(caps.maxRpm, Number(tool?.spindleSpeed) || 3500);
  const defaultFeed = Math.min(caps.maxFeed, Number(tool?.feedRate) || 250.0);
  const topOfStockZ = stockConfig?.originZ != null && stockConfig?.height != null
    ? Number(stockConfig.originZ) + Number(stockConfig.height)
    : Number(stockConfig?.topZ ?? 0.0);

  return {
    strategyMode,
    toolParams: {
      toolName: tool?.name || '10. BULL ENDMILL 4. RAD',
      toolNumber: tool?.toolNumber || 1,
      headNumber: caps.hasHeadSelection ? 1 : -1,
      lengthOffset: tool?.lengthOffset || tool?.toolNumber || 1,
      diameterOffset: tool?.diameterOffset || tool?.toolNumber || 1,
      toolDiameter: diameter,
      cornerRadius,
      flutes,
      spindleDirection: 'CW',
      feedRate: defaultFeed,
      fpt: computeFeedPerTooth(defaultFeed, defaultRpm, flutes),
      plungeRate: Math.min(caps.maxFeed, Number(tool?.plungeRate) || 150.0),
      retractRate: Math.min(caps.maxFeed, Number(tool?.retractRate) || 250.0),
      spindleSpeed: defaultRpm,
      cs: computeSurfaceSpeedCs(diameter, defaultRpm),
      forceToolChange: false,
      rapidRetract: true,
      coolantMode: 'Flood',
      coolantThroughTool: false,
      coolantMist: false,
      coolantAir: false,
      comment: ''
    },
    machineParams: {
      toBatch: false,
      axisCombo: caps.supportedAxisCombos[0],
      homePosEnabled: false,
      homePos: { x: 0, y: 0, z: caps.safeZ },
      rotaryAxisEnabled: caps.hasRotaryAxis && caps.is4Axis,
      rotaryAxisMode: caps.rotaryModes[0],
      rotaryDiameter: 100.0,
      wcsPlane: 'Top',
      tplane: 'Top',
      cplane: 'Top',
      toolDisplayEnabled: true,
      toolDisplayMode: 'Wireframe + Holder',
      refPointEnabled: false,
      refPointApproach: { x: 0, y: 0, z: caps.safeZ },
      refPointRetract: { x: 0, y: 0, z: caps.safeZ },
      cannedTextBefore: '',
      cannedTextAfter: '',
      miscReals: Array(10).fill(0),
      miscIntegers: Array(10).fill(0)
    },
    surfaceParams: {
      clearanceEnabled: false,
      clearance: caps.safeZ,
      clearanceMode: 'abs',
      useClearanceStartEndOnly: true,
      retractEnabled: true,
      retract: 25.0,
      retractMode: 'inc',
      feedPlane: 5.0,
      feedPlaneMode: 'inc',
      topOfStockEnabled: false,
      topOfStock: topOfStockZ,
      topOfStockMode: 'abs',
      directionEnabled: false,
      cutDirectionMode: 'Normal',
      tipComp: 'tip',
      stockToLeaveDrive: 0.0,
      stockToLeaveCheck: 0.0,
      containmentMode: 'center',
      additionalOffsetEnabled: false,
      additionalOffset: 0.0
    },
    contourParams: {
      totalTolerance: 0.025,
      filterToleranceRatio: 0.5,
      oneWayArcFilter: false,
      maxStepdown: 0.5,
      detectUndercuts: false,
      cornerRoundingRadius: 2.0,
      entryExitArcEnabled: false,
      arcRadius: 5.0,
      arcSweep: 90.0,
      lineLength: 0.0,
      allowOutsideBoundary: true,
      useApproxStartPoint: false,
      approxStartPoint: { x: 0, y: 0, z: 0 },
      optimizeCutOrder: false,
      minimizeBurial: false,
      orderBottomToTop: false,
      direction: 'climb',
      startLength: 0.0,
      openContourDirection: 'one_way',
      transitionType: 'broken',
      loopLength: 2.0,
      rampLength: 10.0,
      helixEnabled: false,
      helixRadius: 3.0,
      helixAngle: 3.0,
      shallowEnabled: false,
      shallowFromSlope: 0.0,
      shallowToSlope: 10.0,
      flatsEnabled: false,
      flatsExtendToStock: true,
      spiralEnabled: false,
      spiralLimit: 0.0,
      cutDepthsMode: 'Incremental',
      minDepth: -9999,
      maxDepth: 9999,
      gapSettingsMode: 'Follow surfaces',
      maxGapDistance: 10.0,
      advancedToolAxis: caps.multiAxisOptions[0],
      advancedCollisionCheck: true
    },
    pocketParams: {
      totalTolerance: 0.025,
      maxStepdown: 1.0,
      stepover: Number((diameter * 0.5).toFixed(2)),
      cuttingMethod: 'Zigzag',
      machiningDirection: 'climb',
      roughEntryHelix: true,
      finishOuterBoundary: true,
      finishFloorPasses: 1,
      minStepover: 0.5
    }
  };
}

/**
 * Safely saves Surface Finish parameter defaults to localStorage (or custom storage).
 */
export function saveOperationDefaults(payload, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return false;
  try {
    storage.setItem(DEFAULT_OPERATION_DEFAULTS_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely loads Surface Finish parameter defaults from localStorage (or custom storage).
 */
export function loadOperationDefaults(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(DEFAULT_OPERATION_DEFAULTS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}
