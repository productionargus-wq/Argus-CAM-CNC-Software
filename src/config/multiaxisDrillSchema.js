/**
 * MASTERCAM 5-AXIS MULTIAXIS DRILLING & HOLE MAKING CONFIGURATION SCHEMA
 * 
 * Defines 10-page Mastercam parameter taxonomy, drilling materials database,
 * drill tip compensation formulas (118° / 140°), thrust force & torque physics,
 * canned cycles (G81, G82, G83, G73, G84, G85), and machine kinematics options.
 */

export const MULTIAXIS_DRILL_PAGE_TITLES = {
  toolpath_type: 'Toolpath Type',
  hole_selection: 'Hole Selection & Geometry',
  tool: 'Tool Selection & Dynamics',
  holder: 'Holder Definition & Clearance',
  cut_parameters: 'Cut Parameters & Canned Cycles',
  depth_tip_comp: 'Depth & Drill Tip Compensation',
  tool_axis_alignment: 'Tool Axis Control & Alignment',
  linking_clearance: 'Linking & Clearance Zones',
  machine_kinematics: 'Machine Kinematics & Post Dialect',
  planes_coolant: 'Planes (WCS) & Coolant Management'
};

export const MULTIAXIS_DRILL_MATERIALS = {
  ALU_6061: {
    id: 'ALU_6061',
    name: 'Aluminum 6061-T6 Aerospace (95 HB)',
    category: 'Aluminum',
    vc: 120, // m/min
    fn: 0.18, // mm/rev (feed per revolution)
    kc: 750, // N/mm2 specific cutting resistance
    thrustFactor: 1.2,
    powerFactor: 0.85,
    recommendedPeckMm: 6.0,
    recommendedPointAngle: 118
  },
  STEEL_4140: {
    id: 'STEEL_4140',
    name: 'Alloy Steel 4140 Pre-Hardened (32 HRC)',
    category: 'Steel',
    vc: 35,
    fn: 0.12,
    kc: 2100,
    thrustFactor: 1.8,
    powerFactor: 1.35,
    recommendedPeckMm: 3.5,
    recommendedPointAngle: 140
  },
  SS_316L: {
    id: 'SS_316L',
    name: 'Stainless Steel 316L Austenitic (217 HB)',
    category: 'Stainless',
    vc: 24,
    fn: 0.08,
    kc: 2400,
    thrustFactor: 2.1,
    powerFactor: 1.45,
    recommendedPeckMm: 2.5,
    recommendedPointAngle: 140
  },
  TI_6AL4V: {
    id: 'TI_6AL4V',
    name: 'Titanium Grade 5 (Ti-6Al-4V) (36 HRC)',
    category: 'Titanium',
    vc: 18,
    fn: 0.06,
    kc: 2800,
    thrustFactor: 2.3,
    powerFactor: 1.6,
    recommendedPeckMm: 2.0,
    recommendedPointAngle: 140
  },
  INCONEL_718: {
    id: 'INCONEL_718',
    name: 'Inconel 718 Nickel Superalloy (42 HRC)',
    category: 'Superalloys',
    vc: 12,
    fn: 0.04,
    kc: 3400,
    thrustFactor: 2.8,
    powerFactor: 1.85,
    recommendedPeckMm: 1.5,
    recommendedPointAngle: 140
  }
};

export const MULTIAXIS_DRILL_CYCLES = [
  { id: 'G81', name: 'G81 - Simple Drill / Spot Drill (No Peck)', desc: 'Direct feed to target depth, rapid retract to clearance plane' },
  { id: 'G82', name: 'G82 - Spot Facing / Counterbore (Dwell at Depth)', desc: 'Direct feed to target depth, precision dwell P seconds, rapid retract' },
  { id: 'G83', name: 'G83 - Deep Hole Peck Drill (Full Retract for Chip Clearing)', desc: 'Pecks Q mm down, fully retracts to R-plane for chip clearance, repeats' },
  { id: 'G73', name: 'G73 - High-Speed Chip Break (Small Retract 0.5-1.0mm)', desc: 'Pecks Q mm, lifts 0.8mm to break chip string without full retraction' },
  { id: 'G84', name: 'G84 - Rigid Tapping Cycle (Synchronized Spindle)', desc: 'Synchronized spindle RPM and pitch feedrate with automatic spindle reversal' },
  { id: 'G85', name: 'G85 - Precision Reaming / Fine Bore (Feed In / Feed Out)', desc: 'Feeds to target depth, feeds back out at programmed rate for mirror finish' }
];

