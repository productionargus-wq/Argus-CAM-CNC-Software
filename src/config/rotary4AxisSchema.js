/**
 * Mastercam-Authentic Rotary 4-Axis Configuration & Physics Schema
 *
 * Implements comprehensive taxonomy, physics calculations, cylindrical wrapping kinematics,
 * and intelligent defaults matching Mastercam Rotary Advanced / 4-Axis Multiaxis specifications.
 */

export function resolveDefaultRotaryTool(tools = []) {
  if (!Array.isArray(tools) || tools.length === 0) return null;
  // 1. Prefer Ball Nose or Lollipop <= 12mm
  const bestBall = tools.find(
    (t) => (t.type === 'ball' || t.type === 'ballnose' || t.type === 'lollipop') && Number(t.diameter) <= 12
  );
  if (bestBall) return bestBall;

  // 2. Flat endmill <= 12mm
  const bestFlat = tools.find(
    (t) => (t.type === 'flat' || t.type === 'endmill') && Number(t.diameter) <= 12
  );
  if (bestFlat) return bestFlat;

  // 3. Any Bullnose or Endmill <= 16mm
  const bullOrSmall = tools.find(
    (t) => (t.type === 'bull' || t.type === 'bullnose' || t.type === 'flat') && Number(t.diameter) <= 16
  );
  if (bullOrSmall) return bullOrSmall;

  // 4. Fallback to first available cutter
  return tools[0];
}

export const ROTARY_4AXIS_PAGE_TITLES = {
  toolpath_type: 'Toolpath Type',
  rotary_cut_pattern: 'Rotary Cut Pattern (Axis & Style)',
  tool: 'Tool Selection & 4X Dynamics',
  holder: 'Holder Definition & Clearance',
  axis_control_offset: 'Axis Control & Cutter Offset (Y-Offset)',
  stepover_passes: 'Stepover & Depth Passes',
  collision_rotary_limits: 'Collision Control & Rotary Limits',
  linking_parameters: 'Linking & Clearance Cylinders',
  machine_kinematics: 'Machine Kinematics & Post Dialect',
  arc_filter: 'Arc Filter & 4X Tolerance',
  planes_coolant: 'Planes (WCS) & Coolant Management'
};

export const ROTARY_4AXIS_MATERIALS = {
  ALU_6061: {
    id: 'alu_6061',
    name: 'Aluminum 6061-T6 Aerospace',
    category: 'Non-Ferrous Alloy',
    hardness: '95 HB',
    kc: 750, // Specific cutting force N/mm2
    recommendedPasses: 30,
    recommendedStepoverMm: 1.2,
    recommendedStepoverDeg: 3.5,
    vc: 450, // m/min
    fzNominal: 0.08, // mm/tooth
    desc: 'High-speed rotary cylindrical machining for drive sleeves, pistons, and aerospace fittings.'
  },
  STEEL_4140: {
    id: 'steel_4140',
    name: 'AISI 4140 Pre-hardened Cr-Mo Steel',
    category: 'Alloy Tool Steel',
    hardness: '32 HRC',
    kc: 2100,
    recommendedPasses: 40,
    recommendedStepoverMm: 0.7,
    recommendedStepoverDeg: 2.0,
    vc: 160,
    fzNominal: 0.05,
    desc: 'Automotive camshafts, transmission shafts, and heavy-duty rotary spline milling.'
  },
  TITANIUM_4X: {
    id: 'titanium_4x',
    name: 'Ti-6Al-4V Grade 5 Titanium',
    category: 'Titanium Superalloy',
    hardness: '36 HRC',
    kc: 2800,
    recommendedPasses: 45,
    recommendedStepoverMm: 0.5,
    recommendedStepoverDeg: 1.5,
    vc: 65,
    fzNominal: 0.038,
    desc: 'Aerospace rotary ducting, actuator sleeves, and high-strength cylindrical components.'
  },
  STAINLESS_304: {
    id: 'stainless_304',
    name: 'AISI 304 Austenitic Stainless Steel',
    category: 'Stainless Steel',
    hardness: '190 HB',
    kc: 2300,
    recommendedPasses: 36,
    recommendedStepoverMm: 0.6,
    recommendedStepoverDeg: 1.8,
    vc: 120,
    fzNominal: 0.045,
    desc: 'Sanitary food/medical augers, rotary pumps, and cylindrical fluid mixing screws.'
  },
  BRASS_C360: {
    id: 'brass_c360',
    name: 'C36000 Free-Cutting Brass',
    category: 'Copper Alloy',
    hardness: '65 HB',
    kc: 600,
    recommendedPasses: 25,
    recommendedStepoverMm: 1.5,
    recommendedStepoverDeg: 4.5,
    vc: 350,
    fzNominal: 0.09,
    desc: 'High-precision cylindrical instrument dials, barrel cams, and decorative rotary rolls.'
  }
};

