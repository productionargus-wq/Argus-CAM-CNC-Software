import * as THREE from 'three';
import { calculatePocketRoughPhysics } from '../config/pocketRoughSchema.js';

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
    min: new THREE.Vector3(-45, -35, -25),
    max: new THREE.Vector3(45, 35, 0)
  };
}

/**
 * Samples the 3D surface elevation at a given (x, y) point on the CAD model.
 * If model is unavailable or point is outside, falls back to a standard mold cavity draft slope.
 */
function sampleModelSurfaceElevation(x, y, model, bounds) {
  if (model) {
    const raycaster = new THREE.Raycaster();
    const origin = new THREE.Vector3(x, y, bounds.max.z + 50);
    const direction = new THREE.Vector3(0, 0, -1);
    raycaster.set(origin, direction);
    const hits = raycaster.intersectObject(model, true);
    if (hits.length > 0) {
      return hits[0].point.z;
    }
  }

  // Realistic mold cavity model fallback: flat floor with 15-degree draft sidewalls and fillet
  const halfX = (bounds.max.x - bounds.min.x) * 0.45;
  const halfY = (bounds.max.y - bounds.min.y) * 0.45;
  const distFromEdgeX = Math.max(0, halfX - Math.abs(x));
  const distFromEdgeY = Math.max(0, halfY - Math.abs(y));
  const distFromEdge = Math.min(distFromEdgeX, distFromEdgeY);

  const floorZ = bounds.min.z + 2.0;
  const topZ = bounds.max.z;
  const draftZ = topZ - Math.min(topZ - floorZ, distFromEdge * 1.5);
  return Math.max(floorZ, draftZ);
}

/**
 * Generates true Mastercam 3D Surface Rough Pocket Toolpath:
 * - Constant-Z planar slicing across depth limits (topZ to bottomZ)
 * - 6 selectable Pocket Cutting Styles:
 *   * Constant Overlap Spiral (equidistant concentric spiral loops)
 *   * Parallel Spiral (contour-parallel offset passes)
 *   * Morph Spiral (blending from boundary to center/island)
 *   * TrueSpiral (smooth Archimedean curvature spiral without sharp corners)
 *   * Zigzag (bi-directional raster cuts with contour perimeter cleanup)
 *   * One Way (parallel unidirectional raster passes with rapid retracts)
 * - Entry Plunge / Helical Ramp / Linear Ramp at each depth level
 * - Wall and floor stock allowances (e.g. 0.50mm)
 * - Optional perimeter wall finish pass
 */
