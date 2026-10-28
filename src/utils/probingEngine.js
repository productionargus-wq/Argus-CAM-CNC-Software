import * as THREE from 'three';

/**
 * Argus CAM Automated In-Process Touch-Trigger Probing Engine
 * Supports Renishaw Inspection Plus, Haas WIPS, Siemens 840D, and Heidenhain TNC 640.
 */

export const PROBING_STRATEGIES = {
  BORE_CENTERING: {
    id: 'bore_centering',
    name: 'Bore / Hole Centering (4-Point)',
    code: 'BORE',
    desc: '4-point internal circular measurement to find exact center (X, Y) and diameter',
    macroFanuc: 'G65 P9814',
    macroSiemens: 'CYCLE977',
    macroHeidenhain: 'TCH PROBE 412',
    defaultParams: { nominalDiameter: 40, depthZ: -10, clearanceZ: 15, wcs: 'G54' }
  },
  BOSS_CENTERING: {
    id: 'boss_centering',
    name: 'Boss / Post Centering (4-Point)',
    code: 'BOSS',
    desc: '4-point external boss measurement with clearance up/over retracts',
    macroFanuc: 'G65 P9814',
    macroSiemens: 'CYCLE977',
    macroHeidenhain: 'TCH PROBE 413',
    defaultParams: { nominalDiameter: 50, depthZ: -8, clearanceZ: 20, wcs: 'G54' }
  },
  SURFACE_Z: {
    id: 'surface_z',
    name: 'Single Surface Z Datum Touch',
    code: 'SURF_Z',
    desc: 'Single-point Z top surface touch to set work coordinate Z-zero datum',
    macroFanuc: 'G65 P9811',
    macroSiemens: 'CYCLE978',
    macroHeidenhain: 'TCH PROBE 417',
    defaultParams: { targetZ: 0.0, clearanceZ: 15, wcs: 'G54' }
  },
  WEB_X: {
    id: 'web_x',
    name: 'Web / Rib Width X-Axis',
    code: 'WEB_X',
    desc: '2-point external web or internal slot width measurement along X-axis',
    macroFanuc: 'G65 P9812',
    macroSiemens: 'CYCLE977',
    macroHeidenhain: 'TCH PROBE 410',
    defaultParams: { nominalWidth: 30, depthZ: -10, clearanceZ: 15, wcs: 'G54' }
  },
  WEB_Y: {
    id: 'web_y',
    name: 'Web / Rib Width Y-Axis',
    code: 'WEB_Y',
    desc: '2-point external web or internal slot width measurement along Y-axis',
    macroFanuc: 'G65 P9812',
    macroSiemens: 'CYCLE977',
    macroHeidenhain: 'TCH PROBE 411',
    defaultParams: { nominalWidth: 30, depthZ: -10, clearanceZ: 15, wcs: 'G54' }
  },
  CORNER_WCS: {
    id: 'corner_wcs',
    name: 'Vise / Workpiece Corner Datum (3-Point)',
    code: 'CORNER',
    desc: 'Outer corner measurement finding exact X, Y edge intersection and Z plane',
    macroFanuc: 'G65 P9815',
    macroSiemens: 'CYCLE961',
    macroHeidenhain: 'TCH PROBE 415',
    defaultParams: { corner: 'top_left', depthZ: -6, clearanceZ: 15, wcs: 'G54' }
  }
};

/**
 * Creates a high-fidelity 3D Renishaw OMP60 Touch-Trigger Probe 3D Model.
 * Featuring precision ground shank, optical receiver body, ceramic stylus, and ruby sphere.
 */
