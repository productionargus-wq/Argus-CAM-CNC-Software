import * as THREE from 'three';
import { compileBackplotTrajectory, resolveSafeBounds } from './toolpathEngine.js';

/**
 * Standard Industrial Workholding & Fixture Catalog
 */
export const FIXTURE_MODELS = {
  LANG_MAKRO_GRIP: {
    id: 'LANG_MAKRO_GRIP',
    name: 'Lang Makro-Grip 5-Axis Self-Centering Vise',
    manufacturer: 'Lang Technik (Germany)',
    category: '5-Axis Multiaxis',
    badge: '5-Axis Self-Centering',
    badgeColor: '#a855f7',
    description: 'Pyramid riser 5-axis vise with 3mm form-closure pre-stamped serrations. Provides unmatched cutter accessibility for 5-axis multiaxis swarf, flowline, and deep undercuts.',
    jawWidth: 125.0,
    jawHeight: 28.0,
    baseHeight: 90.0,
    baseWidth: 140.0,
    baseLength: 180.0,
    minOpening: 10.0,
    maxOpening: 160.0,
    defaultGripDepth: 3.0,
    frictionCoeff: 0.42, // Stamped form-closure serration
    recommendedForceKn: 20.0,
    maxForceKn: 35.0,
    hasRiser: true
  },
  KURT_DX6: {
    id: 'KURT_DX6',
    name: 'Kurt DX6 6" AngLock Precision Milling Vise',
    manufacturer: 'Kurt Manufacturing (USA)',
    category: '3-Axis Heavy Milling',
    badge: 'Industry Standard 6"',
    badgeColor: '#38bdf8',
    description: 'Legendary 6-inch precision milling workhorse with patented AngLock pull-down jaw to eliminate jaw lift under severe roughing cuts.',
    jawWidth: 152.4, // 6 inches
    jawHeight: 44.5,
    baseHeight: 73.0,
    baseWidth: 180.0,
    baseLength: 260.0,
    minOpening: 0.0,
    maxOpening: 228.6, // 9 inches
    defaultGripDepth: 12.0,
    frictionCoeff: 0.22, // Ground hardened steel
    recommendedForceKn: 25.0,
    maxForceKn: 45.0,
    hasRiser: false
  },
  SCHUNK_KSC: {
    id: 'SCHUNK_KSC',
    name: 'Schunk KSC 125 Precision Low-Profile Vise',
    manufacturer: 'Schunk (Germany)',
    category: 'High-Precision Milling',
    badge: 'Low-Profile Sealed',
    badgeColor: '#10b981',
    description: 'Fully encapsulated drive spindle and pre-tensioned linear guide jaws. Maximum chip shedding and ultra-compact height for large Z-travel clearance.',
    jawWidth: 125.0,
    jawHeight: 38.0,
    baseHeight: 55.0,
    baseWidth: 135.0,
    baseLength: 210.0,
    minOpening: 5.0,
    maxOpening: 200.0,
    defaultGripDepth: 6.0,
    frictionCoeff: 0.28,
    recommendedForceKn: 22.0,
    maxForceKn: 40.0,
    hasRiser: false
  },
  TOE_CLAMPS_4: {
    id: 'TOE_CLAMPS_4',
    name: 'Modular 4-Corner Toe Clamps & Step Blocks',
    manufacturer: 'Karr Precision / TE-CO',
    category: 'Plate / Heavy Tooling',
    badge: 'Modular Table Clamp',
    badgeColor: '#f59e0b',
    description: 'Hardened steel serrated step riser blocks, strap clamps, and M16 T-slot studs with spherical washer nuts for large plate fixtures and cast billets.',
    jawWidth: 40.0,
    jawHeight: 25.0,
    baseHeight: 20.0,
    baseWidth: 260.0,
    baseLength: 240.0,
    minOpening: 20.0,
    maxOpening: 350.0,
    defaultGripDepth: 15.0,
    frictionCoeff: 0.32,
    recommendedForceKn: 35.0,
    maxForceKn: 60.0,
    hasRiser: false
  },
  SCROLL_CHUCK_3JAW: {
    id: 'SCROLL_CHUCK_3JAW',
    name: '3-Jaw Self-Centering Scroll Chuck (Ø160mm)',
    manufacturer: 'Bison-Bial / Kitagawa',
    category: 'Rotary / Cylindrical',
    badge: 'Rotary Table Chuck',
    badgeColor: '#ec4899',
    description: 'Precision 3-jaw scroll chuck mounted to machine table or 4th-axis rotary faceplate for circular billet, flange, and cylindrical shaft workholding.',
    jawWidth: 32.0,
    jawHeight: 45.0,
    baseHeight: 65.0,
    baseWidth: 160.0,
    baseLength: 160.0,
    minOpening: 10.0,
    maxOpening: 145.0,
    defaultGripDepth: 18.0,
    frictionCoeff: 0.30,
    recommendedForceKn: 20.0,
    maxForceKn: 38.0,
    hasRiser: false
  }
};

