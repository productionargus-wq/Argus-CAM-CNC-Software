import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

/**
 * Creates the 5-Axis Turbo Impeller sample CAD model
 */
export function createImpellerGeometry() {
  const group = new THREE.Group();
  group.name = "sample_impeller";

  const hubMat = new THREE.MeshStandardMaterial({
    color: 0x60a5fa,
    metalness: 0.85,
    roughness: 0.25,
  });

  // Central hub
  const hubGeo = new THREE.CylinderGeometry(10, 26, 40, 32);
  const hub = new THREE.Mesh(hubGeo, hubMat);
  hub.position.y = 20;
  group.add(hub);

  // Central bore hole
  const boreGeo = new THREE.CylinderGeometry(6, 6, 42, 32);
  const boreMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.3 });
  const bore = new THREE.Mesh(boreGeo, boreMat);
  bore.position.y = 20;
  group.add(bore);

  // 8 Twisted Impeller Blades
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    metalness: 0.8,
    roughness: 0.2,
    side: THREE.DoubleSide
  });

  const numBlades = 8;
  for (let i = 0; i < numBlades; i++) {
    const angle = (i / numBlades) * Math.PI * 2;
    const bladeGeo = new THREE.BoxGeometry(22, 28, 2.5);
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.set(Math.cos(angle) * 19, 20, Math.sin(angle) * 19);
    blade.rotation.y = -angle + 0.4;
    blade.rotation.z = 0.35; // 5-axis helical twist
    group.add(blade);
  }

  return group;
}

/**
 * Creates the Aerospace Pocketing Bracket sample CAD model
 */
export function createAerospaceBracket() {
  const group = new THREE.Group();
  group.name = "sample_bracket";

  const mat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    metalness: 0.7,
    roughness: 0.3
  });

  // Base Plate
  const baseGeo = new THREE.BoxGeometry(90, 16, 65);
  const base = new THREE.Mesh(baseGeo, mat);
  base.position.y = 8;
  group.add(base);

  // Vertical Upright / Flange
  const flangeGeo = new THREE.BoxGeometry(20, 48, 65);
  const flange = new THREE.Mesh(flangeGeo, mat);
  flange.position.set(-35, 32, 0);
  group.add(flange);

  // Rib Support
  const ribGeo = new THREE.BoxGeometry(50, 24, 8);
  const rib = new THREE.Mesh(ribGeo, mat);
  rib.position.set(0, 20, 0);
  group.add(rib);

  // Pocket recess
  const pocketGeo = new THREE.BoxGeometry(34, 10, 45);
  const pocketMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.9, roughness: 0.4 });
  const pocket = new THREE.Mesh(pocketGeo, pocketMat);
  pocket.position.set(15, 12, 0);
  group.add(pocket);

  return group;
}

/**
 * Creates the Precision Mold Core sample CAD model
 */
export function createMoldCoreGeometry() {
  const group = new THREE.Group();
  group.name = "sample_mold_core";

  const mat = new THREE.MeshStandardMaterial({
    color: 0xa5b4fc,
    metalness: 0.9,
    roughness: 0.15
  });

  // Base Block
  const baseGeo = new THREE.BoxGeometry(75, 20, 75);
  const base = new THREE.Mesh(baseGeo, mat);
  base.position.y = 10;
  group.add(base);

  // Spherical Cavity Dome
  const domeGeo = new THREE.SphereGeometry(24, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const dome = new THREE.Mesh(domeGeo, mat);
  dome.position.y = 20;
  group.add(dome);

  return group;
}

/**
 * Creates the Mastercam 2019 Milling Operations Tutorial part (YouTube PfPOn5-8A80 by CAD CAM PDF)
 * 5.0" x 5.0" plate with 4x R0.75" corner fillets, central 2.0" bore, and 4x 0.5" corner bolt holes at (±1.75", ±1.75").
 * Uses mm by default (127mm x 127mm x 50.8mm) or configurable units.
 */
export function createMastercam2019TutorialPart(options = {}) {
  const isInch = options.units === 'inch';
  const scale = isInch ? 1 : 25.4;

  const width = (options.width ?? 5.0) * scale;
  const depth = (options.depth ?? 5.0) * scale;
  const height = (options.thickness ?? 2.0) * scale;
  const filletRadius = (options.filletRadius ?? 0.75) * scale;
  const centerHoleDia = (options.centerHoleDia ?? 2.0) * scale;
  const cornerHoleDia = (options.cornerHoleDia ?? 0.5) * scale;
  const holeOffset = (options.holeOffset ?? 1.75) * scale;

  const group = new THREE.Group();
  group.name = "Mastercam2019_Milling_Tutorial.mcam";

  // Create 2D Shape with rounded rectangle outer boundary
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hd = depth / 2;
  const r = filletRadius;

  shape.moveTo(-hw + r, -hd);
  shape.lineTo(hw - r, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  shape.lineTo(hw, hd - r);
  shape.quadraticCurveTo(hw, hd, hw - r, hd);
  shape.lineTo(-hw + r, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  shape.lineTo(-hw, -hd + r);
  shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

  // Central through-bore hole
  const centerHole = new THREE.Path();
  const centerR = centerHoleDia / 2;
  centerHole.absarc(0, 0, centerR, 0, Math.PI * 2, true);
  shape.holes.push(centerHole);

  // 4 Corner Bolt Holes
  const cornerR = cornerHoleDia / 2;
  const holePositions = [
    [holeOffset, holeOffset],
    [-holeOffset, holeOffset],
    [-holeOffset, -holeOffset],
    [holeOffset, -holeOffset]
  ];

  holePositions.forEach(([hx, hy]) => {
    const boltHole = new THREE.Path();
    boltHole.absarc(hx, hy, cornerR, 0, Math.PI * 2, true);
    shape.holes.push(boltHole);
  });

  // Extrude solid
  const extrudeSettings = {
    steps: 1,
    depth: height,
    bevelEnabled: false
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.rotateX(-Math.PI / 2);

  const mat = new THREE.MeshStandardMaterial({
    color: options.color || 0x38bdf8,
    metalness: 0.8,
    roughness: 0.25
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = "Tutorial_Milling_Solid_Body";
  mesh.position.y = 0;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  // Add cylinder hole meshes for automatic feature recognition
  holePositions.forEach(([hx, hz], idx) => {
    const holeCylGeo = new THREE.CylinderGeometry(cornerR, cornerR, height + 1, 32);
    const holeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.3 });
    const holeCylMesh = new THREE.Mesh(holeCylGeo, holeMat);
    holeCylMesh.name = `Hole_${idx + 1}_Ø${cornerHoleDia.toFixed(1)}mm`;
    holeCylMesh.position.set(hx, height / 2, hz);
    group.add(holeCylMesh);
  });

  // Central bore cylinder mesh for feature recognition
  const centerBoreGeo = new THREE.CylinderGeometry(centerR, centerR, height + 1, 48);
  const centerBoreMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.3 });
  const centerBoreMesh = new THREE.Mesh(centerBoreGeo, centerBoreMat);
  centerBoreMesh.name = `Bore_Center_Ø${centerHoleDia.toFixed(1)}mm`;
  centerBoreMesh.position.set(0, height / 2, 0);
  group.add(centerBoreMesh);

  group.userData = {
    isMastercamTutorial: true,
    width,
    depth,
    height,
    filletRadius,
    centerHoleDia,
    cornerHoleDia,
    holePositions,
    units: isInch ? 'inch' : 'mm'
  };

  return group;
}

/**
 * Creates 2D Wireframe curves matching the tutorial part for Mastercam Level 10
 */
export function createMastercam2019TutorialWireframe(scale = 25.4) {
  const width = 5.0 * scale;
  const depth = 5.0 * scale;
  const height = 2.0 * scale;
  const filletRadius = 0.75 * scale;
  const centerHoleDia = 2.0 * scale;
  const cornerHoleDia = 0.5 * scale;
  const holeOffset = 1.75 * scale;

  const entities = [];
  const topY = height;

  // 1. Rectangle Outer Boundary with Fillets
  entities.push(
    createWireframeRect(width, depth, topY, filletRadius, [0, 0], {
      color: '#38bdf8',
      name: 'Wireframe_Outer_Profile'
    })
  );

  // 2. Central Bore Circle
  entities.push(
    createWireframeCircle(centerHoleDia / 2, topY, [0, 0], 0, 360, 'G17', {
      color: '#a855f7',
      name: 'Wireframe_Center_Bore'
    })
  );

  // 3. Four Corner Bolt Holes
  const holePositions = [
    [holeOffset, holeOffset],
    [-holeOffset, holeOffset],
    [-holeOffset, -holeOffset],
    [holeOffset, -holeOffset]
  ];

  holePositions.forEach(([hx, hz], idx) => {
    entities.push(
      createWireframeCircle(cornerHoleDia / 2, topY, [hx, hz], 0, 360, 'G17', {
        color: '#10b981',
        name: `Wireframe_Corner_Hole_${idx + 1}`
      })
    );
  });

  return entities;
}

/**
 * Creates the TITANS of CNC: TITAN-1M Aerospace Benchmark Milling Part
 * Finished workpiece: 4.000" x 1.900" x 0.750" (101.6mm x 48.26mm x 19.05mm)
 * Features 2.5D stepped islands, central triangular pocket, and 7x 10-32 tapped holes.
 */
export function createTitan1MPart(options = {}) {
  const isInch = options.units === 'inch';
  const scale = isInch ? 1 : 25.4;

  const width = (options.width ?? 4.0) * scale;       // 101.6 mm
  const depth = (options.depth ?? 1.9) * scale;       // 48.26 mm
  const height = (options.thickness ?? 0.75) * scale; // 19.05 mm
  const stepDepth = (options.stepDepth ?? 0.5) * scale; // 12.7 mm
  const tapHoleDia = 0.159 * scale;                   // 4.039 mm (#21 drill)
  const tapR = tapHoleDia / 2;

  const group = new THREE.Group();
  group.name = "TITAN-1M.mcam";

  const mat = new THREE.MeshStandardMaterial({
    color: options.color || 0x38bdf8,
    metalness: 0.85,
    roughness: 0.22
  });

  const hw = width / 2;
  const hd = depth / 2;
  const cornerR = 0.375 * scale;

  // 1. Base Workpiece Body (from Z = 0 to height)
  const baseShape = new THREE.Shape();
  baseShape.moveTo(-hw + cornerR, -hd);
  baseShape.lineTo(hw - cornerR, -hd);
  baseShape.quadraticCurveTo(hw, -hd, hw, -hd + cornerR);
  baseShape.lineTo(hw, hd - cornerR);
  baseShape.quadraticCurveTo(hw, hd, hw - cornerR, hd);
  baseShape.lineTo(-hw + cornerR, hd);
  baseShape.quadraticCurveTo(-hw, hd, -hw, hd - cornerR);
  baseShape.lineTo(-hw, -hd + cornerR);
  baseShape.quadraticCurveTo(-hw, -hd, -hw + cornerR, -hd);

  // 7 Tapped Holes
  const holePositions = [
    [-1.625 * scale, -0.575 * scale],
    [-0.850 * scale, -0.575 * scale],
    [0.850 * scale, -0.575 * scale],
    [1.625 * scale, -0.575 * scale],
    [-1.625 * scale, 0.575 * scale],
    [0.000 * scale, 0.575 * scale],
    [1.625 * scale, 0.575 * scale]
  ];

  holePositions.forEach(([hx, hy]) => {
    const hole = new THREE.Path();
    hole.absarc(hx, hy, tapR, 0, Math.PI * 2, true);
    baseShape.holes.push(hole);
  });

  const baseExtrude = new THREE.ExtrudeGeometry(baseShape, { steps: 1, depth: height, bevelEnabled: false });
  baseExtrude.rotateX(-Math.PI / 2);
  const baseMesh = new THREE.Mesh(baseExtrude, mat);
  baseMesh.name = "TITAN_1M_Solid_Body";
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Add Central Triangular Pocket Cavity (machined pocket floor)
  const pocketMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    metalness: 0.75,
    roughness: 0.35,
    side: THREE.DoubleSide
  });

  const pocketShape = new THREE.Shape();
  const p1 = [-0.750 * scale, 0.350 * scale];
  const p2 = [0.750 * scale, 0.350 * scale];
  const p3 = [0.000 * scale, -0.400 * scale];
  pocketShape.moveTo(p1[0], p1[1]);
  pocketShape.lineTo(p2[0], p2[1]);
  pocketShape.lineTo(p3[0], p3[1]);
  pocketShape.closePath();

  const pocketGeo = new THREE.ExtrudeGeometry(pocketShape, { steps: 1, depth: stepDepth + 0.1, bevelEnabled: false });
  pocketGeo.rotateX(-Math.PI / 2);
  const pocketMesh = new THREE.Mesh(pocketGeo, pocketMat);
  pocketMesh.name = "Pocket_Center_Triangular_Cavity";
  pocketMesh.position.y = height - stepDepth;
  group.add(pocketMesh);

  // 3. 7 Tapped Hole Cylinders (for hole recognition & rendering)
  const holeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.3 });
  holePositions.forEach(([hx, hz], idx) => {
    const holeGeo = new THREE.CylinderGeometry(tapR, tapR, height + 1, 32);
    const holeMesh = new THREE.Mesh(holeGeo, holeMat);
    holeMesh.name = `Hole_${idx + 1}_10-32_UNF`;
    holeMesh.position.set(hx, height / 2, hz);
    group.add(holeMesh);

    // Top Chamfer Cone
    const chamferGeo = new THREE.CylinderGeometry(tapR * 1.5, tapR, 0.05 * scale, 32);
    const chamferMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.2 });
    const chamferMesh = new THREE.Mesh(chamferGeo, chamferMat);
    chamferMesh.position.set(hx, height - 0.025 * scale, hz);
    group.add(chamferMesh);
  });

  group.userData = {
    isTitan1M: true,
    width,
    depth,
    height,
    stepDepth,
    cornerR,
    tapHoleDia,
    holePositions,
    units: isInch ? 'inch' : 'mm'
  };

  return group;
}

/**
 * Creates 2D Wireframe curves matching TITAN-1M for Mastercam Level 10
 */
export function createTitan1MWireframe(scale = 25.4) {
  const width = 4.0 * scale;
  const depth = 1.9 * scale;
  const height = 0.75 * scale;
  const cornerR = 0.375 * scale;
  const tapHoleDia = 0.159 * scale;
  const topY = height;

  const entities = [];

  // 1. Rectangle Outer Boundary with Fillets
  entities.push(
    createWireframeRect(width, depth, topY, cornerR, [0, 0], {
      color: '#38bdf8',
      name: 'Wireframe_TITAN_1M_Outer_Profile'
    })
  );

  // 2. Central Triangular Pocket
  const p1 = [-0.750 * scale, 0.350 * scale];
  const p2 = [0.750 * scale, 0.350 * scale];
  const p3 = [0.000 * scale, -0.400 * scale];
  entities.push(
    createWireframePolygon([
      [p1[0], topY, p1[1]],
      [p2[0], topY, p2[1]],
      [p3[0], topY, p3[1]]
    ], {
      color: '#a855f7',
      name: 'Wireframe_Center_Pocket_Triangular'
    })
  );

  // 3. 7 Tapped Hole Wireframe Circles (10-32 UNF)
  const holePositions = [
    [-1.625 * scale, -0.575 * scale],
    [-0.850 * scale, -0.575 * scale],
    [0.850 * scale, -0.575 * scale],
    [1.625 * scale, -0.575 * scale],
    [-1.625 * scale, 0.575 * scale],
    [0.000 * scale, 0.575 * scale],
    [1.625 * scale, 0.575 * scale]
  ];

  holePositions.forEach(([hx, hz], idx) => {
    entities.push(
      createWireframeCircle(tapHoleDia / 2, topY, [hx, hz], 0, 360, 'G17', {
        color: '#10b981',
        name: `Wireframe_Hole_${idx + 1}_10-32`
      })
    );
  });

  return entities;
}

/**
 * Creates the Mastercam "Base Structure-ALU" turned & milled multi-body CAD part (Image 2)
 * Features purple cylindrical flange with radial holes, blue sculpted body, and yellow toolpath passes
 */
