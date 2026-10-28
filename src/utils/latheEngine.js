import * as THREE from 'three';

/**
 * Standard Lathe Tool Catalog (ISO Carbide Inserts & Toolholders)
 */
export const LATHE_TOOLS = {
  CNMG_120408: {
    id: 'CNMG_120408',
    name: 'CNMG 120408 (80° Diamond Rougher)',
    isoCode: 'PCLNR 2525 M12 / CNMG 120408-PM',
    type: 'turning_od',
    shape: 'C', // 80 deg diamond
    includedAngleDeg: 80,
    leadAngleDeg: 95,
    noseRadius: 0.8,
    insertThickness: 4.76,
    shankSize: 25, // 25x25mm square shank
    insertColor: '#f59e0b', // TiN gold coated
    coating: 'CVD TiCN + Al2O3',
    maxDepthOfCut: 4.5,
    recommendedFeedPerRev: 0.28,
    recommendedSpeedVc: 240, // m/min in 6061 / 180 in 4140
    hand: 'right',
    purpose: 'Heavy OD longitudinal turning & facing'
  },
  DNMG_150608: {
    id: 'DNMG_150608',
    name: 'DNMG 150608 (55° Diamond Profiler)',
    isoCode: 'PDJNR 2525 M15 / DNMG 150608-SF',
    type: 'turning_contour',
    shape: 'D', // 55 deg diamond
    includedAngleDeg: 55,
    leadAngleDeg: 93,
    noseRadius: 0.8,
    insertThickness: 6.35,
    shankSize: 25,
    insertColor: '#38bdf8', // PVD AlTiN blue-grey
    coating: 'PVD AlTiN',
    maxDepthOfCut: 3.0,
    recommendedFeedPerRev: 0.20,
    recommendedSpeedVc: 260,
    hand: 'right',
    purpose: 'Semi-finishing, profiling & moderate undercuts'
  },
  VNMG_160404: {
    id: 'VNMG_160404',
    name: 'VNMG 160404 (35° Diamond Fine Finisher)',
    isoCode: 'SVJNR 2020 K16 / VNMG 160404-FF',
    type: 'turning_contour',
    shape: 'V', // 35 deg diamond
    includedAngleDeg: 35,
    leadAngleDeg: 93,
    noseRadius: 0.4,
    insertThickness: 4.76,
    shankSize: 20,
    insertColor: '#a855f7', // Micrograin purple-bronze
    coating: 'PVD TiAlN Nanocomposite',
    maxDepthOfCut: 1.5,
    recommendedFeedPerRev: 0.12,
    recommendedSpeedVc: 320,
    hand: 'right',
    purpose: 'High-precision profile contouring, fillets & deep relief copy-turning'
  },
  WNMG_080408: {
    id: 'WNMG_080408',
    name: 'WNMG 080408 (80° Trigon General Turn)',
    isoCode: 'PWLNR 2525 M08 / WNMG 080408-GM',
    type: 'turning_od',
    shape: 'W', // 80 deg trigon (6 cutting edges)
    includedAngleDeg: 80,
    leadAngleDeg: 95,
    noseRadius: 0.8,
    insertThickness: 4.76,
    shankSize: 25,
    insertColor: '#10b981', // CVD Green-gold
    coating: 'CVD TiCN + Al2O3',
    maxDepthOfCut: 3.5,
    recommendedFeedPerRev: 0.25,
    recommendedSpeedVc: 250,
    hand: 'right',
    purpose: 'Economical high-production roughing & facing'
  },
  GROOVING_BLADE_3MM: {
    id: 'GROOVING_BLADE_3MM',
    name: 'Grooving & Parting Blade (3.0mm Neutral)',
    isoCode: 'N123G2-0300-TF / Q-Cut Blade 25mm',
    type: 'grooving',
    shape: 'G',
    includedAngleDeg: 0,
    leadAngleDeg: 0,
    insertWidth: 3.0,
    noseRadius: 0.2,
    insertThickness: 3.0,
    shankSize: 25,
    insertColor: '#ef4444',
    coating: 'PVD TiAlN',
    maxDepthOfCut: 22.0, // Max grooving depth
    recommendedFeedPerRev: 0.10,
    recommendedSpeedVc: 160,
    hand: 'neutral',
    purpose: 'External radial grooving, O-ring recesses & cutoff parting'
  },
  THREADING_16ER_60: {
    id: 'THREADING_16ER_60',
    name: 'External Threading 16ER AG60 (0.5-3.0mm Pitch)',
    isoCode: 'SER 2020 K16 / 16ER AG60',
    type: 'threading',
    shape: 'T',
    includedAngleDeg: 60,
    leadAngleDeg: 60,
    insertWidth: 9.525,
    noseRadius: 0.08,
    insertThickness: 3.68,
    shankSize: 20,
    insertColor: '#eab308',
    coating: 'PVD TiN',
    maxDepthOfCut: 2.0,
    recommendedFeedPerRev: 1.5, // Follows pitch
    recommendedSpeedVc: 150,
    hand: 'right',
    purpose: 'Single-point multi-pass external threading (Metric, UN, ACME)'
  },
  BORING_BAR_S20: {
    id: 'BORING_BAR_S20',
    name: 'Internal Boring Bar (Ø20mm Steel Bar / CCMT 09)',
    isoCode: 'S20R-SCLCR 09 / CCMT 09T304',
    type: 'boring',
    shape: 'C',
    includedAngleDeg: 80,
    leadAngleDeg: 95,
    noseRadius: 0.4,
    insertThickness: 3.97,
    shankSize: 20, // 20mm round bar
    minBoreDiameter: 25.0,
    insertColor: '#06b6d4',
    coating: 'PVD TiAlN',
    maxDepthOfCut: 2.0,
    recommendedFeedPerRev: 0.14,
    recommendedSpeedVc: 200,
    hand: 'right',
    purpose: 'Internal diameter ID boring, step boring & hole enlargement'
  }
};

