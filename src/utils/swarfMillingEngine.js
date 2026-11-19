import * as THREE from 'three';
import {
  SWARF_MACHINE_KINEMATICS,
  SWARF_TCPM_DIALECTS,
  SWARF_MILLING_MATERIALS,
  calculateSwarfPhysics
} from '../config/swarfMillingSchema.js';

/**
 * Utility: converts any point representation to THREE.Vector3 safely
 */
function toVector3(pt, defaultVal = [0, 0, 0]) {
  if (!pt) return new THREE.Vector3(...defaultVal);
  if (pt instanceof THREE.Vector3) return pt.clone();
  if (Array.isArray(pt)) return new THREE.Vector3(pt[0] || 0, pt[1] || 0, pt[2] || 0);
  return new THREE.Vector3(pt.x || 0, pt.y || 0, pt.z || 0);
}

/**
 * Generates sample upper and lower rail curves for realistic 5-axis swarf milling
 * Creates a ruled wall with draft angle, progressive curvature, and variable flank slope.
 */
export function generateSampleSwarfRails(bounds = null, wallHeight = 22.0, draftAngleDeg = 14.0) {
  const b = bounds || {
    min: { x: -45, y: 0, z: -25 },
    max: { x: 45, y: 35, z: 25 }
  };

  const totalH = Math.max(10, b.max.y - b.min.y);
  const xMin = b.min.x + (b.max.x - b.min.x) * 0.08;
  const xMax = b.max.x - (b.max.x - b.min.x) * 0.08;

  // Anchor lower rail above base flange
  const yBot = b.min.y + Math.max(1.0, totalH * 0.25);
  const effWallHeight = Math.max(8.0, Math.min(wallHeight, b.max.y - yBot));
  const yTop = yBot + effWallHeight;
  const zBase = (b.min.z + b.max.z) / 2 + (b.max.z - b.min.z) * 0.15;

  const numPoints = 60;
  const lowerRail = [];
  const upperRail = [];

  const draftRad = (draftAngleDeg * Math.PI) / 180;
  const draftOffsetZ = effWallHeight * Math.tan(draftRad);

  for (let i = 0; i < numPoints; i++) {
    const u = i / (numPoints - 1);
    const x = xMin + u * (xMax - xMin);

    // Aerodynamic S-curve contour in Z
    const wave = Math.sin(u * Math.PI) * 16.0 - Math.cos(u * Math.PI * 2) * 4.0;
    const zLower = zBase + wave;

    // Upper rail has variable draft angle tilt and subtle torsion
    const variableDraft = draftOffsetZ * (1.0 + 0.3 * Math.sin(u * Math.PI));
    const zUpper = zLower + variableDraft;

    // Lower rail curve point
    lowerRail.push(new THREE.Vector3(x, yBot, zLower));
    // Upper rail curve point
    upperRail.push(new THREE.Vector3(x, yTop, zUpper));
  }

  return { lowerRail, upperRail, wallHeight: effWallHeight };
}

/**
 * Intelligently extracts lower and upper ruled guide rails directly from active CAD model geometry.
 * Detects ruled blade walls, aerodynamic vanes, or tall drafted features.
 */
