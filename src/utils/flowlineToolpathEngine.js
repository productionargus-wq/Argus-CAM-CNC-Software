import * as THREE from 'three';
import { computeFlowlineStepoverFromScallop } from '../config/surfaceFinishSchema.js';

const TEMP_V0 = new THREE.Vector3();
const TEMP_V1 = new THREE.Vector3();
const TEMP_V2 = new THREE.Vector3();
const TEMP_E1 = new THREE.Vector3();
const TEMP_E2 = new THREE.Vector3();
const TEMP_P = new THREE.Vector3();
const TEMP_T = new THREE.Vector3();
const TEMP_Q = new THREE.Vector3();

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function buildOrthonormalFrame(normalVec) {
  const n = normalVec.clone().normalize();
  const ref = Math.abs(n.y) < 0.85 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const u = new THREE.Vector3().crossVectors(ref, n).normalize();
  const v = new THREE.Vector3().crossVectors(n, u).normalize();
  return { u, v, n };
}

/**
 * Computes segment intersections of a horizontal scanline (v = vVal) inside a set of 2D triangles.
 */
function intersectScanline2DTriangles(tris2D, vVal) {
  const spans = [];
  for (let t = 0; t < tris2D.length; t++) {
    const tri = tris2D[t];
    const hits = [];
    for (let i = 0; i < 3; i++) {
      const a = tri[i];
      const b = tri[(i + 1) % 3];
      if ((a.v <= vVal && b.v > vVal) || (b.v <= vVal && a.v > vVal)) {
        const frac = (vVal - a.v) / (b.v - a.v);
        hits.push(a.u + frac * (b.u - a.u));
      }
    }
    if (hits.length >= 2) {
      const u0 = Math.min(hits[0], hits[1]);
      const u1 = Math.max(hits[0], hits[1]);
      if (u1 - u0 > 1e-4) spans.push([u0, u1]);
    }
  }
  if (spans.length === 0) return [];
  spans.sort((a, b) => a[0] - b[0]);
  const merged = [spans[0]];
  for (let i = 1; i < spans.length; i++) {
    const prev = merged[merged.length - 1];
    const cur = spans[i];
    if (cur[0] <= prev[1] + 0.02) {
      prev[1] = Math.max(prev[1], cur[1]);
    } else {
      merged.push(cur);
    }
  }
  return merged;
}

/**
 * Exact Möller-Trumbore ray-triangle intersection against a triangle list stored in a flat Float32Array.
 */
function raycastFacePatchTriangles(triPositions, triNormals, rayOrigin, rayDir) {
  let bestT = Infinity;
  let bestPt = null;
  let bestNorm = null;

  for (let i = 0; i + 8 < triPositions.length; i += 9) {
    TEMP_V0.set(triPositions[i], triPositions[i + 1], triPositions[i + 2]);
    TEMP_V1.set(triPositions[i + 3], triPositions[i + 4], triPositions[i + 5]);
    TEMP_V2.set(triPositions[i + 6], triPositions[i + 7], triPositions[i + 8]);

    TEMP_E1.subVectors(TEMP_V1, TEMP_V0);
    TEMP_E2.subVectors(TEMP_V2, TEMP_V0);
    TEMP_P.crossVectors(rayDir, TEMP_E2);
    const det = TEMP_E1.dot(TEMP_P);
    if (Math.abs(det) < 1e-7) continue;

    const invDet = 1 / det;
    TEMP_T.subVectors(rayOrigin, TEMP_V0);
    const u = TEMP_T.dot(TEMP_P) * invDet;
    if (u < -0.01 || u > 1.01) continue;

    TEMP_Q.crossVectors(TEMP_T, TEMP_E1);
    const v = rayDir.dot(TEMP_Q) * invDet;
    if (v < -0.01 || u + v > 1.02) continue;

    const t = TEMP_E2.dot(TEMP_Q) * invDet;
    if (t >= 0 && t < bestT) {
      bestT = t;
      bestPt = rayOrigin.clone().addScaledVector(rayDir, t);
      bestNorm = new THREE.Vector3(triNormals[i], triNormals[i + 1], triNormals[i + 2]).normalize();
    }
  }

  return bestPt ? { point: bestPt, normal: bestNorm } : null;
}

