/**
 * Mastercam-Authentic 5-Axis Swarf Milling (Flank Milling) Configuration & Physics Schema
 *
 * Implements comprehensive taxonomy, cutting physics calculations, kinematics parameters,
 * and intelligent defaults matching Mastercam Multiaxis Swarf / ModuleWorks 5-Axis specifications.
 */

export function resolveDefaultSwarfTool(tools = []) {
  if (!Array.isArray(tools) || tools.length === 0) return null;

  // 1. Prefer Bullnose or Flat endmill with flute length >= 15mm and diameter <= 16mm
  const bestSwarf = tools.find(
    (t) =>
      (t.type === 'bull' || t.type === 'bullnose' || t.type === 'flat' || t.type === 'endmill') &&
      Number(t.diameter) <= 16 &&
      (Number(t.fluteLength) || Number(t.cuttingLength) || 20) >= 15
  );
  if (bestSwarf) return bestSwarf;

  // 2. Any Flat or Bullnose endmill
  const anyFlatBull = tools.find(
    (t) => t.type === 'flat' || t.type === 'endmill' || t.type === 'bull' || t.type === 'bullnose'
  );
  if (anyFlatBull) return anyFlatBull;

  // 3. Fallback to any cutter
  return tools[0];
}

export const SWARF_MILLING_PAGES = {
  toolpath_type: 'Toolpath Type',
  cut_pattern: 'Cut Pattern & Rail Guides',
  tool: 'Tool Selection & 5X Dynamics',
  holder: 'Holder Definition & Clearance',
  tool_axis_control: 'Tool Axis Control (Lead / Tilt / Fanning)',
  collision_control: 'Collision Control & Gouge Protection',
  linking_parameters: 'Linking & Lead-In/Out Transitions',
  machine_kinematics: 'Machine Kinematics & Post Dialect',
  arc_filter: 'Arc Filter & 5X Tolerance',
  planes_coolant: 'Planes (WCS) & Coolant Management'
};

export const SWARF_DRIVE_MODES = {
  RAILS: {
    id: 'rails',
    name: 'Upper & Lower Rail Curves',
    desc: 'Ruled wall generated between an Upper guide rail and a Lower guide rail curve.'
  },
  RULED_SURFACES: {
    id: 'ruled_surfaces',
    name: 'Ruled Drive Surfaces',
    desc: 'Direct CAD ruled surfaces with automatically extracted ruling generators.'
  },
  WALL_AND_FLOOR: {
    id: 'wall_and_floor',
    name: 'Wall Contours & Floor Boundary',
    desc: 'Wall faces bounded by floor surface with automatic depth detection.'
  }
};

export const SWARF_SYNC_MODES = {
  ARCLENGTH: {
    id: 'arclength',
    name: 'By Arc Length (Equal Fractional Distance)',
    desc: 'Synchronizes points based on matching percentage of total curve length.'
  },
  PARAMETRIC: {
    id: 'parametric',
    name: 'By Parameter (u ∈ [0, 1])',
    desc: 'Direct evaluation at normalized parametric coordinates along guide curves.'
  },
  SHORTEST_DISTANCE: {
    id: 'shortest_distance',
    name: 'By Shortest Distance (Orthogonal Projection)',
    desc: 'Finds the closest point on upper rail for each lower rail station, minimizing twist.'
  }
};

