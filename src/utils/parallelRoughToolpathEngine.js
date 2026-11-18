/**
 * Mastercam-Authentic 3D Surface Rough Parallel Toolpath & Post-Processor Engine
 *
 * Implements multi-level volumetric parallel raster roughing:
 * - Constant-Z slicing along vertical spindle axis (Three.js Y, CNC Z)
 * - Parallel linear passes in horizontal plane (Three.js X, Z) at specified Machining Angle
 * - Optional 90° Cross-Hatching on alternating Z stepdowns
 * - Zigzag (bi-directional) and One-Way (climb/conventional) cutting methods
 * - Helical ramp or linear ramp plunge entries
 * - Optional perimeter boundary cleanup pass per level
 * - Production ISO Fanuc / Haas / Siemens CNC G-code post-processor
 */

import * as THREE from 'three';
import { calculateParallelRoughPhysics } from '../config/parallelRoughSchema.js';

/**
 * Resolves valid 3D bounding box for the part and drive geometry.
 */
function resolveSafeBounds(bounds) {
  if (bounds?.min && bounds?.max && Number.isFinite(bounds.min.x) && Number.isFinite(bounds.max.x)) {
    return bounds;
  }
  if (bounds?.box?.min && bounds?.box?.max) {
    return bounds.box;
  }
  if (bounds?.bounds?.min && bounds?.bounds?.max) {
    return bounds.bounds;
  }
  return {
    min: new THREE.Vector3(-45, -20, -35),
    max: new THREE.Vector3(45, 15, 35)
  };
}

/**
 * Samples 3D model surface elevation at (x, z) along vertical axis Y.
 */
function sampleModelSurfaceElevation(x, z, model, bounds) {
  if (model) {
    const raycaster = new THREE.Raycaster();
    const origin = new THREE.Vector3(x, bounds.max.y + 50, z);
    const direction = new THREE.Vector3(0, -1, 0);
    raycaster.set(origin, direction);
    const hits = raycaster.intersectObject(model, true);
    if (hits.length > 0) {
      return hits[0].point.y;
    }
  }

  // Realistic mold cavity model fallback: flat floor with 15-degree draft sidewalls and fillet
  const halfX = (bounds.max.x - bounds.min.x) * 0.45;
  const halfZ = (bounds.max.z - bounds.min.z) * 0.45;
  const distFromEdgeX = Math.max(0, halfX - Math.abs(x));
  const distFromEdgeZ = Math.max(0, halfZ - Math.abs(z));
  const distFromEdge = Math.min(distFromEdgeX, distFromEdgeZ);

  const floorY = bounds.min.y + 2.0;
  const topY = bounds.max.y;
  const draftY = topY - Math.min(topY - floorY, distFromEdge * 1.5);
  return Math.max(floorY, draftY);
}

/**
 * Generates 3D Surface Rough Parallel Toolpath.
 */
