/**
 * Argus CAM CNC Machining Cost, Tool Wear & Production Quoting Engine
 * 
 * Capabilities:
 * - Machine hourly rate calculation across multiple machine centers (3X, 5X, Mill-Turn, Router, Laser)
 * - Raw stock material consumption & Buy-to-Fly ratio (including scrap metal recycling credit)
 * - Taylor's Tool Life Equation (Vc * T^n = C) for forecasting cutter wear and tool replacement cost
 * - Fixed setup amortization across batch quantities (Q = 1 to 10,000 parts)
 * - Labor rates, operator part loading/unloading, and CMM first-piece inspection costs
 * - Electric power consumption based on spindle kW and utility rates
 * - Overhead, profit margin markup, and commercial quotation sheet generation
 */

// ============================================================================
// CNC MACHINE HOURLY RATES & SPECIFICATIONS
// ============================================================================

export const MACHINE_RATE_CATALOG = {
  HAAS_VF2: {
    id: 'HAAS_VF2',
    name: 'Haas VF-2 (3-Axis Vertical Machining Center)',
    type: '3-Axis Milling',
    hourlyRateUsd: 85.0,
    powerDrawKw: 15.0,
    maintenanceFactor: 1.10,
    badge: '3-Axis Standard VMC',
    badgeColor: '#38bdf8'
  },
  ROBODRILL_D21: {
    id: 'ROBODRILL_D21',
    name: 'Fanuc Robodrill D21 (High-Speed 3-Axis Drill/Tap)',
    type: 'High-Speed 3-Axis',
    hourlyRateUsd: 95.0,
    powerDrawKw: 11.0,
    maintenanceFactor: 1.05,
    badge: 'High-Speed Drill/Tap',
    badgeColor: '#10b981'
  },
  DMG_DMU50: {
    id: 'DMG_DMU50',
    name: 'DMG MORI DMU 50 (5-Axis Simultaneous Trunnion)',
    type: '5-Axis Trunnion',
    hourlyRateUsd: 165.0,
    powerDrawKw: 25.0,
    maintenanceFactor: 1.25,
    badge: '5-Axis Simultaneous Trunnion',
    badgeColor: '#a855f7'
  },
  MAZAK_INTEGREX: {
    id: 'MAZAK_INTEGREX',
    name: 'Mazak Integrex i-200 (5-Axis Multi-Tasking Mill-Turn)',
    type: '5-Axis Mill-Turn',
    hourlyRateUsd: 210.0,
    powerDrawKw: 32.0,
    maintenanceFactor: 1.30,
    badge: '5-Axis Mill-Turn Center',
    badgeColor: '#ec4899'
  },
  CNC_ROUTER_HEAVY: {
    id: 'CNC_ROUTER_HEAVY',
    name: 'Industrial Gantry CNC Router (4x8 / 5x10 Bed)',
    type: 'CNC Router',
    hourlyRateUsd: 75.0,
    powerDrawKw: 12.0,
    maintenanceFactor: 1.08,
    badge: 'Large Format Router',
    badgeColor: '#f59e0b'
  },
  FIBER_LASER_3KW: {
    id: 'FIBER_LASER_3KW',
    name: '3kW High-Precision Fiber Laser Cutter',
    type: 'Fiber Laser',
    hourlyRateUsd: 140.0,
    powerDrawKw: 18.0,
    maintenanceFactor: 1.20,
    badge: 'Precision Fiber Laser',
    badgeColor: '#06b6d4'
  }
};

// ============================================================================
// RAW STOCK MATERIALS & RECYCLING SALVAGE CATALOG
// ============================================================================