export function createMastercamBaseStructureALU() {
  const group = new THREE.Group();
  group.name = "Base Structure-ALU.mcam";

  // 1. Purple Cylindrical Flange Boss (Right Section)
  const purpleMat = new THREE.MeshStandardMaterial({
    color: 0xc026d3,
    roughness: 0.25,
    metalness: 0.45
  });

  // Hollow turned cylinder
  const cylOuterR = 34;
  const cylInnerR = 25;
  const cylLength = 65;

  const cylGeom = new THREE.CylinderGeometry(cylOuterR, cylOuterR, cylLength, 48, 1, true);
  cylGeom.rotateZ(Math.PI / 2);
  const cylMesh = new THREE.Mesh(cylGeom, purpleMat);
  cylMesh.position.set(60, 20, 0);
  group.add(cylMesh);

  // Inner bore wall
  const boreGeom = new THREE.CylinderGeometry(cylInnerR, cylInnerR, cylLength + 0.5, 48, 1, true);
  boreGeom.rotateZ(Math.PI / 2);
  const boreMat = new THREE.MeshStandardMaterial({ color: 0x86198f, roughness: 0.35, metalness: 0.5, side: THREE.BackSide });
  const boreMesh = new THREE.Mesh(boreGeom, boreMat);
  boreMesh.position.set(60, 20, 0);
  group.add(boreMesh);

  // End cap rim ring
  const rimShape = new THREE.Shape();
  rimShape.absarc(0, 0, cylOuterR, 0, Math.PI * 2, false);
  const holePath = new THREE.Path();
  holePath.absarc(0, 0, cylInnerR, 0, Math.PI * 2, true);
  rimShape.holes.push(holePath);

  const rimGeom = new THREE.ShapeGeometry(rimShape);
  rimGeom.rotateY(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeom, purpleMat);
  rimMesh.position.set(60 + cylLength / 2, 20, 0);
  group.add(rimMesh);

  // Radial drilled holes around the purple boss
  const holeMat = new THREE.MeshBasicMaterial({ color: 0x1e1b4b });
  for (let h = 0; h < 8; h++) {
    const ang = (h / 8) * Math.PI * 2;
    const holeCyl = new THREE.CylinderGeometry(2.5, 2.5, 6, 16);
    const hm = new THREE.Mesh(holeCyl, holeMat);
    hm.position.set(45 + (h % 2) * 15, 20 + Math.sin(ang) * (cylOuterR - 1), Math.cos(ang) * (cylOuterR - 1));
    hm.rotation.x = ang;
    group.add(hm);
  }

  // Edge wireframe for purple section
  const purpleEdges = new THREE.EdgesGeometry(new THREE.CylinderGeometry(cylOuterR, cylOuterR, cylLength, 48), 25);
  purpleEdges.rotateZ(Math.PI / 2);
  const purpleLine = new THREE.LineSegments(purpleEdges, new THREE.LineBasicMaterial({ color: 0x4a044e, linewidth: 1.5 }));
  purpleLine.position.set(60, 20, 0);
  group.add(purpleLine);

  // 2. Bright Blue Sculptured Prismatic Workpiece (Left Section)
  const blueMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.3,
    metalness: 0.4
  });

  const baseWidth = 110;
  const baseHeight = 42;
  const baseDepth = 68;

  const baseBody = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
  const baseMesh = new THREE.Mesh(baseBody, blueMat);
  baseMesh.position.set(-25, 21, 0);
  group.add(baseMesh);

  // Stepped shoulder/pocket cut into blue body
  const pocketCut = new THREE.BoxGeometry(45, 18, 50);
  const pocketMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.35, metalness: 0.5 });
  const pocketMesh = new THREE.Mesh(pocketCut, pocketMat);
  pocketMesh.position.set(-45, 33, 0);
  group.add(pocketMesh);

  // Front slot cut
  const slotGeom = new THREE.BoxGeometry(30, 20, 16);
  const slotMesh = new THREE.Mesh(slotGeom, pocketMat);
  slotMesh.position.set(-10, 10, 28);
  group.add(slotMesh);

  // Edge wireframe for blue section
  const blueEdges = new THREE.EdgesGeometry(baseBody, 25);
  const blueLine = new THREE.LineSegments(blueEdges, new THREE.LineBasicMaterial({ color: 0x082f49, linewidth: 1.5 }));
  blueLine.position.set(-25, 21, 0);
  group.add(blueLine);

  // 3. Yellow 3D Surface Finish Contour Toolpaths with Vertical Retract Lines (Matching Image 2)
  const toolpathLines = [];
  const yellowColor = 0xfacc15; // Mastercam bright yellow toolpath
  const zClearance = 60;

  // Surface contour passes over blue body
  for (let pass = 0; pass < 12; pass++) {
    const yLevel = 42 - pass * 2.8;
    const xStart = -75;
    const xEnd = 25;
    const zOffset = 32 - pass * 1.5;

    // Cutting pass line
    toolpathLines.push(
      new THREE.Vector3(xStart, yLevel, zOffset),
      new THREE.Vector3(xEnd, yLevel, zOffset)
    );

    // Cross pass
    toolpathLines.push(
      new THREE.Vector3(xEnd, yLevel, zOffset),
      new THREE.Vector3(xEnd, yLevel, -zOffset)
    );
    toolpathLines.push(
      new THREE.Vector3(xEnd, yLevel, -zOffset),
      new THREE.Vector3(xStart, yLevel, -zOffset)
    );

    // Occasional vertical lead-in/retract lines
    if (pass % 3 === 0) {
      toolpathLines.push(
        new THREE.Vector3(xEnd, yLevel, zOffset),
        new THREE.Vector3(xEnd, yLevel + zClearance, zOffset)
      );
    }
  }

  const tpGeom = new THREE.BufferGeometry().setFromPoints(toolpathLines);
  const tpMat = new THREE.LineBasicMaterial({ color: yellowColor, linewidth: 2 });
  const tpObj = new THREE.LineSegments(tpGeom, tpMat);
  group.add(tpObj);

  group.userData = {
    filename: "Base Structure-ALU.mcam",
    format: "Mastercam Part File (*.mcam)",
    partName: "Base Structure-ALU",
    material: "Alu 6061-T6 (Turned & Milled)",
    dimensions: { x: 175.0, y: 70.0, z: 65.0 }
  };

  return group;
}

/**
 * Parses user-uploaded STL file (binary or ASCII)
 */
export async function parseSTLFile(file) {
  const buffer = await file.arrayBuffer();
  const loader = new STLLoader();
  const geometry = loader.parse(buffer);

  geometry.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    metalness: 0.7,
    roughness: 0.3,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, mat);
  const group = new THREE.Group();
  group.name = file.name;
  group.add(mesh);
  return group;
}

/**
 * Parses user-uploaded Wavefront OBJ file
 */
export async function parseOBJFile(file) {
  const text = await file.text();
  const loader = new OBJLoader();
  const obj = loader.parse(text);

  const defaultMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    metalness: 0.75,
    roughness: 0.25,
    side: THREE.DoubleSide
  });

  obj.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry) {
        child.geometry.computeVertexNormals();
      }
      child.material = defaultMat.clone();
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  obj.name = file.name;
  return obj;
}

/**
 * Creates a parametric 3D rectangular box solid billet
 */
export function createBoxGeometry(
  w = 80,
  h = 35,
  d = 60,
  name = "Rectangular_Billet",
  options = {}
) {
  const group = new THREE.Group();
  group.name = name;

  const color = options.color || 0x38bdf8;
  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: options.metalness !== undefined ? options.metalness : 0.75,
    roughness: options.roughness !== undefined ? options.roughness : 0.25
  });

  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, mat);

  if (options.origin === 'corner') {
    mesh.position.set(w / 2, h / 2, d / 2);
  } else {
    mesh.position.set(0, h / 2, 0);
  }

  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geo);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 1.5 }));
  edgeLine.position.copy(mesh.position);
  group.add(edgeLine);

  group.userData = {
    type: 'solid_box',
    width: w,
    height: h,
    depth: d,
    volumeCm3: Number(((w * h * d) / 1000).toFixed(2)),
    material: options.material || 'Aluminum 6061-T6'
  };
  return group;
}

/**
 * Creates a parametric 3D cylinder solid blank (solid or hollow bore)
 */
export function createCylinderGeometry(
  radius = 35,
  height = 45,
  name = "Cylindrical_Blank",
  options = {}
) {
  const group = new THREE.Group();
  group.name = name;

  const color = options.color || 0x60a5fa;
  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.8,
    roughness: 0.25
  });

  const innerR = options.innerRadius || 0;
  let mesh;

  if (innerR > 0 && innerR < radius) {
    // Hollow cylinder tube
    const shape = new THREE.Shape();
    shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, innerR, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    const extrudeSettings = { depth: height, bevelEnabled: false, curveSegments: 48 };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.rotateX(Math.PI / 2);
    geo.center();
    mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = height / 2;
  } else {
    // Solid cylinder
    const geo = new THREE.CylinderGeometry(radius, radius, height, 48);
    mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = height / 2;
  }

  if (options.axis === 'Z') {
    mesh.rotateX(Math.PI / 2);
  } else if (options.axis === 'X') {
    mesh.rotateZ(Math.PI / 2);
  }

  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  const edges = new THREE.EdgesGeometry(mesh.geometry);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x1d4ed8, linewidth: 1.5 }));
  edgeLine.position.copy(mesh.position);
  edgeLine.rotation.copy(mesh.rotation);
  group.add(edgeLine);

  const vol = Math.PI * (radius * radius - innerR * innerR) * height / 1000;
  group.userData = {
    type: 'solid_cylinder',
    radius,
    innerRadius: innerR,
    height,
    volumeCm3: Number(vol.toFixed(2)),
    material: options.material || '4140 Alloy Steel'
  };
  return group;
}

/**
 * Creates a parametric 3D cone or truncated frustum solid
 */
export function createConeGeometry(
  radiusBottom = 35,
  radiusTop = 15,
  height = 45,
  name = "Cone_Solid",
  options = {}
) {
  const group = new THREE.Group();
  group.name = name;

  const color = options.color || 0xf59e0b;
  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.75,
    roughness: 0.25
  });

  const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 48);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = height / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geo);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xb45309, linewidth: 1.5 }));
  edgeLine.position.copy(mesh.position);
  group.add(edgeLine);

  const vol = (Math.PI * height / 3) * (radiusBottom * radiusBottom + radiusBottom * radiusTop + radiusTop * radiusTop) / 1000;
  group.userData = {
    type: 'solid_cone',
    radiusBottom,
    radiusTop,
    height,
    volumeCm3: Number(vol.toFixed(2)),
    material: options.material || 'Brass C360'
  };
  return group;
}

/**
 * Creates a parametric 3D torus solid ring
 */
export function createTorusGeometry(
  radius = 30,
  tubeRadius = 10,
  name = "Torus_Solid",
  options = {}
) {
  const group = new THREE.Group();
  group.name = name;

  const color = options.color || 0xa855f7;
  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.75,
    roughness: 0.25
  });

  const geo = new THREE.TorusGeometry(radius, tubeRadius, 24, 48);
  geo.rotateX(Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = tubeRadius;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  const vol = (2 * Math.PI * Math.PI * radius * tubeRadius * tubeRadius) / 1000;
  group.userData = {
    type: 'solid_torus',
    radius,
    tubeRadius,
    volumeCm3: Number(vol.toFixed(2)),
    material: options.material || 'Titanium Ti-6Al-4V'
  };
  return group;
}

/**
 * Creates a parametric 3D extruded solid with optional draft angle
 */
export function createExtrudedSolid(
  w = 70,
  d = 50,
  height = 35,
  draftAngleDeg = 0,
  name = "Extruded_Solid",
  options = {}
) {
  const group = new THREE.Group();
  group.name = name;

  const color = options.color || 0x10b981;
  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.75,
    roughness: 0.25
  });

  const shape = new THREE.Shape();
  const hw = w / 2;
  const hd = d / 2;
  shape.moveTo(-hw, -hd);
  shape.lineTo(hw, -hd);
  shape.lineTo(hw, hd);
  shape.lineTo(-hw, hd);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false
  });
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geo);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x047857, linewidth: 1.5 }));
  group.add(edgeLine);

  group.userData = {
    type: 'solid_extruded',
    width: w,
    depth: d,
    height,
    draftAngleDeg,
    volumeCm3: Number(((w * d * height) / 1000).toFixed(2)),
    material: options.material || 'P20 Tool Steel'
  };
  return group;
}

/**
 * Creates a realistic CNC milled pocket solid workpiece (Billet with pocket cavity and corner radii)
 */
export function createPocketedBillet(
  baseW = 90,
  baseH = 40,
  baseD = 70,
  pocketW = 55,
  pocketD = 40,
  pocketDepth = 18,
  cornerR = 6,
  name = "Pocketed_Cavity_Workpiece",
  options = {}
) {
  const group = new THREE.Group();
  group.name = name;

  const color = options.color || 0x38bdf8;
  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.75,
    roughness: 0.25
  });

  // Base Billet Lower Half (solid floor below pocket)
  const floorHeight = baseH - pocketDepth;
  const floorGeo = new THREE.BoxGeometry(baseW, floorHeight, baseD);
  const floorMesh = new THREE.Mesh(floorGeo, mat);
  floorMesh.position.y = floorHeight / 2;
  group.add(floorMesh);

  // Upper Walls Surrounding Pocket Cavity
  const leftW = (baseW - pocketW) / 2;
  const frontD = (baseD - pocketD) / 2;

  // Left wall
  const leftGeo = new THREE.BoxGeometry(leftW, pocketDepth, baseD);
  const leftMesh = new THREE.Mesh(leftGeo, mat);
  leftMesh.position.set(-baseW / 2 + leftW / 2, floorHeight + pocketDepth / 2, 0);
  group.add(leftMesh);

  // Right wall
  const rightGeo = new THREE.BoxGeometry(leftW, pocketDepth, baseD);
  const rightMesh = new THREE.Mesh(rightGeo, mat);
  rightMesh.position.set(baseW / 2 - leftW / 2, floorHeight + pocketDepth / 2, 0);
  group.add(rightMesh);

  // Front wall
  const frontGeo = new THREE.BoxGeometry(pocketW, pocketDepth, frontD);
  const frontMesh = new THREE.Mesh(frontGeo, mat);
  frontMesh.position.set(0, floorHeight + pocketDepth / 2, baseD / 2 - frontD / 2);
  group.add(frontMesh);

  // Back wall
  const backGeo = new THREE.BoxGeometry(pocketW, pocketDepth, frontD);
  const backMesh = new THREE.Mesh(backGeo, mat);
  backMesh.position.set(0, floorHeight + pocketDepth / 2, -baseD / 2 + frontD / 2);
  group.add(backMesh);

  // Corner Fillet Bosses in Pocket Cavity (R fillets)
  if (cornerR > 0) {
    const cylGeo = new THREE.CylinderGeometry(cornerR, cornerR, pocketDepth, 24);
    const phw = pocketW / 2;
    const phd = pocketD / 2;
    const cornerOffsets = [
      [-phw + cornerR, phd - cornerR],
      [phw - cornerR, phd - cornerR],
      [phw - cornerR, -phd + cornerR],
      [-phw + cornerR, -phd + cornerR]
    ];
    cornerOffsets.forEach(([cx, cz]) => {
      const cMesh = new THREE.Mesh(cylGeo, mat);
      cMesh.position.set(cx, floorHeight + pocketDepth / 2, cz);
      group.add(cMesh);
    });
  }

  // Outer wireframe edges
  const boxGeo = new THREE.BoxGeometry(baseW, baseH, baseD);
  const edges = new THREE.EdgesGeometry(boxGeo);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 1.5 }));
  edgeLine.position.y = baseH / 2;
  group.add(edgeLine);

  const vol = (baseW * baseH * baseD - pocketW * pocketD * pocketDepth) / 1000;
  group.userData = {
    type: 'solid_pocketed_billet',
    baseW,
    baseH,
    baseD,
    pocketW,
    pocketD,
    pocketDepth,
    cornerR,
    volumeCm3: Number(vol.toFixed(2)),
    material: options.material || 'Aluminum 6061-T6'
  };
  return group;
}

/**
 * Creates a parametric 3D sphere solid blank
 */
export function createSphereGeometry(radius = 30, name = "Spherical_Blank") {
  const group = new THREE.Group();
  group.name = name;

  const mat = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    metalness: 0.75,
    roughness: 0.3
  });

  const geo = new THREE.SphereGeometry(radius, 32, 24);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = radius;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  return group;
}

/**
 * Creates a Revolved 3D Solid Body (Turned Part / Flange)
 */
export function createRevolvedSolid(
  rBase = 35,
  rTop = 20,
  height = 45,
  sweepDeg = 360,
  options = {}
) {
  const group = new THREE.Group();
  const rad = (sweepDeg * Math.PI) / 180;
  const geo = new THREE.CylinderGeometry(rTop, rBase, height, 36, 1, false, 0, rad);
  const color = options.color || 0x0284c7;
  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.8,
    roughness: 0.25
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = height / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geo);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x0369a1, linewidth: 1.5 }));
  edgeLine.position.y = height / 2;
  group.add(edgeLine);

  group.name = options.name || `Solid_Revolved_R${Math.round(rBase)}xH${Math.round(height)}_${sweepDeg}deg`;
  group.userData = { type: 'solid_revolved', rBase, rTop, height, sweepDeg };
  return group;
}

/**
 * Creates a Lofted 3D Solid Body
 */
export function createLoftSolid(
  botW = 80,
  botD = 60,
  topW = 50,
  topD = 40,
  height = 40,
  options = {}
) {
  const group = new THREE.Group();
  const geo = new THREE.CylinderGeometry(
    Math.sqrt(topW * topW + topD * topD) / 2,
    Math.sqrt(botW * botW + botD * botD) / 2,
    height,
    4,
    1
  );
  geo.rotateY(Math.PI / 4);

  const color = options.color || 0x0284c7;
  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.8,
    roughness: 0.25
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = height / 2;
  mesh.castShadow = true;
  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geo);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x0369a1, linewidth: 1.5 }));
  edgeLine.position.y = height / 2;
  group.add(edgeLine);

  group.name = options.name || `Solid_Loft_${Math.round(botW)}x${Math.round(botD)}_to_${Math.round(topW)}x${Math.round(topD)}`;
  group.userData = { type: 'solid_loft', botW, botD, topW, topD, height };
  return group;
}

/**
 * Creates a Swept 3D Solid Tube
 */
export function createSweptSolid(
  radius = 16,
  length = 65,
  options = {}
) {
  const group = new THREE.Group();
  const curve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, length * 0.4, 0),
    new THREE.Vector3(length * 0.4, length * 0.7, 0),
    new THREE.Vector3(length * 0.8, length * 0.8, 0)
  );

  const geo = new THREE.TubeGeometry(curve, 24, radius, 16, false);
  const color = options.color || 0x0284c7;
  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.8,
    roughness: 0.25
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geo, 20);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x0369a1, linewidth: 1.2 }));
  group.add(edgeLine);

  group.name = options.name || `Solid_Sweep_R${radius}_L${length}`;
  group.userData = { type: 'solid_sweep', radius, length };
  return group;
}

/**
 * Creates a Parametric Pattern Array of Solid Features (Rectangular, Circular, Manual)
 */
export function createSolidPattern(
  patternType = 'rect',
  params = {},
  options = {}
) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: options.color || 0x0284c7,
    metalness: 0.8,
    roughness: 0.25
  });

  const featureRadius = params.radius || 6;
  const featureDepth = params.depth || 20;

  if (patternType === 'rect') {
    const countX = params.countX || 3;
    const countY = params.countY || 3;
    const spacingX = params.spacingX || 25;
    const spacingY = params.spacingY || 25;

    for (let ix = 0; ix < countX; ix++) {
      for (let iy = 0; iy < countY; iy++) {
        const cyl = new THREE.CylinderGeometry(featureRadius, featureRadius, featureDepth, 24);
        const mesh = new THREE.Mesh(cyl, mat);
        const posX = (ix - (countX - 1) / 2) * spacingX;
        const posZ = (iy - (countY - 1) / 2) * spacingY;
        mesh.position.set(posX, featureDepth / 2, posZ);
        group.add(mesh);
      }
    }
    group.name = options.name || `Solid_Pattern_Rect_${countX}x${countY}`;
  } else if (patternType === 'circ') {
    const count = params.count || 6;
    const pcdRadius = params.pcdRadius || 35;

    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count;
      const cyl = new THREE.CylinderGeometry(featureRadius, featureRadius, featureDepth, 24);
      const mesh = new THREE.Mesh(cyl, mat);
      mesh.position.set(Math.cos(angle) * pcdRadius, featureDepth / 2, Math.sin(angle) * pcdRadius);
      group.add(mesh);
    }
    group.name = options.name || `Solid_Pattern_Circ_${count}Holes_PCD${pcdRadius * 2}`;
  } else {
    // Manual coordinate points
    const points = params.points || [
      [-25, -20], [0, 15], [30, -10], [10, -25]
    ];
    points.forEach(([px, pz]) => {
      const cyl = new THREE.CylinderGeometry(featureRadius, featureRadius, featureDepth, 24);
      const mesh = new THREE.Mesh(cyl, mat);
      mesh.position.set(px, featureDepth / 2, pz);
      group.add(mesh);
    });
    group.name = options.name || `Solid_Pattern_Manual_${points.length}Instances`;
  }

  group.userData = { type: 'solid_pattern', patternType, params };
  return group;
}