/**
 * Default Project Workholding Configuration
 */
export const DEFAULT_FIXTURE_CONFIG = {
  type: 'LANG_MAKRO_GRIP',
  jawOpening: 85.0,       // mm space between clamping jaws
  gripDepth: 3.0,         // mm depth workpiece is seated into jaws
  jawWidth: 125.0,        // mm width of the jaws
  clampingForceKn: 22.0,  // kN applied clamping force
  fixtureOffset: { x: 0, y: 0, z: 0 },
  rotationDeg: 0,         // 0, 90, 180, 270 deg
  safetyClearanceMm: 5.0, // mm safety clearance envelope
  showCollisionZone: true,
  autoFitStock: true
};

/**
 * Automatically computes optimal jaw opening and placement based on stock bounds.
 */
export function calculateAutoFitFixture(stockBounds, currentConfig = DEFAULT_FIXTURE_CONFIG) {
  const b = resolveSafeBounds(stockBounds);
  const stockWidthX = Math.abs(b.max.x - b.min.x);
  const stockDepthZ = Math.abs(b.max.z - b.min.z);

  const model = FIXTURE_MODELS[currentConfig.type] || FIXTURE_MODELS.LANG_MAKRO_GRIP;
  
  // Choose clamping axis: standard is clamping across Z axis (jaws parallel to X)
  const requiredOpening = Math.max(model.minOpening, Math.min(model.maxOpening, Number(stockDepthZ.toFixed(1))));

  return {
    ...currentConfig,
    jawOpening: requiredOpening,
    gripDepth: currentConfig.gripDepth || model.defaultGripDepth,
    jawWidth: Math.max(model.jawWidth, Math.min(250, Number((stockWidthX * 1.1).toFixed(1)))),
    clampingForceKn: model.recommendedForceKn
  };
}

/**
 * Generates 3D Parametric Mesh Group for Three.js Viewport
 */
