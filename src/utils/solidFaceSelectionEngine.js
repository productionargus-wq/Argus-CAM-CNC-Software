import * as THREE from 'three';

const FACE_SEGMENT_CACHE = new WeakMap();

const RAD2DEG = 180 / Math.PI;

function quantizeCoord(v) {
  return Math.round(v * 1000);
}

function quantizeVertexKey(x, y, z) {
  return `${quantizeCoord(x)},${quantizeCoord(y)},${quantizeCoord(z)}`;
}

function makeEdgeKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Fits a 2D circle (center u, v and radius R) to 2D points using algebraic least-squares (Kasa fit).
 */
function fitCircle2D(pts2D) {
  const n = pts2D.length;
  if (n < 3) return null;

  let meanU = 0;
  let meanV = 0;
  for (let i = 0; i < n; i++) {
    meanU += pts2D[i].u;
    meanV += pts2D[i].v;
  }
  meanU /= n;
  meanV /= n;

  let suu = 0;
  let suv = 0;
  let svv = 0;
  let suuu = 0;
  let svvv = 0;
  let suvv = 0;
  let svuu = 0;

  for (let i = 0; i < n; i++) {
    const u = pts2D[i].u - meanU;
    const v = pts2D[i].v - meanV;
    const uu = u * u;
    const vv = v * v;
    suu += uu;
    svv += vv;
    suv += u * v;
    suuu += uu * u;
    svvv += vv * v;
    suvv += u * vv;
    svuu += v * uu;
  }

  const det = suu * svv - suv * suv;
  if (Math.abs(det) < 1e-8) return null;

  const rhs1 = 0.5 * (suuu + suvv);
  const rhs2 = 0.5 * (svvv + svuu);
  const uc = (rhs1 * svv - rhs2 * suv) / det;
  const vc = (suu * rhs2 - suv * rhs1) / det;
  const radius = Math.sqrt(Math.max(0, uc * uc + vc * vc + (suu + svv) / n));

  if (!Number.isFinite(radius) || radius < 0.1 || radius > 10000) return null;

  const cu = uc + meanU;
  const cv = vc + meanV;
  let sqErr = 0;
  for (let i = 0; i < n; i++) {
    const d = Math.hypot(pts2D[i].u - cu, pts2D[i].v - cv) - radius;
    sqErr += d * d;
  }
  const rmse = Math.sqrt(sqErr / n);

  return { cu, cv, radius, rmse };
}

/**
 * Estimates the axis of a cylindrical/fillet face patch from triangle normals (smallest eigenvector of M = sum n*n^T)
 * and builds an orthonormal frame (uAxis, vAxis, axis).
 */
function estimateCylinderFrame(normalsList) {
  if (!normalsList || normalsList.length < 2) return null;
  let m00 = 0, m01 = 0, m02 = 0, m11 = 0, m12 = 0, m22 = 0;
  for (let i = 0; i < normalsList.length; i++) {
    const n = normalsList[i];
    m00 += n.x * n.x;
    m01 += n.x * n.y;
    m02 += n.x * n.z;
    m11 += n.y * n.y;
    m12 += n.y * n.z;
    m22 += n.z * n.z;
  }

  // Test principal cardinal axes first + inverse-power iteration for arbitrary orientation
  const candidates = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 1)
  ];
  let bestAxis = candidates[1];
  let bestVar = Infinity;

  for (const c of candidates) {
    const v =
      c.x * (m00 * c.x + m01 * c.y + m02 * c.z) +
      c.y * (m01 * c.x + m11 * c.y + m12 * c.z) +
      c.z * (m02 * c.x + m12 * c.y + m22 * c.z);
    if (v < bestVar) {
      bestVar = v;
      bestAxis = c.clone();
    }
  }

  // If no cardinal axis aligns well, find smallest-eigenvalue vector via cross products of diverse normals
  if (bestVar / normalsList.length > 0.08) {
    let maxCross = 0;
    const n0 = normalsList[0];
    for (let i = 1; i < normalsList.length; i++) {
      const cr = new THREE.Vector3().crossVectors(n0, normalsList[i]);
      const lenSq = cr.lengthSq();
      if (lenSq > maxCross) {
        maxCross = lenSq;
        bestAxis = cr.normalize();
      }
    }
  }

  const axis = bestAxis.clone().normalize();
  const ref = Math.abs(axis.x) < 0.85 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const uAxis = new THREE.Vector3().crossVectors(ref, axis).normalize();
  const vAxis = new THREE.Vector3().crossVectors(axis, uAxis).normalize();
  return { axis, uAxis, vAxis };
}

/**
 * Extracts raw triangle data and builds an edge-adjacency graph for a single THREE.Mesh
 * transformed into part-local space via relMatrix.
 */