/**
 * Builds an analytical / surface-conformal UV evaluator for a selected Solid Face / Surface patch.
 */
export function buildFlowlineUVPatch(face, flowlineData = {}) {
  if (!face || !face.triPositions || face.triPositions.length < 9) return null;

  const swapUV = Boolean(flowlineData.swapUV);
  const cutDir = (flowlineData.cutDir ?? 1) >= 0 ? 1 : -1;
  const stepDir = (flowlineData.stepDir ?? 1) >= 0 ? 1 : -1;
  const offsetDir = (flowlineData.offsetDir ?? 1) >= 0 ? 1 : -1;
  const startCorner = Math.abs(Number(flowlineData.startCorner) || 0) % 4;

  const startFlipU = (startCorner & 1) ? -1 : 1;
  const startFlipV = (startCorner & 2) ? -1 : 1;
  const effCutSign = cutDir * startFlipU;
  const effStepSign = stepDir * startFlipV;

  // 1. Cylindrical / Fillet / Hole analytical UV parameterization
  if (
    (face.kind === 'fillet' || face.kind === 'hole' || face.kind === 'cylindrical') &&
    face.axis &&
    face.cylinderOrigin &&
    face.radius > 0.15
  ) {
    const axis = face.axis.clone().normalize();
    const origin = face.cylinderOrigin.clone();
    const radius = face.radius;

    // Orient e1 toward the angular midpoint of the patch to avoid +/-PI atan2 discontinuities
    const avgRadial = new THREE.Vector3();
    for (let i = 0; i < face.triPositions.length; i += 3) {
      const p = new THREE.Vector3(face.triPositions[i], face.triPositions[i + 1], face.triPositions[i + 2]);
      const rel = p.sub(origin);
      rel.addScaledVector(axis, -rel.dot(axis));
      if (rel.lengthSq() > 1e-6) avgRadial.add(rel.normalize());
    }

    let e1;
    if (avgRadial.lengthSq() > 0.05) {
      e1 = avgRadial.normalize();
    } else {
      const ref = Math.abs(axis.x) < 0.85 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      e1 = new THREE.Vector3().crossVectors(ref, axis).normalize();
    }
    const e2 = new THREE.Vector3().crossVectors(axis, e1).normalize();

    let tMin = Infinity;
    let tMax = -Infinity;
    let thetaMin = Infinity;
    let thetaMax = -Infinity;

    for (let i = 0; i < face.triPositions.length; i += 3) {
      const p = new THREE.Vector3(face.triPositions[i], face.triPositions[i + 1], face.triPositions[i + 2]);
      const rel = p.sub(origin);
      const t = rel.dot(axis);
      const ang = Math.atan2(rel.dot(e2), rel.dot(e1));
      if (t < tMin) tMin = t;
      if (t > tMax) tMax = t;
      if (ang < thetaMin) thetaMin = ang;
      if (ang > thetaMax) thetaMax = ang;
    }

    if (face.kind === 'cylindrical' || face.kind === 'hole') {
      if (thetaMax - thetaMin > Math.PI * 1.75) {
        thetaMin = -Math.PI;
        thetaMax = Math.PI;
      }
    }

    const axialSpan = Math.max(0.5, tMax - tMin);
    const arcSpan = Math.max(0.5, radius * Math.max(0.02, thetaMax - thetaMin));

    const evalRaw = (aNorm, bNorm) => {
      const t = tMin + aNorm * (tMax - tMin);
      const theta = thetaMin + bNorm * (thetaMax - thetaMin);
      const radial = e1.clone().multiplyScalar(Math.cos(theta)).addScaledVector(e2, Math.sin(theta));
      const pos = origin.clone().addScaledVector(axis, t).addScaledVector(radial, radius);
      const outN = face.isConvex === false ? radial.clone().negate() : radial.clone();
      return { pos, normal: outN.multiplyScalar(offsetDir) };
    };

    const uSpan = swapUV ? arcSpan : axialSpan;
    const vSpan = swapUV ? axialSpan : arcSpan;

    return {
      face,
      type: 'cylindrical',
      uSpan,
      vSpan,
      effCutSign,
      effStepSign,
      isClosedU: swapUV && Math.abs(thetaMax - thetaMin - Math.PI * 2) < 0.15,
      evaluate(uNorm, vNorm) {
        return swapUV ? evalRaw(vNorm, uNorm) : evalRaw(uNorm, vNorm);
      },
      sampleLine(vNorm, uStartNorm, uEndNorm, steps = 20) {
        const pts = [];
        for (let s = 0; s <= steps; s++) {
          const u = uStartNorm + (uEndNorm - uStartNorm) * (s / steps);
          pts.push(this.evaluate(u, vNorm));
        }
        return [pts];
      }
    };
  }

  // 2. Planar / Chamfer / Freeform Patch UV Parameterization
  const faceNormal = (face.normal || new THREE.Vector3(0, 1, 0)).clone().normalize();
  const { u: baseU, v: baseV, n: baseN } = buildOrthonormalFrame(faceNormal);
  const uAxis = swapUV ? baseV : baseU;
  const vAxis = swapUV ? baseU : baseV;

  const centroid = face.centroid ? face.centroid.clone() : face.bounds.getCenter(new THREE.Vector3());
  const dPlane = centroid.dot(baseN);

  const tris2D = [];
  let uMin = Infinity;
  let uMax = -Infinity;
  let vMin = Infinity;
  let vMax = -Infinity;

  for (let i = 0; i + 8 < face.triPositions.length; i += 9) {
    const tri = [];
    for (let k = 0; k < 3; k++) {
      const px = face.triPositions[i + k * 3];
      const py = face.triPositions[i + k * 3 + 1];
      const pz = face.triPositions[i + k * 3 + 2];
      const uVal = px * uAxis.x + py * uAxis.y + pz * uAxis.z;
      const vVal = px * vAxis.x + py * vAxis.y + pz * vAxis.z;
      if (uVal < uMin) uMin = uVal;
      if (uVal > uMax) uMax = uVal;
      if (vVal < vMin) vMin = vVal;
      if (vVal > vMax) vMax = vVal;
      tri.push({ u: uVal, v: vVal });
    }
    tris2D.push(tri);
  }

  const uSpan = Math.max(0.5, uMax - uMin);
  const vSpan = Math.max(0.5, vMax - vMin);
  const isPlanar = face.kind === 'planar' || face.kind === 'chamfer';
  const rayStartHeight = face.bounds.getSize(new THREE.Vector3()).length() + 10.0;
  const rayDirNeg = baseN.clone().negate();

  const evalAtUV = (uCoord, vCoord) => {
    const basePt = uAxis.clone().multiplyScalar(uCoord).addScaledVector(vAxis, vCoord).addScaledVector(baseN, dPlane);
    if (isPlanar) {
      return { pos: basePt, normal: baseN.clone().multiplyScalar(offsetDir) };
    }
    const rayOrigin = basePt.clone().addScaledVector(baseN, rayStartHeight);
    const hit = raycastFacePatchTriangles(face.triPositions, face.triNormals, rayOrigin, rayDirNeg);
    if (hit) {
      return { pos: hit.point, normal: hit.normal.multiplyScalar(offsetDir) };
    }
    return { pos: basePt, normal: baseN.clone().multiplyScalar(offsetDir) };
  };

  return {
    face,
    type: isPlanar ? 'planar' : 'freeform',
    uSpan,
    vSpan,
    effCutSign,
    effStepSign,
    isClosedU: false,
    evaluate(uNorm, vNorm) {
      const uc = uMin + uNorm * (uMax - uMin);
      const vc = vMin + vNorm * (vMax - vMin);
      return evalAtUV(uc, vc);
    },
    sampleLine(vNorm, uStartNorm, uEndNorm, steps = 20) {
      const vc = clamp(vMin + vNorm * (vMax - vMin), vMin + 1e-4, vMax - 1e-4);
      const spans = intersectScanline2DTriangles(tris2D, vc);
      if (spans.length === 0) {
        const pts = [];
        for (let s = 0; s <= steps; s++) {
          const u = uStartNorm + (uEndNorm - uStartNorm) * (s / steps);
          pts.push(this.evaluate(u, vNorm));
        }
        return [pts];
      }

      const forward = uEndNorm >= uStartNorm;
      const orderedSpans = forward ? spans : [...spans].reverse();
      return orderedSpans.map(([sMin, sMax]) => {
        const ua = forward ? sMin : sMax;
        const ub = forward ? sMax : sMin;
        const segSteps = isPlanar ? Math.max(2, Math.ceil((ub - ua) / Math.max(2.0, uSpan / steps))) : steps;
        const pts = [];
        for (let s = 0; s <= segSteps; s++) {
          const uc = ua + (ub - ua) * (s / segSteps);
          pts.push(evalAtUV(uc, vc));
        }
        return pts;
      });
    }
  };
}