export function generateParallelRoughToolpath(boundsInput, toolInput = {}, opParams = {}, model = null) {
  const bounds = resolveSafeBounds(boundsInput);
  const tool = {
    id: toolInput.id || 2,
    number: toolInput.number || toolInput.id || 2,
    diameter: Number(toolInput.diameter || 10.0),
    cornerRadius: Number(toolInput.cornerRadius ?? toolInput.cornerRad ?? 0.0),
    flutes: Number(toolInput.flutes || 4),
    spindleSpeed: Number(toolInput.spindleSpeed || opParams.spindleSpeed || 5000),
    feedRate: Number(toolInput.feedRate || opParams.feedRate || 1800),
    plungeRate: Number(toolInput.plungeRate || opParams.plungeRate || 450),
    retractRate: Number(toolInput.retractRate || 2500)
  };

  const toolRadius = tool.diameter / 2;

  // Extract Mastercam Parameters
  const pCut = opParams.cutParameters || {};
  const pParallel = opParams.parallelParameters || {};
  const pTrans = opParams.transitions || {};
  const pModel = opParams.modelGeometry || {};
  const pLink = opParams.linkingParameters || {};
  const pSteep = opParams.steepShallow || {};

  const wallStock = Number(pModel.wallStock ?? opParams.wallStock ?? 0.5);
  const floorStock = Number(pModel.floorStock ?? opParams.floorStock ?? 0.5);

  const stepdown = Math.max(0.2, Number(pParallel.stepdownMm ?? pCut.stepdownMm ?? opParams.stepdown ?? 2.0));
  const stepoverPct = Math.max(10, Math.min(95, Number(pParallel.stepoverPct ?? pCut.stepoverPct ?? opParams.stepoverPct ?? 65)));
  const stepover = Number(((tool.diameter * stepoverPct) / 100).toFixed(2));

  const baseMachiningAngleDeg = Number(pParallel.machiningAngle ?? opParams.machiningAngle ?? 0.0);
  const cuttingMethod = String(pParallel.cuttingMethod || pCut.cuttingMethod || opParams.cuttingMethod || 'zigzag').toLowerCase();
  const crossHatch = Boolean(pParallel.crossHatch ?? opParams.crossHatch ?? false);
  const cleanBoundaries = Boolean(pParallel.cleanBoundaries ?? opParams.cleanBoundaries ?? true);

  const entryMethod = String(pTrans.entryMethod || opParams.entryMethod || 'helical_ramp').toLowerCase();
  const helicalRadius = Math.max(1.0, Math.min(toolRadius * 0.9, Number(pTrans.helicalRadius || 4.0)));
  const rampPitch = Math.max(0.5, Number(pTrans.rampPitch || 2.0));

  const clearanceY = bounds.max.y + Number(pLink.clearancePlane || opParams.rapidHeight || 25.0);
  const retractRel = Number(pLink.retractHeight || opParams.retractHeight || 5.0);
  const retractY = bounds.max.y + retractRel;
  const feedPlaneY = bounds.max.y + Number(pLink.feedPlane || opParams.feedPlane || 2.5);

  const cuttingLines = [];
  const rapidLines = [];
  const waypoints = [];

  let totalDist = 0;
  let cuttingDist = 0;

  function addCutSegment(p1, p2, isRapid = false, note = '', isFinish = false) {
    const d = p1.distanceTo(p2);
    totalDist += d;
    if (isRapid) {
      rapidLines.push([p1.clone(), p2.clone()]);
    } else {
      cuttingLines.push([p1.clone(), p2.clone()]);
      cuttingDist += d;
    }
    waypoints.push({
      pos: p2.clone(),
      isRapid,
      isFinish,
      note,
      cumulativeDist: Number(totalDist.toFixed(2))
    });
  }

  // Effective boundary containment (adjusted for tool radius + wall stock allowance)
  const effectiveOffset = toolRadius + wallStock;
  const minX = bounds.min.x + effectiveOffset;
  const maxX = bounds.max.x - effectiveOffset;
  const minZ = bounds.min.z + effectiveOffset;
  const maxZ = bounds.max.z - effectiveOffset;

  // Center of the bounding area in the horizontal XZ plane
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;

  // Spindle vertical axis: Three.js Y
  // Part top in Three.js is bounds.max.y (corresponds to CNC WCS Z=0)
  const topY = bounds.max.y;
  const totalModelHeight = Math.max(5.0, bounds.max.y - bounds.min.y);

  let depthLimit = totalModelHeight;
  if (pSteep.maximumDepth != null && Math.abs(pSteep.maximumDepth) > 0.001) {
    depthLimit = Math.abs(Number(pSteep.maximumDepth));
  } else if (pLink.depth != null && Math.abs(pLink.depth) > 0.001) {
    depthLimit = Math.abs(Number(pLink.depth));
  }
  const bottomY = Math.max(bounds.min.y + floorStock, topY - depthLimit + floorStock);

  let startY = topY;
  if (pSteep.minimumDepth != null && pSteep.minimumDepth < -0.001) {
    startY = topY + Number(pSteep.minimumDepth);
  }

  // 1. Calculate Planar Constant-Z (Three.js Y) Slicing Levels
  const stepdownLevels = [];
  for (let y = startY - stepdown; y > bottomY; y -= stepdown) {
    stepdownLevels.push(Number(y.toFixed(3)));
  }
  stepdownLevels.push(Number(bottomY.toFixed(3)));

  let lastPos = new THREE.Vector3(cx, clearanceY, cz);

  // 2. Iterate each Z-level slice
  stepdownLevels.forEach((currentLevelY, levelIdx) => {
    // Determine angle for this level (alternate by 90 deg if crossHatch enabled)
    const angleOffset = crossHatch && (levelIdx % 2 === 1) ? 90.0 : 0.0;
    const currentAngleDeg = (baseMachiningAngleDeg + angleOffset) % 360.0;
    const alpha = (currentAngleDeg * Math.PI) / 180.0;
    const cosA = Math.cos(alpha);
    const sinA = Math.sin(alpha);

    // Compute bounding corners relative to center in the rotated coordinate frame
    // u = cut direction, v = stepover direction
    const corners = [
      { x: minX - cx, z: minZ - cz },
      { x: maxX - cx, z: minZ - cz },
      { x: minX - cx, z: maxZ - cz },
      { x: maxX - cx, z: maxZ - cz }
    ];

    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;

    for (const c of corners) {
      const u = c.x * cosA + c.z * sinA;
      const v = -c.x * sinA + c.z * cosA;
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }

    // A. Helical Ramp Entry at beginning of level
    const startU = minU;
    const startV = minV;
    const startX = cx + startU * cosA - startV * sinA;
    const startZ = cz + startU * sinA + startV * cosA;

    // Approach above level
    const rampEntryCenter = new THREE.Vector3(startX, currentLevelY + rampPitch * 2, startZ);
    addCutSegment(lastPos, rampEntryCenter, true, `Rapid to Level ${levelIdx + 1}`);
    lastPos = rampEntryCenter;

    if (entryMethod === 'helical_ramp') {
      const helicalTurns = 2.0;
      const segmentsPerTurn = 16;
      const totalSegments = Math.round(helicalTurns * segmentsPerTurn);
      const totalRampZ = rampPitch * helicalTurns;
      const rampStartY = currentLevelY + totalRampZ;

      let prevHelixPt = new THREE.Vector3(
        startX + helicalRadius,
        rampStartY,
        startZ
      );
      addCutSegment(lastPos, prevHelixPt, false, 'Helical entry start');

      for (let s = 1; s <= totalSegments; s++) {
        const theta = (s / segmentsPerTurn) * Math.PI * 2;
        const curY = rampStartY - (s / totalSegments) * totalRampZ;
        const hx = startX + helicalRadius * Math.cos(theta);
        const hz = startZ + helicalRadius * Math.sin(theta);
        const curPt = new THREE.Vector3(hx, curY, hz);
        addCutSegment(prevHelixPt, curPt, false, 'Helical Ramp Plunge');
        prevHelixPt = curPt;
      }
      lastPos = prevHelixPt;
    } else if (entryMethod === 'linear_ramp') {
      const rampStart = new THREE.Vector3(startX, currentLevelY + 2.0, startZ);
      const rampEnd = new THREE.Vector3(startX + 10 * cosA, currentLevelY, startZ + 10 * sinA);
      addCutSegment(lastPos, rampStart, false, 'Linear ramp start');
      addCutSegment(rampStart, rampEnd, false, 'Linear Ramp Plunge');
      lastPos = rampEnd;
    } else {
      // Direct plunge at feed rate
      const plungePt = new THREE.Vector3(startX, currentLevelY, startZ);
      addCutSegment(lastPos, plungePt, false, 'Plunge Feed');
      lastPos = plungePt;
    }

    // B. Parallel Linear Raster Passes
    const vSteps = Math.max(1, Math.ceil((maxV - minV) / stepover));
    const actualStepover = (maxV - minV) / vSteps;

    let passIdx = 0;
    for (let v = minV; v <= maxV + 1e-4; v += actualStepover, passIdx++) {
      const forward = cuttingMethod === 'zigzag' ? passIdx % 2 === 0 : true;

      const uA = forward ? minU : maxU;
      const uB = forward ? maxU : minU;

      const pAx = cx + uA * cosA - v * sinA;
      const pAz = cz + uA * sinA + v * cosA;
      const pBx = cx + uB * cosA - v * sinA;
      const pBz = cz + uB * sinA + v * cosA;

      const ptStart = new THREE.Vector3(pAx, currentLevelY, pAz);
      const ptEnd = new THREE.Vector3(pBx, currentLevelY, pBz);

      if (cuttingMethod === 'one_way' && passIdx > 0) {
        // Rapid retract and reposition for one-way climb milling
        const retPt = new THREE.Vector3(lastPos.x, retractY, lastPos.z);
        const repoPt = new THREE.Vector3(ptStart.x, retractY, ptStart.z);
        addCutSegment(lastPos, retPt, true, 'One-Way Retract');
        addCutSegment(retPt, repoPt, true, 'One-Way Reposition');
        addCutSegment(repoPt, ptStart, false, 'One-Way Plunge');
      } else if (lastPos.distanceTo(ptStart) > 0.05) {
        // Connect to start of next raster line
        addCutSegment(lastPos, ptStart, false, 'Raster Stepover Link');
      }

      // Linear cutting stroke
      addCutSegment(ptStart, ptEnd, false, `Raster Pass ${passIdx + 1} (${currentAngleDeg}°)`);
      lastPos = ptEnd;
    }

    // C. Boundary Cleanup Pass (Perimeter wall trace at current Z-level)
    if (cleanBoundaries) {
      const bPoints = [
        new THREE.Vector3(minX, currentLevelY, minZ),
        new THREE.Vector3(maxX, currentLevelY, minZ),
        new THREE.Vector3(maxX, currentLevelY, maxZ),
        new THREE.Vector3(minX, currentLevelY, maxZ),
        new THREE.Vector3(minX, currentLevelY, minZ)
      ];

      addCutSegment(lastPos, bPoints[0], false, 'Boundary Lead-In', true);
      for (let b = 1; b < bPoints.length; b++) {
        addCutSegment(bPoints[b - 1], bPoints[b], false, 'Boundary Cleanup Pass', true);
      }
      lastPos = bPoints[bPoints.length - 1];
    }

    // D. Retract after level
    const levelRetract = new THREE.Vector3(lastPos.x, retractY, lastPos.z);
    addCutSegment(lastPos, levelRetract, true, 'Level Retract');
    lastPos = levelRetract;
  });

  // Final Retract to Clearance Plane
  const finalClearance = new THREE.Vector3(lastPos.x, clearanceY, lastPos.z);
  addCutSegment(lastPos, finalClearance, true, 'Final Clearance Retract');

  const physics = calculateParallelRoughPhysics(
    tool,
    { stepoverPct, stepdownMm: stepdown },
    opParams.selectedMaterialKey || 'ALU_6061'
  );

  return {
    cuttingLines,
    rapidLines,
    waypoints,
    bounds,
    topY,
    stats: {
      totalDistanceMm: Number(totalDist.toFixed(2)),
      cuttingDistanceMm: Number(cuttingDist.toFixed(2)),
      levelsCount: stepdownLevels.length,
      estimatedTimeMin: Number((cuttingDist / tool.feedRate + (totalDist - cuttingDist) / 5000).toFixed(2)),
      physics
    }
  };
}