export const SWARF_MILLING_MATERIALS = {
  ALU_6061: {
    id: 'alu_6061',
    name: 'Aluminum 6061-T6 Aerospace',
    category: 'Non-Ferrous Alloy',
    hardness: '95 HB',
    kc: 750, // Specific cutting force N/mm2
    recommendedPasses: 1,
    recommendedStepoverMm: 0.5,
    recommendedLeadDeg: 0.0,
    recommendedTiltDeg: 0.0,
    vc: 420, // m/min
    fzNominal: 0.08, // mm/tooth
    desc: 'High-speed flank milling for aerospace ribs, brackets, and structural spar walls.'
  },
  TITANIUM_5X: {
    id: 'titanium_5x',
    name: 'Ti-6Al-4V Grade 5 Titanium',
    category: 'Titanium Superalloy',
    hardness: '36 HRC',
    kc: 2800,
    recommendedPasses: 3,
    recommendedStepoverMm: 0.35,
    recommendedLeadDeg: 0.5,
    recommendedTiltDeg: 0.0,
    vc: 60,
    fzNominal: 0.04,
    desc: 'Turbine blisk and jet engine flank machining with controlled deflection.'
  },
  INCONEL_718: {
    id: 'inconel_718',
    name: 'Inconel 718 Nickel Superalloy',
    category: 'Heat Resistant Superalloy',
    hardness: '44 HRC',
    kc: 3200,
    recommendedPasses: 4,
    recommendedStepoverMm: 0.25,
    recommendedLeadDeg: 0.5,
    recommendedTiltDeg: 0.0,
    vc: 40,
    fzNominal: 0.03,
    desc: 'Combustion casing and high-temperature diffuser flank contouring.'
  },
  STEEL_P20: {
    id: 'steel_p20',
    name: 'P20 Mold & Die Tool Steel',
    category: 'Pre-hardened Tool Steel',
    hardness: '32 HRC',
    kc: 2200,
    recommendedPasses: 2,
    recommendedStepoverMm: 0.4,
    recommendedLeadDeg: 0.0,
    recommendedTiltDeg: 0.0,
    vc: 160,
    fzNominal: 0.06,
    desc: 'Deep mold cavity sidewalls, draft angle ribs, and core shut-off surfaces.'
  },
  STAINLESS_316L: {
    id: 'stainless_316l',
    name: '316L Marine Stainless Steel',
    category: 'Austenitic Stainless',
    hardness: '180 HB',
    kc: 2400,
    recommendedPasses: 2,
    recommendedStepoverMm: 0.35,
    recommendedLeadDeg: 0.5,
    recommendedTiltDeg: 0.0,
    vc: 140,
    fzNominal: 0.05,
    desc: 'Pump impeller vanes, medical implants, and valve body flank contours.'
  }
};

export const SWARF_MILLING_PRESETS = {
  AERO_SPAR: {
    id: 'aero_spar',
    name: 'Aerospace Wing Spar Ruled Flange',
    materialId: 'alu_6061',
    driveMode: 'rails',
    syncMode: 'arclength',
    cutDirection: 'climb',
    cuttingMethod: 'one_way',
    axialSlices: 1,
    radialPasses: 2,
    radialStepover: 0.5,
    stockToLeaveWall: 0.0,
    stockToLeaveFloor: 0.2,
    leadAngleDeg: 0.0,
    tiltOffsetDeg: 0.0,
    rollInRadius: 8.0,
    rollInAngleDeg: 60.0
  },
  TURBINE_BLADE: {
    id: 'turbine_blade',
    name: 'Turbine Blade / Impeller Flank Finishing',
    materialId: 'titanium_5x',
    driveMode: 'rails',
    syncMode: 'arclength',
    cutDirection: 'climb',
    cuttingMethod: 'one_way',
    axialSlices: 2,
    radialPasses: 3,
    radialStepover: 0.3,
    stockToLeaveWall: 0.0,
    stockToLeaveFloor: 0.0,
    leadAngleDeg: 0.5,
    tiltOffsetDeg: 0.0,
    rollInRadius: 6.0,
    rollInAngleDeg: 45.0
  },
  DEEP_POCKET_WALL: {
    id: 'deep_pocket_wall',
    name: 'Deep Mold Cavity Draft Wall (Multi-Depth)',
    materialId: 'steel_p20',
    driveMode: 'rails',
    syncMode: 'shortest_distance',
    cutDirection: 'climb',
    cuttingMethod: 'zig_zag',
    axialSlices: 3,
    radialPasses: 1,
    radialStepover: 0.4,
    stockToLeaveWall: 0.0,
    stockToLeaveFloor: 0.1,
    leadAngleDeg: 0.0,
    tiltOffsetDeg: 0.0,
    rollInRadius: 10.0,
    rollInAngleDeg: 90.0
  },
  CHAMFER_CONTOUR: {
    id: 'chamfer_contour',
    name: '5-Axis Variable Angle Chamfer Flank',
    materialId: 'alu_6061',
    driveMode: 'rails',
    syncMode: 'parametric',
    cutDirection: 'climb',
    cuttingMethod: 'one_way',
    axialSlices: 1,
    radialPasses: 1,
    radialStepover: 0.0,
    stockToLeaveWall: 0.0,
    stockToLeaveFloor: 0.0,
    leadAngleDeg: 0.0,
    tiltOffsetDeg: 0.0,
    rollInRadius: 5.0,
    rollInAngleDeg: 45.0
  }
};

