import * as THREE from 'three';

/**
 * Argus CAM Parametric Custom Tool & Toolholder Assembly Builder
 * Mastercam / NX / Sandvik Coromant Grade 3D Tool & Holder Geometry Generator
 * with Real-Time Holder Collision, Cavity Clearance & Tool Deflection Rigidity Auditor.
 */

export const TOOL_TYPES = {
  FLAT: {
    id: 'flat',
    name: 'Flat End Mill (Square)',
    category: 'Milling',
    desc: 'General-purpose 2D/3D pocketing, slotting, and profiling'
  },
  BALL: {
    id: 'ball',
    name: 'Ball Nose End Mill',
    category: 'Milling',
    desc: '3D continuous contouring, organic freeform surfaces, and fillet valleys'
  },
  BULL: {
    id: 'bull',
    name: 'Bull Nose / Torus End Mill',
    category: 'Milling',
    desc: 'High-feed roughing and flat bottom finishing with corner corner radius R'
  },
  TAPERED: {
    id: 'tapered',
    name: 'Tapered Mold End Mill (Draft Angle)',
    category: 'Milling',
    desc: 'Drafted sidewalls for injection mold cavities and die casting dies'
  },
  DOVETAIL: {
    id: 'dovetail',
    name: 'Dovetail Slot & Chamfer Cutter',
    category: 'Milling',
    desc: 'O-ring dovetail grooves, under-angle slots, and chamfering'
  },
  LOLLIPOP: {
    id: 'lollipop',
    name: 'Lollipop / Spherical Undercut',
    category: '5-Axis',
    desc: '5-axis continuous undercut profiling, port chambers, and deburring'
  },
  DRILL: {
    id: 'drill',
    name: 'High-Performance Twist Drill',
    category: 'Holemaking',
    desc: 'Precision deep-hole and spot drilling with 118° or 140° split point'
  },
  STEP_DRILL: {
    id: 'step_drill',
    name: 'Multi-Diameter Step Drill',
    category: 'Holemaking',
    desc: 'Single-shot pilot hole and counterbore drilling'
  },
  THREAD_MILL: {
    id: 'thread_mill',
    name: 'Helical Thread Milling Cutter',
    category: 'Threading',
    desc: 'Right/left hand internal/external thread cutting with 60° thread form'
  }
};

export const HOLDER_TAPERS = {
  BT40: {
    id: 'bt40',
    name: 'BT40 (MAS 403 40-Taper)',
    flangeDia: 63,
    taperLength: 65,
    gaugeFaceDia: 44.45,
    pullStud: true,
    desc: 'Industry-standard 40-taper V-flange tooling for vertical & horizontal machining centers.'
  },
  CAT40: {
    id: 'cat40',
    name: 'CAT40 (ANSI B5.50 40-Taper)',
    flangeDia: 63.5,
    taperLength: 68,
    gaugeFaceDia: 44.45,
    pullStud: true,
    desc: 'Standard North American V-flange milling holder.'
  },
  HSK_A63: {
    id: 'hsk_a63',
    name: 'HSK-A63 (DIN 69893 Hollow Shank)',
    flangeDia: 63,
    taperLength: 32,
    gaugeFaceDia: 63,
    pullStud: false,
    desc: 'High-speed 1:10 hollow taper with face contact for 24,000+ RPM spindle balance.'
  },
  BT30: {
    id: 'bt30',
    name: 'BT30 (Compact 30-Taper)',
    flangeDia: 46,
    taperLength: 48,
    gaugeFaceDia: 31.75,
    pullStud: true,
    desc: 'Compact high-acceleration drill/tap centers (e.g. Fanuc Robodrill).'
  },
  CAPTO_C6: {
    id: 'capto_c6',
    name: 'Capto C6 (Polygon Coupling)',
    flangeDia: 63,
    taperLength: 45,
    gaugeFaceDia: 55,
    pullStud: false,
    desc: 'Self-centering polygon clamping system for high-torque multi-tasking mill-turn machines.'
  }
};

