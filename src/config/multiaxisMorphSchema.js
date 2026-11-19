/**
 * Mastercam-Authentic 5-Axis Multiaxis Morph (Morph Between 2 Curves / Surfaces) Configuration & Physics Schema
 *
 * Implements comprehensive taxonomy, physics calculations, kinematics parameters,
 * and intelligent defaults matching Mastercam Multiaxis / ModuleWorks 5-Axis specifications.
 */

export function resolveDefaultMultiaxisTool(tools = []) {
  if (!Array.isArray(tools) || tools.length === 0) return null;
  // 1. Prefer Ball Nose or Lollipop or Bullnose Endmill <= 16mm
  const best5X = tools.find(
    (t) => (t.type === 'ball' || t.type === 'ballnose' || t.type === 'lollipop' || t.type === 'barrel') && Number(t.diameter) <= 16
  );
  if (best5X) return best5X;

  // 2. Any Bullnose or Flat endmill <= 12mm
  const bullOrSmall = tools.find(
    (t) => (t.type === 'bull' || t.type === 'bullnose' || t.type === 'flat') && Number(t.diameter) <= 12
  );
  if (bullOrSmall) return bullOrSmall;

  // 3. Fallback to first available cutter
  return tools[0];
}

export const MULTIAXIS_MORPH_PAGE_TITLES = {
  toolpath_type: 'Toolpath Type',
  cut_pattern: 'Cut Pattern (Morph Guides)',
  tool: 'Tool Selection & 5X Dynamics',
  holder: 'Holder Definition & Clearance',
  tool_axis_control: 'Tool Axis Control (Lead / Tilt)',
  collision_control: 'Collision Control & Gouge Check',
  linking_parameters: 'Linking & Lead-In/Out Transitions',
  machine_kinematics: 'Machine Kinematics & Post Dialect',
  arc_filter: 'Arc Filter & 5X Tolerance',
  planes_coolant: 'Planes (WCS) & Coolant Management'
};

export const MULTIAXIS_MORPH_MATERIALS = {
  ALU_6061: {
    id: 'alu_6061',
    name: 'Aluminum 6061-T6 Aerospace',
    category: 'Non-Ferrous Alloy',
    hardness: '95 HB',
    kc: 750, // Specific cutting force N/mm2
    recommendedPasses: 25,
    recommendedStepoverMm: 1.5,
    recommendedLeadDeg: 10.0,
    recommendedTiltDeg: 15.0,
    vc: 450, // m/min
    fzNominal: 0.08, // mm/tooth
    desc: 'High-speed 5-axis morph profiling for impellers, brackets, and aero structures.'
  },
  TITANIUM_5X: {
    id: 'titanium_5x',
    name: 'Ti-6Al-4V Grade 5 Titanium',
    category: 'Titanium Superalloy',
    hardness: '36 HRC',
    kc: 2800,
    recommendedPasses: 35,
    recommendedStepoverMm: 0.8,
    recommendedLeadDeg: 8.0,
    recommendedTiltDeg: 12.0,
    vc: 65,
    fzNominal: 0.04,
    desc: 'Turbine blisk and aerospace critical structural milling with vibration dampening.'
  },
  INCONEL_718: {
    id: 'inconel_718',
    name: 'Inconel 718 Nickel Superalloy',
    category: 'Heat Resistant Superalloy',
    hardness: '44 HRC',
    kc: 3200,
    recommendedPasses: 40,
    recommendedStepoverMm: 0.6,
    recommendedLeadDeg: 6.0,
    recommendedTiltDeg: 10.0,
    vc: 45,
    fzNominal: 0.035,
    desc: 'High-temperature turbine blade aerofoils and exhaust manifold port contours.'
  },
  STEEL_P20: {
    id: 'steel_p20',
    name: 'P20 Mold & Die Tool Steel',
    category: 'Pre-hardened Tool Steel',
    hardness: '32 HRC',
    kc: 2200,
    recommendedPasses: 30,
    recommendedStepoverMm: 1.0,
    recommendedLeadDeg: 8.0,
    recommendedTiltDeg: 14.0,
    vc: 180,
    fzNominal: 0.06,
    desc: 'Injection mold cores, deep cavities, and complex parting line morph finishing.'
  },
  STAINLESS_316L: {
    id: 'stainless_316l',
    name: '316L Marine Stainless Steel',
    category: 'Austenitic Stainless',
    hardness: '180 HB',
    kc: 2100,
    recommendedPasses: 28,
    recommendedStepoverMm: 1.0,
    recommendedLeadDeg: 8.0,
    recommendedTiltDeg: 12.0,
    vc: 140,
    fzNominal: 0.05,
    desc: 'Medical implants, marine hardware, and corrosion-resistant impellers.'
  },
  TOOL_STEEL_D2: {
    id: 'tool_steel_d2',
    name: 'D2 Cold Work Tool Steel (Hardened)',
    category: 'High Alloy Tool Steel',
    hardness: '58 HRC',
    kc: 2600,
    recommendedPasses: 35,
    recommendedStepoverMm: 0.5,
    recommendedLeadDeg: 6.0,
    recommendedTiltDeg: 10.0,
    vc: 90,
    fzNominal: 0.035,
    desc: 'Hard milling of stamping dies, forming punches, and wear components.'
  }
};