export function createParametricFixture3D(fixtureConfig = DEFAULT_FIXTURE_CONFIG, stockBounds = null) {
  const group = new THREE.Group();
  group.name = 'Parametric_Workholding_Fixture';

  const cfg = { ...DEFAULT_FIXTURE_CONFIG, ...fixtureConfig };
  const model = FIXTURE_MODELS[cfg.type] || FIXTURE_MODELS.LANG_MAKRO_GRIP;
  const b = resolveSafeBounds(stockBounds);

  // Stock floor elevation
  const stockBottomY = b.min.y;
  const gripDepth = Math.max(1.0, Math.min(cfg.gripDepth || model.defaultGripDepth, 40.0));
  const opening = Math.max(model.minOpening, cfg.jawOpening || (b.max.z - b.min.z));
  const jawWidth = cfg.jawWidth || model.jawWidth;
  const jawHeight = model.jawHeight;
  const baseHeight = model.baseHeight;

  // The top lip of the vise jaw sits exactly at: stockBottomY + gripDepth
  // Therefore the top of the jaw body sits at: jawTopY = stockBottomY + gripDepth
  const jawTopY = stockBottomY + gripDepth;
  const jawCenterY = jawTopY - jawHeight / 2;
  const baseCenterY = jawTopY - jawHeight - baseHeight / 2;

  // Materials
  const castIronMat = new THREE.MeshStandardMaterial({
    color: 0x242a38,
    metalness: 0.75,
    roughness: 0.38
  });

  const groundSteelMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.9,
    roughness: 0.22
  });

  const teethSteelMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.85,
    roughness: 0.3
  });

  const goldPullStudMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    metalness: 0.92,
    roughness: 0.15
  });

  const dangerZoneMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    transparent: true,
    opacity: 0.18,
    depthWrite: false
  });

  const dangerLineMat = new THREE.LineBasicMaterial({
    color: 0xef4444,
    transparent: true,
    opacity: 0.65
  });

  // 1. Base Machine Table Subplate / Bed Grid
  const bedWidth = Math.max(260, model.baseLength + 40);
  const bedDepth = Math.max(220, opening + 120);
  const bedPlateGeo = new THREE.BoxGeometry(bedWidth, 18, bedDepth);
  const bedPlate = new THREE.Mesh(bedPlateGeo, castIronMat);
  bedPlate.position.set(0, -9, 0);
  bedPlate.receiveShadow = true;
  group.add(bedPlate);

  // T-slot channels on bed plate
  [-60, 0, 60].forEach((tz) => {
    const slotGeo = new THREE.BoxGeometry(bedWidth - 10, 3, 14);
    const slotMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const slot = new THREE.Mesh(slotGeo, slotMat);
    slot.position.set(0, 0, tz);
    group.add(slot);
  });

  // Zero-Point Pull Studs (4 precision retention knobs)
  const studSpacingX = 80;
  const studSpacingZ = 60;
  [
    [-studSpacingX, -studSpacingZ],
    [studSpacingX, -studSpacingZ],
    [-studSpacingX, studSpacingZ],
    [studSpacingX, studSpacingZ]
  ].forEach(([sx, sz]) => {
    const studGeo = new THREE.CylinderGeometry(11, 13, 6, 24);
    const stud = new THREE.Mesh(studGeo, goldPullStudMat);
    stud.position.set(sx, 3, sz);
    group.add(stud);
  });

  // 2. Specific Model Renderers
  if (cfg.type === 'LANG_MAKRO_GRIP') {
    // 5-Axis Pyramid Riser Body
    const riserHeight = baseHeight;
    const riserTopW = jawWidth + 10;
    const riserTopD = opening + 40;
    const riserBotW = riserTopW + 30;
    const riserBotD = riserTopD + 35;

    const riserGeo = new THREE.BoxGeometry(riserTopW, riserHeight, riserTopD);
    const riser = new THREE.Mesh(riserGeo, castIronMat);
    riser.position.set(0, jawTopY - jawHeight - riserHeight / 2, 0);
    riser.castShadow = true;
    group.add(riser);

    // Center leadscrew spindle
    const screwGeo = new THREE.CylinderGeometry(8, 8, opening + 40, 20);
    const screw = new THREE.Mesh(screwGeo, groundSteelMat);
    screw.rotation.x = Math.PI / 2;
    screw.position.set(0, jawCenterY - 6, 0);
    group.add(screw);

    // Jaws: Left & Right self-centering jaws
    const jawThick = 24.0;
    const jawZPos = opening / 2 + jawThick / 2;

    [-1, 1].forEach((dir) => {
      const jawGeo = new THREE.BoxGeometry(jawWidth, jawHeight, jawThick);
      const jaw = new THREE.Mesh(jawGeo, groundSteelMat);
      jaw.position.set(0, jawCenterY, dir * jawZPos);
      jaw.castShadow = true;
      group.add(jaw);

      // Serrated Stamping Teeth Lip (Form-closure 3mm)
      const lipGeo = new THREE.BoxGeometry(jawWidth - 4, gripDepth, 4);
      const lip = new THREE.Mesh(lipGeo, teethSteelMat);
      lip.position.set(0, stockBottomY + gripDepth / 2, dir * (opening / 2 - 2));
      group.add(lip);
    });

  } else if (cfg.type === 'KURT_DX6' || cfg.type === 'SCHUNK_KSC') {
    // Long milling vise channel body
    const bodyW = jawWidth + 12;
    const bodyL = Math.max(model.baseLength, opening + 110);
    const bodyH = baseHeight;

    const bodyGeo = new THREE.BoxGeometry(bodyW, bodyH, bodyL);
    const body = new THREE.Mesh(bodyGeo, castIronMat);
    body.position.set(0, jawTopY - jawHeight - bodyH / 2, 0);
    body.castShadow = true;
    group.add(body);

    // Precision ground bed ways on top of body
    const wayGeo = new THREE.BoxGeometry(bodyW - 8, 4, bodyL - 10);
    const ways = new THREE.Mesh(wayGeo, groundSteelMat);
    ways.position.set(0, jawTopY - jawHeight + 2, 0);
    group.add(ways);

    // Fixed Jaw (rear) & Movable Jaw (front)
    const jawThick = 20.0;
    const fixedJawZ = -(opening / 2 + jawThick / 2);
    const movableJawZ = opening / 2 + jawThick / 2;

    const fixedJawGeo = new THREE.BoxGeometry(jawWidth, jawHeight, jawThick);
    const fixedJaw = new THREE.Mesh(fixedJawGeo, groundSteelMat);
    fixedJaw.position.set(0, jawCenterY, fixedJawZ);
    fixedJaw.castShadow = true;
    group.add(fixedJaw);

    const movableJaw = new THREE.Mesh(fixedJawGeo, groundSteelMat);
    movableJaw.position.set(0, jawCenterY, movableJawZ);
    movableJaw.castShadow = true;
    group.add(movableJaw);

    // Hardened Step Jaw Inserts
    const stepHeight = gripDepth;
    const stepInsertGeo = new THREE.BoxGeometry(jawWidth - 2, stepHeight, 6);
    const fixedStep = new THREE.Mesh(stepInsertGeo, teethSteelMat);
    fixedStep.position.set(0, stockBottomY + stepHeight / 2, -(opening / 2 - 3));
    group.add(fixedStep);

    const movStep = new THREE.Mesh(stepInsertGeo, teethSteelMat);
    movStep.position.set(0, stockBottomY + stepHeight / 2, opening / 2 - 3);
    group.add(movStep);

    // Hex Drive Handle Nut
    const hexGeo = new THREE.CylinderGeometry(12, 12, 22, 6);
    const hexNut = new THREE.Mesh(hexGeo, groundSteelMat);
    hexNut.rotation.x = Math.PI / 2;
    hexNut.position.set(0, jawTopY - jawHeight - bodyH / 2, bodyL / 2 + 11);
    group.add(hexNut);

  } else if (cfg.type === 'TOE_CLAMPS_4') {
    // 4 Corner Clamping Straps with Step Blocks
    const spanX = Math.max(60, (b.max.x - b.min.x) / 2 + 18);
    const spanZ = Math.max(50, (b.max.z - b.min.z) / 2 + 18);

    [
      [-spanX, -spanZ, 0],
      [spanX, -spanZ, 0],
      [-spanX, spanZ, Math.PI],
      [spanX, spanZ, Math.PI]
    ].forEach(([cx, cz, rot]) => {
      const clampArm = new THREE.Group();
      clampArm.position.set(cx, stockBottomY + gripDepth, cz);
      clampArm.rotation.y = rot;

      // Hardened Strap Clamp Bar
      const strapGeo = new THREE.BoxGeometry(32, 16, 75);
      const strap = new THREE.Mesh(strapGeo, groundSteelMat);
      strap.position.set(0, 0, 0);
      clampArm.add(strap);

      // Serrated Step Block behind clamp
      const stepBlockGeo = new THREE.BoxGeometry(32, 45, 30);
      const stepBlock = new THREE.Mesh(stepBlockGeo, castIronMat);
      stepBlock.position.set(0, -22, 30);
      clampArm.add(stepBlock);

      // M16 T-Slot Stud & Washer Nut
      const studGeo = new THREE.CylinderGeometry(8, 8, 85, 16);
      const stud = new THREE.Mesh(studGeo, teethSteelMat);
      stud.position.set(0, 10, 0);
      clampArm.add(stud);

      const nutGeo = new THREE.CylinderGeometry(14, 14, 12, 6);
      const nut = new THREE.Mesh(nutGeo, goldPullStudMat);
      nut.position.set(0, 14, 0);
      clampArm.add(nut);

      group.add(clampArm);
    });

  } else if (cfg.type === 'SCROLL_CHUCK_3JAW') {
    // Circular Scroll Chuck Body
    const chuckRadius = 80;
    const chuckHeight = baseHeight;

    const bodyGeo = new THREE.CylinderGeometry(chuckRadius, chuckRadius, chuckHeight, 48);
    const body = new THREE.Mesh(bodyGeo, castIronMat);
    body.position.set(0, jawTopY - jawHeight - chuckHeight / 2, 0);
    body.castShadow = true;
    group.add(body);

    // Center Through-Bore
    const boreGeo = new THREE.CylinderGeometry(25, 25, chuckHeight + 2, 32);
    const boreMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });
    const bore = new THREE.Mesh(boreGeo, boreMat);
    bore.position.set(0, jawTopY - jawHeight - chuckHeight / 2, 0);
    group.add(bore);

    // 3 Stepped Master Jaws (120 deg apart)
    const jawRadius = Math.max(25, opening / 2);
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const jawArm = new THREE.Group();
      jawArm.rotation.y = angle;

      const jawGeo = new THREE.BoxGeometry(28, jawHeight, 35);
      const jaw = new THREE.Mesh(jawGeo, groundSteelMat);
      jaw.position.set(0, jawCenterY, jawRadius + 17.5);
      jawArm.add(jaw);

      group.add(jawArm);
    }
  }

  // 3. Collision Exclusion Safety Envelope (Translucent Red Bounding Volume)
  if (cfg.showCollisionZone) {
    const margin = cfg.safetyClearanceMm || 5.0;
    const envW = Math.max(jawWidth + margin * 2, (b.max.x - b.min.x) + 40);
    const envD = opening + 60 + margin * 2;
    const envH = jawHeight + margin * 2;

    const envGeo = new THREE.BoxGeometry(envW, envH, envD);
    const envMesh = new THREE.Mesh(envGeo, dangerZoneMat);
    envMesh.position.set(0, jawCenterY, 0);

    const edges = new THREE.EdgesGeometry(envGeo);
    const lineMesh = new THREE.LineSegments(edges, dangerLineMat);
    envMesh.add(lineMesh);

    group.add(envMesh);
  }

  // Apply translational and rotational offsets
  if (cfg.fixtureOffset) {
    group.position.x += cfg.fixtureOffset.x || 0;
    group.position.y += cfg.fixtureOffset.y || 0;
    group.position.z += cfg.fixtureOffset.z || 0;
  }
  if (cfg.rotationDeg) {
    group.rotation.y = (cfg.rotationDeg * Math.PI) / 180;
  }

  return group;
}