/**
 * Stitches surface sheets into a watertight solid body
 */
export function createSolidFromSurfaces(
  w = 80,
  h = 35,
  d = 60,
  options = {}
) {
  const group = new THREE.Group();
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    metalness: 0.85,
    roughness: 0.25
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = h / 2;
  mesh.castShadow = true;
  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geo);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 }));
  edgeLine.position.y = h / 2;
  group.add(edgeLine);

  group.name = options.name || `Solid_FromSurfaces_${Math.round(w)}x${Math.round(h)}x${Math.round(d)}`;
  group.userData = { type: 'solid_stitched_body', width: w, height: h, depth: d, isWatertight: true };
  return group;
}

/**
 * Creates a Solid Chamfer (45° flat bevel edge)
 */
export function createSolidChamfer(
  w = 80,
  h = 35,
  d = 60,
  chamferDist = 4,
  options = {}
) {
  const group = new THREE.Group();
  const shape = new THREE.Shape();
  const halfW = w / 2;
  const c = Math.min(chamferDist, h / 2, w / 4);

  // Cross-section profile with top chamfered corners
  shape.moveTo(-halfW, 0);
  shape.lineTo(halfW, 0);
  shape.lineTo(halfW, h - c);
  shape.lineTo(halfW - c, h);
  shape.lineTo(-halfW + c, h);
  shape.lineTo(-halfW, h - c);
  shape.closePath();

  const extrudeSettings = {
    steps: 1,
    depth: d,
    bevelEnabled: false
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.center();

  const mat = new THREE.MeshStandardMaterial({
    color: options.color || 0x0284c7,
    metalness: 0.8,
    roughness: 0.25
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = h / 2;
  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geo);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x0369a1, linewidth: 1.5 }));
  edgeLine.position.y = h / 2;
  group.add(edgeLine);

  group.name = options.name || `Solid_Chamfer_${Math.round(w)}x${Math.round(d)}_C${chamferDist}`;
  group.userData = { type: 'solid_chamfer', width: w, height: h, depth: d, chamferDist };
  return group;
}

/**
 * Creates a Solid Fillet (Smooth rounded corner blend)
 */
export function createSolidFillet(
  w = 80,
  h = 35,
  d = 60,
  filletRadius = 6,
  options = {}
) {
  const group = new THREE.Group();
  const shape = new THREE.Shape();
  const halfW = w / 2;
  const r = Math.min(filletRadius, h / 2, w / 4);

  // Cross-section profile with rounded top corners
  shape.moveTo(-halfW, 0);
  shape.lineTo(halfW, 0);
  shape.lineTo(halfW, h - r);
  shape.absarc(halfW - r, h - r, r, 0, Math.PI / 2, false);
  shape.lineTo(-halfW + r, h);
  shape.absarc(-halfW + r, h - r, r, Math.PI / 2, Math.PI, false);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { steps: 1, depth: d, bevelEnabled: false });
  geo.center();

  const mat = new THREE.MeshStandardMaterial({
    color: options.color || 0x0284c7,
    metalness: 0.8,
    roughness: 0.25
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = h / 2;
  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geo);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 1.5 }));
  edgeLine.position.y = h / 2;
  group.add(edgeLine);

  group.name = options.name || `Solid_Fillet_${Math.round(w)}x${Math.round(d)}_R${filletRadius}`;
  group.userData = { type: 'solid_fillet', width: w, height: h, depth: d, filletRadius };
  return group;
}

/**
 * Creates a Shelled Solid Body with open top face and uniform wall thickness
 */
export function createSolidShell(
  w = 80,
  h = 35,
  d = 60,
  wallThickness = 4,
  options = {}
) {
  return createPocketedBillet(
    w,
    h,
    d,
    w - wallThickness * 2,
    d - wallThickness * 2,
    h - wallThickness,
    wallThickness / 2,
    options.name || `Solid_Shell_${Math.round(w)}x${Math.round(d)}_Wall${wallThickness}mm`,
    options
  );
}

/**
 * Thickens a 2D surface sheet into a 3D solid billet body
 */
export function createThickenedSolid(
  width = 80,
  depth = 60,
  thickness = 6,
  options = {}
) {
  return createBoxGeometry(width, thickness, depth, {
    ...options,
    name: options.name || `Solid_Thickened_${Math.round(width)}x${Math.round(depth)}_Thick${thickness}mm`
  });
}

/**
 * Slices a solid body along an inclined plane knife
 */
export function trimSolidByPlane(
  w = 80,
  h = 35,
  d = 60,
  cutAngleDeg = 30,
  options = {}
) {
  const group = new THREE.Group();
  const shape = new THREE.Shape();
  const halfW = w / 2;
  const cutH = Math.tan((cutAngleDeg * Math.PI) / 180) * (w / 2);

  shape.moveTo(-halfW, 0);
  shape.lineTo(halfW, 0);
  shape.lineTo(halfW, h - cutH);
  shape.lineTo(-halfW, h + cutH);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { steps: 1, depth: d, bevelEnabled: false });
  geo.center();

  const mat = new THREE.MeshStandardMaterial({
    color: options.color || 0x0284c7,
    metalness: 0.8,
    roughness: 0.25
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = h / 2;
  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geo);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2 }));
  edgeLine.position.y = h / 2;
  group.add(edgeLine);

  group.name = options.name || `Solid_TrimmedByPlane_${cutAngleDeg}deg`;
  group.userData = { type: 'solid_trim_plane', cutAngleDeg, width: w, height: h, depth: d };
  return group;
}

/**
 * Generates 2D Orthographic Multi-View Drawing Layout Sheet (Top, Front, Right, Isometric)
 */
export function generateDrawingLayoutSheet(
  partW = 80,
  partH = 35,
  partD = 60,
  options = {}
) {
  const group = new THREE.Group();
  const sheetW = 280;
  const sheetH = 190;

  // Sheet background
  const sheetGeo = new THREE.PlaneGeometry(sheetW, sheetH);
  sheetGeo.rotateX(-Math.PI / 2);
  const sheetMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide
  });
  const sheetMesh = new THREE.Mesh(sheetGeo, sheetMat);
  sheetMesh.position.y = 0;
  group.add(sheetMesh);

  // Outer border & title block
  const borderGeo = new THREE.EdgesGeometry(sheetGeo);
  const borderLine = new THREE.LineSegments(borderGeo, new THREE.LineBasicMaterial({ color: 0x0f172a, linewidth: 2 }));
  borderLine.position.y = 0.2;
  group.add(borderLine);

  // 1. Top View (Top Left)
  const topBox = new THREE.BoxGeometry(partW * 0.7, 0.5, partD * 0.7);
  const topWire = new THREE.LineSegments(new THREE.EdgesGeometry(topBox), new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2 }));
  topWire.position.set(-sheetW * 0.25, 0.5, -sheetH * 0.25);
  group.add(topWire);

  // 2. Front View (Bottom Left)
  const frontBox = new THREE.BoxGeometry(partW * 0.7, 0.5, partH * 0.7);
  const frontWire = new THREE.LineSegments(new THREE.EdgesGeometry(frontBox), new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2 }));
  frontWire.position.set(-sheetW * 0.25, 0.5, sheetH * 0.25);
  group.add(frontWire);

  // 3. Right Side View (Bottom Right)
  const sideBox = new THREE.BoxGeometry(partD * 0.7, 0.5, partH * 0.7);
  const sideWire = new THREE.LineSegments(new THREE.EdgesGeometry(sideBox), new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2 }));
  sideWire.position.set(sheetW * 0.25, 0.5, sheetH * 0.25);
  group.add(sideWire);

  // 4. Isometric 3D Projection (Top Right)
  const isoBox = new THREE.BoxGeometry(partW * 0.5, partH * 0.5, partD * 0.5);
  const isoMesh = new THREE.Mesh(isoBox, new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.6, roughness: 0.3 }));
  isoMesh.rotation.set(Math.PI / 6, Math.PI / 4, 0);
  isoMesh.position.set(sheetW * 0.25, 12, -sheetH * 0.25);
  group.add(isoMesh);

  group.name = options.name || `Drawing_Layout_4Views_A3`;
  group.userData = { type: 'drawing_layout_sheet', sheetW, sheetH, partW, partH, partD };
  return group;
}

/**
 * Creates a 3D planar surface sheet on G17, G18, or G19
 */
export function createPlanarSurface(
  w = 80,
  d = 60,
  y = 35,
  center = [0, 0],
  plane = 'G17',
  options = {}
) {
  const group = new THREE.Group();
  const cx = center[0] || 0;
  const cz = center[1] || 0;

  const geo = new THREE.PlaneGeometry(w, d, 8, 8);
  if (plane === 'G17') {
    geo.rotateX(-Math.PI / 2);
    group.position.set(cx, y, cz);
  } else if (plane === 'G18') {
    group.position.set(cx, cz, y);
  } else {
    geo.rotateY(Math.PI / 2);
    group.position.set(y, cx, cz);
  }

  const isCheck = options.role === 'check';
  const color = options.color || (isCheck ? 0xf59e0b : 0x06b6d4);
  const opacity = options.opacity !== undefined ? options.opacity : 0.75;

  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.2,
    roughness: 0.35,
    side: THREE.DoubleSide,
    transparent: true,
    opacity
  });

  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  // High-contrast surface edge boundary line
  const edges = new THREE.EdgesGeometry(geo);
  const edgeMat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  const edgeLine = new THREE.LineSegments(edges, edgeMat);
  group.add(edgeLine);

  group.name = options.name || `Surface_Plane_${Math.round(w)}x${Math.round(d)}_${isCheck ? 'Check' : 'Drive'}`;
  group.userData = {
    type: 'surface_plane',
    width: w,
    depth: d,
    elevation: y,
    plane,
    role: isCheck ? 'check' : 'drive',
    color
  };
  return group;
}

/**
 * Creates a 3D cylindrical surface sleeve (open-ended)
 */
export function createCylinderSurface(
  radius = 35,
  height = 45,
  y = 35,
  center = [0, 0],
  options = {}
) {
  const group = new THREE.Group();
  const cx = center[0] || 0;
  const cz = center[1] || 0;

  const geo = new THREE.CylinderGeometry(radius, radius, height, 36, 4, true);
  const isCheck = options.role === 'check';
  const color = options.color || (isCheck ? 0xf59e0b : 0x10b981);
  const opacity = options.opacity !== undefined ? options.opacity : 0.75;

  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.3,
    roughness: 0.3,
    side: THREE.DoubleSide,
    transparent: true,
    opacity
  });

  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geo);
  const edgeMat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  const edgeLine = new THREE.LineSegments(edges, edgeMat);
  group.add(edgeLine);

  group.position.set(cx, y + height / 2, cz);
  group.name = options.name || `Surface_Cylinder_R${Math.round(radius)}_H${Math.round(height)}`;
  group.userData = {
    type: 'surface_cylinder',
    radius,
    height,
    role: isCheck ? 'check' : 'drive'
  };
  return group;
}

/**
 * Creates a 3D extruded boundary surface shell
 */
export function createExtrudedSurface(
  w = 60,
  d = 40,
  height = 30,
  y = 35,
  center = [0, 0],
  options = {}
) {
  const group = new THREE.Group();
  const cx = center[0] || 0;
  const cz = center[1] || 0;

  // Build 4 side quad faces
  const hw = w / 2;
  const hd = d / 2;
  const points = [];

  // Front (+Z), Right (+X), Back (-Z), Left (-X)
  const corners = [
    [-hw, 0, hd], [hw, 0, hd],
    [hw, 0, hd], [hw, 0, -hd],
    [hw, 0, -hd], [-hw, 0, -hd],
    [-hw, 0, -hd], [-hw, 0, hd]
  ];

  const vertices = [];
  const indices = [];

  for (let i = 0; i < 4; i++) {
    const p1 = corners[i * 2];
    const p2 = corners[i * 2 + 1];
    const baseIdx = i * 4;

    vertices.push(
      p1[0], 0, p1[2],
      p2[0], 0, p2[2],
      p2[0], height, p2[2],
      p1[0], height, p1[2]
    );

    indices.push(
      baseIdx, baseIdx + 1, baseIdx + 2,
      baseIdx, baseIdx + 2, baseIdx + 3
    );
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const isCheck = options.role === 'check';
  const color = options.color || (isCheck ? 0xf59e0b : 0x8b5cf6);

  const mat = new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: options.opacity || 0.75,
    roughness: 0.35
  });

  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geo);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color, linewidth: 2 }));
  group.add(edgeLine);

  group.position.set(cx, y, cz);
  group.name = options.name || `Surface_Extrude_${Math.round(w)}x${Math.round(d)}_H${Math.round(height)}`;
  group.userData = { type: 'surface_extrusion', width: w, depth: d, height, role: isCheck ? 'check' : 'drive' };
  return group;
}

/**
 * Offsets a 2D (u, v) polyline or closed polygon along its outward (positive)
 * or inward (negative) contour normal with miter-spike clamping.
 */
export function offsetContour2D(uvPts = [], offset = 0, isClosed = true) {
  if (!Array.isArray(uvPts) || uvPts.length < 2 || Math.abs(offset) < 1e-5) {
    return uvPts.map((p) => ({ u: p.u, v: p.v }));
  }

  // Deduplicate nearly identical consecutive points & simplify micro triangle-slice jitter
  const rawDedup = [];
  uvPts.forEach((p) => {
    const prev = rawDedup[rawDedup.length - 1];
    if (!prev || Math.hypot(p.u - prev.u, p.v - prev.v) > 0.005) {
      rawDedup.push({ u: p.u, v: p.v });
    }
  });
  if (isClosed && rawDedup.length > 2 && Math.hypot(rawDedup[0].u - rawDedup[rawDedup.length - 1].u, rawDedup[0].v - rawDedup[rawDedup.length - 1].v) < 0.005) {
    rawDedup.pop();
  }

  // Drop strictly collinear intermediate vertices along flat wall slices regardless of wall length
  // so near-corner triangle diagonal intersections never create bow-tie spikes when offsetting
  const isCollinearBetween = (prev, curr, next) => {
    const abU = next.u - prev.u;
    const abV = next.v - prev.v;
    const abLen = Math.hypot(abU, abV);
    if (abLen <= 1e-4) return false;
    const cross = Math.abs((curr.u - prev.u) * abV - (curr.v - prev.v) * abU) / abLen;
    if (cross >= 0.002) return false;
    const dot1 = (curr.u - prev.u) * abU + (curr.v - prev.v) * abV;
    const dot2 = (next.u - curr.u) * abU + (next.v - curr.v) * abV;
    return dot1 >= -1e-4 && dot2 >= -1e-4;
  };

  const pts = [];
  const rawN = rawDedup.length;
  for (let i = 0; i < rawN; i++) {
    const curr = rawDedup[i];
    if (!isClosed && (i === 0 || i === rawN - 1)) {
      pts.push(curr);
      continue;
    }
    const prev = pts.length > 0 ? pts[pts.length - 1] : rawDedup[(i - 1 + rawN) % rawN];
    const next = rawDedup[(i + 1) % rawN];
    if (isCollinearBetween(prev, curr, next)) {
      continue;
    }
    pts.push(curr);
  }
  if (isClosed && pts.length >= 4 && isCollinearBetween(pts[pts.length - 1], pts[0], pts[1])) {
    pts.shift();
  }
  if (pts.length < 2 || (isClosed && pts.length < 3)) return [];

  // Bounding box + signed area (> 0 means CCW in u-v)
  let inMinU = Infinity, inMaxU = -Infinity, inMinV = Infinity, inMaxV = -Infinity;
  let area2 = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    inMinU = Math.min(inMinU, a.u); inMaxU = Math.max(inMaxU, a.u);
    inMinV = Math.min(inMinV, a.v); inMaxV = Math.max(inMaxV, a.v);
    if (isClosed) {
      const b = pts[(i + 1) % pts.length];
      area2 += a.u * b.v - b.u * a.v;
    }
  }
  if (isClosed && offset < 0) {
    const minInSpan = Math.min(inMaxU - inMinU, inMaxV - inMinV);
    if (Math.abs(offset) >= minInSpan * 0.495) return [];
  }
  const outwardSign = (!isClosed || area2 >= 0) ? 1 : -1;
  const effDist = offset * outwardSign;
  const n = pts.length;

  const getEdgeNormal = (a, b) => {
    const du = b.u - a.u;
    const dv = b.v - a.v;
    const len = Math.hypot(du, dv) || 1;
    // Right-hand normal of CCW curve points outward
    return { nu: dv / len, nv: -du / len };
  };

  const outPts = [];
  for (let i = 0; i < n; i++) {
    const hasPrev = isClosed || i > 0;
    const hasNext = isClosed || i < n - 1;
    const prevPt = pts[(i - 1 + n) % n];
    const currPt = pts[i];
    const nextPt = pts[(i + 1) % n];

    const n1 = hasPrev ? getEdgeNormal(prevPt, currPt) : null;
    const n2 = hasNext ? getEdgeNormal(currPt, nextPt) : null;

    if (!n1 && n2) {
      outPts.push({ u: currPt.u + n2.nu * effDist, v: currPt.v + n2.nv * effDist });
    } else if (n1 && !n2) {
      outPts.push({ u: currPt.u + n1.nu * effDist, v: currPt.v + n1.nv * effDist });
    } else if (n1 && n2) {
      const avgU = n1.nu + n2.nu;
      const avgV = n1.nv + n2.nv;
      const avgLenSq = avgU * avgU + avgV * avgV;
      if (avgLenSq < 1e-4) {
        outPts.push({ u: currPt.u + n2.nu * effDist, v: currPt.v + n2.nv * effDist });
      } else {
        // Miter length along bisector: 1 / cos(theta/2) = 2 / |n1 + n2|
        const avgLen = Math.sqrt(avgLenSq);
        const rawScale = 2 / avgLenSq;
        const maxMiter = 2.0 / avgLen;
        const miterScale = Math.min(rawScale, maxMiter) * effDist;
        outPts.push({ u: currPt.u + avgU * miterScale, v: currPt.v + avgV * miterScale });
      }
    }
  }

  // Collapse & inversion check when shrinking closed polygons inward
  if (isClosed && offset < 0 && outPts.length >= 3) {
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
    let newArea2 = 0;
    for (let i = 0; i < outPts.length; i++) {
      const a = outPts[i];
      const b = outPts[(i + 1) % outPts.length];
      minU = Math.min(minU, a.u); maxU = Math.max(maxU, a.u);
      minV = Math.min(minV, a.v); maxV = Math.max(maxV, a.v);
      newArea2 += a.u * b.v - b.u * a.v;
    }
    if ((maxU - minU) < 0.25 || (maxV - minV) < 0.25) return [];
    if (area2 !== 0 && newArea2 * area2 <= 0) return [];
    if (Math.abs(newArea2) >= Math.abs(area2) * 0.999) return [];
    if (minU < inMinU - 0.1 || maxU > inMaxU + 0.1 || minV < inMinV - 0.1 || maxV > inMaxV + 0.1) return [];
    outPts.push({ ...outPts[0] });
  } else if (isClosed && outPts.length >= 3) {
    outPts.push({ ...outPts[0] });
  }

  return outPts;
}