/**
 * Generates live 3D UV flowline grid curves and green directional arrows for Flowline Data preview (Image 3).
 */
export function buildFlowlinePreviewForFaces(driveFaces = [], flowlineData = {}) {
  const gridSegments = [];
  const edgeSegments = [];
  const arrows = [];

  const edgeTol = Math.max(0.002, Number(flowlineData.edgeTolerance) || 0.025);
  const curveSteps = edgeTol <= 0.01 ? 32 : edgeTol <= 0.03 ? 20 : 12;

  for (const face of driveFaces) {
    const patch = buildFlowlineUVPatch(face, flowlineData);
    if (!patch) continue;

    const lift = (sample) => sample.pos.clone().addScaledVector(sample.normal, 0.18);

    // 7 iso-curves along cut direction (flowlines) + 5 cross-tie iso-curves
    const numCutLines = Math.max(5, Math.min(13, Math.round(patch.vSpan / 4) + 3));
    for (let i = 0; i < numCutLines; i++) {
      const vNorm = numCutLines > 1 ? i / (numCutLines - 1) : 0.5;
      const uA = patch.effCutSign > 0 ? 0 : 1;
      const uB = patch.effCutSign > 0 ? 1 : 0;
      const polylines = patch.sampleLine(vNorm, uA, uB, curveSteps);
      for (const poly of polylines) {
        for (let k = 0; k < poly.length - 1; k++) {
          gridSegments.push([lift(poly[k]), lift(poly[k + 1])]);
        }
      }
    }

    if (flowlineData.plotEdges && Array.isArray(face.boundarySegments)) {
      const nVec = (face.normal || new THREE.Vector3(0, 1, 0)).clone().multiplyScalar(0.24);
      for (const [a, b] of face.boundarySegments) {
        edgeSegments.push([a.clone().add(nVec), b.clone().add(nVec)]);
      }
    }

    // Green corner directional indicators (Start point, Cut direction arrow, Step direction arrow)
    const u0 = patch.effCutSign > 0 ? 0.08 : 0.92;
    const u1 = patch.effCutSign > 0 ? 0.35 : 0.65;
    const v0 = patch.effStepSign > 0 ? 0.08 : 0.92;
    const v1 = patch.effStepSign > 0 ? 0.35 : 0.65;

    const sOrigin = patch.evaluate(u0, v0);
    const sCut = patch.evaluate(u1, v0);
    const sStep = patch.evaluate(u0, v1);

    const cutVec = sCut.pos.clone().sub(sOrigin.pos);
    const stepVec = sStep.pos.clone().sub(sOrigin.pos);
    if (cutVec.lengthSq() > 1e-4 && stepVec.lengthSq() > 1e-4) {
      arrows.push({
        startPos: lift(sOrigin),
        cutDir: cutVec.normalize(),
        stepDir: stepVec.normalize(),
        normal: sOrigin.normal.clone().normalize(),
        length: Math.max(6, Math.min(18, Math.min(patch.uSpan, patch.vSpan) * 0.45))
      });
    }
  }

  return { gridSegments, edgeSegments, arrows };
}

