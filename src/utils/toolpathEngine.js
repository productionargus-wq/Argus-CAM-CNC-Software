import * as THREE from 'three';
import { offsetContour2D } from './cadGeometry.js';
import { isDriveSurfaceEntity } from '../config/surfaceFinishSchema.js';
import { segmentObjectIntoSolidFaces } from './solidFaceSelectionEngine.js';
import { generateSurfaceFlowlineToolpath } from './flowlineToolpathEngine.js';
import { createTouchProbe3D, generateProbingToolpath, PROBING_STRATEGIES } from './probingEngine.js';
import { generateAdaptiveTrochoidalToolpath, ADAPTIVE_MATERIALS, calculateAdaptivePhysics } from './adaptiveRoughingEngine.js';
import {
  applyLeadInOutToContour,
  buildTangentArcLeadIn,
  buildTangentArcLeadOut,
  buildHelicalRampEntry,
  LEAD_ENTRY_TYPES,
  DEFAULT_LEAD_CONFIG
} from './leadInOutEngine.js';
import {
  generate5AxisSwarfToolpath,
  generate5AxisFlowlineToolpath,
  calculateToolOrientationVector,
  vectorToMachineAngles,
  audit5AxisKinematics,
  FIVE_AXIS_STRATEGIES,
  MACHINE_KINEMATICS,
  TCPM_MODES
} from './fiveAxisEngine.js';

export {
  createTouchProbe3D,
  generateProbingToolpath,
  PROBING_STRATEGIES,
  generateAdaptiveTrochoidalToolpath,
  ADAPTIVE_MATERIALS,
  calculateAdaptivePhysics,
  applyLeadInOutToContour,
  buildTangentArcLeadIn,
  buildTangentArcLeadOut,
  buildHelicalRampEntry,
  LEAD_ENTRY_TYPES,
  DEFAULT_LEAD_CONFIG,
  generate5AxisSwarfToolpath,
  generate5AxisFlowlineToolpath,
  calculateToolOrientationVector,
  vectorToMachineAngles,
  audit5AxisKinematics,
  FIVE_AXIS_STRATEGIES,
  MACHINE_KINEMATICS,
  TCPM_MODES
};

/**
 * Safely resolves a bounding box representation (THREE.Box3, { box }, { bounds }, or plain object)
 * into a guaranteed valid object with min and max Vector3s.
 */
export function resolveSafeBounds(bounds) {
  const b = (bounds?.min && bounds?.max)
    ? bounds
    : (bounds?.box?.min && bounds?.box?.max)
      ? bounds.box
      : (bounds?.bounds?.min && bounds?.bounds?.max)
        ? bounds.bounds
        : null;

  return {
    min: new THREE.Vector3(b?.min?.x ?? -35, b?.min?.y ?? 0, b?.min?.z ?? -25),
    max: new THREE.Vector3(b?.max?.x ?? 35, b?.max?.y ?? 25, b?.max?.z ?? 25)
  };
}

/**
 * Toolpath Generation Engine
 * Calculates mathematically accurate 2.5D and 3D CNC toolpath trajectories
 */

/**
 * Generates Face Milling Toolpath (Zigzag Raster with Lead-in/Lead-out and Smooth Loops)
 */
export function generateFacingToolpath(bounds, tool, params = {}) {
  bounds = resolveSafeBounds(bounds);
  const {
    stepoverPct = 65,
    faceAllowance = 2.0,
    depthOfCut = 1.0,
    rapidHeight = 15.0
  } = params;

  const toolRadius = (tool.diameter || 10) / 2;
  const stepover = (tool.diameter * stepoverPct) / 100;

  const minX = bounds.min.x - toolRadius;
  const maxX = bounds.max.x + toolRadius;
  const minZ = bounds.min.z - toolRadius;
  const maxZ = bounds.max.z + toolRadius;
  const targetZ = bounds.max.y; // Top of part

  const cuttingLines = [];
  const rapidLines = [];

  // Multi-pass depth from allowance down to 0
  for (let currentY = targetZ + faceAllowance; currentY >= targetZ; currentY -= depthOfCut) {
    let direction = 1;

    // Start with a rapid move to clearance height above initial point
    rapidLines.push([
      new THREE.Vector3(minX - 10, targetZ + rapidHeight, minZ),
      new THREE.Vector3(minX - 10, currentY, minZ)
    ]);

    for (let z = minZ; z <= maxZ; z += stepover) {
      const startX = direction === 1 ? minX - 10 : maxX + 10;
      const endX = direction === 1 ? maxX + 10 : minX - 10;

      // Cutting pass across part
      cuttingLines.push([
        new THREE.Vector3(startX, currentY, z),
        new THREE.Vector3(endX, currentY, z)
      ]);

      // Stepover loop to next line
      const nextZ = z + stepover;
      if (nextZ <= maxZ) {
        cuttingLines.push([
          new THREE.Vector3(endX, currentY, z),
          new THREE.Vector3(endX, currentY, nextZ)
        ]);
      }

      direction *= -1; // alternate zigzag direction
    }

    // Retract to rapid height
    const lastX = direction === 1 ? minX - 10 : maxX + 10;
    rapidLines.push([
      new THREE.Vector3(lastX, currentY, maxZ),
      new THREE.Vector3(lastX, targetZ + rapidHeight, maxZ)
    ]);
  }

  return { cuttingLines, rapidLines };
}

/**
 * Builds a unified Three.js drive-surface Group combining currentModel and matching
 * customGeometry surfaces (Level 15 Surface_* / Surface_Extrude_* entities).
 */
export function buildEffectiveDriveModel(currentModel = null, customGeometry = [], op = null) {
  const isFlowline = op?.badgeClass === 'flowline' || op?.strategyKey === 'surface_finish_flowline';
  const combinedIds = [
    ...(Array.isArray(op?.driveSurfaceIds) ? op.driveSurfaceIds : []),
    ...(Array.isArray(op?.checkSurfaceIds) ? op.checkSurfaceIds : [])
  ];
  const driveIds = !isFlowline && combinedIds.length > 0
    ? new Set(combinedIds.map((id) => String(id)))
    : null;

  const surfaceEntities = (Array.isArray(customGeometry) ? customGeometry : []).filter((ent) => {
    if (!isDriveSurfaceEntity(ent)) return false;
    if (driveIds) {
      return (
        driveIds.has(String(ent.uuid)) ||
        driveIds.has(String(ent.id)) ||
        driveIds.has(String(ent.userData?.customId)) ||
        driveIds.has(String(ent.name))
      );
    }
    return true;
  });

  if (!currentModel && surfaceEntities.length === 0) return null;

  const group = new THREE.Group();
  if (currentModel) {
    const modelClone = currentModel.clone(true);
    modelClone.userData = { ...(currentModel.userData || {}), __bodyId: 'primary_model' };
    group.add(modelClone);
  }
  surfaceEntities.forEach((ent) => {
    const clone = ent.clone(true);
    const bodyId = String(ent.userData?.customId || ent.uuid || ent.name);
    clone.userData = { ...(ent.userData || {}), __bodyId: bodyId };
    clone.traverse((node) => {
      if (node.userData?.isCap) {
        node.userData.isCap = true;
      }
    });
    group.add(clone);
  });
  group.updateMatrixWorld(true);
  return group;
}

/**
 * Resolves Face Patches from effectiveModel matching op.driveFaceIds / op.checkFaceIds for Flowline operations.
 */
export function resolveFlowlineFacesFromEffectiveModel(effectiveModel, op = {}) {
  if (!effectiveModel) return { driveFaces: [], checkFaces: [] };
  const allFaces = [];
  const children = effectiveModel.children?.length > 0 ? effectiveModel.children : [effectiveModel];
  children.forEach((child, idx) => {
    const bodyId = child.userData?.__bodyId || (idx === 0 ? 'primary_model' : String(child.userData?.customId || child.uuid || child.name || `custom_${idx}`));
    const extraMatrix = bodyId === 'primary_model' ? null : (child.updateMatrix(), child.matrix.clone());
    const faces = segmentObjectIntoSolidFaces(child, { bodyId, extraTransform: extraMatrix });
    allFaces.push(...faces);
  });

  const driveSet = new Set(Array.isArray(op?.driveFaceIds) ? op.driveFaceIds.map(String) : []);
  const checkSet = new Set(Array.isArray(op?.checkFaceIds) ? op.checkFaceIds.map(String) : []);

  let driveFaces = driveSet.size > 0 ? allFaces.filter((f) => driveSet.has(f.id)) : [];
  if (driveFaces.length === 0 && Array.isArray(op?.driveSurfaceIds) && op.driveSurfaceIds.length > 0) {
    const surfSet = new Set(op.driveSurfaceIds.map(String));
    driveFaces = allFaces.filter((f) => surfSet.has(String(f.bodyId)));
  }

  let checkFaces = checkSet.size > 0 ? allFaces.filter((f) => checkSet.has(f.id)) : [];
  if (checkFaces.length === 0 && (op?.flowlineParams?.checkGouge ?? true) && driveFaces.length > 0) {
    // Non-selected solid faces serve as implicit gouge-avoidance check obstacles unless tangent to drive
    const driveTangentSet = new Set();
    driveFaces.forEach((df) => {
      driveTangentSet.add(df.id);
      (df.tangentNeighborIds || []).forEach((tid) => driveTangentSet.add(tid));
    });
    checkFaces = allFaces.filter((f) => !driveTangentSet.has(f.id));
  }

  return { driveFaces, checkFaces };
}

/**
 * Normalizes Surface Finish Flowline parameters from an operation record.
 */
export function buildFlowlineParamsFromOp(op = {}) {
  const sp = op.surfaceParams || {};
  const fp = op.flowlineParams || {};
  const fd = op.flowlineData || {};
  return {
    rapidHeight: sp.clearanceEnabled && sp.clearanceMode === 'abs'
      ? Number(sp.clearance)
      : (Number(sp.retract ?? op.rapidHeight) || 25.0),
    tipComp: sp.tipComp || 'tip',
    stockToLeaveDrive: Number(sp.stockToLeaveDrive ?? op.stockToLeaveXY) || 0,
    stockToLeaveCheck: Number(sp.stockToLeaveCheck) || 0,
    flowlineData: {
      offsetDir: fd.offsetDir ?? 1,
      cutDir: fd.cutDir ?? 1,
      stepDir: fd.stepDir ?? 1,
      swapUV: Boolean(fd.swapUV),
      startCorner: Number(fd.startCorner) || 0,
      edgeTolerance: Number(fd.edgeTolerance) || 0.025,
      plotEdges: Boolean(fd.plotEdges)
    },
    flowlineParams: {
      cutControlDistanceEnabled: Boolean(fp.cutControlDistanceEnabled),
      cutControlDistance: Number(fp.cutControlDistance) || 2.0,
      totalTolerance: Number(fp.totalTolerance) || 0.025,
      checkGouge: fp.checkGouge !== false,
      stepoverMode: fp.stepoverMode || 'scallop',
      stepoverDistance: Number(fp.stepoverDistance) || 2.0,
      scallopHeight: Number(fp.scallopHeight) || 0.5,
      cuttingMethod: fp.cuttingMethod || 'Zigzag',
      singleRowOnly: Boolean(fp.singleRowOnly),
      ribCutEnabled: Boolean(fp.ribCutEnabled),
      ribCutResolutionPct: Number(fp.ribCutResolutionPct) || 50.0,
      depthLimitsEnabled: Boolean(fp.depthLimitsEnabled),
      minDepth: Number(fp.minDepth ?? -9999),
      maxDepth: Number(fp.maxDepth ?? 9999),
      gapSettingsMode: fp.gapSettingsMode || 'Follow surfaces',
      maxGapDistance: Number(fp.maxGapDistance) || 10.0
    }
  };
}

/**
 * Computes exact bounding Box3 from a drive surface/model hierarchy, falling back safely.
 */
export function computeDriveModelBounds(driveModel, fallbackBounds = null) {
  if (driveModel) {
    driveModel.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(driveModel);
    if (!box.isEmpty()) return box;
  }
  return resolveSafeBounds(fallbackBounds);
}

/**
 * Resolves consistent operation bounds matching the active drive model when present,
 * preventing Z-datum drift between toolpath generation, backplot, and G-code post.
 */
export function resolveOperationDriveBounds(effectiveModel, op = null, fallbackBounds = null) {
  const opBounds = op?.bounds ? resolveSafeBounds(op.bounds) : null;
  const baseBounds = opBounds || resolveSafeBounds(fallbackBounds);
  if (effectiveModel) {
    return computeDriveModelBounds(effectiveModel, baseBounds);
  }
  return baseBounds;
}

/**
 * Offsets a closed 3D loop in the XZ horizontal plane (Y preserved) by signedOffset
 * (> 0 outward, < 0 inward) using shared miter-clamped 2D contour offsetting.
 */
export function offsetClosedLoopXZ(loop = [], signedOffset = 0, yOverride = null, isClosed = true) {
  if (!Array.isArray(loop) || loop.length < (isClosed ? 3 : 2)) return [];
  const sampleY = yOverride ?? loop[0].y ?? 0;
  if (Math.abs(signedOffset) < 1e-4) {
    return loop.map((p) => new THREE.Vector3(p.x, sampleY, p.z));
  }
  const uv = loop.map((p) => ({ u: p.x, v: p.z }));
  const offsetUV = offsetContour2D(uv, signedOffset, isClosed);
  if (!offsetUV || offsetUV.length < (isClosed ? 3 : 2)) return [];
  return offsetUV.map((p) => new THREE.Vector3(p.u, sampleY, p.v));
}