/**
 * Resolves an orthonormal (uAxis, vAxis, extrudeAxis) basis from Mastercam Axis selection.
 * Mastercam TOP: +X => Three +X, +Y => Three -Z, +Z => Three +Y.
 */
function resolveExtrusionBasis(params = {}) {
  const { useAxis = false, axis = 'z', axisVector = { x: 0, y: 0, z: 1 } } = params;
  const activeAxis = useAxis ? String(axis || 'z').toLowerCase() : 'z';

  const dir = new THREE.Vector3(0, 1, 0);
  if (activeAxis === 'x') {
    dir.set(1, 0, 0);
  } else if (activeAxis === 'y') {
    dir.set(0, 0, -1);
  } else if (activeAxis === 'vector' && axisVector) {
    dir.set(
      Number(axisVector.x) || 0,
      Number(axisVector.z) || 0,
      -(Number(axisVector.y) || 0)
    );
    if (dir.lengthSq() < 1e-6) dir.set(0, 1, 0);
    dir.normalize();
  }

  const ref = Math.abs(dir.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const uAxis = new THREE.Vector3().crossVectors(ref, dir).normalize();
  const vAxis = new THREE.Vector3().crossVectors(dir, uAxis).normalize();
  return { extrudeAxis: dir, uAxis, vAxis };
}

/**
 * Creates a Mastercam-style Parametric Shaded Cyan Surface Extrusion from wireframe chain(s).
 * Supports Height (+/-), Scale, Rotation angle, Offset distance, Draft angle, Axis, Base Point, and Direction.
 */
export function createParametricChainExtrusion(chains = [], params = {}, options = {}) {
  const validChains = (Array.isArray(chains) ? chains : [chains]).filter((c) => c && Array.isArray(c.points) && c.points.length >= 2);
  const group = new THREE.Group();

  const {
    height = 20.0,
    scale = 1.0,
    rotationAngleDeg = 0.0,
    offsetDistance = 0.0,
    draftAngleDeg = 0.0,
    useAxis = false,
    axis = 'z',
    axisVector = { x: 0, y: 0, z: 1 },
    direction = 'defined',
    basePoint = null,
    capEnds = true
  } = params;

  const rawHeight = Number.isFinite(Number(height)) ? Number(height) : 20.0;
  const safeHeight = Math.abs(rawHeight) < 0.05 ? (rawHeight < 0 ? -0.05 : 0.05) : rawHeight;
  const dirMult = direction === 'reverse' ? -1 : 1;
  const spanList = direction === 'both'
    ? [
        { startT: 0, endT: safeHeight },
        { startT: 0, endT: -safeHeight }
      ]
    : [{ startT: 0, endT: safeHeight * dirMult }];

  const { extrudeAxis, uAxis, vAxis } = resolveExtrusionBasis({ useAxis, axis, axisVector });
  const safeScale = Number.isFinite(Number(scale)) ? Number(scale) : 1.0;
  const rotTotalRad = ((Number(rotationAngleDeg) || 0) * Math.PI) / 180;
  const offsetDist = Number(offsetDistance) || 0;
  const draftTan = Math.tan(((Number(draftAngleDeg) || 0) * Math.PI) / 180);

  // Mastercam Cyan Surface Finish + Dark Blue Boundary Rim
  const surfaceColor = options.color || 0x22d3ee;
  const rimColor = options.rimColor || 0x1e3a8a;
  const isPreview = Boolean(options.isPreview);

  const surfaceMat = new THREE.MeshStandardMaterial({
    color: surfaceColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: options.opacity ?? (isPreview ? 0.65 : 0.78),
    roughness: 0.32,
    metalness: 0.08,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
  });
  const rimMat = new THREE.LineBasicMaterial({ color: rimColor, linewidth: 2 });

  const resolvedBase = basePoint
    ? new THREE.Vector3(Number(basePoint.x) || 0, Number(basePoint.y) || 0, Number(basePoint.z) || 0)
    : (() => {
        const first = validChains[0];
        if (first?.center) {
          return new THREE.Vector3(first.center.x || 0, first.center.y || 0, first.center.z || 0);
        }
        const box = new THREE.Box3();
        validChains.forEach((c) => c.points.forEach((p) => box.expandByPoint(new THREE.Vector3(p.x, p.y, p.z))));
        return box.isEmpty() ? new THREE.Vector3(0, 0, 0) : box.getCenter(new THREE.Vector3());
      })();

  const recordedContourLoops = [];
  let maxDepthExtent = Math.abs(safeHeight);

  validChains.forEach((chain) => {
    const rawPts = chain.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    const isClosed = chain.isClosed ?? (rawPts.length >= 3 && rawPts[0].distanceTo(rawPts[rawPts.length - 1]) < 0.8);
    // Ensure closed rings repeat their starting vertex so wall quads close 360deg watertight
    const closedPts = (isClosed && rawPts.length >= 3 && rawPts[0].distanceTo(rawPts[rawPts.length - 1]) > 0.05)
      ? [...rawPts, rawPts[0].clone()]
      : rawPts;

    // Project base chain points into local coordinates relative to resolvedBase along (uAxis, vAxis, extrudeAxis)
    const baseUVH = closedPts.map((pt) => {
      const rel = pt.clone().sub(resolvedBase);
      return {
        u: rel.dot(uAxis),
        v: rel.dot(vAxis),
        h: rel.dot(extrudeAxis)
      };
    });

    const baseOffsetUV = Math.abs(offsetDist) > 1e-4
      ? offsetContour2D(baseUVH, offsetDist, isClosed)
      : baseUVH.map((p) => ({ u: p.u, v: p.v }));

    if (baseOffsetUV.length < 2) return;
    if (isClosed && baseOffsetUV.length >= 3) {
      const f = baseOffsetUV[0];
      const l = baseOffsetUV[baseOffsetUV.length - 1];
      if (Math.hypot(f.u - l.u, f.v - l.v) > 0.05) {
        baseOffsetUV.push({ u: f.u, v: f.v });
      }
    }

    // Average plane elevation offset along extrudeAxis
    const baseAvgH = baseUVH.reduce((acc, p) => acc + p.h, 0) / Math.max(1, baseUVH.length);

    const buildSectionAtFraction = (frac, distAlongAxis) => {
      const curScale = 1 + (safeScale - 1) * frac;
      const curRot = rotTotalRad * frac;
      const cosR = Math.cos(curRot);
      const sinR = Math.sin(curRot);
      const draftOffset = draftTan * Math.abs(distAlongAxis);

      const draftedUV = Math.abs(draftOffset) > 1e-4
        ? offsetContour2D(baseOffsetUV, draftOffset, isClosed)
        : baseOffsetUV;
      const workingUV = draftedUV.length >= 2 ? [...draftedUV] : [...baseOffsetUV];
      if (isClosed && workingUV.length >= 3) {
        const f = workingUV[0];
        const l = workingUV[workingUV.length - 1];
        if (Math.hypot(f.u - l.u, f.v - l.v) > 0.05) {
          workingUV.push({ u: f.u, v: f.v });
        }
      }

      return workingUV.map((uv, idx) => {
        const su = uv.u * curScale;
        const sv = uv.v * curScale;
        const ru = su * cosR - sv * sinR;
        const rv = su * sinR + sv * cosR;
        const localH = baseUVH[Math.min(idx, baseUVH.length - 1)]?.h ?? baseAvgH;
        return resolvedBase.clone()
          .addScaledVector(uAxis, ru)
          .addScaledVector(vAxis, rv)
          .addScaledVector(extrudeAxis, localH + distAlongAxis);
      });
    };

    const heightSlices = Math.abs(rotationAngleDeg) > 0.1 ? 16 : 1;

    spanList.forEach(({ startT, endT }) => {
      const sections = [];
      for (let s = 0; s <= heightSlices; s++) {
        const frac = s / heightSlices;
        const dist = startT + (endT - startT) * frac;
        sections.push(buildSectionAtFraction(frac, dist));
      }

      const ringCount = sections[0].length;
      if (ringCount < 2) return;
      const positions = [];
      const indices = [];

      sections.forEach((sec) => {
        sec.forEach((pt) => {
          positions.push(pt.x, pt.y, pt.z);
        });
      });

      for (let s = 0; s < heightSlices; s++) {
        for (let i = 0; i < ringCount - 1; i++) {
          const a = s * ringCount + i;
          const b = s * ringCount + (i + 1);
          const c = (s + 1) * ringCount + (i + 1);
          const d = (s + 1) * ringCount + i;
          indices.push(a, b, c, a, c, d);
        }
      }

      const wallGeo = new THREE.BufferGeometry();
      wallGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      wallGeo.setIndex(indices);
      wallGeo.computeVertexNormals();

      const wallMesh = new THREE.Mesh(wallGeo, surfaceMat);
      wallMesh.userData = { isExtrudeWall: true, isCap: false };
      group.add(wallMesh);

      // Sharp vertical seam edges (> 30deg) so rectangles show vertical corners while circles stay smooth
      const sharpEdges = new THREE.EdgesGeometry(wallGeo, 30);
      group.add(new THREE.LineSegments(sharpEdges, rimMat));

      // Top & Bottom Dark Blue Rim Outlines
      const startRimGeo = new THREE.BufferGeometry().setFromPoints(sections[0]);
      group.add(new THREE.Line(startRimGeo, rimMat));
      const endSection = sections[sections.length - 1];
      const endRimGeo = new THREE.BufferGeometry().setFromPoints(endSection);
      group.add(new THREE.Line(endRimGeo, rimMat));

      recordedContourLoops.push(endSection.map((p) => ({ x: p.x, y: p.y, z: p.z })));

      // Flat Boundary Caps for Closed Chains (matching Mastercam Shaded Extrude visuals)
      if (isClosed && capEnds && endSection.length >= 4) {
        [
          { pts3D: sections[0], hDist: startT, flip: endT >= startT },
          { pts3D: endSection, hDist: endT, flip: endT < startT }
        ].forEach(({ pts3D }) => {
          const loop2D = pts3D.slice(0, -1).map((p) => {
            const rel = p.clone().sub(resolvedBase);
            return new THREE.Vector2(rel.dot(uAxis), rel.dot(vAxis));
          });
          if (loop2D.length < 3) return;
          const faces = THREE.ShapeUtils.triangulateShape(loop2D, []);
          if (!faces || faces.length === 0) return;

          const capPositions = [];
          const capIndices = [];
          pts3D.slice(0, -1).forEach((p) => capPositions.push(p.x, p.y, p.z));
          faces.forEach((tri) => capIndices.push(tri[0], tri[1], tri[2]));

          const capGeo = new THREE.BufferGeometry();
          capGeo.setAttribute('position', new THREE.Float32BufferAttribute(capPositions, 3));
          capGeo.setIndex(capIndices);
          capGeo.computeVertexNormals();

          const capMesh = new THREE.Mesh(capGeo, surfaceMat);
          capMesh.userData = { isExtrudeWall: false, isCap: true };
          group.add(capMesh);
        });
      }
    });
  });

  // Mastercam Cyan '+' Base / Extruded Center Marker
  const topAnchor = resolvedBase.clone().addScaledVector(extrudeAxis, direction === 'reverse' ? -safeHeight : safeHeight);
  const crossSize = 3.0;
  const crossMat = new THREE.LineBasicMaterial({ color: 0x67e8f9, linewidth: 2 });
  [resolvedBase, topAnchor].forEach((centerPt) => {
    const c1 = new THREE.BufferGeometry().setFromPoints([
      centerPt.clone().addScaledVector(uAxis, -crossSize),
      centerPt.clone().addScaledVector(uAxis, crossSize)
    ]);
    const c2 = new THREE.BufferGeometry().setFromPoints([
      centerPt.clone().addScaledVector(vAxis, -crossSize),
      centerPt.clone().addScaledVector(vAxis, crossSize)
    ]);
    group.add(new THREE.Line(c1, crossMat));
    group.add(new THREE.Line(c2, crossMat));
  });

  const labelHeight = Math.round(rawHeight);
  group.name = options.name || `Surface_Extrude_H${labelHeight}`;
  group.userData = {
    type: 'surface_extrusion',
    cadType: 'surface_extrusion',
    surfaceRole: 'drive',
    isClosed: validChains.every((c) => c.isClosed !== false),
    depthExtent: maxDepthExtent,
    basePoint: { x: resolvedBase.x, y: resolvedBase.y, z: resolvedBase.z },
    chains: validChains.map((c) => ({
      id: c.id,
      type: c.type || 'chain',
      name: c.name || 'Chain',
      isClosed: c.isClosed !== false,
      center: c.center ? { x: c.center.x || 0, y: c.center.y || 0, z: c.center.z || 0 } : null,
      radius: c.radius ?? null,
      points: c.points.map((p) => ({ x: p.x, y: p.y, z: p.z }))
    })),
    params: {
      height: rawHeight,
      scale: safeScale,
      rotationAngleDeg: Number(rotationAngleDeg) || 0,
      offsetDistance: offsetDist,
      draftAngleDeg: Number(draftAngleDeg) || 0,
      useAxis: Boolean(useAxis),
      axis: axis || 'z',
      axisVector: axisVector ? { ...axisVector } : { x: 0, y: 0, z: 1 },
      direction: direction || 'defined',
      basePoint: { x: resolvedBase.x, y: resolvedBase.y, z: resolvedBase.z },
      capEnds: Boolean(capEnds)
    },
    contourLoops: recordedContourLoops
  };
  return group;
}

/**
 * Creates a 3D revolved/conical surface sheet
 */
export function createRevolvedSurface(
  radiusBottom = 30,
  radiusTop = 15,
  height = 40,
  sweepAngleDeg = 360,
  y = 35,
  center = [0, 0],
  options = {}
) {
  const group = new THREE.Group();
  const cx = center[0] || 0;
  const cz = center[1] || 0;
  const sweepRad = (sweepAngleDeg * Math.PI) / 180;

  const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 36, 8, true, 0, sweepRad);
  const isCheck = options.role === 'check';
  const color = options.color || (isCheck ? 0xf59e0b : 0xec4899);

  const mat = new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: options.opacity || 0.75,
    roughness: 0.35
  });

  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geo);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color, linewidth: 2 }));
  group.add(edgeLine);

  group.position.set(cx, y + height / 2, cz);
  group.name = options.name || `Surface_Revolved_R${Math.round(radiusBottom)}-${Math.round(radiusTop)}`;
  group.userData = { type: 'surface_revolved', radiusBottom, radiusTop, height, sweepAngleDeg, role: isCheck ? 'check' : 'drive' };
  return group;
}

/**
 * Creates a 3D ruled loft surface blending between lower and upper profile frames
 */
export function createRuledLoftSurface(
  botW = 80,
  botD = 60,
  topW = 50,
  topD = 40,
  height = 35,
  y = 35,
  center = [0, 0],
  options = {}
) {
  const group = new THREE.Group();
  const cx = center[0] || 0;
  const cz = center[1] || 0;

  const bhw = botW / 2;
  const bhd = botD / 2;
  const thw = topW / 2;
  const thd = topD / 2;

  const botCorners = [
    [-bhw, 0, bhd], [bhw, 0, bhd],
    [bhw, 0, -bhd], [-bhw, 0, -bhd]
  ];
  const topCorners = [
    [-thw, height, thd], [thw, height, thd],
    [thw, height, -thd], [-thw, height, -thd]
  ];

  const vertices = [];
  const indices = [];

  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    const baseIdx = i * 4;

    vertices.push(
      botCorners[i][0], botCorners[i][1], botCorners[i][2],
      botCorners[next][0], botCorners[next][1], botCorners[next][2],
      topCorners[next][0], topCorners[next][1], topCorners[next][2],
      topCorners[i][0], topCorners[i][1], topCorners[i][2]
    );

    indices.push(
      baseIdx, baseIdx + 1, baseIdx + 2,
      baseIdx, baseIdx + 2, baseIdx + 3
    );
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const isCheck = options.role === 'check';
  const color = options.color || (isCheck ? 0xf59e0b : 0x3b82f6);

  const mat = new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: options.opacity || 0.75,
    roughness: 0.35
  });

  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geo);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color, linewidth: 2 }));
  group.add(edgeLine);

  group.position.set(cx, y, cz);
  group.name = options.name || `Surface_RuledLoft_${Math.round(botW)}to${Math.round(topW)}`;
  group.userData = { type: 'surface_ruled_loft', botW, botD, topW, topD, height, role: isCheck ? 'check' : 'drive' };
  return group;
}

/**
 * Creates a circular hole cap surface patch (prevents finishing tools from dipping into holes)
 */
export function createHoleCapSurface(
  radius = 8,
  y = 35,
  center = [0, 0],
  options = {}
) {
  const group = new THREE.Group();
  const cx = center[0] || 0;
  const cz = center[1] || 0;

  const geo = new THREE.CircleGeometry(radius, 32);
  geo.rotateX(-Math.PI / 2);

  const color = options.color || 0x38bdf8;
  const mat = new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
    roughness: 0.2
  });

  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geo);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2 }));
  group.add(edgeLine);

  group.position.set(cx, y, cz);
  group.name = options.name || `Surface_HoleCap_Dia${(radius * 2).toFixed(1)}`;
  group.userData = { type: 'surface_hole_cap', radius, diameter: radius * 2 };
  return group;
}