export const RAW_MATERIALS_CATALOG = {
  AL_6061_T6: {
    id: 'AL_6061_T6',
    name: 'Aluminum 6061-T6 (Extruded / Rolled)',
    densityGcm3: 2.70,
    costPerKgUsd: 7.80,
    scrapSalvagePerKgUsd: 1.85, // Recyclable chip credit
    taylorExponentN: 0.28,
    taylorConstantC: 450,
    machinabilityRatingPct: 100
  },
  AL_7075_T6: {
    id: 'AL_7075_T6',
    name: 'Aerospace Aluminum 7075-T651',
    densityGcm3: 2.81,
    costPerKgUsd: 14.50,
    scrapSalvagePerKgUsd: 2.10,
    taylorExponentN: 0.26,
    taylorConstantC: 400,
    machinabilityRatingPct: 85
  },
  STEEL_4140_PH: {
    id: 'STEEL_4140_PH',
    name: 'Alloy Steel 4140 Pre-Hardened (28-32 HRC)',
    densityGcm3: 7.85,
    costPerKgUsd: 6.40,
    scrapSalvagePerKgUsd: 0.35,
    taylorExponentN: 0.22,
    taylorConstantC: 220,
    machinabilityRatingPct: 55
  },
  STEEL_304_SS: {
    id: 'STEEL_304_SS',
    name: 'Stainless Steel 304 Austenitic',
    densityGcm3: 8.00,
    costPerKgUsd: 10.20,
    scrapSalvagePerKgUsd: 1.60,
    taylorExponentN: 0.18,
    taylorConstantC: 160,
    machinabilityRatingPct: 40
  },
  TITANIUM_GR5: {
    id: 'TITANIUM_GR5',
    name: 'Titanium Ti-6Al-4V Grade 5 (Aerospace / Medical)',
    densityGcm3: 4.43,
    costPerKgUsd: 68.00,
    scrapSalvagePerKgUsd: 7.50,
    taylorExponentN: 0.14,
    taylorConstantC: 85,
    machinabilityRatingPct: 22
  },
  INCONEL_718: {
    id: 'INCONEL_718',
    name: 'Inconel 718 Nickel Superalloy (Heat Resistant)',
    densityGcm3: 8.19,
    costPerKgUsd: 96.00,
    scrapSalvagePerKgUsd: 9.00,
    taylorExponentN: 0.12,
    taylorConstantC: 55,
    machinabilityRatingPct: 15
  },
  BRASS_C360: {
    id: 'BRASS_C360',
    name: 'Free-Cutting Brass C360',
    densityGcm3: 8.50,
    costPerKgUsd: 12.50,
    scrapSalvagePerKgUsd: 4.80,
    taylorExponentN: 0.35,
    taylorConstantC: 600,
    machinabilityRatingPct: 180
  },
  DELRIN_ACETAL: {
    id: 'DELRIN_ACETAL',
    name: 'Delrin / Acetal Homopolymer (POM)',
    densityGcm3: 1.42,
    costPerKgUsd: 11.00,
    scrapSalvagePerKgUsd: 0.00,
    taylorExponentN: 0.40,
    taylorConstantC: 800,
    machinabilityRatingPct: 250
  }
};

// ============================================================================
// DEFAULT SHOP BURDEN & LABOR CONFIGURATION
// ============================================================================

export const DEFAULT_SHOP_RATES = {
  operatorLaborRateUsd: 55.0,    // $/hr for CNC machinist
  setupHourlyRateUsd: 65.0,      // $/hr for setup specialist
  inspectionHourlyRateUsd: 75.0, // $/hr for QA / CMM inspector
  electricityRateKwhUsd: 0.14,   // $/kWh industrial power rate
  defaultBatchQuantity: 50,      // standard production batch
  fixedSetupTimeMinutes: 45.0,   // fixture loading, tool touch-off, WCS G54 pickup
  firstPieceInspectionMin: 20.0, // CMM / caliper first article verification
  partHandlingTimeSec: 60.0,     // operator load, unload, air blow chips per part
  overheadRatePct: 15.0,         // shop overhead (facility, software, insurance)
  targetProfitMarginPct: 30.0    // target gross margin
};

// ============================================================================
// TAYLOR'S TOOL LIFE PREDICTION ENGINE
// ============================================================================

/**
 * Calculates estimated tool life and tool consumption per part using Taylor's equation:
 * Vc * T^n = C  =>  T = (C / Vc)^(1 / n)
 * 
 * @param {number} cuttingSpeedVc - Surface speed Vc in m/min
 * @param {number} matExponentN - Taylor exponent n (material dependent)
 * @param {number} matConstantC - Taylor constant C
 * @param {number} actualCuttingMinPerPart - Minutes this tool is actively engaged per part
 * @param {number} newToolCostUsd - Price of new cutter / carbide insert (default $45)
 * @returns {Object} Tool life minutes, parts per tool, and wear cost per part
 */