export const CHUCK_TYPES = {
  ER32: {
    id: 'er32',
    name: 'ER32 Collet Chuck',
    nutDia: 50,
    gaugeLength: 70,
    clampingRange: [2, 20],
    desc: 'Standard high-grip collet chuck with ball-bearing clamping nut.'
  },
  ER16: {
    id: 'er16',
    name: 'ER16 Slim Collet Chuck',
    nutDia: 28,
    gaugeLength: 60,
    clampingRange: [1, 10],
    desc: 'Slimline collet nut for tight cavity access and small-diameter tooling.'
  },
  SHRINK_FIT: {
    id: 'shrink_fit',
    name: 'ThermoGrip Heat Shrink Fit (3° Slim)',
    nutDia: 21,
    gaugeLength: 85,
    clampingRange: [3, 16],
    desc: 'Thermal shrink-fit arbor with 3-degree nose taper for deep mold cavity clearance.'
  },
  HYDRAULIC: {
    id: 'hydraulic',
    name: 'Hydro-Lock Precision Damping Chuck',
    nutDia: 42,
    gaugeLength: 75,
    clampingRange: [6, 25],
    desc: 'Internal hydraulic membrane with vibration damping for ultra-low runout (< 3μm).'
  },
  WELDON: {
    id: 'weldon',
    name: 'Side-Lock Weldon Flat Holder',
    nutDia: 44,
    gaugeLength: 65,
    clampingRange: [6, 32],
    desc: 'High-torque positive lock with set screw clamping on tool shank flat.'
  }
};

export const TOOL_PRESETS = [
  {
    id: 'preset_rougher_12',
    name: '12mm Carbide Rougher in BT40-ER32',
    type: 'flat',
    diameter: 12,
    fluteLength: 32,
    overallLength: 83,
    shankDia: 12,
    overhang: 45,
    taper: 'bt40',
    chuck: 'er32',
    rpm: 6500,
    feedRate: 1800,
    coating: 'AlTiN'
  },
  {
    id: 'preset_ball_8_shrink',
    name: '8mm Ball Nose in HSK-A63 ShrinkFit (Deep Cavity)',
    type: 'ball',
    diameter: 8,
    fluteLength: 20,
    overallLength: 90,
    shankDia: 8,
    overhang: 55,
    taper: 'hsk_a63',
    chuck: 'shrink_fit',
    rpm: 12000,
    feedRate: 2400,
    coating: 'TiSiN'
  },
  {
    id: 'preset_lollipop_6',
    name: '6mm Lollipop 5-Axis Undercut in BT40-ER16',
    type: 'lollipop',
    diameter: 6,
    neckDia: 3.2,
    neckLength: 25,
    fluteLength: 6,
    overallLength: 75,
    shankDia: 6,
    overhang: 40,
    taper: 'bt40',
    chuck: 'er16',
    rpm: 10000,
    feedRate: 1500,
    coating: 'DLC'
  },
  {
    id: 'preset_dovetail_20',
    name: '20mm 45° Dovetail O-Ring Cutter in BT40-Weldon',
    type: 'dovetail',
    diameter: 20,
    dovetailAngle: 45,
    neckDia: 8,
    fluteLength: 8,
    overallLength: 70,
    shankDia: 12,
    overhang: 38,
    taper: 'bt40',
    chuck: 'weldon',
    rpm: 4200,
    feedRate: 850,
    coating: 'TiN'
  },
  {
    id: 'preset_taper_10_mold',
    name: '10mm 3° Tapered Mold Mill in HSK-A63 Hydraulic',
    type: 'tapered',
    diameter: 10,
    taperAngleDeg: 3.0,
    fluteLength: 35,
    overallLength: 85,
    shankDia: 10,
    overhang: 50,
    taper: 'hsk_a63',
    chuck: 'hydraulic',
    rpm: 9500,
    feedRate: 1900,
    coating: 'AlTiN'
  }
];

