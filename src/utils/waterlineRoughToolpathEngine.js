/**
 * Mastercam-Authentic 3D Surface Rough Waterline Toolpath & Post-Processor Engine
 *
 * Implements multi-level volumetric constant-Z waterline roughing:
 * - Constant-Z slicing along vertical spindle axis (Three.js Y, CNC Z)
 * - Concentric contour offset clearing rings (inward / outward) per depth level
 * - Wall and floor stock allowances (e.g. 0.50mm)
 * - Perimeter wall contour cleanup pass per level
 * - Helical ramp plunge entry per level
 * - Production ISO Fanuc / Haas / Siemens CNC G-code post-processor
 */

import * as THREE from 'three';
import { calculateWaterlineRoughPhysics, resolveWaterlineRoughMachineCaps } from '../config/waterlineRoughSchema.js';
import { sliceMeshAtY, chainSegmentsIntoLoops, offsetClosedLoopXZ, orientClosedLoopXZ } from './toolpathEngine.js';

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
 * Generates 3D Surface Rough Waterline Toolpath.
 */
export function generateWaterlineRoughToolpath(boundsInput, toolInput = {}, opParams = {}, model = null) {
  const bounds = resolveSafeBounds(boundsInput);
  const tool = {
    id: toolInput.id || 3,
    number: toolInput.number || toolInput.id || 3,
    diameter: Number(toolInput.diameter || 10.0),
    cornerRadius: Number(toolInput.cornerRadius ?? toolInput.cornerRad ?? 0.0),
    flutes: Number(toolInput.flutes || 4),
    spindleSpeed: Number(toolInput.spindleSpeed || opParams.spindleSpeed || 12000),
    feedRate: Number(toolInput.feedRate || opParams.feedRate || 4800),
    plungeRate: Number(toolInput.plungeRate || opParams.plungeRate || 450),
    retractRate: Number(toolInput.retractRate || 5000)
  };

  const toolRadius = tool.diameter / 2;

  // Extract Mastercam Parameters
  const pCut = opParams.cutParameters || {};
  const pWaterline = opParams.waterlineParameters || {};
  const pTrans = opParams.transitions || {};
  const pModel = opParams.modelGeometry || {};
  const pLink = opParams.linkingParameters || {};
  const pSteep = opParams.steepShallow || {};

  const wallStock = Math.max(0, Number(pModel.wallStock ?? opParams.wallStock ?? 0.50));
  const floorStock = Math.max(0, Number(pModel.floorStock ?? opParams.floorStock ?? 0.50));

  const stepdown = Math.max(0.2, Number(pCut.stepdownMm ?? opParams.stepdown ?? 2.0));
  const stepoverPct = Math.max(10, Math.min(95, Number(pCut.stepoverPct ?? opParams.stepoverPct ?? 60.0)));
  const stepover = Number(((tool.diameter * stepoverPct) / 100).toFixed(2));

  const cuttingMethod = String(pCut.cuttingMethod || opParams.cuttingMethod || 'climb').toLowerCase();
  const cutDirection = String(pCut.cutDirection || opParams.cutDirection || 'outside_in').toLowerCase();
  const cleanWalls = Boolean(pWaterline.cleanWalls ?? opParams.cleanWalls ?? true);

  const entryMethod = String(pTrans.entryMethod || opParams.entryMethod || 'helical_ramp').toLowerCase();
  const helicalRadius = Math.max(1.0, Math.min(toolRadius * 0.9, Number(pTrans.helicalRadius || 4.0)));
  const rampPitch = Math.max(0.5, Number(pTrans.rampPitch || 2.0));

  const clearanceY = bounds.max.y + Number(pLink.clearancePlane || opParams.rapidHeight || 25.0);
  const retractRel = Number(pLink.retractHeight || opParams.retractHeight || 5.0);
  const retractY = bounds.max.y + retractRel;

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

  // 1. Calculate Planar Constant-Z Slicing Levels
  const stepdownLevels = [];
  for (let y = startY - stepdown; y > bottomY; y -= stepdown) {
    stepdownLevels.push(Number(y.toFixed(3)));
  }
  stepdownLevels.push(Number(bottomY.toFixed(3)));

  let lastPos = new THREE.Vector3(cx, clearanceY, cz);

  // 2. Iterate each Z-level slice
  stepdownLevels.forEach((currentLevelY, levelIdx) => {
    // 2A. Slicing at currentLevelY
    let baseOuterLoop = null;

    if (model) {
      const segments = sliceMeshAtY(model, currentLevelY, { wallOnly: false });
      const loops = chainSegmentsIntoLoops(segments, 1.0);
      if (loops.length > 0) {
        // Sort loops by 2D area (largest is outermost boundary)
        loops.sort((a, b) => {
          const bBoxA = new THREE.Box3().setFromPoints(a);
          const bBoxB = new THREE.Box3().setFromPoints(b);
          const areaA = (bBoxA.max.x - bBoxA.min.x) * (bBoxA.max.z - bBoxA.min.z);
          const areaB = (bBoxB.max.x - bBoxB.min.x) * (bBoxB.max.z - bBoxB.min.z);
          return areaB - areaA;
        });
        baseOuterLoop = loops[0].map((p) => new THREE.Vector3(p.x, currentLevelY, p.z));
      }
    }

    // Fallback parametric boundary if model slicing is empty or unavailable
    if (!baseOuterLoop || baseOuterLoop.length < 3) {
      baseOuterLoop = [
        new THREE.Vector3(minX, currentLevelY, minZ),
        new THREE.Vector3(maxX, currentLevelY, minZ),
        new THREE.Vector3(maxX, currentLevelY, maxZ),
        new THREE.Vector3(minX, currentLevelY, maxZ),
        new THREE.Vector3(minX, currentLevelY, minZ)
      ];
    }

    // Ensure loop is closed
    if (baseOuterLoop[0].distanceTo(baseOuterLoop[baseOuterLoop.length - 1]) > 0.05) {
      baseOuterLoop.push(baseOuterLoop[0].clone());
    }

    // Orient loop: Climb cutting = CCW in CNC XY (wantCncCCW = true)
    const wantCncCCW = cuttingMethod === 'climb';
    const orientedOuterLoop = orientClosedLoopXZ(baseOuterLoop, wantCncCCW);

    // 2B. Generate Concentric Offset Clearing Rings
    // Calculate maximum inset distance from boundary to center
    const loopBounds = new THREE.Box3().setFromPoints(orientedOuterLoop);
    const spanX = Math.max(1.0, loopBounds.max.x - loopBounds.min.x);
    const spanZ = Math.max(1.0, loopBounds.max.z - loopBounds.min.z);
    const maxInset = Math.min(spanX, spanZ) / 2;

    const rings = [];
    rings.push(orientedOuterLoop);

    let currentOffset = -stepover;
    while (Math.abs(currentOffset) < maxInset - 1.0) {
      const insetRing = offsetClosedLoopXZ(orientedOuterLoop, currentOffset, currentLevelY, true);
      if (insetRing && insetRing.length >= 3) {
        if (insetRing[0].distanceTo(insetRing[insetRing.length - 1]) > 0.05) {
          insetRing.push(insetRing[0].clone());
        }
        rings.push(orientClosedLoopXZ(insetRing, wantCncCCW));
      } else {
        break;
      }
      currentOffset -= stepover;
    }

    // Order rings: outside_in (cavity) vs inside_out (core)
    const orderedRings = cutDirection === 'inside_out' ? [...rings].reverse() : rings;

    // 2C. Helical Ramp Entry at First Ring
    const firstRing = orderedRings[0] || orientedOuterLoop;
    const rampEntryPt = firstRing[0];

    const rampApproach = new THREE.Vector3(rampEntryPt.x, currentLevelY + rampPitch * 2, rampEntryPt.z);
    addCutSegment(lastPos, rampApproach, true, `Rapid to Level ${levelIdx + 1}`);
    lastPos = rampApproach;

    if (entryMethod === 'helical_ramp') {
      const helicalTurns = 2.0;
      const segmentsPerTurn = 16;
      const totalSegments = Math.round(helicalTurns * segmentsPerTurn);
      const totalRampZ = rampPitch * helicalTurns;
      const rampStartY = currentLevelY + totalRampZ;

      let prevHelixPt = new THREE.Vector3(
        rampEntryPt.x + helicalRadius,
        rampStartY,
        rampEntryPt.z
      );
      addCutSegment(lastPos, prevHelixPt, false, 'Helical entry start');

      for (let s = 1; s <= totalSegments; s++) {
        const theta = (s / segmentsPerTurn) * Math.PI * 2;
        const curY = rampStartY - (s / totalSegments) * totalRampZ;
        const hx = rampEntryPt.x + helicalRadius * Math.cos(theta);
        const hz = rampEntryPt.z + helicalRadius * Math.sin(theta);
        const curPt = new THREE.Vector3(hx, curY, hz);
        addCutSegment(prevHelixPt, curPt, false, 'Helical Ramp Plunge');
        prevHelixPt = curPt;
      }
      lastPos = prevHelixPt;
    } else if (entryMethod === 'linear_ramp') {
      const rampStart = new THREE.Vector3(rampEntryPt.x - 8, currentLevelY + 2.0, rampEntryPt.z);
      const rampEnd = new THREE.Vector3(rampEntryPt.x, currentLevelY, rampEntryPt.z);
      addCutSegment(lastPos, rampStart, false, 'Linear ramp start');
      addCutSegment(rampStart, rampEnd, false, 'Linear Ramp Plunge');
      lastPos = rampEnd;
    } else {
      const plungePt = new THREE.Vector3(rampEntryPt.x, currentLevelY, rampEntryPt.z);
      addCutSegment(lastPos, plungePt, false, 'Plunge Feed');
      lastPos = plungePt;
    }

    // 2D. Cut Each Concentric Waterline Ring
    orderedRings.forEach((ring, ringIdx) => {
      if (lastPos.distanceTo(ring[0]) > 0.05) {
        addCutSegment(lastPos, ring[0], false, `Ring ${ringIdx + 1} Lead-In`);
      }
      for (let i = 1; i < ring.length; i++) {
        addCutSegment(ring[i - 1], ring[i], false, `Waterline Ring ${ringIdx + 1} Cut`);
      }
      lastPos = ring[ring.length - 1];
    });

    // 2E. Wall Cleanup Pass (Traces outer profile once at final ring step)
    if (cleanWalls && orientedOuterLoop.length >= 3) {
      if (lastPos.distanceTo(orientedOuterLoop[0]) > 0.05) {
        addCutSegment(lastPos, orientedOuterLoop[0], false, 'Wall Cleanup Lead-In', true);
      }
      for (let w = 1; w < orientedOuterLoop.length; w++) {
        addCutSegment(orientedOuterLoop[w - 1], orientedOuterLoop[w], false, 'Perimeter Wall Cleanup Pass', true);
      }
      lastPos = orientedOuterLoop[orientedOuterLoop.length - 1];
    }

    // 2F. Retract after Level
    const levelRetract = new THREE.Vector3(lastPos.x, retractY, lastPos.z);
    addCutSegment(lastPos, levelRetract, true, 'Level Retract');
    lastPos = levelRetract;
  });

  // Final Retract to Clearance Plane
  const finalClearance = new THREE.Vector3(lastPos.x, clearanceY, lastPos.z);
  addCutSegment(lastPos, finalClearance, true, 'Final Clearance Retract');

  const physics = calculateWaterlineRoughPhysics(
    tool,
    { stepoverPct, stepdownMm: stepdown },
    opParams.selectedMaterialKey || 'ALU_6061'
  );

  return {
    strategy: 'surface_rough_waterline',
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
 * Standard Production Fanuc / Haas CNC G-Code Generator for 3D Surface Rough Waterline.
 */
export function generateWaterlineRoughGCode(
  toolpathData,
  toolInput = {},
  opParams = {},
  machineConfig = {},
  programNumber = 1,
  programName = 'SURFACE_ROUGH_WATERLINE'
) {
  if (!toolpathData || !Array.isArray(toolpathData.waypoints) || toolpathData.waypoints.length === 0) {
    return '%\nO0001 (ERROR: NO TOOLPATH GENERATED)\nM30\n%';
  }

  const tool = {
    number: toolInput.number || toolInput.id || 3,
    diameter: Number(toolInput.diameter || 10.0),
    name: toolInput.name || `${toolInput.diameter || 10}mm Flat Endmill`,
    spindleSpeed: Number(toolInput.spindleSpeed || opParams.spindleSpeed || 12000),
    feedRate: Number(toolInput.feedRate || opParams.feedRate || 4800),
    plungeRate: Number(toolInput.plungeRate || opParams.plungeRate || 450)
  };

  const safeBounds = toolpathData.bounds || { max: { y: 0 } };
  const topY = safeBounds.max?.y || 0;

  // Convert Three.js coordinates to CNC coordinates:
  // CNC X = Three.js X
  // CNC Y = -Three.js Z
  // CNC Z = Three.js Y - topY
  const toCnc = (p) => ({
    x: Number(p.x.toFixed(3)),
    y: Number((-p.z).toFixed(3)),
    z: Number((p.y - topY).toFixed(3))
  });

  const lines = [];
  let n = 10;
  const nextN = () => {
    const num = n;
    n += 10;
    return `N${num}`;
  };

  const progNumStr = String(programNumber).padStart(4, '0');
  lines.push('%');
  lines.push(`O${progNumStr} (${String(programName).toUpperCase()})`);
  lines.push('(--- ARGUS CAM POST-PROCESSOR ---)');
  lines.push(`(MACHINE: ${machineConfig.name || 'Fanuc Robodrill D21'})`);
  lines.push('(CONTROLLER: Fanuc 30i / 31i / 0i-MF)');
  lines.push(`(DATE: ${new Date().toISOString().slice(0, 10)})`);
  lines.push(`(MATERIAL: ${opParams.selectedMaterialKey || 'Alu 6061-T6'})`);
  lines.push(`${nextN()} G90 G21 G17 G54 G94`);
  lines.push(`${nextN()} G28 G91 Z0.`);
  lines.push(`${nextN()} G90`);
  lines.push('');
  lines.push('(================================================)');
  lines.push(`(OPERATION 1: SURFACE ROUGH WATERLINE)`);
  lines.push(`(TOOL: T${tool.number} [${tool.name}] | DIA: ${tool.diameter}mm)`);
  lines.push('(================================================)');
  lines.push(`${nextN()} T${tool.number} M06 (${tool.name})`);
  lines.push(`${nextN()} S${tool.spindleSpeed} M03`);

  const caps = resolveWaterlineRoughMachineCaps(machineConfig);
  if (caps && caps.highSpeedSmoothingCode) {
    lines.push(`${nextN()} ${caps.highSpeedSmoothingCode}`);
  }

  const wps = toolpathData.waypoints;
  let firstPos = toCnc(wps[0].pos);
  lines.push(`${nextN()} G00 X${firstPos.x.toFixed(3)} Y${firstPos.y.toFixed(3)}`);
  lines.push(`${nextN()} G00 G43 H${tool.number} Z25.000 M08`);

  let currentFeed = 0;
  let currentMode = '';

  for (let i = 0; i < wps.length; i++) {
    const wp = wps[i];
    const cnc = toCnc(wp.pos);
    const targetMode = wp.isRapid ? 'G00' : 'G01';

    let lineStr = '';
    const isNewMode = targetMode !== currentMode;

    if (targetMode === 'G00') {
      lineStr = `${nextN()} G00 X${cnc.x.toFixed(3)} Y${cnc.y.toFixed(3)} Z${cnc.z.toFixed(3)}`;
      currentMode = 'G00';
    } else {
      const feed = wp.isPlunge ? tool.plungeRate : tool.feedRate;
      const isNewFeed = feed !== currentFeed;

      if (isNewMode || isNewFeed) {
        lineStr = `${nextN()} G01 X${cnc.x.toFixed(3)} Y${cnc.y.toFixed(3)} Z${cnc.z.toFixed(3)} F${feed}`;
        currentMode = 'G01';
        currentFeed = feed;
      } else {
        lineStr = `${nextN()} G01 X${cnc.x.toFixed(3)} Y${cnc.y.toFixed(3)} Z${cnc.z.toFixed(3)} F${currentFeed}`;
      }
    }
    lines.push(lineStr);
  }

  lines.push(`${nextN()} G00 Z25.000 M09`);
  lines.push('');
  lines.push('(--- PROGRAM END ---)');
  if (caps && caps.highSpeedSmoothingCancel) {
    lines.push(`${nextN()} ${caps.highSpeedSmoothingCancel}`);
  }
  lines.push(`${nextN()} M05`);
  lines.push(`${nextN()} G28 G91 Z0.`);
  lines.push(`${nextN()} G28 G91 X0. Y0.`);
  lines.push(`${nextN()} G90`);
  lines.push(`${nextN()} M30`);
  lines.push('%');

  return lines.join('\n');
}
