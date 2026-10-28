import * as THREE from 'three';

/**
 * Argus CAM Toolpath Lead-In / Lead-Out & Tangent Arc Designer Engine
 * Provides precision tangent circular arcs, helical ramp spirals, linear approaches,
 * contour seam overlaps, and G41/G42 cutter radius compensation transitions.
 */

export const LEAD_ENTRY_TYPES = {
  TANGENT_ARC: {
    id: 'tangent_arc',
    name: 'Tangent Circular Arc',
    desc: 'Smooth circular arc tangential to the cut vector with linear approach',
    badge: 'ARC'
  },
  HELICAL_RAMP: {
    id: 'helical_ramp',
    name: 'Helical Spiral Ramp',
    desc: 'Continuous spiral plunge into pocket cavity with constant ramp angle',
    badge: 'HEL'
  },
  LINEAR_PERPENDICULAR: {
    id: 'linear_perpendicular',
    name: 'Linear Perpendicular (90°)',
    desc: 'Direct perpendicular 90-degree lead-in with clearance distance',
    badge: 'LIN'
  },
  PREDRILLED_HOLE: {
    id: 'predrilled_hole',
    name: 'Pre-Drilled Hole Plunge',
    desc: 'Vertical rapid plunge into existing pre-drilled hole coordinate',
    badge: 'HOLE'
  }
};

export const DEFAULT_LEAD_CONFIG = {
  entryType: 'tangent_arc',
  exitType: 'tangent_arc',
  arcRadius: 5.0,          // mm
  sweepAngleDeg: 90,       // deg
  linearExtension: 2.5,    // mm
  overlapDist: 2.0,        // mm
  microLiftExit: 0.35,     // mm
  helicalRadius: 5.0,      // mm
  helicalPitch: 2.0,       // mm
  helicalAngleDeg: 2.5,    // deg
  cutterComp: 'G41',       // 'G41' | 'G42' | 'off'
  feedOverridePct: 60      // 60% feed on entry
};

/**
 * Builds a smooth tangential circular arc entry leading into targetPoint along cutDirection.
 */
export function buildTangentArcLeadIn(targetPoint, cutDirection, config = {}) {
  const radius = Number(config.arcRadius ?? DEFAULT_LEAD_CONFIG.arcRadius);
  const sweepAngleDeg = Number(config.sweepAngleDeg ?? DEFAULT_LEAD_CONFIG.sweepAngleDeg);
  const linearDist = Number(config.linearExtension ?? DEFAULT_LEAD_CONFIG.linearExtension);

  const dir = cutDirection.clone().normalize();
  const normal = new THREE.Vector3(-dir.z, 0, dir.x).normalize(); // left normal

  // Circle center placed at targetPoint + normal * radius
  const circleCenter = new THREE.Vector3().addVectors(targetPoint, normal.clone().multiplyScalar(radius));
  const sweepRad = (sweepAngleDeg * Math.PI) / 180;
  const segments = Math.max(8, Math.round(sweepAngleDeg / 10));

  const arcPoints = [];
  for (let i = segments; i >= 0; i--) {
    const t = i / segments;
    const angle = -Math.PI / 2 + (1 - t) * sweepRad;
    const pt = new THREE.Vector3(
      circleCenter.x + dir.x * Math.sin(angle) * radius - normal.x * Math.cos(angle) * radius,
      targetPoint.y,
      circleCenter.z + dir.z * Math.sin(angle) * radius - normal.z * Math.cos(angle) * radius
    );
    arcPoints.push(pt);
  }

  // Linear extension prior to arc
  const result = [];
  if (linearDist > 0 && arcPoints.length > 0) {
    const arcStart = arcPoints[0];
    const linearStart = arcStart.clone().sub(dir.clone().multiplyScalar(linearDist));
    result.push(linearStart);
  }

  arcPoints.forEach((p) => result.push(p));
  return result;
}

/**
 * Builds a smooth tangential circular arc departure swinging away from targetPoint.
 */
export function buildTangentArcLeadOut(targetPoint, cutDirection, config = {}) {
  const radius = Number(config.arcRadius ?? DEFAULT_LEAD_CONFIG.arcRadius);
  const sweepAngleDeg = Number(config.sweepAngleDeg ?? DEFAULT_LEAD_CONFIG.sweepAngleDeg);
  const linearDist = Number(config.linearExtension ?? DEFAULT_LEAD_CONFIG.linearExtension);
  const overlapDist = Number(config.overlapDist ?? DEFAULT_LEAD_CONFIG.overlapDist);
  const microLift = Number(config.microLiftExit ?? DEFAULT_LEAD_CONFIG.microLiftExit);

  const dir = cutDirection.clone().normalize();
  const normal = new THREE.Vector3(-dir.z, 0, dir.x).normalize(); // left normal

  const result = [];

  // 1. Overlap pass past the nominal target point (to erase cutter witness mark)
  let arcStartPoint = targetPoint.clone();
  if (overlapDist > 0) {
    arcStartPoint = targetPoint.clone().add(dir.clone().multiplyScalar(overlapDist));
    result.push(arcStartPoint);
  }

  // 2. Tangent departure circle center
  const circleCenter = new THREE.Vector3().addVectors(arcStartPoint, normal.clone().multiplyScalar(radius));
  const sweepRad = (sweepAngleDeg * Math.PI) / 180;
  const segments = Math.max(8, Math.round(sweepAngleDeg / 10));

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = -Math.PI / 2 + t * sweepRad;
    const pt = new THREE.Vector3(
      circleCenter.x + dir.x * Math.sin(angle) * radius - normal.x * Math.cos(angle) * radius,
      arcStartPoint.y + t * microLift,
      circleCenter.z + dir.z * Math.sin(angle) * radius - normal.z * Math.cos(angle) * radius
    );
    result.push(pt);
  }

  // 3. Linear extension departing safely
  if (linearDist > 0 && result.length > 0) {
    const lastArc = result[result.length - 1];
    const linearEnd = lastArc.clone().add(dir.clone().multiplyScalar(linearDist));
    linearEnd.y = arcStartPoint.y + microLift;
    result.push(linearEnd);
  }

  return result;
}