/**
 * Computes exact 3D Collision Hulls for the selected Fixture Configuration.
 */
export function getFixtureCollisionHulls(fixtureConfig = DEFAULT_FIXTURE_CONFIG, stockBounds = null) {
  const cfg = { ...DEFAULT_FIXTURE_CONFIG, ...fixtureConfig };
  const model = FIXTURE_MODELS[cfg.type] || FIXTURE_MODELS.LANG_MAKRO_GRIP;
  const b = resolveSafeBounds(stockBounds);

  const stockBottomY = b.min.y;
  const gripDepth = Math.max(1.0, Math.min(cfg.gripDepth || model.defaultGripDepth, 40.0));
  const opening = Math.max(model.minOpening, cfg.jawOpening || (b.max.z - b.min.z));
  const jawWidth = cfg.jawWidth || model.jawWidth;
  const jawHeight = model.jawHeight;
  const jawTopY = stockBottomY + gripDepth;
  const jawBottomY = jawTopY - jawHeight;

  const hulls = [];

  if (cfg.type === 'LANG_MAKRO_GRIP' || cfg.type === 'KURT_DX6' || cfg.type === 'SCHUNK_KSC') {
    const halfJawW = jawWidth / 2;
    const jawThick = 25.0;
    const halfOpening = opening / 2;

    // Jaw 1 (Positive Z side)
    hulls.push({
      name: 'Movable Vise Jaw (Front)',
      box: new THREE.Box3(
        new THREE.Vector3(-halfJawW, jawBottomY, halfOpening),
        new THREE.Vector3(halfJawW, jawTopY, halfOpening + jawThick)
      )
    });

    // Jaw 2 (Negative Z side)
    hulls.push({
      name: 'Fixed Vise Jaw (Rear)',
      box: new THREE.Box3(
        new THREE.Vector3(-halfJawW, jawBottomY, -halfOpening - jawThick),
        new THREE.Vector3(halfJawW, jawTopY, -halfOpening)
      )
    });

    // Vise Main Body / Riser
    hulls.push({
      name: 'Vise Body & Table Riser',
      box: new THREE.Box3(
        new THREE.Vector3(-halfJawW - 15, -18, -halfOpening - 40),
        new THREE.Vector3(halfJawW + 15, jawBottomY, halfOpening + 40)
      )
    });
  } else if (cfg.type === 'TOE_CLAMPS_4') {
    const spanX = Math.max(60, (b.max.x - b.min.x) / 2 + 18);
    const spanZ = Math.max(50, (b.max.z - b.min.z) / 2 + 18);

    [
      { name: 'Toe Clamp 1 (Front-Left)', x: -spanX, z: spanZ },
      { name: 'Toe Clamp 2 (Front-Right)', x: spanX, z: spanZ },
      { name: 'Toe Clamp 3 (Rear-Left)', x: -spanX, z: -spanZ },
      { name: 'Toe Clamp 4 (Rear-Right)', x: spanX, z: -spanZ }
    ].forEach((c) => {
      hulls.push({
        name: c.name,
        box: new THREE.Box3(
          new THREE.Vector3(c.x - 22, -18, c.z - 40),
          new THREE.Vector3(c.x + 22, stockBottomY + gripDepth + 18, c.z + 40)
        )
      });
    });
  } else {
    // Chuck or Cylindrical
    const rad = 85.0;
    hulls.push({
      name: 'Scroll Chuck Master Body & Jaws',
      box: new THREE.Box3(
        new THREE.Vector3(-rad, -18, -rad),
        new THREE.Vector3(rad, jawTopY, rad)
      )
    });
  }

  return hulls;
}