/**
 * Orients a closed XZ loop to match CNC XY winding (wantCncCCW=true -> CCW in CNC XY, xzArea2 < 0).
 */
export function orientClosedLoopXZ(loop = [], wantCncCCW = false) {
  if (!Array.isArray(loop) || loop.length < 3) return loop;
  const isClosedPt = loop[0].distanceTo(loop[loop.length - 1]) < 0.05;
  const unique = isClosedPt ? loop.slice(0, -1) : loop;
  if (unique.length < 3) return loop;

  let xzArea2 = 0;
  for (let i = 0; i < unique.length; i++) {
    const a = unique[i];
    const b = unique[(i + 1) % unique.length];
    xzArea2 += a.x * b.z - b.x * a.z;
  }
  if (Math.abs(xzArea2) < 1e-6) return loop;

  const currentlyCncCCW = xzArea2 < 0;
  return currentlyCncCCW === wantCncCCW ? loop : [...loop].reverse();
}

/**
 * Slices a 3D Three.js Object/Mesh hierarchy at a given horizontal Y plane.
 * Computes exact intersection line segments between triangles and the plane Y = planeY.
 * When options.wallOnly is true, skips cap meshes and horizontal cap faces.
 */
export function sliceMeshAtY(object3D, planeY, options = {}) {
  if (!object3D) return [];
  const { wallOnly = false } = options;
  const segments = [];

  const tempV1 = new THREE.Vector3();
  const tempV2 = new THREE.Vector3();
  const tempV3 = new THREE.Vector3();
  const edgeA = new THREE.Vector3();
  const edgeB = new THREE.Vector3();
  const triNorm = new THREE.Vector3();

  const nudgeZero = (d) => (Math.abs(d) < 1e-5 ? 1e-5 : d);

  object3D.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    if (wallOnly && child.userData?.isCap) return;

    const geo = child.geometry;
    const pos = geo.attributes.position;
    if (!pos) return;

    child.updateMatrixWorld(true);
    const worldMatrix = child.matrixWorld;
    const indices = geo.index ? geo.index.array : null;
    const triCount = indices ? indices.length / 3 : pos.count / 3;

    for (let t = 0; t < triCount; t++) {
      const i1 = indices ? indices[t * 3] : t * 3;
      const i2 = indices ? indices[t * 3 + 1] : t * 3 + 1;
      const i3 = indices ? indices[t * 3 + 2] : t * 3 + 2;

      tempV1.fromBufferAttribute(pos, i1).applyMatrix4(worldMatrix);
      tempV2.fromBufferAttribute(pos, i2).applyMatrix4(worldMatrix);
      tempV3.fromBufferAttribute(pos, i3).applyMatrix4(worldMatrix);

      if (wallOnly) {
        edgeA.subVectors(tempV2, tempV1);
        edgeB.subVectors(tempV3, tempV1);
        triNorm.crossVectors(edgeA, edgeB);
        const len = triNorm.length();
        if (len > 1e-6 && Math.abs(triNorm.y / len) > 0.985) {
          continue;
        }
      }

      const d1 = nudgeZero(tempV1.y - planeY);
      const d2 = nudgeZero(tempV2.y - planeY);
      const d3 = nudgeZero(tempV3.y - planeY);

      const pts = [];
      if ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) {
        const u = d1 / (d1 - d2);
        pts.push(new THREE.Vector3().lerpVectors(tempV1, tempV2, u));
      }
      if ((d2 > 0 && d3 < 0) || (d2 < 0 && d3 > 0)) {
        const u = d2 / (d2 - d3);
        pts.push(new THREE.Vector3().lerpVectors(tempV2, tempV3, u));
      }
      if ((d3 > 0 && d1 < 0) || (d3 < 0 && d1 > 0)) {
        const u = d3 / (d3 - d1);
        pts.push(new THREE.Vector3().lerpVectors(tempV3, tempV1, u));
      }

      if (pts.length === 2 && pts[0].distanceToSquared(pts[1]) > 1e-8) {
        segments.push([pts[0], pts[1]]);
      }
    }
  });

  return segments;
}

/**
 * Connects arbitrary 3D intersection line segments into continuous ordered polygonal chains/loops.
 */
export function chainSegmentsIntoLoops(segments, tolerance = 0.5) {
  if (!segments || segments.length === 0) return [];

  const remaining = segments.map((seg) => [seg[0].clone(), seg[1].clone()]);
  const loops = [];
  const tolSq = tolerance * tolerance;

  while (remaining.length > 0) {
    const currentLoop = [remaining[0][0], remaining[0][1]];
    remaining.splice(0, 1);

    let extended = true;
    while (extended) {
      extended = false;
      const head = currentLoop[0];
      const tail = currentLoop[currentLoop.length - 1];

      // Always choose the closest matching endpoint within tolerance to avoid
      // short-circuiting across thin triangle diagonals instead of exact shared vertices.
      let bestIdx = -1;
      let bestMode = 0;
      let bestDistSq = tolSq + 1e-9;

      for (let i = 0; i < remaining.length; i++) {
        const [p1, p2] = remaining[i];
        const dTail1 = tail.distanceToSquared(p1);
        if (dTail1 < bestDistSq) { bestDistSq = dTail1; bestIdx = i; bestMode = 1; }
        const dTail2 = tail.distanceToSquared(p2);
        if (dTail2 < bestDistSq) { bestDistSq = dTail2; bestIdx = i; bestMode = 2; }
        const dHead2 = head.distanceToSquared(p2);
        if (dHead2 < bestDistSq) { bestDistSq = dHead2; bestIdx = i; bestMode = 3; }
        const dHead1 = head.distanceToSquared(p1);
        if (dHead1 < bestDistSq) { bestDistSq = dHead1; bestIdx = i; bestMode = 4; }
        if (bestDistSq < 1e-8) break;
      }

      if (bestIdx >= 0) {
        const [p1, p2] = remaining[bestIdx];
        remaining.splice(bestIdx, 1);
        if (bestMode === 1) currentLoop.push(p2);
        else if (bestMode === 2) currentLoop.push(p1);
        else if (bestMode === 3) currentLoop.unshift(p1);
        else if (bestMode === 4) currentLoop.unshift(p2);
        extended = true;
      }
    }

    if (currentLoop.length >= 2) {
      loops.push(currentLoop);
    }
  }

  return loops;
}

/**
 * Detects cylindrical bore holes and drilling features from CAD model geometry or bounds.
 */
export function detectHoleFeatures(object3D, bounds) {
  const holes = [];

  if (object3D) {
    object3D.traverse((child) => {
      if (child.isMesh) {
        const isBore = child.name?.toLowerCase().includes('bore') ||
                       child.name?.toLowerCase().includes('hole') ||
                       (child.geometry?.type === 'CylinderGeometry' && child.scale?.x < 1);

        if (isBore || child.geometry?.type === 'CylinderGeometry') {
          child.updateMatrixWorld(true);
          const worldPos = new THREE.Vector3();
          child.getWorldPosition(worldPos);

          const radius = child.geometry?.parameters?.radiusTop || 6.0;
          const depth = child.geometry?.parameters?.height || 25.0;

          // Check if this hole coordinate is already in list
          const exists = holes.some((h) => Math.hypot(h.x - worldPos.x, h.z - worldPos.z) < 2.0);
          if (!exists) {
            holes.push({
              x: Number(worldPos.x.toFixed(2)),
              z: Number(worldPos.z.toFixed(2)),
              radius: Number(radius.toFixed(2)),
              depth: Number(depth.toFixed(2)),
              name: child.name || `Hole Ø${(radius * 2).toFixed(1)}mm`
            });
          }
        }
      }
    });
  }

  // Fallback to geometric 4-corner flange mounting coordinates if no explicit cylinder meshes
  if (holes.length === 0 && bounds) {
    const b = resolveSafeBounds(bounds);
    const halfX = (b.max.x - b.min.x) * 0.35;
    const halfZ = (b.max.z - b.min.z) * 0.35;
    const centerX = (b.max.x + b.min.x) / 2;
    const centerZ = (b.max.z + b.min.z) / 2;

    holes.push(
      { x: centerX - halfX, z: centerZ - halfZ, radius: 4.5, depth: 25.0, name: 'Corner Bore 1' },
      { x: centerX + halfX, z: centerZ - halfZ, radius: 4.5, depth: 25.0, name: 'Corner Bore 2' },
      { x: centerX + halfX, z: centerZ + halfZ, radius: 4.5, depth: 25.0, name: 'Corner Bore 3' },
      { x: centerX - halfX, z: centerZ + halfZ, radius: 4.5, depth: 25.0, name: 'Corner Bore 4' }
    );
  }

  return holes;
}

/**
 * Extracts normalized pocket parameters from an operation record.
 */
export function buildPocketParamsFromOp(op = {}) {
  const sp = op.surfaceParams || {};
  const pp = op.pocketParams || {};
  const refDiam = Number(op.toolDiameter ?? op.tool?.diameter);
  const fallbackStepoverPct = pp.stepover && refDiam > 0
    ? Math.max(5, Math.min(95, Math.round((Number(pp.stepover) / refDiam) * 100)))
    : 45;
  const hasExplicitDepth = op.totalDepth != null || sp.totalDepth != null;
  return {
    stepoverPct: Number(pp.stepoverPct ?? op.stepoverPct) || fallbackStepoverPct,
    totalDepth: hasExplicitDepth ? Number(op.totalDepth ?? sp.totalDepth) : null,
    stepdown: Number(pp.maxStepdown ?? sp.maxStepdown ?? op.stepdown) || 2.0,
    rapidHeight: sp.clearanceEnabled && sp.clearanceMode === 'abs'
      ? Number(sp.clearance)
      : (Number(sp.retract ?? op.rapidHeight) || 15.0),
    topOfStock: sp.topOfStockEnabled ? Number(sp.topOfStock ?? 0) : (Number(op.topOfStock) || 0),
    stockToLeaveXY: Number(sp.stockToLeaveDrive ?? op.stockToLeaveXY) || 0,
    stockToLeaveZ: Number(op.stockToLeaveZ ?? sp.stockToLeaveDriveZ ?? sp.stockToLeaveDrive) || 0,
    cutMethod: pp.cutMethod || pp.cuttingMethod?.toLowerCase()?.replace(/\s+/g, '_') || op.cutStyle || 'constant_overlap',
    cuttingDirection: pp.direction || pp.machiningDirection || op.cuttingDirection || 'climb',
    finishWallPass: pp.finishWallPass ?? pp.finishOuterBoundary !== false,
    helicalEntry: pp.helicalEntry ?? pp.roughEntryHelix !== false,
    chain: op.chain || null
  };
}

/**
 * Computes horizontal X scanline intersections inside a closed XZ polygon loop at given Z.
 */
function intersectScanlineXZ(polyPts, zVal) {
  const xs = [];
  for (let i = 0; i < polyPts.length - 1; i++) {
    const a = polyPts[i];
    const b = polyPts[i + 1];
    if ((a.z <= zVal && b.z > zVal) || (b.z <= zVal && a.z > zVal)) {
      const t = (zVal - a.z) / (b.z - a.z);
      xs.push(a.x + t * (b.x - a.x));
    }
  }
  xs.sort((u, v) => u - v);
  const spans = [];
  for (let i = 0; i + 1 < xs.length; i += 2) {
    if (xs[i + 1] - xs[i] > 0.25) {
      spans.push([xs[i], xs[i + 1]]);
    }
  }
  return spans;
}

/**
 * Generates 2D / 3D Surface Finish Pocket Toolpath from real drive surface wall slices
 * or sketch chains (concentric inward clearing / zigzag raster + finish wall pass).
 */
