/**
 * Industrial CNC Machining Physics & Cutting Dynamics Engine
 * Implements Kienzle specific cutting force equations, Radial Chip Thinning Factor (RCTF),
 * Material Removal Rates (MRR), Spindle Power & Torque consumption, and Tool Deflection modeling.
 */

export const MACHINING_MATERIALS = {
  ALUMINUM_6061_T6: {
    id: 'ALUMINUM_6061_T6',
    name: 'Aluminum 6061-T6 (Extruded Billet)',
    isoClass: 'ISO N (Non-Ferrous)',
    hardness: '95 HB',
    densityGcm3: 2.70,
    kc1_1: 700, // Specific cutting resistance in N/mm²
    mc: 0.25,   // Kienzle chip thickness exponent
    defaultCarbideVc: 380, // m/min
    defaultFzPerMm: 0.008, // fz = toolDiameter * 0.008
    cooling: 'Flood Coolant or MQL / Air Blast',
    machinabilityPct: 100,
    color: '#38bdf8'
  },
  ALUMINUM_7075_T6: {
    id: 'ALUMINUM_7075_T6',
    name: 'Aluminum 7075-T6 (Aerospace Grade High Strength)',
    isoClass: 'ISO N (Non-Ferrous)',
    hardness: '150 HB',
    densityGcm3: 2.81,
    kc1_1: 850,
    mc: 0.25,
    defaultCarbideVc: 320,
    defaultFzPerMm: 0.0075,
    cooling: 'Flood Coolant High Pressure',
    machinabilityPct: 90,
    color: '#0ea5e9'
  },
  STEEL_1018: {
    id: 'STEEL_1018',
    name: 'Low Carbon Mild Steel AISI 1018',
    isoClass: 'ISO P (Steels)',
    hardness: '126 HB',
    densityGcm3: 7.85,
    kc1_1: 1500,
    mc: 0.26,
    defaultCarbideVc: 190,
    defaultFzPerMm: 0.006,
    cooling: 'Flood Soluble Oil 8-10%',
    machinabilityPct: 70,
    color: '#94a3b8'
  },
  ALLOY_STEEL_4140: {
    id: 'ALLOY_STEEL_4140',
    name: 'Chromoly Alloy Steel AISI 4140 (28-32 HRC Pre-hardened)',
    isoClass: 'ISO P (Steels)',
    hardness: '300 HB / 30 HRC',
    densityGcm3: 7.85,
    kc1_1: 1950,
    mc: 0.27,
    defaultCarbideVc: 140,
    defaultFzPerMm: 0.005,
    cooling: 'High Pressure Flood Coolant',
    machinabilityPct: 55,
    color: '#64748b'
  },
  TOOL_STEEL_D2: {
    id: 'TOOL_STEEL_D2',
    name: 'High Carbon Cold Work Tool Steel AISI D2 (58-62 HRC)',
    isoClass: 'ISO H (Hardened Steels)',
    hardness: '58-62 HRC',
    densityGcm3: 7.70,
    kc1_1: 2850,
    mc: 0.30,
    defaultCarbideVc: 70,
    defaultFzPerMm: 0.0035,
    cooling: 'Dry with Air Blast or Fine MQL',
    machinabilityPct: 30,
    color: '#f43f5e'
  },
  STAINLESS_304: {
    id: 'STAINLESS_304',
    name: 'Austenitic Stainless Steel AISI 304 (1.4301)',
    isoClass: 'ISO M (Stainless)',
    hardness: '180 HB',
    densityGcm3: 8.00,
    kc1_1: 2150,
    mc: 0.28,
    defaultCarbideVc: 115,
    defaultFzPerMm: 0.0045,
    cooling: 'High Pressure Flood (Never dry, prevent work-hardening)',
    machinabilityPct: 45,
    color: '#a855f7'
  },
  STAINLESS_316L: {
    id: 'STAINLESS_316L',
    name: 'Marine Grade Stainless Steel AISI 316L (1.4404)',
    isoClass: 'ISO M (Stainless)',
    hardness: '190 HB',
    densityGcm3: 8.00,
    kc1_1: 2250,
    mc: 0.28,
    defaultCarbideVc: 100,
    defaultFzPerMm: 0.0042,
    cooling: 'High Pressure Flood 12%',
    machinabilityPct: 40,
    color: '#c084fc'
  },
  TITANIUM_GR5: {
    id: 'TITANIUM_GR5',
    name: 'Titanium Ti-6Al-4V (Grade 5 Aerospace Annealed)',
    isoClass: 'ISO S (High Temp Superalloys)',
    hardness: '36 HRC',
    densityGcm3: 4.43,
    kc1_1: 1850,
    mc: 0.22,
    defaultCarbideVc: 60,
    defaultFzPerMm: 0.004,
    cooling: 'Dedicated High Pressure Through-Spindle Coolant (70 bar)',
    machinabilityPct: 22,
    color: '#f59e0b'
  },
  INCONEL_718: {
    id: 'INCONEL_718',
    name: 'Nickel Superalloy Inconel 718 (AMS 5662)',
    isoClass: 'ISO S (High Temp Superalloys)',
    hardness: '42 HRC',
    densityGcm3: 8.19,
    kc1_1: 2950,
    mc: 0.26,
    defaultCarbideVc: 32,
    defaultFzPerMm: 0.003,
    cooling: 'Cryogenic or High Pressure Coolant (80 bar)',
    machinabilityPct: 15,
    color: '#ef4444'
  },
  BRASS_360: {
    id: 'BRASS_360',
    name: 'Free-Cutting Brass Alloy C36000',
    isoClass: 'ISO N (Non-Ferrous)',
    hardness: '68 HB',
    densityGcm3: 8.50,
    kc1_1: 650,
    mc: 0.20,
    defaultCarbideVc: 420,
    defaultFzPerMm: 0.009,
    cooling: 'Dry or Light Mist / Flood',
    machinabilityPct: 100,
    color: '#eab308'
  },
  POM_DELRIN: {
    id: 'POM_DELRIN',
    name: 'Polyoxymethylene Acetal (Delrin / POM-C)',
    isoClass: 'Polymers / Plastics',
    hardness: '85 Shore D',
    densityGcm3: 1.41,
    kc1_1: 280,
    mc: 0.18,
    defaultCarbideVc: 520,
    defaultFzPerMm: 0.012,
    cooling: 'Cold Air Blast (Avoid melting / chips re-welding)',
    machinabilityPct: 130,
    color: '#10b981'
  }
};