export const SWARF_MACHINE_KINEMATICS = {
  TABLE_TABLE_AC: {
    id: 'table_table_ac',
    name: 'Table-Table AC Trunnion (Haas UMC-750, DMU 50, Fanuc Robodrill 5X)',
    primaryAxis: 'A (Tilts around X)',
    secondaryAxis: 'C (Rotates around Z)',
    aLimits: [-120, 30],
    cLimits: [-360, 360],
    defaultController: 'fanuc'
  },
  TABLE_TABLE_BC: {
    id: 'table_table_bc',
    name: 'Table-Table BC Swivel Trunnion (Mazak Variaxis, Hermle C22/C42)',
    primaryAxis: 'B (Tilts around Y)',
    secondaryAxis: 'C (Rotates around Z)',
    bLimits: [-110, 110],
    cLimits: [-360, 360],
    defaultController: 'siemens'
  },
  HEAD_TABLE_BC: {
    id: 'head_table_bc',
    name: 'Head-Table BC Swivel Spindle (Mazak Integrex, DMG Mori NTX)',
    primaryAxis: 'B (Head swivels around Y)',
    secondaryAxis: 'C (Table rotates around Z)',
    bLimits: [-110, 110],
    cLimits: [-360, 360],
    defaultController: 'heidenhain'
  },
  HEAD_HEAD_AB: {
    id: 'head_head_ab',
    name: 'Head-Head AB Articulated Fork (5-Axis Aerospace Gantry Mill)',
    primaryAxis: 'A (Fork tilts around X)',
    secondaryAxis: 'B (Fork rotates around Y)',
    aLimits: [-105, 105],
    bLimits: [-105, 105],
    defaultController: 'siemens'
  }
};

export const SWARF_TCPM_DIALECTS = {
  FANUC: {
    id: 'fanuc',
    name: 'Fanuc 30i / 31i / 0i-MF (G43.4 TCPM + G05.1 Q1 AICC II)',
    tcpmOn: 'G43.4 H{T} M08 (5-AXIS TCPM ACTIVATION)',
    tcpmOff: 'G49 (CANCEL 5-AXIS TCPM)\nG05.1 Q0 (AICC II OFF)',
    blockFormat: 'G01 X{X} Y{Y} Z{Z} A{A} C{C} F{F}'
  },
  HAAS: {
    id: 'haas',
    name: 'Haas NGC / UMC (G234 TCPC + G187 P2 High Speed)',
    tcpmOn: 'G234 H{T} M08 (HAAS 5-AXIS TCPC ACTIVATION)\nG187 P2 (HAAS HIGH SPEED MACHINING - MEDIUM)',
    tcpmOff: 'G49 (CANCEL 5-AXIS TCPC)',
    blockFormat: 'G01 X{X} Y{Y} Z{Z} A{A} C{C} F{F}'
  },
  SIEMENS: {
    id: 'siemens',
    name: 'Siemens 840D / Sinumerik ONE (TRAORI + CYCLE832)',
    tcpmOn: 'TRAORI ; 5-AXIS TRANSFORMATION (TCP)\nCYCLE832(0.015, 1, 1) ; HIGH SPEED TOLERANCE',
    tcpmOff: 'TRAFOOF ; TRAORI OFF',
    blockFormat: 'G01 X{X} Y{Y} Z{Z} B={B} C={C} F{F}'
  },
  HEIDENHAIN: {
    id: 'heidenhain',
    name: 'Heidenhain TNC 640 (FUNCTION TCPM + PLANE SPATIAL)',
    tcpmOn: 'FUNCTION TCPM F CONT AXIS SPAT',
    tcpmOff: 'FUNCTION RESET TCPM',
    blockFormat: 'L X{X} Y{Y} Z{Z} B{B} C{C} F{F}'
  }
};