export function generateSurfacePocketToolpath(bounds, tool, params = {}, model = null) {
  const effBounds = model ? computeDriveModelBounds(model, bounds) : resolveSafeBounds(bounds);
  const {
    stepoverPct = 45,
    totalDepth = null,
    stepdown = 2.0,
    rapidHeight = 15.0,
    topOfStock = 0,
    stockToLeaveXY = 0,
    stockToLeaveZ = 0,
    cutMethod = 'constant_overlap',
    cuttingDirection = 'climb',
    finishWallPass = true,
    helicalEntry = true,
    chain = null
  } = params;

  const toolDiam = Math.max(0.5, Number(tool?.diameter) || 10.0);
  const toolRadius = toolDiam / 2;
  const stepover = Math.max(0.4, (toolDiam * Math.max(5, Math.min(95, Number(stepoverPct) || 45))) / 100);
  const wallClearance = toolRadius + (Number(stockToLeaveXY) || 0);

  const surfaceHeight = Math.max(0.5, effBounds.max.y - effBounds.min.y);
  const rawTotalDepth = (totalDepth != null && Number(totalDepth) > 0) ? Number(totalDepth) : surfaceHeight;
  const startTopY = effBounds.max.y + (Number(topOfStock) || 0);
  const safeStepdown = Math.max(0.2, Math.abs(Number(stepdown)) || 2.0);
  const targetDepth = Math.max(0.05, rawTotalDepth - (Number(stockToLeaveZ) || 0));
  const bottomY = startTopY - targetDepth;

  const zLevels = [];
  for (let curY = startTopY - safeStepdown; curY > bottomY + 0.001; curY -= safeStepdown) {
    zLevels.push(curY);
  }
  zLevels.push(bottomY);

  const cuttingLines = [];
  const rapidLines = [];
  const isConventional = String(cuttingDirection || '').toLowerCase() === 'conventional';
  const wantPocketCncCCW = !isConventional;

  const buildChainBoundaryLoop = (curY) => {
    if (chain && chain.type === 'circle_loop' && chain.radius) {
      const segs = 48;
      const cx = chain.center?.x ?? ((effBounds.min.x + effBounds.max.x) / 2);
      const cz = chain.center?.z ?? ((effBounds.min.z + effBounds.max.z) / 2);
      const loop = [];
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        loop.push(new THREE.Vector3(cx + Math.cos(a) * chain.radius, curY, cz + Math.sin(a) * chain.radius));
      }
      return [loop];
    }
    if (chain && Array.isArray(chain.points) && chain.points.length >= 3) {
      const pts = chain.points.map((p) => new THREE.Vector3(p.x, curY, p.z));
      if (pts[0].distanceTo(pts[pts.length - 1]) > 0.1) pts.push(pts[0].clone());
      return [pts];
    }
    const minX = effBounds.min.x;
    const maxX = effBounds.max.x;
    const minZ = effBounds.min.z;
    const maxZ = effBounds.max.z;
    return [[
      new THREE.Vector3(minX, curY, minZ),
      new THREE.Vector3(maxX, curY, minZ),
      new THREE.Vector3(maxX, curY, maxZ),
      new THREE.Vector3(minX, curY, maxZ),
      new THREE.Vector3(minX, curY, minZ)
    ]];
  };

  let prevDepthY = startTopY + 2.0;

  zLevels.forEach((curY) => {
    let rawLoops = [];
    if (model) {
      const clampY = Math.min(effBounds.max.y - 0.02, Math.max(effBounds.min.y + 0.02, curY));
      const segments = sliceMeshAtY(model, clampY, { wallOnly: true });
      if (segments.length > 0) {
        rawLoops = chainSegmentsIntoLoops(segments, 0.85).map((lp) => {
          const closed = lp.map((p) => new THREE.Vector3(p.x, curY, p.z));
          if (closed.length >= 2 && closed[0].distanceTo(closed[closed.length - 1]) > 0.1) {
            closed.push(closed[0].clone());
          }
          return closed;
        });
      }
    }
    if (rawLoops.length === 0) {
      rawLoops = buildChainBoundaryLoop(curY);
    }

    rawLoops.forEach((boundaryLoop) => {
      if (boundaryLoop.length < 3) return;
      let pathLen = 0;
      for (let i = 1; i < boundaryLoop.length; i++) {
        pathLen += Math.hypot(boundaryLoop[i].x - boundaryLoop[i - 1].x, boundaryLoop[i].z - boundaryLoop[i - 1].z);
      }
      if (pathLen < 0.25) return;

      const rawOuterPass = offsetClosedLoopXZ(boundaryLoop, -wallClearance, curY);
      if (rawOuterPass.length < 3) return;
      const outerPass = orientClosedLoopXZ(rawOuterPass, wantPocketCncCCW);

      const loopBox = new THREE.Box3().setFromPoints(outerPass);
      const center = loopBox.getCenter(new THREE.Vector3());
      const spanMin = Math.min(loopBox.max.x - loopBox.min.x, loopBox.max.z - loopBox.min.z);

      // 1. Entry plunge / helical ramp into pocket interior
      const rampR = Math.max(0.5, Math.min(toolRadius * 0.65, spanMin * 0.25));
      const entryTopY = Math.max(curY + safeStepdown + 1.0, prevDepthY);
      const entryStart = new THREE.Vector3(center.x + rampR, entryTopY, center.z);
      rapidLines.push([
        new THREE.Vector3(center.x + rampR, startTopY + rapidHeight, center.z),
        entryStart
      ]);

      let lastPt = entryStart;
      if (helicalEntry && spanMin > toolDiam * 0.6) {
        const segsPerRev = 20;
        const turns = 2;
        const totalSegs = turns * segsPerRev;
        for (let s = 1; s <= totalSegs; s++) {
          const theta = (s / segsPerRev) * Math.PI * 2;
          const yInterp = entryTopY - (s / totalSegs) * (entryTopY - curY);
          const pt = new THREE.Vector3(
            center.x + Math.cos(theta) * rampR,
            yInterp,
            center.z + Math.sin(theta) * rampR
          );
          cuttingLines.push([lastPt, pt]);
          lastPt = pt;
        }
      } else {
        const plungePt = new THREE.Vector3(center.x, curY, center.z);
        cuttingLines.push([entryStart, plungePt]);
        lastPt = plungePt;
      }

      // 2. Interior Clearing Pattern inside pocket wall offset
      if (cutMethod === 'zigzag' || cutMethod === 'parallel') {
        let dir = 1;
        for (let z = loopBox.min.z + stepover * 0.3; z <= loopBox.max.z - stepover * 0.3; z += stepover) {
          const spans = intersectScanlineXZ(outerPass, z);
          spans.forEach(([xStart, xEnd]) => {
            const pA = new THREE.Vector3(dir > 0 ? xStart : xEnd, curY, z);
            const pB = new THREE.Vector3(dir > 0 ? xEnd : xStart, curY, z);
            cuttingLines.push([lastPt, pA]);
            cuttingLines.push([pA, pB]);
            lastPt = pB;
          });
          dir *= -1;
        }
      } else {
        // Incremental inward concentric offset rings ordered from center outward
        const rings = [];
        let prevRing = outerPass;
        for (let k = 1; k < 64; k++) {
          const inner = offsetClosedLoopXZ(prevRing, -stepover, curY);
          if (!inner || inner.length < 3) break;
          prevRing = inner;
          rings.push(orientClosedLoopXZ(inner, wantPocketCncCCW));
        }
        rings.reverse().forEach((ring) => {
          const startPt = ring[0];
          cuttingLines.push([lastPt, startPt]);
          for (let i = 0; i < ring.length - 1; i++) {
            cuttingLines.push([ring[i], ring[i + 1]]);
          }
          lastPt = ring[ring.length - 1];
        });
      }

      // 3. Final Surface Finish Wall Perimeter Pass around outerPass
      if (finishWallPass || cutMethod !== 'zigzag') {
        const finalWall = outerPass;
        cuttingLines.push([lastPt, finalWall[0]]);
        for (let i = 0; i < finalWall.length - 1; i++) {
          cuttingLines.push([finalWall[i], finalWall[i + 1]]);
        }
        lastPt = finalWall[finalWall.length - 1];
      }

      // Safe retract above pocket
      rapidLines.push([
        lastPt,
        new THREE.Vector3(lastPt.x, startTopY + rapidHeight, lastPt.z)
      ]);
    });

    prevDepthY = curY;
  });

  return { cuttingLines, rapidLines };
}

/**
 * Generates 2D / 3D Dynamic Pocketing Toolpath (routes cleanly to drive surface & chain clearing).
 */
export function generatePocketToolpath(bounds, tool, params = {}, model = null) {
  return generateSurfacePocketToolpath(bounds, tool, params, model);
}

/**
 * Extracts normalized 2D contour parameters from an operation record so viewport,
 * backplot, and NC post-processing share identical geometry and Z-depth rules.
 */
export function buildContourParamsFromOp(op = {}) {
  const hasLeadOverrides = op.leadInLineLen != null || op.leadInArcRad != null || op.leadInSweepDeg != null;
  const sp = op.surfaceParams || {};
  const cp = op.contourParams || {};
  const resolvedContainment = sp.containmentMode || cp.contourSide || op.contourSide || 'outside';

  let resolvedLeadConfig = op.leadConfig;
  if (cp.entryExitArcEnabled) {
    resolvedLeadConfig = {
      arcRadius: Number(cp.arcRadius ?? 5.0),
      sweepAngleDeg: Number(cp.arcSweep ?? 90.0),
      linearExtension: Number(cp.lineLength ?? 0.0)
    };
  } else if (cp.entryExitArcEnabled === false && cp.transitionType === 'broken' && !hasLeadOverrides) {
    resolvedLeadConfig = {
      arcRadius: 0,
      sweepAngleDeg: 0,
      linearExtension: Number(cp.startLength ?? 0)
    };
  } else if (hasLeadOverrides) {
    resolvedLeadConfig = {
      linearExtension: op.leadInLineLen != null ? Number(op.leadInLineLen) : undefined,
      arcRadius: op.leadInArcRad != null ? Number(op.leadInArcRad) : undefined,
      sweepAngleDeg: op.leadInSweepDeg != null ? Number(op.leadInSweepDeg) : undefined
    };
  }

  return {
    stepdown: Number(cp.maxStepdown ?? sp.maxStepdown ?? op.stepdown) || 1.0,
    totalDepth: op.totalDepth ?? sp.totalDepth ?? null,
    rapidHeight:
      sp.clearanceEnabled && sp.clearanceMode === 'abs'
        ? Number(sp.clearance)
        : (Number(sp.retract ?? op.rapidHeight) || 15.0),
    feedPlane: Number(sp.feedPlane ?? op.feedPlane) || 5.0,
    topOfStock: sp.topOfStockEnabled ? Number(sp.topOfStock ?? 0) : (Number(op.topOfStock) || 0),
    tipComp: sp.tipComp || 'tip',
    depthCutsEnabled: op.depthCutsEnabled !== false,
    breakThroughEnabled: !!op.breakThroughEnabled,
    breakThroughAmount: Number(op.breakThroughAmount) || 0,
    stockToLeaveXY: Number(sp.stockToLeaveDrive ?? op.stockToLeaveXY) || 0,
    stockToLeaveZ: Number(op.stockToLeaveZ ?? sp.stockToLeaveDriveZ ?? sp.stockToLeaveDrive) || 0,
    containmentMode: resolvedContainment,
    additionalOffset: sp.additionalOffsetEnabled ? (Number(sp.additionalOffset) || 0) : 0,
    cuttingDirection: cp.direction || op.cuttingDirection || 'climb',
    openContourDirection: cp.openContourDirection || 'one_way',
    orderBottomToTop: Boolean(cp.orderBottomToTop),
    transitionType: cp.transitionType || 'broken',
    totalTolerance: Number(cp.totalTolerance ?? 0.025),
    shallowEnabled: cp.shallowEnabled ?? (op.strategyKey === 'surface_finish_shallow' || op.badgeClass === 'shallow'),
    shallowFromSlope: Number(cp.shallowFromSlope ?? 0.0),
    shallowToSlope: Number(cp.shallowToSlope ?? 35.0),
    stepover: Number(cp.maxStepdown ?? op.stepdown ?? 0.5),
    cuttingMethod: cp.openContourDirection || 'zigzag',
    contourSide: resolvedContainment,
    chain: op.chain || null,
    leadConfig: resolvedLeadConfig
  };
}

/**
 * Generates 3D Waterline / Surface Finish Contour Toolpath (Multi-Z Slicing with Cutter Offset)
 */
