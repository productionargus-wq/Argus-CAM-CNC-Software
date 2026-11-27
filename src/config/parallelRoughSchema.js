/**
 * Mastercam-Authentic 3D Surface Rough Parallel Configuration & Physics Schema
 * Authoritative taxonomy, defaults, and physical calculations matching Mastercam Mill 3D Roughing.
 *
 * Pure ES module (safe in both Vite browser runtime and Node unit tests).
 */

/**
 * Intelligently resolve the most appropriate default roughing cutter from available tools.
 * Avoids picking large face mills (e.g. 50mm shell mills) for 3D parallel raster roughing.
 */
export function resolveDefaultRoughingTool(tools = []) {
  if (!Array.isArray(tools) || tools.length === 0) return null;
  // 1. Prefer flat or bull endmill with diameter <= 20mm
  const bestRougher = tools.find(
    (t) => (t.type === 'flat' || t.type === 'bull' || t.type === 'endmill') && Number(t.diameter) <= 20
  );
  if (bestRougher) return bestRougher;

  // 2. Any flat or bull endmill
  const anyEndmill = tools.find((t) => t.type === 'flat' || t.type === 'bull' || t.type === 'endmill');
  if (anyEndmill) return anyEndmill;

  // 3. Any non-face tool <= 25mm
  const smallCutter = tools.find((t) => t.type !== 'face' && Number(t.diameter) <= 25);
  if (smallCutter) return smallCutter;

  return tools[0];
}

export const PARALLEL_ROUGH_MATERIALS = {
  ALU_6061: {
    id: 'alu_6061',
    name: 'Aluminum 6061-T6 Aerospace',
    category: 'Non-Ferrous Alloy',
    hardness: '95 HB',
    kc: 750, // Specific cutting force N/mm2
    recommendedStepoverPct: 65, // 65% cutter diameter
    recommendedStepdownMm: 3.0,
    vc: 450, // m/min
    fzNominal: 0.10, // mm/tooth
    desc: 'High-speed aggressive parallel raster clearing; rapid chip evacuation along continuous linear strokes.'
  },
  STEEL_4140: {
    id: 'steel_4140',
    name: 'AISI 4140 Pre-Hardened Tool Steel',
    category: 'Alloy Tool Steel',
    hardness: '30 HRC',
    kc: 2100,
    recommendedStepoverPct: 50,
    recommendedStepdownMm: 1.5,
    vc: 140,
    fzNominal: 0.07,
    desc: 'Medium-hard alloy steel; cross-hatch parallel roughing balances cutter load and prevents harmonic chatter.'
  },
  TITANIUM: {
    id: 'titanium',
    name: 'Titanium Ti-6Al-4V (Grade 5)',
    category: 'Aerospace Superalloy',
    hardness: '36 HRC',
    kc: 2800,
    recommendedStepoverPct: 35,
    recommendedStepdownMm: 1.0,
    vc: 65,
    fzNominal: 0.05,
    desc: 'Low thermal conductivity; one-way climb parallel cuts with high-pressure coolant to avoid heat build-up.'
  },
  INCONEL: {
    id: 'inconel',
    name: 'Inconel 718 Nickel Superalloy',
    category: 'Heat-Resistant Superalloy',
    hardness: '42 HRC',
    kc: 3200,
    recommendedStepoverPct: 35,
    recommendedStepdownMm: 0.8,
    vc: 45,
    fzNominal: 0.04,
    desc: 'Work-hardening alloy; constant linear feed and positive helical plunge entry.'
  },
  STAINLESS_304: {
    id: 'stainless_304',
    name: 'AISI 304 Austenitic Stainless',
    category: 'Stainless Steel',
    hardness: '180 HB',
    kc: 2300,
    recommendedStepoverPct: 45,
    recommendedStepdownMm: 1.2,
    vc: 110,
    fzNominal: 0.06,
    desc: 'High ductility; continuous zigzag parallel passes avoid dwell and work-hardening.'
  },
  TOOL_STEEL_D2: {
    id: 'tool_steel_d2',
    name: 'D2 High-Carbon Die Steel',
    category: 'Cold-Work Die Steel',
    hardness: '55 HRC',
    kc: 3100,
    recommendedStepoverPct: 40,
    recommendedStepdownMm: 1.0,
    vc: 80,
    fzNominal: 0.05,
    desc: 'Abrasive tool steel; cross-hatch raster motion prevents concentrated cutter wear.'
  }
};