/**
 * Builds a parametric 3D Three.js Mesh Group representing the cutter and holder assembly.
 */
export function build3DToolAssembly(config = {}) {
  const group = new THREE.Group();
  group.name = "Parametric_Tool_Assembly";

  const {
    type = 'flat',
    diameter = 10,
    fluteLength = 25,
    overallLength = 75,
    shankDia = diameter,
    overhang = 45, // Stick-out from chuck nose
    cornerRad = 1.0,
    taperAngleDeg = 3.0,
    dovetailAngle = 45,
    neckDia = 5,
    neckLength = 20,
    pointAngle = 140,
    taperId = 'bt40',
    chuckId = 'er32',
    coating = 'AlTiN'
  } = config;

  const holderTaper = HOLDER_TAPERS[taperId.toUpperCase()] || HOLDER_TAPERS.BT40;
  const chuck = CHUCK_TYPES[chuckId.toUpperCase()] || CHUCK_TYPES.ER32;

  // Materials
  const coatingColor = coating === 'TiN' ? 0xf59e0b : coating === 'DLC' ? 0x1e293b : 0x3b82f6; // TiAlN bluish-slate
  const carbideMat = new THREE.MeshStandardMaterial({
    color: coatingColor,
    metalness: 0.85,
    roughness: 0.25
  });

  const shankMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.9,
    roughness: 0.2
  });

  const holderBodyMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.35
  });

  const nutMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.9,
    roughness: 0.4
  });

  const radius = diameter / 2;

  // 1. CUTTER FLUTE GEOMETRY (Starting from Origin Y=0 upwards)
  let fluteMesh;
  if (type === 'ball') {
    // Cylindrical flute with spherical tip
    const cylLen = Math.max(1, fluteLength - radius);
    const cylGeo = new THREE.CylinderGeometry(radius, radius, cylLen, 24);
    const cyl = new THREE.Mesh(cylGeo, carbideMat);
    cyl.position.y = radius + cylLen / 2;

    const sphereGeo = new THREE.SphereGeometry(radius, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const sphere = new THREE.Mesh(sphereGeo, carbideMat);
    sphere.position.y = radius;
    sphere.rotation.x = Math.PI;

    const ballGroup = new THREE.Group();
    ballGroup.add(cyl);
    ballGroup.add(sphere);
    fluteMesh = ballGroup;
  } else if (type === 'bull') {
    // Cylindrical with corner chamfer/radius
    const cylGeo = new THREE.CylinderGeometry(radius, radius, fluteLength, 24);
    fluteMesh = new THREE.Mesh(cylGeo, carbideMat);
    fluteMesh.position.y = fluteLength / 2;
  } else if (type === 'tapered') {
    // Conical tapered cutter
    const topRadius = radius;
    const bottomRadius = Math.max(0.5, radius - Math.tan((taperAngleDeg * Math.PI) / 180) * fluteLength);
    const coneGeo = new THREE.CylinderGeometry(topRadius, bottomRadius, fluteLength, 24);
    fluteMesh = new THREE.Mesh(coneGeo, carbideMat);
    fluteMesh.position.y = fluteLength / 2;
  } else if (type === 'dovetail') {
    // Inverted truncated cone + neck
    const neckRad = (neckDia || 6) / 2;
    const neckLen = Math.max(5, overhang - fluteLength);
    const neckGeo = new THREE.CylinderGeometry(neckRad, neckRad, neckLen, 20);
    const neckMesh = new THREE.Mesh(neckGeo, shankMat);
    neckMesh.position.y = fluteLength + neckLen / 2;

    const doveGeo = new THREE.CylinderGeometry(radius, neckRad, fluteLength, 24);
    const doveMesh = new THREE.Mesh(doveGeo, carbideMat);
    doveMesh.position.y = fluteLength / 2;

    const doveGroup = new THREE.Group();
    doveGroup.add(doveMesh);
    doveGroup.add(neckMesh);
    fluteMesh = doveGroup;
  } else if (type === 'lollipop') {
    // Spherical ball tip + thin neck
    const ballGeo = new THREE.SphereGeometry(radius, 24, 20);
    const ballMesh = new THREE.Mesh(ballGeo, carbideMat);
    ballMesh.position.y = radius;

    const neckRad = (neckDia || 4) / 2;
    const neckLen = Math.max(10, neckLength || 25);
    const neckGeo = new THREE.CylinderGeometry(neckRad, neckRad, neckLen, 20);
    const neckMesh = new THREE.Mesh(neckGeo, shankMat);
    neckMesh.position.y = radius + neckLen / 2;

    const lollyGroup = new THREE.Group();
    lollyGroup.add(ballMesh);
    lollyGroup.add(neckMesh);
    fluteMesh = lollyGroup;
  } else if (type === 'drill') {
    // Twist drill with conical point
    const ptRad = (pointAngle * Math.PI) / 360;
    const tipHeight = radius / Math.tan(ptRad);
    const cylLen = Math.max(2, fluteLength - tipHeight);

    const cylGeo = new THREE.CylinderGeometry(radius, radius, cylLen, 24);
    const cyl = new THREE.Mesh(cylGeo, carbideMat);
    cyl.position.y = tipHeight + cylLen / 2;

    const coneGeo = new THREE.ConeGeometry(radius, tipHeight, 24);
    const cone = new THREE.Mesh(coneGeo, carbideMat);
    cone.position.y = tipHeight / 2;
    cone.rotation.x = Math.PI;

    const drillGroup = new THREE.Group();
    drillGroup.add(cyl);
    drillGroup.add(cone);
    fluteMesh = drillGroup;
  } else {
    // Flat End Mill (Square)
    const cylGeo = new THREE.CylinderGeometry(radius, radius, fluteLength, 24);
    fluteMesh = new THREE.Mesh(cylGeo, carbideMat);
    fluteMesh.position.y = fluteLength / 2;
  }
  group.add(fluteMesh);

  // 2. TOOL SHANK SECTION (Extending up to Overhang)
  const shankRadius = (shankDia || diameter) / 2;
  const shankLength = Math.max(2, overhang - fluteLength);
  if (shankLength > 0 && type !== 'dovetail' && type !== 'lollipop') {
    const shankGeo = new THREE.CylinderGeometry(shankRadius, shankRadius, shankLength, 24);
    const shankMesh = new THREE.Mesh(shankGeo, shankMat);
    shankMesh.position.y = fluteLength + shankLength / 2;
    group.add(shankMesh);
  }

  // 3. TOOLHOLDER NOSE & COLLET CHUCK (Located at Y = overhang)
  const chuckY = overhang;
  const nutRad = chuck.nutDia / 2;
  const nutHeight = Math.min(25, chuck.gaugeLength * 0.35);

  const nutGeo = new THREE.CylinderGeometry(nutRad, nutRad * 0.9, nutHeight, 32);
  const nutMesh = new THREE.Mesh(nutGeo, nutMat);
  nutMesh.position.y = chuckY + nutHeight / 2;
  group.add(nutMesh);

  // Chuck Body Extension (Arbor)
  const arborHeight = Math.max(15, chuck.gaugeLength - nutHeight);
  const arborTopRad = Math.min(holderTaper.flangeDia * 0.45, nutRad * 1.15);
  const arborGeo = new THREE.CylinderGeometry(arborTopRad, nutRad, arborHeight, 32);
  const arborMesh = new THREE.Mesh(arborGeo, holderBodyMat);
  arborMesh.position.y = chuckY + nutHeight + arborHeight / 2;
  group.add(arborMesh);

  // 4. SPINDLE FLANGE & TAPER CONE
  const flangeY = chuckY + chuck.gaugeLength;
  const flangeRadius = holderTaper.flangeDia / 2;
  const flangeThickness = 12;

  // V-Flange Ring
  const flangeGeo = new THREE.CylinderGeometry(flangeRadius, flangeRadius, flangeThickness, 36);
  const flangeMesh = new THREE.Mesh(flangeGeo, holderBodyMat);
  flangeMesh.position.y = flangeY + flangeThickness / 2;
  group.add(flangeMesh);

  // Spindle Taper Cone
  const taperHeight = holderTaper.taperLength;
  const taperBottomRad = holderTaper.gaugeFaceDia ? holderTaper.gaugeFaceDia / 2 : flangeRadius * 0.7;
  const taperTopRad = taperBottomRad * 0.65;

  const taperGeo = new THREE.CylinderGeometry(taperTopRad, taperBottomRad, taperHeight, 32);
  const taperMesh = new THREE.Mesh(taperGeo, shankMat);
  taperMesh.position.y = flangeY + flangeThickness + taperHeight / 2;
  group.add(taperMesh);

  // Pull Stud (if applicable)
  if (holderTaper.pullStud) {
    const studHeight = 15;
    const studGeo = new THREE.CylinderGeometry(6, 4.5, studHeight, 16);
    const studMesh = new THREE.Mesh(studGeo, holderBodyMat);
    studMesh.position.y = flangeY + flangeThickness + taperHeight + studHeight / 2;
    group.add(studMesh);
  }

  return group;
}