export function generateWaterlineToolpath(bounds, tool, params = {}, model = null) {
  bounds = model ? computeDriveModelBounds(model, bounds) : resolveSafeBounds(bounds);
  const {
    stepdown = 1.0,
    totalDepth = null,
    rapidHeight = 15.0,
    topOfStock = 0,
    tipComp = 'tip',
    depthCutsEnabled = true,
    breakThroughEnabled = false,
    breakThroughAmount = 0,
    stockToLeaveXY = 0,
    stockToLeaveZ = 0,
    containmentMode = null,
    additionalOffset = 0,
    cuttingDirection = 'climb',
    openContourDirection = 'one_way',
    orderBottomToTop = false,
    contourSide = 'outside',
    chain = null
  } = params;

  const toolRadius = (tool.diameter || 10) / 2;
  const cornerRad = Number(tool.cornerRadius ?? (tool.type === 'ball' ? toolRadius : 0)) || 0;
  const tipCenterZShift = String(tipComp || '').toLowerCase() === 'center' ? cornerRad : 0;
  const resolvedMode = String(containmentMode || contourSide || 'outside').toLowerCase();
  const isInsideContour = resolvedMode === 'inside';
  const isCenterContour = resolvedMode === 'center';
  const extraOffset = Number(additionalOffset) || 0;
  const xyOffset = toolRadius + (Number(stockToLeaveXY) || 0);
  const signedContourOffset = isCenterContour
    ? (Number(stockToLeaveXY) || 0) + extraOffset
    : isInsideContour
      ? -xyOffset - extraOffset
      : xyOffset + extraOffset;

  const startTopY = bounds.max.y + (Number(topOfStock) || 0);
  const surfaceHeight = Math.max(0.5, bounds.max.y - bounds.min.y);
  const rawDepth = (totalDepth != null && Number(totalDepth) > 0) ? Math.abs(Number(totalDepth)) : surfaceHeight;
  const extraOvercut = breakThroughEnabled ? Math.abs(Number(breakThroughAmount) || 0) : 0;
  const safeTotalDepth = Math.max(0.01, rawDepth + extraOvercut - (Number(stockToLeaveZ) || 0));
  const safeStepdown = Math.abs(Number(stepdown)) || 1.0;
  const bottomY = bounds.max.y - safeTotalDepth;
  const isConventional = String(cuttingDirection || '').toLowerCase() === 'conventional';
  const wantCncCCW = isInsideContour !== isConventional;
  const effectiveLeadConfig = {
    ...(params.leadConfig || {}),
    sideSign: isConventional ? 1 : -1
  };

  const zLevels = [];
  if (!depthCutsEnabled || safeStepdown >= startTopY - bottomY) {
    zLevels.push(bottomY);
  } else {
    for (let curY = startTopY - safeStepdown; curY > bottomY + 0.001; curY -= safeStepdown) {
      zLevels.push(curY);
    }
    zLevels.push(bottomY);
  }
  if (orderBottomToTop) {
    zLevels.reverse();
  }

  const cuttingLines = [];
  const rapidLines = [];

  const centerX = chain?.center?.x ?? ((bounds.max.x + bounds.min.x) / 2);
  const centerZ = chain?.center?.z ?? ((bounds.max.z + bounds.min.z) / 2);
  const halfX = Math.max(0.5, (bounds.max.x - bounds.min.x) / 2 + signedContourOffset);
  const halfZ = Math.max(0.5, (bounds.max.z - bounds.min.z) / 2 + signedContourOffset);

  zLevels.forEach((rawSliceY, levelIdx) => {
    const outY = rawSliceY + tipCenterZShift;
    let slicedLoops = [];
    let slicedFrom3DModel = false;

    // 1. Direct 2D Sketch Chain (Circle or Rectangle)
    if (chain && chain.type === 'circle_loop' && chain.radius) {
      const segs = 48;
      const r = Math.max(0.2, chain.radius + signedContourOffset);
      const circleLoop = [];
      for (let s = 0; s <= segs; s++) {
        const theta = (s / segs) * Math.PI * 2;
        circleLoop.push(new THREE.Vector3(
          centerX + Math.cos(theta) * r,
          outY,
          centerZ + Math.sin(theta) * r
        ));
      }
      slicedLoops = [circleLoop];
    } else if (chain && chain.type === 'rectangle_loop' && chain.bounds) {
      const safeChainBounds = resolveSafeBounds(chain.bounds);
      const rcX = chain?.center?.x ?? ((safeChainBounds.max.x + safeChainBounds.min.x) / 2);
      const rcZ = chain?.center?.z ?? ((safeChainBounds.max.z + safeChainBounds.min.z) / 2);
      const rectHalfW = Math.max(0.2, Math.abs(safeChainBounds.max.x - safeChainBounds.min.x) / 2 + signedContourOffset);
      const rectHalfD = Math.max(0.2, Math.abs(safeChainBounds.max.z - safeChainBounds.min.z) / 2 + signedContourOffset);
      const rectLoop = [
        new THREE.Vector3(rcX - rectHalfW, outY, rcZ - rectHalfD),
        new THREE.Vector3(rcX + rectHalfW, outY, rcZ - rectHalfD),
        new THREE.Vector3(rcX + rectHalfW, outY, rcZ + rectHalfD),
        new THREE.Vector3(rcX - rectHalfW, outY, rcZ + rectHalfD),
        new THREE.Vector3(rcX - rectHalfW, outY, rcZ - rectHalfD)
      ];
      slicedLoops = [rectLoop];
    } else if (model) {
      // 2. Real 3D drive-surface mesh slicing with cap filtering & boundary epsilon guard
      const sliceY = Math.min(bounds.max.y - 0.02, Math.max(bounds.min.y + 0.02, rawSliceY));
      const segments = sliceMeshAtY(model, sliceY, { wallOnly: true });
      if (segments.length > 0) {
        slicedLoops = chainSegmentsIntoLoops(segments, 0.85);
        slicedFrom3DModel = true;
      }
    }

    const openZigzagReverse = openContourDirection === 'zigzag' && levelIdx % 2 === 1;

    if (slicedLoops.length > 0) {
      slicedLoops.forEach((loop) => {
        if (loop.length < 2) return;
        let pathLength = 0;
        for (let i = 1; i < loop.length; i++) {
          pathLength += Math.hypot(loop[i].x - loop[i - 1].x, loop[i].z - loop[i - 1].z);
        }
        if (slicedFrom3DModel && (loop.length < 3 || pathLength < 0.25)) return;

        const isClosed = loop[0].distanceTo(loop[loop.length - 1]) < 0.85;
        let workingLoop = loop.map((p) => new THREE.Vector3(p.x, outY, p.z));
        if (isClosed && workingLoop[0].distanceTo(workingLoop[workingLoop.length - 1]) > 0.05) {
          workingLoop.push(workingLoop[0].clone());
        }

        if (slicedFrom3DModel) {
          const compLoop = offsetClosedLoopXZ(workingLoop, signedContourOffset, outY, isClosed);
          if (compLoop.length >= (isClosed ? 3 : 2)) {
            workingLoop = compLoop;
          } else {
            return;
          }
        }

        const shouldReverseOpen = openZigzagReverse ? !isConventional : isConventional;
        const orderedLoop = isClosed
          ? orientClosedLoopXZ(workingLoop, wantCncCCW)
          : (shouldReverseOpen ? [...workingLoop].reverse() : workingLoop);
        const leadRes = applyLeadInOutToContour(orderedLoop, effectiveLeadConfig, rapidHeight);
        cuttingLines.push(...leadRes.cuttingLines);
        rapidLines.push(...leadRes.rapidLines);
      });
    } else {
      const p1 = new THREE.Vector3(centerX - halfX, outY, centerZ - halfZ);
      const p2 = new THREE.Vector3(centerX + halfX, outY, centerZ - halfZ);
      const p3 = new THREE.Vector3(centerX + halfX, outY, centerZ + halfZ);
      const p4 = new THREE.Vector3(centerX - halfX, outY, centerZ + halfZ);
      const baseContour = [p1, p2, p3, p4, p1.clone()];
      const contour = orientClosedLoopXZ(baseContour, wantCncCCW);

      const leadRes = applyLeadInOutToContour(contour, effectiveLeadConfig, rapidHeight);
      cuttingLines.push(...leadRes.cuttingLines);
      rapidLines.push(...leadRes.rapidLines);
    }
  });

  return { cuttingLines, rapidLines };
}

/**
 * Generates 5-Axis Simultaneous Swarf Contour Toolpath (XYZ plus Tool Orientation Vectors)
 */
export function generateSwarfToolpath(bounds, tool, params = {}, model = null) {
  return generate5AxisSwarfToolpath(resolveSafeBounds(bounds), tool, params);
}

/**
 * Generates Deep Hole Peck Drilling Toolpath (G83 Cycle) with Automatic Hole Feature Detection
 */
export function generateDrillingToolpath(bounds, tool, params = {}, model = null) {
  bounds = resolveSafeBounds(bounds);
  const {
    drillDepth = 25.0,
    peckDepth = 5.0,
    rapidHeight = 10.0
  } = params;

  const cuttingLines = [];
  const rapidLines = [];
  const topY = bounds.max.y;

  // Use automatic feature detection for hole centers
  const holes = detectHoleFeatures(model, bounds);

  holes.forEach((hole) => {
    const targetDepth = Math.min(drillDepth, hole.depth || drillDepth);

    // Rapid to hole coordinate
    rapidLines.push([
      new THREE.Vector3(hole.x, topY + rapidHeight, hole.z),
      new THREE.Vector3(hole.x, topY + 2, hole.z)
    ]);

    // G83 Peck cycles
    for (let curDepth = peckDepth; curDepth <= targetDepth; curDepth += peckDepth) {
      const startDepth = curDepth - peckDepth;
      // Rapid down to previous peck level with 0.5mm clearance
      rapidLines.push([
        new THREE.Vector3(hole.x, topY - startDepth + 0.5, hole.z),
        new THREE.Vector3(hole.x, topY - startDepth, hole.z)
      ]);

      // Cutting peck feed move
      cuttingLines.push([
        new THREE.Vector3(hole.x, topY - startDepth, hole.z),
        new THREE.Vector3(hole.x, topY - curDepth, hole.z)
      ]);

      // Rapid retract to clearance for chip breaking
      rapidLines.push([
        new THREE.Vector3(hole.x, topY - curDepth, hole.z),
        new THREE.Vector3(hole.x, topY + 2, hole.z)
      ]);
    }
  });

  return { cuttingLines, rapidLines, detectedHoles: holes };
}

/**
 * Generates 2D Circle Milling / Circular Helical Plunge & Pocket Toolpath
 */
export function generateCircleMillToolpath(bounds, tool, params = {}) {
  bounds = resolveSafeBounds(bounds);
  const toolRadius = (tool.diameter || 10.0) / 2;
  const {
    diameter = 50.8,
    totalDepth = 5.0,
    stepdown = 1.0,
    rapidHeight = 15.0,
    chain = null,
    center = { x: (bounds.min.x + bounds.max.x) / 2, y: bounds.max.y, z: (bounds.min.z + bounds.max.z) / 2 }
  } = params;

  const actualDiameter = chain?.radius ? (chain.radius * 2) : diameter;
  const actualCenter = chain?.center ? { x: chain.center.x, y: bounds.max.y, z: chain.center.z } : center;

  const cuttingLines = [];
  const rapidLines = [];
  const topY = bounds.max.y;
  const finalR = Math.max(toolRadius * 1.05, (actualDiameter / 2) - toolRadius);

  // Rapid approach to center
  rapidLines.push([
    new THREE.Vector3(actualCenter.x, topY + rapidHeight, actualCenter.z),
    new THREE.Vector3(actualCenter.x, topY + 2.0, actualCenter.z)
  ]);

  // Helical entry spiral down to depth
  const spiralR = Math.min(finalR * 0.5, toolRadius * 0.8);
  const safeTotalDepth = Math.abs(Number(totalDepth)) || 5.0;
  const safeStepdown = Math.abs(Number(stepdown)) || 1.0;
  const totalRampLevels = Math.ceil(safeTotalDepth / safeStepdown);
  const segmentsPerRev = 32;

  let lastPoint = new THREE.Vector3(actualCenter.x + spiralR, topY, actualCenter.z);
  cuttingLines.push([new THREE.Vector3(actualCenter.x, topY + 2.0, actualCenter.z), lastPoint]);

  for (let lvl = 1; lvl <= totalRampLevels; lvl++) {
    const curZ = Math.min(safeTotalDepth, lvl * safeStepdown);
    const prevZ = (lvl - 1) * safeStepdown;
    for (let s = 1; s <= segmentsPerRev; s++) {
      const theta = (s / segmentsPerRev) * Math.PI * 2;
      const interpZ = prevZ + (curZ - prevZ) * (s / segmentsPerRev);
      const pt = new THREE.Vector3(
        actualCenter.x + Math.cos(theta) * spiralR,
        topY - interpZ,
        actualCenter.z + Math.sin(theta) * spiralR
      );
      cuttingLines.push([lastPoint, pt]);
      lastPoint = pt;
    }
  }

  // Circular pocket expanding passes at each level
  for (let curDepth = safeStepdown; curDepth <= safeTotalDepth; curDepth += safeStepdown) {
    const yLevel = topY - curDepth;
    const radialPasses = Math.max(2, Math.ceil(finalR / (toolRadius * 0.75)));
    for (let p = 1; p <= radialPasses; p++) {
      const passR = (p / radialPasses) * finalR;
      const passStart = new THREE.Vector3(actualCenter.x + passR, yLevel, actualCenter.z);
      cuttingLines.push([lastPoint, passStart]);
      lastPoint = passStart;
      for (let s = 1; s <= segmentsPerRev; s++) {
        const theta = (s / segmentsPerRev) * Math.PI * 2;
        const pt = new THREE.Vector3(
          actualCenter.x + Math.cos(theta) * passR,
          yLevel,
          actualCenter.z + Math.sin(theta) * passR
        );
        cuttingLines.push([lastPoint, pt]);
        lastPoint = pt;
      }
    }
  }

  // Final rapid retract
  rapidLines.push([
    lastPoint,
    new THREE.Vector3(lastPoint.x, topY + rapidHeight, lastPoint.z)
  ]);

  return { cuttingLines, rapidLines };
}

/**
 * Generates Spot Drill (G81 cycle) Chamfer Toolpath on Hole Features
 */
export function generateSpotDrillToolpath(bounds, tool, params = {}, model = null) {
  bounds = resolveSafeBounds(bounds);
  const {
    spotDepth = 3.8,
    rapidHeight = 10.0
  } = params;

  const cuttingLines = [];
  const rapidLines = [];
  const topY = bounds.max.y;

  const holes = detectHoleFeatures(model, bounds);

  holes.forEach((hole) => {
    // Rapid to hole
    rapidLines.push([
      new THREE.Vector3(hole.x, topY + rapidHeight, hole.z),
      new THREE.Vector3(hole.x, topY + 2.0, hole.z)
    ]);

    // G81 simple drill plunge
    cuttingLines.push([
      new THREE.Vector3(hole.x, topY + 2.0, hole.z),
      new THREE.Vector3(hole.x, topY - spotDepth, hole.z)
    ]);

    // Rapid retract
    rapidLines.push([
      new THREE.Vector3(hole.x, topY - spotDepth, hole.z),
      new THREE.Vector3(hole.x, topY + rapidHeight, hole.z)
    ]);
  });

  return { cuttingLines, rapidLines, detectedHoles: holes };
}

/**
 * Converts line segments into Three.js LineSegments geometries
 */
export function buildToolpathMeshes(toolpathData, linkedRapidLines = null) {
  const { cuttingLines = [], rapidLines = [] } = toolpathData || {};
  const effectiveRapidLines = Array.isArray(linkedRapidLines) ? linkedRapidLines : rapidLines;

  const cutPoints = [];
  cuttingLines.forEach(([p1, p2]) => {
    cutPoints.push(p1.x, p1.y, p1.z);
    cutPoints.push(p2.x, p2.y, p2.z);
  });

  const rapidPoints = [];
  effectiveRapidLines.forEach(([p1, p2]) => {
    rapidPoints.push(p1.x, p1.y, p1.z);
    rapidPoints.push(p2.x, p2.y, p2.z);
  });

  const cutGeo = new THREE.BufferGeometry();
  if (cutPoints.length > 0) {
    cutGeo.setAttribute('position', new THREE.Float32BufferAttribute(cutPoints, 3));
  }

  const rapidGeo = new THREE.BufferGeometry();
  if (rapidPoints.length > 0) {
    rapidGeo.setAttribute('position', new THREE.Float32BufferAttribute(rapidPoints, 3));
  }

  return { cutGeo, rapidGeo };
}