export const MULTIAXIS_DRILL_PRESETS = [
  {
    id: 'aerospace_manifold',
    name: 'Aerospace Manifold (Compound 5X G83)',
    materialKey: 'ALU_6061',
    cycle: 'G83',
    peckMm: 5.0,
    pointAngleDeg: 140,
    alignmentMode: 'twp_3_plus_2',
    desc: '3+2 TWP peck drilling for compound angled hydraulic passages with Fanuc G68.2'
  },
  {
    id: 'deep_hole_cooling',
    name: 'Mold Core Deep Cooling Channels (G83 Peck)',
    materialKey: 'STEEL_4140',
    cycle: 'G83',
    peckMm: 3.0,
    pointAngleDeg: 140,
    alignmentMode: 'twp_3_plus_2',
    desc: 'Deep water cooling line drilling with high chip evacuation retracts'
  },
  {
    id: 'radial_flange_holes',
    name: 'Radial Flange Bolt Pattern (G81 Spot/Drill)',
    materialKey: 'ALU_6061',
    cycle: 'G81',
    peckMm: 0,
    pointAngleDeg: 118,
    alignmentMode: 'tcpm_simultaneous',
    desc: 'High speed radial drilling pattern on cylindrical or conical parts'
  },
  {
    id: 'rigid_tap_compound',
    name: '5-Axis Rigid Tapping (M8 / M10 G84)',
    materialKey: 'STEEL_4140',
    cycle: 'G84',
    peckMm: 0,
    pointAngleDeg: 118,
    alignmentMode: 'twp_3_plus_2',
    desc: 'Synchronized rigid tapping cycle on angled faces with Fanuc G68.2'
  }
];

export const MULTIAXIS_DRILL_KINEMATICS = [
  { id: 'table_table_ac', name: '5-Axis Trunnion Table-Table (A/C)', primary: 'A', secondary: 'C', maxRpm: 50 },
  { id: 'table_table_bc', name: '5-Axis Trunnion Table-Table (B/C)', primary: 'B', secondary: 'C', maxRpm: 50 },
  { id: 'head_table_bc', name: '5-Axis Head-Table Swivel (B Head / C Table)', primary: 'B', secondary: 'C', maxRpm: 60 },
  { id: 'head_head_ab', name: '5-Axis Articulated Head-Head (A/B Spindle)', primary: 'A', secondary: 'B', maxRpm: 90 }
];

export const MULTIAXIS_DRILL_POST_DIALECTS = [
  { id: 'fanuc_twp', name: 'Fanuc 30i / 31i / 0i-MF (G68.2 TWP + G53.1 + G83)', twpCode: 'G68.2', alignCode: 'G53.1', cancelCode: 'G69' },
  { id: 'fanuc_tcpm', name: 'Fanuc 5-Axis Simultaneous TCPM (G43.4 H.. + Canned)', twpCode: 'G43.4', cancelCode: 'G49' },
  { id: 'haas_dwo', name: 'Haas Automation 5-Axis (G254 DWO + G83 + G255)', twpCode: 'G254', cancelCode: 'G255' },
  { id: 'siemens_cycle800', name: 'Siemens Sinumerik 840D (CYCLE800 Swivel + CYCLE83)', twpCode: 'CYCLE800', cancelCode: 'CYCLE800()' },
  { id: 'heidenhain_plane', name: 'Heidenhain TNC 640 (PLANE SPATIAL + CYCL DEF 200)', twpCode: 'PLANE SPATIAL', cancelCode: 'PLANE RESET' }
];

