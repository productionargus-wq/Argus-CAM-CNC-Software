/**
 * Mastercam-Authentic 3D Surface Rough Waterline Configuration & Physics Schema
 * Authoritative taxonomy, defaults, and physical calculations matching Mastercam Mill 3D Roughing.
 *
 * Pure ES module (safe in both Vite browser runtime and Node unit tests).
 */

/**
 * Intelligently resolve the most appropriate default roughing cutter from available tools.
 * Avoids picking large face mills (e.g. 50mm shell mills) for 3D waterline roughing.
 */
export function resolveDefaultRoughingTool(tools = []) {
  if (!Array.isArray(tools) || tools.length === 0) return null;
  // 1. Prefer flat, bull or roughing endmill with diameter <= 20mm
  const bestRougher = tools.find(
    (t) => (t.type === 'flat' || t.type === 'bull' || t.type === 'endmill' || t.type === 'roughing') && Number(t.diameter) <= 20
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

export const WATERLINE_ROUGH_MATERIALS = {
  ALU_6061: {
    id: 'alu_6061',
    name: 'Aluminum 6061-T6 Aerospace',
    category: 'Non-Ferrous Alloy',
    hardness: '95 HB',
    kc: 750, // Specific cutting force N/mm2
    recommendedStepoverPct: 65, // 65% cutter diameter
    recommendedStepdownMm: 2.5,
    vc: 450, // m/min
    fzNominal: 0.10, // mm/tooth
    desc: 'High-speed aggressive waterline clearing; rapid chip evacuation along continuous concentric offset loops.'
  },
  STEEL_P20: {
    id: 'steel_p20',
    name: 'P20 Mold & Die Tool Steel',
    category: 'Alloy Tool Steel',
    hardness: '32 HRC',
    kc: 2200,
    recommendedStepoverPct: 50,
    recommendedStepdownMm: 1.5,
    vc: 130,
    fzNominal: 0.07,
    desc: 'Standard plastic injection mold cavity steel; constant-Z waterline slicing ensures uniform finish stock.'
  },
  STEEL_4140: {
    id: 'steel_4140',
    name: 'AISI 4140 Pre-Hardened Alloy Steel',
    category: 'Alloy Steel',
    hardness: '30 HRC',
    kc: 2100,
    recommendedStepoverPct: 50,
    recommendedStepdownMm: 1.5,
    vc: 140,
    fzNominal: 0.07,
    desc: 'Medium-hard alloy steel; constant-Z contour roughing balances cutter load.'
  },
  TITANIUM: {
    id: 'titanium',
    name: 'Titanium Ti-6Al-4V (Grade 5)',
    category: 'Aerospace Superalloy',
    hardness: '36 HRC',
    kc: 2800,
    recommendedStepoverPct: 35,
    recommendedStepdownMm: 0.8,
    vc: 65,
    fzNominal: 0.05,
    desc: 'Low thermal conductivity; climb waterline rings with high-pressure coolant to prevent heat buildup.'
  },
  INCONEL: {
    id: 'inconel',
    name: 'Inconel 718 Nickel Superalloy',
    category: 'Heat-Resistant Superalloy',
    hardness: '42 HRC',
    kc: 3200,
    recommendedStepoverPct: 35,
    recommendedStepdownMm: 0.6,
    vc: 45,
    fzNominal: 0.04,
    desc: 'Work-hardening alloy; constant linear feed and positive helical ramp plunge entry.'
  },
  STAINLESS_304: {
    id: 'stainless_304',
    name: 'AISI 304 Austenitic Stainless Steel',
    category: 'Stainless Steel',
    hardness: '180 HB',
    kc: 2400,
    recommendedStepoverPct: 45,
    recommendedStepdownMm: 1.2,
    vc: 110,
    fzNominal: 0.06,
    desc: 'Austenitic stainless; rigid waterline passes prevent rubbing and work hardening on cavity walls.'
  }
};

export const WATERLINE_ROUGH_PRESETS = [
  {
    id: 'alu_hsm_waterline',
    name: 'Alu 6061 High-Speed Waterline Rough',
    materialKey: 'ALU_6061',
    toolType: 'flat',
    stepoverPct: 65,
    stepdownMm: 2.5,
    cuttingMethod: 'climb',
    cutDirection: 'outside_in',
    wallStock: 0.50,
    floorStock: 0.50,
    helicalRadius: 4.0,
    rampPitch: 2.0,
    cleanWalls: true,
    desc: 'High-speed constant-Z contour clearing with helical plunge entry and perimeter wall cleanup.'
  },
  {
    id: 'p20_mold_waterline',
    name: 'P20 Mold Cavity Constant-Z Rough',
    materialKey: 'STEEL_P20',
    toolType: 'bull',
    stepoverPct: 50,
    stepdownMm: 1.5,
    cuttingMethod: 'climb',
    cutDirection: 'outside_in',
    wallStock: 0.50,
    floorStock: 0.50,
    helicalRadius: 3.5,
    rampPitch: 1.5,
    cleanWalls: true,
    desc: 'Plastic injection mold core/cavity constant-Z roughing with bull endmill.'
  },
  {
    id: 'stainless_waterline',
    name: 'Stainless 304 Heavy Waterline Rough',
    materialKey: 'STAINLESS_304',
    toolType: 'flat',
    stepoverPct: 45,
    stepdownMm: 1.2,
    cuttingMethod: 'climb',
    cutDirection: 'outside_in',
    wallStock: 0.60,
    floorStock: 0.40,
    helicalRadius: 3.0,
    rampPitch: 1.0,
    cleanWalls: true,
    desc: 'Conservative climb waterline offset rings to minimize tool deflection in tough stainless.'
  },
  {
    id: 'titanium_aerospace_waterline',
    name: 'Ti-6Al-4V Aerospace Constant-Z Rough',
    materialKey: 'TITANIUM',
    toolType: 'bull',
    stepoverPct: 35,
    stepdownMm: 0.8,
    cuttingMethod: 'climb',
    cutDirection: 'inside_out',
    wallStock: 0.40,
    floorStock: 0.40,
    helicalRadius: 2.5,
    rampPitch: 0.8,
    cleanWalls: true,
    desc: 'Light radial engagement waterline pass rings for titanium structural pockets.'
  }
];

export const WATERLINE_ROUGH_PAGE_TITLES = {
  toolpath_type: 'Toolpath Type',
  model_geometry: 'Model Geometry',
  toolpath_control: 'Toolpath Control',
  tool: 'Tool Selection & Cutting Dynamics',
  holder: 'Holder Definition',
  stock: 'Stock Model Definition',
  cut_parameters: 'Cut Parameters',
  waterline_parameters: 'Waterline Parameters',
  steep_shallow: 'Steep / Shallow',
  transitions: 'Transitions & Entry Dynamics',
  linking_parameters: 'Linking Parameters',
  arc_filter: 'Arc Filter / Tolerance & CNC Lookahead',
  planes: 'Planes (WCS)',
  coolant: 'Coolant Management',
  canned_text: 'Canned Text & Machine Comments'
};

/**
 * Calculates real-time Machining Physics for 3D Surface Rough Waterline.
 */
export function calculateWaterlineRoughPhysics(tool = {}, cutParams = {}, materialKey = 'ALU_6061') {
  const mat = WATERLINE_ROUGH_MATERIALS[materialKey] || WATERLINE_ROUGH_MATERIALS.ALU_6061;
  const d = Math.max(1.0, Number(tool.diameter || 10.0));
  const z = Math.max(1, Number(tool.flutes || 4));
  const rpm = Math.max(100, Number(tool.spindleSpeed || 5000));
  const feed = Math.max(10, Number(tool.feedRate || 1800));

  const stepoverPct = Math.max(10, Math.min(95, Number(cutParams.stepoverPct || 60)));
  const ae = Math.max(0.1, (d * stepoverPct) / 100);
  const ap = Math.max(0.1, Number(cutParams.stepdownMm || 2.0));

  // Cutting Speed Vc (m/min)
  const vc = (Math.PI * d * rpm) / 1000;

  // Feed per tooth fz (mm/tooth)
  const fz = feed / (rpm * z);

  // Average Chip Thickness hm (mm)
  const engagementRatio = Math.min(1.0, ae / d);
  const hm = fz * Math.sqrt(engagementRatio);

  // Material Removal Rate MRR (cm3/min)
  const mrr = (ap * ae * feed) / 1000;

  // Specific Cutting Force kc (N/mm2) adjusted for chip thinning
  const kcEffective = mat.kc * Math.pow(Math.max(0.01, hm) / 0.1, -0.25);

  // Tangential Cutting Force Fc (N)
  const fc = kcEffective * ap * hm;

  // Cutting Power Pc (kW) (80% spindle efficiency)
  const powerKw = (fc * vc) / (60000 * 0.80);

  // Spindle Torque (Nm)
  const torqueNm = (9550 * powerKw) / Math.max(10, rpm);

  return {
    surfaceSpeedMpm: Math.round(vc),
    feedPerToothMm: Number(fz.toFixed(4)),
    averageChipThicknessMm: Number(hm.toFixed(4)),
    mrrCm3Min: Number(mrr.toFixed(1)),
    cuttingForceN: Math.round(fc),
    powerKw: Number(powerKw.toFixed(2)),
    torqueNm: Number(torqueNm.toFixed(2)),
    materialName: mat.name,
    kcBase: mat.kc
  };
}

/**
 * Resolves CNC Controller High-Speed Machining / Smoothing Codes.
 */
export function resolveWaterlineRoughMachineCaps(machine = {}) {
  const brand = String(machine.brand || machine.name || '').toLowerCase();
  if (brand.includes('fanuc') || brand.includes('robodrill')) {
    return {
      highSpeedSmoothingCode: 'G05.1 Q1 (HIGH SPEED AICC II LOOK-AHEAD ACCEL/DECEL)',
      smoothingOffCode: 'G05.1 Q0',
      feedMode: 'G94',
      requiresAbsoluteArcCenters: true
    };
  }
  if (brand.includes('haas')) {
    return {
      highSpeedSmoothingCode: 'G187 P2 (HAAS HIGH SPEED SMOOTHING - MEDIUM)',
      smoothingOffCode: 'G187',
      feedMode: 'G94',
      requiresAbsoluteArcCenters: false
    };
  }
  if (brand.includes('siemens') || brand.includes('sinumerik')) {
    return {
      highSpeedSmoothingCode: 'CYCLE832(0.025, 1, 1) ; HIGH SPEED SURFACE CYCLE',
      smoothingOffCode: 'CYCLE832()',
      feedMode: 'G94',
      requiresAbsoluteArcCenters: false
    };
  }
  if (brand.includes('heidenhain')) {
    return {
      highSpeedSmoothingCode: 'CYCL DEF 32.0 TOLERANCE \nCYCL DEF 32.1 T0.025',
      smoothingOffCode: 'CYCL DEF 32.0 TOLERANCE \nCYCL DEF 32.1 T0',
      feedMode: 'F AUTO',
      requiresAbsoluteArcCenters: false
    };
  }
  return {
    highSpeedSmoothingCode: 'G05.1 Q1 (HIGH SPEED SMOOTHING ON)',
    smoothingOffCode: 'G05.1 Q0',
    feedMode: 'G94',
    requiresAbsoluteArcCenters: true
  };
}

/**
 * Creates default Form State for Surface Rough Waterline Modal.
 */
export function createDefaultWaterlineRoughState(context = {}) {
  const {
    activeMachine = { brand: 'Fanuc', name: 'Fanuc Robodrill D21' },
    stockConfig = { dimensions: { x: 120, y: 80, z: 25 }, height: 25 },
    tools = [],
    currentModel = null
  } = context;

  const caps = resolveWaterlineRoughMachineCaps(activeMachine);
  const defaultTool = resolveDefaultRoughingTool(tools) || {
    id: 3,
    number: 3,
    name: '10mm 4-Flute Flat Endmill (Finisher)',
    type: 'flat',
    diameter: 10.0,
    cornerRad: 0.0,
    flutes: 4,
    spindleSpeed: 12000,
    feedRate: 4800,
    plungeRate: 450,
    retractRate: 5000,
    sfm: 515
  };

  const toolDiam = Number(defaultTool.diameter || 10.0);
  const recStepoverPct = 60.0;
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
    name: 'Surface Rough Waterline',
    strategyKey: 'surface_rough_waterline',
    badgeClass: 'rough_waterline',
    opType: 'waterline',
    visible: true,

    // Preset & Material
    selectedPresetId: 'alu_hsm_waterline',
    selectedMaterialKey: 'ALU_6061',

    // 1. Toolpath Type Page
    toolpathType: {
      category: '3D Roughing',
      type: 'surface_rough_waterline',
      label: 'Surface Rough Waterline',
      description: 'Multi-level constant-Z contour clearing with nested offset rings and boundary cleanup'
    },

    // 2. Model Geometry Page
    modelGeometry: {
      driveSurfacesCount: 65,
      avoidanceSurfacesCount: 0,
      wallStock: 0.50,
      floorStock: 0.50,
      sameWallAndFloorStock: true,
      tolerance: 0.025
    },

    // 3. Toolpath Control Page
    toolpathControl: {
      boundaryType: 'Silhouette Boundary',
      toolContainment: 'Inside', // Inside, Center, Outside, Silhouette
      compensationType: 'Computer', // Computer, Control, Wear, Reverse Wear, Off
      approximateChainsCount: 1,
      minZDepth: modelZMin,
      maxZDepth: modelZMax
    },

    // 4. Tool Page
    tool: {
      id: defaultTool.id || 3,
      number: defaultTool.number || 3,
      name: defaultTool.name || '10mm Flat Endmill',
      diameter: Number(defaultTool.diameter || 10.0),
      cornerRad: Number(defaultTool.cornerRad ?? defaultTool.cornerRadius ?? 0.0),
      flutes: Number(defaultTool.flutes || 4),
      lengthOffset: defaultTool.number || 3,
      diameterOffset: defaultTool.number || 3,
      spindleSpeed: defaultTool.spindleSpeed || 12000,
      feedRate: defaultTool.feedRate || 4800,
      plungeRate: defaultTool.plungeRate || 450,
      retractRate: defaultTool.retractRate || 5000,
      rapidRetract: true
    },

    // 5. Holder Page
    holder: {
      type: 'CAT40',
      description: 'CAT40 ER32 Precision Collet Chuck (70mm Gauge Length)',
      gaugeLength: 70.0,
      overhang: 35.0,
      collarDiameter: 42.0
    },

    // 6. Stock Page
    stock: {
      useStock: true,
      stockSource: 'Workpiece Stock Dimensions',
      stockAllowanceXY: 0.50,
      stockAllowanceZ: 0.50,
      trimToStock: true
    },

    // 7. Cut Parameters Page
    cutParameters: {
      stepdownMm: recStepdown,
      stepoverPct: recStepoverPct,
      stepoverMm: recStepoverMm,
      cuttingMethod: 'climb', // 'climb' or 'conventional'
      cutDirection: 'outside_in', // 'outside_in' (cavity) or 'inside_out' (core)
      cutOrder: 'optimize', // 'optimize' or 'top_to_bottom'
      subProgramOutput: false
    },

    // 8. Waterline Parameters Page
    waterlineParameters: {
      detectCriticalDepths: true,
      detectFlatSurfaces: true,
      cleanWalls: true,
      wallCleanupStepoverPct: 35,
      minToolpathRadiusMm: 0.50,
      cornerSmoothing: true,
      allowIslandStepdown: true
    },

    // 9. Steep / Shallow Page
    steepShallow: {
      limitAnglesEnabled: false,
      minimumSlopeAngleDeg: 0.0,
      maximumSlopeAngleDeg: 90.0,
      minimumDepth: 0.0,
      maximumDepth: modelZMin
    },

    // 10. Transitions Page
    transitions: {
      entryMethod: 'helical_ramp', // 'helical_ramp', 'linear_ramp', 'direct_plunge'
      helicalRadius: 4.0,
      rampPitch: 2.0,
      rampAngleDeg: 3.0,
      minRampDistance: 5.0,
      plungeClearance: 1.0
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
      wcs: 'Top (G54)',
      toolPlane: 'Top (G17)',
      compPlane: 'Top (G17)'
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
      stopBeforeOp: false,
      optionalStop: false,
      blockDelete: false,
      operatorMessage: '3D CONSTANT-Z WATERLINE ROUGHING'
    }
  };
}
