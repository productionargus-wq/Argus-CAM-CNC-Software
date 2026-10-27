import * as THREE from 'three';

/**
 * Industrial CPlanes & Construction Coordinate System Engine
 * Supports Top (G17), Front (G18), Right (G19), Compound 5-Axis Angled Planes,
 * and Arbitrary User Construction Planes defined by 3 Points, Normals, or Euler Rotations.
 */

export const DEFAULT_PLANES = [
  {
    id: 'plane_top',
    name: 'Top (G17)',
    code: 'G17',
    desc: 'XY Table Horizontal, Spindle vertical along Z+',
    wcsCode: 'G54',
    origin: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: 1, z: 0 },
    uAxis: { x: 1, y: 0, z: 0 },
    vAxis: { x: 0, y: 0, z: -1 },
    isStandard: true,
    isWCS: true,
    isCPlane: true,
    isTPlane: true
  },
  {
    id: 'plane_front',
    name: 'Front (G18)',
    code: 'G18',
    desc: 'XZ Vertical Face, Spindle normal along Y+',
    wcsCode: 'G54',
    origin: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: 0, z: 1 },
    uAxis: { x: 1, y: 0, z: 0 },
    vAxis: { x: 0, y: 1, z: 0 },
    isStandard: true,
    isWCS: false,
    isCPlane: false,
    isTPlane: false
  },
  {
    id: 'plane_right',
    name: 'Right (G19)',
    code: 'G19',
    desc: 'YZ Side Flank, Spindle normal along X+',
    wcsCode: 'G54',
    origin: { x: 0, y: 0, z: 0 },
    normal: { x: 1, y: 0, z: 0 },
    uAxis: { x: 0, y: 0, z: 1 },
    vAxis: { x: 0, y: 1, z: 0 },
    isStandard: true,
    isWCS: false,
    isCPlane: false,
    isTPlane: false
  },
  {
    id: 'plane_bottom',
    name: 'Bottom (G17-B)',
    code: 'G17-B',
    desc: 'Inverted Sub-Spindle Second Op reference',
    wcsCode: 'G55',
    origin: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: -1, z: 0 },
    uAxis: { x: 1, y: 0, z: 0 },
    vAxis: { x: 0, y: 0, z: 1 },
    isStandard: true,
    isWCS: false,
    isCPlane: false,
    isTPlane: false
  },
  {
    id: 'plane_iso',
    name: 'Isometric (WCS G54)',
    code: 'G54',
    desc: '3D Compound Isometric Reference',
    wcsCode: 'G54',
    origin: { x: 0, y: 0, z: 0 },
    normal: { x: 0.577, y: 0.577, z: 0.577 },
    uAxis: { x: 0.707, y: -0.707, z: 0 },
    vAxis: { x: -0.408, y: -0.408, z: 0.816 },
    isStandard: true,
    isWCS: false,
    isCPlane: false,
    isTPlane: false
  },
  {
    id: 'plane_b45_c90',
    name: '5-Axis B45 C90 Tilted',
    code: '5X-B45',
    desc: 'Trunnion Table B=45° tilt, C=90° rotary compound plane',
    wcsCode: 'G56',
    origin: { x: 0, y: 25, z: 0 },
    normal: { x: 0.707, y: 0.707, z: 0 },
    uAxis: { x: 0, y: 0, z: 1 },
    vAxis: { x: -0.707, y: 0.707, z: 0 },
    isStandard: false,
    isWCS: false,
    isCPlane: false,
    isTPlane: false
  }
];

/**
 * Creates a custom CPlane from 3 points (P0 Origin, P1 along X-axis, P2 defining XY-plane)
 */
export function createCPlaneFrom3Points({
  name,
  code = 'USER',
  wcsCode = 'G54',
  p0 = { x: 0, y: 0, z: 0 },
  p1 = { x: 100, y: 0, z: 0 },
  p2 = { x: 0, y: 100, z: 0 }
}) {
  const vP0 = new THREE.Vector3(p0.x, p0.y, p0.z);
  const vP1 = new THREE.Vector3(p1.x, p1.y, p1.z);
  const vP2 = new THREE.Vector3(p2.x, p2.y, p2.z);

  // U axis = normalized(P1 - P0)
  const u = new THREE.Vector3().subVectors(vP1, vP0).normalize();
  if (u.lengthSq() < 0.0001) u.set(1, 0, 0);

  // Temp vector = P2 - P0
  const temp = new THREE.Vector3().subVectors(vP2, vP0).normalize();

  // Normal W = u x temp
  const normal = new THREE.Vector3().crossVectors(u, temp).normalize();
  if (normal.lengthSq() < 0.0001) normal.set(0, 1, 0);

  // V axis = normal x u (orthonormal)
  const v = new THREE.Vector3().crossVectors(normal, u).normalize();

  return {
    id: `cplane_${Date.now()}`,
    name: name || `CPlane_3Pt_${code}`,
    code,
    desc: `User Plane via 3 Points: [${p0.x},${p0.y},${p0.z}]`,
    wcsCode,
    origin: { x: vP0.x, y: vP0.y, z: vP0.z },
    normal: { x: normal.x, y: normal.y, z: normal.z },
    uAxis: { x: u.x, y: u.y, z: u.z },
    vAxis: { x: v.x, y: v.y, z: v.z },
    isStandard: false,
    isWCS: false,
    isCPlane: true,
    isTPlane: true
  };
}

