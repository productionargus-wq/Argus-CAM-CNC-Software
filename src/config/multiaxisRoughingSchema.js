/**
 * Mastercam 5-Axis Multiaxis Roughing & Pocketing Schema Specification
 * 1:1 Schema matching official Mastercam Multiaxis Roughing taxonomy.
 * 
 * Features:
 * - 10-Page Mastercam Tree Taxonomy
 * - Dual Tilting: Continuous 5-Axis Simultaneous vs. 3+2 Auto-Indexed Multi-Directional
 * - Constant engagement adaptive trochoidal cavity clearing
 * - 3D contoured floor offset & planar Z slicing with wall clearance
 * - 3D micro-lift return moves and helical ramp entry
 * - Multi-controller simultaneous TCPM post-processing
 */

export const MULTIAXIS_ROUGHING_PAGES = [
  { id: 'toolpath_type', label: 'Toolpath Type', icon: 'Compass' },
  { id: 'cavity_geometry', label: 'Cavity & Floor Geometry', icon: 'Layers' },
  { id: 'tool', label: 'Tool (Bullnose / End Mill)', icon: 'Activity' },
  { id: 'holder', label: 'Holder & Overhang Buffer', icon: 'ShieldCheck' },
  { id: 'cut_parameters', label: 'Cut Parameters (Adaptive)', icon: 'Sliders' },
  { id: 'rest_roughing', label: 'Rest Roughing & Stock', icon: 'RefreshCw' },
  { id: 'tool_axis_control', label: 'Tool Axis Tilting (5X / 3+2)', icon: 'Compass' },
  { id: 'collision_control', label: 'Collision Control & Auto-Tilt', icon: 'ShieldCheck' },
  { id: 'linking_parameters', label: 'Linking & 3D Micro-Lift', icon: 'CornerUpRight' },
  { id: 'machine_kinematics', label: 'Machine Kinematics & Post', icon: 'Cpu' }
];

export const ROUGHING_MATERIALS_DB = {
  alu_6061: {
    id: 'alu_6061',
    name: 'Aluminum 6061-T6',
    hardness: '95 HB',
    baseVc: 480,       // m/min
    baseFz: 0.12,      // mm/tooth
    recommendedStepoverPct: 25.0, // % of diameter
    recommendedStepdownD: 2.0,    // x Diameter
    kc1_1: 750,        // Specific cutting force N/mm^2
    mc: 0.25,
    powerFactor: 0.85
  },
  steel_4140: {
    id: 'steel_4140',
    name: 'Alloy Steel 4140 (Prehardened)',
    hardness: '32 HRC',
    baseVc: 190,
    baseFz: 0.08,
    recommendedStepoverPct: 15.0,
    recommendedStepdownD: 1.5,
    kc1_1: 1950,
    mc: 0.26,
    powerFactor: 0.80
  },
  stainless_316L: {
    id: 'stainless_316L',
    name: 'Stainless Steel 316L',
    hardness: '220 HB',
    baseVc: 140,
    baseFz: 0.065,
    recommendedStepoverPct: 12.0,
    recommendedStepdownD: 1.2,
    kc1_1: 2250,
    mc: 0.28,
    powerFactor: 0.78
  },
  ti_6al4v: {
    id: 'ti_6al4v',
    name: 'Titanium Ti-6Al-4V (Grade 5)',
    hardness: '36 HRC',
    baseVc: 85,
    baseFz: 0.055,
    recommendedStepoverPct: 10.0,
    recommendedStepdownD: 1.0,
    kc1_1: 2450,
    mc: 0.24,
    powerFactor: 0.75
  },
  inconel_718: {
    id: 'inconel_718',
    name: 'Inconel 718 (Nickel Superalloy)',
    hardness: '44 HRC',
    baseVc: 40,
    baseFz: 0.045,
    recommendedStepoverPct: 8.0,
    recommendedStepdownD: 0.8,
    kc1_1: 2950,
    mc: 0.25,
    powerFactor: 0.72
  }
};