/**
 * Calculates physical flank cutting dynamics, cantilever deflection, and wall taper error.
 */
export function calculateSwarfPhysics({
  material = SWARF_MILLING_MATERIALS.ALU_6061,
  tool = { diameter: 10, flutes: 4, fluteLength: 25 },
  wallHeight = 20.0,
  stepover = 0.5,
  feedRate = 2500,
  rpm = 10000,
  passes = 1,
  axialSlices = 1,
  toolOverhangMm = 45.0
}) {
  const dia = Math.max(1, Number(tool?.diameter) || 10);
  const flutes = Math.max(1, Number(tool?.flutes) || 4);
  const kc = Number(material?.kc) || 750; // N/mm2

  // Axial depth of cut per slice
  const ap = Math.max(0.5, wallHeight / Math.max(1, axialSlices));
  // Radial depth of cut
  const ae = Math.max(0.05, Number(stepover) || 0.5);

  // Material Removal Rate (cm3/min)
  const mrr = (ap * ae * Math.max(50, feedRate)) / 1000;

  // Feed per tooth (fz)
  const fz = Math.max(0.005, feedRate / (Math.max(500, rpm) * flutes));

  // Tangential cutting force Fc (Kienzle Model for peripheral flank contact)
  const mc = 0.25; // specific cutting force exponent
  const effectiveKc = kc * Math.pow(fz, -mc);
  const fc = (effectiveKc * ap * fz * flutes) / Math.PI;

  // Radial cutting force Fr (deflecting tool away from wall, ~35% of tangential force)
  const fr = Math.max(5, fc * 0.35);

  // Cutting power & spindle torque
  const cuttingSpeedVc = (Math.PI * dia * rpm) / 1000; // m/min
  const spindlePowerKw = (fc * cuttingSpeedVc) / (60 * 1000 * 0.85); // 85% mechanical efficiency
  const torqueNm = (spindlePowerKw * 9550) / Math.max(100, rpm);

  // Solid carbide tool elastic modulus E = 600 GPa = 600,000 N/mm2
  const E_modulus = 600000; // N/mm2
  // Fluted tool effective core diameter = 0.75 * D
  const d_core = 0.75 * dia;
  // Area moment of inertia I = pi * d^4 / 64
  const I_moment = (Math.PI * Math.pow(d_core, 4)) / 64;

  // Cantilever tool deflection at contact center (mm)
  // Delta = (Fr * L^3) / (3 * E * I)
  const L = Math.max(dia * 2, toolOverhangMm);
  const deflectionMm = (fr * Math.pow(L, 3)) / (3 * E_modulus * I_moment);

  // Wall taper error caused by tool deflection gradient (degrees)
  const taperErrorDeg = (Math.atan(deflectionMm / ap) * 180) / Math.PI;

  // Deflection rating & recommendation
  let deflectionRating = 'OPTIMAL';
  let ratingColor = '#10b981'; // green
  let recommendation = 'Cutter deflection is within tight aerospace tolerance (≤ 0.02 mm). Single-pass finish safe.';

  if (deflectionMm > 0.05) {
    deflectionRating = 'EXCESSIVE';
    ratingColor = '#ef4444'; // red
    recommendation =
      'High deflection (> 0.05 mm) causes measurable wall taper. Enable Multi-Pass radial stepover or increase Axial Slices.';
  } else if (deflectionMm > 0.02) {
    deflectionRating = 'CAUTION';
    ratingColor = '#f59e0b'; // amber
    recommendation =
      'Moderate deflection (0.02 - 0.05 mm). Recommended to add a spring pass or reduce radial stock allowance.';
  }

  return {
    mrr: Number(mrr.toFixed(2)),
    ap: Number(ap.toFixed(2)),
    ae: Number(ae.toFixed(3)),
    fz: Number(fz.toFixed(4)),
    cuttingSpeedVc: Number(cuttingSpeedVc.toFixed(1)),
    fc: Number(fc.toFixed(1)),
    fr: Number(fr.toFixed(1)),
    spindlePowerKw: Number(spindlePowerKw.toFixed(2)),
    torqueNm: Number(torqueNm.toFixed(2)),
    deflectionMm: Number(deflectionMm.toFixed(4)),
    deflectionMicrons: Number((deflectionMm * 1000).toFixed(1)),
    taperErrorDeg: Number(taperErrorDeg.toFixed(4)),
    deflectionRating,
    ratingColor,
    recommendation
  };
}