export const PARALLEL_ROUGH_PRESETS = [
  {
    id: 'alu_high_speed_parallel',
    label: 'Alu 6061 High-Speed Parallel Raster',
    materialKey: 'ALU_6061',
    machiningAngle: 0.0,
    stepoverPct: 65,
    stepdownMm: 3.0,
    cuttingMethod: 'zigzag',
    crossHatch: false,
    cleanBoundaries: true,
    rampAngle: 3.0,
    spindleSpeed: 10000,
    feedRate: 3500,
    plungeRate: 800,
    desc: 'Rapid parallel linear raster clearing along X-axis for aluminum molds'
  },
  {
    id: 'steel_mold_crosshatch',
    label: '4140 Mold Cross-Hatch 90°',
    materialKey: 'STEEL_4140',
    machiningAngle: 0.0,
    stepoverPct: 50,
    stepdownMm: 1.5,
    cuttingMethod: 'zigzag',
    crossHatch: true,
    cleanBoundaries: true,
    rampAngle: 2.5,
    spindleSpeed: 4500,
    feedRate: 1500,
    plungeRate: 400,
    desc: 'Alternating 90° cross-hatch roughing per Z-stepdown in tool steel'
  },
  {
    id: 'ti_aerospace_oneway',
    label: 'Titanium One-Way Climb Raster',
    materialKey: 'TITANIUM',
    machiningAngle: 0.0,
    stepoverPct: 35,
    stepdownMm: 1.0,
    cuttingMethod: 'one_way',
    crossHatch: false,
    cleanBoundaries: true,
    rampAngle: 2.0,
    spindleSpeed: 1800,
    feedRate: 450,
    plungeRate: 180,
    desc: 'Strict climb one-way parallel roughing with rapid returns for Ti-6Al-4V'
  },
  {
    id: 'diagonal_die_parallel',
    label: '45° Diagonal Parallel Rough',
    materialKey: 'STEEL_4140',
    machiningAngle: 45.0,
    stepoverPct: 55,
    stepdownMm: 1.8,
    cuttingMethod: 'zigzag',
    crossHatch: true,
    cleanBoundaries: true,
    rampAngle: 3.0,
    spindleSpeed: 5000,
    feedRate: 1800,
    plungeRate: 450,
    desc: '45° diagonal angled raster passes for complex contoured cavities'
  },
  {
    id: 'y_axis_rough_parallel',
    label: '90° Y-Axis Parallel Roughing',
    materialKey: 'ALU_6061',
    machiningAngle: 90.0,
    stepoverPct: 60,
    stepdownMm: 2.5,
    cuttingMethod: 'zigzag',
    crossHatch: false,
    cleanBoundaries: true,
    rampAngle: 3.5,
    spindleSpeed: 8000,
    feedRate: 2800,
    plungeRate: 600,
    desc: 'Parallel passes oriented along Y/Z machine axis with boundary contour'
  }
];

export function resolveParallelRoughMachineCapabilities(activeMachine = {}) {
  const brand = String(activeMachine?.brand || activeMachine?.name || '').toLowerCase();
  const isFanuc = brand.includes('fanuc') || brand.includes('robodrill');
  const isHaas = brand.includes('haas');
  const isHeidenhain = brand.includes('heidenhain');
  const isSiemens = brand.includes('siemens') || brand.includes('sinumerik');

  const maxRpm = Number(activeMachine?.maxSpindleRpm || activeMachine?.spindle?.maxRpm || 12000);
  const maxFeed = Number(activeMachine?.maxFeedRate || activeMachine?.rapidFeedRate || 24000);
  const machineName = activeMachine?.name || (isFanuc ? 'Fanuc Robodrill D21' : isHaas ? 'Haas VF-2' : 'Haas VF-2 (3-Axis)');

  return {
    machineName,
    isFanuc,
    isHaas,
    isHeidenhain,
    isSiemens,
    maxRpm,
    maxFeed,
    highSpeedSmoothingCode: isFanuc ? 'G05.1 Q1' : isHaas ? 'G187 P1' : isSiemens ? 'CYCLE832' : 'G05.1 Q1'
  };
}

/**
 * Calculates physics metrics for 3D Surface Rough Parallel milling.
 */
