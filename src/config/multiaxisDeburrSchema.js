/**
 * Mastercam 5-Axis Multiaxis Deburring Schema & Parameters Specification
 * 1:1 Schema matching official Mastercam Multiaxis Deburr taxonomy.
 * 
 * Features:
 * - 10-Page Mastercam Tree Taxonomy
 * - Automated 3D edge feature detection threshold
 * - Contact point shifting (periphery angle theta_contact to eliminate zero-velocity dead center)
 * - Collision avoidance auto-tilt
 * - Multi-controller simultaneous TCPM post-processing
 */

export const MULTIAXIS_DEBURR_PAGES = [
  { id: 'toolpath_type', label: 'Toolpath Type', icon: 'Compass' },
  { id: 'edge_detection', label: 'Edge Detection & Part', icon: 'Layers' },
  { id: 'tool', label: 'Tool (Ball / Lollipop)', icon: 'Activity' },
  { id: 'holder', label: 'Holder & Clearance', icon: 'ShieldCheck' },
  { id: 'cut_parameters', label: 'Cut Parameters (Chamfer)', icon: 'Sliders' },
  { id: 'contact_point', label: 'Contact Point Shifting', icon: 'Target' },
  { id: 'tool_axis_control', label: 'Tool Axis Control & Tilt', icon: 'Compass' },
  { id: 'collision_control', label: 'Collision Control & Auto-Tilt', icon: 'ShieldCheck' },
  { id: 'linking_parameters', label: 'Linking & 3D Lead Arcs', icon: 'CornerUpRight' },
  { id: 'machine_kinematics', label: 'Machine Kinematics & Post', icon: 'Cpu' }
];

export const DEBURR_MATERIALS_DB = {
  alu_6061: {
    id: 'alu_6061',
    name: 'Aluminum 6061-T6',
    hardness: '95 HB',
    baseVc: 450,       // m/min
    baseFz: 0.04,      // mm/tooth (fine finishing for edge break)
    kc1_1: 700,        // Specific cutting force N/mm^2
    mc: 0.25,
    powerFactor: 0.85
  },
  steel_4140: {
    id: 'steel_4140',
    name: 'Alloy Steel 4140 (Annealed)',
    hardness: '28-32 HRC',
    baseVc: 180,
    baseFz: 0.025,
    kc1_1: 1900,
    mc: 0.26,
    powerFactor: 0.80
  },
  stainless_316L: {
    id: 'stainless_316L',
    name: 'Stainless Steel 316L',
    hardness: '220 HB',
    baseVc: 130,
    baseFz: 0.02,
    kc1_1: 2200,
    mc: 0.28,
    powerFactor: 0.78
  },
  ti_6al4v: {
    id: 'ti_6al4v',
    name: 'Titanium Ti-6Al-4V (Grade 5)',
    hardness: '36 HRC',
    baseVc: 75,
    baseFz: 0.018,
    kc1_1: 2400,
    mc: 0.24,
    powerFactor: 0.75
  },
  inconel_718: {
    id: 'inconel_718',
    name: 'Inconel 718 (Nickel Superalloy)',
    hardness: '42 HRC',
    baseVc: 35,
    baseFz: 0.015,
    kc1_1: 2900,
    mc: 0.25,
    powerFactor: 0.72
  }
};

export const DEBURR_PRESETS = {
  micro_edge_break: {
    id: 'micro_edge_break',
    name: 'Micro Edge Break (0.2mm)',
    description: 'Precision burr removal for aerospace airfoils & medical instruments',
    chamferWidthMm: 0.2,
    cutterType: 'ball_nose',
    contactAngleDeg: 25.0,
    feedRate: 3200,
    spindleSpeed: 18000,
    numPasses: 1,
    leadAngleDeg: 0,
    tiltAngleDeg: 15.0
  },
  heavy_chamfer: {
    id: 'heavy_chamfer',
    name: 'Heavy 45° Chamfer (1.0mm)',
    description: 'Distinct functional 45-degree chamfer edge preparation',
    chamferWidthMm: 1.0,
    cutterType: 'chamfer_mill',
    contactAngleDeg: 45.0,
    feedRate: 2200,
    spindleSpeed: 12000,
    numPasses: 2,
    leadAngleDeg: 0,
    tiltAngleDeg: 0
  },
  lollipop_undercut: {
    id: 'lollipop_undercut',
    name: 'Lollipop Undercut Hole Deburr',
    description: 'Deburring inverted bottom edges & cross-holes without refixturing',
    chamferWidthMm: 0.3,
    cutterType: 'lollipop',
    contactAngleDeg: 35.0,
    feedRate: 2800,
    spindleSpeed: 16000,
    numPasses: 1,
    leadAngleDeg: 5.0,
    tiltAngleDeg: 25.0
  },
  titanium_airframe: {
    id: 'titanium_airframe',
    name: 'Titanium Airframe Edge Deburr',
    description: 'Anti-fatigue deburring on high-stress titanium aero structures',
    chamferWidthMm: 0.4,
    cutterType: 'ball_nose',
    contactAngleDeg: 30.0,
    feedRate: 1400,
    spindleSpeed: 8500,
    numPasses: 2,
    leadAngleDeg: 0,
    tiltAngleDeg: 20.0
  }
};

