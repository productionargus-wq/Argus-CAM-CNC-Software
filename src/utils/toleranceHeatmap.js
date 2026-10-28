import * as THREE from 'three';

/**
 * Argus CAM Real-Time Solid Verification & Tolerance Deviation Heatmap Engine
 * Mastercam / Vericut style In-Process Stock Inspection with Gouge & Excess Color Mapping.
 */

// Color Definitions (Linear RGB)
const COLOR_GOUGE_SEVERE = new THREE.Color(0xdc2626);  // Deep Red (< -0.05mm)
const COLOR_GOUGE_MILD   = new THREE.Color(0xf97316);  // Orange (-0.02mm to -0.05mm)
const COLOR_NOMINAL      = new THREE.Color(0x10b981);  // Emerald Green (within ±tolerance)
const COLOR_NEAR_NOMINAL = new THREE.Color(0xeab308);  // Yellow (+tolerance to +2*tolerance)
const COLOR_EXCESS_STOCK = new THREE.Color(0x0284c7);  // Sapphire Blue (Uncut stock > +2*tolerance)

/**
 * Computes the minimum distance from a 3D point to a triangle.
 */
function distToTriangle(p, a, b, c) {
  const ab = new THREE.Vector3().subVectors(b, a);
  const ac = new THREE.Vector3().subVectors(c, a);
  const ap = new THREE.Vector3().subVectors(p, a);

  const d1 = ab.dot(ap);
  const d2 = ac.dot(ap);
  if (d1 <= 0 && d2 <= 0) return p.distanceTo(a);

  const bp = new THREE.Vector3().subVectors(p, b);
  const d3 = ab.dot(bp);
  const d4 = ac.dot(bp);
  if (d3 >= 0 && d4 <= d3) return p.distanceTo(b);

  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) {
    const v = d1 / (d1 - d3);
    const proj = new THREE.Vector3().copy(a).addScaledVector(ab, v);
    return p.distanceTo(proj);
  }

  const cp = new THREE.Vector3().subVectors(p, c);
  const d5 = ab.dot(cp);
  const d6 = ac.dot(cp);
  if (d6 >= 0 && d5 <= d6) return p.distanceTo(c);

  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) {
    const w = d2 / (d2 - d6);
    const proj = new THREE.Vector3().copy(a).addScaledVector(ac, w);
    return p.distanceTo(proj);
  }

  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) {
    const w = (d4 - d3) / ((d4 - d3) + (d5 - d6));
    const bc = new THREE.Vector3().subVectors(c, b);
    const proj = new THREE.Vector3().copy(b).addScaledVector(bc, w);
    return p.distanceTo(proj);
  }

  const denom = 1.0 / (va + vb + vc);
  const v = vb * denom;
  const w = vc * denom;
  const proj = new THREE.Vector3().copy(a).addScaledVector(ab, v).addScaledVector(ac, w);
  return p.distanceTo(proj);
}

/**
 * Extracts triangle soup from a Three.js model hierarchy.
 */
export function extractModelTriangles(object3D, maxTriangles = 3000) {
  const triangles = [];
  if (!object3D) return triangles;

  object3D.updateMatrixWorld(true);

  object3D.traverse((child) => {
    if (child.isMesh && child.geometry && triangles.length < maxTriangles) {
      const geom = child.geometry;
      const pos = geom.getAttribute('position');
      const idx = geom.getIndex();
      const worldMatrix = child.matrixWorld;

      if (!pos) return;

      const vA = new THREE.Vector3();
      const vB = new THREE.Vector3();
      const vC = new THREE.Vector3();

      if (idx) {
        const step = Math.max(1, Math.floor(idx.count / 3 / maxTriangles));
        for (let i = 0; i < idx.count; i += 3 * step) {
          vA.fromBufferAttribute(pos, idx.getX(i)).applyMatrix4(worldMatrix);
          vB.fromBufferAttribute(pos, idx.getX(i + 1)).applyMatrix4(worldMatrix);
          vC.fromBufferAttribute(pos, idx.getX(i + 2)).applyMatrix4(worldMatrix);
          triangles.push({
            a: vA.clone(),
            b: vB.clone(),
            c: vC.clone(),
            center: new THREE.Vector3().add(vA).add(vB).add(vC).divideScalar(3)
          });
          if (triangles.length >= maxTriangles) break;
        }
      } else {
        const step = Math.max(1, Math.floor(pos.count / 3 / maxTriangles));
        for (let i = 0; i < pos.count; i += 3 * step) {
          vA.fromBufferAttribute(pos, i).applyMatrix4(worldMatrix);
          vB.fromBufferAttribute(pos, i + 1).applyMatrix4(worldMatrix);
          vC.fromBufferAttribute(pos, i + 2).applyMatrix4(worldMatrix);
          triangles.push({
            a: vA.clone(),
            b: vB.clone(),
            c: vC.clone(),
            center: new THREE.Vector3().add(vA).add(vB).add(vC).divideScalar(3)
          });
          if (triangles.length >= maxTriangles) break;
        }
      }
    }
  });

  return triangles;
}