function extractMeshTopology(mesh, relMatrix) {
  const geom = mesh.geometry;
  const posAttr = geom?.attributes?.position;
  if (!posAttr || posAttr.count < 3) return null;

  const indexAttr = geom.index;
  const triCount = indexAttr ? Math.floor(indexAttr.count / 3) : Math.floor(posAttr.count / 3);
  if (triCount <= 0) return null;

  const triangles = [];
  const vertKeyToId = new Map();
  const uniqueVerts = [];
  const edgeMap = new Map();

  const getVertId = (v) => {
    const k = quantizeVertexKey(v.x, v.y, v.z);
    let id = vertKeyToId.get(k);
    if (id === undefined) {
      id = uniqueVerts.length;
      vertKeyToId.set(k, id);
      uniqueVerts.push(v.clone());
    }
    return id;
  };

  const brepFaceMap = Array.isArray(mesh.userData?.brepFaceMap) ? mesh.userData.brepFaceMap : null;
  let brepCursor = 0;
  const resolveBrepTag = (triIdx) => {
    if (!brepFaceMap) return null;
    while (
      brepCursor < brepFaceMap.length &&
      triIdx >= brepFaceMap[brepCursor].startTri + brepFaceMap[brepCursor].triCount
    ) {
      brepCursor++;
    }
    const entry = brepFaceMap[brepCursor];
    if (entry && triIdx >= entry.startTri && triIdx < entry.startTri + entry.triCount) {
      return entry;
    }
    return null;
  };

  const e1 = new THREE.Vector3();
  const e2 = new THREE.Vector3();

  for (let t = 0; t < triCount; t++) {
    const i0 = indexAttr ? indexAttr.getX(t * 3) : t * 3;
    const i1 = indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2;

    const p0 = new THREE.Vector3(posAttr.getX(i0), posAttr.getY(i0), posAttr.getZ(i0)).applyMatrix4(relMatrix);
    const p1 = new THREE.Vector3(posAttr.getX(i1), posAttr.getY(i1), posAttr.getZ(i1)).applyMatrix4(relMatrix);
    const p2 = new THREE.Vector3(posAttr.getX(i2), posAttr.getY(i2), posAttr.getZ(i2)).applyMatrix4(relMatrix);

    e1.subVectors(p1, p0);
    e2.subVectors(p2, p0);
    const cross = new THREE.Vector3().crossVectors(e1, e2);
    const area2 = cross.length();
    if (area2 < 1e-7) {
      triangles.push(null);
      continue;
    }

    const normal = cross.divideScalar(area2);
    const area = area2 * 0.5;
    const centroid = new THREE.Vector3().add(p0).add(p1).add(p2).multiplyScalar(1 / 3);

    const vIds = [getVertId(p0), getVertId(p1), getVertId(p2)];
    const triRec = {
      triIndex: t,
      pts: [p0, p1, p2],
      vIds,
      normal,
      area,
      centroid,
      brepTag: resolveBrepTag(t),
      neighbors: []
    };
    triangles.push(triRec);

    const pairs = [
      [vIds[0], vIds[1], p0, p1],
      [vIds[1], vIds[2], p1, p2],
      [vIds[2], vIds[0], p2, p0]
    ];
    for (let k = 0; k < 3; k++) {
      const [va, vb, pa, pb] = pairs[k];
      if (va === vb) continue;
      const eKey = makeEdgeKey(va, vb);
      let list = edgeMap.get(eKey);
      if (!list) {
        list = [];
        edgeMap.set(eKey, list);
      }
      list.push({ triIndex: t, pa, pb });
    }
  }

  // Link triangle adjacency across shared edges with dihedral angle + convexity sign
  for (const [, refs] of edgeMap.entries()) {
    if (refs.length < 2) continue;
    for (let i = 0; i < refs.length; i++) {
      for (let j = i + 1; j < refs.length; j++) {
        const a = triangles[refs[i].triIndex];
        const b = triangles[refs[j].triIndex];
        if (!a || !b) continue;
        const dot = clamp(a.normal.dot(b.normal), -1, 1);
        const angleDeg = Math.acos(dot) * RAD2DEG;
        const deltaC = new THREE.Vector3().subVectors(b.centroid, a.centroid);
        // Positive convexFactor when surface bends away (convex fillet), negative when concave (hole/pocket)
        const convexSign = -deltaC.dot(a.normal);
        a.neighbors.push({
          triIndex: b.triIndex,
          angleDeg,
          convexSign,
          pa: refs[i].pa,
          pb: refs[i].pb
        });
        b.neighbors.push({
          triIndex: a.triIndex,
          angleDeg,
          convexSign: -deltaC.dot(b.normal),
          pa: refs[i].pa,
          pb: refs[i].pb
        });
      }
    }
  }

  return { triangles, edgeMap };
}

/**
 * Groups triangles of a mesh into analytical B-rep-like face patches.
 * Separates planar faces from curved fillets/cylinders cleanly even across smooth G1 tangent seams.
 */