export function createTouchProbe3D(options = {}) {
  const group = new THREE.Group();
  group.name = "Renishaw_Touch_Probe_Assembly";

  const stylusLen = options.stylusLength || 50;
  const rubyRadius = options.rubyDiameter ? options.rubyDiameter / 2 : 3.0; // 6mm ruby sphere
  const bodyH = 65;
  const bodyR = 19; // 38mm dia OMP60 body

  // 1. Ruby Sphere Tip (Ruby Red with slight translucency)
  const rubyGeo = new THREE.SphereGeometry(rubyRadius, 24, 16);
  const rubyMat = new THREE.MeshPhysicalMaterial({
    color: 0xef4444, // Vibrant ruby red
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.45,
    thickness: 2.0,
    ior: 1.76 // Sapphire/Ruby refraction
  });
  const rubyMesh = new THREE.Mesh(rubyGeo, rubyMat);
  rubyMesh.position.set(0, 0, 0); // Stylus contact center
  group.add(rubyMesh);

  // 2. Ceramic / Carbon Fiber Stylus Stem
  const stemR = 1.8;
  const stemGeo = new THREE.CylinderGeometry(stemR, stemR, stylusLen - rubyRadius, 18);
  stemGeo.translate(0, (stylusLen - rubyRadius) / 2 + rubyRadius, 0);
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e, // Renishaw signature green / carbon ceramic
    roughness: 0.4,
    metalness: 0.3
  });
  const stemMesh = new THREE.Mesh(stemGeo, stemMat);
  group.add(stemMesh);

  // 3. Stylus Base Adapter (M4 Stainless thread)
  const adapterGeo = new THREE.CylinderGeometry(5, 3.5, 12, 18);
  adapterGeo.translate(0, stylusLen + 6, 0);
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1, // Precision stainless steel
    metalness: 0.9,
    roughness: 0.2
  });
  const adapterMesh = new THREE.Mesh(adapterGeo, metalMat);
  group.add(adapterMesh);

  // 4. Renishaw OMP60 Main Body
  const bodyGeo = new THREE.CylinderGeometry(bodyR, bodyR, bodyH, 32);
  bodyGeo.translate(0, stylusLen + 12 + bodyH / 2, 0);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Dark anodized aerospace casing
    metalness: 0.75,
    roughness: 0.3
  });
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(bodyMesh);

  // 5. Optical LED Receiver Glass Ring
  const windowGeo = new THREE.CylinderGeometry(bodyR + 0.3, bodyR + 0.3, 10, 32);
  windowGeo.translate(0, stylusLen + 12 + bodyH / 2, 0);
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8, // Cyan optical glass
    emissive: 0x0284c7,
    emissiveIntensity: 0.45,
    roughness: 0.1,
    metalness: 0.5
  });
  const windowMesh = new THREE.Mesh(windowGeo, windowMat);
  group.add(windowMesh);

  // 6. CAT40 / BT40 Toolholder Arbor
  const arborGeo = new THREE.CylinderGeometry(24, 15, 35, 24);
  arborGeo.translate(0, stylusLen + 12 + bodyH + 35 / 2, 0);
  const arborMesh = new THREE.Mesh(arborGeo, metalMat);
  group.add(arborMesh);

  // Probe metadata
  group.userData = {
    isProbe: true,
    name: "Renishaw OMP60 3D Touch Probe",
    rubyRadius,
    stylusLength: stylusLen
  };

  return group;
}

/**
 * Generates 3D geometric trajectory waypoints for a Touch Probing Cycle.
 */