/**
 * Creates a curved fillet blend sheet transition
 */
export function createFilletBlendSurface(
  radius = 10,
  length = 60,
  angleDeg = 90,
  y = 35,
  center = [0, 0],
  options = {}
) {
  const group = new THREE.Group();
  const cx = center[0] || 0;
  const cz = center[1] || 0;
  const angleRad = (angleDeg * Math.PI) / 180;

  const geo = new THREE.CylinderGeometry(radius, radius, length, 24, 2, true, 0, angleRad);
  geo.rotateZ(Math.PI / 2);

  const color = options.color || 0x14b8a6;
  const mat = new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
    roughness: 0.3
  });

  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geo);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color, linewidth: 2 }));
  group.add(edgeLine);

  group.position.set(cx, y + radius, cz);
  group.name = options.name || `Surface_FilletBlend_R${radius}_L${length}`;
  group.userData = { type: 'surface_fillet_blend', radius, length, angleDeg };
  return group;
}

/**
 * Creates a 3D Spherical Surface Primitive
 */
export function createSphereSurface(
  radius = 25,
  y = 35,
  center = [0, 0],
  options = {}
) {
  const group = new THREE.Group();
  const cx = center[0] || 0;
  const cz = center[1] || 0;

  const geo = new THREE.SphereGeometry(radius, 32, 24);
  const isCheck = options.role === 'check';
  const color = options.color || (isCheck ? 0xf59e0b : 0xeab308);
  const opacity = options.opacity !== undefined ? options.opacity : 0.8;

  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.25,
    roughness: 0.35,
    side: THREE.DoubleSide,
    transparent: true,
    opacity
  });

  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geo, 20);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x854d0e, linewidth: 1 }));
  group.add(edgeLine);

  group.position.set(cx, y, cz);
  group.name = options.name || `Surface_Sphere_R${Math.round(radius)}_${isCheck ? 'Check' : 'Drive'}`;
  group.userData = { type: 'surface_sphere', radius, elevation: y, role: isCheck ? 'check' : 'drive' };
  return group;
}

/**
 * Creates a 3D Conical Surface Primitive
 */
export function createConeSurface(
  rBottom = 30,
  rTop = 0,
  height = 40,
  y = 35,
  center = [0, 0],
  options = {}
) {
  const group = new THREE.Group();
  const cx = center[0] || 0;
  const cz = center[1] || 0;

  const geo = new THREE.CylinderGeometry(rTop, rBottom, height, 32, 4, true);
  const isCheck = options.role === 'check';
  const color = options.color || (isCheck ? 0xf59e0b : 0xca8a04);
  const opacity = options.opacity !== undefined ? options.opacity : 0.8;

  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.2,
    roughness: 0.35,
    side: THREE.DoubleSide,
    transparent: true,
    opacity
  });

  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geo, 15);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x713f12, linewidth: 1 }));
  group.add(edgeLine);

  group.position.set(cx, y + height / 2, cz);
  group.name = options.name || `Surface_Cone_R${Math.round(rBottom)}xH${Math.round(height)}_${isCheck ? 'Check' : 'Drive'}`;
  group.userData = { type: 'surface_cone', rBottom, rTop, height, elevation: y, role: isCheck ? 'check' : 'drive' };
  return group;
}

/**
 * Creates a 3D Torus Surface Primitive
 */
export function createTorusSurface(
  rMajor = 35,
  rMinor = 10,
  y = 35,
  center = [0, 0],
  options = {}
) {
  const group = new THREE.Group();
  const cx = center[0] || 0;
  const cz = center[1] || 0;

  const geo = new THREE.TorusGeometry(rMajor, rMinor, 20, 36);
  geo.rotateX(Math.PI / 2); // Orient horizontally by default

  const isCheck = options.role === 'check';
  const color = options.color || (isCheck ? 0xf59e0b : 0xd97706);
  const opacity = options.opacity !== undefined ? options.opacity : 0.8;

  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.2,
    roughness: 0.35,
    side: THREE.DoubleSide,
    transparent: true,
    opacity
  });

  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geo, 25);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x78350f, linewidth: 1 }));
  group.add(edgeLine);

  group.position.set(cx, y, cz);
  group.name = options.name || `Surface_Torus_R${Math.round(rMajor)}r${Math.round(rMinor)}_${isCheck ? 'Check' : 'Drive'}`;
  group.userData = { type: 'surface_torus', rMajor, rMinor, elevation: y, role: isCheck ? 'check' : 'drive' };
  return group;
}

/**
 * Creates a 3D Planar Block Surface Body (6 connected sheet patches)
 */
export function createBlockSurface(
  width = 80,
  depth = 60,
  height = 30,
  y = 35,
  center = [0, 0],
  options = {}
) {
  const group = new THREE.Group();
  const cx = center[0] || 0;
  const cz = center[1] || 0;

  const geo = new THREE.BoxGeometry(width, height, depth);
  const isCheck = options.role === 'check';
  const color = options.color || (isCheck ? 0xf59e0b : 0xeab308);
  const opacity = options.opacity !== undefined ? options.opacity : 0.75;

  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.15,
    roughness: 0.4,
    side: THREE.DoubleSide,
    transparent: true,
    opacity
  });

  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geo);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xb45309, linewidth: 1.5 }));
  group.add(edgeLine);

  group.position.set(cx, y + height / 2, cz);
  group.name = options.name || `Surface_Block_${Math.round(width)}x${Math.round(depth)}x${Math.round(height)}_${isCheck ? 'Check' : 'Drive'}`;
  group.userData = { type: 'surface_block', width, depth, height, elevation: y, role: isCheck ? 'check' : 'drive' };
  return group;
}

/**
 * Creates a Tapered Draft Angle Surface
 */
export function createDraftSurface(
  baseW = 70,
  baseD = 50,
  height = 35,
  draftAngleDeg = 5,
  y = 35,
  center = [0, 0],
  options = {}
) {
  const group = new THREE.Group();
  const cx = center[0] || 0;
  const cz = center[1] || 0;

  const rad = (draftAngleDeg * Math.PI) / 180;
  const topW = Math.max(10, baseW - 2 * height * Math.tan(rad));
  const topD = Math.max(10, baseD - 2 * height * Math.tan(rad));

  return createRuledLoftSurface(baseW, baseD, topW, topD, height, y, center, {
    ...options,
    name: `Surface_Draft_${Math.round(baseW)}x${Math.round(baseD)}_Angle${draftAngleDeg}deg`
  });
}

/**
 * Creates a 4-Sided Coons Patch / Net Surface
 */
export function createNetSurface(
  width = 80,
  depth = 60,
  domeHeight = 12,
  y = 35,
  center = [0, 0],
  options = {}
) {
  const group = new THREE.Group();
  const cx = center[0] || 0;
  const cz = center[1] || 0;

  const uSegs = 16;
  const vSegs = 16;
  const geo = new THREE.PlaneGeometry(width, depth, uSegs, vSegs);
  geo.rotateX(-Math.PI / 2);

  // Apply smooth double-curved sine dome displacement
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const pz = pos.getZ(i);
    const u = (px / (width / 2)) * (Math.PI / 2);
    const v = (pz / (depth / 2)) * (Math.PI / 2);
    const displacement = Math.cos(u) * Math.cos(v) * domeHeight;
    pos.setY(i, displacement);
  }
  geo.computeVertexNormals();

  const isCheck = options.role === 'check';
  const color = options.color || (isCheck ? 0xf59e0b : 0xeab308);
  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.2,
    roughness: 0.35,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  });

  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  // Wireframe UV grid lines
  const wireMat = new THREE.LineBasicMaterial({ color: 0xb45309, linewidth: 1 });
  const wireSegments = new THREE.LineSegments(new THREE.WireframeGeometry(geo), wireMat);
  group.add(wireSegments);

  group.position.set(cx, y, cz);
  group.name = options.name || `Surface_Net_Coons_${Math.round(width)}x${Math.round(depth)}_H${domeHeight}`;
  group.userData = { type: 'surface_net', width, depth, domeHeight, elevation: y, role: isCheck ? 'check' : 'drive' };
  return group;
}

/**
 * Creates a Swept Surface along a curved trajectory
 */
export function createSweptSurface(
  radius = 18,
  length = 60,
  bendAngleDeg = 45,
  y = 35,
  center = [0, 0],
  options = {}
) {
  const group = new THREE.Group();
  const cx = center[0] || 0;
  const cz = center[1] || 0;

  // Arc path curve
  const curve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, length * 0.4, 0),
    new THREE.Vector3(length * 0.5, length * 0.7, 0),
    new THREE.Vector3(length, length, 0)
  );

  const geo = new THREE.TubeGeometry(curve, 24, radius, 16, false);
  const isCheck = options.role === 'check';
  const color = options.color || (isCheck ? 0xf59e0b : 0xfbbf24);

  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.2,
    roughness: 0.35,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  });

  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geo, 20);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xb45309, linewidth: 1 }));
  group.add(edgeLine);

  group.position.set(cx, y, cz);
  group.name = options.name || `Surface_Sweep_R${radius}_L${length}`;
  group.userData = { type: 'surface_sweep', radius, length, bendAngleDeg, elevation: y, role: isCheck ? 'check' : 'drive' };
  return group;
}

/**
 * Creates an Offset Surface Mesh from existing surface parameters
 */
export function createOffsetSurface(
  baseWidth = 80,
  baseDepth = 60,
  offsetDist = 5,
  y = 35,
  center = [0, 0],
  options = {}
) {
  return createPlanarSurface(baseWidth, baseDepth, y + offsetDist, center, 'G17', {
    ...options,
    name: `Surface_Offset_+${offsetDist}mm_${options.role === 'check' ? 'Check' : 'Drive'}`
  });
}

/**
 * Surface Normals Inversion (Flips facing vector and triangle winding)
 */
export function invertSurfaceNormals(groupOrMesh) {
  if (!groupOrMesh) return false;
  groupOrMesh.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const geo = child.geometry;
      // Invert normals attribute
      if (geo.attributes.normal) {
        const normals = geo.attributes.normal;
        for (let i = 0; i < normals.count; i++) {
          normals.setXYZ(i, -normals.getX(i), -normals.getY(i), -normals.getZ(i));
        }
        normals.needsUpdate = true;
      }
      // Reverse index winding if indexed geometry
      if (geo.index) {
        const index = geo.index.array;
        for (let i = 0; i < index.length; i += 3) {
          const tmp = index[i + 1];
          index[i + 1] = index[i + 2];
          index[i + 2] = tmp;
        }
        geo.index.needsUpdate = true;
      }
      geo.computeVertexNormals();
    }
  });
  return true;
}

/**
 * Set Surface Normals to align strictly along an axis (+Z, -Z, +Y, etc.)
 */
export function setSurfaceNormals(groupOrMesh, axis = 'Y') {
  if (!groupOrMesh) return false;
  const dir = axis === 'Y' ? [0, 1, 0] : axis === 'Z' ? [0, 0, 1] : [1, 0, 0];
  groupOrMesh.traverse((child) => {
    if (child.isMesh && child.geometry && child.geometry.attributes.normal) {
      const normals = child.geometry.attributes.normal;
      for (let i = 0; i < normals.count; i++) {
        normals.setXYZ(i, dir[0], dir[1], dir[2]);
      }
      normals.needsUpdate = true;
    }
  });
  return true;
}

/**
 * Creates a 3D wireframe bounding box cage
 */
export function createBoundingWireframe(bounds, offset = { x: 0, y: 0, z: 0 }) {
  const min = bounds.min;
  const max = bounds.max;
  const ox = offset.x || 0;
  const oy = offset.y || 0;
  const oz = offset.z || 0;

  const w = (max.x - min.x) + ox * 2;
  const h = (max.y - min.y) + oy * 2;
  const d = (max.z - min.z) + oz * 2;

  const boxGeo = new THREE.BoxGeometry(w, h, d);
  const edges = new THREE.EdgesGeometry(boxGeo);
  const mat = new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 2 });
  const line = new THREE.LineSegments(edges, mat);
  line.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
  line.name = `Wireframe_Bounding_Cage_${Math.round(w)}x${Math.round(h)}x${Math.round(d)}`;
  line.userData = { type: 'bounding_cage', width: w, height: h, depth: d };
  return line;
}

/**
 * Creates a 3D wireframe circle or arc on G17 (XZ), G18 (XY), or G19 (YZ)
 */
export function createWireframeCircle(
  radius = 35,
  y = 30,
  center = [0, 0],
  startAngleDeg = 0,
  sweepAngleDeg = 360,
  plane = 'G17',
  options = {}
) {
  const points = [];
  const segments = Math.max(16, Math.min(128, Math.round((sweepAngleDeg / 360) * 64)));
  const startRad = (startAngleDeg * Math.PI) / 180;
  const sweepRad = (sweepAngleDeg * Math.PI) / 180;
  const cx = center[0] || 0;
  const cz = center[1] || 0;

  for (let i = 0; i <= segments; i++) {
    const theta = startRad + (i / segments) * sweepRad;
    const cosVal = Math.cos(theta) * radius;
    const sinVal = Math.sin(theta) * radius;

    if (plane === 'G18') {
      // XY plane, Z elevation
      points.push(new THREE.Vector3(cx + cosVal, y + sinVal, cz));
    } else if (plane === 'G19') {
      // YZ plane, X elevation
      points.push(new THREE.Vector3(cx, y + cosVal, cz + sinVal));
    } else {
      // G17 Top plane (XZ, Y elevation)
      points.push(new THREE.Vector3(cx + cosVal, y, cz + sinVal));
    }
  }

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const color = options.color || (sweepAngleDeg < 360 ? 0xf59e0b : 0x38bdf8);
  const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  const line = new THREE.Line(geo, mat);
  const arcType = sweepAngleDeg >= 360 ? 'Circle' : 'Arc';
  line.name = options.name || `Wireframe_${arcType}_R${radius.toFixed(1)}`;
  line.userData = {
    type: arcType.toLowerCase(),
    cadType: 'circle',
    radius,
    plane,
    center: { x: cx, y, z: cz },
    points
  };
  return line;
}

/**
 * Creates a Bolt Hole Circle (PCD) with pitch circle and hole drill locations
 */
export function createBoltHoleCircle(
  pcd = 60,
  numHoles = 6,
  y = 35,
  center = [0, 0],
  startAngleDeg = 0,
  holeRadius = 3.5,
  options = {}
) {
  const group = new THREE.Group();
  const cx = center[0] || 0;
  const cz = center[1] || 0;
  const pitchRadius = pcd / 2;

  // 1. Pitch Centerline Circle (Dashed Amber)
  const pitchPoints = [];
  for (let i = 0; i <= 64; i++) {
    const theta = (i / 64) * Math.PI * 2;
    pitchPoints.push(new THREE.Vector3(cx + Math.cos(theta) * pitchRadius, y, cz + Math.sin(theta) * pitchRadius));
  }
  const pitchGeo = new THREE.BufferGeometry().setFromPoints(pitchPoints);
  const pitchMat = new THREE.LineDashedMaterial({ color: 0xf59e0b, dashSize: 3, gapSize: 2 });
  const pitchLine = new THREE.Line(pitchGeo, pitchMat);
  pitchLine.computeLineDistances();
  group.add(pitchLine);

  // 2. Individual Holes & Center Markers
  const holePositions = [];
  const dotGeo = new THREE.SphereGeometry(1.2, 12, 12);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  for (let i = 0; i < numHoles; i++) {
    const angleDeg = startAngleDeg + i * (360 / numHoles);
    const theta = (angleDeg * Math.PI) / 180;
    const hx = cx + Math.cos(theta) * pitchRadius;
    const hz = cz + Math.sin(theta) * pitchRadius;
    holePositions.push({ index: i + 1, x: hx, y, z: hz, angleDeg });

    // Hole outline circle
    if (holeRadius > 0) {
      const holeCircle = createWireframeCircle(holeRadius, y, [hx, hz], 0, 360, 'G17', {
        color: 0x38bdf8,
        name: `Hole_Dia${(holeRadius * 2).toFixed(1)}_${i + 1}`
      });
      group.add(holeCircle);
    }

    // Hole center dot marker
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(hx, y, hz);
    group.add(dot);
  }

  group.name = options.name || `Wireframe_PCD${pcd}_${numHoles}Holes`;
  group.userData = { type: 'bolt_hole_circle', pcd, numHoles, holeRadius, holePositions };
  return group;
}

/**
 * Creates a 3D wireframe boundary rectangle with optional corner fillet radius
 */
export function createWireframeRect(
  w = 80,
  d = 60,
  y = 35,
  filletRadius = 0,
  center = [0, 0],
  options = {}
) {
  const cx = center[0] || 0;
  const cz = center[1] || 0;
  const halfW = w / 2;
  const halfD = d / 2;
  const maxR = Math.min(halfW, halfD) * 0.95;
  const r = Math.max(0, Math.min(maxR, filletRadius));

  const points = [];

  if (r <= 0.01) {
    // Sharp Corner Rectangle
    points.push(new THREE.Vector3(cx - halfW, y, cz - halfD));
    points.push(new THREE.Vector3(cx + halfW, y, cz - halfD));
    points.push(new THREE.Vector3(cx + halfW, y, cz + halfD));
    points.push(new THREE.Vector3(cx - halfW, y, cz + halfD));
    points.push(new THREE.Vector3(cx - halfW, y, cz - halfD));
  } else {
    // Rounded Corner Rectangle with 4 tangent fillet arcs
    const arcSegs = 8;
    const corners = [
      { center: [cx + halfW - r, cz + halfD - r], start: 0, end: Math.PI / 2 },
      { center: [cx - halfW + r, cz + halfD - r], start: Math.PI / 2, end: Math.PI },
      { center: [cx - halfW + r, cz - halfD + r], start: Math.PI, end: (3 * Math.PI) / 2 },
      { center: [cx + halfW - r, cz - halfD + r], start: (3 * Math.PI) / 2, end: 2 * Math.PI }
    ];

    corners.forEach((c) => {
      for (let i = 0; i <= arcSegs; i++) {
        const theta = c.start + (i / arcSegs) * (c.end - c.start);
        points.push(new THREE.Vector3(c.center[0] + Math.cos(theta) * r, y, c.center[1] + Math.sin(theta) * r));
      }
    });
    // Close contour
    points.push(points[0].clone());
  }

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const color = options.color || 0x4ade80;
  const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  const line = new THREE.Line(geo, mat);
  line.name = options.name || `Wireframe_Rect_${Math.round(w)}x${Math.round(d)}${r > 0 ? `_R${r}` : ''}`;
  line.userData = {
    type: 'rectangle',
    cadType: 'rect',
    width: w,
    depth: d,
    filletRadius: r,
    center: { x: cx, y, z: cz },
    points
  };
  return line;
}