export const MULTIAXIS_MORPH_PRESETS = [
  {
    id: 'alu_5x_aerospace',
    name: 'Alu 6061 Aerospace Bracket Morph',
    materialKey: 'ALU_6061',
    toolType: 'ball',
    toolDiameter: 10,
    spindleSpeed: 15000,
    feedRate: 3600,
    plungeRate: 800,
    passes: 25,
    stepoverMm: 1.5,
    cuttingMethod: 'zigzag', // 'zigzag', 'oneway', 'spiral'
    leadAngleDeg: 10.0,
    tiltAngleDeg: 15.0,
    kinematicsId: 'table_table_ac',
    tcpmMode: 'fanuc',
    desc: 'Aggressive 5-axis simultaneous morph finishing across aerospace pocket fillets and blended faces.'
  },
  {
    id: 'titanium_blisk',
    name: 'Ti-6Al-4V Turbine Blisk Morph',
    materialKey: 'TITANIUM_5X',
    toolType: 'ball',
    toolDiameter: 8,
    spindleSpeed: 3200,
    feedRate: 850,
    plungeRate: 250,
    passes: 35,
    stepoverMm: 0.8,
    cuttingMethod: 'oneway',
    leadAngleDeg: 8.0,
    tiltAngleDeg: 12.0,
    kinematicsId: 'table_table_ac',
    tcpmMode: 'fanuc',
    desc: 'Rigid 5-axis morphing between hub curve and shroud curve with positive forward rake contact.'
  },
  {
    id: 'inconel_mold',
    name: 'Inconel 718 Aerofoil Surface Morph',
    materialKey: 'INCONEL_718',
    toolType: 'ball',
    toolDiameter: 6,
    spindleSpeed: 2400,
    feedRate: 550,
    plungeRate: 150,
    passes: 40,
    stepoverMm: 0.6,
    cuttingMethod: 'zigzag',
    leadAngleDeg: 6.0,
    tiltAngleDeg: 10.0,
    kinematicsId: 'head_table_bc',
    tcpmMode: 'siemens',
    desc: 'Ultra-smooth surface blending with tight chordal deviation and constant chip load.'
  },
  {
    id: 'steel_die_morph',
    name: 'P20 Mold Cavity Constant Scallop Morph',
    materialKey: 'STEEL_P20',
    toolType: 'ball',
    toolDiameter: 10,
    spindleSpeed: 6000,
    feedRate: 1800,
    plungeRate: 400,
    passes: 30,
    stepoverMm: 1.0,
    cuttingMethod: 'zigzag',
    leadAngleDeg: 8.0,
    tiltAngleDeg: 14.0,
    kinematicsId: 'table_table_ac',
    tcpmMode: 'fanuc',
    desc: 'High-accuracy mold cavity finishing blending parting line curves across steep draft walls.'
  }
];