/**
 * Audits all toolpaths against the fixture exclusion geometry.
 * Detects cutter shank and toolholder gouges into steel vise jaws.
 */
export function auditFixtureCollisions(operations = [], tools = [], fixtureConfig = DEFAULT_FIXTURE_CONFIG, stockBounds = null) {
  const hulls = getFixtureCollisionHulls(fixtureConfig, stockBounds);
  const safetyClearance = fixtureConfig.safetyClearanceMm || 5.0;

  // Compile full backplot trajectory
  const trajectory = compileBackplotTrajectory(operations, tools, stockBounds);
  const waypoints = trajectory.waypoints || [];

  const issues = [];
  let minObservedClearance = 999.0;
  const opClearances = {};

  operations.forEach((op) => {
    opClearances[op.id] = {
      opId: op.id,
      opName: op.name,
      minDist: 999.0,
      status: 'safe',
      nearestHull: null,
      collisionPoint: null
    };
  });

  if (waypoints.length === 0 || hulls.length === 0) {
    return {
      status: 'safe',
      totalIssues: 0,
      criticalCount: 0,
      nearMissCount: 0,
      minObservedClearance: 50.0,
      hullsCount: hulls.length,
      opClearances: Object.values(opClearances),
      issues: []
    };
  }

  waypoints.forEach((wp) => {
    const pt = wp.pos;
    const tool = wp.tool || tools[0] || { diameter: 10, fluteLength: 25, length: 65 };
    const toolRadius = (tool.diameter || 10) / 2;

    hulls.forEach((hull) => {
      // Distance from point to Box3
      const clamped = new THREE.Vector3();
      hull.box.clampPoint(pt, clamped);
      const dist = pt.distanceTo(clamped) - toolRadius;

      if (dist < minObservedClearance) {
        minObservedClearance = Math.max(0, dist);
      }

      const opReport = opClearances[wp.opId];
      if (opReport && dist < opReport.minDist) {
        opReport.minDist = Number(Math.max(0, dist).toFixed(2));
        opReport.nearestHull = hull.name;
        opReport.collisionPoint = {
          x: Number(pt.x.toFixed(2)),
          y: Number(pt.y.toFixed(2)),
          z: Number(pt.z.toFixed(2))
        };

        if (dist <= 0) {
          opReport.status = 'danger';
        } else if (dist < safetyClearance) {
          opReport.status = 'caution';
        } else {
          opReport.status = 'safe';
        }
      }

      // Record critical collision or near-miss issue
      if (dist <= 0) {
        const id = `coll_fixture_${wp.opId}_${hull.name}`;
        if (!issues.some((i) => i.id === id)) {
          issues.push({
            id,
            opId: wp.opId,
            opName: wp.opName,
            hullName: hull.name,
            severity: 'Critical Crash',
            type: 'danger',
            message: `Carbide cutter penetrates ${hull.name}! Deep cut or rapid traverse crashed into vise steel.`,
            point: { x: Number(pt.x.toFixed(2)), y: Number(pt.y.toFixed(2)), z: Number(pt.z.toFixed(2)) },
            clearanceMm: 0.0
          });
        }
      } else if (dist < safetyClearance) {
        const id = `near_fixture_${wp.opId}_${hull.name}`;
        if (!issues.some((i) => i.id === id)) {
          issues.push({
            id,
            opId: wp.opId,
            opName: wp.opName,
            hullName: hull.name,
            severity: 'Clearance Warning',
            type: 'caution',
            message: `Low clearance (${dist.toFixed(1)}mm) to ${hull.name}. Violates minimum ${safetyClearance}mm buffer zone.`,
            point: { x: Number(pt.x.toFixed(2)), y: Number(pt.y.toFixed(2)), z: Number(pt.z.toFixed(2)) },
            clearanceMm: Number(dist.toFixed(2))
          });
        }
      }
    });
  });

  const criticalCount = issues.filter((i) => i.type === 'danger').length;
  const nearMissCount = issues.filter((i) => i.type === 'caution').length;

  let overallStatus = 'safe';
  if (criticalCount > 0) overallStatus = 'danger';
  else if (nearMissCount > 0) overallStatus = 'caution';

  return {
    status: overallStatus,
    totalIssues: issues.length,
    criticalCount,
    nearMissCount,
    minObservedClearance: Number(minObservedClearance.toFixed(2)),
    hullsCount: hulls.length,
    opClearances: Object.values(opClearances),
    issues
  };
}