export const ROTARY_4AXIS_PRESETS = {
  CAM_GROOVE: {
    id: 'cam_groove',
    name: 'Cylindrical Barrel Cam Groove (Axis Substitution)',
    desc: 'Wraps 2D cam path onto cylinder OD with full depth slotting and Fanuc G107 cylindrical interpolation.',
    machiningStyle: 'axis_substitution',
    rotaryAxis: 'X', // A-axis
    cylinderDiameter: 60.0,
    cuttingDirection: 'climb',
    stepoverDeg: 5.0,
    stepoverMm: 1.5,
    yOffsetMm: 0.0,
    leadAngleDeg: 0.0,
    postDialect: 'fanuc',
    cylindricalInterp: true,
    feedMode: 'deg_per_min',
    spindleSpeed: 8000,
    feedRate: 1800,
    plungeRate: 400
  },
  ROTARY_CYLINDER_FINISH: {
    id: 'rotary_cylinder_finish',
    name: '4-Axis Continuous Spiral Surface Finishing',
    desc: 'Continuous 360° helical revolution around cylinder with ballnose cutter for mirror finish.',
    machiningStyle: 'spiral',
    rotaryAxis: 'X',
    cylinderDiameter: 50.0,
    cuttingDirection: 'zigzag',
    stepoverDeg: 2.5,
    stepoverMm: 0.6,
    yOffsetMm: 1.5,
    leadAngleDeg: 8.0,
    postDialect: 'fanuc',
    cylindricalInterp: false,
    feedMode: 'deg_per_min',
    spindleSpeed: 14000,
    feedRate: 3200,
    plungeRate: 500
  },
  HELICAL_FLUTE: {
    id: 'helical_flute',
    name: 'Multi-Start Helical Flutes & Splines',
    desc: 'Axial multi-pass rotary cutting with indexed angular spacing across cylindrical workpiece.',
    machiningStyle: 'axial',
    rotaryAxis: 'X',
    cylinderDiameter: 40.0,
    cuttingDirection: 'climb',
    stepoverDeg: 60.0, // 6 flutes
    stepoverMm: 1.0,
    yOffsetMm: 0.0,
    leadAngleDeg: 0.0,
    postDialect: 'haas',
    cylindricalInterp: false,
    feedMode: 'inverse_time',
    spindleSpeed: 9500,
    feedRate: 2200,
    plungeRate: 450
  },
  ROTARY_EMBOSS: {
    id: 'rotary_emboss',
    name: 'Rotary Cylindrical Engraving & Embossing',
    desc: 'High-speed wrapped 2D contouring and 3D V-carving on cylindrical mandrel surface.',
    machiningStyle: 'axis_substitution',
    rotaryAxis: 'X',
    cylinderDiameter: 75.0,
    cuttingDirection: 'climb',
    stepoverDeg: 2.0,
    stepoverMm: 0.4,
    yOffsetMm: 0.0,
    leadAngleDeg: 0.0,
    postDialect: 'fanuc',
    cylindricalInterp: true,
    feedMode: 'deg_per_min',
    spindleSpeed: 18000,
    feedRate: 2500,
    plungeRate: 600
  }
};

/**
 * Calculates physics-based rotary parameters:
 * Surface speed, angular feed (deg/min), inverse time feed (G93),
 * scallop height, cutting forces, and power.
 */