/**
 * Holder Collision & Cavity Clearance Auditor
 * Calculates clearance between the collet chuck and workpiece walls/clamps,
 * plus tool deflection rigidity based on Euler-Bernoulli beam theory.
 */
export function auditHolderClearance(toolAssembly = {}, partMetrics = null, maxCutDepth = 25.0) {
  const overhang = Number(toolAssembly.overhang || 45.0);
  const dia = Number(toolAssembly.diameter || 10.0);
  const chuckId = toolAssembly.chuck || 'er32';
  const chuck = CHUCK_TYPES[chuckId.toUpperCase()] || CHUCK_TYPES.ER32;

  const safetyMargin = 5.0; // mm minimum clearance above top of cavity
  const requiredOverhang = maxCutDepth + safetyMargin;
  const clearanceMargin = overhang - maxCutDepth;

  let status = 'safe';
  const warnings = [];

  if (clearanceMargin < 0) {
    status = 'gouge';
    warnings.push(`CRITICAL: Holder chuck nut (Ø${chuck.nutDia}mm) will collide with workpiece! Cut depth (${maxCutDepth}mm) exceeds tool overhang (${overhang}mm) by ${Math.abs(clearanceMargin).toFixed(1)}mm.`);
  } else if (clearanceMargin < safetyMargin) {
    status = 'caution';
    warnings.push(`CAUTION: Low holder clearance (${clearanceMargin.toFixed(1)}mm). Recommended minimum safety clearance is ${safetyMargin}mm.`);
  }

  // Tool Rigidity / Deflection Score (proportional to D^4 / L^3)
  // Optimal ratio L/D is ~ 3 to 4. As L/D > 5, deflection increases dramatically.
  const ldRatio = overhang / dia;
  let rigidityScore = Math.max(10, Math.min(100, Math.round(100 - (ldRatio - 3) * 15)));
  if (ldRatio > 6) {
    warnings.push(`Tool stick-out ratio (L/D = ${ldRatio.toFixed(1)}) is high. Potential chatter and tool deflection risk.`);
  }

  return {
    status, // 'safe' | 'caution' | 'gouge'
    overhang,
    maxCutDepth,
    clearanceMargin: Number(clearanceMargin.toFixed(2)),
    requiredOverhang: Number(requiredOverhang.toFixed(1)),
    nutDiameter: chuck.nutDia,
    ldRatio: Number(ldRatio.toFixed(1)),
    rigidityScore,
    recommendedOverhang: Math.max(dia * 3, Math.round(requiredOverhang)),
    warnings
  };
}