function segmentMeshIntoRawPatches(topology, creaseThresholdDeg = 20) {
  const { triangles } = topology;
  const n = triangles.length;
  const patchOfTri = new Int32Array(n).fill(-1);
  const rawPatches = [];

  // 1. If STEP B-Rep tags exist, segment cleanly by explicit STEP ADVANCED_FACE ID first
  let hasBrep = false;
  for (let i = 0; i < n; i++) {
    if (triangles[i]?.brepTag) {
      hasBrep = true;
      break;
    }
  }

  if (hasBrep) {
    const byBrepId = new Map();
    for (let i = 0; i < n; i++) {
      const tri = triangles[i];
      if (!tri) continue;
      const key = tri.brepTag ? `step_${tri.brepTag.stepFaceId}` : `untagged_${i}`;
      let list = byBrepId.get(key);
      if (!list) {
        list = [];
        byBrepId.set(key, list);
      }
      list.push(i);
    }
    for (const [, triIndices] of byBrepId.entries()) {
      const pid = rawPatches.length;
      triIndices.forEach((ti) => {
        patchOfTri[ti] = pid;
      });
      const firstTag = triangles[triIndices[0]]?.brepTag || null;
      rawPatches.push({ pid, triIndices, brepTag: firstTag });
    }
    return { patchOfTri, rawPatches };
  }

  // 2. Grow strictly planar sub-regions first (angle <= 1.2 deg and coplanar within 0.03 mm)
  const planarClusters = [];
  const triPlanarCluster = new Int32Array(n).fill(-1);

  for (let i = 0; i < n; i++) {
    const seed = triangles[i];
    if (!seed || triPlanarCluster[i] !== -1) continue;

    const cid = planarClusters.length;
    const queue = [i];
    triPlanarCluster[i] = cid;
    const planeN = seed.normal.clone();
    const planeP = seed.pts[0];
    const memberTris = [];
    let totalArea = 0;

    while (queue.length > 0) {
      const curIdx = queue.shift();
      const cur = triangles[curIdx];
      memberTris.push(curIdx);
      totalArea += cur.area;

      for (const nb of cur.neighbors) {
        if (triPlanarCluster[nb.triIndex] !== -1) continue;
        if (nb.angleDeg > 1.25) continue;
        const nbTri = triangles[nb.triIndex];
        if (!nbTri) continue;
        const normalAngle = Math.acos(clamp(nbTri.normal.dot(planeN), -1, 1)) * RAD2DEG;
        if (normalAngle > 1.35) continue;
        const maxDist = Math.max(
          Math.abs(new THREE.Vector3().subVectors(nbTri.pts[0], planeP).dot(planeN)),
          Math.abs(new THREE.Vector3().subVectors(nbTri.pts[1], planeP).dot(planeN)),
          Math.abs(new THREE.Vector3().subVectors(nbTri.pts[2], planeP).dot(planeN))
        );
        if (maxDist > 0.035) continue;
        triPlanarCluster[nb.triIndex] = cid;
        queue.push(nb.triIndex);
      }
    }

    planarClusters.push({
      cid,
      triIndices: memberTris,
      area: totalArea
    });
  }

  // Measure whether each planar cluster is a true flat face vs a narrow curved-surface quad strip:
  // First precompute each cluster's bounding area and strip width across smooth edges.
  const clusterMeta = planarClusters.map((cl) => {
    let smoothCurvedNeighbors = 0;
    let sharpNeighbors = 0;
    let maxSmoothEdgeLen = 0;
    const smoothNorms = [];
    const neighborClusterIds = new Set();

    for (const ti of cl.triIndices) {
      const tri = triangles[ti];
      for (const nb of tri.neighbors) {
        const nbCid = triPlanarCluster[nb.triIndex];
        if (nbCid === cl.cid) continue;
        if (nb.angleDeg > creaseThresholdDeg) {
          sharpNeighbors++;
        } else if (nb.angleDeg > 1.25) {
          smoothCurvedNeighbors++;
          smoothNorms.push(triangles[nb.triIndex].normal);
          maxSmoothEdgeLen = Math.max(maxSmoothEdgeLen, nb.pa.distanceTo(nb.pb));
          if (nbCid !== -1) neighborClusterIds.add(nbCid);
        }
      }
    }

    const effectiveStripWidth = maxSmoothEdgeLen > 0.01 ? cl.area / maxSmoothEdgeLen : Infinity;
    let hasOpposingSmoothSides = false;
    if (smoothNorms.length >= 2) {
      for (let a = 0; a < smoothNorms.length; a++) {
        for (let b = a + 1; b < smoothNorms.length; b++) {
          const da = Math.acos(clamp(smoothNorms[a].dot(smoothNorms[b]), -1, 1)) * RAD2DEG;
          if (da > 2.2) {
            hasOpposingSmoothSides = true;
            break;
          }
        }
        if (hasOpposingSmoothSides) break;
      }
    }

    return {
      cl,
      smoothCurvedNeighbors,
      sharpNeighbors,
      effectiveStripWidth,
      hasOpposingSmoothSides,
      neighborClusterIds
    };
  });

  // Commit true planar faces: no smooth curved neighbors, OR wide flat face significantly wider than adjacent curved facets
  for (const meta of clusterMeta) {
    const { cl, smoothCurvedNeighbors, sharpNeighbors, effectiveStripWidth, hasOpposingSmoothSides, neighborClusterIds } = meta;
    let avgNbWidth = 0;
    let nbCount = 0;
    for (const nbCid of neighborClusterIds) {
      const nbMeta = clusterMeta[nbCid];
      if (nbMeta && Number.isFinite(nbMeta.effectiveStripWidth)) {
        avgNbWidth += nbMeta.effectiveStripWidth;
        nbCount++;
      }
    }
    const meanNbWidth = nbCount > 0 ? avgNbWidth / nbCount : 0;
    const isMuchWiderThanCurvedFacet = meanNbWidth > 0.05 && effectiveStripWidth > meanNbWidth * 1.75;

    const isTruePlanarFace =
      smoothCurvedNeighbors === 0 ||
      isMuchWiderThanCurvedFacet ||
      (!hasOpposingSmoothSides && effectiveStripWidth > 2.0) ||
      (sharpNeighbors > 0 && !hasOpposingSmoothSides && effectiveStripWidth > 1.5);

    if (!isTruePlanarFace) continue;
    const pid = rawPatches.length;
    cl.triIndices.forEach((ti) => {
      patchOfTri[ti] = pid;
    });
    rawPatches.push({ pid, triIndices: [...cl.triIndices], isLockedPlanar: true });
  }

  // 3. Merge remaining curved / fillet / cylindrical / freeform triangles across smooth edges (<= creaseThresholdDeg)
  for (let i = 0; i < n; i++) {
    const seed = triangles[i];
    if (!seed || patchOfTri[i] !== -1) continue;

    const pid = rawPatches.length;
    const queue = [i];
    patchOfTri[i] = pid;
    const triIndices = [];

    while (queue.length > 0) {
      const curIdx = queue.shift();
      const cur = triangles[curIdx];
      triIndices.push(curIdx);

      for (const nb of cur.neighbors) {
        if (patchOfTri[nb.triIndex] !== -1) continue;
        if (nb.angleDeg > creaseThresholdDeg) continue;
        patchOfTri[nb.triIndex] = pid;
        queue.push(nb.triIndex);
      }
    }

    rawPatches.push({ pid, triIndices, isLockedPlanar: false });
  }

  return { patchOfTri, rawPatches };
}

