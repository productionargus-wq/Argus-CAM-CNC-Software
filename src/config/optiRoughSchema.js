/**
 * Mastercam-Authentic 3D High Speed Dynamic OptiRough Configuration & Physics Schema
 * Authoritative taxonomy, defaults, and physical calculations matching Mastercam 2025 Chapter 10.
 */

export const OPTIROUGH_MATERIALS = {
  ALU_6061: {
    id: 'alu_6061',
    name: 'Aluminum 6061-T6 Aerospace',
    category: 'Non-Ferrous Alloy',
    hardness: '95 HB',
    kc: 750, // Specific cutting force N/mm2
    recommendedStepoverPct: 25, // 25% cutter diameter
    recommendedStepdownFactor: 2.2, // 2.2x D
    recommendedStepupFactor: 0.15, // 0.15x D
    vc: 450, // m/min
    fzNominal: 0.12, // mm/tooth
    desc: 'High-speed aggressive clearing; maximum volumetric MRR with long flute engagement.'
  },
  STEEL_4140: {
    id: 'steel_4140',
    name: 'AISI 4140 Pre-Hardened Tool Steel',
    category: 'Alloy Tool Steel',
    hardness: '30 HRC',
    kc: 2100,
    recommendedStepoverPct: 15,
    recommendedStepdownFactor: 1.8,
    recommendedStepupFactor: 0.12,
    vc: 140,
    fzNominal: 0.08,
    desc: 'Medium-hard alloy steel; constant tool engagement eliminates shock loads and chipping.'
  },
  TITANIUM: {
    id: 'titanium',
    name: 'Titanium Ti-6Al-4V (Grade 5)',
    category: 'Aerospace Superalloy',
    hardness: '36 HRC',
    kc: 2800,
    recommendedStepoverPct: 10,
    recommendedStepdownFactor: 2.0,
    recommendedStepupFactor: 0.10,
    vc: 65,
    fzNominal: 0.06,
    desc: 'Low thermal conductivity; small 36° engagement angle with deep axial cuts.'
  },
  INCONEL: {
    id: 'inconel',
    name: 'Inconel 718 Nickel Superalloy',
    category: 'Heat-Resistant Superalloy',
    hardness: '42 HRC',
    kc: 3200,
    recommendedStepoverPct: 8,
    recommendedStepdownFactor: 1.5,
    recommendedStepupFactor: 0.08,
    vc: 45,
    fzNominal: 0.05,
    desc: 'Work-hardening superalloy; continuous trochoidal clearing prevents notch wear.'
  },
  STAINLESS_304: {
    id: 'stainless_304',
    name: 'AISI 304 Austenitic Stainless',
    category: 'Stainless Steel',
    hardness: '180 HB',
    kc: 2300,
    recommendedStepoverPct: 12,
    recommendedStepdownFactor: 1.8,
    recommendedStepupFactor: 0.10,
    vc: 110,
    fzNominal: 0.07,
    desc: 'High ductility; continuous trochoidal motion prevents built-up edge (BUE).'
  },
  TOOL_STEEL_D2: {
    id: 'tool_steel_d2',
    name: 'D2 High-Carbon Die Steel',
    category: 'Cold-Work Die Steel',
    hardness: '55 HRC',
    kc: 3100,
    recommendedStepoverPct: 8,
    recommendedStepdownFactor: 1.5,
    recommendedStepupFactor: 0.08,
    vc: 80,
    fzNominal: 0.05,
    desc: 'High abrasive wear resistance; rigid trochoidal dynamic milling with constant chip load.'
  }
};

export const OPTIROUGH_PRESETS = [
  {
    id: 'alu_high_speed',
    label: 'Alu 6061 High Speed',
    materialKey: 'ALU_6061',
    stepoverPct: 25,
    stepdownFactor: 2.2,
    stepupMm: 1.5,
    rampAngle: 3.0,
    microLiftMm: 0.35,
    backFeedRate: 3500,
    desc: 'High MRR volumetric roughing in aluminum alloys'
  },
  {
    id: 'steel_dynamic',
    label: '4140 Steel Dynamic',
    materialKey: 'STEEL_4140',
    stepoverPct: 15,
    stepdownFactor: 1.8,
    stepupMm: 1.2,
    rampAngle: 2.0,
    microLiftMm: 0.25,
    backFeedRate: 2500,
    desc: 'Constant tool engagement in alloy steel'
  },
  {
    id: 'ti_superalloy',
    label: 'Titanium Aerospace',
    materialKey: 'TITANIUM',
    stepoverPct: 10,
    stepdownFactor: 2.0,
    stepupMm: 1.0,
    rampAngle: 1.5,
    microLiftMm: 0.25,
    backFeedRate: 2000,
    desc: 'Low engagement heat dissipation for Ti-6Al-4V'
  },
  {
    id: 'mold_cavity_deep',
    label: 'Deep Mold Cavity',
    materialKey: 'STEEL_4140',
    stepoverPct: 15,
    stepdownFactor: 2.0,
    stepupMm: 1.0,
    rampAngle: 2.0,
    microLiftMm: 0.30,
    backFeedRate: 2500,
    desc: 'Deep pocket clearing with fine upward rest passes'
  }
];