/**
 * Standard Parametric Turned Part Profiles
 */
export const LATHE_SAMPLE_PROFILES = {
  STEPPED_SHAFT: {
    id: 'STEPPED_SHAFT',
    name: 'Stepped Transmission Drive Shaft',
    rawStockOD: 60.0,
    rawStockLength: 130.0,
    material: 'STEEL_4140',
    // 2D Profile points from face (Z=0) down to chuck (Z negative). Coordinates: [Z, Diameter]
    profile: [
      { z: 0.0, dia: 20.0, note: 'Thread Neck M24' },
      { z: -2.0, dia: 24.0, note: '45° Lead Chamfer' },
      { z: -25.0, dia: 24.0, note: 'M24x2 Thread Journal' },
      { z: -25.0, dia: 20.0, note: 'Thread Relief Undercut' },
      { z: -29.0, dia: 20.0, note: 'Relief Groove' },
      { z: -29.0, dia: 35.0, note: 'Shaft Step 1' },
      { z: -55.0, dia: 35.0, note: 'Bearing Seat 1 (Ø35 h6)' },
      { z: -55.0, dia: 31.0, note: 'Circlip Groove' },
      { z: -58.0, dia: 31.0, note: 'Snap Ring Seat' },
      { z: -58.0, dia: 50.0, note: 'Main Gear Collar' },
      { z: -90.0, dia: 50.0, note: 'Main Body (Ø50)' },
      { z: -90.0, dia: 40.0, note: 'Rear Bearing Shoulder' },
      { z: -120.0, dia: 40.0, note: 'Rear Seat (Ø40)' },
      { z: -125.0, dia: 60.0, note: 'Chuck Clamp Surface' }
    ],
    grooves: [
      { zStart: -25.0, width: 4.0, targetDia: 20.0, name: 'Thread Relief Groove' },
      { zStart: -55.0, width: 3.0, targetDia: 31.0, name: 'Circlip Retaining Groove' }
    ],
    threads: [
      { zStart: -2.0, zEnd: -25.0, nominalDia: 24.0, pitch: 2.0, standard: 'M24x2.0 Metric 60°' }
    ]
  },
  V_BELT_PULLEY: {
    id: 'V_BELT_PULLEY',
    name: 'Cast Aluminum V-Belt Pulley',
    rawStockOD: 90.0,
    rawStockLength: 60.0,
    material: 'ALUMINUM_6061',
    profile: [
      { z: 0.0, dia: 40.0, note: 'Front Hub Face' },
      { z: -10.0, dia: 40.0, note: 'Hub Boss' },
      { z: -10.0, dia: 85.0, note: 'Flange Front' },
      { z: -18.0, dia: 85.0, note: 'Outer Rim' },
      { z: -28.0, dia: 60.0, note: 'V-Groove Taper (34°)' },
      { z: -38.0, dia: 85.0, note: 'V-Groove Flange' },
      { z: -46.0, dia: 85.0, note: 'Rear Rim' },
      { z: -46.0, dia: 45.0, note: 'Rear Hub Boss' },
      { z: -58.0, dia: 45.0, note: 'Mounting Seat' }
    ],
    grooves: [
      { zStart: -18.0, width: 20.0, targetDia: 60.0, name: 'Trapezoidal V-Groove' }
    ],
    threads: []
  },
  HYDRAULIC_PISTON: {
    id: 'HYDRAULIC_PISTON',
    name: 'High-Pressure Hydraulic Piston Head',
    rawStockOD: 75.0,
    rawStockLength: 85.0,
    material: 'STEEL_4140',
    profile: [
      { z: 0.0, dia: 50.0, note: 'Piston Crown' },
      { z: -3.0, dia: 70.0, note: 'Crown Chamfer' },
      { z: -20.0, dia: 70.0, note: 'Top Sealing Land' },
      { z: -20.0, dia: 58.0, note: 'Quad-Ring Groove 1' },
      { z: -25.0, dia: 58.0, note: 'Groove 1' },
      { z: -25.0, dia: 70.0, note: 'Center Land' },
      { z: -35.0, dia: 70.0, note: 'Land' },
      { z: -35.0, dia: 58.0, note: 'Quad-Ring Groove 2' },
      { z: -40.0, dia: 58.0, note: 'Groove 2' },
      { z: -40.0, dia: 70.0, note: 'Skirt Land' },
      { z: -65.0, dia: 70.0, note: 'Piston Skirt' },
      { z: -65.0, dia: 45.0, note: 'Rod Connection Neck' },
      { z: -80.0, dia: 45.0, note: 'Coupling Shank' }
    ],
    grooves: [
      { zStart: -20.0, width: 5.0, targetDia: 58.0, name: 'Piston Seal Ring 1' },
      { zStart: -35.0, width: 5.0, targetDia: 58.0, name: 'Piston Seal Ring 2' }
    ],
    threads: []
  }
};