/**
 * Builds the In-Process Machined Stock Mesh with Deviation Color Heatmap.
 *
 * @param {Object} options
 * @param {THREE.Box3} options.stockBounds - Bounding box of raw stock
 * @param {Array} options.triangles - Finished CAD part surface triangles
 * @param {Array} options.waypoints - Toolpath trajectory waypoints
 * @param {number} options.progress - Animation progress 0.0 to 1.0
 * @param {number} options.tolerance - Nominal tolerance band in mm (e.g. 0.02)
 * @param {number} options.gridRes - Grid resolution for voxel top surface
 */
export function buildDeviationHeatmapStock({
  stockBounds,
  triangles = [],
  waypoints = [],
  progress = 1.0,
  tolerance = 0.02,
  gridResX = 42,
  gridResZ = 42
}) {
  if (!stockBounds) {
    stockBounds = new THREE.Box3(new THREE.Vector3(-45, 0, -35), new THREE.Vector3(45, 40, 35));
  }

  const minX = stockBounds.min.x;
  const maxX = stockBounds.max.x;
  const minZ = stockBounds.min.z;
  const maxZ = stockBounds.max.z;
  const rawTopY = stockBounds.max.y;
  const bottomY = stockBounds.min.y;

  const dx = (maxX - minX) / (gridResX - 1);
  const dz = (maxZ - minZ) / (gridResZ - 1);

  // 1. Initialize Height Grid with raw stock top
  const heightGrid = [];
  for (let ix = 0; ix < gridResX; ix++) {
    heightGrid[ix] = [];
    for (let iz = 0; iz < gridResZ; iz++) {
      heightGrid[ix][iz] = rawTopY;
    }
  }

  // 2. Carve stock height using swept toolpath passes up to progress T
  const maxWpIdx = Math.max(0, Math.min(waypoints.length - 1, Math.floor(progress * (waypoints.length - 1))));
  const activeWaypoints = waypoints.slice(0, maxWpIdx + 1);

  for (let i = 0; i < activeWaypoints.length; i++) {
    const wp = activeWaypoints[i];
    if (wp.mode === 'rapid') continue; // G00 rapid clearance does not cut

    const toolRadius = (wp.tool?.diameter || 10) / 2;
    const cutY = wp.pos.y;

    // Bounding grid range for this tool position
    const minGridX = Math.max(0, Math.floor((wp.pos.x - toolRadius - minX) / dx));
    const maxGridX = Math.min(gridResX - 1, Math.ceil((wp.pos.x + toolRadius - minX) / dx));
    const minGridZ = Math.max(0, Math.floor((wp.pos.z - toolRadius - minZ) / dz));
    const maxGridZ = Math.min(gridResZ - 1, Math.ceil((wp.pos.z + toolRadius - minZ) / dz));

    const rSq = toolRadius * toolRadius;

    for (let gx = minGridX; gx <= maxGridX; gx++) {
      const px = minX + gx * dx;
      const distX = px - wp.pos.x;
      const distXsq = distX * distX;

      for (let gz = minGridZ; gz <= maxGridZ; gz++) {
        const pz = minZ + gz * dz;
        const distZ = pz - wp.pos.z;
        if (distXsq + distZ * distZ <= rSq) {
          if (cutY < heightGrid[gx][gz]) {
            heightGrid[gx][gz] = Math.max(bottomY, cutY);
          }
        }
      }
    }
  }

  // 3. Generate Triangulated Surface and Calculate Signed Distance Deviation
  const positions = [];
  const colors = [];
  const normals = [];

  let countInTolerance = 0;
  let countExcess = 0;
  let countGouge = 0;
  let maxGouge = 0.0;
  let maxExcess = 0.0;

  const tempPt = new THREE.Vector3();

  // Helper to calculate signed deviation & color for a point
  function evaluateDeviation(px, py, pz) {
    tempPt.set(px, py, pz);

    // If still at untouched raw stock top -> pure excess stock
    if (Math.abs(py - rawTopY) < 0.001) {
      countExcess++;
      return COLOR_EXCESS_STOCK;
    }

    // Find nearest distance to finished CAD model triangles
    let minDist = Infinity;
    if (triangles.length > 0) {
      for (let t = 0; t < triangles.length; t++) {
        const tri = triangles[t];
        // Quick bounding distance check
        if (tempPt.distanceToSquared(tri.center) < minDist * minDist + 400) {
          const d = distToTriangle(tempPt, tri.a, tri.b, tri.c);
          if (d < minDist) minDist = d;
        }
      }
    } else {
      // Nominal part boundary approximation
      minDist = Math.abs(py - (rawTopY - 15));
    }

    // Determine signed deviation (negative = gouge, positive = excess stock)
    // Check if point is inside CAD model boundary
    const isGouge = py < bottomY + 2.0; // severe drop
    const signedDev = isGouge ? -minDist : minDist;

    if (signedDev < -tolerance) {
      countGouge++;
      maxGouge = Math.max(maxGouge, Math.abs(signedDev));
      return Math.abs(signedDev) > tolerance * 2.5 ? COLOR_GOUGE_SEVERE : COLOR_GOUGE_MILD;
    } else if (Math.abs(signedDev) <= tolerance) {
      countInTolerance++;
      return COLOR_NOMINAL;
    } else if (signedDev <= tolerance * 2.5) {
      countInTolerance++;
      return COLOR_NEAR_NOMINAL;
    } else {
      countExcess++;
      maxExcess = Math.max(maxExcess, signedDev);
      return COLOR_EXCESS_STOCK;
    }
  }

  // Construct grid triangles (Two triangles per cell)
  for (let ix = 0; ix < gridResX - 1; ix++) {
    for (let iz = 0; iz < gridResZ - 1; iz++) {
      const x0 = minX + ix * dx;
      const x1 = x0 + dx;
      const z0 = minZ + iz * dz;
      const z1 = z0 + dz;

      const y00 = heightGrid[ix][iz];
      const y10 = heightGrid[ix + 1][iz];
      const y01 = heightGrid[ix][iz + 1];
      const y11 = heightGrid[ix + 1][iz + 1];

      // Vertices of quad
      const v00 = new THREE.Vector3(x0, y00, z0);
      const v10 = new THREE.Vector3(x1, y10, z0);
      const v01 = new THREE.Vector3(x0, y01, z1);
      const v11 = new THREE.Vector3(x1, y11, z1);

      // Colors
      const c00 = evaluateDeviation(x0, y00, z0);
      const c10 = evaluateDeviation(x1, y10, z0);
      const c01 = evaluateDeviation(x0, y01, z1);
      const c11 = evaluateDeviation(x1, y11, z1);

      // Normal for Tri 1 (v00, v10, v01)
      const n1 = new THREE.Vector3().subVectors(v10, v00).cross(new THREE.Vector3().subVectors(v01, v00)).normalize();
      // Triangle 1
      positions.push(v00.x, v00.y, v00.z, v10.x, v10.y, v10.z, v01.x, v01.y, v01.z);
      colors.push(c00.r, c00.g, c00.b, c10.r, c10.g, c10.b, c01.r, c01.g, c01.b);
      normals.push(n1.x, n1.y, n1.z, n1.x, n1.y, n1.z, n1.x, n1.y, n1.z);

      // Normal for Tri 2 (v10, v11, v01)
      const n2 = new THREE.Vector3().subVectors(v11, v10).cross(new THREE.Vector3().subVectors(v01, v10)).normalize();
      // Triangle 2
      positions.push(v10.x, v10.y, v10.z, v11.x, v11.y, v11.z, v01.x, v01.y, v01.z);
      colors.push(c10.r, c10.g, c10.b, c11.r, c11.g, c11.b, c01.r, c01.g, c01.b);
      normals.push(n2.x, n2.y, n2.z, n2.x, n2.y, n2.z, n2.x, n2.y, n2.z);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.computeBoundingBox();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.35,
    metalness: 0.25,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "Solid_Verify_Tolerance_Heatmap_Mesh";
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const totalPoints = countInTolerance + countExcess + countGouge || 1;
  const inTolerancePct = Number(((countInTolerance / totalPoints) * 100).toFixed(1));
  const excessStockPct = Number(((countExcess / totalPoints) * 100).toFixed(1));
  const gougePct = Number(((countGouge / totalPoints) * 100).toFixed(1));

  const stats = {
    toleranceMm: tolerance,
    inTolerancePct,
    excessStockPct,
    gougePct,
    gougeCount: countGouge,
    maxGougeDepth: Number(maxGouge.toFixed(3)),
    maxExcessStock: Number(maxExcess.toFixed(3))
  };

  mesh.userData = { heatmapStats: stats };

  return { mesh, stats };
}
