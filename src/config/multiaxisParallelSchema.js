/**
 * 5-Axis Parallel Surface Finishing Configuration Schema & Calculations
 * Mastercam-Authentic Multiaxis Machining Strategy Architecture
 */

export const MULTIAXIS_PARALLEL_PAGES = {
  tool_holder: 'Tool & Holder',
  cut_pattern: 'Cut Pattern & Machining Angle',
  tool_axis_control: 'Tool Axis Control (Lead / Lag & Tilt)',
  collision_control: 'Collision & Clearance Control',
  linking_transitions: 'Linking & 3D Blend Transitions',
  roughing_multicuts: 'Roughing & Multi-Depth Slices',
  arc_filter: 'Arc Filter & 5X Tolerance',
  machine_kinematics: 'Machine Kinematics & Post Dialect',
  clearance_planes: 'Clearance & Safe Planes (WCS)',
  feed_optimization: 'Feed Optimization & Chip Thinning'
};

export const MULTIAXIS_PARALLEL_MATERIALS = {
  ALU_6061: {
    id: 'alu_6061',
    name: 'Aluminum 6061-T6 Aerospace',
    vc: 420, // m/min
    fz: 0.12, // mm/tooth
    kc: 750, // N/mm2 specific cutting force
    recommendedLeadDeg: 12.0,
    recommendedTiltDeg: 0.0
  },
  STEEL_P20: {
    id: 'steel_p20',
    name: 'Tool Steel P20 Mold Grade (32 HRC)',
    vc: 180,
    fz: 0.08,
    kc: 1900,
    recommendedLeadDeg: 10.0,
    recommendedTiltDeg: 5.0
  },
  TITANIUM_5X: {
    id: 'titanium_5x',
    name: 'Titanium Ti-6Al-4V Grade 5',
    vc: 65,
    fz: 0.05,
    kc: 2800,
    recommendedLeadDeg: 15.0,
    recommendedTiltDeg: 8.0
  },
  INCONEL_718: {
    id: 'inconel_718',
    name: 'Inconel 718 Superalloy',
    vc: 40,
    fz: 0.04,
    kc: 3400,
    recommendedLeadDeg: 15.0,
    recommendedTiltDeg: 10.0
  },
  STAINLESS_316L: {
    id: 'stainless_316l',
    name: 'Stainless Steel 316L Medical',
    vc: 130,
    fz: 0.06,
    kc: 2200,
    recommendedLeadDeg: 12.0,
    recommendedTiltDeg: 5.0
  }
};

export const MULTIAXIS_PARALLEL_PRESETS = {
  MOLD_CAVITY_FINISH: {
    id: 'mold_cavity_finish',
    name: 'Precision Mold Cavity (Mirror Finish)',
    machiningAngleDeg: 45.0,
    stepoverMm: 0.35,
    leadAngleDeg: 12.0,
    tiltAngleDeg: 0.0,
    cuttingMethod: 'zigzag',
    cutDirection: 'climb',
    toleranceMm: 0.005,
    materialId: 'steel_p20',
    blendRadiusMm: 3.0
  },
  IMPELLER_HUB_GASPATH: {
    id: 'impeller_hub_gaspath',
    name: 'Aerospace Impeller Hub / Gas Path',
    machiningAngleDeg: 0.0,
    stepoverMm: 0.5,
    leadAngleDeg: 15.0,
    tiltAngleDeg: 8.0,
    cuttingMethod: 'oneway',
    cutDirection: 'climb',
    toleranceMm: 0.008,
    materialId: 'titanium_5x',
    blendRadiusMm: 5.0
  },
  BLISK_AIRFOIL_FINISH: {
    id: 'blisk_airfoil_finish',
    name: 'Turbomachinery Blisk Blade Transition',
    machiningAngleDeg: 90.0,
    stepoverMm: 0.25,
    leadAngleDeg: 12.0,
    tiltAngleDeg: 6.0,
    cuttingMethod: 'zigzag',
    cutDirection: 'climb',
    toleranceMm: 0.004,
    materialId: 'inconel_718',
    blendRadiusMm: 2.5
  },
  MEDICAL_IMPLANT: {
    id: 'medical_implant',
    name: 'Medical Knee / Hip Articulation Joint',
    machiningAngleDeg: 30.0,
    stepoverMm: 0.2,
    leadAngleDeg: 14.0,
    tiltAngleDeg: 0.0,
    cuttingMethod: 'zigzag',
    cutDirection: 'climb',
    toleranceMm: 0.003,
    materialId: 'stainless_316l',
    blendRadiusMm: 2.0
  }
};