export function calculateTaylorToolWear(cuttingSpeedVc, matExponentN, matConstantC, actualCuttingMinPerPart, newToolCostUsd = 45.0) {
  const safeVc = Math.max(10, cuttingSpeedVc || 150);
  const safeN = Math.max(0.08, matExponentN || 0.25);
  const safeC = Math.max(20, matConstantC || 350);

  // Taylor tool life in continuous cutting minutes
  const totalToolLifeMinutes = Math.pow(safeC / safeVc, 1.0 / safeN);
  const clampedLifeMin = Math.max(10, Math.min(300, totalToolLifeMinutes));

  const actualEngagedMin = Math.max(0.1, actualCuttingMinPerPart);
  const toolLifeConsumedPct = (actualEngagedMin / clampedLifeMin) * 100.0;
  const partsPerTool = Math.max(1, Math.floor(clampedLifeMin / actualEngagedMin));
  const toolWearCostPerPart = (actualEngagedMin / clampedLifeMin) * newToolCostUsd;

  return {
    cuttingSpeedVc: safeVc,
    expectedToolLifeMinutes: parseFloat(clampedLifeMin.toFixed(1)),
    actualCuttingMinPerPart: parseFloat(actualEngagedMin.toFixed(2)),
    toolLifeConsumedPct: parseFloat(toolLifeConsumedPct.toFixed(2)),
    partsPerToolEdge: partsPerTool,
    toolWearCostPerPartUsd: parseFloat(toolWearCostPerPart.toFixed(2))
  };
}

// ============================================================================
// CORE MACHINING COST & QUOTING CALCULATOR
// ============================================================================

/**
 * Computes full manufacturing cost, tool wear, raw stock volume, and selling price.
 * 
 * @param {Array} operations - List of CAM operations with cycle times
 * @param {Array} tools - List of tools assigned
 * @param {Object} stockConfig - Bounding stock box & allowances
 * @param {Object} partMetrics - Finished workpiece volume & dimensions
 * @param {Object} shopRates - Hourly rates, setup time, margins
 * @returns {Object} Comprehensive itemized quote and quantity cost curves
 */