/**
 * Classifies each patch analytically and computes boundary edges, radius, tangent links, and feature clusters.
 */
function buildFacePatchesForMesh(mesh, relMatrix, bodyId, meshIdx, globalPrefix) {
  const topology = extractMeshTopology(mesh, relMatrix);
  if (!topology) return [];

  const { triangles } = topology;
  const { patchOfTri, rawPatches } = segmentMeshIntoRawPatches(topology);
  const faces = [];

  for (let p = 0; p < rawPatches.length; p++) {
    const rp = rawPatches[p];
    const triSet = new Set(rp.triIndices);
    const faceId = `${globalPrefix}_f${p}`;

    let areaMm2 = 0;
    const centroid = new THREE.Vector3();
    const avgNormal = new THREE.Vector3();
    const bounds = new THREE.Box3();
    const normalsList = [];
    const patchVertMap = new Map();
    const boundarySegments = [];
    const triPositions = [];
    const triNormals = [];

    for (const ti of rp.triIndices) {
      const tri = triangles[ti];
      if (!tri) continue;
      areaMm2 += tri.area;
      centroid.addScaledVector(tri.centroid, tri.area);
      avgNormal.addScaledVector(tri.normal, tri.area);
      normalsList.push(tri.normal);

      for (let v = 0; v < 3; v++) {
        const pt = tri.pts[v];
        bounds.expandByPoint(pt);
        triPositions.push(pt.x, pt.y, pt.z);
        triNormals.push(tri.normal.x, tri.normal.y, tri.normal.z);
        const vKey = tri.vIds[v];
        if (!patchVertMap.has(vKey)) patchVertMap.set(vKey, pt);
      }
    }

    if (areaMm2 < 1e-5) continue;
    centroid.divideScalar(areaMm2);
    if (avgNormal.lengthSq() > 1e-8) avgNormal.normalize();
    else avgNormal.set(0, 1, 0);

    // Measure normal deviation and planarity
    let maxNormalDevDeg = 0;
    for (const nrm of normalsList) {
      const dev = Math.acos(clamp(nrm.dot(avgNormal), -1, 1)) * RAD2DEG;
      if (dev > maxNormalDevDeg) maxNormalDevDeg = dev;
    }

    let maxPlaneDist = 0;
    for (const pt of patchVertMap.values()) {
      const d = Math.abs(new THREE.Vector3().subVectors(pt, centroid).dot(avgNormal));
      if (d > maxPlaneDist) maxPlaneDist = d;
    }

    // Extract boundary edge segments & neighbor patch dihedral stats
    const neighborAngles = new Map();
    const neighborConvexity = new Map();
    const patchEdges = new Set();

    for (const ti of rp.triIndices) {
      const tri = triangles[ti];
      if (!tri) continue;
      const edgePairs = [
        [tri.vIds[0], tri.vIds[1], tri.pts[0], tri.pts[1]],
        [tri.vIds[1], tri.vIds[2], tri.pts[1], tri.pts[2]],
        [tri.vIds[2], tri.vIds[0], tri.pts[2], tri.pts[0]]
      ];
      for (const [va, vb, pa, pb] of edgePairs) {
        const ek = makeEdgeKey(va, vb);
        if (patchEdges.has(ek)) continue;

        let sharedSamePatch = false;
        for (const nb of tri.neighbors) {
          const nbTri = triangles[nb.triIndex];
          if (!nbTri) continue;
          const nbHasA = nbTri.vIds.includes(va);
          const nbHasB = nbTri.vIds.includes(vb);
          if (!nbHasA || !nbHasB) continue;

          if (triSet.has(nb.triIndex)) {
            sharedSamePatch = true;
          } else {
            const otherPid = patchOfTri[nb.triIndex];
            if (otherPid !== -1) {
              if (!neighborAngles.has(otherPid)) {
                neighborAngles.set(otherPid, []);
                neighborConvexity.set(otherPid, []);
              }
              neighborAngles.get(otherPid).push(nb.angleDeg);
              neighborConvexity.get(otherPid).push(nb.convexSign);
            }
          }
        }

        if (!sharedSamePatch) {
          patchEdges.add(ek);
          boundarySegments.push([pa.clone(), pb.clone()]);
        }
      }
    }

    // Analytical Classification: planar vs chamfer vs cylindrical / fillet / hole / freeform
    const isPlanar = maxNormalDevDeg < 2.2 && maxPlaneDist < 0.08;
    let kind = 'freeform';
    let radius = null;
    let axis = null;
    let cylinderOrigin = null;
    let isConvex = null;

    if (isPlanar) {
      // Check if planar bevel strip (~45 deg between orthogonal walls)
      const nyAbs = Math.abs(avgNormal.y);
      const nxAbs = Math.abs(avgNormal.x);
      const nzAbs = Math.abs(avgNormal.z);
      const tiltedMid =
        (nyAbs > 0.25 && nyAbs < 0.92 && (nxAbs > 0.25 || nzAbs > 0.25)) ||
        (nxAbs > 0.25 && nxAbs < 0.92 && nzAbs > 0.25 && nyAbs < 0.25);
      const size = new THREE.Vector3();
      bounds.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const minDim = Math.min(size.x, size.y, size.z);
      kind = tiltedMid && maxDim > 0 && minDim < maxDim * 0.45 ? 'chamfer' : 'planar';
    } else {
      // Fit cylinder/fillet/hole parameters
      const frame = estimateCylinderFrame(normalsList);
      if (frame) {
        const pts2D = [];
        for (const pt of patchVertMap.values()) {
          pts2D.push({ u: pt.dot(frame.uAxis), v: pt.dot(frame.vAxis) });
        }
        const fit = fitCircle2D(pts2D);
        if (fit && fit.rmse < Math.max(0.45, fit.radius * 0.06)) {
          radius = Number(fit.radius.toFixed(3));
          axis = frame.axis;
          const axialMid = centroid.dot(frame.axis);
          cylinderOrigin = new THREE.Vector3()
            .addScaledVector(frame.uAxis, fit.cu)
            .addScaledVector(frame.vAxis, fit.cv)
            .addScaledVector(frame.axis, axialMid);

          // Determine convexity: compare patch vertex radial vectors to triangle normals
          let radialDotSum = 0;
          for (const ti of rp.triIndices) {
            const tri = triangles[ti];
            if (!tri) continue;
            const radial = tri.centroid.clone().sub(cylinderOrigin);
            radial.addScaledVector(axis, -radial.dot(axis));
            radialDotSum += radial.dot(tri.normal);
          }
          isConvex = radialDotSum >= 0;

          if (!isConvex) {
            kind = 'hole';
          } else {
            // Distinguish fillets (partial arc < ~170 deg) vs full cylindrical bosses
            let minAng = Infinity;
            let maxAng = -Infinity;
            const angles = [];
            for (const pt of patchVertMap.values()) {
              const rel = pt.clone().sub(cylinderOrigin);
              const ang = Math.atan2(rel.dot(frame.vAxis), rel.dot(frame.uAxis));
              angles.push(ang);
              if (ang < minAng) minAng = ang;
              if (ang > maxAng) maxAng = ang;
            }
            const spanRad = maxAng - minAng;
            kind = spanRad < Math.PI * 1.45 ? 'fillet' : 'cylindrical';
          }
        }
      }
    }

    faces.push({
      id: faceId,
      rawPid: rp.pid,
      bodyId,
      mesh,
      meshIdx,
      name: `${mesh.name || 'Solid'}_Face_${p + 1}`,
      kind,
      areaMm2: Number(areaMm2.toFixed(3)),
      centroid,
      normal: avgNormal,
      bounds,
      radius,
      axis,
      cylinderOrigin,
      isConvex,
      brepSurfaceType: rp.brepTag?.surfaceType || null,
      triIndices: rp.triIndices,
      triIndexSet: new Set(rp.triIndices),
      triPositions: new Float32Array(triPositions),
      triNormals: new Float32Array(triNormals),
      boundarySegments,
      neighborAngles,
      neighborConvexity,
      adjacentFaceIds: [],
      tangentNeighborIds: [],
      featureGroupId: null
    });
  }

  // Link face-to-face adjacency and tangent neighbors within this mesh
  const byRawPid = new Map(faces.map((f) => [f.rawPid, f]));
  for (const face of faces) {
    for (const [otherPid, angList] of face.neighborAngles.entries()) {
      const other = byRawPid.get(otherPid);
      if (!other) continue;
      face.adjacentFaceIds.push(other.id);
      const avgAng = angList.reduce((s, a) => s + a, 0) / Math.max(1, angList.length);
      if (avgAng <= 12.0) {
        face.tangentNeighborIds.push(other.id);
      }
    }
  }

  return faces;
}