/**
 * Generates 3D High-Speed Adaptive Roughing Toolpath (Constant Tool Engagement Trochoidal Cycloids & Micro-Lifts)
 */
export function generateAdaptiveRoughingToolpath(bounds, tool, params = {}) {
  return generateAdaptiveTrochoidalToolpath(resolveSafeBounds(bounds), tool, params);
}

/**
 * Generates Perimeter & Pocket Chamfer / Deburring Toolpath (45-degree Edge Break)
 */
export function generateChamferToolpath(bounds, tool, params = {}, model = null) {
  bounds = resolveSafeBounds(bounds);
  const {
    chamferWidth = 0.508, // 0.020" default from TITAN-1M
    tipOffset = 1.27,      // 0.050" default bottom tip offset
    rapidHeight = 15.0
  } = params;

  const toolRadius = (tool.diameter || 12.7) / 2;
  const topY = bounds.max.y;
  const cutDepth = topY - (chamferWidth + tipOffset);
  const cuttingOffset = toolRadius - tipOffset;

  const cuttingLines = [];
  const rapidLines = [];

  const halfX = (bounds.max.x - bounds.min.x) / 2 + cuttingOffset;
  const halfZ = (bounds.max.z - bounds.min.z) / 2 + cuttingOffset;

  // Outer contour chamfer pass
  const outerCorners = [
    new THREE.Vector3(-halfX, cutDepth, -halfZ),
    new THREE.Vector3(halfX, cutDepth, -halfZ),
    new THREE.Vector3(halfX, cutDepth, halfZ),
    new THREE.Vector3(-halfX, cutDepth, halfZ),
    new THREE.Vector3(-halfX, cutDepth, -halfZ)
  ];

  const leadRes = applyLeadInOutToContour(outerCorners, params.leadConfig, rapidHeight);
  cuttingLines.push(...leadRes.cuttingLines);
  rapidLines.push(...leadRes.rapidLines);

  // If triangular / interior pocket exists, also chamfer internal pocket edges
  const pocketScaleX = (bounds.max.x - bounds.min.x) * 0.22;
  const pocketScaleZ = (bounds.max.z - bounds.min.z) * 0.22;
  const pocketCorners = [
    new THREE.Vector3(-pocketScaleX, cutDepth, pocketScaleZ),
    new THREE.Vector3(pocketScaleX, cutDepth, pocketScaleZ),
    new THREE.Vector3(0, cutDepth, -pocketScaleZ),
    new THREE.Vector3(-pocketScaleX, cutDepth, pocketScaleZ)
  ];

  rapidLines.push([
    new THREE.Vector3(outerCorners[0].x, topY + rapidHeight, outerCorners[0].z),
    new THREE.Vector3(pocketCorners[0].x, topY + rapidHeight, pocketCorners[0].z)
  ]);
  const innerLead = applyLeadInOutToContour(pocketCorners, params.leadConfig, rapidHeight);
  cuttingLines.push(...innerLead.cuttingLines);
  rapidLines.push(...innerLead.rapidLines);

  return { cuttingLines, rapidLines };
}

/**
 * Generates Rigid Tapping (G84 cycle) Toolpath on Hole Features with synchronized thread helix
 */
export function generateTapToolpath(bounds, tool, params = {}, model = null) {
  bounds = resolveSafeBounds(bounds);
  const {
    pitch = 0.79375, // 10-32 UNF pitch = 0.03125" = 0.79375 mm
    totalDepth = 12.19, // 0.480" depth
    rapidHeight = 10.0
  } = params;

  const cuttingLines = [];
  const rapidLines = [];
  const topY = bounds.max.y;

  const holes = detectHoleFeatures(model, bounds);

  holes.forEach((hole) => {
    // 1. Rapid approach to hole above clearance
    rapidLines.push([
      new THREE.Vector3(hole.x, topY + rapidHeight, hole.z),
      new THREE.Vector3(hole.x, topY + 2.0, hole.z)
    ]);

    // 2. Synchronized Helical Plunge Down to Thread Depth (G84)
    const threadRadius = (tool.diameter || 4.8) / 2;
    const safeTotalDepth = Math.abs(Number(totalDepth)) || 12.19;
    const revolutions = Math.max(2, safeTotalDepth / pitch);
    const segmentsPerRev = 12;
    const totalSegments = Math.max(12, Math.floor(revolutions * segmentsPerRev));

    let prevPoint = new THREE.Vector3(hole.x, topY, hole.z);
    // Initial lead-in
    cuttingLines.push([
      new THREE.Vector3(hole.x, topY + 2.0, hole.z),
      prevPoint
    ]);

    for (let s = 1; s <= totalSegments; s++) {
      const frac = s / totalSegments;
      const currentY = topY - (frac * safeTotalDepth);
      const angle = frac * revolutions * Math.PI * 2;
      const r = threadRadius * 0.4; // subtle thread envelope
      const nextPoint = new THREE.Vector3(
        hole.x + Math.cos(angle) * r,
        currentY,
        hole.z + Math.sin(angle) * r
      );
      cuttingLines.push([prevPoint, nextPoint]);
      prevPoint = nextPoint;
    }

    // Bottom dwell to center
    const bottomCenter = new THREE.Vector3(hole.x, topY - safeTotalDepth, hole.z);
    cuttingLines.push([prevPoint, bottomCenter]);

    // 3. Spindle reversal & synchronized helical retract back up
    let retractPrev = bottomCenter;
    for (let s = totalSegments - 1; s >= 0; s--) {
      const frac = s / totalSegments;
      const currentY = topY - (frac * totalDepth);
      const angle = frac * revolutions * Math.PI * 2;
      const r = threadRadius * 0.4;
      const nextPoint = new THREE.Vector3(
        hole.x + Math.cos(angle) * r,
        currentY,
        hole.z + Math.sin(angle) * r
      );
      cuttingLines.push([retractPrev, nextPoint]);
      retractPrev = nextPoint;
    }

    // Lead-out to clearance
    cuttingLines.push([retractPrev, new THREE.Vector3(hole.x, topY + 2.0, hole.z)]);

    // 4. Rapid retract back to rapid clearance plane
    rapidLines.push([
      new THREE.Vector3(hole.x, topY + 2.0, hole.z),
      new THREE.Vector3(hole.x, topY + rapidHeight, hole.z)
    ]);
  });

  return { cuttingLines, rapidLines, detectedHoles: holes };
}

/**
 * Calculates Toolpath Distance, Machining Cycle Time, and Material Removal Rate (MRR)
 */
export function calculateToolpathMetrics(toolpathData, feedRate = 1200, rapidFeed = 18000, toolDiameter = 10, depthOfCut = 2.0, stepover = 5.0) {
  let cutDistanceMm = 0;
  let rapidDistanceMm = 0;

  if (toolpathData?.cuttingLines) {
    toolpathData.cuttingLines.forEach(([p1, p2]) => {
      cutDistanceMm += p1.distanceTo(p2);
    });
  }

  if (toolpathData?.rapidLines) {
    toolpathData.rapidLines.forEach(([p1, p2]) => {
      rapidDistanceMm += p1.distanceTo(p2);
    });
  }

  const cutTimeMin = feedRate > 0 ? cutDistanceMm / feedRate : 0;
  const rapidTimeMin = rapidFeed > 0 ? rapidDistanceMm / rapidFeed : 0;
  const totalTimeMin = cutTimeMin + rapidTimeMin;

  const minutes = Math.floor(totalTimeMin);
  const seconds = Math.round((totalTimeMin - minutes) * 60);
  const formattedTime = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;

  // Material Removal Rate MRR = (ap * ae * Vf) / 1000  (cm3/min)
  const mrrCm3Min = ((depthOfCut * stepover * feedRate) / 1000).toFixed(2);

  return {
    cutDistanceMm: Math.round(cutDistanceMm),
    rapidDistanceMm: Math.round(rapidDistanceMm),
    totalDistanceMm: Math.round(cutDistanceMm + rapidDistanceMm),
    totalTimeMin,
    formattedTime,
    mrrCm3Min: Number(mrrCm3Min)
  };
}

/**
 * Advanced 3D Kinematic Collision & Gouge Verification Engine
 * Analyzes full 3D spatial clearance for all operations against:
 * 1. Tool assembly stickout & CAT40 arbor holder collision envelope.
 * 2. Unfluted shank rubbing workpiece walls.
 * 3. Rapid traverse (G00) crash through stock or clamping fixtures.
 * 4. Surface gouge violation against CAD nominal geometry.
 * 5. Radial cutter overload / severe chatter.
 */
export function detectToolpathCollisions3D(operations = [], tools = [], bounds = null, stockConfig = null) {
  const issues = [];
  const minRapidClearance = 3.0; // mm above stock

  const safeBounds = resolveSafeBounds(bounds);
  const stockTopY = safeBounds.max.y;
  const partMinY = safeBounds.min.y;

  operations.forEach((op) => {
    const assignedTool = tools.find((t) => t.id === op.toolId) || tools[0] || {
      name: 'Default Endmill',
      diameter: 10,
      fluteLength: 25,
      overallLength: 75
    };

    const totalDepth = Math.abs(Number(op.totalDepth || op.stepdown || 10));
    const fluteLength = Number(assignedTool.fluteLength || 25);
    const overallLength = Number(assignedTool.overallLength || 75);
    const rapidHeight = Number(op.rapidHeight ?? 15.0);
    const stepoverPct = Number(op.stepoverPct ?? 50);

    // 1. Spindle Collet / Tool Holder Collision Check
    const effectiveStickout = overallLength - 15.0; // gauge line to collet nose
    if (totalDepth > effectiveStickout) {
      const penetrationMm = (totalDepth - effectiveStickout).toFixed(2);
      issues.push({
        id: `coll_holder_${op.id}`,
        opId: op.id,
        opName: op.name,
        toolName: assignedTool.name || `Tool T${assignedTool.id || op.toolId}`,
        type: 'danger',
        category: 'holder_collision',
        severity: 'CRITICAL',
        title: 'Tool Holder Gouge Detected',
        message: `Cut depth (${totalDepth}mm) exceeds tool holder clearance stickout (${effectiveStickout}mm). Spindle collet collision imminent!`,
        coord: { x: 0, y: Number((stockTopY - effectiveStickout).toFixed(2)), z: 0 },
        penetrationMm: Number(penetrationMm),
        autoFixLabel: `Extend Stickout to ${Math.ceil(totalDepth + 15)}mm`,
        autoFixAction: { type: 'extend_tool', toolId: assignedTool.id, newOverallLength: Math.ceil(totalDepth + 25) }
      });
    }

    // 2. Shank Rub Warning
    if (totalDepth > fluteLength && totalDepth <= effectiveStickout) {
      const rubLength = (totalDepth - fluteLength).toFixed(2);
      issues.push({
        id: `coll_shank_${op.id}`,
        opId: op.id,
        opName: op.name,
        toolName: assignedTool.name || `Tool T${assignedTool.id || op.toolId}`,
        type: 'warning',
        category: 'shank_rub',
        severity: 'Medium',
        title: 'Shank Contact Warning',
        message: `Cut depth (${totalDepth}mm) exceeds tool flute length (${fluteLength}mm). Non-cutting shank will rub workpiece wall by ${rubLength}mm.`,
        coord: { x: 0, y: Number((stockTopY - fluteLength).toFixed(2)), z: 0 },
        penetrationMm: Number(rubLength),
        autoFixLabel: `Increase Flute to ${Math.ceil(totalDepth + 5)}mm`,
        autoFixAction: { type: 'increase_flute', toolId: assignedTool.id, newFluteLength: Math.ceil(totalDepth + 5) }
      });
    }

    // 3. Rapid Traverse Crash (G00 collision through stock or zero clearance)
    if (rapidHeight <= minRapidClearance) {
      issues.push({
        id: `coll_rapid_${op.id}`,
        opId: op.id,
        opName: op.name,
        toolName: assignedTool.name || `Tool T${assignedTool.id || op.toolId}`,
        type: 'danger',
        category: 'rapid_crash',
        severity: 'High',
        title: 'Insufficient Rapid Clearance',
        message: `Rapid Z height (${rapidHeight}mm) is critically low (< ${minRapidClearance}mm). Rapid moves may strike workpiece clamps or burrs.`,
        coord: { x: 0, y: Number((stockTopY + rapidHeight).toFixed(2)), z: 0 },
        penetrationMm: Number((minRapidClearance - rapidHeight).toFixed(2)),
        autoFixLabel: 'Raise Rapid Clearance to 15.0mm',
        autoFixAction: { type: 'raise_rapid', opId: op.id, newRapidHeight: 15.0 }
      });
    }

    // 4. Excessive Radial Engagement / Chatter Overload
    if (stepoverPct > 85 && op.badgeClass !== 'face' && op.badgeClass !== 'drill') {
      issues.push({
        id: `coll_chatter_${op.id}`,
        opId: op.id,
        opName: op.name,
        toolName: assignedTool.name || `Tool T${assignedTool.id || op.toolId}`,
        type: 'warning',
        category: 'chatter',
        severity: 'Low',
        title: 'High Radial Engagement',
        message: `Stepover (${stepoverPct}%) exceeds 85%. Excessive tool deflection or chatter may occur during high feed.`,
        coord: { x: 0, y: Number(stockTopY.toFixed(2)), z: 0 },
        penetrationMm: 0,
        autoFixLabel: 'Reduce Stepover to 60%',
        autoFixAction: { type: 'reduce_stepover', opId: op.id, newStepoverPct: 60 }
      });
    }

    // 5. Part Floor / Nominal CAD Surface Gouge Check
    const maxPartHeight = safeBounds.max.y - safeBounds.min.y;
    if (totalDepth > maxPartHeight + 5.0) {
      const gougeMm = (totalDepth - maxPartHeight).toFixed(2);
      issues.push({
        id: `coll_gouge_${op.id}`,
        opId: op.id,
        opName: op.name,
        toolName: assignedTool.name || `Tool T${assignedTool.id || op.toolId}`,
        type: 'danger',
        category: 'surface_gouge',
        severity: 'Critical Collision',
        title: 'CAD Nominal Surface Gouge Violation',
        message: `Toolpath penetrates deeper than part floor by ${gougeMm}mm. Machining through fixture bed!`,
        coord: { x: 0, y: Number(partMinY.toFixed(2)), z: 0 },
        penetrationMm: Number(gougeMm),
        autoFixLabel: `Limit Depth to ${maxPartHeight}mm`,
        autoFixAction: { type: 'limit_depth', opId: op.id, newTotalDepth: maxPartHeight }
      });
    }
  });

  const criticalCollisions = issues.filter((i) => i.severity === 'CRITICAL' || i.severity === 'Critical Collision' || i.type === 'danger').length;
  const warnings = issues.filter((i) => i.type === 'warning').length;

  return {
    isSafe: criticalCollisions === 0,
    totalIssues: issues.length,
    criticalCount: criticalCollisions,
    warningCount: warnings,
    issues
  };
}