/**
 * Default Turning Setup Configuration
 */
export const DEFAULT_LATHE_SETUP = {
  partProfileId: 'STEPPED_SHAFT',
  rawStockOD: 60.0,
  rawStockLength: 130.0,
  stockFacingAllowance: 1.5, // mm extra stock on front face Z
  stockODAllowance: 3.0,     // mm radial extra stock on OD
  chuckClampingZ: -115.0,    // Z position where chuck jaws clamp
  tailstockSupported: true,
  spindleMaxRpm: 3500,
  constantSurfaceSpeed: true,
  surfaceSpeedVc: 220,       // m/min
  feedRatePerRev: 0.22,      // mm/rev
  finishAllowanceX: 0.5,     // mm on diameter
  finishAllowanceZ: 0.15,    // mm on length
  roughingDepthOfCut: 2.0,   // mm radial depth of cut per pass
  retractReliefMm: 1.0,
  toolId: 'CNMG_120408',
  finishToolId: 'VNMG_160404',
  grooveToolId: 'GROOVING_BLADE_3MM',
  threadToolId: 'THREADING_16ER_60'
};

/**
 * Calculates Multi-Pass 2-Axis Turning Toolpath Geometry (OD Roughing G71, Facing G72, Finishing G70)
 */
export function generateTurningToolpath(setupConfig = DEFAULT_LATHE_SETUP) {
  const cfg = { ...DEFAULT_LATHE_SETUP, ...setupConfig };
  const sample = LATHE_SAMPLE_PROFILES[cfg.partProfileId] || LATHE_SAMPLE_PROFILES.STEPPED_SHAFT;
  const profile = sample.profile;

  const stockOD = cfg.rawStockOD;
  const stockFaceZ = cfg.stockFacingAllowance;
  const finishStockX = cfg.finishAllowanceX; // diameter allowance
  const finishStockZ = cfg.finishAllowanceZ;
  const depthOfCut = cfg.roughingDepthOfCut; // radial depth
  const relief = cfg.retractReliefMm;

  const cuttingLines = [];
  const rapidLines = [];
  const waypoints = [];
  let totalDist = 0;

  function addMove(p1, p2, isRapid = false, code = 'G01') {
    const dist = p1.distanceTo(p2);
    totalDist += dist;
    if (isRapid) {
      rapidLines.push([p1, p2]);
    } else {
      cuttingLines.push([p1, p2]);
    }
    waypoints.push({
      pos: p2.clone(),
      isRapid,
      code,
      dist: totalDist,
      xDia: Number((p2.x * 2).toFixed(3)), // Diameter readout (X axis in lathe is diameter)
      zLen: Number(p2.z.toFixed(3))
    });
  }

  // Reference safe home position (X diameter 120, Z +20)
  const homePos = new THREE.Vector3(stockOD / 2 + 25, 0, stockFaceZ + 20);
  let curPos = homePos.clone();

  // ================= 1. FACING PASSES (G72 Cycle) =================
  const facePassDepth = 1.0;
  for (let zCut = stockFaceZ - facePassDepth; zCut >= 0; zCut -= facePassDepth) {
    const startPoint = new THREE.Vector3(stockOD / 2 + 3, 0, zCut);
    const endPoint = new THREE.Vector3(-1.6, 0, zCut); // Past center X=0 by 1.6mm to clear pip

    // Rapid to start
    addMove(curPos, new THREE.Vector3(startPoint.x, 0, zCut + 2), true, 'G00');
    addMove(new THREE.Vector3(startPoint.x, 0, zCut + 2), startPoint, true, 'G00');

    // Face cut to center
    addMove(startPoint, endPoint, false, 'G01');

    // 45 deg retract
    const retractPt = new THREE.Vector3(endPoint.x + relief, 0, zCut + relief);
    addMove(endPoint, retractPt, true, 'G00');

    curPos = retractPt;
  }

  // ================= 2. OD LONGITUDINAL ROUGHING (G71 Type I Cycle) =================
  // Find minimum profile diameter to know how deep to step down
  const minDia = Math.min(...profile.map((p) => p.dia));
  const maxZ = Math.min(...profile.map((p) => p.z));

  // Step down from raw stock OD down to minDia + finishStockX
  const currentMaxDia = stockOD;
  const finalRoughDia = minDia + finishStockX;

  for (let curDia = currentMaxDia - depthOfCut * 2; curDia >= finalRoughDia; curDia -= depthOfCut * 2) {
    const curRadius = curDia / 2;

    // Find Z endpoint where current radius intersects the nominal profile + finish allowance
    let targetZ = maxZ;
    for (let i = 0; i < profile.length - 1; i++) {
      const pA = profile[i];
      const pB = profile[i + 1];
      const rA = pA.dia / 2 + finishStockX / 2;
      const rB = pB.dia / 2 + finishStockX / 2;

      if ((curRadius >= rA && curRadius <= rB) || (curRadius <= rA && curRadius >= rB)) {
        // Linear interpolation for target Z
        const factor = (curRadius - rA) / (rB - rA || 1);
        targetZ = pA.z + factor * (pB.z - pA.z);
        break;
      }
    }

    const cutStartZ = 1.0; // 1mm off face
    const pStart = new THREE.Vector3(curRadius, 0, cutStartZ);
    const pEnd = new THREE.Vector3(curRadius, 0, targetZ - finishStockZ);
    const pRelief = new THREE.Vector3(curRadius + relief, 0, targetZ - finishStockZ + relief);

    // Rapid approach
    addMove(curPos, new THREE.Vector3(curRadius + relief * 2, 0, cutStartZ + 2), true, 'G00');
    addMove(new THREE.Vector3(curRadius + relief * 2, 0, cutStartZ + 2), pStart, false, 'G01');

    // Longitudinal turning cut
    addMove(pStart, pEnd, false, 'G01');

    // 45° chamfer relief retract
    addMove(pEnd, pRelief, true, 'G00');

    // Rapid return along Z
    const pReturn = new THREE.Vector3(curRadius + relief, 0, cutStartZ + 1);
    addMove(pRelief, pReturn, true, 'G00');

    curPos = pReturn;
  }

  // ================= 3. CONTOUR PROFILE FINISHING (G70 Cycle) =================
  // Continuous finish pass along profile with nose radius compensation G42
  const pFirst = profile[0];
  const finishStart = new THREE.Vector3(pFirst.dia / 2, 0, 2.0);

  // Approach with circular arc lead-in
  addMove(curPos, new THREE.Vector3(stockOD / 2 + 10, 0, 10.0), true, 'G00');
  addMove(new THREE.Vector3(stockOD / 2 + 10, 0, 10.0), finishStart, true, 'G00');

  let prevProfilePoint = finishStart;
  profile.forEach((pt) => {
    const nextPt = new THREE.Vector3(pt.dia / 2, 0, pt.z);
    addMove(prevProfilePoint, nextPt, false, 'G01');
    prevProfilePoint = nextPt;
  });

  // Retract to safe tool change coordinate
  addMove(prevProfilePoint, new THREE.Vector3(stockOD / 2 + 20, 0, prevProfilePoint.z + 5), true, 'G00');
  addMove(new THREE.Vector3(stockOD / 2 + 20, 0, prevProfilePoint.z + 5), homePos, true, 'G00');

  // ================= 4. THREADING MULTIPASS PASSES (G76 Cycle) =================
  const threadData = sample.threads || [];
  const threadLines = [];

  threadData.forEach((th) => {
    const nominalRadius = th.nominalDia / 2;
    const threadHeight = 0.61343 * th.pitch; // ISO 60° metric thread depth
    const passes = 6;

    for (let pass = 1; pass <= passes; pass++) {
      const infeedProgress = Math.sqrt(pass / passes); // De-gressive infeed for constant chip load
      const currentDepth = infeedProgress * threadHeight;
      const passRadius = nominalRadius - currentDepth;
      // 29.5° compound infeed shift along Z
      const zShift = currentDepth * Math.tan((29.5 * Math.PI) / 180);

      const tStart = new THREE.Vector3(passRadius, 0, th.zStart + 3.0);
      const tEnd = new THREE.Vector3(passRadius, 0, th.zEnd);
      const tClear = new THREE.Vector3(nominalRadius + 2.0, 0, th.zEnd);

      threadLines.push([tStart, tEnd]);
      addMove(new THREE.Vector3(nominalRadius + 2, 0, th.zStart + 3), tStart, true, 'G00');
      addMove(tStart, tEnd, false, 'G32'); // Threading feed
      addMove(tEnd, tClear, true, 'G00');
      addMove(tClear, new THREE.Vector3(nominalRadius + 2, 0, th.zStart + 3), true, 'G00');
    }
  });

  // ================= 5. GROOVING PECK PASSES (G75 Cycle) =================
  const grooveData = sample.grooves || [];
  const grooveLines = [];

  grooveData.forEach((gr) => {
    const targetRadius = gr.targetDia / 2;
    const outerRadius = stockOD / 2;
    const peckDepth = 1.5;

    for (let r = outerRadius; r >= targetRadius; r -= peckDepth) {
      const g1 = new THREE.Vector3(r, 0, gr.zStart);
      const g2 = new THREE.Vector3(r, 0, gr.zStart - gr.width);
      grooveLines.push([g1, g2]);
    }
  });

  return {
    cuttingLines,
    rapidLines,
    threadLines,
    grooveLines,
    waypoints,
    totalDistanceMm: Math.round(totalDist),
    roughingPasses: Math.ceil((currentMaxDia - finalRoughDia) / (depthOfCut * 2)),
    profilePoints: profile.length
  };
}