/**
 * Creates a regular polygon wireframe (Hexagon, Octagon, etc.)
 */
export function createWireframePolygon(
  sides = 6,
  radius = 25,
  y = 35,
  rotationDeg = 0,
  center = [0, 0],
  options = {}
) {
  const n = Math.max(3, Math.min(24, Math.round(sides)));
  const cx = center[0] || 0;
  const cz = center[1] || 0;
  const rotRad = (rotationDeg * Math.PI) / 180;
  const points = [];

  for (let i = 0; i <= n; i++) {
    const theta = rotRad + (i / n) * Math.PI * 2;
    points.push(new THREE.Vector3(cx + Math.cos(theta) * radius, y, cz + Math.sin(theta) * radius));
  }

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const color = options.color || 0xa855f7;
  const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  const line = new THREE.Line(geo, mat);
  line.name = options.name || `Wireframe_Polygon_${n}S_R${radius}`;
  line.userData = { type: 'polygon', sides: n, radius, rotationDeg, center: [cx, y, cz] };
  return line;
}

/**
 * Creates a 3D wireframe line between two endpoints
 */
export function createWireframeLine(
  p1 = [-40, 35, 0],
  p2 = [40, 35, 0],
  options = {}
) {
  const points = [
    new THREE.Vector3(...p1),
    new THREE.Vector3(...p2)
  ];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const color = options.color || 0xf43f5e;
  const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  const line = new THREE.Line(geo, mat);
  const length = points[0].distanceTo(points[1]).toFixed(1);
  line.name = options.name || `Wireframe_Line_L${length}`;
  line.userData = {
    type: 'line',
    cadType: 'line',
    p1: { x: p1[0], y: p1[1], z: p1[2] },
    p2: { x: p2[0], y: p2[1], z: p2[2] },
    points,
    length: Number(length)
  };
  return line;
}

/**
 * Creates a parallel offset wireframe line
 */
export function createParallelLine(p1, p2, offsetDist = 10, plane = 'G17', options = {}) {
  const v1 = new THREE.Vector3(...p1);
  const v2 = new THREE.Vector3(...p2);
  const dir = new THREE.Vector3().subVectors(v2, v1).normalize();

  // Compute normal perpendicular in specified plane
  let norm = new THREE.Vector3();
  if (plane === 'G17') {
    norm.set(-dir.z, 0, dir.x); // perpendicular on XZ
  } else {
    norm.set(-dir.y, dir.x, 0); // perpendicular on XY
  }
  norm.multiplyScalar(offsetDist);

  const np1 = [v1.x + norm.x, v1.y + norm.y, v1.z + norm.z];
  const np2 = [v2.x + norm.x, v2.y + norm.y, v2.z + norm.z];

  return createWireframeLine(np1, np2, {
    color: options.color || 0xf59e0b,
    name: options.name || `Wireframe_Parallel_Offset${offsetDist}`
  });
}

/**
 * Extracts 3D feature edge curves from an active 3D workpiece model
 */
export function extractEdgesFromModel(modelGroup, thresholdAngleDeg = 25) {
  const group = new THREE.Group();
  group.name = `Wireframe_Edges_Group_${Math.round(thresholdAngleDeg)}deg`;

  let totalSegments = 0;
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });

  modelGroup.traverse((child) => {
    if (child.isMesh && child.geometry) {
      try {
        const edgesGeo = new THREE.EdgesGeometry(child.geometry, thresholdAngleDeg);
        if (edgesGeo.attributes.position && edgesGeo.attributes.position.count > 0) {
          const lineSegments = new THREE.LineSegments(edgesGeo, edgeMat);
          lineSegments.position.copy(child.position);
          lineSegments.rotation.copy(child.rotation);
          lineSegments.scale.copy(child.scale);
          group.add(lineSegments);
          totalSegments += edgesGeo.attributes.position.count / 2;
        }
      } catch (err) {
        console.warn("Edge extraction failed for mesh child:", err);
      }
    }
  });

  group.userData = { type: 'extracted_edges', thresholdAngleDeg, totalSegments };
  return { group, totalSegments };
}

/**
 * Creates a 3D datum point marker with coordinate crosshair ticks
 */
export function createPointMarker(coords = [0, 35, 0], name = "Wireframe_Datum_Point", color = 0xef4444) {
  const group = new THREE.Group();
  group.name = name;

  // Center point sphere
  const sphereGeo = new THREE.SphereGeometry(1.5, 16, 16);
  const sphereMat = new THREE.MeshBasicMaterial({ color });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  group.add(sphere);

  // Crosshair ticks
  const tickLength = 5;
  const tickPoints = [
    new THREE.Vector3(-tickLength, 0, 0), new THREE.Vector3(tickLength, 0, 0),
    new THREE.Vector3(0, -tickLength, 0), new THREE.Vector3(0, tickLength, 0),
    new THREE.Vector3(0, 0, -tickLength), new THREE.Vector3(0, 0, tickLength),
  ];
  const tickGeo = new THREE.BufferGeometry().setFromPoints(tickPoints);
  const tickMat = new THREE.LineBasicMaterial({ color, linewidth: 1.5 });
  const ticks = new THREE.LineSegments(tickGeo, tickMat);
  group.add(ticks);

  group.position.set(...coords);
  group.userData = { type: 'datum_point', coords };
  return group;
}

/**
 * Creates a 4-point drill coordinate grid
 */
export function createDrillPointsGrid(bounds, cornerOffset = 8) {
  const min = bounds.min;
  const max = bounds.max;
  const group = new THREE.Group();
  group.name = "Drill_Points_Group";

  const pts = [
    [min.x + cornerOffset, max.y, min.z + cornerOffset],
    [max.x - cornerOffset, max.y, min.z + cornerOffset],
    [max.x - cornerOffset, max.y, max.z - cornerOffset],
    [min.x + cornerOffset, max.y, max.z - cornerOffset],
  ];

  pts.forEach(([x, y, z], idx) => {
    const marker = createPointMarker([x, y, z], `Drill_Corner_${idx + 1}`, 0xef4444);
    group.add(marker);
  });

  group.userData = { type: 'drill_grid', points: pts };
  return group;
}

/**
 * Creates a circular arc curve between start and end angles
 */
export function createWireframeArc(center = [0, 49, 0], radius = 25, startAngleDeg = 0, endAngleDeg = 180, options = {}) {
  const points = [];
  const segments = 48;
  const startRad = (startAngleDeg * Math.PI) / 180;
  const endRad = (endAngleDeg * Math.PI) / 180;
  const sweep = endRad - startRad;

  for (let i = 0; i <= segments; i++) {
    const theta = startRad + (i / segments) * sweep;
    points.push(new THREE.Vector3(
      center[0] + radius * Math.cos(theta),
      center[1],
      center[2] + radius * Math.sin(theta)
    ));
  }

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const color = options.color || 0x38bdf8;
  const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  const arc = new THREE.Line(geo, mat);
  arc.name = options.name || `Wireframe_Arc_R${radius}_${startAngleDeg}-${endAngleDeg}`;
  arc.userData = { type: 'arc', center, radius, startAngleDeg, endAngleDeg };
  return arc;
}

/**
 * Creates a smooth 3D Catmull-Rom spline curve through control points
 */
export function createWireframeSpline(controlPoints = [[-30, 49, -20], [0, 49, 20], [30, 49, -15], [50, 49, 10]], options = {}) {
  const pts = controlPoints.map((p) => new THREE.Vector3(...p));
  const curve = new THREE.CatmullRomCurve3(pts);
  const points = curve.getPoints(64);
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const color = options.color || 0xa855f7;
  const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  const spline = new THREE.Line(geo, mat);
  spline.name = options.name || `Wireframe_Spline_Manual_${controlPoints.length}Pts`;
  spline.userData = { type: 'spline', controlPoints };
  return spline;
}

/**
 * Creates 3D wireframe text lettering paths
 */
export function createWireframeLettering(text = "ARGUS CAM", height = 12, position = [-40, 49, 0], options = {}) {
  const group = new THREE.Group();
  group.name = options.name || `Wireframe_Text_${text.replace(/\s+/g, '_')}`;
  const color = options.color || 0x0284c7;
  const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });

  const charWidth = height * 0.65;
  const spacing = charWidth * 1.35;

  text.toUpperCase().split('').forEach((char, index) => {
    const ox = position[0] + index * spacing;
    const oy = position[1];
    const oz = position[2];
    const pts = [];

    if (char === 'A') {
      pts.push([ox, oy, oz + height], [ox + charWidth * 0.5, oy, oz], [ox + charWidth, oy, oz + height]);
      const bar = [ox + charWidth * 0.25, oy, oz + height * 0.5, ox + charWidth * 0.75, oy, oz + height * 0.5];
      const barGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(bar[0], bar[1], bar[2]), new THREE.Vector3(bar[3], bar[4], bar[5])]);
      group.add(new THREE.Line(barGeo, mat));
    } else if (char === 'R') {
      pts.push([ox, oy, oz + height], [ox, oy, oz], [ox + charWidth, oy, oz], [ox + charWidth, oy, oz + height * 0.5], [ox, oy, oz + height * 0.5], [ox + charWidth, oy, oz + height]);
    } else if (char === 'G') {
      pts.push([ox + charWidth, oy, oz], [ox, oy, oz], [ox, oy, oz + height], [ox + charWidth, oy, oz + height], [ox + charWidth, oy, oz + height * 0.5], [ox + charWidth * 0.5, oy, oz + height * 0.5]);
    } else if (char === 'U') {
      pts.push([ox, oy, oz], [ox, oy, oz + height], [ox + charWidth, oy, oz + height], [ox + charWidth, oy, oz]);
    } else if (char === 'S') {
      pts.push([ox + charWidth, oy, oz], [ox, oy, oz], [ox, oy, oz + height * 0.5], [ox + charWidth, oy, oz + height * 0.5], [ox + charWidth, oy, oz + height], [ox, oy, oz + height]);
    } else if (char === 'C') {
      pts.push([ox + charWidth, oy, oz], [ox, oy, oz], [ox, oy, oz + height], [ox + charWidth, oy, oz + height]);
    } else if (char === 'M') {
      pts.push([ox, oy, oz + height], [ox, oy, oz], [ox + charWidth * 0.5, oy, oz + height * 0.6], [ox + charWidth, oy, oz], [ox + charWidth, oy, oz + height]);
    } else {
      pts.push([ox, oy, oz], [ox + charWidth, oy, oz], [ox + charWidth, oy, oz + height], [ox, oy, oz + height], [ox, oy, oz]);
    }

    if (pts.length > 1) {
      const charGeo = new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(...p)));
      group.add(new THREE.Line(charGeo, mat));
    }
  });

  group.userData = { type: 'lettering', text, height, position };
  return group;
}

/**
 * Creates a 2D planar silhouette boundary around workpiece at active Z
 */
export function createSilhouetteBoundaryWireframe(bounds, y = 49, options = {}) {
  const min = bounds?.min || { x: -60, z: -35 };
  const max = bounds?.max || { x: 60, z: 35 };
  const margin = options.margin || 2.0;

  const points = [
    new THREE.Vector3(min.x - margin, y, min.z - margin),
    new THREE.Vector3(max.x + margin, y, min.z - margin),
    new THREE.Vector3(max.x + margin, y, max.z + margin),
    new THREE.Vector3(min.x - margin, y, max.z + margin),
    new THREE.Vector3(min.x - margin, y, min.z - margin)
  ];

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const color = options.color || 0x06b6d4;
  const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  const line = new THREE.Line(geo, mat);
  line.name = options.name || "Wireframe_Silhouette_Boundary";
  line.userData = { type: 'silhouette_boundary', bounds, y };
  return line;
}

/**
 * Creates 2D lathe turning envelope profile wireframe
 */
export function createTurnProfileWireframe(bounds, options = {}) {
  const min = bounds?.min || { x: -60, y: 49, z: -35 };
  const max = bounds?.max || { x: 60, y: 120, z: 35 };
  const y = options.y || 49;

  const points = [
    new THREE.Vector3(min.x, y, 0),
    new THREE.Vector3(min.x, y, (max.z - min.z) * 0.4),
    new THREE.Vector3(0, y, (max.z - min.z) * 0.45),
    new THREE.Vector3(max.x * 0.6, y, (max.z - min.z) * 0.5),
    new THREE.Vector3(max.x, y, (max.z - min.z) * 0.5),
    new THREE.Vector3(max.x, y, 0),
    new THREE.Vector3(min.x, y, 0)
  ];

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const color = options.color || 0xec4899;
  const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  const line = new THREE.Line(geo, mat);
  line.name = options.name || "Wireframe_Turn_Profile";
  line.userData = { type: 'turn_profile' };
  return line;
}

/**
 * Creates planar cross-section slice curve at plane Y
 */
export function createSliceCurveWireframe(bounds, sliceY = 65, options = {}) {
  const min = bounds?.min || { x: -50, z: -30 };
  const max = bounds?.max || { x: 50, z: 30 };

  const points = [
    new THREE.Vector3(min.x, sliceY, min.z),
    new THREE.Vector3(max.x, sliceY, min.z),
    new THREE.Vector3(max.x, sliceY, max.z),
    new THREE.Vector3(min.x, sliceY, max.z),
    new THREE.Vector3(min.x, sliceY, min.z)
  ];

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const color = options.color || 0x10b981;
  const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  const line = new THREE.Line(geo, mat);
  line.name = options.name || `Wireframe_Curve_Slice_Y${sliceY.toFixed(1)}`;
  line.userData = { type: 'curve_slice', sliceY };
  return line;
}

/**
 * Creates corner fillet or chamfer bevel wireframe
 */
export function createFilletChamferWireframe(corner = [0, 49, 0], radius = 5, isChamfer = false, options = {}) {
  const color = options.color || (isChamfer ? 0xf59e0b : 0x10b981);
  const points = [];

  if (isChamfer) {
    points.push(
      new THREE.Vector3(corner[0] - radius, corner[1], corner[2]),
      new THREE.Vector3(corner[0], corner[1], corner[2] + radius)
    );
  } else {
    const segments = 16;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * (Math.PI / 2);
      points.push(new THREE.Vector3(
        corner[0] - radius + radius * Math.cos(theta),
        corner[1],
        corner[2] + radius * Math.sin(theta)
      ));
    }
  }

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  const line = new THREE.Line(geo, mat);
  line.name = options.name || `Wireframe_${isChamfer ? 'Chamfer' : 'Fillet'}_R${radius}`;
  line.userData = { type: isChamfer ? 'chamfer' : 'fillet', radius, corner };
  return line;
}

/**
 * Creates parallel offset wireframe contour
 */
export function createOffsetWireframe(sourcePoints, offsetDist = 5, y = 49, options = {}) {
  const points = (sourcePoints || [
    [-30, y, -20], [30, y, -20], [30, y, 20], [-30, y, 20], [-30, y, -20]
  ]).map(([x, py, z]) => new THREE.Vector3(x > 0 ? x + offsetDist : x - offsetDist, py, z > 0 ? z + offsetDist : z - offsetDist));

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const color = options.color || 0x38bdf8;
  const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  const line = new THREE.Line(geo, mat);
  line.name = options.name || `Wireframe_Offset_${offsetDist}mm`;
  line.userData = { type: 'offset', offsetDist };
  return line;
}

/**
 * Calculates part bounding box and dimensional metrics
 */
export function calculatePartMetrics(object3D) {
  const box = new THREE.Box3().setFromObject(object3D);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  let triangles = 0;
  let totalArea = 0;

  object3D.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const geo = child.geometry;
      if (geo.index) {
        triangles += geo.index.count / 3;
      } else if (geo.attributes.position) {
        triangles += geo.attributes.position.count / 3;
      }
    }
  });

  // Calculate approximate surface area and volume
  const surfaceAreaEst = 2 * (size.x * size.y + size.x * size.z + size.y * size.z) * 0.85; // mm2
  const volumeEst = (size.x * size.y * size.z * 0.72) / 1000; // cm3
  const massAluKg = ((volumeEst * 2.7) / 1000).toFixed(2); // Aluminum density 2.7 g/cm3
  const massSteelKg = ((volumeEst * 7.85) / 1000).toFixed(2); // Steel density 7.85 g/cm3

  return {
    dimensions: {
      x: Number(size.x.toFixed(2)),
      y: Number(size.y.toFixed(2)),
      z: Number(size.z.toFixed(2))
    },
    box,
    bounds: box,
    center: {
      x: Number(center.x.toFixed(2)),
      y: Number(center.y.toFixed(2)),
      z: Number(center.z.toFixed(2))
    },
    triangles: Math.round(triangles),
    surfaceAreaMm2: Math.round(surfaceAreaEst),
    volumeCm3: Number(volumeEst.toFixed(1)),
    massAluKg,
    massSteelKg
  };
}

/**
 * Checks manifold solid integrity, boundary edges, and watertight status
 */