export function resolveOptiRoughMachineCapabilities(activeMachine = {}) {
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
 * Calculates physical dynamic milling metrics:
 * - Constant engagement angle θe (deg)
 * - Radial chip thinning factor (RCTF)
 * - Feed rate boost multiplier
 * - MRR (cm3/min)
 * - Spindle cutting power Pc (kW)
 */
export function calculateOptiRoughPhysics(tool = {}, params = {}, materialKey = 'ALU_6061') {
  const mat = OPTIROUGH_MATERIALS[materialKey.toUpperCase()] || OPTIROUGH_MATERIALS.ALU_6061;
  const d = Math.max(1, Number(tool.diameter || 10));
  const z = Math.max(1, Number(tool.flutes || 4));

  const stepoverPct = Math.max(3, Math.min(50, Number(params.stepoverPct || mat.recommendedStepoverPct)));
  const ae = (d * stepoverPct) / 100;
  const ap = Math.max(0.5, Number(params.stepdown || d * mat.recommendedStepdownFactor));

  // 1. Constant Tool Engagement Angle θe
  // cos(θe/2) = 1 - 2*ae/D  =>  θe = 2 * asin(sqrt(ae/D))
  const ratio = Math.max(0.001, Math.min(1, ae / d));
  const engagementRad = 2 * Math.asin(Math.sqrt(ratio));
  const engagementDeg = Number(((engagementRad * 180) / Math.PI).toFixed(1));

  // 2. Radial Chip Thinning Factor (RCTF)
  // Actual chip thickness h = fz * sin(θe/2) = fz * sqrt(ae/D)
  // Chip Thinning Boost = 1 / sqrt(ae/D)
  const rctfMultiplier = ratio > 0 ? Number((1 / Math.sqrt(ratio)).toFixed(2)) : 1.0;
  const fzActual = Number((mat.fzNominal * rctfMultiplier).toFixed(3));

  // 3. Spindle Speed & Feed Rate
  const vc = Number(params.cuttingSpeedVc || mat.vc);
  const rpm = Math.min(24000, Math.round((vc * 1000) / (Math.PI * d)));
  const feedRate = Math.round(rpm * fzActual * z);

  // 4. Volumetric Material Removal Rate (MRR in cm3/min)
  // MRR = (ae * ap * Vf) / 1000
  const mrrCm3Min = Number(((ae * ap * feedRate) / 1000).toFixed(1));

  // 5. Spindle Cutting Power (kW)
  // Pc = (MRR * kc) / (60 * 1000)
  const powerKw = Number(((mrrCm3Min * mat.kc) / 60000).toFixed(2));

  // 6. Force Reduction vs 100% Slotting (180° engagement)
  const forceReductionPct = Math.max(0, Math.round((1 - engagementDeg / 180) * 100));

  return {
    material: mat,
    cutterDiameter: d,
    stepoverMm: Number(ae.toFixed(2)),
    stepoverPct,
    axialDepthMm: Number(ap.toFixed(1)),
    engagementDeg,
    rctfMultiplier,
    feedRateBoostPct: Math.round((rctfMultiplier - 1) * 100),
    rpm,
    feedRate,
    mrrCm3Min,
    powerKw,
    forceReductionPct
  };
}

/**
 * Creates Mastercam-authentic initial state for 3D High Speed Dynamic OptiRough
 */
export function createDefaultOptiRoughState(options = {}) {
  const { activeMachine, stockConfig, currentModel, tool } = options;
  const caps = resolveOptiRoughMachineCapabilities(activeMachine);
  const defaultTool = tool || {
    id: 1,
    number: 1,
    name: '10mm 4-Flute Endmill (Dynamic Rougher)',
    type: 'flat',
    diameter: 10,
    cornerRadius: 0,
    flutes: 4,
    spindleSpeed: 5395,
    feedRate: 2870,
    plungeRate: 450,
    retractRate: 2500
  };

  const toolDiam = Number(defaultTool.diameter || 10);
  const initStepoverPct = 15.0; // 15% D
  const initStepdown = Number((toolDiam * 1.5).toFixed(1)); // 1.5x D (15mm)
  const initStepup = Number((toolDiam * 0.1).toFixed(1)); // 0.1x D (1mm)

  return {
    // Operation Metadata
    name: '3D High Speed Dynamic OptiRough',
    strategyKey: 'surface_rough_optirough',
    badgeClass: 'adaptive',
    opType: 'adaptive',
    comment: 'Mastercam Dynamic OptiRough - High-Speed Constant Engagement Roughing with Upward Stepup',

    // Active Tree Tab
    activeTreePage: 'cut_parameters',

    // Material & Physics
    selectedPresetId: 'alu_high_speed',
    selectedMaterialKey: 'ALU_6061',

    // 1. Toolpath Type Page
    toolpathType: {
      type: 'dynamic_optirough',
      isRoughing: true,
      subType: 'optirough'
    },

    // 2. Model Geometry Page
    modelGeometry: {
      sameWallAndFloorStock: true,
      wallStock: 1.0, // 1.0mm finish allowance
      floorStock: 1.0,
      avoidanceWallStock: 0.0,
      avoidanceFloorStock: 0.0,
      machiningEntitiesCount: 65,
      avoidanceEntitiesCount: 0,
      workholdingEntitiesCount: 0,
      displayRemainder: true,
      displayRemainderValue: 15,
      machiningGeometry: [
        { id: 1, name: 'machining', entities: 65, wallStock: 1.0, floorStock: 1.0, color: '#22c55e' }
      ],
      avoidanceGeometry: [
        { id: 1, name: 'avoidance', entities: 0, wallStock: 0.0, floorStock: 0.0, color: '#ef4444' }
      ]
    },

    // 3. Toolpath Control Page
    toolpathControl: {
      boundaryChainsCount: 0,
      strategy: 'stay_inside', // 'stay_inside' (pocket/cavity) | 'from_outside' (core/boss)
      contain: 'tool_tip', // 'tool_tip' | 'tool_contact_point'
      compensateTo: 'center', // 'inside' | 'center' | 'outside'
      offsetDistance: 4.0,
      includeToolRadius: true,
      totalOffsetDistance: 0.0,
      approxStartPoint: null,
      curvesCount: 0,
      pointsCount: 0,
      automaticBoundary: 'none', // 'none' | 'silhouette' | 'stock'
      skipPockets: false,
      skipPocketsOption: 'smaller_than', // 'all' | 'smaller_than'
      skipPocketsMinSize: 0.0,
      skipPocketsMinPct: 0.0
    },

    // 4. Tool Page
    tool: {
      id: defaultTool.id || 501,
      number: defaultTool.number || 501,
      name: defaultTool.name || '1 INCH High Feed Mill',
      diameter: toolDiam,
      cornerRadius: Number(defaultTool.cornerRadius || 0.063585),
      headNumber: 0,
      lengthOffset: defaultTool.lengthOffset ?? defaultTool.number ?? 501,
      diameterOffset: defaultTool.diameterOffset ?? defaultTool.number ?? 501,
      rctf: false,
      spindleDirection: 'CW',
      feedRate: defaultTool.feedRate || 2870,
      spindleSpeed: defaultTool.spindleSpeed || 5395,
      fpt: Number(defaultTool.fpt || 0.0245),
      sfm: Number(defaultTool.sfm || 800.0),
      plungeRate: defaultTool.plungeRate || 450,
      retractRate: defaultTool.retractRate || 2500,
      forceToolChange: false,
      rapidRetract: true,
      toolInspectionChange: false,
      forceRetractEveryInches: 400.0,
      forceRetractEveryMinutes: 40.0,
      toBatch: false,
      comment: '',
      coolant: 'off', // 'flood' | 'mist' | 'thru' | 'off'
      cs: Math.round((Math.PI * toolDiam * (defaultTool.spindleSpeed || 5395)) / 1000)
    },

    // 5. Holder Page
    holder: {
      name: 'BT30 / BBT30 Milling Chuck',
      type: 'BT30',
      projection: 50.0,
      collisionCheck: true
    },

    // 6. Stock Page (Rest Milling)
    stock: {
      restMaterial: false,
      computeRemainingStockFrom: 'previous_operations', // 'previous_operations' | 'roughing_tool' | 'cad_file'
      previousOperationsGroup: 'all_groups',
      detectStockBreakthrough: false,
      roughingToolDiameter: 25.0,
      roughingToolCornerRadius: 0.0,
      overlapDistance: 0.0,
      stepIn: false,
      stepInDistance: 0.0,
      maxStepIns: 1,
      stockResolution: 0.0,
      adjustmentsToRemainingStock: 'use_as_computed',
      adjustmentDistance: 0.0
    },

    // 7. Cut Parameters Page (The core of OptiRough!)
    cutParameters: {
      cuttingMethod: 'climb', // 'climb' | 'conventional'
      conventionalFeedRate: 59.592,
      conventionalFeedRatePct: 100.0,
      tipCompensation: 'tip', // 'tip' | 'center'
      optimizeStepups: 'by_depth', // 'by_depth' | 'next_closest' | 'by_pocket'
      optimizeStepdowns: 'material', // 'material' | 'air' | 'none'
      stepoverPct: 15.0,
      stepoverMm: Number(((toolDiam * 0.15)).toFixed(3)),
      stepoverAngle: 90.0,
      maximizeEngagement: false,
      stepdownPct: 150.0,
      stepdownMm: initStepdown,
      stepupEnabled: true,
      stepupPct: 10.0,
      stepupMm: initStepup,
      millVerticalWalls: true,
      minToolpathRadiusPct: 7.5,
      minToolpathRadiusMm: Number(((toolDiam * 0.075)).toFixed(3)),
      microLiftDistance: 0.25,
      backFeedrate: 2500.0,
      motionGapSizeRetract: 'never', // 'never' | 'broken' | 'always'
      gapSizeMode: 'pct_tool_dia', // 'distance' | 'pct_tool_dia'
      gapSizeDistance: 5.0,
      gapSizePctToolDia: 500.0
    },

    // 8. Steep / Shallow Page
    steepShallow: {
      useZDepths: true,
      limitCutDepths: true,
      zTop: 0.0,
      zBottom: -2.250001,
      detectStockLimits: true,
      shallowAngle: 0.0,
      steepAngle: 90.0
    },

    // 9. Transitions Page
    transitions: {
      entryMethod: 'helical_ramp', // 'helical_ramp' | 'profile_ramp'
      helicalRadius: 5.0,
      helicalPitch: 2.0,
      rampAngle: 2.0,
      plungeClearance: 2.0
    },

    // 10. Linking Parameters Page
    linkingParameters: {
      clearancePlane: 50.0,
      clearancePosition: 'absolute', // 'absolute' | 'incremental'
      retractType: 'full_vertical', // 'full_vertical' | 'minimum_vertical' | 'minimum_distance'
      partClearance: 4.0,
      arcFitRadius: 0.0,
      feedRateOutput: false,
      linearEntryExit: 0.5,
      keepToolDownWithinType: 'percent', // 'percent' | 'distance'
      keepToolDownWithinPct: 500.0,
      keepToolDownWithinDist: 25.0,
      microLiftRetract: 'always', // 'never' | 'output' | 'always'
      microLiftDistance: 0.25, // 0.25mm lift during non-cutting backtrack
      backFeedRate: 2500.0, // 2500 mm/min elevated back-traverse
      keepToolDownBetweenZDepths: false,
      applyLeads: false,
      sameLeadInOut: true,
      leadType: 'horizontal',
      leadDistance: 0.0,
      leadSweepAngle: 90.0,
      leadRadius: 2.0,
      leadRampAngle: 10.0,
      fittingMethod: 'minimize_trimming',
      maxTrimmingDistance: 1.0,
      fitTransitions: false
    },

    // 11. Arc Filter / Tolerance Page
    arcFilterTolerance: {
      totalTolerance: 0.025,
      filterRatio: 0.5, // 50% cut tolerance, 50% arc filter
      createArcsInXY: true,
      createArcsInXZ: false,
      createArcsInYZ: false,
      smoothingEnabled: true,
      highSpeedCornerRounding: true
    },

    // 12. Planes & Coolant
    planes: {
      wcs: 'G54',
      toolPlane: 'Top',
      compPlane: 'Top'
    },
    coolant: {
      flood: true,
      mist: false,
      throughSpindle: false
    },

    // 14. Canned Text Page
    cannedText: {
      stopBefore: false,
      opstopBefore: false,
      bsetBefore: false,
      opstopAfter: true,
      blockDelete: false
    },

    // Execution Flag
    generateToolpath: true
  };
}