export const MULTIAXIS_PARALLEL_KINEMATICS = {
  TABLE_TABLE_AC: {
    id: 'table_table_ac',
    name: 'Table-Table AC Trunnion (Fanuc Robodrill / Haas TRT / DMG MORI)',
    tiltAxis: 'A',
    rotaryAxis: 'C',
    limits: { aMin: -30, aMax: 110, cMin: -360, cMax: 360 }
  },
  TABLE_TABLE_BC: {
    id: 'table_table_bc',
    name: 'Table-Table BC Swivel Trunnion (Hermle / Mikron / Grob)',
    tiltAxis: 'B',
    rotaryAxis: 'C',
    limits: { bMin: -45, bMax: 115, cMin: -360, cMax: 360 }
  },
  HEAD_TABLE_BC: {
    id: 'head_table_bc',
    name: 'Head-Table BC Swivel Spindle (DMG DMU / Mazak Variaxis)',
    tiltAxis: 'B',
    rotaryAxis: 'C',
    limits: { bMin: -120, bMax: 120, cMin: -360, cMax: 360 }
  },
  HEAD_HEAD_AB: {
    id: 'head_head_ab',
    name: 'Head-Head AB Gantry / Fork Head (Aero Gantry 5X)',
    tiltAxis: 'A',
    rotaryAxis: 'B',
    limits: { aMin: -110, aMax: 110, bMin: -110, bMax: 110 }
  }
};

export const MULTIAXIS_PARALLEL_TCPM_DIALECTS = {
  FANUC: {
    id: 'fanuc',
    name: 'Fanuc 30i / 31i / 0i-MF (G43.4 Type II TCPM + G05.1 Q1 AICC II)',
    tcpmOn: 'G43.4 H# M08 (5-AXIS TCPM ACTIVATION)',
    tcpmOff: 'G49 (CANCEL 5-AXIS TCPM)',
    hsmOn: 'G05.1 Q1 (HIGH SPEED AICC II LOOK-AHEAD ACCEL/DECEL)',
    hsmOff: 'G05.1 Q0'
  },
  HAAS: {
    id: 'haas',
    name: 'Haas NGC NextGen (G234 Tool Center Point Control TCPC)',
    tcpmOn: 'G234 H# M08 (HAAS 5-AXIS TCPC ACTIVATION)',
    tcpmOff: 'G49',
    hsmOn: 'G187 P2 (HAAS HIGH SPEED MACHINING - MEDIUM)',
    hsmOff: 'G187 P1'
  },
  SIEMENS: {
    id: 'siemens',
    name: 'Siemens Sinumerik 840D / ONE (TRAORI Dynamic Transformation)',
    tcpmOn: 'TRAORI ; SIEMENS 5-AXIS TCP ACTIVATION',
    tcpmOff: 'TRAFOOF ; TRAORI OFF',
    hsmOn: 'CYCLE832(0.015, 1, 1) ; HIGH SPEED LOOK-AHEAD',
    hsmOff: 'CYCLE832(0)'
  },
  HEIDENHAIN: {
    id: 'heidenhain',
    name: 'Heidenhain TNC 640 / TNC7 (FUNCTION TCPM F CONT AXIS SPAT)',
    tcpmOn: 'FUNCTION TCPM F CONT AXIS SPAT',
    tcpmOff: 'FUNCTION RESET TCPM',
    hsmOn: 'CYCL DEF 32.0 TOLERANCE\nCYCL DEF 32.1 T0.015',
    hsmOff: ''
  }
};