export function calculateRotary4AxisPhysics({
  cylinderDiameter = 60.0,
  toolDiameter = 10.0,
  toolCornerRadius = 0.0,
  isBallnose = false,
  flutes = 2,
  spindleRpm = 10000,
  feedLinearMmMin = 2000,
  stepoverMm = 1.0,
  depthOfCutMm = 1.5,
  materialKey = 'ALU_6061',
  yOffsetMm = 0.0
}) {
  const D_cyl = Math.max(1.0, Number(cylinderDiameter) || 60.0);
  const D_tool = Math.max(0.5, Number(toolDiameter) || 10.0);
  const z_flutes = Math.max(1, Number(flutes) || 2);
  const N_rpm = Math.max(100, Number(spindleRpm) || 10000);
  const F_linear = Math.max(10, Number(feedLinearMmMin) || 2000);
  const ae = Math.max(0.01, Number(stepoverMm) || 1.0);
  const ap = Math.max(0.01, Number(depthOfCutMm) || 1.5);
  const yOff = Number(yOffsetMm) || 0.0;

  const mat = ROTARY_4AXIS_MATERIALS[materialKey?.toUpperCase()] || ROTARY_4AXIS_MATERIALS.ALU_6061;

  // 1. Surface Cutting Speed Vc at tool outer diameter (m/min)
  const toolVcMMin = (Math.PI * D_tool * N_rpm) / 1000.0;

  // 2. Workpiece Cylindrical Surface Speed at OD (m/min)
  const cylinderCircumferenceMm = Math.PI * D_cyl;

  // 3. Rotary Angular Feedrate in Degrees per Minute (deg/min)
  // For a linear feed F_linear along the cylindrical circumference:
  // F_rot = (360 * F_linear) / (pi * D_cyl)
  const rotaryFeedDegMin = (360.0 * F_linear) / cylinderCircumferenceMm;

  // 4. Chip load per tooth fz (mm/tooth)
  const chipLoadFzMm = F_linear / (N_rpm * z_flutes);

  // 5. Scallop Height (microns)
  let scallopMicrons = 0.0;
  if (isBallnose) {
    const R_ball = D_tool / 2.0;
    scallopMicrons = Math.max(0.0, (Math.pow(ae, 2) / (8.0 * R_ball)) * 1000.0);
  } else if (toolCornerRadius > 0.0) {
    scallopMicrons = Math.max(0.0, (Math.pow(ae, 2) / (8.0 * toolCornerRadius)) * 1000.0);
  } else {
    // Flat endmill scallop on cylinder: chordal deviation from planar stepover
    const R_cyl = D_cyl / 2.0;
    scallopMicrons = Math.max(0.0, (R_cyl - Math.sqrt(Math.max(0.0, Math.pow(R_cyl, 2) - Math.pow(ae / 2.0, 2)))) * 1000.0);
  }

  // 6. Tangential Cutting Force & Power
  const kc = mat.kc || 750; // N/mm2
  const mrrCm3Min = (ae * ap * F_linear) / 1000.0;
  const chipThicknessHm = chipLoadFzMm * Math.sqrt(ae / D_tool);
  const cuttingForceN = kc * ap * Math.max(0.01, chipThicknessHm);
  const spindlePowerKw = (cuttingForceN * toolVcMMin) / 60000.0;
  const spindleTorqueNm = (spindlePowerKw * 9549.0) / N_rpm;

  // 7. Inverse Time Feed example for a 5mm nominal segment (1/min)
  const sampleSegmentMm = 5.0;
  const inverseTimeF1Min = F_linear / sampleSegmentMm;

  return {
    cylinderDiameterMm: Number(D_cyl.toFixed(2)),
    cylinderCircumferenceMm: Number(cylinderCircumferenceMm.toFixed(2)),
    toolVcMMin: Number(toolVcMMin.toFixed(1)),
    rotaryFeedDegMin: Number(rotaryFeedDegMin.toFixed(1)),
    chipLoadFzMm: Number(chipLoadFzMm.toFixed(4)),
    scallopMicrons: Number(scallopMicrons.toFixed(1)),
    mrrCm3Min: Number(mrrCm3Min.toFixed(2)),
    cuttingForceN: Number(cuttingForceN.toFixed(1)),
    spindlePowerKw: Number(spindlePowerKw.toFixed(2)),
    spindleTorqueNm: Number(spindleTorqueNm.toFixed(2)),
    inverseTimeF1Min: Number(inverseTimeF1Min.toFixed(1)),
    material: mat.name,
    // Aliases for compatibility
    effDiameterMm: Number(D_tool.toFixed(2)),
    effVcMMin: Number(toolVcMMin.toFixed(1)),
    forceN: Number(cuttingForceN.toFixed(1)),
    mrr: Number(mrrCm3Min.toFixed(2))
  };
}