/**
 * Generates Industrial ISO G-Code for Fanuc / Haas / Siemens CNC Lathes
 */
export function generateLatheGCode(setupConfig = DEFAULT_LATHE_SETUP, toolData = LATHE_TOOLS.CNMG_120408) {
  const cfg = { ...DEFAULT_LATHE_SETUP, ...setupConfig };
  const sample = LATHE_SAMPLE_PROFILES[cfg.partProfileId] || LATHE_SAMPLE_PROFILES.STEPPED_SHAFT;
  const profile = sample.profile;

  const lines = [];
  let N = 10;
  const nextN = () => `N${N += 10}`;

  lines.push(`%`);
  lines.push(`O0024 (${sample.name.toUpperCase().replace(/\s+/g, '_')}_LATHE_JOB)`);
  lines.push(`(PROGRAM POST-PROCESSED FOR DUAL-AXIS CNC TURNING CENTER)`);
  lines.push(`(STOCK: OD ${cfg.rawStockOD}mm x LENGTH ${cfg.rawStockLength}mm | MATERIAL: ${sample.material})`);
  lines.push(`(GENERATED BY ARGUS MASTER CAM CNC TURNING STUDIO)`);
  lines.push(``);

  // Setup Blocks
  lines.push(`${nextN()} G21 G18 G40 G80 G90 G95 (METRIC, XZ PLANE, RADIUS COMP CANCEL, FEED/REV)`);
  lines.push(`${nextN()} G28 U0.0 W0.0 (RETURN TO X/Z REFERENCE HOME)`);
  lines.push(`${nextN()} G50 S${cfg.spindleMaxRpm} (MAX SPINDLE SPEED CLAMP AT ${cfg.spindleMaxRpm} RPM)`);
  lines.push(``);

  // 1. OD Roughing Tool T0101
  lines.push(`(----- OPERATION 1: OD ROUGHING & FACING -----)`);
  lines.push(`${nextN()} T0101 (TOOL 1: ${toolData.name})`);
  lines.push(`${nextN()} G96 S${cfg.surfaceSpeedVc} M03 (CONSTANT SURFACE SPEED ${cfg.surfaceSpeedVc} M/MIN)`);
  lines.push(`${nextN()} G00 X${(cfg.rawStockOD + 10).toFixed(2)} Z${(cfg.stockFacingAllowance + 5).toFixed(2)} M08`);
  lines.push(``);

  // Facing Pass
  lines.push(`(ROUGH FACE CLEANUP)`);
  lines.push(`${nextN()} G00 Z${cfg.stockFacingAllowance.toFixed(2)}`);
  lines.push(`${nextN()} G01 X-1.6 F${cfg.feedRatePerRev.toFixed(2)}`);
  lines.push(`${nextN()} G00 X${(cfg.rawStockOD + 4).toFixed(2)} Z${(cfg.stockFacingAllowance + 2).toFixed(2)}`);
  lines.push(``);

  // Canned Cycle G71
  lines.push(`(G71 CANNED OD ROUGHING CYCLE)`);
  lines.push(`${nextN()} G71 U${cfg.roughingDepthOfCut.toFixed(2)} R${cfg.retractReliefMm.toFixed(2)}`);
  lines.push(`${nextN()} G71 P100 Q150 U${cfg.finishAllowanceX.toFixed(2)} W${cfg.finishAllowanceZ.toFixed(2)} F${cfg.feedRatePerRev.toFixed(2)}`);
  lines.push(`N100 G00 X${profile[0].dia.toFixed(2)} G42 (PROFILE START - TNR COMP RIGHT)`);
  lines.push(`N105 G01 Z0.0 F${(cfg.feedRatePerRev * 0.7).toFixed(2)}`);

  profile.forEach((pt, idx) => {
    if (idx === 0) return;
    lines.push(`N${110 + idx * 5} X${pt.dia.toFixed(2)} Z${pt.z.toFixed(2)} (${pt.note || ''})`);
  });

  lines.push(`N150 G40 X${(cfg.rawStockOD + 4).toFixed(2)} (PROFILE END - CANCEL TNR COMP)`);
  lines.push(`${nextN()} G00 X150.0 Z100.0 M09`);
  lines.push(`${nextN()} M01 (OPTIONAL STOP)`);
  lines.push(``);

  // 2. Profile Finishing Tool T0202
  lines.push(`(----- OPERATION 2: PROFILE FINISHING G70 -----)`);
  lines.push(`${nextN()} T0202 (TOOL 2: VNMG 35° PROFILE FINISHER)`);
  lines.push(`${nextN()} G96 S${Math.round(cfg.surfaceSpeedVc * 1.25)} M03`);
  lines.push(`${nextN()} G00 X${(cfg.rawStockOD + 10).toFixed(2)} Z5.0 M08`);
  lines.push(`${nextN()} G70 P100 Q150 (EXECUTE G70 FINISHING PASS FOLLOWING G71 DEFINITION)`);
  lines.push(`${nextN()} G00 X150.0 Z100.0 M09`);
  lines.push(`${nextN()} M01`);
  lines.push(``);

  // 3. Grooving Operations G75
  if (sample.grooves && sample.grooves.length > 0) {
    lines.push(`(----- OPERATION 3: RADIAL GROOVING G75 -----)`);
    lines.push(`${nextN()} T0303 (TOOL 3: GROOVING BLADE 3.0mm)`);
    lines.push(`${nextN()} G97 S1200 M03 (DIRECT RPM MODE FOR GROOVING RIGIDITY)`);
    lines.push(`${nextN()} G00 X${(cfg.rawStockOD + 4).toFixed(2)} Z5.0 M08`);

    sample.grooves.forEach((gr, idx) => {
      lines.push(`(${gr.name})`);
      lines.push(`${nextN()} G00 Z${gr.zStart.toFixed(2)}`);
      lines.push(`${nextN()} G75 R0.5 (0.5mm CHIP-BREAKING PECK RETRACT)`);
      lines.push(`${nextN()} G75 X${gr.targetDia.toFixed(2)} Z${(gr.zStart - gr.width + 3.0).toFixed(2)} P1500 Q2800 F0.08`);
      lines.push(`${nextN()} G04 P250 (250MS DWELL AT BOTTOM TO CLEAN GROOVE FLOOR)`);
      lines.push(`${nextN()} G00 X${(cfg.rawStockOD + 4).toFixed(2)}`);
    });

    lines.push(`${nextN()} G00 X150.0 Z100.0 M09`);
    lines.push(`${nextN()} M01`);
    lines.push(``);
  }

  // 4. Threading Operation G76
  if (sample.threads && sample.threads.length > 0) {
    lines.push(`(----- OPERATION 4: MULTIPASS THREADING G76 -----)`);
    lines.push(`${nextN()} T0404 (TOOL 4: 60° TRIANGULAR THREADING INSERT)`);
    lines.push(`${nextN()} G97 S900 M03 (STABLE RPM FOR LEADSCREW SYNCHRONIZATION)`);

    sample.threads.forEach((th) => {
      const pitch = th.pitch;
      const threadHeight = Math.round(0.61343 * pitch * 1000); // Microns
      const minPass = 50; // 50 microns minimum infeed
      const finishAllowanceMicrons = 20;

      lines.push(`(${th.standard})`);
      lines.push(`${nextN()} G00 X${(th.nominalDia + 6).toFixed(2)} Z${(th.zStart + pitch * 2).toFixed(2)} M08`);
      // G76 First block: P(spring passes)(chamfer)(infeed angle) Q(min depth microns) R(finish allowance mm)
      lines.push(`${nextN()} G76 P020029 Q${minPass} R0.02`);
      // G76 Second block: X(core diameter) Z(thread end) P(thread height) Q(first pass depth) F(pitch)
      const coreDia = (th.nominalDia - (threadHeight / 1000) * 2).toFixed(3);
      const firstPassDepth = Math.round(pitch * 180);
      lines.push(`${nextN()} G76 X${coreDia} Z${th.zEnd.toFixed(2)} P${threadHeight} Q${firstPassDepth} F${pitch.toFixed(3)}`);
      lines.push(`${nextN()} G00 X${(cfg.rawStockOD + 10).toFixed(2)}`);
    });

    lines.push(`${nextN()} G00 X150.0 Z100.0 M09`);
    lines.push(`${nextN()} M01`);
    lines.push(``);
  }

  // Program End
  lines.push(`(PROGRAM REWIND & EJECT)`);
  lines.push(`${nextN()} G28 U0.0 W0.0 M05`);
  lines.push(`${nextN()} M30 (END OF TAPE / RESET)`);
  lines.push(`%`);

  return lines.join('\n');
}

