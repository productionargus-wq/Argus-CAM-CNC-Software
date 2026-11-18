/**
 * Mastercam-Authentic 3D Surface Rough Pocket Configuration & Physics Schema
 * Authoritative taxonomy, defaults, and physical calculations matching Mastercam Mill 3D Roughing.
 *
 * Pure ES module (safe in both Vite browser runtime and Node unit tests).
 */

/**
 * Intelligently resolve the most appropriate default roughing cutter from available tools.
 * Avoids picking large face mills (e.g. 50mm shell mills) for 3D pocket cavity milling.
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

export const POCKET_ROUGH_MATERIALS = {
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
    desc: 'High-speed aggressive pocket cavity clearing; rapid chip evacuation at high spindle RPM.'
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
    desc: 'Medium-hard alloy steel; constant overlap spiral prevents cutter overload in deep mold cavities.'
  },
  TITANIUM: {
    id: 'titanium',
    name: 'Titanium Ti-6Al-4V (Grade 5)',
    category: 'Aerospace Superalloy',
    hardness: '36 HRC',
    kc: 2800,
    recommendedStepoverPct: 40,
    recommendedStepdownMm: 1.0,
    vc: 65,
    fzNominal: 0.05,
    desc: 'Low thermal conductivity; moderate stepover with continuous flood coolant.'
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
    desc: 'Work-hardening alloy; constant cutting speed and positive helical ramp entry.'
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
    desc: 'High ductility; spiral inside-out clearing avoids dwell and work-hardening.'
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
    desc: 'Abrasive tool steel; constant engagement spiral motion prevents chipping.'
  }
};

export const POCKET_ROUGH_PRESETS = [
  {
    id: 'alu_high_speed_pocket',
    label: 'Alu 6061 High-Speed Pocket',
    materialKey: 'ALU_6061',
    stepoverPct: 65,
    stepdownMm: 3.0,
    cuttingStyle: 'constant_overlap_spiral',
    rampAngle: 3.0,
    spindleSpeed: 10000,
    feedRate: 3500,
    plungeRate: 800,
    desc: 'High volumetric clearing for aluminum pocket cavities'
  },
  {
    id: 'steel_mold_pocket',
    label: '4140 Mold Cavity Spiral',
    materialKey: 'STEEL_4140',
    stepoverPct: 50,
    stepdownMm: 1.5,
    cuttingStyle: 'constant_overlap_spiral',
    rampAngle: 2.5,
    spindleSpeed: 4500,
    feedRate: 1500,
    plungeRate: 400,
    desc: 'Equidistant spiral pocket clearing in pre-hardened mold steel'
  },
  {
    id: 'ti_aerospace_pocket',
    label: 'Titanium Pocket Cavity',
    materialKey: 'TITANIUM',
    stepoverPct: 35,
    stepdownMm: 1.0,
    cuttingStyle: 'parallel_spiral',
    rampAngle: 2.0,
    spindleSpeed: 1800,
    feedRate: 450,
    plungeRate: 180,
    desc: 'Controlled low-heat pocketing for aerospace Ti-6Al-4V'
  },
  {
    id: 'truespiral_die_pocket',
    label: 'TrueSpiral Die Cavity',
    materialKey: 'STEEL_4140',
    stepoverPct: 55,
    stepdownMm: 1.8,
    cuttingStyle: 'true_spiral',
    rampAngle: 3.0,
    spindleSpeed: 5000,
    feedRate: 1800,
    plungeRate: 450,
    desc: 'Smooth curvature TrueSpiral motion minimizing sharp direction reversals'
  },
  {
    id: 'zigzag_rough_clearing',
    label: 'Zigzag Bi-Directional Pocket',
    materialKey: 'ALU_6061',
    stepoverPct: 70,
    stepdownMm: 2.5,
    cuttingStyle: 'zigzag',
    rampAngle: 3.5,
    spindleSpeed: 8000,
    feedRate: 2800,
    plungeRate: 600,
    desc: 'Bi-directional parallel raster passes with perimeter cleanup'
  }
];

export function resolvePocketRoughMachineCapabilities(activeMachine = {}) {
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
 * Calculates physics metrics for 3D Surface Rough Pocket milling.
 */