export const MULTIAXIS_KINEMATICS_OPTIONS = [
  {
    id: 'table_table_ac',
    name: 'Table-Table AC Trunnion (Haas UMC-750, DMU 50, Fanuc Robodrill 5X)',
    primaryAxis: 'A (Tilts along X: -120° to +30°)',
    secondaryAxis: 'C (Rotates around Z: -360° to +360°)',
    description: 'Workpiece cradle tilts on A and spins on C; rigid and standard for small-to-medium parts.'
  },
  {
    id: 'table_table_bc',
    name: 'Table-Table BC Trunnion (Haas TRT210, Hermle C22)',
    primaryAxis: 'B (Tilts along Y: -110° to +110°)',
    secondaryAxis: 'C (Rotates around Z: -360° to +360°)',
    description: 'Rotary table tilts around Y-axis (B) while spinning on C.'
  },
  {
    id: 'head_table_bc',
    name: 'Head-Table BC Swivel (Mazak Integrex, Hermle C42, DMG NTX)',
    primaryAxis: 'B (Milling head tilts around Y: -110° to +110°)',
    secondaryAxis: 'C (Workpiece rotates around Z: continuous)',
    description: 'Spindle head articulates while table rotates; ideal for mill-turn and heavy dies.'
  },
  {
    id: 'head_head_ab',
    name: 'Head-Head AB Articulated Fork (5-Axis Aerospace Gantry Mill)',
    primaryAxis: 'A (Fork tilts around X: -105° to +105°)',
    secondaryAxis: 'B (Head tilts around Y: -105° to +105°)',
    description: 'Stationary workpiece bed with dual-articulated spindle fork overhead.'
  }
];

export const MULTIAXIS_TCPM_OPTIONS = [
  {
    id: 'fanuc',
    name: 'Fanuc 30i / 31i (G43.4 High-Speed RTCP)',
    code: 'G43.4 H{T} ; TCPM ACTIVATION',
    cancel: 'G49 ; CANCEL TCPM',
    blockFormat: 'G01 X{X} Y{Y} Z{Z} A{A} C{C} F{F}'
  },
  {
    id: 'haas',
    name: 'Haas NGC (G234 Tool Center Point Control - TCPC)',
    code: 'G234 H{T} ; HAAS TCPC ON',
    cancel: 'G49 ; HAAS TCPC OFF',
    blockFormat: 'G01 X{X} Y{Y} Z{Z} B{B} C{C} F{F}'
  },
  {
    id: 'siemens',
    name: 'Siemens Sinumerik 840D / ONE (TRAORI)',
    code: 'TRAORI(1) ; 5-AXIS ORIENTATION TRANSFORMATION',
    cancel: 'TRAFOOF ; CANCEL TRAORI',
    blockFormat: 'G01 X{X} Y{Y} Z{Z} B={B} C={C} F{F}'
  },
  {
    id: 'heidenhain',
    name: 'Heidenhain TNC 640 (FUNCTION TCPM)',
    code: 'FUNCTION TCPM F CONT AXIS SPAT ; SPATIAL TCPM',
    cancel: 'FUNCTION RESET TCPM',
    blockFormat: 'L X{X} Y{Y} Z{Z} B{B} C{C} F{F}'
  }
];

/**
 * Calculates 5-Axis Multiaxis Machining Dynamics & Cutting Physics
 */