export const DEFAULT_SWARF_CONFIG = {
  // Page 1: Toolpath Type
  strategy: '5axis_swarf',
  presetId: 'aero_spar',
  name: '5-Axis Swarf Milling (Flank Contouring)',

  // Page 2: Cut Pattern & Rail Guides
  driveMode: 'rails', // 'rails', 'ruled_surfaces', 'wall_and_floor'
  syncMode: 'arclength', // 'arclength', 'parametric', 'shortest_distance'
  cutDirection: 'climb', // 'climb', 'conventional'
  cuttingMethod: 'one_way', // 'one_way', 'zig_zag'
  enableAxialSlices: false,
  axialSlices: 1, // Number of depth layers along flank
  enableRadialPasses: true,
  radialPasses: 2, // Number of radial stock passes
  radialStepover: 0.5, // mm
  stockToLeaveWall: 0.0, // mm
  stockToLeaveFloor: 0.0, // mm
  wallHeightMm: 22.0, // mm

  // Page 3: Tool Selection & Dynamics
  toolId: null,
  spindleRpm: 12000,
  feedRate: 2800,
  plungeFeed: 450,
  retractFeed: 5000,

  // Page 4: Holder Definition & Clearance
  holderType: 'hsk_a63',
  toolStickoutMm: 45.0,
  holderClearanceMm: 5.0,
  shankClearanceMm: 1.5,

  // Page 5: Tool Axis Control (Lead / Tilt / Fanning)
  leadAngleDeg: 0.0, // deg forward lean
  tiltOffsetDeg: 0.0, // deg side lean
  maxRotaryAngleStepDeg: 3.0, // deg max rotation per block
  smoothSingularities: true,

  // Page 6: Collision Control & Gouge Protection
  floorClearanceMm: 0.5, // mm lift above floor
  checkConcaveGouge: true,
  collisionRetractMode: 'retract_along_tool_axis', // 'retract_along_tool_axis', 'tilt_away', 'skip_pass'

  // Page 7: Linking Parameters & Lead-In/Out
  clearanceZ: 50.0,
  retractZ: 10.0,
  feedPlaneZ: 2.5,
  rollInRadiusMm: 8.0,
  rollInAngleDeg: 60.0,
  rollOutRadiusMm: 8.0,
  rollOutAngleDeg: 60.0,
  transitionMode: 'direct_ramp', // 'direct_ramp', 'high_speed_loop', 'clearance_retract'

  // Page 8: Machine Kinematics & Post Dialect
  machineKinematics: 'table_table_ac',
  controllerDialect: 'fanuc',
  aAxisMinDeg: -120,
  aAxisMaxDeg: 30,
  cAxisMinDeg: -360,
  cAxisMaxDeg: 360,

  // Page 9: Arc Filter & 5X Tolerance
  linearizationToleranceMm: 0.01,
  vectorInterpolationStepMm: 1.0,
  enableAiccLookahead: true,

  // Page 10: Planes (WCS) & Coolant Management
  wcsPlane: 'top_g17',
  coolantMode: 'flood_m08', // 'flood_m08', 'through_spindle_m88', 'mist_m07', 'air_blast_m09'
  materialId: 'alu_6061'
};