export function calculatePocketRoughPhysics(tool = {}, cutParams = {}, materialKey = 'ALU_6061') {
  const mat = POCKET_ROUGH_MATERIALS[materialKey.toUpperCase()] || POCKET_ROUGH_MATERIALS.ALU_6061;
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

  // 4. Specific cutting force corrected for chip thickness: kc = kc_1.1 * (hm)^(-mc), approx kc * (0.2 / hm)^0.25
  const chipCorrection = hm > 0 ? Math.pow(0.2 / Math.max(0.02, hm), 0.22) : 1.0;
  const kcCorrected = Math.round(mat.kc * Math.min(2.5, Math.max(0.8, chipCorrection)));

  // 5. Tangential cutting force Fc = ap * ae * kc (N)
  // For multi-tooth milling, active engagement fraction = ae / (pi * d)
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
 * Creates default state for Surface Rough Pocket modal matching Mastercam 2025.
 */
export function createDefaultPocketRoughState(context = {}) {
  const {
    activeMachine = null,
    currentModel = null,
    stockConfig = null,
    tool = null,
    tools = []
  } = context;

  const caps = resolvePocketRoughMachineCapabilities(activeMachine);
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
    name: 'Surface Rough Pocket',
    strategyKey: 'surface_rough_pocket',
    badgeClass: 'rough_pocket',
    opType: 'pocket',
    comment: 'Mastercam Surface Rough Pocket - 3D Cavity Constant-Z Spiral Roughing',

    // Active Tree Navigation Tab
    activeTreePage: 'cut_parameters',

    // Material & Preset
    selectedPresetId: 'alu_high_speed_pocket',
    selectedMaterialKey: 'ALU_6061',

    // 1. Toolpath Type Page
    toolpathType: {
      type: 'surface_rough_pocket',
      isRoughing: true,
      subType: 'pocket'
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
      workholdingEntitiesCount: 0,
      displayRemainder: true,
      displayRemainderValue: 15,
      machiningGeometry: [
        { id: 1, name: 'machining', entities: 65, wallStock: 0.5, floorStock: 0.5, color: '#22c55e' }
      ],
      avoidanceGeometry: [
        { id: 1, name: 'avoidance', entities: 0, wallStock: 0.0, floorStock: 0.0, color: '#ef4444' }
      ]
    },

    // 3. Toolpath Control Page
    toolpathControl: {
      boundaryChainsCount: 0,
      strategy: 'stay_inside', // 'stay_inside' (pocket) | 'from_outside' (core)
      contain: 'tool_tip', // 'tool_tip' | 'tool_contact_point'
      compensateTo: 'center', // 'inside' | 'center' | 'outside'
      offsetDistance: 0.0,
      includeToolRadius: true,
      totalOffsetDistance: 0.0,
      approxStartPoint: null,
      curvesCount: 0,
      pointsCount: 0
    },

    // 4. Tool Page
    tool: {
      id: defaultTool.id || 361,
      number: defaultTool.number || 361,
      name: defaultTool.name || '10mm Bull Endmill R1.0',
      diameter: toolDiam,
      cornerRadius: Number(defaultTool.cornerRadius || 1.0),
      headNumber: 0,
      lengthOffset: defaultTool.lengthOffset ?? defaultTool.number ?? 361,
      diameterOffset: defaultTool.diameterOffset ?? defaultTool.number ?? 361,
      rctf: false,
      spindleDirection: 'CW',
      feedRate: defaultTool.feedRate || 1800,
      spindleSpeed: defaultTool.spindleSpeed || 5000,
      fpt: Number(defaultTool.fpt || 0.09),
      sfm: Number(defaultTool.sfm || 515),
      plungeRate: defaultTool.plungeRate || 450,
      retractRate: defaultTool.retractRate || 2500,
      forceToolChange: false,
      rapidRetract: true,
      toolInspectionChange: false,
      forceRetractEveryInches: 400.0,
      forceRetractEveryMinutes: 40.0,
      toBatch: false,
      comment: '',
      coolant: 'flood',
      cs: Math.round((Math.PI * toolDiam * (defaultTool.spindleSpeed || 5000)) / 1000)
    },

    // 5. Holder Page
    holder: {
      name: 'BT30 / ER32 Precision Collet Chuck',
      type: 'BT30',
      projection: 45.0,
      collisionCheck: true
    },

    // 6. Stock Page (Rest Milling)
    stock: {
      restMaterial: false,
      computeRemainingStockFrom: 'previous_operations',
      previousOperationsGroup: 'all_groups'
    },

    // 7. Cut Parameters Page
    cutParameters: {
      cuttingMethod: 'climb', // 'climb' | 'conventional' | 'bidirectional'
      tipCompensation: 'tip', // 'tip' | 'center'
      optimizeStepdowns: 'depth', // 'depth' | 'material'
      stepoverPct: recStepoverPct,
      stepoverMm: recStepoverMm,
      stepdownMm: recStepdown,
      cutOrder: 'by_depth', // 'by_depth' | 'by_pocket'
      roughingAngle: 0.0,
      cornerRoundingRadius: 0.5
    },

    // 8. Pocket Parameters Page (Child of Cut Parameters)
    pocketParameters: {
      cuttingStyle: 'constant_overlap_spiral', // 'constant_overlap_spiral' | 'parallel_spiral' | 'morph_spiral' | 'true_spiral' | 'zigzag' | 'one_way'
      spiralDirection: 'inside_out', // 'inside_out' | 'outside_in'
      islandAvoidance: true,
      islandClearanceMm: 0.5,
      finishPassEnabled: true,
      finishPassWidth: 0.35,
      finishFeedRate: 1200,
      cleanCorners: true,
      pocketOverlapPct: 15.0
    },

    // 9. Transitions Page (Child of Cut Parameters)
    transitions: {
      entryMethod: 'helical_ramp', // 'helical_ramp' | 'linear_ramp' | 'plunge'
      helicalRadiusMin: Number((toolDiam * 0.25).toFixed(1)),
      helicalRadiusMax: Number((toolDiam * 0.45).toFixed(1)),
      rampAngle: 3.0,
      rampPitch: 2.0,
      plungeClearance: 2.0,
      entryFeedRate: 450,
      fallbackToPlunge: true
    },

    // 10. Steep / Shallow Page (Child of Cut Parameters)
    steepShallow: {
      useZDepths: true,
      minimumDepth: modelZMax,
      maximumDepth: modelZMin
    },

    // 11. Linking Parameters Page
    linkingParameters: {
      clearancePlane: 25.0,
      clearanceType: 'absolute', // 'absolute' | 'incremental'
      retractPlane: 5.0,
      retractType: 'incremental',
      feedPlane: 2.5,
      feedType: 'incremental',
      topOfStock: modelZMax,
      depth: modelZMin,
      depthType: 'absolute'
    },

    // 12. Arc Filter / Tolerance Page
    arcFilterTolerance: {
      totalTolerance: 0.025,
      cutToleranceRatio: 60,
      arcFilterRatio: 40,
      lineArcFiltering: true,
      createArcsInXY: true,
      minArcRadius: 0.1,
      maxArcRadius: 1000.0
    },

    // 13. Planes (WCS) Page
    planes: {
      wcs: 'Top',
      toolPlane: 'Top',
      compPlane: 'Top'
    },

    // 14. Coolant Page
    coolant: {
      mode: 'flood', // 'flood' | 'mist' | 'thru' | 'air' | 'dual' | 'off'
      airBlast: false,
      thruSpindle: false
    },

    // 15. Canned Text Page
    cannedText: {
      preOp: 'none', // 'none' | 'm00' | 'm01'
      toolInspect: 'none',
      postOp: 'none'
    }
  };
}