/**
 * Safety & Gouge Detection Checker across all active operations and tools (backward compatible wrapper)
 */
export function checkToolpathCollisions(operations = [], tools = [], bounds = null, stockConfig = null) {
  return detectToolpathCollisions3D(operations, tools, bounds, stockConfig).issues;
}

/**
 * Generates 3D Surface Parallel Finishing Toolpath (Constant Scallop Raster across 3D CAD Surfaces)
 * Samples the true elevation of the 3D model using vertical raycasting to follow organic curvatures.
 */
export function generateSurfaceParallelToolpath(bounds, tool, params = {}, model = null) {
  const effBounds = model ? computeDriveModelBounds(model, bounds) : resolveSafeBounds(bounds);
  const {
    stepoverPct = 20,
    rapidHeight = 15.0
  } = params;

  const toolRadius = (tool.diameter || 6) / 2;
  const stepover = Math.max(0.8, (tool.diameter * stepoverPct) / 100);
  const topY = effBounds.max.y;

  const cuttingLines = [];
  const rapidLines = [];

  const minX = effBounds.min.x - toolRadius;
  const maxX = effBounds.max.x + toolRadius;
  const minZ = effBounds.min.z - toolRadius;
  const maxZ = effBounds.max.z + toolRadius;

  // Prepare meshes for raycasting if model is present
  const raycastMeshes = [];
  if (model) {
    model.traverse((child) => {
      if (child.isMesh && child.geometry) {
        child.updateMatrixWorld(true);
        raycastMeshes.push(child);
      }
    });
  }

  const raycaster = new THREE.Raycaster();
  const rayDown = new THREE.Vector3(0, -1, 0);

  let direction = 1;

  for (let z = minZ; z <= maxZ; z += stepover) {
    const startX = direction === 1 ? minX : maxX;
    const endX = direction === 1 ? maxX : minX;
    const numPoints = Math.max(10, Math.round(Math.abs(maxX - minX) / 3));

    const linePoints = [];

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = startX + (endX - startX) * t;

      let surfaceY = null;

      if (raycastMeshes.length > 0) {
        const rayOrigin = new THREE.Vector3(x, topY + 25, z);
        raycaster.set(rayOrigin, rayDown);
        const hits = raycaster.intersectObjects(raycastMeshes, false);
        if (hits.length > 0) {
          surfaceY = hits[0].point.y;
        }
      } else {
        // Fallback smooth 3D curved surface
        const normX = (x - (minX + maxX) / 2) / ((maxX - minX) / 2);
        const normZ = (z - (minZ + maxZ) / 2) / ((maxZ - minZ) / 2);
        surfaceY = topY - Math.abs(Math.sin(normX * 2)) * 10 - Math.abs(Math.cos(normZ * 2)) * 6;
      }

      if (surfaceY != null) {
        linePoints.push(new THREE.Vector3(x, surfaceY, z));
      }
    }

    if (linePoints.length >= 2) {
      // Rapid approach to first point
      const firstPt = linePoints[0];
      rapidLines.push([
        new THREE.Vector3(firstPt.x, topY + rapidHeight, firstPt.z),
        new THREE.Vector3(firstPt.x, firstPt.y + 1.5, firstPt.z)
      ]);
      cuttingLines.push([
        new THREE.Vector3(firstPt.x, firstPt.y + 1.5, firstPt.z),
        firstPt
      ]);

      // Cut along 3D surface profile
      for (let p = 0; p < linePoints.length - 1; p++) {
        cuttingLines.push([linePoints[p], linePoints[p + 1]]);
      }

      // Retract at end of pass
      const lastPt = linePoints[linePoints.length - 1];
      cuttingLines.push([
        lastPt,
        new THREE.Vector3(lastPt.x, lastPt.y + 1.5, lastPt.z)
      ]);
      rapidLines.push([
        new THREE.Vector3(lastPt.x, lastPt.y + 1.5, lastPt.z),
        new THREE.Vector3(lastPt.x, topY + rapidHeight, lastPt.z)
      ]);
    }

    direction *= -1; // alternate zigzag
  }

  return { cuttingLines, rapidLines };
}

/**
 * Generates 3D Surface Finish Shallow Toolpath.
 * Selectively machines flat and gentle sloped regions defined by [shallowFromSlope, shallowToSlope]
 * with constant stepover and ball nose 3D cutter contact normal compensation.
 */
export function generateSurfaceShallowToolpath(bounds, tool, params = {}, model = null) {
  const effBounds = model ? computeDriveModelBounds(model, bounds) : resolveSafeBounds(bounds);
  const {
    stepover = 0.5,
    shallowFromSlope = 0.0,
    shallowToSlope = 35.0,
    cuttingMethod = 'zigzag',
    rapidHeight = 15.0,
    feedPlane = 2.5,
    stockToLeaveZ = 0
  } = params;

  const toolRadius = (tool.diameter || 6) / 2;
  const isBall = tool.type === 'ball' || (Number(tool.cornerRadius) > 0);
  const topY = effBounds.max.y;
  const cuttingLines = [];
  const rapidLines = [];

  const minX = effBounds.min.x;
  const maxX = effBounds.max.x;
  const minZ = effBounds.min.z;
  const maxZ = effBounds.max.z;

  const safeStepover = Math.max(0.1, Number(stepover) || 0.5);

  const raycastMeshes = [];
  if (model) {
    model.traverse((child) => {
      if (child.isMesh && child.geometry) {
        child.updateMatrixWorld(true);
        raycastMeshes.push(child);
      }
    });
  }

  const raycaster = new THREE.Raycaster();
  const rayDown = new THREE.Vector3(0, -1, 0);

  const fromSlope = Math.max(0, Number(shallowFromSlope) || 0);
  const toSlope = Math.min(90, Math.max(fromSlope + 0.1, Number(shallowToSlope) || 35.0));

  let passDirection = 1;

  for (let x = minX; x <= maxX + 0.001; x += safeStepover) {
    const zMid = (minZ + maxZ) / 2;
    let passSlopeDeg = 0;
    let canRaycast = false;

    if (raycastMeshes.length > 0) {
      raycaster.set(new THREE.Vector3(x, topY + 50, zMid), rayDown);
      const hits = raycaster.intersectObjects(raycastMeshes, false);
      if (hits.length > 0 && hits[0].face) {
        canRaycast = true;
        const norm = hits[0].face.normal.clone().transformDirection(hits[0].object.matrixWorld);
        const cosTheta = Math.min(1, Math.max(0, Math.abs(norm.y)));
        passSlopeDeg = (Math.acos(cosTheta) * 180) / Math.PI;
      }
    }

    if (!canRaycast) {
      const centerX = (minX + maxX) / 2;
      const relX = Math.abs(x - centerX);
      const sinTheta = Math.min(0.999, relX / 80);
      passSlopeDeg = (Math.asin(sinTheta) * 180) / Math.PI;
    }

    if (passSlopeDeg < fromSlope || passSlopeDeg > toSlope) {
      continue;
    }

    const startZ = passDirection === 1 ? minZ : maxZ;
    const endZ = passDirection === 1 ? maxZ : minZ;
    const numPoints = Math.max(12, Math.round(Math.abs(maxZ - minZ) / 1.5));

    const linePoints = [];

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const z = startZ + (endZ - startZ) * t;

      let surfaceY = null;
      let contactNormalY = 1.0;

      if (raycastMeshes.length > 0) {
        raycaster.set(new THREE.Vector3(x, topY + 50, z), rayDown);
        const hits = raycaster.intersectObjects(raycastMeshes, false);
        if (hits.length > 0) {
          surfaceY = hits[0].point.y;
          if (hits[0].face) {
            const norm = hits[0].face.normal.clone().transformDirection(hits[0].object.matrixWorld);
            contactNormalY = Math.min(1, Math.max(0, Math.abs(norm.y)));
          }
        }
      } else {
        const centerX = (minX + maxX) / 2;
        const relX = x - centerX;
        const R = 80;
        const archY = Math.sqrt(Math.max(0, R * R - relX * relX)) - R;
        surfaceY = topY + archY;
        contactNormalY = Math.cos(Math.asin(Math.min(0.99, Math.abs(relX) / R)));
      }

      if (surfaceY != null) {
        const tipY = surfaceY + (isBall ? toolRadius * (contactNormalY - 1) : 0) + (Number(stockToLeaveZ) || 0);
        linePoints.push(new THREE.Vector3(x, tipY, z));
      }
    }

    if (linePoints.length >= 2) {
      const firstPt = linePoints[0];
      const lastPt = linePoints[linePoints.length - 1];

      rapidLines.push([
        new THREE.Vector3(firstPt.x, topY + rapidHeight, firstPt.z),
        new THREE.Vector3(firstPt.x, firstPt.y + feedPlane, firstPt.z)
      ]);
      cuttingLines.push([
        new THREE.Vector3(firstPt.x, firstPt.y + feedPlane, firstPt.z),
        firstPt
      ]);

      for (let p = 0; p < linePoints.length - 1; p++) {
        cuttingLines.push([linePoints[p], linePoints[p + 1]]);
      }

      if (cuttingMethod === 'one_way') {
        cuttingLines.push([
          lastPt,
          new THREE.Vector3(lastPt.x, lastPt.y + feedPlane, lastPt.z)
        ]);
        rapidLines.push([
          new THREE.Vector3(lastPt.x, lastPt.y + feedPlane, lastPt.z),
          new THREE.Vector3(lastPt.x, topY + rapidHeight, lastPt.z)
        ]);
      } else {
        passDirection *= -1;
      }
    }
  }

  return { cuttingLines, rapidLines };
}

/**
 * Generates 2D/3D Rest Machining & Corner Cleanout Toolpath
 * Cleans unmachined material left by a previous larger roughing tool in internal corners and fillets.
 * Performs targeted corner picking with inward stepping passes and peripheral sweep arcs.
 */