export function extractRuledRailsFromModel(model, bounds = null, options = {}) {
  if (!model) return null;

  const allVertices = [];
  model.traverse((child) => {
    if (child.isMesh && child.geometry && child.geometry.attributes?.position) {
      child.updateMatrixWorld(true);
      const pos = child.geometry.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        v.applyMatrix4(child.matrixWorld);
        allVertices.push(v.clone());
      }
    }
  });

  if (allVertices.length < 20) return null;

  let maxY = -Infinity;
  for (const p of allVertices) {
    if (p.y > maxY) maxY = p.y;
  }

  // Identify the tallest feature crest (vertices within 4.5mm of maxY)
  const crestPts = allVertices.filter((p) => p.y >= maxY - 4.5);
  if (crestPts.length === 0) return null;

  const crestCenterZ = crestPts.reduce((acc, p) => acc + p.z, 0) / crestPts.length;

  // Filter vertices that belong to this ruled wall feature in the primary horizontal plane (e.g. Z strip)
  const wallPts = allVertices.filter((p) => Math.abs(p.z - crestCenterZ) <= 35.0);
  if (wallPts.length < 16) return null;

  // Determine horizontal span along X from crest and bin
  let crestMinX = Infinity, crestMaxX = -Infinity;
  for (const p of crestPts) {
    if (p.x < crestMinX) crestMinX = p.x;
    if (p.x > crestMaxX) crestMaxX = p.x;
  }

  const spanX = crestMaxX - crestMinX;
  if (spanX < 10.0) return null;

  const numBins = Math.min(50, Math.max(20, Math.floor(wallPts.length / 15)));
  const binWidth = spanX / numBins;
  const rawLower = [];
  const rawUpper = [];

  for (let b = 0; b < numBins; b++) {
    const binCenter = crestMinX + (b + 0.5) * binWidth;
    const pts = wallPts.filter((p) => Math.abs(p.x - binCenter) <= binWidth * 0.85);
    if (pts.length >= 2) {
      let lowest = pts[0];
      let highest = pts[0];
      for (const p of pts) {
        if (p.y < lowest.y) lowest = p;
        if (p.y > highest.y) highest = p;
      }
      if (highest.y - lowest.y >= 3.0) {
        rawLower.push(lowest.clone());
        rawUpper.push(highest.clone());
      }
    }
  }

  if (rawLower.length < 6 || rawUpper.length < 6) return null;

  // Calculate measured wall height
  const measuredHeight =
    rawUpper.reduce((acc, p, i) => acc + (p.y - rawLower[i].y), 0) / rawUpper.length;

  return {
    lowerRail: rawLower,
    upperRail: rawUpper,
    wallHeight: Math.max(5.0, Number(measuredHeight.toFixed(2)))
  };
}

/**
 * Resamples a polyline curve to N equidistant points by cumulative arc length
 */
export function resampleCurveByArcLength(curvePoints, numSamples = 60) {
  if (!Array.isArray(curvePoints) || curvePoints.length < 2) return curvePoints;

  const distances = [0];
  let totalLength = 0;

  for (let i = 1; i < curvePoints.length; i++) {
    const d = curvePoints[i].distanceTo(curvePoints[i - 1]);
    totalLength += d;
    distances.push(totalLength);
  }

  if (totalLength <= 0.0001) return curvePoints;

  const resampled = [];
  for (let i = 0; i < numSamples; i++) {
    const targetDist = (i / (numSamples - 1)) * totalLength;

    // Find segment
    let segIdx = 0;
    while (segIdx < distances.length - 2 && distances[segIdx + 1] < targetDist) {
      segIdx++;
    }

    const d0 = distances[segIdx];
    const d1 = distances[segIdx + 1];
    const segLen = d1 - d0;
    const alpha = segLen > 0.00001 ? (targetDist - d0) / segLen : 0;

    const p0 = curvePoints[segIdx];
    const p1 = curvePoints[segIdx + 1];
    const interp = new THREE.Vector3().lerpVectors(p0, p1, alpha);
    resampled.push(interp);
  }

  return resampled;
}

/**
 * Synchronizes upper and lower rail curves based on selected synchronization mode:
 * - arclength: Matches equal fractional distance along each rail
 * - parametric: Direct index mapping
 * - shortest_distance: Orthogonal projection to minimize torsion
 */
export function synchronizeSwarfRails(lowerRail, upperRail, syncMode = 'arclength', numStations = 60) {
  const botResampled = resampleCurveByArcLength(lowerRail, numStations);
  let topResampled = [];

  if (syncMode === 'parametric') {
    topResampled = resampleCurveByArcLength(upperRail, numStations);
  } else if (syncMode === 'shortest_distance') {
    // For each point on lower rail, find closest point along upper rail
    const fineTop = resampleCurveByArcLength(upperRail, numStations * 3);
    for (let i = 0; i < botResampled.length; i++) {
      const pBot = botResampled[i];
      let bestDist = Infinity;
      let bestPt = fineTop[0];

      for (let j = 0; j < fineTop.length; j++) {
        const d = pBot.distanceTo(fineTop[j]);
        if (d < bestDist) {
          bestDist = d;
          bestPt = fineTop[j];
        }
      }
      topResampled.push(bestPt.clone());
    }
  } else {
    // Default: 'arclength'
    topResampled = resampleCurveByArcLength(upperRail, numStations);
  }

  return { lowerStations: botResampled, upperStations: topResampled };
}

