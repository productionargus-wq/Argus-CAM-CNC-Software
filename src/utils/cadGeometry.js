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
  line.userData = { type: arcType.toLowerCase(), radius, plane, center: [cx, y, cz] };
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
  line.userData = { type: 'rectangle', width: w, depth: d, filletRadius: r, center: [cx, y, cz] };
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
  line.userData = { type: 'line', p1, p2, length: Number(length) };
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