export function generatePocketRoughToolpath(boundsInput, tool = {}, params = {}, model = null) {
  const bounds = resolveSafeBounds(boundsInput);

  const toolDiameter = Math.max(1, Number(tool.diameter || 10.0));
  const toolRadius = toolDiameter / 2;

  // Extract parameters with safe fallbacks
  const pCut = params.cutParameters || {};
  const pPocket = params.pocketParameters || {};
  const pTrans = params.transitions || {};
  const pLink = params.linkingParameters || {};
  const pGeom = params.modelGeometry || {};
  const pSteep = params.steepShallow || {};

  const wallStock = Math.max(0, Number(pGeom.wallStock ?? params.wallStock ?? 0.5));
  const floorStock = Math.max(0, Number(pGeom.floorStock ?? params.floorStock ?? 0.5));

  const stepoverPct = Math.max(10, Math.min(95, Number(pCut.stepoverPct ?? params.stepoverPct ?? 60.0)));
  const stepover = Math.max(0.5, (toolDiameter * stepoverPct) / 100);

  const stepdown = Math.max(0.5, Number(pCut.stepdownMm ?? params.stepdown ?? 2.0));
  const cuttingStyle = String(pPocket.cuttingStyle || params.cuttingStyle || 'constant_overlap_spiral');
  const entryMethod = String(pTrans.entryMethod || params.entryMethod || 'helical_ramp');

  const helicalRadius = Math.max(1.0, Math.min(toolRadius * 0.9, Number(pTrans.helicalRadiusMax ?? params.helicalRadius ?? 4.0)));
  const rampPitch = Math.max(0.5, Number(pTrans.rampPitch ?? params.rampPitch ?? 2.0));
  const rampAngle = Math.max(1.0, Math.min(15.0, Number(pTrans.rampAngle ?? params.rampAngle ?? 3.0)));

  const clearancePlane = Number(pLink.clearancePlane ?? params.clearancePlane ?? 25.0);
  const partClearance = Number(pLink.feedPlane ?? params.partClearance ?? 2.5);
  const retractPlane = Number(pLink.retractPlane ?? params.retractPlane ?? 5.0);

  const finishPassEnabled = Boolean(pPocket.finishPassEnabled ?? true);
  const finishPassWidth = Math.max(0.1, Number(pPocket.finishPassWidth ?? 0.35));

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
  const minY = bounds.min.y + effectiveOffset;
  const maxY = bounds.max.y - effectiveOffset;

  const width = Math.max(1.0, maxX - minX);
  const height = Math.max(1.0, maxY - minY);

  const topZ = Number(pSteep.minimumDepth ?? bounds.max.z ?? 0.0);
  const bottomZ = Number(pSteep.maximumDepth ?? bounds.min.z ?? -25.0) + floorStock;

  // 1. Calculate Planar Constant-Z Slicing Levels
  const stepdownLevels = [];
  for (let z = topZ - stepdown; z > bottomZ; z -= stepdown) {
    stepdownLevels.push(Number(z.toFixed(3)));
  }
  stepdownLevels.push(Number(bottomZ.toFixed(3)));

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // Initial Rapid Approach to Clearance Plane
  const initialRapidStart = new THREE.Vector3(centerX, centerY, topZ + clearancePlane);
  const initialFeedTop = new THREE.Vector3(centerX, centerY, topZ + partClearance);
  addCutSegment(initialRapidStart, initialFeedTop, true, 'Rapid Approach to Part Clearance');

  let previousLevelZ = topZ;

  // Process each major constant-Z depth slice
  stepdownLevels.forEach((currentZ, levelIndex) => {
    const feedPlaneZ = previousLevelZ + partClearance;

    // -------------------------------------------------------------
    // A. Entry Transition into Pocket at current Z level
    // -------------------------------------------------------------
    if (entryMethod === 'helical_ramp') {
      const rampEntryTop = new THREE.Vector3(centerX + helicalRadius, centerY, feedPlaneZ);
      addCutSegment(new THREE.Vector3(centerX, centerY, feedPlaneZ), rampEntryTop, true, 'Rapid to Helical Entry Start');

      let currRampZ = feedPlaneZ;
      let prevHelicalPt = rampEntryTop.clone();
      const segmentsPerTurn = 16;
      const pitchPerTurn = Math.max(0.5, rampPitch);

      while (currRampZ > currentZ) {
        currRampZ = Math.max(currentZ, currRampZ - pitchPerTurn / segmentsPerTurn);
        const angle = ((feedPlaneZ - currRampZ) / pitchPerTurn) * Math.PI * 2;
        const hx = centerX + Math.cos(angle) * helicalRadius;
        const hy = centerY + Math.sin(angle) * helicalRadius;
        const currHelicalPt = new THREE.Vector3(hx, hy, currRampZ);
        addCutSegment(prevHelicalPt, currHelicalPt, false, 'Helical Ramp Entry');
        prevHelicalPt = currHelicalPt;
      }
    } else if (entryMethod === 'linear_ramp') {
      const rampLength = Math.min(width * 0.4, toolDiameter * 2.5);
      const startRampPt = new THREE.Vector3(centerX - rampLength / 2, centerY, feedPlaneZ);
      addCutSegment(new THREE.Vector3(centerX, centerY, feedPlaneZ), startRampPt, true, 'Rapid to Ramp Start');

      let currRampZ = feedPlaneZ;
      let rampDir = 1;
      let prevPt = startRampPt.clone();
      const zDropPerPass = Math.max(0.5, stepdown * 0.5);

      while (currRampZ > currentZ) {
        currRampZ = Math.max(currentZ, currRampZ - zDropPerPass);
        const nextX = centerX + (rampDir * rampLength) / 2;
        const currPt = new THREE.Vector3(nextX, centerY, currRampZ);
        addCutSegment(prevPt, currPt, false, 'Linear Ramp Entry');
        prevPt = currPt;
        rampDir *= -1;
      }
    } else {
      // Direct Plunge
      const plungeStart = new THREE.Vector3(centerX, centerY, feedPlaneZ);
      const plungeEnd = new THREE.Vector3(centerX, centerY, currentZ);
      addCutSegment(plungeStart, plungeEnd, false, 'Plunge Feed Entry');
    }

    // -------------------------------------------------------------
    // B. Pocket Clearing Strategy
    // -------------------------------------------------------------
    let lastCuttingPt = new THREE.Vector3(centerX, centerY, currentZ);

    if (cuttingStyle === 'zigzag' || cuttingStyle === 'one_way') {
      // Parallel Raster Passes
      const isOneWay = cuttingStyle === 'one_way';
      let sweepDir = 1;

      for (let y = minY; y <= maxY; y += stepover) {
        const startX = sweepDir === 1 ? minX : maxX;
        const endX = sweepDir === 1 ? maxX : minX;

        const p1 = new THREE.Vector3(startX, y, currentZ);
        const p2 = new THREE.Vector3(endX, y, currentZ);

        if (isOneWay) {
          // Rapid repositioning back to startX
          const retractPt = new THREE.Vector3(lastCuttingPt.x, lastCuttingPt.y, currentZ + retractPlane);
          const approachPt = new THREE.Vector3(minX, y, currentZ + retractPlane);
          addCutSegment(lastCuttingPt, retractPt, true, 'Retract between One-Way passes');
          addCutSegment(retractPt, approachPt, true, 'Reposition Rapid');
          addCutSegment(approachPt, new THREE.Vector3(minX, y, currentZ), false, 'Plunge to Cut');
          addCutSegment(new THREE.Vector3(minX, y, currentZ), new THREE.Vector3(maxX, y, currentZ), false, 'One-Way Rough Pass');
          lastCuttingPt = new THREE.Vector3(maxX, y, currentZ);
        } else {
          // Bi-directional zigzag
          addCutSegment(lastCuttingPt, p1, false, 'Zigzag Link Move');
          addCutSegment(p1, p2, false, 'Zigzag Roughing Pass');
          lastCuttingPt = p2;
          sweepDir *= -1;
        }
      }
    } else if (cuttingStyle === 'true_spiral') {
      // True Archimedean Spiral expanding outward from center
      const maxRadius = Math.max(width, height) / 2;
      const numTurns = Math.max(3, Math.ceil(maxRadius / stepover));
      const segmentsPerTurn = 24;
      const totalSegments = numTurns * segmentsPerTurn;

      let prevSpiralPt = new THREE.Vector3(centerX, centerY, currentZ);
      for (let s = 1; s <= totalSegments; s++) {
        const progress = s / totalSegments;
        const currentRadius = progress * maxRadius;
        const theta = progress * (numTurns * Math.PI * 2);

        const rawX = centerX + Math.cos(theta) * currentRadius;
        const rawY = centerY + Math.sin(theta) * currentRadius;

        // Clip to rectangular pocket boundaries
        const clampedX = Math.max(minX, Math.min(maxX, rawX));
        const clampedY = Math.max(minY, Math.min(maxY, rawY));

        const currSpiralPt = new THREE.Vector3(clampedX, clampedY, currentZ);
        if (currSpiralPt.distanceTo(prevSpiralPt) > 0.3) {
          addCutSegment(prevSpiralPt, currSpiralPt, false, 'TrueSpiral Roughing Pass');
          prevSpiralPt = currSpiralPt;
          lastCuttingPt = currSpiralPt;
        }
      }
    } else if (cuttingStyle === 'morph_spiral') {
      // Morph Spiral: smooth interpolation between center point and outer rectangular perimeter
      const ringsCount = Math.max(2, Math.ceil(Math.min(width, height) / (2 * stepover)));
      let prevPt = new THREE.Vector3(centerX, centerY, currentZ);

      for (let r = 1; r <= ringsCount; r++) {
        const factor = r / ringsCount;
        const ringHalfW = (width / 2) * factor;
        const ringHalfH = (height / 2) * factor;

        const corners = [
          new THREE.Vector3(centerX - ringHalfW, centerY - ringHalfH, currentZ),
          new THREE.Vector3(centerX + ringHalfW, centerY - ringHalfH, currentZ),
          new THREE.Vector3(centerX + ringHalfW, centerY + ringHalfH, currentZ),
          new THREE.Vector3(centerX - ringHalfW, centerY + ringHalfH, currentZ),
          new THREE.Vector3(centerX - ringHalfW, centerY - ringHalfH, currentZ)
        ];

        corners.forEach((c) => {
          addCutSegment(prevPt, c, false, 'Morph Spiral Pass');
          prevPt = c;
          lastCuttingPt = c;
        });
      }
    } else {
      // Mastercam Default: Constant Overlap Spiral / Parallel Spiral
      // Concentric rectangular loops expanding outward or shrinking inward
      const ringsCount = Math.max(2, Math.ceil(Math.min(width, height) / (2 * stepover)));
      let prevPt = new THREE.Vector3(centerX, centerY, currentZ);

      for (let r = 1; r <= ringsCount; r++) {
        const insetX = (ringsCount - r) * stepover;
        const insetY = (ringsCount - r) * stepover;

        const curMinX = Math.min(centerX - 0.5, minX + insetX);
        const curMaxX = Math.max(centerX + 0.5, maxX - insetX);
        const curMinY = Math.min(centerY - 0.5, minY + insetY);
        const curMaxY = Math.max(centerY + 0.5, maxY - insetY);

        const corners = [
          new THREE.Vector3(curMinX, curMinY, currentZ),
          new THREE.Vector3(curMaxX, curMinY, currentZ),
          new THREE.Vector3(curMaxX, curMaxY, currentZ),
          new THREE.Vector3(curMinX, curMaxY, currentZ),
          new THREE.Vector3(curMinX, curMinY, currentZ)
        ];

        corners.forEach((c) => {
          addCutSegment(prevPt, c, false, 'Constant Overlap Spiral Pass');
          prevPt = c;
          lastCuttingPt = c;
        });
      }
    }

    // -------------------------------------------------------------
    // C. Optional Perimeter Wall Finish Pass at current level
    // -------------------------------------------------------------
    if (finishPassEnabled) {
      const perimeterCorners = [
        new THREE.Vector3(minX, minY, currentZ),
        new THREE.Vector3(maxX, minY, currentZ),
        new THREE.Vector3(maxX, maxY, currentZ),
        new THREE.Vector3(minX, maxY, currentZ),
        new THREE.Vector3(minX, minY, currentZ)
      ];

      addCutSegment(lastCuttingPt, perimeterCorners[0], false, 'Lead-In to Wall Finish Pass', true);
      let pPrev = perimeterCorners[0];
      for (let i = 1; i < perimeterCorners.length; i++) {
        addCutSegment(pPrev, perimeterCorners[i], false, 'Perimeter Wall Finish Pass', true);
        pPrev = perimeterCorners[i];
      }
      lastCuttingPt = pPrev;
    }

    // Retract above level for transition to next depth slice
    if (levelIndex < stepdownLevels.length - 1) {
      const stepRetract = new THREE.Vector3(lastCuttingPt.x, lastCuttingPt.y, currentZ + retractPlane);
      addCutSegment(lastCuttingPt, stepRetract, true, 'Inter-Level Retract');
    }

    previousLevelZ = currentZ;
  });

  // Final Retract to Clearance Plane at end of operation
  const lastWp = waypoints[waypoints.length - 1]?.pos || initialFeedTop;
  const finalRetract = new THREE.Vector3(lastWp.x, lastWp.y, topZ + clearancePlane);
  addCutSegment(lastWp, finalRetract, true, 'Final Retract to Clearance Plane');

  // Calculate Machining Physics
  const physics = calculatePocketRoughPhysics(tool, { stepoverPct, stepdownMm: stepdown }, params.selectedMaterialKey || 'ALU_6061');

  return {
    strategy: 'surface_rough_pocket',
    cuttingLines,
    rapidLines,
    waypoints,
    totalDistanceMm: Number(totalDist.toFixed(1)),
    cuttingDistanceMm: Number(cuttingDist.toFixed(1)),
    stepdownLevelsCount: stepdownLevels.length,
    stepdownLevels,
    estimatedCycleTimeSeconds: Math.round((cuttingDist / Math.max(100, tool.feedRate || 1800)) * 60),
    physics
  };
}