/**
 * Offsets a surface contact point + outward normal to the cutter tip / ball center coordinate
 * respecting tool diameter, corner radius, stockToLeaveDrive, and Tip vs Center compensation.
 */
function offsetSampleToCutterPoint(sample, tool, params) {
  const toolRadius = Math.max(0.25, (Number(tool?.diameter) || 10) * 0.5);
  const tType = String(tool?.type || '').toLowerCase();
  const cornerRad = tType.includes('ball')
    ? toolRadius
    : Math.max(0, Math.min(toolRadius, Number(tool?.cornerRadius ?? tool?.cornerRad) || 0));
  const driveStock = Number(params.stockToLeaveDrive) || 0;
  const tipComp = String(params.tipComp || 'tip').toLowerCase();

  const n = sample.normal.clone().normalize();
  const pt = sample.pos.clone();

  if (tType.includes('ball') || cornerRad >= toolRadius - 0.02) {
    // Ball endmill: ball center is (R_ball + stock) along surface normal
    pt.addScaledVector(n, toolRadius + driveStock);
    if (tipComp === 'tip') {
      pt.y -= toolRadius;
    }
    return pt;
  }

  if (cornerRad > 0.02) {
    // Bull-nosed endmill: toroidal ring center offset horizontally + corner radius normal offset
    const flatR = Math.max(0, toolRadius - cornerRad);
    const horiz = new THREE.Vector3(n.x, 0, n.z);
    const horizLen = horiz.length();
    if (horizLen > 0.02) {
      horiz.divideScalar(horizLen);
      pt.addScaledVector(horiz, flatR);
    }
    pt.addScaledVector(n, cornerRad + driveStock);
    if (tipComp === 'tip') {
      pt.y -= cornerRad;
    }
    return pt;
  }

  // Flat endmill: horizontal radial clearance on side walls + axial stock allowance
  const horiz = new THREE.Vector3(n.x, 0, n.z);
  const horizLen = horiz.length();
  if (horizLen > 0.05) {
    horiz.divideScalar(horizLen);
    pt.addScaledVector(horiz, toolRadius + driveStock * horizLen);
  }
  pt.y += Math.max(0, n.y) * driveStock;
  return pt;
}