export const ROUGHING_PRESETS = {
  aero_ti_deep_pocket: {
    id: 'aero_ti_deep_pocket',
    name: 'Aerospace Titanium Deep Pocket',
    description: 'Continuous 5X adaptive trochoidal clearing for deep structural pockets',
    tiltingMode: 'continuous_5x',
    stepoverPct: 10.0,
    axialStepdownMm: 12.0,
    feedRate: 1850,
    spindleSpeed: 2800,
    rampAngleDeg: 1.5,
    microLiftMm: 0.3,
    maxTiltAngleDeg: 35.0,
    materialId: 'ti_6al4v'
  },
  alu_hsm_cavity: {
    id: 'alu_hsm_cavity',
    name: 'Aluminum High-Speed Cavity Clearing',
    description: 'High-speed volumetric pocket clearing with maximum MRR',
    tiltingMode: 'continuous_5x',
    stepoverPct: 22.0,
    axialStepdownMm: 20.0,
    feedRate: 5600,
    spindleSpeed: 16000,
    rampAngleDeg: 2.5,
    microLiftMm: 0.4,
    maxTiltAngleDeg: 40.0,
    materialId: 'alu_6061'
  },
  mold_3plus2_indexed: {
    id: 'mold_3plus2_indexed',
    name: 'Mold Cavity 3+2 Auto-Indexed Roughing',
    description: 'Clustered angular zones for rigid high-feed roughing of drafted dies',
    tiltingMode: 'auto_indexed_3plus2',
    stepoverPct: 15.0,
    axialStepdownMm: 15.0,
    feedRate: 2400,
    spindleSpeed: 6000,
    rampAngleDeg: 2.0,
    microLiftMm: 0.5,
    maxTiltAngleDeg: 30.0,
    materialId: 'steel_4140'
  },
  undercut_chamber: {
    id: 'undercut_chamber',
    name: 'Undercut Chamber Roughing',
    description: 'Tilts tool under hanging flanges and undercut chambers without flips',
    tiltingMode: 'continuous_5x',
    stepoverPct: 12.0,
    axialStepdownMm: 10.0,
    feedRate: 2200,
    spindleSpeed: 7500,
    rampAngleDeg: 1.5,
    microLiftMm: 0.3,
    maxTiltAngleDeg: 55.0,
    materialId: 'steel_4140'
  }
};

/**
 * Calculates live cutting physics for 5-Axis Multiaxis Roughing
 */