/**
 * Creates default parameters for Rotary 4-Axis toolpath
 */
export function createDefaultRotary4AxisParams(tools = [], presetKey = 'CAM_GROOVE') {
  const defaultTool = resolveDefaultRotaryTool(tools) || {
    id: 1,
    number: 1,
    name: '10mm 2-Flute Carbide Endmill',
    type: 'flat',
    diameter: 10.0,
    flutes: 2,
    corner_radius: 0.0,
    fluteLength: 25.0,
    overallLength: 75.0
  };

  const preset = ROTARY_4AXIS_PRESETS[presetKey] || ROTARY_4AXIS_PRESETS.CAM_GROOVE;

  return {
    // 1. Toolpath Type
    toolpathType: 'rotary_4axis',
    operationName: '4-Axis Rotary Machining',
    presetKey: preset.id,

    // 2. Rotary Cut Pattern & Style
    cutPattern: {
      machiningStyle: preset.machiningStyle, // 'axis_substitution' | 'axial' | 'radial' | 'spiral'
      rotaryAxis: preset.rotaryAxis, // 'X' (A-axis), 'Y' (B-axis), 'Z' (C-axis)
      cylinderDiameter: preset.cylinderDiameter || 60.0,
      cylinderLength: 100.0,
      rotaryCenterZ: 0.0,
      rotaryCenterY: 0.0,
      cylinderOriginX: 0.0,
      cuttingDirection: preset.cuttingDirection || 'climb', // 'climb', 'conventional', 'zigzag'
      cutSequence: 'positive_x_to_negative', // 'positive_x_to_negative', 'negative_x_to_positive', 'inside_out'
      wrapUnwrapToleranceMm: 0.01,
      reverseRotaryDirection: false
    },

    // 3. Tool Selection & Dynamics
    tool: {
      toolId: defaultTool.id,
      toolNumber: defaultTool.number || 1,
      toolName: defaultTool.name || 'Rotary End Mill',
      toolType: defaultTool.type || 'flat',
      diameter: Number(defaultTool.diameter) || 10.0,
      cornerRadius: Number(defaultTool.corner_radius) || 0.0,
      flutes: Number(defaultTool.flutes) || 2,
      fluteLength: Number(defaultTool.fluteLength) || 25.0,
      spindleSpeed: preset.spindleSpeed || 10000,
      feedRate: preset.feedRate || 2000,
      plungeRate: preset.plungeRate || 500,
      retractRate: 4000,
      rapidRetract: true,
      coolant: 'flood'
    },

    // 4. Holder Definition & Clearance
    holder: {
      type: 'CAT40_ER32',
      description: 'CAT40 ER32 High-Speed Precision Balanced Chuck (70mm Gauge)',
      gaugeLength: 70.0,
      overhang: 35.0,
      collarDiameter: 42.0,
      shankClearanceMargin: 1.5,
      holderClearanceMargin: 3.0
    },

    // 5. Axis Control & Cutter Offset (Y-Offset)
    axisControl: {
      cutterOffsetMethod: 'centerline', // 'centerline' | 'y_offset'
      yOffsetDistanceMm: preset.yOffsetMm || 0.0,
      leadAngleDeg: preset.leadAngleDeg || 0.0,
      tiltAngleDeg: 0.0,
      tiltLimitingActive: true,
      smoothRotaryAngles: true,
      smoothingToleranceDeg: 0.5
    },

    // 6. Stepover & Depth Passes
    stepoverPasses: {
      stepoverDeg: preset.stepoverDeg || 3.5, // for axial
      stepoverMm: preset.stepoverMm || 1.2,   // for radial/spiral
      stockToLeaveCylinderMm: 0.0,
      numberOfPasses: 30,
      multipleDepthsEnabled: false,
      maxRoughStepdownMm: 2.0,
      finishStepdownMm: 0.5
    },

    // 7. Collision Control & Rotary Limits
    collisionControl: {
      checkInterferenceEnabled: true,
      rotaryLimitsMode: 'continuous', // 'continuous' | 'clamped'
      minRotaryAngleDeg: -360.0,
      maxRotaryAngleDeg: 360.0,
      rotaryUnwindEnabled: true,
      holderClearanceRadiusMm: 35.0
    },

    // 8. Linking Parameters & Clearance Cylinders
    linkingParameters: {
      clearanceAreaType: 'cylinder', // 'cylinder' | 'plane'
      clearanceRadiusMm: (preset.cylinderDiameter / 2.0) + 20.0,
      retractRadiusMm: (preset.cylinderDiameter / 2.0) + 5.0,
      feedEngagementRadiusMm: (preset.cylinderDiameter / 2.0) + 2.0,
      leadInType: 'tangent_arc', // 'tangent_arc' | 'direct' | 'helical'
      leadInRadiusMm: 4.0,
      leadOutType: 'tangent_arc',
      leadOutRadiusMm: 4.0,
      transitionBetweenPasses: 'blend_loop' // 'blend_loop' | 'direct' | 'retract_cylinder'
    },

    // 9. Machine Kinematics & Post Dialect
    machineKinematics: {
      kinematicsType: 'rotary_4th_axis',
      rotaryAxisLetter: 'A', // 'A', 'B', 'C'
      postDialect: preset.postDialect || 'fanuc', // 'fanuc', 'haas', 'siemens', 'heidenhain'
      cylindricalInterpEnabled: preset.cylindricalInterp ?? true, // G107 / G07.1
      feedMode: preset.feedMode || 'deg_per_min', // 'deg_per_min' (G94) | 'inverse_time' (G93)
      maxRotaryVelocityDegSec: 200.0,
      enableAICC2Lookahead: true
    },

    // 10. Arc Filter & Tolerance
    arcFilter: {
      totalToleranceMm: 0.015,
      cutToleranceMm: 0.010,
      filterArcsInRotary: false,
      linearizeRotaryMoves: true,
      maxAngularSegmentDeg: 5.0
    },

    // 11. Planes (WCS) & Coolant
    planesCoolant: {
      wcs: 'Top (G54)',
      toolPlane: 'Top (G17)',
      compPlane: 'Top (G17)',
      coolantFlood: true,
      coolantMist: false,
      coolantThruSpindle: false,
      airBlast: false,
      operatorMessage: '4-AXIS ROTARY CYLINDRICAL MILLING PASS'
    }
  };
}