/**
 * Calculates Tool Orientation Vector (I, J, K) and Surface Normal at each swarf station.
 * Applies Lead / Lag angle and Side Tilt offset.
 */
export function calculateSwarfToolVector({
  pBot,
  pTop,
  pNextBot,
  leadAngleDeg = 0.0,
  tiltOffsetDeg = 0.0
}) {
  // 1. Ruling vector from lower rail to upper rail
  const rulingVec = new THREE.Vector3().subVectors(pTop, pBot);
  if (rulingVec.lengthSq() < 0.0001) {
    rulingVec.set(0, 1, 0);
  } else {
    rulingVec.normalize();
  }

  // 2. Path tangent vector along feed direction
  const tangent = new THREE.Vector3().subVectors(pNextBot, pBot);
  if (tangent.lengthSq() < 0.0001) {
    tangent.set(1, 0, 0);
  } else {
    tangent.normalize();
  }

  // 3. Surface normal vector perpendicular to both ruling and tangent
  // N = tangent x ruling
  const normal = new THREE.Vector3().crossVectors(tangent, rulingVec);
  if (normal.lengthSq() < 0.0001) {
    normal.set(0, 0, 1);
  } else {
    normal.normalize();
  }

  // 4. Binormal vector perpendicular to normal and ruling
  const binormal = new THREE.Vector3().crossVectors(rulingVec, normal).normalize();

  // 5. Apply Lead / Lag angle: tilt tool vector forward/backward along binormal
  const toolVector = rulingVec.clone();
  if (Math.abs(leadAngleDeg) > 0.01) {
    const leadRad = (leadAngleDeg * Math.PI) / 180;
    toolVector.applyAxisAngle(normal, leadRad);
  }

  // 6. Apply Side Tilt Offset: tilt tool vector sideways around tangent
  if (Math.abs(tiltOffsetDeg) > 0.01) {
    const tiltRad = (tiltOffsetDeg * Math.PI) / 180;
    toolVector.applyAxisAngle(tangent, tiltRad);
  }

  toolVector.normalize();

  // Ensure tool vector points upwards (+Y in Three.js coordinate system)
  if (toolVector.y < 0.05) {
    toolVector.y = Math.abs(toolVector.y) + 0.1;
    toolVector.normalize();
  }

  return {
    toolVector,
    normal,
    tangent,
    rulingVec
  };
}

/**
 * Solves Inverse Kinematics (IK) for 5-axis machines.
 * Converts 3D tool vector (I, J, K) to physical machine rotary axes (A, C) or (B, C).
 */
export function solveSwarfMachineAngles(toolVector, kinematicsId = 'table_table_ac') {
  const v = toVector3(toolVector, [0, 1, 0]).normalize();

  // Coordinate Mapping: Three.js -> CNC Machine
  // CNC X = Three.js X
  // CNC Y = -Three.js Z
  // CNC Z = Three.js Y
  const I = v.x;
  const J = -v.z;
  const K = v.y;

  let A = 0;
  let B = 0;
  let C = 0;

  if (kinematicsId === 'table_table_ac') {
    // Trunnion AC: A tilts around CNC X, C rotates around CNC Z
    A = Math.atan2(J, Math.max(0.001, K)) * (180 / Math.PI);
    C = Math.atan2(I, Math.max(0.001, Math.hypot(J, K))) * (180 / Math.PI);
  } else if (kinematicsId === 'table_table_bc') {
    // Trunnion BC: B tilts around CNC Y, C rotates around CNC Z
    B = Math.atan2(I, Math.max(0.001, K)) * (180 / Math.PI);
    C = Math.atan2(J, Math.max(0.001, Math.hypot(I, K))) * (180 / Math.PI);
  } else if (kinematicsId === 'head_table_bc') {
    // Swivel Head B tilts around CNC Y, C table rotates around CNC Z
    B = Math.atan2(I, Math.max(0.001, K)) * (180 / Math.PI);
    C = Math.atan2(J, Math.max(0.001, Math.hypot(I, K))) * (180 / Math.PI);
  } else {
    // Head-Head AB: Fork tilts around CNC X (A) and spindle tilts around CNC Y (B)
    A = Math.atan2(J, Math.max(0.001, K)) * (180 / Math.PI);
    B = Math.atan2(I, Math.max(0.001, K)) * (180 / Math.PI);
  }

  return {
    I: Number(I.toFixed(5)),
    J: Number(J.toFixed(5)),
    K: Number(K.toFixed(5)),
    A: Number(A.toFixed(3)),
    B: Number(B.toFixed(3)),
    C: Number(C.toFixed(3))
  };
}