export function calculateMultiaxisMorphPhysics(tool = {}, cutParams = {}, materialKey = 'ALU_6061') {
  const mat = MULTIAXIS_MORPH_MATERIALS[materialKey] || MULTIAXIS_MORPH_MATERIALS.ALU_6061;
  const d = Math.max(1.0, Number(tool.diameter || 10.0));
  const z = Math.max(1, Number(tool.flutes || 4));
  const rpm = Math.max(100, Number(tool.spindleSpeed || 10000));
  const feed = Math.max(10, Number(tool.feedRate || 2500));

  const leadAngleDeg = Number(cutParams.leadAngleDeg ?? 10.0);
  const tiltAngleDeg = Number(cutParams.tiltAngleDeg ?? 15.0);
  const totalTiltRad = ((Math.abs(leadAngleDeg) + Math.abs(tiltAngleDeg)) * Math.PI) / 180;

  // Ball nose effective contact diameter:
  // When cutter tilts away from pole (Z=0 velocity), contact point shifts up flute radius
  const isBallnose = tool.type === 'ball' || tool.type === 'ballnose' || tool.type === 'lollipop';
  const effectiveDiameter = isBallnose
    ? Math.max(d * 0.25, d * Math.sin(Math.min(Math.PI / 2, totalTiltRad + 0.15)))
    : d;

  // Cutting Speed Vc (m/min) at effective contact diameter
  const vc = (Math.PI * effectiveDiameter * rpm) / 1000;

  // Feed per tooth fz (mm/tooth)
  const fz = feed / (rpm * z);

  // Stepover ae (mm) and Depth of cut ap (mm)
  const ae = Math.max(0.1, Number(cutParams.stepoverMm || 1.0));
  const ap = Math.max(0.05, Number(cutParams.depthOfCutMm || 0.5));

  // Average chip thickness hm (mm)
  const engagementRatio = Math.min(1.0, ae / d);
  const hm = fz * Math.sqrt(engagementRatio);

  // Material Removal Rate MRR (cm3/min)
  const mrr = (ap * ae * feed) / 1000;

  // Specific cutting force kc adjusted for chip thinning
  const kcEffective = mat.kc * Math.pow(Math.max(0.01, hm) / 0.1, -0.22);

  // Tangential cutting force Fc (N)
  const fc = kcEffective * ap * hm;

  // Cutting power Pc (kW) (80% spindle efficiency)
  const powerKw = (fc * vc) / (60000 * 0.80);

  // Spindle Torque (Nm)
  const torqueNm = (9550 * powerKw) / Math.max(10, rpm);

  return {
    effectiveDiameterMm: Number(effectiveDiameter.toFixed(2)),
    surfaceSpeedMpm: Math.round(vc),
    feedPerToothMm: Number(fz.toFixed(4)),
    averageChipThicknessMm: Number(hm.toFixed(4)),
    mrrCm3Min: Number(mrr.toFixed(2)),
    cuttingForceN: Math.round(fc),
    powerKw: Number(powerKw.toFixed(2)),
    torqueNm: Number(torqueNm.toFixed(2)),
    materialName: mat.name,
    kcBase: mat.kc
  };
}

/**
 * Creates default form state for Mastercam 5-Axis Multiaxis Morph
 */