export function calculateParallelRoughPhysics(tool = {}, cutParams = {}, materialKey = 'ALU_6061') {
  const mat = PARALLEL_ROUGH_MATERIALS[materialKey.toUpperCase()] || PARALLEL_ROUGH_MATERIALS.ALU_6061;
  const d = Math.max(1, Number(tool.diameter || 10));
  const z = Math.max(1, Number(tool.flutes || 4));
  const rpm = Math.max(100, Number(tool.spindleSpeed || 5000));
  const feedRate = Math.max(50, Number(tool.feedRate || 1800));

  const stepoverPct = Math.max(5, Math.min(95, Number(cutParams.stepoverPct || mat.recommendedStepoverPct)));
  const ae = (d * stepoverPct) / 100;
  const ap = Math.max(0.2, Number(cutParams.stepdownMm ?? cutParams.stepdown ?? mat.recommendedStepdownMm));

  // 1. Cutting Speed Vc = (pi * D * n) / 1000  (m/min)
  const vc = Math.round((Math.PI * d * rpm) / 1000);

  // 2. Feed per tooth fz = Vf / (n * z) (mm/tooth)
  const fz = Number((feedRate / (rpm * z)).toFixed(3));

  // 3. Average chip thickness hm = fz * sqrt(ae / d) (mm)
  const ratio = Math.max(0.01, Math.min(1.0, ae / d));
  const hm = Number((fz * Math.sqrt(ratio)).toFixed(3));

  // 4. Specific cutting force corrected for chip thickness
  const chipCorrection = hm > 0 ? Math.pow(0.2 / Math.max(0.02, hm), 0.22) : 1.0;
  const kcCorrected = Math.round(mat.kc * Math.min(2.5, Math.max(0.8, chipCorrection)));

  // 5. Tangential cutting force Fc = ap * ae * kc (N)
  const activeTeeth = Math.max(1, z * (Math.acos(Math.max(-1, Math.min(1, 1 - (2 * ae / d)))) / (2 * Math.PI)));
  const fc = Math.round(ap * ae * (kcCorrected / 1000) * 10 * activeTeeth);

  // 6. Volumetric Material Removal Rate MRR = (ap * ae * Vf) / 1000 (cm3/min)
  const mrrCm3Min = Number(((ap * ae * feedRate) / 1000).toFixed(1));

  // 7. Spindle Power Pc = (Fc * Vc) / (60000 * eta), eta approx 0.85
  const powerKw = Number(((fc * vc) / (60000 * 0.85)).toFixed(2));

  // 8. Spindle Torque T = (9550 * Pc) / n (Nm)
  const torqueNm = Number(((9550 * powerKw) / rpm).toFixed(2));

  return {
    material: mat,
    cutterDiameter: d,
    vc,
    fz,
    hm,
    ae: Number(ae.toFixed(2)),
    ap: Number(ap.toFixed(2)),
    mrrCm3Min,
    fc,
    powerKw,
    torqueNm
  };
}

/**
 * Creates default state for Surface Rough Parallel modal matching Mastercam 2028.
 */