/**
 * Computes minimum horizontal distance from point (px, pz) to triangle (a, b, c) in XZ
 * and returns the triangle's maximum Y elevation inside the cutter cylinder if colliding.
 */
function checkPointAgainstObstacleFaces(pt, toolRadius, checkStock, checkFaces) {
  if (!checkFaces || checkFaces.length === 0) return pt;
  const clearance = toolRadius + Math.max(0, Number(checkStock) || 0) - 0.05;
  if (clearance <= 0.05) return pt;

  let adjustedY = pt.y;
  for (const cf of checkFaces) {
    const b = cf.bounds;
    if (!b) continue;
    if (
      pt.x < b.min.x - clearance ||
      pt.x > b.max.x + clearance ||
      pt.z < b.min.z - clearance ||
      pt.z > b.max.z + clearance ||
      b.max.y < adjustedY + 0.02
    ) {
      continue;
    }

    const pos = cf.triPositions;
    for (let i = 0; i + 8 < pos.length; i += 9) {
      const maxY = Math.max(pos[i + 1], pos[i + 4], pos[i + 7]);
      if (maxY <= adjustedY + 0.02) continue;

      // Bounding check in XZ against cutter circle
      const minX = Math.min(pos[i], pos[i + 3], pos[i + 6]) - clearance;
      const maxX = Math.max(pos[i], pos[i + 3], pos[i + 6]) + clearance;
      const minZ = Math.min(pos[i + 2], pos[i + 5], pos[i + 8]) - clearance;
      const maxZ = Math.max(pos[i + 2], pos[i + 5], pos[i + 8]) + clearance;
      if (pt.x < minX || pt.x > maxX || pt.z < minZ || pt.z > maxZ) continue;

      // Test vertices & edge midpoints against cylinder radius
      const cx = (pos[i] + pos[i + 3] + pos[i + 6]) / 3;
      const cz = (pos[i + 2] + pos[i + 5] + pos[i + 8]) / 3;
      const dCenter = Math.hypot(pt.x - cx, pt.z - cz);
      const d0 = Math.hypot(pt.x - pos[i], pt.z - pos[i + 2]);
      const d1 = Math.hypot(pt.x - pos[i + 3], pt.z - pos[i + 5]);
      const d2 = Math.hypot(pt.x - pos[i + 6], pt.z - pos[i + 8]);
      if (Math.min(dCenter, d0, d1, d2) < clearance) {
        adjustedY = Math.max(adjustedY, maxY + 0.05);
      }
    }
  }

  return adjustedY > pt.y ? new THREE.Vector3(pt.x, adjustedY, pt.z) : pt;
}