/**
 * Generates continuous helical spiral ramp down into pocket cavity.
 */
export function buildHelicalRampEntry(center, startY, targetY, config = {}) {
  const radius = Number(config.helicalRadius ?? DEFAULT_LEAD_CONFIG.helicalRadius);
  const pitch = Number(config.helicalPitch ?? DEFAULT_LEAD_CONFIG.helicalPitch);

  const points = [];
  let curY = startY;
  const entryStart = new THREE.Vector3(center.x + radius, curY, center.z);
  points.push(entryStart);

  while (curY > targetY) {
    curY = Math.max(targetY, curY - pitch / 16);
    const angle = ((startY - curY) / pitch) * Math.PI * 2;
    const hx = center.x + Math.cos(angle) * radius;
    const hz = center.z + Math.sin(angle) * radius;
    points.push(new THREE.Vector3(hx, curY, hz));
  }

  return points;
}

/**
 * Applies full Lead-In and Lead-Out transition arcs to a closed or open contour path.
 */
export function applyLeadInOutToContour(contourPoints, config = {}, rapidHeight = 15.0) {
  if (!contourPoints || contourPoints.length < 2) {
    return { cuttingLines: [], rapidLines: [], leadInPoints: [], leadOutPoints: [] };
  }

  const p0 = contourPoints[0];
  const p1 = contourPoints[1];
  const cutDir = new THREE.Vector3().subVectors(p1, p0).normalize();

  const cuttingLines = [];
  const rapidLines = [];

  const entryType = config.entryType || 'tangent_arc';
  const exitType = config.exitType || 'tangent_arc';

  // 1. Generate Lead-In points
  let leadInPoints = [];
  if (entryType === 'tangent_arc') {
    leadInPoints = buildTangentArcLeadIn(p0, cutDir, config);
  } else if (entryType === 'linear_perpendicular') {
    const perp = new THREE.Vector3(-cutDir.z, 0, cutDir.x).normalize();
    const leadStart = p0.clone().add(perp.multiplyScalar(config.linearExtension || 6.0));
    leadInPoints = [leadStart, p0];
  } else {
    leadInPoints = [p0];
  }

  // Rapid plunge to lead-in start
  if (leadInPoints.length > 0) {
    const firstLead = leadInPoints[0];
    rapidLines.push([
      new THREE.Vector3(firstLead.x, p0.y + rapidHeight, firstLead.z),
      firstLead.clone()
    ]);

    for (let i = 1; i < leadInPoints.length; i++) {
      cuttingLines.push([leadInPoints[i - 1], leadInPoints[i]]);
    }
  }

  // 2. Contour body cuts
  for (let i = 1; i < contourPoints.length; i++) {
    cuttingLines.push([contourPoints[i - 1], contourPoints[i]]);
  }

  // 3. Generate Lead-Out points
  const pLast = contourPoints[contourPoints.length - 1];
  const pPrev = contourPoints[Math.max(0, contourPoints.length - 2)];
  const exitDir = new THREE.Vector3().subVectors(pLast, pPrev).normalize();

  let leadOutPoints = [];
  if (exitType === 'tangent_arc') {
    leadOutPoints = buildTangentArcLeadOut(pLast, exitDir, config);
  } else if (exitType === 'linear_perpendicular') {
    const perp = new THREE.Vector3(-exitDir.z, 0, exitDir.x).normalize();
    const leadEnd = pLast.clone().add(perp.multiplyScalar(config.linearExtension || 6.0));
    leadOutPoints = [pLast, leadEnd];
  } else {
    leadOutPoints = [pLast];
  }

  if (leadOutPoints.length > 1) {
    for (let i = 1; i < leadOutPoints.length; i++) {
      cuttingLines.push([leadOutPoints[i - 1], leadOutPoints[i]]);
    }
    const finalPt = leadOutPoints[leadOutPoints.length - 1];
    rapidLines.push([
      finalPt.clone(),
      new THREE.Vector3(finalPt.x, p0.y + rapidHeight, finalPt.z)
    ]);
  }

  return {
    cuttingLines,
    rapidLines,
    leadInPoints,
    leadOutPoints
  };
}