/**
 * Calculates Cutting Dynamics, Spindle RPM Limits & Cycle Time for Lathe
 */
export function calculateLathePhysics(setupConfig = DEFAULT_LATHE_SETUP, tool = LATHE_TOOLS.CNMG_120408) {
  const cfg = { ...DEFAULT_LATHE_SETUP, ...setupConfig };
  const sample = LATHE_SAMPLE_PROFILES[cfg.partProfileId] || LATHE_SAMPLE_PROFILES.STEPPED_SHAFT;

  const stockOD = cfg.rawStockOD;
  const minDia = Math.min(...sample.profile.map((p) => p.dia));
  const vc = cfg.surfaceSpeedVc; // m/min
  const fn = cfg.feedRatePerRev; // mm/rev
  const ap = cfg.roughingDepthOfCut; // mm radial

  // Spindle RPM at maximum diameter: N = (1000 * Vc) / (pi * D)
  const rpmAtMaxOD = Math.min(cfg.spindleMaxRpm, Math.round((1000 * vc) / (Math.PI * stockOD)));
  const rpmAtMinDia = Math.min(cfg.spindleMaxRpm, Math.round((1000 * vc) / (Math.PI * minDia)));

  // Material Removal Rate MRR = Vc * ap * fn (cm3/min)
  const mrrCm3Min = Number(((vc * ap * fn * 1000) / 1000).toFixed(1));

  // Specific cutting force kc
  const kc = sample.material === 'ALUMINUM_6061' ? 700 : sample.material === 'STEEL_4140' ? 1950 : 2200;
  // Tangential cutting force Fc = kc * ap * fn (Newtons)
  const cuttingForceFc = Math.round(kc * ap * fn);

  // Spindle Power (kW) = (Fc * Vc) / (60 * 1000 * efficiency 0.85)
  const powerKw = Number(((cuttingForceFc * vc) / (60 * 1000 * 0.85)).toFixed(2));
  // Spindle Torque (Nm) = (9550 * Power) / RPM
  const torqueNm = Number(((9550 * powerKw) / Math.max(100, rpmAtMaxOD)).toFixed(1));

  // Cycle time estimation
  const totalLength = cfg.rawStockLength;
  const numPasses = Math.ceil((stockOD - minDia) / (ap * 2));
  const feedSpeedMmMin = rpmAtMaxOD * fn;
  const totalCuttingTimeMin = (totalLength * numPasses) / Math.max(10, feedSpeedMmMin) + 0.5; // +0.5 min for facing & rapids
  const mins = Math.floor(totalCuttingTimeMin);
  const secs = Math.round((totalCuttingTimeMin - mins) * 60);

  return {
    rpmAtMaxOD,
    rpmAtMinDia,
    mrrCm3Min,
    cuttingForceFc,
    powerKw,
    torqueNm,
    cycleTimeFormatted: `${mins}m ${secs < 10 ? '0' : ''}${secs}s`,
    totalTimeSec: Math.round(totalCuttingTimeMin * 60)
  };
}