/**
 * Builds smooth 3D roll-in or roll-out arc waypoints.
 * Rolls the tool flank tangentially into wall contact to eliminate shock loading and dwell marks.
 */
export function buildSwarfRollArc({
  startCenterPt,
  startNormal,
  startTangent,
  toolVector,
  angles,
  radius = 8.0,
  angleDeg = 60.0,
  isRollIn = true,
  feedRate = 1800,
  numArcPoints = 8
}) {
  const waypoints = [];
  const arcRad = (angleDeg * Math.PI) / 180;

  for (let i = 0; i <= numArcPoints; i++) {
    const fraction = i / numArcPoints;
    // For roll-in: arc angles from -arcRad to 0
    // For roll-out: arc angles from 0 to +arcRad
    const theta = isRollIn ? -arcRad * (1 - fraction) : arcRad * fraction;

    const normalOffset = Math.cos(theta) * radius;
    const tangentOffset = Math.sin(theta) * radius;

    const arcPt = startCenterPt
      .clone()
      .addScaledVector(startNormal, normalOffset - radius)
      .addScaledVector(startTangent, tangentOffset);

    waypoints.push({
      point: arcPt,
      toolVector: toolVector.clone(),
      vector: toolVector.clone(),
      angles: { ...angles },
      feedRate,
      type: isRollIn ? 'lead_in' : 'lead_out'
    });
  }

  return waypoints;
}

/**
 * Main Algorithmic Engine: Generates complete Mastercam 5-Axis Swarf Milling Toolpath
 */