/**
 * Calculates live cutting physics for 5-Axis Deburring
 */
export function calculateMultiaxisDeburrPhysics(params = {}) {
  const materialKey = params.materialId || 'alu_6061';
  const mat = DEBURR_MATERIALS_DB[materialKey] || DEBURR_MATERIALS_DB.alu_6061;
  const toolDia = Math.max(1.0, Number(params.toolDiameter || 6.0));
  const fluteCount = Math.max(1, Number(params.fluteCount || 4));
  const contactAngleDeg = Math.max(5.0, Math.min(85.0, Number(params.contactAngleDeg || 30.0)));
  const chamferWidth = Math.max(0.05, Number(params.chamferWidthMm || 0.3));

  // Effective cutting diameter at contact point on spherical periphery
  // Deff = Dc * sin(contactAngle)
  const contactRad = (contactAngleDeg * Math.PI) / 180;
  const effectiveDiameter = Math.max(0.5, toolDia * Math.sin(contactRad));

  // Target cutting speed Vc in m/min
  const targetVc = Math.max(10, Number(params.targetVc || mat.baseVc));
  
  // Spindle Speed RPM based on effective contact diameter
  // n = (Vc * 1000) / (pi * Deff)
  const calculatedRpm = Math.round((targetVc * 1000) / (Math.PI * effectiveDiameter));
  const spindleRpm = Math.min(40000, Math.max(500, Number(params.spindleRpm || calculatedRpm)));
  const effectiveVc = (Math.PI * effectiveDiameter * spindleRpm) / 1000;

  // Tip surface speed at pole (which would be zero without contact shift)
  const tipDiameter = 0.05; // mm nominal dead center
  const tipVc = (Math.PI * tipDiameter * spindleRpm) / 1000;

  // Feed per tooth fz
  const fz = Math.max(0.005, Number(params.feedPerTooth || mat.baseFz));
  const tableFeedF = Math.round(spindleRpm * fz * fluteCount);

  // Cutting forces for micro edge chamfering
  // ap = chamferWidth / sqrt(2) for 45 deg chamfer
  const ap = chamferWidth * 0.7071;
  const chipThickness = fz * Math.sin(contactRad);
  const kc = mat.kc1_1 * Math.pow(Math.max(0.005, chipThickness), -mat.mc);
  const cuttingForceFc = Math.max(0.5, kc * ap * chipThickness);

  // Spindle Torque & Cutting Power
  const torqueNm = (cuttingForceFc * (effectiveDiameter / 2000));
  const powerKw = (cuttingForceFc * effectiveVc) / (60000 * mat.powerFactor);
  const mrrCm3Min = (ap * chamferWidth * tableFeedF) / 1000;

  return {
    material: mat.name,
    nominalDiameterMm: toolDia,
    effectiveDiameterMm: Number(effectiveDiameter.toFixed(3)),
    contactAngleDeg: Number(contactAngleDeg.toFixed(1)),
    spindleRpm,
    tableFeedMmMin: tableFeedF,
    cuttingSpeedVc: Number(effectiveVc.toFixed(1)),
    deadTipVc: Number(tipVc.toFixed(2)),
    velocityGainFactor: Number((effectiveVc / Math.max(0.1, tipVc)).toFixed(1)),
    feedPerToothFz: Number(fz.toFixed(4)),
    cuttingForceFc: Number(cuttingForceFc.toFixed(1)),
    torqueNm: Number(torqueNm.toFixed(3)),
    powerKw: Number(powerKw.toFixed(3)),
    mrrCm3Min: Number(mrrCm3Min.toFixed(3)),
    chipThicknessMm: Number(chipThickness.toFixed(4))
  };
}

/**
 * Creates default parameters matching Mastercam 5-Axis Deburring Studio
 */