export function calculateMultiaxisRoughingPhysics(params = {}) {
  const materialKey = params.materialId || 'alu_6061';
  const mat = ROUGHING_MATERIALS_DB[materialKey] || ROUGHING_MATERIALS_DB.alu_6061;
  const toolDia = Math.max(2.0, Number(params.toolDiameter || 12.0));
  const fluteCount = Math.max(1, Number(params.fluteCount || 4));
  const stepoverPct = Math.max(5.0, Math.min(80.0, Number(params.stepoverPct || mat.recommendedStepoverPct)));
  const stepdownMm = Math.max(0.5, Number(params.axialStepdownMm || (toolDia * mat.recommendedStepdownD)));

  // Radial width of cut ae
  const ae = (toolDia * stepoverPct) / 100;

  // Cutter engagement angle theta_e in degrees
  // cos(theta_e) = (R - ae) / R = 1 - (2 * ae / D)
  const cosTheta = Math.max(-1, Math.min(1, 1 - (2 * ae) / toolDia));
  const engagementDeg = (Math.acos(cosTheta) * 180) / Math.PI;

  // Target cutting speed Vc in m/min
  const targetVc = Math.max(15, Number(params.targetVc || mat.baseVc));

  // Spindle Speed RPM: n = (Vc * 1000) / (pi * D)
  const calculatedRpm = Math.round((targetVc * 1000) / (Math.PI * toolDia));
  const spindleRpm = Math.min(30000, Math.max(500, Number(params.spindleRpm || calculatedRpm)));
  const effectiveVc = (Math.PI * toolDia * spindleRpm) / 1000;

  // Feed per tooth fz and table feed F
  const fz = Math.max(0.01, Number(params.feedPerTooth || mat.baseFz));
  const tableFeedF = Math.round(spindleRpm * fz * fluteCount);

  // Average chip thickness hm: hm = fz * sqrt(ae / D)
  const hm = fz * Math.sqrt(ae / toolDia);

  // Specific cutting force kc
  const kc = mat.kc1_1 * Math.pow(Math.max(0.01, hm), -mat.mc);

  // Tangential cutting force Fc: Fc = kc * ap * ae
  const cuttingForceFc = Math.max(10, (kc * stepdownMm * hm));

  // Spindle Torque & Cutting Power
  const torqueNm = (cuttingForceFc * (toolDia / 2000));
  const powerKw = (cuttingForceFc * effectiveVc) / (60000 * mat.powerFactor);

  // Volumetric Material Removal Rate (MRR) in cm^3/min
  const mrrCm3Min = (stepdownMm * ae * tableFeedF) / 1000;

  return {
    material: mat.name,
    toolDiameterMm: toolDia,
    radialStepoverMm: Number(ae.toFixed(2)),
    stepoverPct: Number(stepoverPct.toFixed(1)),
    axialStepdownMm: Number(stepdownMm.toFixed(2)),
    engagementDeg: Number(engagementDeg.toFixed(1)),
    spindleRpm,
    tableFeedMmMin: tableFeedF,
    cuttingSpeedVc: Number(effectiveVc.toFixed(1)),
    feedPerToothFz: Number(fz.toFixed(3)),
    averageChipThicknessMm: Number(hm.toFixed(4)),
    cuttingForceFc: Number(cuttingForceFc.toFixed(1)),
    torqueNm: Number(torqueNm.toFixed(2)),
    powerKw: Number(powerKw.toFixed(2)),
    mrrCm3Min: Number(mrrCm3Min.toFixed(1))
  };
}

/**
 * Creates default parameters matching Mastercam 5-Axis Multiaxis Roughing Studio
 */