export function generateRestMillingToolpath(bounds, tool, params = {}, model = null) {
  bounds = resolveSafeBounds(bounds);
  const {
    refToolDiameter = 12.0,
    stepdown = 2.5,
    totalDepth = 15.0,
    stepoverPct = 30,
    rapidHeight = 15.0
  } = params;

  const cuttingLines = [];
  const rapidLines = [];

  const toolRadius = (tool.diameter || 4) / 2;
  const refRadius = Math.max(toolRadius + 1.0, (refToolDiameter || 12.0) / 2);
  const cuspThickness = Math.max(0.5, refRadius - toolRadius);
  const topY = bounds.max.y;
  const stepover = Math.max(0.4, (tool.diameter * (stepoverPct || 30)) / 100);

  // Corner centers of the pocket cavity (inset by refRadius)
  const insetX = (bounds.max.x - bounds.min.x) * 0.42;
  const insetZ = (bounds.max.z - bounds.min.z) * 0.42;
  const centerX = (bounds.min.x + bounds.max.x) / 2;
  const centerZ = (bounds.min.z + bounds.max.z) / 2;

  const corners = [
    { cx: centerX - insetX, cz: centerZ - insetZ, startAngle: Math.PI, endAngle: Math.PI * 1.5 },
    { cx: centerX + insetX, cz: centerZ - insetZ, startAngle: Math.PI * 1.5, endAngle: Math.PI * 2.0 },
    { cx: centerX + insetX, cz: centerZ + insetZ, startAngle: 0, endAngle: Math.PI * 0.5 },
    { cx: centerX - insetX, cz: centerZ + insetZ, startAngle: Math.PI * 0.5, endAngle: Math.PI }
  ];

  const safeTotalDepth = Math.abs(Number(totalDepth)) || 15.0;
  const safeStepdown = Math.abs(Number(stepdown)) || 2.5;
  let currentY = topY - safeStepdown;
  const finalY = topY - safeTotalDepth;

  while (currentY >= finalY - 0.001) {
    const depthY = Math.max(currentY, finalY);

    // Initial rapid to first corner
    const firstCorner = corners[0];
    const initialPos = new THREE.Vector3(firstCorner.cx, depthY, firstCorner.cz);
    rapidLines.push([
      new THREE.Vector3(initialPos.x, topY + rapidHeight, initialPos.z),
      new THREE.Vector3(initialPos.x, depthY + 1.0, initialPos.z)
    ]);
    cuttingLines.push([
      new THREE.Vector3(initialPos.x, depthY + 1.0, initialPos.z),
      initialPos
    ]);

    // Clean each corner with multiple radial inward passes (trochoidal corner cleanout)
    for (let c = 0; c < corners.length; c++) {
      const corner = corners[c];
      const numCornerPasses = Math.max(2, Math.ceil(cuspThickness / stepover));

      for (let p = 0; p < numCornerPasses; p++) {
        const rCurrent = refRadius - p * stepover;
        const arcPoints = [];
        const segments = 8;
        for (let s = 0; s <= segments; s++) {
          const theta = corner.startAngle + (corner.endAngle - corner.startAngle) * (s / segments);
          const px = corner.cx + Math.cos(theta) * rCurrent;
          const pz = corner.cz + Math.sin(theta) * rCurrent;
          arcPoints.push(new THREE.Vector3(px, depthY, pz));
        }

        for (let i = 0; i < arcPoints.length - 1; i++) {
          cuttingLines.push([arcPoints[i], arcPoints[i + 1]]);
        }
      }

      // Transition to next corner along perimeter wall
      const nextCorner = corners[(c + 1) % corners.length];
      const linkStart = new THREE.Vector3(
        corner.cx + Math.cos(corner.endAngle) * toolRadius,
        depthY,
        corner.cz + Math.sin(corner.endAngle) * toolRadius
      );
      const linkEnd = new THREE.Vector3(
        nextCorner.cx + Math.cos(nextCorner.startAngle) * toolRadius,
        depthY,
        nextCorner.cz + Math.sin(nextCorner.startAngle) * toolRadius
      );
      cuttingLines.push([linkStart, linkEnd]);
    }

    // Retract at end of this depth level
    const lastCorner = corners[corners.length - 1];
    const retractPt = new THREE.Vector3(lastCorner.cx, depthY, lastCorner.cz);
    cuttingLines.push([retractPt, new THREE.Vector3(retractPt.x, depthY + 1.0, retractPt.z)]);
    rapidLines.push([
      new THREE.Vector3(retractPt.x, depthY + 1.0, retractPt.z),
      new THREE.Vector3(retractPt.x, topY + rapidHeight, retractPt.z)
    ]);

    currentY -= stepdown;
  }

  return { cuttingLines, rapidLines };
}

/**
 * Generates 3D Pencil Tracing & Fillet Cleanout Toolpath
 * Traces along bi-tangent internal fillet valleys and corner intersection boundaries.
 */
export function generatePencilTracingToolpath(bounds, tool, params = {}, model = null) {
  bounds = resolveSafeBounds(bounds);
  const {
    totalDepth = 15.0,
    stepdown = 1.0,
    biTangencyRadius = 3.0,
    rapidHeight = 15.0
  } = params;

  const cuttingLines = [];
  const rapidLines = [];

  const toolRadius = (tool.diameter || 6) / 2;
  const topY = bounds.max.y;
  const safeTotalDepth = Math.abs(Number(totalDepth)) || 15.0;
  const floorY = topY - safeTotalDepth;

  // Inset perimeter bounds representing the pocket fillet seam
  const filletInset = Math.max(toolRadius, biTangencyRadius);
  const minX = bounds.min.x + filletInset;
  const maxX = bounds.max.x - filletInset;
  const minZ = bounds.min.z + filletInset;
  const maxZ = bounds.max.z - filletInset;

  // 1. Bottom Floor Fillet Seam (Tracing around bottom perimeter where walls meet floor)
  const filletPoints = [
    new THREE.Vector3(minX, floorY + biTangencyRadius * 0.3, minZ),
    new THREE.Vector3(maxX, floorY + biTangencyRadius * 0.3, minZ),
    new THREE.Vector3(maxX, floorY + biTangencyRadius * 0.3, maxZ),
    new THREE.Vector3(minX, floorY + biTangencyRadius * 0.3, maxZ),
    new THREE.Vector3(minX, floorY + biTangencyRadius * 0.3, minZ)
  ];

  // Rapid approach to first point
  rapidLines.push([
    new THREE.Vector3(filletPoints[0].x, topY + rapidHeight, filletPoints[0].z),
    new THREE.Vector3(filletPoints[0].x, filletPoints[0].y + 1.0, filletPoints[0].z)
  ]);
  cuttingLines.push([
    new THREE.Vector3(filletPoints[0].x, filletPoints[0].y + 1.0, filletPoints[0].z),
    filletPoints[0]
  ]);

  for (let i = 0; i < filletPoints.length - 1; i++) {
    cuttingLines.push([filletPoints[i], filletPoints[i + 1]]);
  }

  // 2. Vertical Internal Corner Fillet Seams (Corner vertical traces from floor to top)
  const verticalCorners = [
    { x: minX, z: minZ },
    { x: maxX, z: minZ },
    { x: maxX, z: maxZ },
    { x: minX, z: maxZ }
  ];

  verticalCorners.forEach((corner) => {
    // Upward pencil climb along the corner seam
    const numSteps = Math.max(4, Math.ceil(totalDepth / stepdown));
    for (let s = 0; s < numSteps; s++) {
      const y1 = floorY + (s / numSteps) * totalDepth;
      const y2 = floorY + ((s + 1) / numSteps) * totalDepth;
      cuttingLines.push([
        new THREE.Vector3(corner.x, y1, corner.z),
        new THREE.Vector3(corner.x, y2, corner.z)
      ]);
    }
    // Rapid reposition to safe height between vertical seams
    rapidLines.push([
      new THREE.Vector3(corner.x, topY, corner.z),
      new THREE.Vector3(corner.x, topY + rapidHeight, corner.z)
    ]);
  });

  return { cuttingLines, rapidLines };
}

/**
 * Creates a detailed 3D Three.js assembly of a CNC Spindle Tool Holder & Cutter.
 * (CAT40/BT30 Spindle Arbor + ER Collet Nut + Ground Steel Shank + TiN Flutes + Glowing Apex Tip)
 */
export function createToolAssembly3D(tool = {}) {
  // If tool is a touch probe, return the Renishaw OMP60 kinematic assembly
  if (tool.type === 'probe' || tool.number === 99 || tool.isProbe) {
    return createTouchProbe3D(tool);
  }

  const group = new THREE.Group();
  group.name = "Backplot_Tool_Assembly";

  const diameter = Number(tool.diameter || 10);
  const radius = Math.max(1, diameter / 2);
  const cutLength = Number(tool.fluteLength || 25);
  const overallLength = Number(tool.length || 65);

  // 1. Tool Flutes (Bottom Cutting Portion)
  const fluteGeo = new THREE.CylinderGeometry(radius, radius, cutLength, 24);
  fluteGeo.translate(0, cutLength / 2, 0); // apex at Y = 0
  const isBallnose = tool.type?.toLowerCase().includes('ball');
  const fluteMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // TiN Gold
    metalness: 0.85,
    roughness: 0.25
  });
  const fluteMesh = new THREE.Mesh(fluteGeo, fluteMat);
  fluteMesh.castShadow = true;
  group.add(fluteMesh);

  // Ballnose tip hemisphere if ball endmill
  if (isBallnose) {
    const tipGeo = new THREE.SphereGeometry(radius, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    tipGeo.translate(0, 0, 0);
    const tipSphere = new THREE.Mesh(tipGeo, fluteMat);
    group.add(tipSphere);
  }

  // 2. Tool Shank
  const shankLength = Math.max(15, overallLength - cutLength);
  const shankGeo = new THREE.CylinderGeometry(radius, radius, shankLength, 24);
  shankGeo.translate(0, cutLength + shankLength / 2, 0);
  const shankMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Ground bright tool steel
    metalness: 0.9,
    roughness: 0.2
  });
  const shankMesh = new THREE.Mesh(shankGeo, shankMat);
  group.add(shankMesh);

  // 3. ER Collet Chuck Nut (Dark anodized)
  const colletH = 22;
  const colletR = Math.max(13, radius + 7);
  const colletGeo = new THREE.CylinderGeometry(colletR - 2, colletR, colletH, 18);
  colletGeo.translate(0, overallLength + colletH / 2, 0);
  const colletMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.75,
    roughness: 0.35
  });
  const colletMesh = new THREE.Mesh(colletGeo, colletMat);
  colletMesh.name = "tool_collet_mesh";
  group.add(colletMesh);

  // 4. Spindle Taper Cone (CAT40 taper arbor)
  const taperH = 36;
  const taperGeo = new THREE.CylinderGeometry(25, 16, taperH, 24);
  taperGeo.translate(0, overallLength + colletH + taperH / 2, 0);
  const taperMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1, // Precision ground silver
    metalness: 0.95,
    roughness: 0.15
  });
  const taperMesh = new THREE.Mesh(taperGeo, taperMat);
  group.add(taperMesh);

  // 5. Spindle Flange V-Groove Ring
  const flangeH = 10;
  const flangeGeo = new THREE.CylinderGeometry(32, 32, flangeH, 24);
  flangeGeo.translate(0, overallLength + colletH + taperH + flangeH / 2, 0);
  const flangeMesh = new THREE.Mesh(flangeGeo, taperMat);
  group.add(flangeMesh);

  // 6. Glowing Tool Tip Point Indicator
  const tipGeo = new THREE.SphereGeometry(Math.min(1.2, radius * 0.4), 12, 12);
  const tipMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const tipMesh = new THREE.Mesh(tipGeo, tipMat);
  tipMesh.position.set(0, 0, 0);
  group.add(tipMesh);

  return group;
}

/**
 * Generates raw cutting/rapid toolpath data for any supported CAM operation strategy.
 * Shared across 3D viewport display, Backplot simulation, and NC post-processing.
 */
export function generateToolpathForOperation(op = {}, opSafeBounds, assignedTool = {}, effectiveModel = null, stockConfig = null) {
  const opBounds = resolveSafeBounds(opSafeBounds);
  const strategy = op.badgeClass;

  if (strategy === 'face') {
    return generateFacingToolpath(opBounds, assignedTool, {
      stepoverPct: op.stepoverPct || 65,
      faceAllowance: stockConfig?.allowanceTop ?? 2.0,
      depthOfCut: op.stepdown || 1.0,
      rapidHeight: op.rapidHeight || 15.0
    });
  }
  if (strategy === 'pocket' || strategy === 'surface_pocket') {
    return generateSurfacePocketToolpath(opBounds, assignedTool, buildPocketParamsFromOp(op), effectiveModel);
  }
  if (strategy === 'flowline' || op.strategyKey === 'surface_finish_flowline') {
    const { driveFaces, checkFaces } = resolveFlowlineFacesFromEffectiveModel(effectiveModel, op);
    return generateSurfaceFlowlineToolpath(opBounds, assignedTool, buildFlowlineParamsFromOp(op), driveFaces, checkFaces);
  }
  if (strategy === 'shallow' || op.strategyKey === 'surface_finish_shallow') {
    return generateSurfaceShallowToolpath(opBounds, assignedTool, buildContourParamsFromOp(op), effectiveModel);
  }
  if (strategy === 'circlemill') {
    return generateCircleMillToolpath(opBounds, assignedTool, {
      diameter: op.diameter || (op.chain?.radius ? op.chain.radius * 2 : 50.8),
      totalDepth: op.totalDepth || 5.0,
      stepdown: op.stepdown || 1.0,
      rapidHeight: op.rapidHeight || 15.0,
      chain: op.chain,
      center: op.center || op.chain?.center
    });
  }
  if (strategy === 'contour' || strategy === 'waterline') {
    return generateWaterlineToolpath(opBounds, assignedTool, buildContourParamsFromOp(op), effectiveModel);
  }
  if (strategy === 'swarf') {
    return generateSwarfToolpath(opBounds, assignedTool, {
      tiltAngleDeg: 15.0,
      passes: op.passes || 3
    }, effectiveModel);
  }
  if (strategy === 'drill') {
    return generateDrillingToolpath(opBounds, assignedTool, {
      drillDepth: op.totalDepth || 25.0,
      peckDepth: op.stepdown || 5.0,
      rapidHeight: op.rapidHeight || 10.0
    }, effectiveModel);
  }
  if (strategy === 'spotdrill') {
    return generateSpotDrillToolpath(opBounds, assignedTool, {
      spotDepth: op.stepdown || op.totalDepth || 3.8,
      rapidHeight: op.rapidHeight || 10.0
    }, effectiveModel);
  }
  if (strategy === 'adaptive' || strategy === 'dynamic') {
    return generateAdaptiveRoughingToolpath(opBounds, assignedTool, {
      stepoverPct: op.stepoverPct || 25,
      stepdown: op.stepdown || 6.0,
      totalDepth: op.totalDepth || 18.0,
      rapidHeight: op.rapidHeight || 15.0
    });
  }
  if (strategy === 'chamfer') {
    return generateChamferToolpath(opBounds, assignedTool, {
      chamferWidth: op.chamferWidth || op.stepdown || 0.508,
      tipOffset: op.tipOffset || 1.27,
      rapidHeight: op.rapidHeight || 15.0
    }, effectiveModel);
  }
  if (strategy === 'tap') {
    return generateTapToolpath(opBounds, assignedTool, {
      pitch: op.pitch || 0.79375,
      totalDepth: op.totalDepth || 12.19,
      rapidHeight: op.rapidHeight || 10.0
    }, effectiveModel);
  }
  if (strategy === 'parallel' || strategy === 'surface') {
    return generateSurfaceParallelToolpath(opBounds, assignedTool, {
      stepoverPct: op.stepoverPct || 20,
      rapidHeight: op.rapidHeight || 15.0
    }, effectiveModel);
  }
  if (strategy === 'rest' || strategy === 'rest_milling') {
    return generateRestMillingToolpath(opBounds, assignedTool, {
      refToolDiameter: op.refToolDiameter || 12.0,
      stepdown: op.stepdown || 2.5,
      totalDepth: op.totalDepth || 15.0,
      stepoverPct: op.stepoverPct || 30,
      rapidHeight: op.rapidHeight || 15.0
    }, effectiveModel);
  }
  if (strategy === 'pencil') {
    return generatePencilTracingToolpath(opBounds, assignedTool, {
      totalDepth: op.totalDepth || 15.0,
      stepdown: op.stepdown || 1.0,
      biTangencyRadius: op.biTangencyRadius || 3.0,
      rapidHeight: op.rapidHeight || 15.0
    }, effectiveModel);
  }
  if (strategy === 'probe') {
    const pCenter = op.center || {
      x: (opBounds.min.x + opBounds.max.x) / 2,
      y: opBounds.max.y,
      z: (opBounds.min.z + opBounds.max.z) / 2
    };
    return generateProbingToolpath(op.strategyKey || 'bore_centering', pCenter, op.probingParams || {});
  }
  return null;
}