export function createDefaultMultiaxisMorphState(context = {}) {
  const { bounds, tools = [], activeMachine } = context;
  const defaultTool = resolveDefaultMultiaxisTool(tools) || {
    id: 3,
    number: 3,
    name: '10mm Ball Nose Endmill (5X Finisher)',
    type: 'ball',
    diameter: 10,
    flutes: 4,
    spindleSpeed: 12000,
    feedRate: 3000,
    plungeRate: 600
  };

  const preset = MULTIAXIS_MORPH_PRESETS[0];

  return {
    // ID hygiene: null so App assigns clean sequential integer
    id: null,
    name: '5-Axis Morph Between 2 Curves',
    strategyKey: 'multiaxis_morph',
    badgeClass: 'multi_morph',
    opType: 'multiaxis',
    selectedPresetKey: preset.id,
    selectedMaterialKey: preset.materialKey,

    // 1. Toolpath Type
    toolpathType: {
      strategy: 'morph_between_2_curves', // 'morph_between_2_curves', 'morph_between_2_surfaces', 'parallel_to_curve'
      patternType: 'curves', // 'curves' or 'surfaces'
      subProgram: false
    },

    // 2. Cut Pattern (Morph Guides)
    cutPattern: {
      driveSurfaceSelection: 'all_drive_surfaces', // 'all_drive_surfaces', 'selected_faces', 'cad_body'
      firstCurveName: 'Guide Curve 1 (Start Boundary)',
      secondCurveName: 'Guide Curve 2 (End Boundary)',
      firstCurveFlipped: false,
      secondCurveFlipped: false,
      stepoverCalculation: 'number_of_cuts', // 'number_of_cuts', 'distance', 'scallop'
      numberOfCuts: preset.passes || 25,
      stepoverDistanceMm: preset.stepoverMm || 1.5,
      scallopHeightMm: 0.005,
      cuttingMethod: 'zigzag', // 'zigzag', 'oneway', 'spiral'
      cutDirection: 'climb', // 'climb' or 'conventional'
      cutOrder: 'curve1_to_curve2', // 'curve1_to_curve2', 'curve2_to_curve1', 'center_out'
      exactStepoverAtBothEnds: true
    },

    // 3. Tool Selection & Speeds/Feeds
    tool: {
      id: defaultTool.id || 3,
      number: defaultTool.number || 3,
      name: defaultTool.name || '10mm Ball Nose',
      type: defaultTool.type || 'ball',
      diameter: Number(defaultTool.diameter || 10),
      cornerRadius: defaultTool.cornerRadius || 5.0,
      flutes: defaultTool.flutes || 4,
      length: defaultTool.length || 75.0,
      fluteLength: defaultTool.fluteLength || 30.0,
      spindleSpeed: preset.spindleSpeed || 12000,
      feedRate: preset.feedRate || 3000,
      plungeRate: preset.plungeRate || 600,
      retractRate: 5000,
      rapidRetract: true,
      coolant: 'flood'
    },

    // 4. Holder Definition
    holder: {
      type: 'CAT40_ER32',
      description: 'CAT40 ER32 High-Speed Precision Balanced Chuck (70mm Gauge)',
      gaugeLength: 70.0,
      overhang: 38.0,
      collarDiameter: 42.0,
      shankClearanceMargin: 1.5,
      holderClearanceMargin: 3.0
    },

    // 5. Tool Axis Control (Lead & Tilt)
    toolAxisControl: {
      toolAxisMode: 'lead_tilt_normal', // 'lead_tilt_normal', 'fixed_angle', 'to_point', 'from_point', 'to_line', 'from_line', 'rotary_4axis'
      leadAngleDeg: preset.leadAngleDeg ?? 10.0, // Forward tilt in feed direction
      tiltAngleDeg: preset.tiltAngleDeg ?? 15.0, // Sideways lean across cutting path
      minTiltAngleDeg: -45.0,
      maxTiltAngleDeg: 45.0,
      tiltAxisLimitsActive: true,
      maxLeadDeg: 30.0,
      minLeadDeg: 0.0,
      smoothVectors: true,
      smoothingDistanceMm: 5.0
    },

    // 6. Collision Control / Gouge Checking
    collisionControl: {
      gougeCheckEnabled: true,
      checkSurfacesActive: true,
      strategy: 'tilt_away', // 'tilt_away', 'retract_along_axis', 'stop_toolpath', 'trim_passes'
      tiltDirection: 'lead_and_tilt',
      shankClearanceMm: 1.5,
      holderClearanceMm: 3.0,
      avoidanceDistanceMm: 1.0
    },

    // 7. Linking Parameters & Lead-In/Out
    linkingParameters: {
      clearanceAreaType: 'cylinder', // 'cylinder', 'plane', 'sphere'
      clearancePlaneZ: 50.0,
      clearanceCylinderRadius: 60.0,
      clearanceCylinderAxis: 'Z',
      retractDistanceMm: 8.0,
      feedPlaneMm: 3.0,
      leadInType: 'tangent_arc', // 'tangent_arc', 'blend_spline', 'direct'
      leadInRadiusMm: 5.0,
      leadInSweepDeg: 90.0,
      leadOutType: 'tangent_arc',
      leadOutRadiusMm: 5.0,
      leadOutSweepDeg: 90.0,
      transitionBetweenPasses: 'blend_spline' // 'blend_spline', 'direct_step', 'retract'
    },

    // 8. Machine Kinematics & Post
    machineKinematics: {
      kinematicsId: preset.kinematicsId || 'table_table_ac',
      tcpmMode: preset.tcpmMode || 'fanuc',
      maxRotaryVelocityDegSec: 150.0,
      singularityPoleThresholdDeg: 1.5, // Alert when tilt < 1.5 deg
      autoSingularitySmoothing: true,
      rotaryUnwindEnabled: true
    },

    // 9. Arc Filter & Tolerance
    arcFilter: {
      totalToleranceMm: 0.015,
      cutToleranceMm: 0.010,
      vectorSmoothingToleranceDeg: 0.5,
      highSpeedSmoothing: true,
      filterArcsIn5X: false
    },

    // 10. Planes (WCS) & Coolant
    planesCoolant: {
      wcs: 'Top (G54)',
      toolPlane: 'Top (G17)',
      compPlane: 'Top (G17)',
      coolantFlood: true,
      coolantMist: false,
      coolantThruSpindle: true,
      airBlast: false,
      operatorMessage: '5-AXIS SIMULTANEOUS MORPH FINISHING PASS'
    }
  };
}