/**
 * Calculates Cutting Force vs Clamping Retention Safety Factor
 */
export function calculateClampingPhysics(fixtureConfig = DEFAULT_FIXTURE_CONFIG, activeOp = null, tool = null, materialKey = 'ALUMINUM_6061') {
  const model = FIXTURE_MODELS[fixtureConfig.type] || FIXTURE_MODELS.LANG_MAKRO_GRIP;
  const clampForceKn = Number(fixtureConfig.clampingForceKn || model.recommendedForceKn);
  const mu = Number(model.frictionCoeff || 0.35);

  // Maximum holding friction force F_hold = 2 * mu * F_clamp (two jaws)
  const totalClampingNewtons = clampForceKn * 1000;
  const holdingForceNewtons = 2 * mu * totalClampingNewtons;

  // Approximate peak cutting force from operation feeds & speeds
  const feed = Number(activeOp?.feedRate || tool?.feedRate || 1200); // mm/min
  const rpm = Number(activeOp?.spindleRpm || tool?.rpm || 8000);
  const dia = Number(tool?.diameter || 10);
  const ap = Number(activeOp?.stepdown || 2.0); // axial depth
  const ae = Number((dia * (activeOp?.stepoverPct || 50)) / 100); // radial width

  // Specific cutting force kc (N/mm2)
  const kcValues = {
    ALUMINUM_6061: 750,
    STEEL_4140: 1950,
    STAINLESS_304: 2200,
    TITANIUM_GR5: 2800,
    BRASS_360: 650,
    DELRIN: 350
  };
  const kc = kcValues[materialKey] || 800;

  // Metal Removal Rate Q (cm3/min)
  const mrrCm3Min = (ap * ae * feed) / 1000;
  // Tangential cutting force Fc = (kc * ap * feed) / (1000 * 60) * chip load factor
  const chipLoad = feed / (Math.max(1, rpm) * (tool?.flutes || 3));
  const cuttingForceFc = Math.max(80, Math.round((kc * ap * ae * chipLoad) / Math.max(0.01, dia * 0.1)));

  // Safety Factor against Part Slippage
  const safetyFactor = Number((holdingForceNewtons / Math.max(1, cuttingForceFc)).toFixed(1));

  let securityRating = 'SECURE';
  let badgeColor = '#10b981';

  if (safetyFactor < 1.2) {
    securityRating = 'CRITICAL PULLOUT RISK';
    badgeColor = '#ef4444';
  } else if (safetyFactor < 2.0) {
    securityRating = 'MODERATE RETENTION';
    badgeColor = '#f59e0b';
  }

  return {
    clampForceKn,
    totalClampingNewtons: Math.round(totalClampingNewtons),
    holdingForceNewtons: Math.round(holdingForceNewtons),
    cuttingForceFc,
    safetyFactor,
    securityRating,
    badgeColor,
    mrrCm3Min: Number(mrrCm3Min.toFixed(1))
  };
}