export function createDefaultMultiaxisDeburrParams(existingOp = {}, toolOverride = null) {
  const toolDia = toolOverride?.diameter || existingOp.tool?.diameter || 6.0;
  const toolType = toolOverride?.type || existingOp.tool?.type || 'ball_nose';

  return {
    strategyKey: '5axis_deburr',
    name: existingOp.name || '5-Axis Multiaxis Deburring',
    comment: existingOp.comment || 'Mastercam 5-Axis Automated Edge Break & Deburr',
    activePage: 'toolpath_type',
    
    // 1. Toolpath Type
    toolpathType: {
      strategy: 'edge_break_5x',
      subStrategy: 'auto_edge_detection',
      toleranceMm: 0.005
    },

    // 2. Edge Detection & Part Geometry
    edgeDetection: {
      mode: 'auto_detect_all', // 'auto_detect_all', 'user_chains', 'exclude_faces'
      dihedralThresholdDeg: 45.0, // Edges sharper than 135 deg (internal angle) or 45 deg change
      minEdgeLengthMm: 1.0,
      filterConvexOnly: true,
      detectInteriorHoles: true,
      detectPartPerimeter: true,
      detectBossEdges: true
    },

    // 3. Tool Parameters
    tool: {
      number: toolOverride?.number || existingOp.tool?.number || 5,
      type: toolType, // 'ball_nose', 'lollipop', 'chamfer_mill'
      diameter: toolDia,
      cornerRad: toolDia / 2,
      fluteCount: toolOverride?.fluteCount || 4,
      neckDiameter: toolType === 'lollipop' ? toolDia * 0.5 : toolDia,
      neckLength: 20.0,
      fluteLength: 12.0,
      overallLength: 65.0,
      materialId: 'alu_6061',
      spindleSpeed: 16000,
      feedRate: 3200,
      plungeRate: 800,
      targetVc: 450,
      feedPerTooth: 0.035
    },

    // 4. Holder Definition & Clearance
    holder: {
      type: 'HSK63_HYDRAULIC',
      gaugeLengthMm: 55.0,
      diameterMm: 42.0,
      shankClearanceMm: 1.5,
      holderClearanceMm: 3.0
    },

    // 5. Cut Parameters
    cutParameters: {
      edgeBreakType: 'chamfer_45', // 'chamfer_45', 'round_fillet'
      chamferWidthMm: 0.3,
      axialDepthMm: 0.3,
      numPasses: 1,
      cutDirection: 'climb', // 'climb', 'conventional'
      innerCornerRounding: true,
      cornerRoundingRadMm: 0.5
    },

    // 6. Contact Point Shifting (Crucial for eliminating zero tip velocity)
    contactPoint: {
      enabled: true,
      contactAngleDeg: 30.0, // 30 deg offset from pole
      shiftMode: 'fixed_angle', // 'fixed_angle', 'flute_center', 'wear_distributed'
      minContactAngleDeg: 15.0,
      maxContactAngleDeg: 60.0
    },

    // 7. Tool Axis Control
    toolAxisControl: {
      mode: 'surface_bisector', // 'surface_bisector', 'fixed_angle_edge', 'swivel_lead_tilt'
      leadAngleDeg: 0.0,
      tiltAngleDeg: 15.0,
      maxTiltAngleDeg: 45.0,
      singularityDamping: true,
      rotaryAxisLimits: {
        aMin: -110,
        aMax: 110,
        bMin: -100,
        bMax: 100,
        cMin: -360,
        cMax: 360
      }
    },

    // 8. Collision Control & Auto-Tilt
    collisionControl: {
      enableAutoTilt: true,
      checkPartSurfaces: true,
      checkFixtures: true,
      shankClearanceBufferMm: 1.5,
      holderClearanceBufferMm: 3.0,
      tiltStrategy: 'tilt_away_normal' // 'tilt_away_normal', 'retract_along_axis', 'skip_edge'
    },

    // 9. Linking Parameters & 3D Blend Lead-In/Out
    linkingParameters: {
      clearancePlaneMm: 25.0,
      retractDistanceMm: 5.0,
      leadInType: 'tangent_3d_arc',
      leadInRadiusMm: 2.0,
      leadInSweepDeg: 75.0,
      leadOutType: 'tangent_3d_arc',
      leadOutRadiusMm: 2.0,
      leadOutSweepDeg: 75.0,
      transitionMode: 'smooth_3d_spline' // 'smooth_3d_spline', 'retract_to_clearance'
    },

    // 10. Machine Kinematics & Planes
    machineKinematics: {
      kinematicsType: 'table_table', // 'table_table', 'head_table', 'head_head'
      rotaryAxis1: 'A', // Tilt
      rotaryAxis2: 'C', // Rotary Table
      controllerDialect: 'fanuc', // 'fanuc', 'haas', 'siemens', 'heidenhain'
      tcpmCode: 'G43.4',
      highSpeedLookAhead: 'G05.1 Q1',
      workCoordinateSystem: 'G54',
      coolantMode: 'flood' // 'flood', 'thru_spindle', 'mist', 'air_blast'
    }
  };
}

/**
 * Resolves or creates a default tool appropriate for 5-Axis Deburring
 */
export function resolveDefaultDeburrTool(tools = []) {
  const match = tools.find((t) => 
    t.type === 'ball_nose' || t.type === 'ball' || t.type === 'lollipop' || t.type === 'chamfer'
  );
  if (match) return match;

  return {
    id: 5,
    number: 5,
    name: '6mm 4-Flute Ball Nose (Deburr)',
    type: 'ball_nose',
    diameter: 6.0,
    cornerRad: 3.0,
    fluteCount: 4,
    fluteLength: 12.0,
    overallLength: 65.0,
    spindleSpeed: 16000,
    feedRate: 3200
  };
}