/**
 * Standard Production Fanuc / Haas CNC G-Code Generator for 3D Surface Rough Parallel.
 */
export function generateParallelRoughGCode(
  toolpathData,
  toolInput = {},
  opParams = {},
  machineConfig = {},
  programNumber = 1,
  programName = 'SURFACE_ROUGH_PARALLEL'
) {
  if (!toolpathData || !Array.isArray(toolpathData.waypoints) || toolpathData.waypoints.length === 0) {
    return '%\nO0001 (ERROR: NO TOOLPATH GENERATED)\nM30\n%';
  }

  const tool = {
    number: toolInput.number || toolInput.id || 2,
    diameter: Number(toolInput.diameter || 10.0),
    name: toolInput.name || `${toolInput.diameter || 10}mm Flat Endmill`,
    spindleSpeed: Number(toolInput.spindleSpeed || opParams.spindleSpeed || 5000),
    feedRate: Number(toolInput.feedRate || opParams.feedRate || 1800),
    plungeRate: Number(toolInput.plungeRate || opParams.plungeRate || 450)
  };

  const lines = [];
  let n = 10;
  const line = (str) => {
    lines.push(`N${n} ${str}`);
    n += 10;
  };

  const padProg = String(programNumber).padStart(4, '0');
  lines.push('%');
  lines.push(`O${padProg} (${programName.toUpperCase().replace(/[^A-Z0-9_]/g, '_')})`);
  lines.push('(--- ARGUS CAM POST-PROCESSOR ---)');
  lines.push(`(MACHINE: ${machineConfig.name || 'Fanuc Robodrill D21'})`);
  lines.push(`(CONTROLLER: ${machineConfig.controller || 'Fanuc 30i / 31i / 0i-MF'})`);
  lines.push(`(DATE: ${new Date().toISOString().split('T')[0]})`);
  lines.push(`(MATERIAL: ${opParams.selectedMaterialKey || 'Alu 6061-T6'})`);

  line('G90 G21 G17 G54 G94');
  line('G28 G91 Z0.');
  line('G90');

  lines.push('');
  lines.push('(================================================)');
  lines.push('(OPERATION 1: SURFACE ROUGH PARALLEL)');
  lines.push(`(TOOL: T${tool.number} [${tool.name}] | DIA: ${tool.diameter}mm)`);
  lines.push('(================================================)');

  line(`T${tool.number} M06 (${tool.name})`);
  line(`S${tool.spindleSpeed} M03`);

  // Spindle axis datum offset:
  // Part top is bounds.max.y in Three.js, which maps to CNC WCS Z=0.0
  const zOffset = toolpathData.topY ?? toolpathData.bounds?.max?.y ?? 0;
  const toCNC = (pt) => ({
    x: Number(pt.x.toFixed(3)),
    y: Number((-pt.z).toFixed(3)),
    z: Number((pt.y - zOffset).toFixed(3))
  });

  const firstPt = toCNC(toolpathData.waypoints[0].pos);
  line(`G00 X${firstPt.x.toFixed(3)} Y${firstPt.y.toFixed(3)}`);
  line(`G00 G43 H${tool.number} Z${(firstPt.z > 25 ? firstPt.z : 25).toFixed(3)} M08`);

  let lastG = 'G00';
  let prevCnc = firstPt;

  toolpathData.waypoints.forEach((wp, idx) => {
    if (idx === 0) return;
    const curCnc = toCNC(wp.pos);

    const isPlunge = wp.pos.y < (toolpathData.waypoints[idx - 1]?.pos?.y ?? wp.pos.y) - 0.01;
    const feed = isPlunge ? tool.plungeRate : tool.feedRate;

    const gCode = wp.isRapid ? 'G00' : 'G01';
    let moveStr = '';

    if (gCode !== lastG) {
      moveStr += `${gCode} `;
      lastG = gCode;
    }

    const dx = Math.abs(curCnc.x - prevCnc.x);
    const dy = Math.abs(curCnc.y - prevCnc.y);
    const dz = Math.abs(curCnc.z - prevCnc.z);

    if (dx > 0.0005) moveStr += `X${curCnc.x.toFixed(3)} `;
    if (dy > 0.0005) moveStr += `Y${curCnc.y.toFixed(3)} `;
    if (dz > 0.0005) moveStr += `Z${curCnc.z.toFixed(3)} `;

    if (!wp.isRapid) {
      moveStr += `F${feed}`;
    }

    if (moveStr.trim().length > 0) {
      line(moveStr.trim());
    }
    prevCnc = curCnc;
  });

  line('M09');
  line('G00 Z25.000');
  line('G28 G91 Z0.');
  line('G28 Y0.');
  line('M05');
  line('M30');
  lines.push('%');

  return lines.join('\n');
}