/**
 * Intelligent Tool Auto-Resolver for 5-Axis Parallel Finishing
 * Prefers Ball Nose endmills, followed by Bullnose / Corner Radius, then Flat
 */
export function resolveDefaultParallelTool(tools = []) {
  if (!Array.isArray(tools) || tools.length === 0) {
    return {
      id: 'default_ball_8',
      number: 1,
      name: '8mm 2-Flute Ball Nose Endmill',
      type: 'ball',
      diameter: 8,
      flutes: 2,
      cornerRadius: 4.0,
      fluteLength: 20,
      overhang: 35
    };
  }

  // 1. Search for dedicated Ball Nose endmill
  const ballTool = tools.find((t) => {
    const name = (t.name || '').toLowerCase();
    const type = (t.type || '').toLowerCase();
    return type === 'ball' || type === 'ballnose' || name.includes('ball');
  });
  if (ballTool) return ballTool;

  // 2. Search for Bullnose / Corner Radius endmill
  const bullTool = tools.find((t) => {
    const name = (t.name || '').toLowerCase();
    const type = (t.type || '').toLowerCase();
    return type === 'bull' || type === 'bullnose' || name.includes('bull') || Number(t.cornerRadius) > 0;
  });
  if (bullTool) return bullTool;

  // 3. Fallback to smallest suitable endmill
  return tools[0];
}

/**
 * Calculates 5-Axis Surface Finishing Physics & Scallop Geometry
 */
export function calculateParallelPhysics({
  material = MULTIAXIS_PARALLEL_MATERIALS.ALU_6061,
  tool = {},
  stepover = 0.5,
  feedRate = 2200,
  rpm = 12000,
  leadAngleDeg = 12.0,
  tiltAngleDeg = 0.0,
  passesCount = 20
}) {
  const dia = Math.max(1, Number(tool?.diameter) || 8);
  const radius = dia / 2;
  const flutes = Math.max(1, Number(tool?.flutes) || 2);
  const kc = material.kc || 750;

  // Compound 5-axis tilt angle off vertical
  const compoundAngleDeg = Math.hypot(leadAngleDeg, tiltAngleDeg);
  const compoundAngleRad = (compoundAngleDeg * Math.PI) / 180;

  // Effective cutter diameter at contact point:
  // For ballnose: D_eff = D * sin(compoundAngle)
  const dEff = Math.max(0.5, dia * Math.sin(Math.max(0.08, compoundAngleRad)));

  // Effective cutting surface speed (m/min)
  const effVc = (Math.PI * dEff * rpm) / 1000;

  // Theoretical Scallop Height (cusp height in mm & microns)
  // Formula: h = R - sqrt(R^2 - (s/2)^2)
  const halfStep = Math.min(radius * 0.95, stepover / 2);
  const scallopMm = radius - Math.sqrt(Math.max(0, radius * radius - halfStep * halfStep));
  const scallopMicrons = Math.max(0.1, scallopMm * 1000);

  // Surface Roughness estimate Ra ≈ h / 4 (microns)
  const estimatedRa = scallopMicrons / 4.0;

  // Material Removal Rate for fine finishing (cm3/min)
  // MRR = (stepover * depthOfCut * Feed) / 1000, assuming finishing depth of cut ap ≈ stepover * 0.6
  const ap = Math.max(0.05, stepover * 0.5);
  const mrr = (stepover * ap * feedRate) / 1000;

  // Tangential cutting force (N)
  const chipLoad = feedRate / (rpm * flutes);
  const fc = kc * ap * chipLoad;
  const powerKw = (fc * effVc) / 60000;

  // Surface Finish Quality Rating
  let finishRating = 'EXCELLENT';
  if (scallopMicrons < 1.0) finishRating = 'MIRROR (Ra < 0.25 µm)';
  else if (scallopMicrons < 3.0) finishRating = 'FINE FINISH (Ra < 0.8 µm)';
  else if (scallopMicrons < 8.0) finishRating = 'GOOD (Ra < 2.0 µm)';
  else finishRating = 'ROUGH (Scallop > 8 µm)';

  return {
    effDiameterMm: Number(dEff.toFixed(2)),
    effVcMMin: Number(effVc.toFixed(1)),
    scallopMm: Number(scallopMm.toFixed(4)),
    scallopMicrons: Number(scallopMicrons.toFixed(2)),
    estimatedRaMicrons: Number(estimatedRa.toFixed(2)),
    finishRating,
    mrr: Number(mrr.toFixed(2)),
    fc: Number(fc.toFixed(1)),
    spindlePowerKw: Number(powerKw.toFixed(2))
  };
}