/**
 * Links tangent neighbors across separate meshes in the same solid/surface group (if boundary edges coincide)
 * and builds feature clusters & similarity keys.
 */
function finalizeBodyTopology(faces = []) {
  // 1. Cross-mesh coincident boundary edge check for tangent neighbors
  if (faces.length > 1) {
    const boundaryEdgeIndex = new Map();
    for (const face of faces) {
      for (const [a, b] of face.boundarySegments) {
        const ka = quantizeVertexKey(a.x, a.y, a.z);
        const kb = quantizeVertexKey(b.x, b.y, b.z);
        const ek = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
        let list = boundaryEdgeIndex.get(ek);
        if (!list) {
          list = [];
          boundaryEdgeIndex.set(ek, list);
        }
        list.push(face);
      }
    }
    for (const [, list] of boundaryEdgeIndex.entries()) {
      if (list.length < 2) continue;
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const fa = list[i];
          const fb = list[j];
          if (fa.id === fb.id) continue;
          if (!fa.adjacentFaceIds.includes(fb.id)) fa.adjacentFaceIds.push(fb.id);
          if (!fb.adjacentFaceIds.includes(fa.id)) fb.adjacentFaceIds.push(fa.id);
          const ang = Math.acos(clamp(fa.normal.dot(fb.normal), -1, 1)) * RAD2DEG;
          if (ang <= 18.0) {
            if (!fa.tangentNeighborIds.includes(fb.id)) fa.tangentNeighborIds.push(fb.id);
            if (!fb.tangentNeighborIds.includes(fa.id)) fb.tangentNeighborIds.push(fa.id);
          }
        }
      }
    }
  }

  // 2. Group connected feature faces:
  // - Connected fillets/chamfers sharing vertices or tangent chains
  // - Individual holes/cylindrical pockets
  // - Tangent-connected curved strips
  const faceById = new Map(faces.map((f) => [f.id, f]));
  const visited = new Set();
  let featureIdx = 0;

  for (const face of faces) {
    if (visited.has(face.id)) continue;

    const featureId = `${face.bodyId}_feat_${featureIdx++}`;
    const queue = [face];
    visited.add(face.id);

    while (queue.length > 0) {
      const cur = queue.shift();
      cur.featureGroupId = featureId;

      if (cur.kind === 'fillet' || cur.kind === 'chamfer') {
        // Expand across adjacent fillets/chamfers of same kind & similar radius
        for (const nid of cur.adjacentFaceIds) {
          const nb = faceById.get(nid);
          if (!nb || visited.has(nb.id)) continue;
          const sameRadius =
            cur.radius == null ||
            nb.radius == null ||
            Math.abs(cur.radius - nb.radius) <= 0.25;
          if (nb.kind === cur.kind && sameRadius) {
            visited.add(nb.id);
            queue.push(nb);
          }
        }
      } else if (cur.kind === 'hole') {
        for (const nid of cur.tangentNeighborIds) {
          const nb = faceById.get(nid);
          if (!nb || visited.has(nb.id)) continue;
          if (nb.kind === 'hole' || (nb.kind === 'chamfer' && nb.areaMm2 < cur.areaMm2 * 1.5)) {
            visited.add(nb.id);
            queue.push(nb);
          }
        }
      }
    }
  }

  // 3. Compute matching & similarity keys + feature signatures
  const featureGroups = new Map();
  for (const face of faces) {
    const rBucket = face.radius != null ? Number(face.radius.toFixed(1)) : 'none';
    const areaBucket = Math.round(Math.log10(Math.max(0.1, face.areaMm2)) * 8);
    face.matchingKey =
      face.kind === 'fillet' || face.kind === 'hole' || face.kind === 'cylindrical'
        ? `${face.bodyId}::${face.kind}::R${rBucket}`
        : null;
    face.similarKey = `${face.bodyId}::${face.kind}::A${areaBucket}::R${rBucket}`;

    if (!featureGroups.has(face.featureGroupId)) {
      featureGroups.set(face.featureGroupId, []);
    }
    featureGroups.get(face.featureGroupId).push(face);
  }

  for (const [, fList] of featureGroups.entries()) {
    const kinds = [...new Set(fList.map((f) => f.kind))].sort().join('+');
    const rList = fList.map((f) => f.radius).filter((r) => r != null);
    const avgR = rList.length > 0 ? Number((rList.reduce((a, b) => a + b, 0) / rList.length).toFixed(1)) : 'none';
    const totalArea = fList.reduce((s, f) => s + f.areaMm2, 0);
    const areaBand = Math.round(totalArea / Math.max(5, totalArea * 0.12));
    const sig = `${fList[0].bodyId}::${kinds}::n${fList.length}::R${avgR}::A${areaBand}`;
    fList.forEach((f) => {
      f.featureSignature = sig;
    });
  }

  return faces;
}