/**
 * Creates a custom CPlane from Euler rotation angles (degrees) and an origin offset.
 */
export function createCPlaneFromAngles({
  name,
  code = 'ANGLED',
  wcsCode = 'G54',
  origin = { x: 0, y: 0, z: 0 },
  rotX = 0,
  rotY = 0,
  rotZ = 0
}) {
  const radX = (rotX * Math.PI) / 180;
  const radY = (rotY * Math.PI) / 180;
  const radZ = (rotZ * Math.PI) / 180;

  const euler = new THREE.Euler(radX, radY, radZ, 'XYZ');
  const matrix = new THREE.Matrix4().makeRotationFromEuler(euler);

  const u = new THREE.Vector3(1, 0, 0).applyMatrix4(matrix).normalize();
  const normal = new THREE.Vector3(0, 1, 0).applyMatrix4(matrix).normalize();
  const v = new THREE.Vector3(0, 0, -1).applyMatrix4(matrix).normalize();

  return {
    id: `cplane_${Date.now()}`,
    name: name || `Plane_Rot_X${rotX}_Y${rotY}_Z${rotZ}`,
    code,
    desc: `Euler Rot: X${rotX}° Y${rotY}° Z${rotZ}°`,
    wcsCode,
    origin: { x: origin.x, y: origin.y, z: origin.z },
    normal: { x: normal.x, y: normal.y, z: normal.z },
    uAxis: { x: u.x, y: u.y, z: u.z },
    vAxis: { x: v.x, y: v.y, z: v.z },
    isStandard: false,
    isWCS: false,
    isCPlane: true,
    isTPlane: true
  };
}

/**
 * Computes a 4x4 Transformation Matrix from a CPlane definition
 */
export function getCPlaneMatrix(plane) {
  const origin = new THREE.Vector3(plane.origin.x, plane.origin.y, plane.origin.z);
  const u = new THREE.Vector3(plane.uAxis.x, plane.uAxis.y, plane.uAxis.z).normalize();
  const v = new THREE.Vector3(plane.vAxis.x, plane.vAxis.y, plane.vAxis.z).normalize();
  const n = new THREE.Vector3(plane.normal.x, plane.normal.y, plane.normal.z).normalize();

  const mat = new THREE.Matrix4();
  mat.makeBasis(u, n, v.clone().negate());
  mat.setPosition(origin);
  return mat;
}

/**
 * Transforms a 2D sketch point (u, v) on the CPlane into a 3D World point (x, y, z)
 */
export function projectCPlaneToWorld(uCoord, vCoord, plane) {
  const origin = new THREE.Vector3(plane.origin.x, plane.origin.y, plane.origin.z);
  const uVec = new THREE.Vector3(plane.uAxis.x, plane.uAxis.y, plane.uAxis.z).normalize();
  const vVec = new THREE.Vector3(plane.vAxis.x, plane.vAxis.y, plane.vAxis.z).normalize();

  return origin
    .clone()
    .addScaledVector(uVec, uCoord)
    .addScaledVector(vVec, vCoord);
}

/**
 * Builds an oriented Three.js Group containing a local CPlane grid and 3D coordinate triad (X_p Red, Y_p Green, Z_p Blue)
 */
export function buildCPlaneHelperGroup(plane, size = 260, isLight = false) {
  const group = new THREE.Group();
  group.name = `CPlane_Helper_${plane.id}`;

  const origin = new THREE.Vector3(plane.origin.x, plane.origin.y, plane.origin.z);
  const u = new THREE.Vector3(plane.uAxis.x, plane.uAxis.y, plane.uAxis.z).normalize();
  const v = new THREE.Vector3(plane.vAxis.x, plane.vAxis.y, plane.vAxis.z).normalize();
  const n = new THREE.Vector3(plane.normal.x, plane.normal.y, plane.normal.z).normalize();

  // 1. Oriented Grid (adapts subline contrast to light vs dark theme)
  const subGridColor = isLight ? 0x94a3b8 : 0x1e293b;
  const gridHelper = new THREE.GridHelper(size, 26, 0x0284c7, subGridColor);
  gridHelper.position.set(0, 0, 0);

  // Align grid (default XZ plane in Three.js) with CPlane (U and V axes)
  const rotMatrix = new THREE.Matrix4();
  rotMatrix.makeBasis(u, n, v.clone().negate());
  gridHelper.quaternion.setFromRotationMatrix(rotMatrix);
  gridHelper.position.copy(origin);
  group.add(gridHelper);

  // 2. Local Coordinate Triad Arrows at Plane Origin
  const arrowLen = 35;
  const headLen = 6;
  const headWidth = 3;

  // Xp (U axis - Red)
  const xArrow = new THREE.ArrowHelper(u, origin, arrowLen, 0xef4444, headLen, headWidth);
  group.add(xArrow);

  // Normal N (Z_spindle axis - Blue)
  const zArrow = new THREE.ArrowHelper(n, origin, arrowLen, 0x38bdf8, headLen, headWidth);
  group.add(zArrow);

  // Yp (V axis - Green)
  const yArrow = new THREE.ArrowHelper(v, origin, arrowLen, 0x10b981, headLen, headWidth);
  group.add(yArrow);

  // 3. Glowing Origin Datum Sphere
  const sphereGeo = new THREE.SphereGeometry(2.5, 16, 16);
  const sphereMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.position.copy(origin);
  group.add(sphere);

  return group;
}