/**
 * Calculates Drill Tip Height (cone length) based on tool diameter and point angle.
 * Standard Jobber: 118° -> L_tip = (D/2) / tan(59°) = 0.300 * D
 * Carbide High-Performance: 140° -> L_tip = (D/2) / tan(70°) = 0.182 * D
 */
export function calculateDrillTipLength(diameterMm = 6.0, pointAngleDeg = 118) {
  const dia = Math.max(0.5, Number(diameterMm) || 6.0);
  const angle = Math.max(60, Math.min(160, Number(pointAngleDeg) || 118));
  const halfAngleRad = ((angle / 2) * Math.PI) / 180;
  const tipLength = (dia / 2) / Math.tan(halfAngleRad);
  return Number(tipLength.toFixed(3));
}

/**
 * Calculates Cutting Physics for 5-Axis Drilling
 */
export function calculateMultiaxisDrillPhysics(tool = {}, cutParams = {}, materialKey = 'ALU_6061') {
  const mat = MULTIAXIS_DRILL_MATERIALS[materialKey] || MULTIAXIS_DRILL_MATERIALS.ALU_6061;
  const dia = Math.max(0.5, Number(tool.diameter || 6.0));
  const rpm = Math.max(100, Number(tool.spindleSpeed || (mat.vc * 1000) / (Math.PI * dia)));
  const fn = Math.max(0.01, Number(cutParams.feedPerRevMm || mat.fn));
  const feedRate = Math.round(rpm * fn);

  // Surface Cutting Speed Vc = (PI * D * RPM) / 1000 [m/min]
  const vc = (Math.PI * dia * rpm) / 1000;

  // Material Removal Rate MRR = (PI * D^2 / 4) * (Feed / 1000) [cm3/min]
  const mrr = ((Math.PI * Math.pow(dia, 2)) / 4) * (feedRate / 1000);

  // Thrust Force Fz = 0.5 * kc * D * fn * thrustFactor [N]
  const thrustN = Math.round(0.5 * mat.kc * dia * fn * mat.thrustFactor);

  // Spindle Torque Mc = (kc * D^2 * fn) / (8000) [Nm]
  const torqueNm = Number(((mat.kc * Math.pow(dia, 2) * fn) / 8000).toFixed(2));

  // Cutting Power Pc = (Mc * 2 * PI * RPM) / 60000 [kW]
  const powerKw = Number(((torqueNm * 2 * Math.PI * rpm) / 60000).toFixed(2));

  // Point Angle Tip Length
  const pointAngle = Number(tool.pointAngleDeg || mat.recommendedPointAngle || 118);
  const tipLengthMm = calculateDrillTipLength(dia, pointAngle);

  return {
    surfaceSpeedMpm: Math.round(vc),
    vcMMin: Math.round(vc),
    feedRateMmMin: feedRate,
    feedPerRevMm: Number(fn.toFixed(4)),
    mrrCm3Min: Number(mrr.toFixed(2)),
    thrustForceN: thrustN,
    spindleTorqueNm: torqueNm,
    torqueNm,
    cuttingPowerKw: powerKw,
    powerKw,
    tipLengthMm,
    materialName: mat.name
  };
}

/**
 * Resolves the default drill tool from inventory or creates a balanced standard drill
 */
export function resolveDefaultDrillTool(tools = []) {
  if (Array.isArray(tools) && tools.length > 0) {
    const drill = tools.find((t) => t.type === 'drill' || t.name?.toLowerCase().includes('drill'));
    if (drill) return drill;
    const smallTool = tools.find((t) => Number(t.diameter) <= 10);
    if (smallTool) return smallTool;
    return tools[0];
  }
  return {
    id: 10,
    number: 10,
    name: '6.0mm Carbide Stub Drill (140° Point)',
    type: 'drill',
    diameter: 6.0,
    flutes: 2,
    pointAngleDeg: 140,
    fluteLength: 35,
    overallLength: 75,
    spindleSpeed: 6366,
    feedRate: 1146
  };
}