/**
 * Segments a single solid/surface root Object3D into selectable topological faces (cached by geometry).
 */
export function segmentObjectIntoSolidFaces(rootObject, options = {}) {
  if (!rootObject) return [];
  const { bodyId = rootObject.uuid || rootObject.name || 'body_0', extraTransform = null } = options;

  const sigParts = [bodyId];
  rootObject.updateMatrixWorld(true);
  const rootInv = new THREE.Matrix4().copy(rootObject.matrixWorld).invert();

  const meshes = [];
  rootObject.traverse((child) => {
    if (!child.isMesh || !child.geometry || child.visible === false) return;
    if (child.name?.startsWith('helper_') || child.userData?.isHelper) return;
    meshes.push(child);
    sigParts.push(`${child.geometry.uuid}:${child.geometry.attributes?.position?.count || 0}`);
  });

  if (meshes.length === 0) return [];
  const sig = sigParts.join('|') + (extraTransform ? `|${extraTransform.elements.map((e) => e.toFixed(4)).join(',')}` : '');

  const cached = FACE_SEGMENT_CACHE.get(rootObject);
  if (cached && cached.sig === sig) {
    return cached.faces;
  }

  const allFaces = [];
  meshes.forEach((mesh, idx) => {
    const relMatrix = new THREE.Matrix4().multiplyMatrices(rootInv, mesh.matrixWorld);
    if (extraTransform) {
      relMatrix.premultiply(extraTransform);
    }
    const meshFaces = buildFacePatchesForMesh(
      mesh,
      relMatrix,
      bodyId,
      idx,
      `${bodyId}_m${idx}`
    );
    allFaces.push(...meshFaces);
  });

  const finalized = finalizeBodyTopology(allFaces);
  FACE_SEGMENT_CACHE.set(rootObject, { sig, faces: finalized });
  return finalized;
}