export function createDefaultMultiaxisRoughingParams(existingOp = {}, toolOverride = null) {
  const toolDia = toolOverride?.diameter || existingOp.tool?.diameter || 12.0;
  const toolType = toolOverride?.type || existingOp.tool?.type || 'bullnose';

  return {
    strategyKey: '5axis_rough',
    name: existingOp.name || '5-Axis Multiaxis Roughing (Adaptive Cavity)',
    comment: existingOp.comment || 'Mastercam 5-Axis Dynamic Motion Cavity Clearing',
    activePage: 'toolpath_type',

    // 1. Toolpath Type
    toolpathType: {
      strategy: 'multiaxis_roughing',
      motionType: 'dynamic_trochoidal', // 'dynamic_trochoidal', 'offset_pocket', 'zigzag'
      sliceMode: 'offset_from_floor',   // 'offset_from_floor', 'planar_z_tilt', 'morph_slices'
      toleranceMm: 0.02
    },

    // 2. Cavity Geometry & Part Selection
    cavityGeometry: {
      driveSurfacesMode: 'entire_cavity', // 'entire_cavity', 'selected_faces', 'mesh_pocket'
      floorType: 'contoured_3d_floor',   // 'contoured_3d_floor', 'planar_floor'
      containmentBoundary: 'auto_silhouette',
      topStockZ: 0.0,
      floorDepthZ: -35.0,
      wallDraftAngleDeg: 5.0
    },

    // 3. Tool Parameters
    tool: {
      number: toolOverride?.number || existingOp.tool?.number || 3,
      type: toolType, // 'bullnose', 'flat_end', 'high_feed'
      diameter: toolDia,
      cornerRad: toolType === 'bullnose' ? 2.0 : 0.0,
      fluteCount: toolOverride?.fluteCount || 4,
      fluteLength: 25.0,
      overallLength: 75.0,
      overhangLength: 35.0, // Short, rigid overhang L/D ~ 2.9
      materialId: 'alu_6061',
      spindleSpeed: 12000,
      feedRate: 4500,
      plungeRate: 1200,
      targetVc: 450,
      feedPerTooth: 0.09
    },

    // 4. Holder Definition & Clearance
    holder: {
      type: 'HSK63_HYDRAULIC',
      gaugeLengthMm: 60.0,
      diameterMm: 45.0,
      shankClearanceMm: 1.5,
      holderClearanceMm: 3.0
    },

    // 5. Cut Parameters
    cutParameters: {
      stepoverPct: 20.0,       // 20% D for dynamic trochoidal
      axialStepdownMm: 15.0,   // High axial depth
      wallStockToLeaveMm: 0.5,
      floorStockToLeaveMm: 0.3,
      cutDirection: 'climb',   // 'climb', 'conventional'
      cornerSmoothing: true,
      minCornerRadiusPct: 15.0
    },

    // 6. Rest Roughing
    restRoughing: {
      enabled: false,
      referenceMode: 'previous_tool', // 'previous_tool', 'stock_model'
      previousToolDiameterMm: 20.0,
      previousCornerRadMm: 4.0,
      detectRemainingCorners: true
    },

    // 7. Tool Axis Control
    toolAxisControl: {
      tiltingMode: 'continuous_5x', // 'continuous_5x', 'auto_indexed_3plus2'
      primaryAxis: 'floor_normal',   // 'floor_normal', 'cavity_centerline', 'shortest_distance'
      leadAngleDeg: 0.0,
      sideTiltAngleDeg: 12.0,
      maxTiltAngleDeg: 45.0,
      singularityDamping: true,
      maxAngularVelocityDegSec: 120.0
    },

    // 8. Collision Control & Auto-Tilt
    collisionControl: {
      enableAutoTilt: true,
      shankClearanceBufferMm: 1.5,
      holderClearanceBufferMm: 3.0,
      tiltStrategy: 'tilt_away_normal', // 'tilt_away_normal', 'retract_along_vector'
      checkFixtures: true
    },

    // 9. Linking Parameters & 3D Micro-Lift
    linkingParameters: {
      entryType: 'helical_ramp',
      helicalRampRadiusMm: 5.0,
      helicalRampAngleDeg: 2.0,
      microLiftMm: 0.3,           // 3D micro-lift on non-cutting returns
      microLiftFeedRate: 10000,   // High feed return
      clearancePlaneMm: 25.0,
      retractDistanceMm: 5.0
    },

    // 10. Machine Kinematics & Post
    machineKinematics: {
      kinematicsType: 'table_table', // 'table_table', 'head_table', 'head_head'
      rotaryAxis1: 'A',
      rotaryAxis2: 'C',
      controllerDialect: 'fanuc',   // 'fanuc', 'haas', 'siemens', 'heidenhain'
      tcpmCode: 'G43.4',
      highSpeedLookAhead: 'G05.1 Q1',
      workCoordinateSystem: 'G54',
      coolantMode: 'flood'          // 'flood', 'thru_spindle', 'air_blast'
    }
  };
}

/**
 * Resolves or creates a default tool appropriate for 5-Axis Multiaxis Roughing
 */
export function resolveDefaultRoughingTool(tools = []) {
  const match = tools.find((t) => 
    t.type === 'bullnose' || t.type === 'endmill' || t.type === 'flat_end' || t.type === 'flat'
  );
  if (match) return match;

  return {
    id: 3,
    number: 3,
    name: '12mm Bullnose End Mill (R2.0)',
    type: 'bullnose',
    diameter: 12.0,
    cornerRad: 2.0,
    fluteCount: 4,
    fluteLength: 25.0,
    overallLength: 75.0,
    spindleSpeed: 12000,
    feedRate: 4500
  };
}