export function generateMastercamSwarfToolpath(bounds, tool = {}, config = {}) {
  const dia = Math.max(1, Number(tool?.diameter) || 10);
  const toolRadius = dia / 2;

  // Resolve Rails Geometry: CAD extraction -> Explicit rails -> High-fidelity sample rails
  let railsData = null;
  if (config.lowerRail && config.upperRail) {
    railsData = {
      lowerRail: config.lowerRail,
      upperRail: config.upperRail,
      wallHeight: Number(config.wallHeightMm) || 22.0
    };
  } else if (config.model) {
    railsData = extractRuledRailsFromModel(config.model, bounds, config);
  }

  const defaultWallHeight = Number(config.wallHeightMm) || 22.0;
  if (!railsData) {
    railsData = generateSampleSwarfRails(bounds, defaultWallHeight, 14.0);
  }

  const wallHeight = Number(config.wallHeightMm) || railsData.wallHeight || defaultWallHeight;

  const syncMode = config.syncMode || 'arclength';
  const numStations = Math.max(30, Number(config.stationsCount) || 50);
  const { lowerStations, upperStations } = synchronizeSwarfRails(
    railsData.lowerRail,
    railsData.upperRail,
    syncMode,
    numStations
  );

  const isClimb = config.cutDirection !== 'conventional';
  const sideSign = isClimb ? 1 : -1; // 1 for left of curve, -1 for right
  const isOneWay = config.cuttingMethod !== 'zig_zag';

  // Multi-Pass (Radial Stock Allowances)
  const enableRadial = Boolean(config.enableRadialPasses);
  const numRadialPasses = enableRadial ? Math.max(1, Number(config.radialPasses) || 1) : 1;
  const radialStepover = Number(config.radialStepover) || 0.5;
  const stockWall = Number(config.stockToLeaveWall) || 0.0;

  // Multi-Depth (Axial Slices)
  const enableAxial = Boolean(config.enableAxialSlices);
  const numAxialSlices = enableAxial ? Math.max(1, Number(config.axialSlices) || 1) : 1;
  const floorClearance = Number(config.floorClearanceMm) || 0.5;

  const clearanceZ = Number(config.clearanceZ) || 45.0;
  const retractZ = Number(config.retractZ) || 10.0;
  const feedPlaneZ = Number(config.feedPlaneZ) || 3.0;

  const leadAngleDeg = Number(config.leadAngleDeg) || 0.0;
  const tiltOffsetDeg = Number(config.tiltOffsetDeg) || 0.0;
  const kinematicsId = config.machineKinematics || 'table_table_ac';

  const rollInRadius = Number(config.rollInRadiusMm) || 8.0;
  const rollInAngleDeg = Number(config.rollInAngleDeg) || 60.0;

  const cuttingFeed = Number(config.feedRate) || 2800;
  const plungeFeed = Number(config.plungeFeed) || 450;
  const retractFeed = Number(config.retractFeed) || 5000;

  const trajectoryPoints = [];
  const cuttingLines = [];
  const rapidLines = [];
  const arcLines = [];
  const vectorNeedles = [];
  const flankRibbonVertices = [];

  let lastPosition = null;

  // Iterate over Axial Slices (from top to bottom or bottom to top)
  for (let aIdx = 0; aIdx < numAxialSlices; aIdx++) {
    // Fractional height along flank: 0 = lower rail (floor), 1 = upper rail (top)
    // Slicing from top down gives better tool stability:
    const axialFraction =
      numAxialSlices > 1 ? (numAxialSlices - 1 - aIdx) / (numAxialSlices - 1) : 0.0;

    // Iterate over Radial Passes (from outer roughing pass inwards to final finish pass)
    for (let rIdx = 0; rIdx < numRadialPasses; rIdx++) {
      const radialOffset = (numRadialPasses - 1 - rIdx) * radialStepover + stockWall;
      const totalOffset = toolRadius + radialOffset;

      const passWaypoints = [];
      const passDirForward = isOneWay || (aIdx + rIdx) % 2 === 0;

      const stationIndices = [];
      if (passDirForward) {
        for (let i = 0; i < numStations; i++) stationIndices.push(i);
      } else {
        for (let i = numStations - 1; i >= 0; i--) stationIndices.push(i);
      }

      for (let s = 0; s < stationIndices.length; s++) {
        const idx = stationIndices[s];
        const nextIdx = Math.min(numStations - 1, idx + (passDirForward ? 1 : -1));

        const pBot = lowerStations[idx];
        const pTop = upperStations[idx];
        const pNextBot = lowerStations[nextIdx];

        // Solve tool vector & surface normal
        const { toolVector, normal, tangent } = calculateSwarfToolVector({
          pBot,
          pTop,
          pNextBot,
          leadAngleDeg,
          tiltOffsetDeg
        });

        // Ruling point at current axial slice fraction
        const pRuling = new THREE.Vector3().lerpVectors(pBot, pTop, axialFraction);
        // Add floor clearance lift if at bottom slice
        if (axialFraction <= 0.05) {
          pRuling.y += floorClearance;
        }

        // Cutter center path: offset horizontally along surface normal to preserve exact cutting height
        const horizNormal = new THREE.Vector3(normal.x, 0, normal.z);
        if (horizNormal.lengthSq() > 0.001) horizNormal.normalize();
        else horizNormal.set(0, 0, 1);

        const cutterCenter = pRuling.clone().addScaledVector(horizNormal, sideSign * totalOffset);
        cutterCenter.y = Math.max(pBot.y + floorClearance, cutterCenter.y);

        const angles = solveSwarfMachineAngles(toolVector, kinematicsId);

        passWaypoints.push({
          point: cutterCenter,
          toolVector,
          vector: toolVector,
          normal,
          tangent,
          angles,
          feedRate: cuttingFeed,
          type: 'cutting',
          passIndex: rIdx,
          sliceIndex: aIdx
        });

        // Generate 5-Axis Tool Orientation Vectors (Needles) every 3rd station
        if (s % 3 === 0) {
          const needleStart = cutterCenter.clone();
          const needleLen = Math.min(25.0, Math.max(12.0, wallHeight * 0.7));
          const needleEnd = cutterCenter.clone().addScaledVector(toolVector, needleLen);
          vectorNeedles.push([needleStart, needleEnd]);
        }

        // Generate Flank Contact Ribbon (Mastercam Shaded Swept Flute Engagement Surface)
        if (rIdx === numRadialPasses - 1 && s > 0) {
          const prevIdx = stationIndices[s - 1];
          const currIdx = stationIndices[s];
          const pL0 = lowerStations[prevIdx];
          const pU0 = upperStations[prevIdx];
          const pL1 = lowerStations[currIdx];
          const pU1 = upperStations[currIdx];

          flankRibbonVertices.push(
            pL0.x, pL0.y, pL0.z,
            pU0.x, pU0.y, pU0.z,
            pU1.x, pU1.y, pU1.z,

            pL0.x, pL0.y, pL0.z,
            pU1.x, pU1.y, pU1.z,
            pL1.x, pL1.y, pL1.z
          );
        }
      }

      if (passWaypoints.length < 2) continue;

      const firstPassPt = passWaypoints[0];
      const lastPassPt = passWaypoints[passWaypoints.length - 1];

      // 1. Roll-In Arc
      const rollInWaypoints = buildSwarfRollArc({
        startCenterPt: firstPassPt.point,
        startNormal: firstPassPt.normal,
        startTangent: firstPassPt.tangent,
        toolVector: firstPassPt.toolVector,
        angles: firstPassPt.angles,
        radius: rollInRadius,
        angleDeg: rollInAngleDeg,
        isRollIn: true,
        feedRate: Math.round(cuttingFeed * 0.7)
      });

      // 2. Roll-Out Arc
      const rollOutWaypoints = buildSwarfRollArc({
        startCenterPt: lastPassPt.point,
        startNormal: lastPassPt.normal,
        startTangent: lastPassPt.tangent,
        toolVector: lastPassPt.toolVector,
        angles: lastPassPt.angles,
        radius: rollInRadius,
        angleDeg: rollInAngleDeg,
        isRollIn: false,
        feedRate: Math.round(cuttingFeed * 0.7)
      });

      const entryPt = rollInWaypoints[0]?.point || firstPassPt.point;

      // Safe Approach & Rapid Positioning
      const safeClearancePt = entryPt.clone();
      safeClearancePt.y += clearanceZ;

      const feedPlanePt = entryPt.clone();
      feedPlanePt.y += feedPlaneZ;

      // Rapid to Clearance
      if (!lastPosition) {
        rapidLines.push([safeClearancePt.clone(), safeClearancePt.clone()]);
        trajectoryPoints.push({
          point: safeClearancePt.clone(),
          toolVector: firstPassPt.toolVector.clone(),
          vector: firstPassPt.toolVector.clone(),
          angles: { ...firstPassPt.angles },
          feedRate: 5000,
          type: 'rapid'
        });
      } else {
        const safeRetract = lastPosition.clone();
        safeRetract.y = Math.max(safeRetract.y + retractZ, safeClearancePt.y);
        rapidLines.push([lastPosition.clone(), safeRetract.clone()]);
        rapidLines.push([safeRetract.clone(), safeClearancePt.clone()]);
        trajectoryPoints.push({
          point: safeRetract.clone(),
          toolVector: firstPassPt.toolVector.clone(),
          vector: firstPassPt.toolVector.clone(),
          angles: { ...firstPassPt.angles },
          feedRate: 5000,
          type: 'rapid'
        });
      }

      // Rapid to Feed Plane
      rapidLines.push([safeClearancePt.clone(), feedPlanePt.clone()]);
      trajectoryPoints.push({
        point: feedPlanePt.clone(),
        toolVector: firstPassPt.toolVector.clone(),
        vector: firstPassPt.toolVector.clone(),
        angles: { ...firstPassPt.angles },
        feedRate: 5000,
        type: 'rapid'
      });

      // Plunge to Roll-In Entry
      cuttingLines.push([feedPlanePt.clone(), entryPt.clone()]);
      trajectoryPoints.push({
        point: entryPt,
        toolVector: firstPassPt.toolVector,
        vector: firstPassPt.toolVector,
        angles: firstPassPt.angles,
        feedRate: plungeFeed,
        type: 'plunge'
      });

      // Execute Roll-In Arc
      for (let i = 0; i < rollInWaypoints.length; i++) {
        const curr = rollInWaypoints[i];
        if (i > 0) {
          const p0 = rollInWaypoints[i - 1].point.clone();
          const p1 = curr.point.clone();
          cuttingLines.push([p0, p1]);
          arcLines.push([p0, p1]);
        }
        trajectoryPoints.push(curr);
      }

      // Execute Flank Cutting Pass
      for (let i = 0; i < passWaypoints.length; i++) {
        const curr = passWaypoints[i];
        if (i === 0) {
          cuttingLines.push([rollInWaypoints[rollInWaypoints.length - 1].point.clone(), curr.point.clone()]);
        } else {
          cuttingLines.push([passWaypoints[i - 1].point.clone(), curr.point.clone()]);
        }
        trajectoryPoints.push(curr);
      }

      // Execute Roll-Out Arc
      for (let i = 0; i < rollOutWaypoints.length; i++) {
        const curr = rollOutWaypoints[i];
        if (i === 0) {
          const p0 = lastPassPt.point.clone();
          const p1 = curr.point.clone();
          cuttingLines.push([p0, p1]);
          arcLines.push([p0, p1]);
        } else {
          const p0 = rollOutWaypoints[i - 1].point.clone();
          const p1 = curr.point.clone();
          cuttingLines.push([p0, p1]);
          arcLines.push([p0, p1]);
        }
        trajectoryPoints.push(curr);
      }

      const exitPt = rollOutWaypoints[rollOutWaypoints.length - 1]?.point || lastPassPt.point;
      lastPosition = exitPt.clone();
    }
  }

  // Final Retract to Safe Clearance
  if (lastPosition) {
    const finalRetract = lastPosition.clone();
    finalRetract.y += clearanceZ;
    rapidLines.push([lastPosition.clone(), finalRetract.clone()]);
    const lastWp = trajectoryPoints[trajectoryPoints.length - 1];
    trajectoryPoints.push({
      point: finalRetract.clone(),
      toolVector: lastWp?.toolVector ? lastWp.toolVector.clone() : new THREE.Vector3(0, 1, 0),
      vector: lastWp?.toolVector ? lastWp.toolVector.clone() : new THREE.Vector3(0, 1, 0),
      angles: lastWp?.angles ? { ...lastWp.angles } : null,
      feedRate: 5000,
      type: 'rapid'
    });
  }

  // Physics & Deflection Metrics Calculation
  const material = SWARF_MILLING_MATERIALS[config.materialId?.toUpperCase()] || SWARF_MILLING_MATERIALS.ALU_6061;
  const physics = calculateSwarfPhysics({
    material,
    tool,
    wallHeight,
    stepover: radialStepover,
    feedRate: cuttingFeed,
    rpm: Number(config.spindleRpm) || 12000,
    passes: numRadialPasses,
    axialSlices: numAxialSlices,
    toolOverhangMm: Number(config.toolStickoutMm) || 45.0
  });

  return {
    strategy: '5axis_swarf',
    name: config.name || '5-Axis Swarf Milling (Flank Contouring)',
    badgeClass: 'swarf',
    badgeText: '5X-SWARF',
    color: '#8b5cf6', // Mastercam 5-Axis Violet
    cuttingLines,
    rapidLines,
    arcLines,
    vectorNeedles,
    flankRibbonVertices,
    trajectoryPoints,
    physics,
    stats: {
      totalPoints: trajectoryPoints.length,
      radialPasses: numRadialPasses,
      axialSlices: numAxialSlices,
      wallHeightMm: wallHeight,
      maxDeflectionMm: physics.deflectionMm,
      taperErrorDeg: physics.taperErrorDeg,
      mrrCm3Min: physics.mrr
    }
  };
}