/**
 * Builds High-Fidelity 3D Lathe Three.js Group (Spindle Chuck, Turned Part, and Carbide Tool)
 */
export function build3DLatheScene(setupConfig = DEFAULT_LATHE_SETUP) {
  const group = new THREE.Group();
  group.name = 'Lathe_Simulation_Assembly';

  const cfg = { ...DEFAULT_LATHE_SETUP, ...setupConfig };
  const sample = LATHE_SAMPLE_PROFILES[cfg.partProfileId] || LATHE_SAMPLE_PROFILES.STEPPED_SHAFT;
  const profile = sample.profile;

  // Materials
  const rawStockMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.8,
    roughness: 0.35
  });

  const turnedFinishedMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    metalness: 0.85,
    roughness: 0.2
  });

  const chuckBodyMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.9,
    roughness: 0.4
  });

  const chuckJawMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.85,
    roughness: 0.25
  });

  // 1. Spindle 3-Jaw Chuck at Z = clamp position
  const chuckZ = cfg.chuckClampingZ || -115.0;
  const chuckDia = Math.max(160, cfg.rawStockOD * 2.2);
  const chuckLength = 70.0;

  const chuckBodyGeo = new THREE.CylinderGeometry(chuckDia / 2, chuckDia / 2, chuckLength, 48);
  const chuckBody = new THREE.Mesh(chuckBodyGeo, chuckBodyMat);
  chuckBody.rotation.x = Math.PI / 2;
  chuckBody.position.set(0, 0, chuckZ - chuckLength / 2);
  group.add(chuckBody);

  // Chuck 3 Master Jaws
  for (let j = 0; j < 3; j++) {
    const angle = (j * Math.PI * 2) / 3;
    const jawArm = new THREE.Group();
    jawArm.position.set(0, 0, chuckZ);
    jawArm.rotation.z = angle;

    const jawGeo = new THREE.BoxGeometry(28, 45, 35);
    const jaw = new THREE.Mesh(jawGeo, chuckJawMat);
    jaw.position.set(0, cfg.rawStockOD / 2 + 18, -17.5);
    jawArm.add(jaw);

    group.add(jawArm);
  }

  // 2. Revolving Turned Workpiece (Lathe Revolve from 2D profile points)
  // Three.js LatheGeometry takes 2D Vector2 points in [radius, Z]
  const lathePoints = [];

  // Face center
  lathePoints.push(new THREE.Vector2(0.001, 0));
  profile.forEach((pt) => {
    lathePoints.push(new THREE.Vector2(pt.dia / 2, pt.z));
  });

  // Close back to chuck
  lathePoints.push(new THREE.Vector2(0.001, chuckZ));

  const latheGeo = new THREE.LatheGeometry(lathePoints, 64);
  const latheMesh = new THREE.Mesh(latheGeo, turnedFinishedMat);
  group.add(latheMesh);

  // 3. Raw Stock Billet Ghost Envelope (Translucent Grey Cylinder)
  const stockLength = cfg.rawStockLength;
  const stockOD = cfg.rawStockOD;
  const ghostGeo = new THREE.CylinderGeometry(stockOD / 2, stockOD / 2, stockLength, 48);
  const ghostMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.15,
    roughness: 0.3,
    depthWrite: false
  });
  const ghostMesh = new THREE.Mesh(ghostGeo, ghostMat);
  ghostMesh.rotation.x = Math.PI / 2;
  ghostMesh.position.set(0, 0, -stockLength / 2 + cfg.stockFacingAllowance);
  group.add(ghostMesh);

  // Wireframe edges on ghost billet
  const wireGeo = new THREE.EdgesGeometry(ghostGeo);
  const wireMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.4 });
  const wire = new THREE.LineSegments(wireGeo, wireMat);
  wire.rotation.x = Math.PI / 2;
  wire.position.copy(ghostMesh.position);
  group.add(wire);

  // 4. Centerline Axis (Dashed Yellow Line along Z)
  const axisGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 15),
    new THREE.Vector3(0, 0, chuckZ - chuckLength)
  ]);
  const axisMat = new THREE.LineDashedMaterial({
    color: 0xfacc15,
    dashSize: 4,
    gapSize: 2
  });
  const axisLine = new THREE.Line(axisGeo, axisMat);
  axisLine.computeLineDistances();
  group.add(axisLine);

  return group;
}