export function checkMeshManifoldIntegrity(object3D) {
  let totalTriangles = 0;
  let totalVertices = 0;
  let nonManifoldEdges = 0;
  let boundaryEdges = 0;
  const edgeCountMap = new Map();

  object3D.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const geo = child.geometry;
      const pos = geo.attributes.position;
      if (!pos) return;
      totalVertices += pos.count;

      const getVertexKey = (i) => {
        const x = Math.round(pos.getX(i) * 100);
        const y = Math.round(pos.getY(i) * 100);
        const z = Math.round(pos.getZ(i) * 100);
        return `${x}_${y}_${z}`;
      };

      const recordEdge = (k1, k2) => {
        const edgeKey = k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
        edgeCountMap.set(edgeKey, (edgeCountMap.get(edgeKey) || 0) + 1);
      };

      if (geo.index) {
        const idx = geo.index;
        const triCount = idx.count / 3;
        totalTriangles += triCount;
        for (let i = 0; i < idx.count; i += 3) {
          const a = idx.getX(i);
          const b = idx.getX(i + 1);
          const c = idx.getX(i + 2);
          const ka = getVertexKey(a);
          const kb = getVertexKey(b);
          const kc = getVertexKey(c);
          recordEdge(ka, kb);
          recordEdge(kb, kc);
          recordEdge(kc, ka);
        }
      } else {
        const triCount = pos.count / 3;
        totalTriangles += triCount;
        for (let i = 0; i < pos.count; i += 3) {
          const ka = getVertexKey(i);
          const kb = getVertexKey(i + 1);
          const kc = getVertexKey(i + 2);
          recordEdge(ka, kb);
          recordEdge(kb, kc);
          recordEdge(kc, ka);
        }
      }
    }
  });

  edgeCountMap.forEach((count) => {
    if (count === 1) boundaryEdges++;
    else if (count > 2) nonManifoldEdges++;
  });

  const isWatertight = boundaryEdges === 0 && nonManifoldEdges === 0 && totalTriangles > 0;

  return {
    totalTriangles: Math.round(totalTriangles),
    totalVertices,
    boundaryEdges,
    nonManifoldEdges,
    isWatertight,
    status: isWatertight ? 'Watertight Closed Solid (2-Manifold)' : boundaryEdges > 0 ? 'Open Surface Mesh (Holes Detected)' : 'Non-Manifold Mesh'
  };
}

/**
 * Recomputes smoothed vertex normals for all meshes in an object
 */
export function repairMeshNormals(object3D) {
  let repairedCount = 0;
  object3D.traverse((child) => {
    if (child.isMesh && child.geometry) {
      child.geometry.computeVertexNormals();
      child.geometry.computeBoundingBox();
      child.geometry.computeBoundingSphere();
      if (child.material) child.material.needsUpdate = true;
      repairedCount++;
    }
  });
  return repairedCount;
}

/**
 * Inverts triangle winding order (flips normals inside-out / outside-in)
 */
export function flipMeshNormals(object3D) {
  let count = 0;
  object3D.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const geo = child.geometry;
      if (geo.index) {
        const arr = geo.index.array;
        for (let i = 0; i < arr.length; i += 3) {
          const temp = arr[i + 1];
          arr[i + 1] = arr[i + 2];
          arr[i + 2] = temp;
        }
        geo.index.needsUpdate = true;
      }
      geo.computeVertexNormals();
      if (child.material) child.material.needsUpdate = true;
      count++;
    }
  });
  return count;
}

/**
 * Decimates mesh triangles using 3D spatial vertex clustering, preserving watertight topology
 * without punching holes in the mesh.
 */
export function decimateMeshGeometry(object3D, reductionRatio = 0.5) {
  let oldTriangles = 0;
  let newTriangles = 0;

  object3D.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const geo = child.geometry;
      const pos = geo.attributes.position;
      if (!pos) return;

      const pArr = pos.array;
      const vertexCount = pos.count;

      let indices = [];
      if (geo.index) {
        indices = Array.from(geo.index.array);
      } else {
        indices = Array.from({ length: vertexCount }, (_, i) => i);
      }

      const triCount = indices.length / 3;
      oldTriangles += triCount;

      // Compute bounding box
      geo.computeBoundingBox();
      const bbox = geo.boundingBox || new THREE.Box3().setFromBufferAttribute(pos);
      const size = new THREE.Vector3();
      bbox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z, 1.0);

      // Grid cell size proportional to reduction ratio (0.1 to 0.8)
      const cellSize = maxDim * (0.015 + reductionRatio * 0.045);

      // Voxel clustering: map 3D voxel key -> representative vertex
      const voxelMap = new Map();
      const vertexRemap = new Int32Array(vertexCount);
      const newPositions = [];

      for (let i = 0; i < vertexCount; i++) {
        const vx = pArr[i * 3];
        const vy = pArr[i * 3 + 1];
        const vz = pArr[i * 3 + 2];

        const gx = Math.floor((vx - bbox.min.x) / cellSize);
        const gy = Math.floor((vy - bbox.min.y) / cellSize);
        const gz = Math.floor((vz - bbox.min.z) / cellSize);
        const voxelKey = `${gx},${gy},${gz}`;

        if (!voxelMap.has(voxelKey)) {
          const newIdx = newPositions.length / 3;
          voxelMap.set(voxelKey, {
            newIdx,
            sumX: vx,
            sumY: vy,
            sumZ: vz,
            count: 1
          });
          newPositions.push(vx, vy, vz);
          vertexRemap[i] = newIdx;
        } else {
          const cell = voxelMap.get(voxelKey);
          cell.sumX += vx;
          cell.sumY += vy;
          cell.sumZ += vz;
          cell.count += 1;
          vertexRemap[i] = cell.newIdx;
        }
      }

      // Average positions in each cluster cell
      voxelMap.forEach((cell) => {
        const base = cell.newIdx * 3;
        newPositions[base] = cell.sumX / cell.count;
        newPositions[base + 1] = cell.sumY / cell.count;
        newPositions[base + 2] = cell.sumZ / cell.count;
      });

      // Filter degenerate triangles
      const newIndices = [];
      for (let t = 0; t < indices.length; t += 3) {
        const r1 = vertexRemap[indices[t]];
        const r2 = vertexRemap[indices[t + 1]];
        const r3 = vertexRemap[indices[t + 2]];

        // Triangle is only kept if all 3 clustered vertices are distinct
        if (r1 !== r2 && r2 !== r3 && r3 !== r1) {
          newIndices.push(r1, r2, r3);
        }
      }

      // If extreme decimation eliminated too many faces, keep original or minimum fallback
      if (newIndices.length >= 12 && newIndices.length < indices.length) {
        const decimatedGeo = new THREE.BufferGeometry();
        decimatedGeo.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
        decimatedGeo.setIndex(newIndices);
        decimatedGeo.computeVertexNormals();
        decimatedGeo.computeBoundingBox();
        decimatedGeo.computeBoundingSphere();

        child.geometry.dispose();
        child.geometry = decimatedGeo;
        newTriangles += newIndices.length / 3;
      } else {
        newTriangles += triCount;
      }

      if (child.material) child.material.needsUpdate = true;
    }
  });

  const reductionPct = oldTriangles > 0 ? Math.round(((oldTriangles - newTriangles) / oldTriangles) * 100) : 0;
  return {
    oldTriangles: Math.round(oldTriangles),
    newTriangles: Math.round(newTriangles),
    reductionPct
  };
}

/**
 * Applies Laplacian smoothing to smooth out polygonal facet ripples and 3D scan noise
 */
export function smoothMeshGeometry(object3D, iterations = 2, strength = 0.4) {
  let smoothedMeshes = 0;

  object3D.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const geo = child.geometry;
      const pos = geo.attributes.position;
      if (!pos) return;

      const vertexCount = pos.count;
      // Build adjacency list for vertices
      const adjacency = Array.from({ length: vertexCount }, () => new Set());

      let indices = [];
      if (geo.index) {
        indices = geo.index.array;
      } else {
        indices = Array.from({ length: vertexCount }, (_, i) => i);
      }

      for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i];
        const b = indices[i + 1];
        const c = indices[i + 2];
        if (a < vertexCount && b < vertexCount && c < vertexCount) {
          adjacency[a].add(b);
          adjacency[a].add(c);
          adjacency[b].add(a);
          adjacency[b].add(c);
          adjacency[c].add(a);
          adjacency[c].add(b);
        }
      }

      const pArr = pos.array;

      for (let it = 0; it < iterations; it++) {
        const newCoords = new Float32Array(pArr.length);
        for (let i = 0; i < vertexCount; i++) {
          const neighbors = adjacency[i];
          if (neighbors.size === 0) {
            newCoords[i * 3] = pArr[i * 3];
            newCoords[i * 3 + 1] = pArr[i * 3 + 1];
            newCoords[i * 3 + 2] = pArr[i * 3 + 2];
            continue;
          }

          let avgX = 0, avgY = 0, avgZ = 0;
          neighbors.forEach((nIdx) => {
            avgX += pArr[nIdx * 3];
            avgY += pArr[nIdx * 3 + 1];
            avgZ += pArr[nIdx * 3 + 2];
          });
          avgX /= neighbors.size;
          avgY /= neighbors.size;
          avgZ /= neighbors.size;

          newCoords[i * 3] = pArr[i * 3] + (avgX - pArr[i * 3]) * strength;
          newCoords[i * 3 + 1] = pArr[i * 3 + 1] + (avgY - pArr[i * 3 + 1]) * strength;
          newCoords[i * 3 + 2] = pArr[i * 3 + 2] + (avgZ - pArr[i * 3 + 2]) * strength;
        }

        for (let j = 0; j < pArr.length; j++) {
          pArr[j] = newCoords[j];
        }
      }

      pos.needsUpdate = true;
      geo.computeVertexNormals();
      geo.computeBoundingBox();
      geo.computeBoundingSphere();
      if (child.material) child.material.needsUpdate = true;
      smoothedMeshes++;
    }
  });

  return { smoothedMeshes, iterations };
}

/**
 * Midpoint triangle subdivision to increase mesh density for high-precision 5-axis surfacing
 */
export function subdivideMeshGeometry(object3D) {
  let oldTriangles = 0;
  let newTriangles = 0;

  object3D.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const geo = child.geometry;
      const pos = geo.attributes.position;
      if (!pos) return;

      const pArr = pos.array;
      let indices = [];
      if (geo.index) {
        indices = Array.from(geo.index.array);
      } else {
        indices = Array.from({ length: pos.count }, (_, i) => i);
      }

      const triCount = indices.length / 3;
      oldTriangles += triCount;

      const newPositions = Array.from(pArr);
      const newIndices = [];
      const edgeMidpointMap = new Map();

      const getMidpoint = (idx1, idx2) => {
        const edgeKey = idx1 < idx2 ? `${idx1}_${idx2}` : `${idx2}_${idx1}`;
        if (edgeMidpointMap.has(edgeKey)) {
          return edgeMidpointMap.get(edgeKey);
        }

        const midX = (pArr[idx1 * 3] + pArr[idx2 * 3]) / 2;
        const midY = (pArr[idx1 * 3 + 1] + pArr[idx2 * 3 + 1]) / 2;
        const midZ = (pArr[idx1 * 3 + 2] + pArr[idx2 * 3 + 2]) / 2;

        const newIdx = newPositions.length / 3;
        newPositions.push(midX, midY, midZ);
        edgeMidpointMap.set(edgeKey, newIdx);
        return newIdx;
      };

      for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i];
        const b = indices[i + 1];
        const c = indices[i + 2];

        const mab = getMidpoint(a, b);
        const mbc = getMidpoint(b, c);
        const mca = getMidpoint(c, a);

        // 4 sub-triangles
        newIndices.push(a, mab, mca);
        newIndices.push(b, mbc, mab);
        newIndices.push(c, mca, mbc);
        newIndices.push(mab, mbc, mca);
      }

      newTriangles += newIndices.length / 3;

      const newGeo = new THREE.BufferGeometry();
      newGeo.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
      newGeo.setIndex(newIndices);
      newGeo.computeVertexNormals();
      newGeo.computeBoundingBox();
      newGeo.computeBoundingSphere();

      child.geometry.dispose();
      child.geometry = newGeo;
      if (child.material) child.material.needsUpdate = true;
    }
  });

  return {
    oldTriangles: Math.round(oldTriangles),
    newTriangles: Math.round(newTriangles)
  };
}

/**
 * Detects open boundary edges and triangulates them to close holes (makes solid watertight)
 */
export function fillMeshHoles(object3D) {
  let holesFilled = 0;
  let addedTriangles = 0;

  object3D.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const geo = child.geometry;
      const pos = geo.attributes.position;
      if (!pos) return;

      const edgeMap = new Map();
      let indices = [];
      if (geo.index) {
        indices = Array.from(geo.index.array);
      } else {
        indices = Array.from({ length: pos.count }, (_, i) => i);
      }

      for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i];
        const b = indices[i + 1];
        const c = indices[i + 2];
        const addEdge = (v1, v2) => {
          const key = `${v1}_${v2}`;
          edgeMap.set(key, (edgeMap.get(key) || 0) + 1);
        };
        addEdge(a, b);
        addEdge(b, c);
        addEdge(c, a);
      }

      // Boundary edges occur in only one winding direction
      const boundaryEdges = [];
      edgeMap.forEach((count, key) => {
        const [v1, v2] = key.split('_').map(Number);
        const reverseKey = `${v2}_${v1}`;
        if (!edgeMap.has(reverseKey)) {
          boundaryEdges.push([v1, v2]);
        }
      });

      if (boundaryEdges.length >= 3) {
        // Compute center point of boundary vertices
        let sumX = 0, sumY = 0, sumZ = 0;
        const pArr = Array.from(pos.array);
        const uniqueVerts = new Set();
        boundaryEdges.forEach(([v1, v2]) => {
          uniqueVerts.add(v1);
          uniqueVerts.add(v2);
        });

        uniqueVerts.forEach((v) => {
          sumX += pArr[v * 3];
          sumY += pArr[v * 3 + 1];
          sumZ += pArr[v * 3 + 2];
        });

        const centerX = sumX / uniqueVerts.size;
        const centerY = sumY / uniqueVerts.size;
        const centerZ = sumZ / uniqueVerts.size;

        const centerIdx = pArr.length / 3;
        pArr.push(centerX, centerY, centerZ);

        // Triangulate boundary edges to center
        boundaryEdges.forEach(([v1, v2]) => {
          indices.push(v1, v2, centerIdx);
          addedTriangles++;
        });

        holesFilled++;

        const newGeo = new THREE.BufferGeometry();
        newGeo.setAttribute('position', new THREE.Float32BufferAttribute(pArr, 3));
        newGeo.setIndex(indices);
        newGeo.computeVertexNormals();
        newGeo.computeBoundingBox();
        newGeo.computeBoundingSphere();

        child.geometry.dispose();
        child.geometry = newGeo;
        if (child.material) child.material.needsUpdate = true;
      }
    }
  });

  return { holesFilled, addedTriangles };
}

/**
 * Creates high-resolution 3D billboard text sprite using HTML5 Canvas
 */
export function createTextCanvasSprite(text, options = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = options.bgColor || 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = options.borderColor || '#38bdf8';
  ctx.lineWidth = 3;
  if (ctx.roundRect) {
    ctx.roundRect(4, 4, 248, 56, 8);
  } else {
    ctx.rect(4, 4, 248, 56);
  }
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = options.textColor || '#f8fafc';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(options.scaleX || 24, options.scaleY || 6, 1);
  return sprite;
}

/**
 * Creates a parametric 3D linear dimension entity with dual arrowheads and text
 */
export function create3DLinearDimension(p1, p2, text, options = {}) {
  const group = new THREE.Group();
  group.name = options.name || `Drafting_Dimension_${Date.now()}`;

  const v1 = new THREE.Vector3(...p1);
  const v2 = new THREE.Vector3(...p2);
  const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);

  const color = options.color || 0x38bdf8;
  const lineMat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  const lineGeo = new THREE.BufferGeometry().setFromPoints([v1, v2]);
  const dimLine = new THREE.Line(lineGeo, lineMat);
  group.add(dimLine);

  // Arrowheads at endpoints
  const arrowLen = options.arrowLength || 4;
  const arrowRadius = options.arrowRadius || 1.2;
  const coneGeo = new THREE.ConeGeometry(arrowRadius, arrowLen, 8);
  const coneMat = new THREE.MeshBasicMaterial({ color });

  const arrow1 = new THREE.Mesh(coneGeo, coneMat);
  arrow1.position.copy(v1);
  const dir1 = new THREE.Vector3().subVectors(v2, v1).normalize();
  arrow1.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir1);
  group.add(arrow1);

  const arrow2 = new THREE.Mesh(coneGeo, coneMat);
  arrow2.position.copy(v2);
  const dir2 = new THREE.Vector3().subVectors(v1, v2).normalize();
  arrow2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir2);
  group.add(arrow2);

  // 3D Canvas Text Label
  const labelSprite = createTextCanvasSprite(text, {
    borderColor: '#38bdf8',
    scaleX: 20,
    scaleY: 5.5
  });
  labelSprite.position.set(mid.x, mid.y + 4, mid.z);
  group.add(labelSprite);

  group.userData = {
    type: 'drafting_linear',
    level: 100,
    p1,
    p2,
    text,
    length: Number(v1.distanceTo(v2).toFixed(2))
  };

  return group;
}

/**
 * Creates a parametric 3D radial / diametral callout on Level 100
 */
export function create3DRadialDimension(center, radius, text, options = {}) {
  const group = new THREE.Group();
  group.name = options.name || `Drafting_Radial_${Date.now()}`;

  const c = new THREE.Vector3(...center);
  const angle = options.angle !== undefined ? options.angle : Math.PI / 4;
  const rim = new THREE.Vector3(c.x + Math.cos(angle) * radius, c.y, c.z + Math.sin(angle) * radius);
  const tip = new THREE.Vector3(c.x + Math.cos(angle) * (radius + 14), c.y + 6, c.z + Math.sin(angle) * (radius + 14));

  const color = options.color || 0xf59e0b;
  const lineMat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  const lineGeo = new THREE.BufferGeometry().setFromPoints([c, rim, tip]);
  const leaderLine = new THREE.Line(lineGeo, lineMat);
  group.add(leaderLine);

  // Arrow at rim
  const coneGeo = new THREE.ConeGeometry(1.2, 4, 8);
  const coneMat = new THREE.MeshBasicMaterial({ color });
  const arrow = new THREE.Mesh(coneGeo, coneMat);
  arrow.position.copy(rim);
  const dir = new THREE.Vector3().subVectors(c, rim).normalize();
  arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  group.add(arrow);

  // Text label
  const labelSprite = createTextCanvasSprite(text, {
    borderColor: '#f59e0b',
    scaleX: 18,
    scaleY: 5.5
  });
  labelSprite.position.set(tip.x + 3, tip.y + 3, tip.z);
  group.add(labelSprite);

  group.userData = {
    type: 'drafting_radial',
    level: 100,
    center,
    radius,
    text
  };

  return group;
}

/**
 * Creates a 3D WCS datum note or machining operator leader tag
 */
