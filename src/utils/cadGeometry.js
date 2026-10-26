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
export function createBoxGeometry(w = 80, h = 35, d = 60, name = "Rectangular_Billet") {
  const group = new THREE.Group();
  group.name = name;

  const mat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    metalness: 0.75,
    roughness: 0.25
  });

  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = h / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  return group;
}

/**
 * Creates a parametric 3D cylinder solid blank
 */
export function createCylinderGeometry(radius = 35, height = 45, name = "Cylindrical_Blank") {
  const group = new THREE.Group();
  group.name = name;

  const mat = new THREE.MeshStandardMaterial({
    color: 0x60a5fa,
    metalness: 0.8,
    roughness: 0.25
  });

  const geo = new THREE.CylinderGeometry(radius, radius, height, 48);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = height / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

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
 * Creates a 3D planar surface sheet
 */
export function createPlanarSurface(w = 80, d = 60) {
  const geo = new THREE.PlaneGeometry(w, d, 8, 8);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    metalness: 0.4,
    roughness: 0.3,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 25;
  mesh.name = "CAD_Planar_Surface";
  return mesh;
}

/**
 * Creates a 3D cylindrical surface sleeve
 */
export function createCylinderSurface(radius = 35, height = 45) {
  const geo = new THREE.CylinderGeometry(radius, radius, height, 32, 4, true);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    metalness: 0.5,
    roughness: 0.3,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = height / 2;
  mesh.name = "CAD_Cylinder_Surface";
  return mesh;
}

/**
 * Creates a 3D wireframe bounding box cage
 */
export function createBoundingWireframe(bounds) {
  const min = bounds.min;
  const max = bounds.max;
  const w = max.x - min.x;
  const h = max.y - min.y;
  const d = max.z - min.z;

  const boxGeo = new THREE.BoxGeometry(w, h, d);
  const edges = new THREE.EdgesGeometry(boxGeo);
  const mat = new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 2 });
  const line = new THREE.LineSegments(edges, mat);
  line.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
  line.name = "Wireframe_Bounding_Cage";
  return line;
}

/**
 * Creates a 3D wireframe guide circle
 */
export function createWireframeCircle(radius = 35, y = 30) {
  const points = [];
  const segments = 64;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
  const line = new THREE.Line(geo, mat);
  line.name = "Wireframe_Circle";
  return line;
}

/**
 * Creates a 3D wireframe boundary rectangle
 */
export function createWireframeRect(w = 80, d = 60, y = 35) {
  const points = [
    new THREE.Vector3(-w / 2, y, -d / 2),
    new THREE.Vector3(w / 2, y, -d / 2),
    new THREE.Vector3(w / 2, y, d / 2),
    new THREE.Vector3(-w / 2, y, d / 2),
    new THREE.Vector3(-w / 2, y, -d / 2),
  ];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: 0x4ade80, linewidth: 2 });
  const line = new THREE.Line(geo, mat);
  line.name = "Wireframe_Rectangle";
  return line;
}

/**
 * Creates a 3D line between two endpoints
 */
export function createWireframeLine(p1 = [-40, 35, 0], p2 = [40, 35, 0]) {
  const points = [
    new THREE.Vector3(...p1),
    new THREE.Vector3(...p2)
  ];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: 0xf43f5e, linewidth: 2 });
  const line = new THREE.Line(geo, mat);
  line.name = "Wireframe_Line";
  return line;
}

/**
 * Creates a 4-point drill coordinate grid
 */
export function createDrillPointsGrid(bounds) {
  const min = bounds.min;
  const max = bounds.max;
  const group = new THREE.Group();
  group.name = "Drill_Points_Group";

  const cornerOffset = 8;
  const pts = [
    [min.x + cornerOffset, max.y, min.z + cornerOffset],
    [max.x - cornerOffset, max.y, min.z + cornerOffset],
    [max.x - cornerOffset, max.y, max.z - cornerOffset],
    [min.x + cornerOffset, max.y, max.z - cornerOffset],
  ];

  const dotGeo = new THREE.SphereGeometry(1.5, 16, 16);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  pts.forEach(([x, y, z]) => {
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(x, y, z);
    group.add(dot);
  });

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