/**
 * Calculates cutting dynamics, power consumption, torque, MRR, and chip thinning.
 */
export function calculateMachiningParameters({
  materialKey = 'ALUMINUM_6061_T6',
  toolDiameter = 10,
  flutes = 4,
  toolType = 'flat',
  fluteLength = 25,
  toolStickout = 45,
  axialDepthAp = 4.0,
  radialDepthAe = 5.0,
  targetVc = null,
  targetFz = null,
  machineMaxRpm = 18000,
  machineMaxPowerKw = 15.0,
  machineMaxTorqueNm = 85.0
}) {
  const mat = MACHINING_MATERIALS[materialKey] || MACHINING_MATERIALS.ALUMINUM_6061_T6;
  const d = Math.max(1, Number(toolDiameter));
  const z = Math.max(1, Number(flutes));
  const ap = Math.max(0.1, Number(axialDepthAp));
  const ae = Math.max(0.1, Math.min(d, Number(radialDepthAe)));
  const stickout = Math.max(d, Number(toolStickout));

  // 1. Surface Cutting Speed Vc (m/min)
  let vc = targetVc ? Number(targetVc) : mat.defaultCarbideVc;
  if (toolType === 'ball') vc *= 0.85; // Lower surface speed near ball apex

  // 2. Spindle RPM: S = (Vc * 1000) / (pi * D)
  const theoreticalRpm = Math.round((vc * 1000) / (Math.PI * d));
  const spindleRpm = Math.max(200, Math.min(Number(machineMaxRpm), theoreticalRpm));
  const actualVc = Number(((Math.PI * d * spindleRpm) / 1000).toFixed(1));

  // 3. Base Feed per Tooth fz (mm/tooth)
  let baseFz = targetFz ? Number(targetFz) : Number((d * mat.defaultFzPerMm).toFixed(4));
  baseFz = Math.max(0.005, Math.min(0.35, baseFz));

  // 4. Radial Chip Thinning Factor (RCTF)
  // When radial engagement ae < 0.5 * D, true maximum chip thickness is less than fz.
  // We apply the standard industrial chip thinning compensation:
  let rctf = 1.0;
  const radialRatio = ae / d;
  if (radialRatio < 0.5 && radialRatio > 0.001) {
    rctf = 1 / (2 * Math.sqrt(radialRatio * (1 - radialRatio)));
    // Clamp compensation factor between 1.0 and 2.8 to protect machine/cutter
    rctf = Math.max(1.0, Math.min(2.8, rctf));
  }
  const effectiveFz = Number((baseFz * rctf).toFixed(4));

  // 5. Table Feed Rate: F = S * z * effectiveFz (mm/min)
  const feedRate = Math.round(spindleRpm * z * effectiveFz);

  // 6. Material Removal Rate (MRR): Q = (ap * ae * F) / 1000 (cm³/min)
  const mrrCm3Min = Number(((ap * ae * feedRate) / 1000).toFixed(2));

  // 7. Cutting Force Fc (N) & Spindle Power Pc (kW) via Kienzle Equation
  // Fc = b * h * kc = ap * (effectiveFz) * (kc1_1 * h^-mc)
  const hAvg = effectiveFz * Math.sqrt(radialRatio);
  const kcEffective = mat.kc1_1 * Math.pow(Math.max(0.01, hAvg), -mat.mc);
  const cuttingForceN = Number(((ap * ae * kcEffective * effectiveFz) / (d * 0.7)).toFixed(0));

  // Spindle Net Power: Pc = (MRR * kc) / (60 * 10^3 * efficiency) [kW]
  const machineEfficiency = 0.85;
  const powerKw = Number(((mrrCm3Min * kcEffective) / (60 * 1000 * machineEfficiency)).toFixed(2));
  const powerLoadPct = Number(Math.min(200, (powerKw / machineMaxPowerKw) * 100).toFixed(1));

  // 8. Spindle Torque: Mc = (Pc * 9550) / S (N*m)
  const torqueNm = Number(((powerKw * 9550) / Math.max(1, spindleRpm)).toFixed(2));
  const torqueLoadPct = Number(Math.min(200, (torqueNm / machineMaxTorqueNm) * 100).toFixed(1));

  // 9. Tool Deflection Modeling: Cantilever Beam Deflection
  // delta = (Fc * L^3) / (3 * E * I)
  // Carbide Young's Modulus E = 600 GPa = 600,000 N/mm²
  // Area moment of inertia I = (pi * D^4) / 64
  const E_carbide = 580000;
  const I_moment = (Math.PI * Math.pow(d, 4)) / 64;
  const deflectionMm = (cuttingForceN * Math.pow(stickout, 3)) / (3 * E_carbide * I_moment);
  const deflectionUm = Number((deflectionMm * 1000).toFixed(1));

  // 10. Safety & Integrity Assessment
  let safetyStatus = 'OPTIMAL';
  let safetyMsg = 'Cutting parameters within nominal spindle envelope and tooling deflection margins.';

  if (powerLoadPct > 100 || torqueLoadPct > 100) {
    safetyStatus = 'CRITICAL_OVERLOAD';
    safetyMsg = `Spindle overload! Power: ${powerKw}kW (Max ${machineMaxPowerKw}kW), Torque: ${torqueNm}Nm. Reduce axial depth ap or feed per tooth.`;
  } else if (powerLoadPct > 80 || torqueLoadPct > 80) {
    safetyStatus = 'WARNING_HIGH_LOAD';
    safetyMsg = `High spindle load (${Math.max(powerLoadPct, torqueLoadPct)}%). Monitor chip evacuation and coolant pressure.`;
  } else if (deflectionUm > 25.0) {
    safetyStatus = 'HIGH_DEFLECTION';
    safetyMsg = `Excessive tool deflection (${deflectionUm}µm). Wall taper or chatter likely. Shorten stickout (${stickout}mm) or decrease radial depth ae.`;
  }

  return {
    material: mat,
    toolDiameter: d,
    flutes: z,
    axialDepthAp: ap,
    radialDepthAe: ae,
    radialEngagementPct: Number((radialRatio * 100).toFixed(1)),
    toolStickout: stickout,
    cuttingSpeedVc: actualVc,
    spindleRpm,
    baseFz,
    rctf: Number(rctf.toFixed(2)),
    effectiveFz,
    feedRate,
    mrrCm3Min,
    cuttingForceN,
    powerKw,
    powerLoadPct,
    torqueNm,
    torqueLoadPct,
    deflectionUm,
    safetyStatus,
    safetyMsg
  };
}