export function createDefaultParallelRoughState(context = {}) {
  const {
    activeMachine = null,
    currentModel = null,
    stockConfig = null,
    tool = null,
    tools = []
  } = context;

  const caps = resolveParallelRoughMachineCapabilities(activeMachine);
  const candidateTool = tool || resolveDefaultRoughingTool(tools);
  const defaultTool = candidateTool
    ? {
        id: candidateTool.id || candidateTool.number || 2,
        number: candidateTool.number || candidateTool.id || 2,
        name: candidateTool.name || `${candidateTool.diameter || 12}mm Flat Endmill`,
        diameter: Number(candidateTool.diameter || 12.0),
        cornerRadius: Number(candidateTool.cornerRadius ?? candidateTool.cornerRad ?? 0.0),
        flutes: Number(candidateTool.flutes || 4),
        spindleSpeed: Math.min(caps.maxRpm, Number(candidateTool.spindleSpeed || candidateTool.rpm || 5000)),
        feedRate: Number(candidateTool.feedRate || 1800),
        plungeRate: Number(candidateTool.plungeRate || 450),
        retractRate: Number(candidateTool.retractRate || 2500),
        lengthOffset: candidateTool.lengthOffset ?? candidateTool.number ?? 2,
        diameterOffset: candidateTool.diameterOffset ?? candidateTool.number ?? 2,
        rapidRetract: true,
        fpt: candidateTool.feedPerTooth ? Number(candidateTool.feedPerTooth) : 0.09,
        sfm: candidateTool.cuttingSpeedVc ? Number(candidateTool.cuttingSpeedVc) : 515
      }
    : {
        id: 361,
        number: 361,
        name: '10mm 4-Flute Bull Endmill R1.0',
        diameter: 10.0,
        cornerRadius: 1.0,
        flutes: 4,
        spindleSpeed: 5000,
        feedRate: 1800,
        plungeRate: 450,
        retractRate: 2500,
        lengthOffset: 361,
        diameterOffset: 361,
        rapidRetract: true,
        fpt: 0.09,
        sfm: 515
      };

  const toolDiam = Number(defaultTool.diameter || 10.0);
  const recStepoverPct = 65.0;
  const recStepoverMm = Number(((toolDiam * recStepoverPct) / 100).toFixed(2));
  const recStepdown = 2.0;

  let modelZMax = 0.0;
  let modelZMin = -25.0;
  if (currentModel?.box) {
    modelZMax = 0.0;
    const depth = currentModel.box.max.y - currentModel.box.min.y;
    modelZMin = -Number(depth.toFixed(2));
  } else if (stockConfig?.height) {
    modelZMax = 0.0;
    modelZMin = -Number(stockConfig.height);
  }

  return {
    id: null,
    name: 'Surface Rough Parallel',
    strategyKey: 'surface_rough_parallel',
    badgeClass: 'rough_parallel',
    opType: 'parallel',
    comment: 'Argus CAM Intelligence Surface Rough Parallel - 3D Multi-Level Raster Roughing',

    // Active Tree Navigation Tab
    activeTreePage: 'parallel_parameters',

    // Material & Preset
    selectedPresetId: 'alu_high_speed_parallel',
    selectedMaterialKey: 'ALU_6061',

    // 1. Toolpath Type Page
    toolpathType: {
      type: 'surface_rough_parallel',
      isRoughing: true,
      subType: 'parallel'
    },

    // 2. Model Geometry Page
    modelGeometry: {
      sameWallAndFloorStock: true,
      wallStock: 0.5,
      floorStock: 0.5,
      avoidanceWallStock: 0.0,
      avoidanceFloorStock: 0.0,
      machiningEntitiesCount: 65,
      avoidanceEntitiesCount: 0,
      driveSurfaceIds: [],
      avoidanceSurfaceIds: []
    },

    // 3. Toolpath Control Page
    toolpathControl: {
      toolContainment: 'compensate_to_tip',
      compensateTo: 'center', // center | inside | outside
      boundaryChainsCount: 0,
      approximateChainDistance: 0.0,
      skipBoundarySlices: false
    },

    // 4. Tool Page
    tool: defaultTool,

    // 5. Holder Page
    holder: {
      name: 'CAT40-ER32-075',
      type: 'CAT40',
      gageLength: 75.0,
      diameter: 50.0,
      protrusion: 45.0,
      fluteExtension: 30.0
    },

    // 6. Stock Page
    stock: {
      useStockModel: true,
      stockAllowanceTop: 2.0,
      stockAllowanceSides: 2.0,
      restMaterialSource: 'none',
      previousToolDiameter: 0
    },

    // 7. Cut Parameters Page
    cutParameters: {
      cuttingMethod: 'zigzag', // zigzag | one_way
      stepoverPct: recStepoverPct,
      stepoverMm: recStepoverMm,
      stepdownMm: recStepdown,
      climbMilling: true,
      toleranceMm: 0.025,
      rollAroundCorners: true,
      optimizeCutOrder: true
    },

    // 8. Parallel Parameters Page (Key Specific Mastercam Roughing Controls)
    parallelParameters: {
      machiningAngle: 0.0, // Degrees: 0 = X axis, 90 = Y axis, 45 = diagonal
      crossHatch: false,   // Alternate angle 90 degrees at each subsequent Z level
      cuttingMethod: 'zigzag', // zigzag | one_way
      cleanBoundaries: true,   // Add boundary cleanup pass along walls at each level
      stepoverPct: recStepoverPct,
      stepoverMm: recStepoverMm,
      stepdownMm: recStepdown
    },

    // 9. Transitions / Entry Page
    transitions: {
      entryMethod: 'helical_ramp', // helical_ramp | linear_ramp | plunge
      helicalRadius: 4.0,
      rampPitch: 2.0,
      rampAngle: 3.0,
      plungeClearance: 1.0,
      feedTransitionRate: 1200
    },

    // 10. Steep / Shallow Page
    steepShallow: {
      limitZDepths: true,
      maximumDepth: modelZMin,
      minimumDepth: modelZMax,
      detectFlatAreas: true,
      addCutsAtFlats: true
    },

    // 11. Linking Parameters Page
    linkingParameters: {
      clearancePlane: 25.0,
      clearanceMode: 'absolute',
      retractHeight: 5.0,
      retractMode: 'incremental',
      feedPlane: 2.5,
      feedPlaneMode: 'incremental',
      topOfStock: 0.0,
      topOfStockMode: 'absolute',
      depth: modelZMin,
      depthMode: 'absolute'
    },

    // 12. Arc Filter / Tolerance Page
    arcFilter: {
      totalToleranceMm: 0.025,
      cutToleranceMm: 0.015,
      arcFilterActive: true,
      smoothingCode: caps.highSpeedSmoothingCode,
      createArcsInXY: true,
      createArcsInXZ: false,
      createArcsInYZ: false
    },

    // 13. Planes (WCS) Page
    planes: {
      wcs: 'Top',
      cPlane: 'Top',
      toolPlane: 'Top'
    },

    // 14. Coolant Page
    coolant: {
      flood: true,
      mist: false,
      throughSpindle: false,
      airBlast: false
    },

    // 15. Canned Text Page
    cannedText: {
      bstop: false,
      m00BeforeOp: false,
      m01OptionalStop: true,
      blockDelete: false
    }
  };
}