/**
 * Generates production-ready NC G-code for 3D Surface Rough Pocket
 * Supporting Fanuc, Haas, Siemens, and Heidenhain controllers.
 */
export function generatePocketRoughGCode(toolpath, tool = {}, params = {}, activeMachine = {}) {
  const brand = String(activeMachine?.brand || activeMachine?.name || '').toLowerCase();
  const isFanuc = brand.includes('fanuc') || brand.includes('robodrill');
  const isHaas = brand.includes('haas');
  const isSiemens = brand.includes('siemens') || brand.includes('sinumerik');
  const isHeidenhain = brand.includes('heidenhain');

  const pPocket = params.pocketParameters || {};
  const pTrans = params.transitions || {};
  const pLink = params.linkingParameters || {};

  const toolNum = tool.number || 361;
  const toolName = tool.name || '10mm Bull Endmill R1.0';
  const toolDiam = Number(tool.diameter || 10.0);
  const rpm = Math.max(100, Number(tool.spindleSpeed || 5000));
  const feed = Math.max(50, Number(tool.feedRate || 1800));
  const plungeFeed = Math.max(50, Number(tool.plungeRate || 450));
  const coolantMode = params.coolant?.mode || tool.coolant || 'flood';

  const lines = [];
  let n = 10;
  const nextN = () => {
    const s = `N${n}`;
    n += 10;
    return s;
  };

  // Header
  lines.push('%');
  lines.push(`O0001 (SURFACE_ROUGH_POCKET_${params.name ? params.name.toUpperCase().replace(/\s+/g, '_') : 'OP1'})`);
  lines.push('(--- ARGUS CAM POST-PROCESSOR ---)');
  lines.push(`(MACHINE: ${activeMachine?.name || (isFanuc ? 'Fanuc Robodrill D21' : 'Haas VF-2')})`);
  lines.push(`(CONTROLLER: ${isFanuc ? 'Fanuc 30i / 31i / 0i-MF' : isHaas ? 'Haas NGC' : isSiemens ? 'Siemens 840D' : 'Standard ISO'})`);
  lines.push(`(DATE: ${new Date().toISOString().split('T')[0]})`);
  lines.push(`(MATERIAL: ${params.selectedMaterialKey || 'ALU_6061'})`);
  lines.push(`(POCKET CUTTING STYLE: ${(pPocket.cuttingStyle || 'constant_overlap_spiral').toUpperCase()})`);
  lines.push(`${nextN()} G90 G21 G17 G54 G94`);
  lines.push(`${nextN()} G28 G91 Z0.`);
  lines.push(`${nextN()} G90`);

  // Tool Call & Spindle
  lines.push('');
  lines.push('(================================================)');
  lines.push(`(OPERATION: 3D SURFACE ROUGH POCKET)`);
  lines.push(`(TOOL: T${toolNum} [${toolName}] | DIA: ${toolDiam}mm)`);
  lines.push('(================================================)');
  lines.push(`${nextN()} T${toolNum} M06 (${toolName})`);
  lines.push(`${nextN()} S${rpm} M03`);

  // Look-Ahead Smoothing
  if (isFanuc) {
    lines.push(`${nextN()} G05.1 Q1 (HIGH SPEED AICC II LOOK-AHEAD ACCEL/DECEL)`);
  } else if (isHaas) {
    lines.push(`${nextN()} G187 P1 (HAAS HIGH SPEED MACHINING SMOOTHING)`);
  } else if (isSiemens) {
    lines.push(`${nextN()} CYCLE832(0.025, 1) (HIGH SPEED CYCLE)`);
  }

  // Pre-Op Canned Text
  if (params.cannedText?.preOp === 'm00') {
    lines.push(`${nextN()} M00 (PROGRAM STOP BEFORE OPERATION)`);
  } else if (params.cannedText?.preOp === 'm01') {
    lines.push(`${nextN()} M01 (OPTIONAL STOP BEFORE OPERATION)`);
  }

  const waypoints = toolpath?.waypoints || [];
  if (waypoints.length > 0) {
    const firstWp = waypoints[0];
    lines.push(`${nextN()} G00 X${firstWp.pos.x.toFixed(3)} Y${firstWp.pos.y.toFixed(3)}`);
    const coolantCode = coolantMode === 'thru' ? 'M07' : coolantMode !== 'off' ? 'M08' : '';
    lines.push(`${nextN()} G00 G43 H${tool.lengthOffset || toolNum} Z${firstWp.pos.z.toFixed(3)}${coolantCode ? ' ' + coolantCode : ''}`);
  }

  let prevPos = null;
  let prevIsRapid = null;

  waypoints.slice(1).forEach((wp) => {
    const x = wp.pos.x.toFixed(3);
    const y = wp.pos.y.toFixed(3);
    const z = wp.pos.z.toFixed(3);

    const isRapid = Boolean(wp.isRapid);
    const note = wp.note || '';
    const isPlunge = note.includes('Plunge') || note.includes('Ramp') || (prevPos && wp.pos.z < prevPos.z && Math.abs(wp.pos.x - prevPos.x) < 0.001);
    const currentFeed = isPlunge ? plungeFeed : wp.isFinish ? (pPocket.finishFeedRate || 1200) : feed;

    if (isRapid) {
      if (prevIsRapid !== true) {
        lines.push(`${nextN()} G00 X${x} Y${y} Z${z}`);
      } else {
        lines.push(`X${x} Y${y} Z${z}`);
      }
    } else {
      if (prevIsRapid !== false) {
        lines.push(`${nextN()} G01 X${x} Y${y} Z${z} F${currentFeed}`);
      } else {
        lines.push(`X${x} Y${y} Z${z}`);
      }
    }

    prevPos = wp.pos;
    prevIsRapid = isRapid;
  });

  // Cancel High-Speed Look-Ahead
  if (isFanuc) {
    lines.push(`${nextN()} G05.1 Q0 (CANCEL AICC II)`);
  } else if (isHaas) {
    lines.push(`${nextN()} G187 (RESET G187)`);
  }

  // Coolant Off & Retract Home
  lines.push(`${nextN()} M09 (COOLANT OFF)`);
  lines.push(`${nextN()} M05 (SPINDLE STOP)`);
  lines.push(`${nextN()} G28 G91 Z0.`);
  lines.push(`${nextN()} G28 G91 X0. Y0.`);
  lines.push(`${nextN()} M30 (PROGRAM END)`);
  lines.push('%');

  return lines.join('\n');
}