export function generateProbingToolpath(strategyKey, center = { x: 0, y: 35, z: 0 }, params = {}) {
  const waypoints = [];
  const strat = PROBING_STRATEGIES[strategyKey.toUpperCase()] || PROBING_STRATEGIES.BORE_CENTERING;
  const clrZ = params.clearanceZ || 15;
  const depthZ = params.depthZ || -10;
  const nominalD = params.nominalDiameter || 40;
  const r = nominalD / 2;

  const cx = center.x || 0;
  const cy = center.y || 35;
  const cz = center.z || 0;

  const probeTool = {
    id: 99,
    number: 99,
    name: "Renishaw OMP60 Optical Touch Probe",
    type: "probe",
    diameter: 6.0,
    fluteLength: 50,
    length: 120,
    rpm: 0,
    feedRate: 150
  };

  let cumulativeDist = 0;
  let lastPos = new THREE.Vector3(cx, cy + clrZ, cz);

  function addWp(pos, mode, note = '') {
    const p = new THREE.Vector3(pos.x, pos.y, pos.z);
    cumulativeDist += lastPos.distanceTo(p);
    lastPos.copy(p);
    waypoints.push({
      pos: p,
      mode: mode, // 'rapid' | 'protected' | 'touch'
      feed: mode === 'touch' ? 150 : mode === 'protected' ? 1000 : 8000,
      cumulativeDist: Number(cumulativeDist.toFixed(2)),
      note,
      tool: probeTool
    });
  }

  // 1. Initial Rapid to Clearance Plane above Center
  addWp({ x: cx, y: cy + clrZ, z: cz }, 'rapid', 'Rapid to Clearance Plane above target');

  if (strat.id === 'bore_centering') {
    // Drop into bore center
    addWp({ x: cx, y: cy + depthZ, z: cz }, 'protected', 'Protected feed into Bore Center (G65 P9810)');

    // Touch 1: +X
    addWp({ x: cx + r, y: cy + depthZ, z: cz }, 'touch', 'Touch Point 1: +X Axis');
    addWp({ x: cx, y: cy + depthZ, z: cz }, 'protected', 'Retract to Center');

    // Touch 2: -X
    addWp({ x: cx - r, y: cy + depthZ, z: cz }, 'touch', 'Touch Point 2: -X Axis');
    addWp({ x: cx, y: cy + depthZ, z: cz }, 'protected', 'Retract to Center');

    // Touch 3: +Z
    addWp({ x: cx, y: cy + depthZ, z: cz + r }, 'touch', 'Touch Point 3: +Z (+Y CNC)');
    addWp({ x: cx, y: cy + depthZ, z: cz }, 'protected', 'Retract to Center');

    // Touch 4: -Z
    addWp({ x: cx, y: cy + depthZ, z: cz - r }, 'touch', 'Touch Point 4: -Z (-Y CNC)');
    addWp({ x: cx, y: cy + depthZ, z: cz }, 'protected', 'Retract to Center');

    // Retract out of bore
    addWp({ x: cx, y: cy + clrZ, z: cz }, 'rapid', 'Retract to Clearance Plane');

  } else if (strat.id === 'boss_centering') {
    const overTravel = 12;
    // +X boss touch
    addWp({ x: cx + r + overTravel, y: cy + clrZ, z: cz }, 'protected', 'Position above +X clearance');
    addWp({ x: cx + r + overTravel, y: cy + depthZ, z: cz }, 'protected', 'Drop down');
    addWp({ x: cx + r, y: cy + depthZ, z: cz }, 'touch', 'Touch Point 1: +X Boss');
    addWp({ x: cx + r + overTravel, y: cy + depthZ, z: cz }, 'protected', 'Clearance retract');
    addWp({ x: cx + r + overTravel, y: cy + clrZ, z: cz }, 'protected', 'Up over boss');

    // -X boss touch
    addWp({ x: cx - r - overTravel, y: cy + clrZ, z: cz }, 'protected', 'Position above -X clearance');
    addWp({ x: cx - r - overTravel, y: cy + depthZ, z: cz }, 'protected', 'Drop down');
    addWp({ x: cx - r, y: cy + depthZ, z: cz }, 'touch', 'Touch Point 2: -X Boss');
    addWp({ x: cx - r - overTravel, y: cy + depthZ, z: cz }, 'protected', 'Clearance retract');
    addWp({ x: cx - r - overTravel, y: cy + clrZ, z: cz }, 'protected', 'Up over boss');

    // +Z boss touch
    addWp({ x: cx, y: cy + clrZ, z: cz + r + overTravel }, 'protected', 'Position above +Z clearance');
    addWp({ x: cx, y: cy + depthZ, z: cz + r + overTravel }, 'protected', 'Drop down');
    addWp({ x: cx, y: cy + depthZ, z: cz + r }, 'touch', 'Touch Point 3: +Z Boss');
    addWp({ x: cx, y: cy + depthZ, z: cz + r + overTravel }, 'protected', 'Clearance retract');
    addWp({ x: cx, y: cy + clrZ, z: cz + r + overTravel }, 'protected', 'Up over boss');

    // -Z boss touch
    addWp({ x: cx, y: cy + clrZ, z: cz - r - overTravel }, 'protected', 'Position above -Z clearance');
    addWp({ x: cx, y: cy + depthZ, z: cz - r - overTravel }, 'protected', 'Drop down');
    addWp({ x: cx, y: cy + depthZ, z: cz - r }, 'touch', 'Touch Point 4: -Z Boss');
    addWp({ x: cx, y: cy + depthZ, z: cz - r - overTravel }, 'protected', 'Clearance retract');
    addWp({ x: cx, y: cy + clrZ, z: cz - r - overTravel }, 'protected', 'Up over boss');

    // Return to Center
    addWp({ x: cx, y: cy + clrZ, z: cz }, 'rapid', 'Return to Center Clearance');

  } else if (strat.id === 'surface_z') {
    // Touch Top Z Surface
    addWp({ x: cx, y: cy, z: cz }, 'touch', 'Touch Z Surface Datum');
    addWp({ x: cx, y: cy + clrZ, z: cz }, 'rapid', 'Retract to Z Clearance');

  } else if (strat.id === 'web_x') {
    const hw = (params.nominalWidth || 30) / 2;
    addWp({ x: cx, y: cy + depthZ, z: cz }, 'protected', 'Drop into web slot');
    addWp({ x: cx + hw, y: cy + depthZ, z: cz }, 'touch', 'Touch +X wall');
    addWp({ x: cx, y: cy + depthZ, z: cz }, 'protected', 'Center');
    addWp({ x: cx - hw, y: cy + depthZ, z: cz }, 'touch', 'Touch -X wall');
    addWp({ x: cx, y: cy + depthZ, z: cz }, 'protected', 'Center');
    addWp({ x: cx, y: cy + clrZ, z: cz }, 'rapid', 'Retract');

  } else {
    // Corner WCS
    addWp({ x: cx, y: cy, z: cz }, 'touch', 'Touch Z Face');
    addWp({ x: cx, y: cy + clrZ, z: cz }, 'rapid', 'Retract');
    addWp({ x: cx - 15, y: cy + depthZ, z: cz }, 'protected', 'Approach X');
    addWp({ x: cx, y: cy + depthZ, z: cz }, 'touch', 'Touch X Edge');
    addWp({ x: cx - 15, y: cy + depthZ, z: cz }, 'protected', 'Retract X');
    addWp({ x: cx, y: cy + depthZ, z: cz - 15 }, 'protected', 'Approach Y');
    addWp({ x: cx, y: cy + depthZ, z: cz }, 'touch', 'Touch Y Edge');
    addWp({ x: cx, y: cy + clrZ, z: cz }, 'rapid', 'Retract to Clearance');
  }

  // Construct cutting & rapid line pairs for toolpath renderer compatibility
  const cuttingLines = [];
  const rapidLines = [];
  for (let i = 1; i < waypoints.length; i++) {
    const p1 = waypoints[i - 1].pos;
    const p2 = waypoints[i].pos;
    if (waypoints[i].mode === 'rapid') {
      rapidLines.push([p1, p2]);
    } else {
      cuttingLines.push([p1, p2]);
    }
  }

  return {
    strategy: strat,
    waypoints,
    cuttingLines,
    rapidLines,
    totalDistance: Number(cumulativeDist.toFixed(2)),
    touchPointsCount: waypoints.filter(w => w.mode === 'touch').length,
    probeTool
  };
}