/**
 * Calculates recommended cutting settings based on material and tool
 */
export function calculateRecommendedRotarySettings({
  materialKey = 'ALU_6061',
  tool = {},
  cylinderDiameter = 60.0
}) {
  const mat = ROTARY_4AXIS_MATERIALS[materialKey?.toUpperCase()] || ROTARY_4AXIS_MATERIALS.ALU_6061;
  const dia = Math.max(1, Number(tool?.diameter) || 10);
  const flutes = Math.max(1, Number(tool?.flutes) || 2);

  // Compute RPM based on tool diameter & material Vc
  const targetRpm = Math.min(24000, Math.max(1200, Math.round((mat.vc * 1000) / (Math.PI * dia))));
  // Compute linear feed based on chip load
  const targetFeed = Math.min(8000, Math.max(200, Math.round(targetRpm * flutes * (mat.fzNominal || 0.06))));

  return {
    spindleSpeed: targetRpm,
    feedRate: targetFeed,
    plungeRate: Math.round(targetFeed * 0.3),
    stepoverDeg: mat.recommendedStepoverDeg || 3.5,
    stepoverMm: mat.recommendedStepoverMm || 1.2,
    numberOfPasses: mat.recommendedPasses || 30,
    materialKey: mat.id,
    cylinderDiameter
  };
}