/**
 * 1-Click "Recommended Values" Auto-Calculator
 * Calculates optimal Spindle RPM, Feed Rate, Lead Angle, and Stepover
 */
export function calculateRecommendedParallelSettings({
  materialId = 'alu_6061',
  tool = {},
  tools = []
}) {
  const activeTool = tool?.diameter ? tool : resolveDefaultParallelTool(tools);
  const mat = MULTIAXIS_PARALLEL_MATERIALS[materialId?.toUpperCase()] || MULTIAXIS_PARALLEL_MATERIALS.ALU_6061;
  const dia = Math.max(1, Number(activeTool?.diameter) || 8);
  const flutes = Math.max(1, Number(activeTool?.flutes) || 2);

  // Compute RPM based on surface speed Vc
  const targetRpm = Math.min(24000, Math.max(1500, Math.round((mat.vc * 1000) / (Math.PI * dia))));
  // Compute Feed based on target chip load
  const targetFeed = Math.min(10000, Math.max(250, Math.round(targetRpm * flutes * mat.fz)));

  // Target scallop height around 1.5 - 2.5 microns for aerospace/mold finish
  // s = 2 * sqrt(2 * R * h - h^2)
  const targetH = 0.002; // 2 microns
  const targetStepover = Number(Math.min(dia * 0.15, Math.max(0.15, 2 * Math.sqrt(dia * targetH))).toFixed(2));

  return {
    spindleRpm: targetRpm,
    feedRate: targetFeed,
    plungeFeed: Math.round(targetFeed * 0.35),
    retractFeed: 5000,
    leadAngleDeg: mat.recommendedLeadDeg,
    tiltAngleDeg: mat.recommendedTiltDeg,
    machiningAngleDeg: 45.0,
    stepoverMm: targetStepover,
    cuttingMethod: 'zigzag',
    cutDirection: 'climb',
    toleranceMm: 0.005,
    blendRadiusMm: 3.0,
    machineKinematics: 'table_table_ac',
    controllerDialect: 'fanuc'
  };
}

export const DEFAULT_PARALLEL_CONFIG = {
  name: '5-Axis Parallel (Surface Finishing)',
  machiningAngleDeg: 45.0,
  stepoverMm: 0.35,
  cuttingMethod: 'zigzag',
  cutDirection: 'climb',
  leadAngleDeg: 12.0,
  tiltAngleDeg: 0.0,
  orientationMode: 'lead_tilt',
  toleranceMm: 0.005,
  maxAngularStepDeg: 2.0,
  rapidHeightMm: 45.0,
  retractHeightMm: 8.0,
  feedPlaneMm: 2.0,
  blendRadiusMm: 3.0,
  enableMultiDepth: false,
  multiCutsCount: 1,
  stockToLeaveMm: 0.0,
  spindleRpm: 12000,
  feedRate: 2400,
  plungeFeed: 600,
  retractFeed: 5000,
  materialId: 'alu_6061',
  machineKinematics: 'table_table_ac',
  controllerDialect: 'fanuc'
};