/**
 * Creates default initial state for Multiaxis Drill operation
 */
export function createDefaultMultiaxisDrillParams(tools = [], activeMachine = null) {
  const tool = resolveDefaultDrillTool(tools);
  const defaultMatKey = 'ALU_6061';
  const mat = MULTIAXIS_DRILL_MATERIALS[defaultMatKey];

  return {
    strategyKey: 'multiaxis_drill',
    name: '5-Axis Multiaxis Drilling (Auto 3D Hole Feature)',
    selectedPresetKey: 'aerospace_manifold',
    selectedMaterialKey: defaultMatKey,

    tool: {
      id: tool.id || 10,
      number: tool.number || 10,
      name: tool.name || '6.0mm Carbide Drill',
      type: 'drill',
      diameter: Number(tool.diameter) || 6.0,
      flutes: Number(tool.flutes) || 2,
      pointAngleDeg: Number(tool.pointAngleDeg) || 140,
      fluteLength: Number(tool.fluteLength) || 35,
      overallLength: Number(tool.overallLength) || 75,
      spindleSpeed: tool.spindleSpeed || 6366,
      feedRate: tool.feedRate || 1146,
      plungeRate: 1146
    },

    toolpathType: {
      strategy: 'multiaxis_drill', // 'multiaxis_drill', 'multiaxis_circle_mill', 'multiaxis_thread_mill'
      holeSortingMethod: 'shortest_rotary_path', // 'shortest_rotary_path', 'by_diameter', 'by_angle'
      subProgram: false
    },

    holeSelection: {
      autoDetectCAD: true,
      minDiameterMm: 1.0,
      maxDiameterMm: 50.0,
      selectedHoles: [], // Array of 3D hole descriptors
      groupHolesByDiameter: true
    },

    cutParameters: {
      cycleType: 'G83', // 'G81', 'G82', 'G83', 'G73', 'G84', 'G85'
      feedPerRevMm: mat.fn,
      peckDepthMm: mat.recommendedPeckMm,
      subsequentPeckMm: mat.recommendedPeckMm * 0.8,
      minPeckMm: 1.0,
      chipBreakRetractMm: 0.8,
      dwellSeconds: 0.5,
      retractFeedPercent: 100
    },

    depthTipComp: {
      addTipLengthToDepth: true,
      throughHoleBreakthroughMm: 1.5,
      blindHoleFloorClearanceMm: 0.0,
      totalProgrammedDepthMm: 25.0
    },

    toolAxisAlignment: {
      alignmentMode: 'twp_3_plus_2', // 'twp_3_plus_2' (Fanuc G68.2), 'tcpm_simultaneous' (Fanuc G43.4)
      rotaryAxisSmoothing: true,
      maxTiltAngleDeg: 45.0,
      poleSingularityHandling: 'damped_least_squares'
    },

    linkingClearance: {
      safetyZoneType: 'sphere', // 'sphere', 'cylinder', 'plane'
      safetyClearanceRadiusMm: 65.0,
      axialRetractBeforeIndexMm: 15.0,
      rapidRetractPlaneMm: 5.0,
      feedToClearance: false
    },

    machineKinematics: {
      kinematicsId: activeMachine?.kinematicsId || 'table_table_ac',
      postDialect: 'fanuc_twp',
      primaryAxis: 'A',
      secondaryAxis: 'C',
      outputG68_2Euler: true
    },

    holder: {
      type: 'CAT40_ER32',
      gaugeLength: 70.0,
      shankClearanceMm: 2.0,
      holderClearanceMm: 3.5
    },

    planesCoolant: {
      wcs: 'Top (G54)',
      coolantFlood: true,
      coolantThruSpindle: true,
      airBlast: false,
      operatorMessage: '5-AXIS MULTIAXIS DRILLING'
    }
  };
}