/**
 * Generates 3D Surface Finish Flowline Toolpath across selected Solid Faces / Surfaces.
 */
export function generateSurfaceFlowlineToolpath(bounds, tool = {}, params = {}, driveFaces = [], checkFaces = []) {
  const cuttingLines = [];
  const rapidLines = [];

  const toolDiam = Math.max(0.5, Number(tool?.diameter) || 12.0);
  const toolRadius = toolDiam * 0.5;
  const cornerRad = Number(tool?.cornerRadius ?? tool?.cornerRad ?? 0);
  const rapidHeight = Number(params.rapidHeight) || 25.0;

  const fp = params.flowlineParams || params;
  const fd = params.flowlineData || {};

  const stepover =
    fp.stepoverMode === 'distance'
      ? Math.max(0.15, Number(fp.stepoverDistance) || 2.0)
      : computeFlowlineStepoverFromScallop({
          scallopHeight: fp.scallopHeight ?? 0.5,
          toolDiameter: toolDiam,
          cornerRadius: cornerRad,
          toolType: tool?.type || 'bull'
        });

  const maxSegLen = fp.cutControlDistanceEnabled
    ? Math.max(0.2, Number(fp.cutControlDistance) || 2.0)
    : Math.max(0.5, Math.min(4.0, (Number(fp.totalTolerance) || 0.025) * 80));

  const method = String(fp.cuttingMethod || 'Zigzag').toLowerCase();
  const isZigzag = method === 'zigzag';
  const isSpiral = method === 'spiral';
  const singleRow = Boolean(fp.singleRowOnly);
  const ribCut = Boolean(fp.ribCutEnabled);
  const ribResPct = Math.max(5, Math.min(100, Number(fp.ribCutResolutionPct) || 50.0));
  const checkGouge = fp.checkGouge !== false;
  const depthLimitsEnabled = Boolean(fp.depthLimitsEnabled);
  const minDepth = Number(fp.minDepth ?? -9999);
  const maxDepth = Number(fp.maxDepth ?? 9999);
  const maxGapDist = Math.max(0.5, Number(fp.maxGapDistance) || 10.0);

  // Fallback planar/saddle bounds if user ran Flowline with no face selection yet
  if (!Array.isArray(driveFaces) || driveFaces.length === 0) {
    const bMin = bounds?.min || new THREE.Vector3(-40, 0, -35);
    const bMax = bounds?.max || new THREE.Vector3(40, 20, 35);
    const topY = bMax.y;
    const numPasses = singleRow ? 1 : Math.max(3, Math.ceil((bMax.z - bMin.z) / stepover) + 1);
    let prevEnd = null;

    for (let p = 0; p < numPasses; p++) {
      const frac = numPasses === 1 ? 0.5 : p / (numPasses - 1);
      const z = bMin.z + frac * (bMax.z - bMin.z);
      const forward = isZigzag ? p % 2 === 0 : true;
      const xA = forward ? bMin.x + toolRadius : bMax.x - toolRadius;
      const xB = forward ? bMax.x - toolRadius : bMin.x + toolRadius;
      const pA = new THREE.Vector3(xA, topY, z);
      const pB = new THREE.Vector3(xB, topY, z);

      if (!prevEnd) {
        rapidLines.push([new THREE.Vector3(pA.x, topY + rapidHeight, pA.z), pA]);
      } else if (isZigzag && prevEnd.distanceTo(pA) <= maxGapDist + stepover) {
        cuttingLines.push([prevEnd, pA]);
      } else {
        rapidLines.push([prevEnd, new THREE.Vector3(prevEnd.x, topY + rapidHeight, prevEnd.z)]);
        rapidLines.push([new THREE.Vector3(pA.x, topY + rapidHeight, pA.z), pA]);
      }
      cuttingLines.push([pA, pB]);
      prevEnd = pB;
    }

    if (prevEnd) {
      rapidLines.push([prevEnd, new THREE.Vector3(prevEnd.x, topY + rapidHeight, prevEnd.z)]);
    }
    return { cuttingLines, rapidLines };
  }

  let globalTopY = -Infinity;
  driveFaces.forEach((f) => {
    if (f?.bounds?.max?.y != null) globalTopY = Math.max(globalTopY, f.bounds.max.y);
  });
  if (!Number.isFinite(globalTopY)) globalTopY = bounds?.max?.y ?? 25;

  let prevEnd = null;

  for (const face of driveFaces) {
    const patch = buildFlowlineUVPatch(face, fd);
    if (!patch) continue;

    const effectiveStep = ribCut ? Math.max(0.2, (toolDiam * ribResPct) / 100) : stepover;
    const passCount = (singleRow || ribCut) ? 1 : Math.max(2, Math.ceil(patch.vSpan / effectiveStep) + 1);
    const uSegs = Math.max(8, Math.min(80, Math.ceil(patch.uSpan / maxSegLen)));

    const facePassLines = [];

    for (let p = 0; p < passCount; p++) {
      const rawV = passCount === 1 ? 0.5 : p / (passCount - 1);
      const v0 = patch.effStepSign > 0 ? rawV : 1 - rawV;
      const nextRawV = passCount === 1 ? 0.5 : Math.min(1, (p + 1) / (passCount - 1));
      const v1 = patch.effStepSign > 0 ? nextRawV : 1 - nextRawV;

      const forward = isZigzag ? (p % 2 === 0 ? patch.effCutSign > 0 : patch.effCutSign < 0) : patch.effCutSign > 0;
      const uA = forward ? 0 : 1;
      const uB = forward ? 1 : 0;

      if (isSpiral && passCount > 1 && p < passCount - 1 && patch.type === 'cylindrical') {
        const pts = [];
        for (let s = 0; s <= uSegs; s++) {
          const frac = s / uSegs;
          const u = uA + (uB - uA) * frac;
          const v = v0 + (v1 - v0) * frac;
          pts.push(patch.evaluate(u, v));
        }
        facePassLines.push(pts);
      } else {
        const polylines = patch.sampleLine(v0, uA, uB, uSegs);
        polylines.forEach((poly) => {
          if (poly.length >= 2) facePassLines.push(poly);
        });
      }
    }

    for (const poly of facePassLines) {
      let cutterPts = poly.map((sample) => offsetSampleToCutterPoint(sample, tool, params));

      if (checkGouge && checkFaces.length > 0) {
        cutterPts = cutterPts.map((pt) =>
          checkPointAgainstObstacleFaces(pt, toolRadius, params.stockToLeaveCheck ?? 0, checkFaces)
        );
      }

      if (depthLimitsEnabled) {
        const zTopLimit = globalTopY + maxDepth;
        const zBotLimit = globalTopY + minDepth;
        cutterPts = cutterPts.map((pt) =>
          new THREE.Vector3(pt.x, clamp(pt.y, zBotLimit, zTopLimit), pt.z)
        );
      }

      if (cutterPts.length < 2) continue;

      const startPt = cutterPts[0];
      if (!prevEnd) {
        rapidLines.push([new THREE.Vector3(startPt.x, globalTopY + rapidHeight, startPt.z), startPt]);
      } else if ((isZigzag || isSpiral) && prevEnd.distanceTo(startPt) <= maxGapDist + stepover * 1.5) {
        cuttingLines.push([prevEnd, startPt]);
      } else {
        rapidLines.push([prevEnd, new THREE.Vector3(prevEnd.x, globalTopY + rapidHeight, prevEnd.z)]);
        rapidLines.push([new THREE.Vector3(startPt.x, globalTopY + rapidHeight, startPt.z), startPt]);
      }

      for (let i = 0; i < cutterPts.length - 1; i++) {
        cuttingLines.push([cutterPts[i], cutterPts[i + 1]]);
      }
      prevEnd = cutterPts[cutterPts.length - 1];
    }
  }

  if (prevEnd) {
    rapidLines.push([prevEnd, new THREE.Vector3(prevEnd.x, globalTopY + rapidHeight, prevEnd.z)]);
  }

  return { cuttingLines, rapidLines };
}