/**
 * Builds the complete searchable catalog of selectable Solid Faces & Surfaces
 * across currentModel (partHolderGroup) and customGeometry solids/surfaces.
 */
export function buildSolidFaceCatalog({
  currentModel = null,
  customGeometry = [],
  partTransform = null
} = {}) {
  const faces = [];
  const byId = new Map();
  const byMeshTri = new WeakMap();

  if (currentModel) {
    let extraMatrix = null;
    if (partTransform) {
      const pos = partTransform.position || { x: 0, y: 0, z: 0 };
      const rot = partTransform.rotation || { x: 0, y: 0, z: 0 };
      const scl = partTransform.scale || { x: 1, y: 1, z: 1 };
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rot.x || 0, rot.y || 0, rot.z || 0));
      extraMatrix = new THREE.Matrix4().compose(
        new THREE.Vector3(pos.x || 0, pos.y || 0, pos.z || 0),
        q,
        new THREE.Vector3(scl.x ?? 1, scl.y ?? 1, scl.z ?? 1)
      );
    }
    const modelBodyId = currentModel.userData?.__bodyId || 'primary_model';
    const modelFaces = segmentObjectIntoSolidFaces(currentModel, {
      bodyId: modelBodyId,
      extraTransform: extraMatrix
    });
    faces.push(...modelFaces);
  }

  if (Array.isArray(customGeometry)) {
    customGeometry.forEach((ent, idx) => {
      if (!ent || ent.visible === false) return;
      if (ent.isLine || ent.isLineSegments || ent.isPoints) return;
      const name = String(ent.name || '');
      const ct = String(ent.userData?.cadType || ent.userData?.type || '').toLowerCase();
      if (name.startsWith('Wireframe_') || name.startsWith('Drill_') || name.startsWith('Hole_') || name.startsWith('Drafting_')) {
        return;
      }
      const isSurfaceOrSolid =
        ent.isMesh ||
        name.startsWith('Surface_') ||
        name.startsWith('CAD_Surface') ||
        name.startsWith('Solid_') ||
        ct.includes('surface') ||
        ct.includes('solid') ||
        ct === 'extrude' ||
        Boolean(ent.children?.some((c) => c.isMesh));
      if (!isSurfaceOrSolid) return;

      const bodyId = String(ent.userData?.__bodyId || ent.userData?.customId || ent.uuid || ent.name || `custom_${idx}`);
      // Transform custom entity by its own local position/rotation/scale (relative to customGeoGroup Y=49)
      ent.updateMatrix();
      const entFaces = segmentObjectIntoSolidFaces(ent, {
        bodyId,
        extraTransform: ent.matrix.clone()
      });
      faces.push(...entFaces);
    });
  }

  const byGeomUuidTri = new Map();
  for (const face of faces) {
    byId.set(face.id, face);
    let triMap = byMeshTri.get(face.mesh);
    if (!triMap) {
      triMap = new Map();
      byMeshTri.set(face.mesh, triMap);
    }
    const gUuid = face.mesh.geometry?.uuid;
    let gList = gUuid ? byGeomUuidTri.get(gUuid) : null;
    if (gUuid && !gList) {
      gList = new Map();
      byGeomUuidTri.set(gUuid, gList);
    }
    for (const ti of face.triIndices) {
      triMap.set(ti, face);
      if (gList) {
        let arr = gList.get(ti);
        if (!arr) {
          arr = [];
          gList.set(ti, arr);
        }
        arr.push(face);
      }
    }
  }

  return {
    faces,
    byId,
    lookupFaceFromHit(hit, worldYOffset = 49) {
      if (!hit || !hit.object || hit.faceIndex == null) return null;
      const triMap = byMeshTri.get(hit.object);
      if (triMap) {
        return triMap.get(hit.faceIndex) || null;
      }
      // Fallback for cloned meshes (e.g., clone inside partHolderGroupRef) sharing geometry.uuid
      const gUuid = hit.object.geometry?.uuid;
      const gMap = gUuid ? byGeomUuidTri.get(gUuid) : null;
      const candidates = gMap ? gMap.get(hit.faceIndex) : null;
      if (!candidates || candidates.length === 0) return null;
      if (candidates.length === 1) return candidates[0];
      if (hit.point) {
        const localPt = new THREE.Vector3(hit.point.x, hit.point.y - worldYOffset, hit.point.z);
        for (const c of candidates) {
          if (c.bounds.clone().expandByScalar(1.0).containsPoint(localPt)) {
            return c;
          }
        }
      }
      return candidates[0];
    }
  };
}

/**
 * Resolves the Mastercam face selection set for a given hit face + modifier keys + click count.
 * Supports:
 * - Single Click: hit face
 * - Shift+Click: tangent-continuous faces (BFS across tangentNeighbors)
 * - Alt+Click: vector select (all faces pierced by pick ray front-to-back)
 * - Ctrl+Click: matching fillets / holes (same kind + radius within 0.15 mm)
 * - Ctrl+Shift+Click: similar faces
 * - Double-Click: feature faces
 * - Ctrl+Shift+Double-Click: similar features
 * - Triple-Click: entire solid body
 */