/**
 * Generates Production 5-Axis TCPM G-code for Fanuc, Haas, Siemens, or Heidenhain controllers.
 */
export function generateSwarfMillingGCode(toolpath, tool = {}, config = {}) {
  const controller = config.controllerDialect || 'fanuc';
  const toolNum = Number(tool?.number) || 1;
  const rpm = Number(config.spindleRpm) || 12000;
  const feed = Number(config.feedRate) || 2800;

  const lines = [];
  let lineNum = 10;
  const nextN = () => {
    const s = `N${lineNum}`;
    lineNum += 10;
    return s;
  };

  const fmt = (n) => (typeof n === 'number' ? n.toFixed(3) : '0.000');

  // Program Header
  lines.push(`%`);
  lines.push(`O0001 (5-AXIS SWARF FLANK MILLING)`);
  lines.push(`(--- ARGUS CAM POST-PROCESSOR ---)`);
  lines.push(`(STRATEGY: 5-AXIS CONTINUOUS SWARF MILLING)`);
  lines.push(`(TOOL: T${toolNum} [${tool?.name || 'Swarf Flank Endmill'}] | DIA: ${tool?.diameter || 10}mm)`);
  lines.push(`(CONTROLLER: ${controller.toUpperCase()} TCPM)`);
  lines.push(`${nextN()} G90 G21 G17 G54 G94`);
  lines.push(`${nextN()} G28 G91 Z0.`);
  lines.push(`${nextN()} G90`);

  // Tool Change
  lines.push(`${nextN()} T${toolNum} M06 (${tool?.name || 'Swarf Cutter'})`);
  lines.push(`${nextN()} S${rpm} M03`);

  // Controller TCPM Activation
  if (controller === 'haas') {
    lines.push(`${nextN()} G234 H${toolNum} M08 (HAAS 5-AXIS TCPC ACTIVATION)`);
    lines.push(`${nextN()} G187 P2 (HAAS HIGH SPEED MACHINING - MEDIUM)`);
  } else if (controller === 'siemens') {
    lines.push(`${nextN()} TRAORI ; SIEMENS 5-AXIS TCP`);
    lines.push(`${nextN()} CYCLE832(0.015, 1, 1) ; HIGH SPEED LOOK-AHEAD`);
  } else if (controller === 'heidenhain') {
    lines.push(`${nextN()} FUNCTION TCPM F CONT AXIS SPAT`);
  } else {
    // Fanuc
    lines.push(`${nextN()} G43.4 H${toolNum} M08 (5-AXIS TCPM ACTIVATION)`);
    lines.push(`${nextN()} G05.1 Q1 (HIGH SPEED AICC II LOOK-AHEAD ACCEL/DECEL)`);
  }

  const pts = toolpath?.trajectoryPoints || [];
  if (pts.length > 0) {
    const p0 = pts[0];
    const cncX = fmt(p0.point.x);
    const cncY = fmt(-p0.point.z);
    const cncZ = fmt(p0.point.y);
    const angA = fmt(p0.angles?.A || 0);
    const angC = fmt(p0.angles?.C || 0);

    lines.push(`${nextN()} G00 X${cncX} Y${cncY}`);
    lines.push(`${nextN()} G00 Z${fmt(p0.point.y + 40)}`);
    lines.push(`${nextN()} G00 Z${cncZ}`);

    for (let i = 0; i < pts.length; i++) {
      const tp = pts[i];
      const x = fmt(tp.point.x);
      const y = fmt(-tp.point.z);
      const z = fmt(tp.point.y);
      const a = fmt(tp.angles?.A || 0);
      const b = fmt(tp.angles?.B || 0);
      const c = fmt(tp.angles?.C || 0);
      const f = tp.feedRate || feed;

      if (controller === 'siemens') {
        lines.push(`${nextN()} G01 X${x} Y${y} Z${z} B=${b} C=${c} F${f}`);
      } else if (controller === 'heidenhain') {
        lines.push(`${nextN()} L X${x} Y${y} Z${z} B${b} C${c} F${f}`);
      } else {
        lines.push(`${nextN()} G01 X${x} Y${y} Z${z} A${a} C${c} F${f}`);
      }
    }
  }

  // Retract & TCPM Cancellation
  lines.push(`${nextN()} G00 Z50.000`);
  if (controller === 'siemens') {
    lines.push(`${nextN()} TRAFOOF ; TRAORI OFF`);
  } else if (controller === 'heidenhain') {
    lines.push(`${nextN()} FUNCTION RESET TCPM`);
  } else {
    lines.push(`${nextN()} G49 (CANCEL 5-AXIS TCPM)`);
    if (controller === 'fanuc') {
      lines.push(`${nextN()} G05.1 Q0 (AICC II OFF)`);
    }
  }

  lines.push(`${nextN()} M09 (COOLANT OFF)`);
  lines.push(`${nextN()} G28 G91 Z0.`);
  lines.push(`${nextN()} G28 Y0.`);
  lines.push(`${nextN()} M30 (END OF PROGRAM)`);
  lines.push(`%`);

  return lines.join('\n');
}