export function calculateJobMachiningQuote({
  operations = [],
  tools = [],
  stockConfig = {},
  partMetrics = null,
  machineId = 'DMG_DMU50',
  materialId = 'AL_6061_T6',
  batchQuantity = 50,
  shopRates = DEFAULT_SHOP_RATES
}) {
  const machine = MACHINE_RATE_CATALOG[machineId] || MACHINE_RATE_CATALOG.DMG_DMU50;
  const material = RAW_MATERIALS_CATALOG[materialId] || RAW_MATERIALS_CATALOG.AL_6061_T6;
  const rates = { ...DEFAULT_SHOP_RATES, ...shopRates };
  const Q = Math.max(1, parseInt(batchQuantity, 10) || 1);

  // 1. Calculate Machining Cycle Time per Part
  let totalMachiningSeconds = 0;
  const toolUsageMap = {};

  operations.forEach((op) => {
    // Parse time from op (e.g. "3m 45s" or seconds)
    let opSec = 60;
    if (typeof op.time === 'number') {
      opSec = op.time;
    } else if (typeof op.time === 'string') {
      const matchMin = op.time.match(/(\d+)m/);
      const matchSec = op.time.match(/(\d+)s/);
      const m = matchMin ? parseInt(matchMin[1], 10) : 0;
      const s = matchSec ? parseInt(matchSec[1], 10) : 0;
      opSec = (m * 60) + s;
      if (opSec === 0) opSec = 75; // Default fallback
    }

    totalMachiningSeconds += opSec;

    // Track tool engagement
    const toolId = op.tool?.id || 'T01_TOOL';
    if (!toolUsageMap[toolId]) {
      toolUsageMap[toolId] = {
        toolName: op.tool?.name || 'Carbide Endmill',
        toolType: op.tool?.type || 'Endmill',
        engagedSeconds: 0,
        rpm: op.parameters?.spindleRpm || 10000,
        diameter: op.tool?.diameter || 10.0
      };
    }
    toolUsageMap[toolId].engagedSeconds += opSec;
  });

  if (totalMachiningSeconds === 0) {
    totalMachiningSeconds = 380; // ~6.3 minutes typical part baseline
  }

  const machiningMinutesPerPart = totalMachiningSeconds / 60.0;
  const machiningHoursPerPart = machiningMinutesPerPart / 60.0;

  // 2. Machine Operating & Spindle Energy Cost per Part
  const machineBaseRate = machine.hourlyRateUsd * (machine.maintenanceFactor || 1.10);
  const machineRunningCostPerPart = machiningHoursPerPart * machineBaseRate;

  // Spindle electricity cost
  const kwhPerPart = (machine.powerDrawKw || 15.0) * machiningHoursPerPart;
  const electricityCostPerPart = kwhPerPart * rates.electricityRateKwhUsd;

  // 3. Raw Stock Material & Buy-to-Fly Ratio
  // Dimensions
  const b = partMetrics?.box || partMetrics?.bounds;
  const dx = partMetrics?.dx || (b ? Math.abs(b.max.x - b.min.x) : 80.0);
  const dy = partMetrics?.dy || (b ? Math.abs(b.max.y - b.min.y) : 60.0);
  const dz = partMetrics?.dz || (b ? Math.abs(b.max.z - b.min.z) : 40.0);

  const allowSides = stockConfig?.allowanceSides || 4.0;
  const allowTop = stockConfig?.allowanceTop || 2.0;
  const allowBottom = stockConfig?.allowanceBottom || 5.0; // vise grip stock

  const rawX = dx + (allowSides * 2);
  const rawY = dy + allowTop + allowBottom;
  const rawZ = dz + (allowSides * 2);

  // Volumes in cm³
  const rawVolumeCm3 = (rawX * rawY * rawZ) / 1000.0;
  const finishedVolumeCm3 = Math.max(10, rawVolumeCm3 * 0.45); // Finished part is typically ~45% of envelope

  // Weights in kg
  const rawWeightKg = (rawVolumeCm3 * material.densityGcm3) / 1000.0;
  const finishedWeightKg = (finishedVolumeCm3 * material.densityGcm3) / 1000.0;
  const chipScrapWeightKg = Math.max(0, rawWeightKg - finishedWeightKg);

  const buyToFlyRatio = parseFloat((rawWeightKg / Math.max(0.01, finishedWeightKg)).toFixed(2));

  // Material Costs
  const rawMaterialCostPerPart = rawWeightKg * material.costPerKgUsd;
  const scrapSalvageCreditPerPart = chipScrapWeightKg * (material.scrapSalvagePerKgUsd || 0);
  const netMaterialCostPerPart = Math.max(0, rawMaterialCostPerPart - scrapSalvageCreditPerPart);

  // 4. Taylor Tool Wear & Cutter Replacement Cost
  const toolWearReports = [];
  let totalToolWearCostPerPart = 0;

  Object.entries(toolUsageMap).forEach(([tId, tData]) => {
    // Approximate surface speed Vc from RPM & Diameter
    const vcMMin = (Math.PI * tData.diameter * tData.rpm) / 1000.0;
    const engagedMinutes = tData.engagedSeconds / 60.0;

    const wear = calculateTaylorToolWear(
      vcMMin,
      material.taylorExponentN,
      material.taylorConstantC,
      engagedMinutes,
      48.0 // standard carbide cutter replacement cost
    );

    totalToolWearCostPerPart += wear.toolWearCostPerPartUsd;

    toolWearReports.push({
      toolId: tId,
      toolName: tData.toolName,
      toolType: tData.toolType,
      diameter: tData.diameter,
      cuttingSpeedVc: Math.round(vcMMin),
      engagedMinutes: parseFloat(engagedMinutes.toFixed(2)),
      expectedLifeMin: wear.expectedToolLifeMinutes,
      lifeConsumedPct: wear.toolLifeConsumedPct,
      partsPerTool: wear.partsPerToolEdge,
      costPerPartUsd: wear.toolWearCostPerPartUsd
    });
  });

  if (totalToolWearCostPerPart === 0) {
    totalToolWearCostPerPart = 2.45; // baseline cutter insert depreciation
  }

  // 5. Labor, Handling & Amortized Fixed Setup Costs
  // Part handling (loading & unloading into vise/fixture, blowing chips)
  const partHandlingHours = (rates.partHandlingTimeSec / 3600.0);
  const partHandlingCost = partHandlingHours * rates.operatorLaborRateUsd;

  // Fixed Setup Cost: Fixture mount + tool setter touchoff + first article inspection
  const totalSetupHours = (rates.fixedSetupTimeMinutes / 60.0);
  const setupLaborCostTotal = totalSetupHours * rates.setupHourlyRateUsd;

  const inspectionHours = (rates.firstPieceInspectionMin / 60.0);
  const inspectionCostTotal = inspectionHours * rates.inspectionHourlyRateUsd;

  const totalFixedSetupCost = setupLaborCostTotal + inspectionCostTotal;
  const amortizedSetupPerPart = totalFixedSetupCost / Q;

  // 6. Cost Rollup (COGS), Overhead & Profit Margin
  const totalDirectCostPerPart = (
    machineRunningCostPerPart +
    electricityCostPerPart +
    netMaterialCostPerPart +
    totalToolWearCostPerPart +
    partHandlingCost +
    amortizedSetupPerPart
  );

  const overheadCostPerPart = totalDirectCostPerPart * (rates.overheadRatePct / 100.0);
  const totalCostOfGoodsSold = totalDirectCostPerPart + overheadCostPerPart;

  // Target Selling Price based on profit margin
  // Selling Price = COGS / (1 - Margin)
  const profitMarginDecimal = Math.min(0.85, rates.targetProfitMarginPct / 100.0);
  const quotedPricePerPart = totalCostOfGoodsSold / (1.0 - profitMarginDecimal);
  const profitPerPart = quotedPricePerPart - totalCostOfGoodsSold;

  const totalJobQuoteUsd = quotedPricePerPart * Q;

  // 7. Quantity Discount Curve Simulation (Q = 1, 5, 25, 50, 100, 250, 500, 1000)
  const quantityBreaks = [1, 5, 25, 50, 100, 250, 500, 1000].map(qty => {
    const amortSetup = totalFixedSetupCost / qty;
    const directCost = (
      machineRunningCostPerPart +
      electricityCostPerPart +
      netMaterialCostPerPart +
      totalToolWearCostPerPart +
      partHandlingCost +
      amortSetup
    );
    const cogs = directCost * (1.0 + rates.overheadRatePct / 100.0);
    const price = cogs / (1.0 - profitMarginDecimal);

    return {
      quantity: qty,
      setupPerPart: parseFloat(amortSetup.toFixed(2)),
      cogsPerPart: parseFloat(cogs.toFixed(2)),
      pricePerPart: parseFloat(price.toFixed(2)),
      totalJobCost: parseFloat((price * qty).toFixed(2))
    };
  });

  return {
    success: true,
    machine,
    material,
    batchQuantity: Q,
    metrics: {
      totalMachiningSeconds: Math.round(totalMachiningSeconds),
      totalMachiningMinutes: parseFloat(machiningMinutesPerPart.toFixed(2)),
      totalMachiningFormatted: formatMinutesToTime(machiningMinutesPerPart),
      totalJobRunTimeHours: parseFloat(((machiningMinutesPerPart * Q) / 60.0).toFixed(1)),
      
      // Material Metrics
      rawDimensions: { x: Math.round(rawX), y: Math.round(rawY), z: Math.round(rawZ) },
      rawWeightKg: parseFloat(rawWeightKg.toFixed(2)),
      finishedWeightKg: parseFloat(finishedWeightKg.toFixed(2)),
      chipScrapWeightKg: parseFloat(chipScrapWeightKg.toFixed(2)),
      buyToFlyRatio: buyToFlyRatio,

      // Cost Components (Per Part)
      machineRunningCostPerPart: parseFloat(machineRunningCostPerPart.toFixed(2)),
      electricityCostPerPart: parseFloat(electricityCostPerPart.toFixed(2)),
      rawMaterialCostPerPart: parseFloat(rawMaterialCostPerPart.toFixed(2)),
      scrapSalvageCreditPerPart: parseFloat(scrapSalvageCreditPerPart.toFixed(2)),
      netMaterialCostPerPart: parseFloat(netMaterialCostPerPart.toFixed(2)),
      toolWearCostPerPart: parseFloat(totalToolWearCostPerPart.toFixed(2)),
      partHandlingCostPerPart: parseFloat(partHandlingCost.toFixed(2)),
      amortizedSetupPerPart: parseFloat(amortizedSetupPerPart.toFixed(2)),
      overheadCostPerPart: parseFloat(overheadCostPerPart.toFixed(2)),

      // Totals
      totalFixedSetupCostTotal: parseFloat(totalFixedSetupCost.toFixed(2)),
      totalDirectCostPerPart: parseFloat(totalDirectCostPerPart.toFixed(2)),
      cogsPerPart: parseFloat(totalCostOfGoodsSold.toFixed(2)),
      quotedPricePerPart: parseFloat(quotedPricePerPart.toFixed(2)),
      profitPerPart: parseFloat(profitPerPart.toFixed(2)),
      totalJobQuoteUsd: parseFloat(totalJobQuoteUsd.toFixed(2)),
      targetProfitMarginPct: rates.targetProfitMarginPct
    },
    toolWearReports,
    quantityBreaks
  };
}

function formatMinutesToTime(minutes) {
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return `${m}m ${String(s).padStart(2, '0')}s`;
}