export function create3DDatumLeaderNote(point, noteText, datumTag = 'G54', options = {}) {
  const group = new THREE.Group();
  group.name = options.name || `Drafting_Datum_${Date.now()}`;

  const p = new THREE.Vector3(...point);
  const elbow = new THREE.Vector3(p.x + 12, p.y + 12, p.z + 6);
  const end = new THREE.Vector3(elbow.x + 14, elbow.y, elbow.z);

  const color = options.color || 0x10b981;
  const lineMat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  const lineGeo = new THREE.BufferGeometry().setFromPoints([p, elbow, end]);
  const leaderLine = new THREE.Line(lineGeo, lineMat);
  group.add(leaderLine);

  // Datum spherical point marker
  const sphereGeo = new THREE.SphereGeometry(1.2, 12, 12);
  const sphereMat = new THREE.MeshBasicMaterial({ color });
  const marker = new THREE.Mesh(sphereGeo, sphereMat);
  marker.position.copy(p);
  group.add(marker);

  // Text billboard
  const fullText = `[${datumTag}] ${noteText}`;
  const labelSprite = createTextCanvasSprite(fullText, {
    borderColor: '#10b981',
    scaleX: 28,
    scaleY: 6
  });
  labelSprite.position.set(end.x + 8, end.y + 2, end.z);
  group.add(labelSprite);

  group.userData = {
    type: 'drafting_datum',
    level: 100,
    point,
    datumTag,
    noteText
  };

  return group;
}

/**
 * Clones a 3D model and applies position, rotation, and scale transforms
 */
export function cloneAndTransformModel(object3D, options = {}) {
  const clone = object3D.clone(true);
  clone.name = options.name || `CAD_Model_Copy_${Date.now()}`;

  const pos = options.position || { x: 0, y: 0, z: 0 };
  const rot = options.rotation || { x: 0, y: 0, z: 0 };
  const scl = options.scale || { x: 1, y: 1, z: 1 };

  clone.position.set(pos.x, pos.y, pos.z);
  clone.rotation.set(rot.x, rot.y, rot.z);
  clone.scale.set(scl.x, scl.y, scl.z);

  clone.userData = {
    ...object3D.userData,
    isCopy: true,
    transform: { position: pos, rotation: rot, scale: scl }
  };

  return clone;
}

/**
 * Creates a mirrored copy of the model across a principal plane (XY, XZ, or YZ)
 */
export function mirrorModelAcrossPlane(object3D, plane = 'YZ') {
  const clone = object3D.clone(true);
  clone.name = `CAD_Mirrored_${plane}_${Date.now()}`;

  if (plane === 'YZ') {
    clone.scale.x = -1;
  } else if (plane === 'XZ') {
    clone.scale.y = -1;
  } else {
    clone.scale.z = -1;
  }

  // Flip inverted faces so lighting and shading are accurate
  flipMeshNormals(clone);

  clone.userData = {
    ...object3D.userData,
    isMirrored: true,
    mirrorPlane: plane
  };

  return clone;
}

/**
 * Exports the active 3D CAD mesh to an STL file download in the browser (binary or ASCII)
 */
export async function exportSceneToSTL(object3D, filename = "Argus_CAD_Model.stl", binary = true) {
  const { STLExporter } = await import('three/examples/jsm/exporters/STLExporter.js');
  const exporter = new STLExporter();
  const result = exporter.parse(object3D, { binary });

  const blob = new Blob([result], { type: binary ? 'application/octet-stream' : 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.stl') ? filename : `${filename}.stl`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports the active 3D CAD mesh to a Wavefront OBJ file download
 */
export async function exportSceneToOBJ(object3D, filename = "Argus_CAD_Model.obj") {
  const { OBJExporter } = await import('three/examples/jsm/exporters/OBJExporter.js');
  const exporter = new OBJExporter();
  const result = exporter.parse(object3D);

  const blob = new Blob([result], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.obj') ? filename : `${filename}.obj`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports the active CAM project as a .mcam JSON package
 */
export function exportProjectMCAM(projectState, filename = "Project.mcam") {
  const data = JSON.stringify(projectState, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.mcam') ? filename : `${filename}.mcam`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Creates a 3D dashed coordinate centerline axis in hole
 */
export function createHoleAxisCenterline(cx = 0, cy = 20, cz = 0, height = 50) {
  const points = [
    new THREE.Vector3(cx, cy - height / 2 - 5, cz),
    new THREE.Vector3(cx, cy + height / 2 + 5, cz)
  ];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineDashedMaterial({
    color: 0x0f172a,
    dashSize: 3,
    gapSize: 1.5,
    linewidth: 2
  });
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  line.name = `Hole_Axis_X${cx}_Z${cz}`;
  line.userData = { type: 'hole_axis', cx, cy, cz, height };
  return line;
}

/**
 * Disassembles / Explodes multi-component solid assemblies
 */
export function disassembleAssemblyComponents(modelGroup, distance = 35) {
  if (!modelGroup) return false;
  let idx = 0;
  modelGroup.traverse((child) => {
    if (child.isMesh) {
      idx++;
      child.userData.originalPosition = child.userData.originalPosition || child.position.clone();
      child.position.y += (idx % 2 === 0 ? 1 : -1) * distance * (idx * 0.5);
      child.position.x += (idx % 3 === 0 ? 1 : -1) * distance * 0.4;
    }
  });
  return true;
}

/**
 * Repositions / Collapses exploded assemblies back together
 */
export function positionAssemblyComponents(modelGroup) {
  if (!modelGroup) return false;
  modelGroup.traverse((child) => {
    if (child.isMesh && child.userData.originalPosition) {
      child.position.copy(child.userData.originalPosition);
    }
  });
  return true;
}

/**
 * Clears custom face and feature colors across model
 */
export function clearAllCustomColors(modelGroup, defaultColor = 0x38bdf8) {
  if (!modelGroup) return false;
  modelGroup.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material = new THREE.MeshStandardMaterial({
        color: defaultColor,
        metalness: 0.8,
        roughness: 0.25
      });
    }
  });
  return true;
}

/**
 * Applies custom color to selected feature or faces
 */
export function applyFeatureColor(modelGroup, color = 0xf43f5e) {
  if (!modelGroup) return false;
  modelGroup.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.8,
        roughness: 0.25
      });
    }
  });
  return true;
}

/**
 * Creates a parametric 3D angular dimension entity
 */
export function create3DAngularDimension(center = [0, 0, 0], angleDeg = 45, radius = 25, options = {}) {
  const group = new THREE.Group();
  group.name = options.name || `Drafting_Angular_${Date.now()}`;
  const c = new THREE.Vector3(...center);
  const color = options.color || 0x0284c7;

  const radTotal = (angleDeg * Math.PI) / 180;
  const segments = 32;
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * radTotal;
    points.push(new THREE.Vector3(c.x + Math.cos(theta) * radius, c.y, c.z + Math.sin(theta) * radius));
  }

  const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
  const arcMat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  const arcLine = new THREE.Line(arcGeo, arcMat);
  group.add(arcLine);

  // Dimension rays from center
  const r1 = new THREE.Vector3(c.x + Math.cos(0) * (radius + 5), c.y, c.z + Math.sin(0) * (radius + 5));
  const r2 = new THREE.Vector3(c.x + Math.cos(radTotal) * (radius + 5), c.y, c.z + Math.sin(radTotal) * (radius + 5));
  const raysGeo = new THREE.BufferGeometry().setFromPoints([c, r1, c, r2]);
  const raysLine = new THREE.LineSegments(raysGeo, new THREE.LineBasicMaterial({ color: 0x64748b, linewidth: 1 }));
  group.add(raysLine);

  // Arrowheads at arc endpoints
  const coneGeo = new THREE.ConeGeometry(1.2, 4, 8);
  const coneMat = new THREE.MeshBasicMaterial({ color });
  const arrow1 = new THREE.Mesh(coneGeo, coneMat);
  arrow1.position.copy(points[0]);
  arrow1.rotation.y = -Math.PI / 2;
  group.add(arrow1);

  const arrow2 = new THREE.Mesh(coneGeo, coneMat);
  arrow2.position.copy(points[points.length - 1]);
  arrow2.rotation.y = radTotal + Math.PI / 2;
  group.add(arrow2);

  // Text label
  const midAngle = radTotal / 2;
  const textPos = new THREE.Vector3(c.x + Math.cos(midAngle) * (radius + 8), c.y + 2, c.z + Math.sin(midAngle) * (radius + 8));
  const labelSprite = createTextCanvasSprite(`${angleDeg.toFixed(1)}°`, {
    borderColor: '#0284c7',
    scaleX: 16,
    scaleY: 5.5
  });
  labelSprite.position.copy(textPos);
  group.add(labelSprite);

  group.userData = {
    type: 'drafting_angular',
    level: 100,
    center,
    angleDeg,
    radius
  };
  return group;
}

/**
 * Creates a parametric 3D ordinate dimension set from a common 0.0 datum
 */
export function create3DOrdinateDimension(origin = [0, 0, 0], points = [[20, 0, 0], [50, 0, 0]], axis = 'x', options = {}) {
  const group = new THREE.Group();
  group.name = options.name || `Drafting_Ordinate_${Date.now()}`;
  const orig = new THREE.Vector3(...origin);
  const color = options.color || 0x0284c7;

  // Datum origin marker (0.0)
  const sphereGeo = new THREE.SphereGeometry(1.5, 12, 12);
  const marker = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  marker.position.copy(orig);
  group.add(marker);

  const origSprite = createTextCanvasSprite(`${axis.toUpperCase()} 0.00`, {
    borderColor: '#ef4444',
    scaleX: 16,
    scaleY: 5
  });
  origSprite.position.set(orig.x, orig.y + 4, orig.z);
  group.add(origSprite);

  // Measured ordinate leader callouts
  points.forEach((pArr, idx) => {
    const pt = new THREE.Vector3(...pArr);
    const dist = axis === 'x' ? Math.abs(pt.x - orig.x) : Math.abs(pt.z - orig.z);
    const leaderY = pt.y + 12 + idx * 4;
    const leaderEnd = new THREE.Vector3(pt.x, leaderY, pt.z);

    const leaderGeo = new THREE.BufferGeometry().setFromPoints([pt, leaderEnd]);
    const leaderLine = new THREE.Line(leaderGeo, new THREE.LineBasicMaterial({ color, linewidth: 1.5 }));
    group.add(leaderLine);

    const calloutSprite = createTextCanvasSprite(`${dist.toFixed(2)} mm`, {
      borderColor: '#0284c7',
      scaleX: 18,
      scaleY: 5.2
    });
    calloutSprite.position.set(leaderEnd.x, leaderEnd.y + 2.5, leaderEnd.z);
    group.add(calloutSprite);
  });

  group.userData = {
    type: 'drafting_ordinate',
    level: 100,
    origin,
    axis,
    pointCount: points.length
  };
  return group;
}

/**
 * Creates ANSI cross-hatching pattern wireframe lines
 */
export function create3DCrossHatch(w = 60, h = 40, yPos = 35.1, pitch = 5, angleDeg = 45, options = {}) {
  const group = new THREE.Group();
  group.name = options.name || `Drafting_CrossHatch_${Date.now()}`;
  const color = options.color || 0x0284c7;

  const lines = [];
  const hw = w / 2;
  const hh = h / 2;
  const count = Math.ceil((w + h) / pitch);

  for (let i = -count; i <= count; i++) {
    const offset = i * pitch;
    const x1 = Math.max(-hw, Math.min(hw, offset - hh));
    const z1 = Math.max(-hh, Math.min(hh, -offset + hw));
    const x2 = Math.max(-hw, Math.min(hw, offset + hh));
    const z2 = Math.max(-hh, Math.min(hh, offset - hw));

    lines.push(new THREE.Vector3(x1, yPos, z1));
    lines.push(new THREE.Vector3(x2, yPos, z2));
  }

  // Boundary rectangle
  lines.push(new THREE.Vector3(-hw, yPos, -hh), new THREE.Vector3(hw, yPos, -hh));
  lines.push(new THREE.Vector3(hw, yPos, -hh), new THREE.Vector3(hw, yPos, hh));
  lines.push(new THREE.Vector3(hw, yPos, hh), new THREE.Vector3(-hw, yPos, hh));
  lines.push(new THREE.Vector3(-hw, yPos, hh), new THREE.Vector3(-hw, yPos, -hh));

  const geo = new THREE.BufferGeometry().setFromPoints(lines);
  const mat = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, opacity: 0.85, transparent: true }));
  group.add(mat);

  group.userData = {
    type: 'drafting_cross_hatch',
    level: 100,
    width: w,
    height: h,
    pitch,
    angleDeg
  };
  return group;
}

/**
 * Creates CAD extension witness lines with standard standoff gap
 */
export function create3DWitnessLine(p1, p2, offset = 12, options = {}) {
  const group = new THREE.Group();
  group.name = options.name || `Drafting_WitnessLine_${Date.now()}`;
  const v1 = new THREE.Vector3(...p1);
  const v2 = new THREE.Vector3(...p2);
  const color = options.color || 0x64748b;

  const w1End = new THREE.Vector3(v1.x, v1.y + offset, v1.z);
  const w2End = new THREE.Vector3(v2.x, v2.y + offset, v2.z);

  const geo = new THREE.BufferGeometry().setFromPoints([
    v1, w1End,
    v2, w2End
  ]);
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, linewidth: 1.2 }));
  group.add(lines);

  group.userData = {
    type: 'drafting_witness_line',
    level: 100,
    p1,
    p2,
    offset
  };
  return group;
}

/**
 * Explodes composite drafting dimensions into editable wireframe vector lines
 */
export function explodeDimensionToLines(dimensionGroup) {
  if (!dimensionGroup) return null;
  const explodedGroup = new THREE.Group();
  explodedGroup.name = `${dimensionGroup.name}_Exploded_Wireframe`;

  dimensionGroup.traverse((child) => {
    if (child.isLine || child.isLineSegments) {
      explodedGroup.add(child.clone());
    }
  });

  explodedGroup.userData = {
    type: 'wireframe_exploded',
    originalType: dimensionGroup.userData?.type || 'dimension',
    level: 100
  };
  return explodedGroup;
}

/**
 * Projects wireframe geometry or solid model onto a reference plane (XY, XZ, YZ)
 */
export function projectGeometryOntoPlane(entity, plane = 'XY', targetHeight = 0) {
  if (!entity) return null;
  const projected = entity.clone();
  projected.name = `${entity.name || 'Entity'}_Projected_${plane}`;

  projected.traverse((child) => {
    if (child.isMesh || child.isLine || child.isLineSegments) {
      if (child.geometry) {
        child.geometry = child.geometry.clone();
        const pos = child.geometry.attributes.position;
        if (pos) {
          for (let i = 0; i < pos.count; i++) {
            if (plane === 'XZ' || plane === 'G18') {
              pos.setY(i, targetHeight);
            } else if (plane === 'YZ' || plane === 'G19') {
              pos.setX(i, targetHeight);
            } else {
              // XY / G17 plane
              pos.setZ(i, targetHeight);
            }
          }
          pos.needsUpdate = true;
          child.geometry.computeVertexNormals();
        }
      }
    }
  });

  projected.userData = {
    type: 'transform_projected',
    plane,
    targetHeight
  };
  return projected;
}

/**
 * Rolls / wraps planar wireframe geometry around a cylindrical rotary surface (4th Axis / Rotary CAM)
 */
export function rollGeometryAroundCylinder(entity, cylinderRadius = 25, axis = 'y') {
  if (!entity) return null;
  const rolled = entity.clone();
  rolled.name = `${entity.name || 'Entity'}_Rolled_R${cylinderRadius}`;

  rolled.traverse((child) => {
    if (child.isMesh || child.isLine || child.isLineSegments) {
      if (child.geometry) {
        child.geometry = child.geometry.clone();
        const pos = child.geometry.attributes.position;
        if (pos) {
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const z = pos.getZ(i);

            // Wrap flat X around cylinder circumference
            const theta = x / cylinderRadius;
            const newX = Math.cos(theta) * cylinderRadius;
            const newZ = Math.sin(theta) * cylinderRadius;

            pos.setX(i, newX);
            pos.setZ(i, newZ);
            pos.setY(i, y);
          }
          pos.needsUpdate = true;
          child.geometry.computeVertexNormals();
        }
      }
    }
  });

  rolled.userData = {
    type: 'transform_rolled',
    cylinderRadius,
    axis
  };
  return rolled;
}

/**
 * Offsets a wireframe entity by perpendicular distance
 */
export function offsetEntityWireframe(entity, distance = 5, side = 'left') {
  if (!entity) return null;
  const offsetEnt = entity.clone();
  offsetEnt.name = `${entity.name || 'Entity'}_Offset_${distance}mm`;

  const mult = side === 'left' ? 1 : -1;
  offsetEnt.position.x += distance * mult;
  offsetEnt.position.z += distance * mult * 0.5;

  offsetEnt.userData = {
    type: 'transform_offset',
    distance,
    side
  };
  return offsetEnt;
}

/**
 * Distributes multiple entities evenly across a span along a specified axis
 */
export function distributeEntitiesEvenly(entities = [], totalSpan = 150, axis = 'x') {
  if (!entities || entities.length < 2) return false;
  const count = entities.length;
  const step = totalSpan / (count - 1);
  const start = -totalSpan / 2;

  entities.forEach((ent, idx) => {
    if (ent) {
      const pos = start + idx * step;
      if (axis === 'x') ent.position.x = pos;
      else if (axis === 'y') ent.position.y = pos;
      else ent.position.z = pos;
    }
  });
  return true;
}

/**
 * Stretches geometry by a directional displacement vector
 */
export function stretchGeometryByVector(entity, delta = { x: 10, y: 0, z: 0 }, thresholdX = 0) {
  if (!entity) return null;
  const stretched = entity.clone();
  stretched.name = `${entity.name || 'Entity'}_Stretched`;

  stretched.traverse((child) => {
    if (child.isMesh || child.isLine || child.isLineSegments) {
      if (child.geometry) {
        child.geometry = child.geometry.clone();
        const pos = child.geometry.attributes.position;
        if (pos) {
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            if (x >= thresholdX) {
              pos.setX(i, x + (delta.x || 0));
              pos.setY(i, pos.getY(i) + (delta.y || 0));
              pos.setZ(i, pos.getZ(i) + (delta.z || 0));
            }
          }
          pos.needsUpdate = true;
          child.geometry.computeVertexNormals();
        }
      }
    }
  });

  stretched.userData = {
    type: 'transform_stretched',
    delta
  };
  return stretched;
}

/**
 * Re-export Native STEP (ISO 10303-21) and IGES B-Rep solid model parsers and exporters
 */
export {
  parseSTEPFile,
  parseSTEPText,
  parseIGESFile,
  parseIGESText,
  generateSampleSTEPString,
  generateSTEPFromObject3D,
  exportSceneToSTEP
} from './stepIgesParser.js';