/**
 * Generates valid multi-controller CNC G-Code for a Probing Cycle.
 */
export function generateProbingGCode(operation, controller = 'fanuc', wcs = 'G54') {
  const strat = PROBING_STRATEGIES[operation.strategyKey?.toUpperCase()] || PROBING_STRATEGIES.BORE_CENTERING;
  const p = operation.probingParams || {};
  const lines = [];

  const wcsNum = wcs === 'G54' ? 1 : wcs === 'G55' ? 2 : wcs === 'G56' ? 3 : 1;

  lines.push(`; ================================================`);
  lines.push(`; TOUCH PROBING CYCLE: ${strat.name.toUpperCase()}`);
  lines.push(`; TOOL: T99 [Renishaw OMP60 Touch Probe]`);
  lines.push(`; TARGET WORK OFFSET: ${wcs} (S${wcsNum})`);
  lines.push(`; ================================================`);
  lines.push(`T99 M06 (RENISHAW OMP60 3D TOUCH PROBE)`);

  if (controller.toLowerCase().includes('siemens')) {
    lines.push(`G00 G90 G54`);
    lines.push(`SUPA Z0. D0`);
    if (strat.id === 'bore_centering') {
      lines.push(`CYCLE977(100,0,1,${p.nominalDiameter || 40},${p.depthZ || -10},0,${p.clearanceZ || 15},1,${wcsNum})`);
    } else if (strat.id === 'surface_z') {
      lines.push(`CYCLE978(100,0,1,0.0,0,${p.clearanceZ || 15},1,${wcsNum})`);
    } else {
      lines.push(`CYCLE977(100,0,2,${p.nominalDiameter || 50},${p.depthZ || -8},0,${p.clearanceZ || 20},1,${wcsNum})`);
    }
  } else if (controller.toLowerCase().includes('heidenhain')) {
    lines.push(`TOOL CALL 99 Z S0`);
    if (strat.id === 'bore_centering') {
      lines.push(`TCH PROBE 412 DATUM CIRCLE INSIDE ~`);
      lines.push(`  Q321=+0 ;CENTER 1ST AXIS ~`);
      lines.push(`  Q322=+0 ;CENTER 2ND AXIS ~`);
      lines.push(`  Q262=${p.nominalDiameter || 40} ;NOMINAL DIAMETER ~`);
      lines.push(`  Q261=${p.depthZ || -10} ;MEASURING HEIGHT ~`);
      lines.push(`  Q260=+${p.clearanceZ || 15} ;CLEARANCE HEIGHT ~`);
      lines.push(`  Q305=${wcsNum} ;NUMBER IN TABLE`);
    } else {
      lines.push(`TCH PROBE 417 DATUM IN TS AXIS ~`);
      lines.push(`  Q261=+0.0 ;MEASURING POINT ~`);
      lines.push(`  Q260=+${p.clearanceZ || 15} ;CLEARANCE HEIGHT ~`);
      lines.push(`  Q305=${wcsNum} ;NUMBER IN TABLE`);
    }
  } else {
    // Fanuc / Haas Inspection Plus
    lines.push(`G00 G90 ${wcs} X0.0 Y0.0`);
    lines.push(`G43 H99 Z${p.clearanceZ || 15}.0`);
    lines.push(`G65 P9832 (ACTIVATE OMP60 OPTICAL PROBE)`);

    if (strat.id === 'bore_centering') {
      lines.push(`G65 P9810 Z${p.depthZ || -10}.0 F1000. (PROTECTED POSITIONING INTO BORE)`);
      lines.push(`G65 P9814 D${(p.nominalDiameter || 40).toFixed(3)} Z${p.depthZ || -10}.0 S${wcsNum}. (4-POINT BORE MEASURE & WCS UPDATE)`);
      lines.push(`G65 P9810 Z${p.clearanceZ || 15}.0 F1000. (PROTECTED RETRACT)`);
    } else if (strat.id === 'boss_centering') {
      lines.push(`G65 P9814 D${(p.nominalDiameter || 50).toFixed(3)} Z${p.depthZ || -8}.0 S${wcsNum}. (4-POINT BOSS MEASURE & WCS UPDATE)`);
      lines.push(`G65 P9810 Z${p.clearanceZ || 20}.0 F1000. (PROTECTED RETRACT)`);
    } else if (strat.id === 'surface_z') {
      lines.push(`G65 P9810 Z5.0 F1000. (PROTECTED APPROACH)`);
      lines.push(`G65 P9811 Z0.0 S${wcsNum}. (SINGLE-POINT Z DATUM TOUCH)`);
      lines.push(`G65 P9810 Z${p.clearanceZ || 15}.0 F1000. (PROTECTED RETRACT)`);
    } else if (strat.id === 'web_x' || strat.id === 'web_y') {
      const axis = strat.id === 'web_x' ? 'X' : 'Y';
      lines.push(`G65 P9810 Z${p.depthZ || -10}.0 F1000. (PROTECTED POSITIONING)`);
      lines.push(`G65 P9812 ${axis}${(p.nominalWidth || 30).toFixed(3)} S${wcsNum}. (WEB/WIDTH MEASUREMENT)`);
      lines.push(`G65 P9810 Z${p.clearanceZ || 15}.0 F1000. (PROTECTED RETRACT)`);
    } else {
      lines.push(`G65 P9815 X0.0 Y0.0 Z0.0 S${wcsNum}. (CORNER WCS DATUM SETUP)`);
    }

    lines.push(`G65 P9833 (DEACTIVATE OPTICAL PROBE SPIN-OFF)`);
    lines.push(`G00 G91 G28 Z0. (HOME Z-AXIS)`);
  }

  return lines.join('\n');
}