export function resolveSolidFaceSelectionAction(catalog, hitFace, options = {}) {
  if (!catalog || !hitFace) return { faceIds: [], modeLabel: '' };
  const {
    shiftKey = false,
    ctrlKey = false,
    altKey = false,
    clickCount = 1,
    rayHits = []
  } = options;

  const { faces, byId } = catalog;

  // Triple-click -> entire solid body
  if (clickCount >= 3) {
    return {
      faceIds: faces.filter((f) => f.bodyId === hitFace.bodyId).map((f) => f.id),
      modeLabel: 'Solid Body (Triple-click)'
    };
  }

  // Double-click -> feature or similar features
  if (clickCount === 2) {
    if (ctrlKey && shiftKey) {
      return {
        faceIds: faces.filter((f) => f.featureSignature === hitFace.featureSignature).map((f) => f.id),
        modeLabel: 'Similar Features (Ctrl+Shift+Double-click)'
      };
    }
    return {
      faceIds: faces.filter((f) => f.featureGroupId === hitFace.featureGroupId).map((f) => f.id),
      modeLabel: 'Feature (Double-click)'
    };
  }

  // Alt+Click -> vector select (all unique faces pierced along the pick ray)
  if (altKey) {
    const piercedIds = [];
    const seen = new Set();
    for (const rh of rayHits) {
      const f = catalog.lookupFaceFromHit(rh);
      if (f && !seen.has(f.id)) {
        seen.add(f.id);
        piercedIds.push(f.id);
      }
    }
    if (!seen.has(hitFace.id)) piercedIds.unshift(hitFace.id);
    return {
      faceIds: piercedIds,
      modeLabel: 'Vector Select (Alt+click)'
    };
  }

  // Ctrl+Shift+Click -> similar faces
  if (ctrlKey && shiftKey) {
    return {
      faceIds: faces.filter((f) => f.similarKey === hitFace.similarKey).map((f) => f.id),
      modeLabel: 'Similar Faces (Ctrl+Shift+click)'
    };
  }

  // Ctrl+Click -> matching fillets / holes
  if (ctrlKey) {
    if (hitFace.matchingKey) {
      return {
        faceIds: faces.filter((f) => f.matchingKey === hitFace.matchingKey).map((f) => f.id),
        modeLabel: `Matching ${hitFace.kind === 'hole' ? 'Holes' : 'Fillets'} (Ctrl+click)`
      };
    }
    return {
      faceIds: faces.filter((f) => f.similarKey === hitFace.similarKey).map((f) => f.id),
      modeLabel: 'Matching Faces (Ctrl+click)'
    };
  }

  // Shift+Click -> tangent faces (BFS across tangentNeighbors)
  if (shiftKey) {
    const visited = new Set([hitFace.id]);
    const queue = [hitFace];
    while (queue.length > 0) {
      const cur = queue.shift();
      for (const nid of cur.tangentNeighborIds) {
        if (visited.has(nid)) continue;
        const nb = byId.get(nid);
        if (nb) {
          visited.add(nid);
          queue.push(nb);
        }
      }
    }
    return {
      faceIds: [...visited],
      modeLabel: 'Tangent Faces (Shift+click)'
    };
  }

  return {
    faceIds: [hitFace.id],
    modeLabel: 'Single Face'
  };
}

/**
 * Builds Three.js highlight meshes (translucent fill + crisp boundary edges)
 * in part-local coordinates (to be placed inside a group at Y = 49).
 */
export function buildSolidFaceHighlightGroup(faces = [], options = {}) {
  const {
    fillColor = 0xfacc15,
    edgeColor = 0xeab308,
    opacity = 0.38
  } = options;

  const group = new THREE.Group();
  if (!Array.isArray(faces) || faces.length === 0) return group;

  const triVerts = [];
  const edgeVerts = [];

  for (const face of faces) {
    if (!face) continue;
    const pos = face.triPositions;
    const nrm = face.triNormals;
    if (pos && nrm) {
      // Slight normal offset prevents Z-fighting with underlying shaded solid faces
      for (let i = 0; i < pos.length; i += 3) {
        triVerts.push(
          pos[i] + nrm[i] * 0.04,
          pos[i + 1] + nrm[i + 1] * 0.04,
          pos[i + 2] + nrm[i + 2] * 0.04
        );
      }
    }
    if (Array.isArray(face.boundarySegments)) {
      const nVec = face.normal || new THREE.Vector3(0, 1, 0);
      for (const [a, b] of face.boundarySegments) {
        edgeVerts.push(
          a.x + nVec.x * 0.06,
          a.y + nVec.y * 0.06,
          a.z + nVec.z * 0.06,
          b.x + nVec.x * 0.06,
          b.y + nVec.y * 0.06,
          b.z + nVec.z * 0.06
        );
      }
    }
  }

  if (triVerts.length > 0) {
    const fillGeo = new THREE.BufferGeometry();
    fillGeo.setAttribute('position', new THREE.Float32BufferAttribute(triVerts, 3));
    const fillMat = new THREE.MeshBasicMaterial({
      color: fillColor,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });
    group.add(new THREE.Mesh(fillGeo, fillMat));
  }

  if (edgeVerts.length > 0) {
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgeVerts, 3));
    const edgeMat = new THREE.LineBasicMaterial({
      color: edgeColor,
      linewidth: 2,
      transparent: true,
      opacity: Math.min(1, opacity + 0.55)
    });
    group.add(new THREE.LineSegments(edgeGeo, edgeMat));
  }

  return group;
}