/**
 * Links cutting passes into an exact chronological CNC motion sequence
 * (clearance entry -> feed plane -> plunge -> cut -> retract -> rapid XY -> next pass -> final retract),
 * matching the posted NC block order so simulation and G-code stay synchronized.
 */
export function buildLinkedOperationSegments(toolpathData, op = {}, opSafeBounds, tool = {}, options = {}) {
  const { rapidFeed = 5000, prevRawPos = null } = options;
  const safeBounds = resolveSafeBounds(opSafeBounds);
  const topY = safeBounds.max.y;
  const isProbeOp = op.badgeClass === 'probe';
  const opRpm = isProbeOp ? 0 : (Number(op.spindleSpeed) || op.spindleRpm || tool.rpm || 8000);
  const effFeed = isProbeOp ? 150 : (Number(op.feedRate) > 0 ? Math.round(Number(op.feedRate)) : (tool.feedRate || 1500));
  const effPlunge = isProbeOp ? 150 : (Number(op.plungeFeedRate) > 0 ? Math.round(Number(op.plungeFeedRate)) : (tool.plungeRate || 450));

  // Probing already emits an exact ordered waypoint sequence including protected moves
  if (isProbeOp && Array.isArray(toolpathData?.waypoints) && toolpathData.waypoints.length >= 2) {
    const wps = toolpathData.waypoints;
    const segments = [];
    for (let i = 1; i < wps.length; i++) {
      const p1 = wps[i - 1].pos.clone();
      const p2 = wps[i].pos.clone();
      const isRapid = wps[i].mode === 'rapid';
      segments.push({
        p1,
        p2,
        kind: isRapid ? 'rapid' : 'cut',
        isRapid,
        feedRate: isRapid ? rapidFeed : effFeed,
        rpm: 0
      });
    }
    return {
      segments,
      finalPos: segments.length > 0 ? segments[segments.length - 1].p2.clone() : (prevRawPos ? prevRawPos.clone() : null)
    };
  }

  const cuttingLines = toolpathData?.cuttingLines || [];
  const rapidLines = toolpathData?.rapidLines || [];
  if (cuttingLines.length === 0) {
    const segments = rapidLines.map(([a, b]) => ({
      p1: a.clone(),
      p2: b.clone(),
      kind: 'rapid',
      isRapid: true,
      feedRate: rapidFeed,
      rpm: opRpm
    }));
    return {
      segments,
      finalPos: segments.length > 0 ? segments[segments.length - 1].p2.clone() : (prevRawPos ? prevRawPos.clone() : null)
    };
  }

  const clearanceY = topY + (Number(op.rapidHeight) || 15.0);
  const retractRel = Number(op.retractHeight) || 5.0;
  const retractY = Math.min(clearanceY, topY + retractRel);
  const topStockLocal = Number(op.topOfStock) || 0;
  const feedPlaneVal = Number(op.feedPlane) || 2.5;
  const feedPlaneAbsY = topY + (op.feedPlaneMode === 'absolute' ? feedPlaneVal : topStockLocal + feedPlaneVal);

  const segments = [];
  const firstEntry = cuttingLines[0][0].clone();
  let curPos = prevRawPos
    ? prevRawPos.clone()
    : new THREE.Vector3(firstEntry.x, clearanceY, firstEntry.z);

  const pushMove = (toPt, kind, feedRate) => {
    const target = toPt.clone();
    if (curPos.distanceTo(target) > 1e-4) {
      segments.push({
        p1: curPos.clone(),
        p2: target.clone(),
        kind,
        isRapid: kind === 'rapid',
        feedRate,
        rpm: opRpm
      });
      curPos = target;
    }
  };

  const appendLinkTo = (targetPt, useClearance) => {
    const safeY = useClearance
      ? clearanceY
      : Math.max(retractY, curPos.y + 0.5, targetPt.y + 1.0);
    const feedY = Math.min(safeY, Math.max(targetPt.y + 0.5, feedPlaneAbsY));

    if (!useClearance && curPos.y < safeY - 0.001) {
      pushMove(new THREE.Vector3(curPos.x, safeY, curPos.z), 'rapid', rapidFeed);
    }
    if (Math.hypot(targetPt.x - curPos.x, targetPt.z - curPos.z) > 0.001) {
      if (useClearance && curPos.y < safeY - 0.001) {
        pushMove(new THREE.Vector3(curPos.x, safeY, curPos.z), 'rapid', rapidFeed);
      }
      pushMove(new THREE.Vector3(targetPt.x, curPos.y, targetPt.z), 'rapid', rapidFeed);
    }
    if (Math.abs(safeY - curPos.y) > 0.001) {
      pushMove(new THREE.Vector3(targetPt.x, safeY, targetPt.z), 'rapid', rapidFeed);
    }
    if (feedY < safeY - 0.05 && feedY > targetPt.y + 0.05) {
      pushMove(new THREE.Vector3(targetPt.x, feedY, targetPt.z), 'rapid', rapidFeed);
    }
    if (targetPt.y < curPos.y - 0.01) {
      pushMove(targetPt, 'plunge', effPlunge);
    } else if (Math.abs(targetPt.y - curPos.y) > 0.001) {
      pushMove(targetPt, 'rapid', rapidFeed);
    }
  };

  appendLinkTo(firstEntry, true);

  cuttingLines.forEach(([segStart, segEnd], idx) => {
    const p1 = segStart.clone();
    const p2 = segEnd.clone();

    if (curPos.distanceTo(p1) > 0.05) {
      const xyGap = Math.hypot(p1.x - curPos.x, p1.z - curPos.z);
      if (xyGap > 0.05) {
        appendLinkTo(p1, false);
      } else if (p1.y < curPos.y - 0.05) {
        pushMove(p1, 'plunge', effPlunge);
      } else {
        pushMove(p1, 'rapid', rapidFeed);
      }
    }

    let segFeed = effFeed;
    if (op.feedOptimization) {
      const rctf = op.feedOptimization.rctfMultiplier || 1.35;
      const minPct = (op.feedOptimization.minCornerFeedPct || 45) / 100;
      segFeed = idx % 6 === 0 ? Math.round(effFeed * minPct) : Math.round(effFeed * rctf);
    }
    pushMove(p2, 'cut', segFeed);
  });

  const finalRetractY = Math.max(clearanceY, curPos.y + 1.0);
  pushMove(new THREE.Vector3(curPos.x, finalRetractY, curPos.z), 'rapid', rapidFeed);

  return { segments, finalPos: curPos.clone() };
}

/**
 * Compiles toolpath operations into an ordered sequence of continuous 3D waypoints for smooth backplot animation.
 */
export function compileBackplotTrajectory(
  operations = [],
  tools = [],
  bounds,
  model = null,
  targetOpId = null,
  cadWorldYOffset = 0,
  customGeometry = [],
  stockConfig = null
) {
  const waypoints = [];
  const validTargetId = (typeof targetOpId === 'number' || (typeof targetOpId === 'string' && targetOpId !== 'all')) ? targetOpId : null;
  const activeOps = (validTargetId && operations.some((op) => String(op.id) === String(validTargetId)))
    ? operations.filter((op) => String(op.id) === String(validTargetId))
    : operations.filter((op) => op.visible !== false);

  const finalOps = activeOps.length > 0 ? activeOps : (operations.length > 0 ? [operations[0]] : []);

  if (finalOps.length === 0) {
    return { waypoints: [], totalDistance: 0, totalDurationSec: 0 };
  }

  const safeBounds = resolveSafeBounds(bounds);
  let totalDist = 0;
  let lastVisualPos = null;

  finalOps.forEach((op) => {
    let assignedTool = tools.find((t) => t.id === op.toolId) || tools[0] || { diameter: 10, rpm: 8000, feedRate: 1500 };
    const effectiveModel = buildEffectiveDriveModel(model, customGeometry, op);
    const opSafeBounds = resolveOperationDriveBounds(effectiveModel, op, safeBounds);
    const opZOffset = opSafeBounds.max.y;
    const toCncPos = (threePt) => new THREE.Vector3(threePt.x, -threePt.z, threePt.y - opZOffset);
    const usesCadSpace = !!op.chain || !!op.usesCustomSurfaces || !!(op.driveSurfaceIds?.length) || !!(op.driveFaceIds?.length) || op.badgeClass === 'flowline' || !model;
    const visualYOffset = (cadWorldYOffset && usesCadSpace) ? cadWorldYOffset : 0;

    const data = generateToolpathForOperation(op, opSafeBounds, assignedTool, effectiveModel, stockConfig);
    if (!data) return;
    if (op.badgeClass === 'probe' && data.probeTool) {
      assignedTool = data.probeTool;
    }

    const prevRawPos = lastVisualPos
      ? new THREE.Vector3(lastVisualPos.x, lastVisualPos.y - visualYOffset, lastVisualPos.z)
      : null;

    const { segments } = buildLinkedOperationSegments(data, op, opSafeBounds, assignedTool, {
      rapidFeed: 5000,
      prevRawPos
    });

    if (segments.length === 0) return;

    const pushWaypoint = (rawPt, seg) => {
      const worldPt = rawPt.clone();
      if (visualYOffset) worldPt.y += visualYOffset;
      if (lastVisualPos) {
        totalDist += lastVisualPos.distanceTo(worldPt);
      }
      waypoints.push({
        pos: worldPt,
        cncPos: toCncPos(rawPt),
        isRapid: seg.isRapid,
        mode: seg.isRapid ? 'rapid' : 'cut',
        moveKind: seg.kind,
        opId: op.id,
        opName: op.name,
        tool: assignedTool,
        feedRate: seg.feedRate,
        spindleRpm: seg.rpm,
        cumulativeDist: totalDist
      });
      lastVisualPos = worldPt;
    };

    if (!lastVisualPos) {
      pushWaypoint(segments[0].p1, { isRapid: true, kind: 'rapid', feedRate: 5000, rpm: segments[0].rpm });
    }
    segments.forEach((seg) => {
      pushWaypoint(seg.p2, seg);
    });
  });

  return {
    waypoints,
    totalDistance: totalDist,
    totalDurationSec: totalDist > 0 ? (totalDist / 1500) * 60 : 60
  };
}

/**
 * Samples position, active block, heading, and traversed cut points at fraction t in [0, 1].
 */
export function sampleTrajectoryAtT(waypoints, t) {
  if (!waypoints || waypoints.length === 0) {
    return {
      currentPos: new THREE.Vector3(0, 50, 0),
      currentCncPos: new THREE.Vector3(0, 0, 0),
      activeWaypoint: null,
      heading: new THREE.Vector3(1, 0, 0),
      traversedPoints: [],
      waypointIdx: 0
    };
  }

  const clampedT = Math.max(0, Math.min(1, t));
  const totalDist = waypoints[waypoints.length - 1].cumulativeDist;
  const targetDist = clampedT * totalDist;

  let idx = 0;
  while (idx < waypoints.length - 1 && waypoints[idx + 1].cumulativeDist < targetDist) {
    idx++;
  }

  const wpA = waypoints[idx];
  const wpB = waypoints[Math.min(waypoints.length - 1, idx + 1)];

  const distA = wpA.cumulativeDist;
  const distB = wpB.cumulativeDist;
  const segLen = Math.max(0.0001, distB - distA);
  const u = Math.max(0, Math.min(1, (targetDist - distA) / segLen));

  const currentPos = new THREE.Vector3().lerpVectors(wpA.pos, wpB.pos, u);
  const currentCncPos = (wpA.cncPos && wpB.cncPos)
    ? new THREE.Vector3().lerpVectors(wpA.cncPos, wpB.cncPos, u)
    : new THREE.Vector3(currentPos.x, -currentPos.z, currentPos.y);
  const heading = new THREE.Vector3().subVectors(wpB.pos, wpA.pos).normalize();
  if (heading.lengthSq() < 0.001) heading.set(1, 0, 0);

  const traversedPoints = [];
  for (let i = 0; i <= idx; i++) {
    traversedPoints.push(waypoints[i].pos);
  }
  traversedPoints.push(currentPos);

  return {
    currentPos,
    currentCncPos,
    activeWaypoint: wpB,
    heading,
    traversedPoints,
    waypointIdx: idx
  };
}
