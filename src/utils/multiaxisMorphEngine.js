/**
 * Mastercam-Authentic 5-Axis Multiaxis Morph (Morph Between 2 Curves / Surfaces) Engine
 *
 * Implements:
 * 1. Parametric curve morphing between Guide Curve 1 and Guide Curve 2 across drive surfaces.
 * 2. 5-Axis Tool Axis Control with Forward Lead and Sideways Tilt angle rotations.
 * 3. Inverse Kinematics (IK) for Table-Table (AC/BC), Head-Table (BC), and Head-Head (AB) architectures.
 * 4. Singularity, gimbal lock, and rotary axis angular velocity auditing.
 * 5. 3D Tool orientation vector needles generation for viewport rendering.
 * 6. Production simultaneous 5-axis CNC G-Code post-processor with Tool Center Point Management (TCPM).
 */

import * as THREE from 'three';
import {
  calculateMultiaxisMorphPhysics,
  MULTIAXIS_TCPM_OPTIONS
} from '../config/multiaxisMorphSchema.js';

/**
 * Resolves safe bounding box
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
    min: { x: -45, y: -25, z: -35 },
    max: { x: 45, y: 15, z: 35 }
  };
}

function toVector3(v, fallback = [0, 1, 0]) {
  if (v instanceof THREE.Vector3) return v.clone();
  if (Array.isArray(v)) return new THREE.Vector3(Number(v[0]) || fallback[0], Number(v[1]) || fallback[1], Number(v[2]) || fallback[2]);
  if (v && typeof v === 'object') return new THREE.Vector3(Number(v.x) || fallback[0], Number(v.y) || fallback[1], Number(v.z) || fallback[2]);
  return new THREE.Vector3(fallback[0], fallback[1], fallback[2]);
}

/**
 * Calculates a 3D unit tool orientation vector given surface tangent, surface normal,
 * forward lead angle, and sideways tilt angle.
 *
 * Three.js coordinate system convention:
 * +Y is Vertical spindle axis
 * +X is Table width (CNC X)
 * +Z is Table depth (CNC -Y)
 */
export function calculate5AxisOrientationVector(tangent, normal, leadAngleDeg = 10.0, tiltAngleDeg = 15.0) {
  const T = toVector3(tangent, [1, 0, 0]).normalize();
  const N = toVector3(normal, [0, 1, 0]).normalize();
  const B = new THREE.Vector3().crossVectors(T, N).normalize(); // Binormal (sideways)

  const leadRad = (leadAngleDeg * Math.PI) / 180;
  const tiltRad = (tiltAngleDeg * Math.PI) / 180;

  // 1. Start with surface normal N
  // 2. Tilt forward in the direction of feed (along binormal B axis)
  const orientation = N.clone();
  orientation.applyAxisAngle(B, leadRad);

  // 3. Lean sideways across cutting path (along tangent T axis)
  orientation.applyAxisAngle(T, tiltRad);
  orientation.normalize();

  // Ensure orientation points upwards in the spindle direction (+Y > 0)
  if (orientation.y < 0.05) {
    orientation.y = Math.abs(orientation.y) + 0.1;
    orientation.normalize();
  }

  return orientation;
}

/**
 * Solves Inverse Kinematics (IK) for 5-axis machines
 * Converts Cartesian tool tip (X, Y, Z) and Tool Vector (I, J, K) to physical machine rotary angles.
 */
export function solve5AxisMachineAngles(toolVector, kinematicsId = 'table_table_ac') {
  const v = toVector3(toolVector, [0, 1, 0]).normalize();

  // Mapping Three.js to CNC:
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
    // A = atan2(J, K)
    A = Math.atan2(J, Math.max(0.001, K)) * (180 / Math.PI);
    // C = atan2(I, hypot(J, K))
    C = Math.atan2(I, Math.max(0.001, Math.hypot(J, K))) * (180 / Math.PI);
  } else if (kinematicsId === 'table_table_bc') {
    // Trunnion BC: B tilts around CNC Y, C rotates around CNC Z
    B = Math.atan2(I, Math.max(0.001, K)) * (180 / Math.PI);
    C = Math.atan2(J, Math.max(0.001, Math.hypot(I, K))) * (180 / Math.PI);
  } else if (kinematicsId === 'head_table_bc') {
    // Swivel B head tilts around CNC Y, C table rotates around CNC Z
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
 * 5-Axis Kinematic Singularity & Gimbal Lock Auditor
 */
export function audit5AxisMorphTrajectory(trajectoryPoints, kinematicsId = 'table_table_ac', maxFeedRate = 3000) {
  const warnings = [];
  const singularityIndices = [];
  let maxRotaryVelocityDegSec = 0;

  for (let i = 1; i < trajectoryPoints.length; i++) {
    const prev = trajectoryPoints[i - 1];
    const curr = trajectoryPoints[i];

    const pPrev = prev.point ? toVector3(prev.point) : toVector3(prev);
    const pCurr = curr.point ? toVector3(curr.point) : toVector3(curr);
    const dist = pPrev.distanceTo(pCurr);
    const dtSeconds = Math.max(0.001, (dist / maxFeedRate) * 60);

    const prevAngles = prev.angles || solve5AxisMachineAngles(prev.vector || prev.toolVector, kinematicsId);
    const currAngles = curr.angles || solve5AxisMachineAngles(curr.vector || curr.toolVector, kinematicsId);

    const deltaA = Math.abs(currAngles.A - prevAngles.A);
    const deltaB = Math.abs(currAngles.B - prevAngles.B);
    const deltaC = Math.abs(currAngles.C - prevAngles.C);

    const maxDelta = Math.max(deltaA, deltaB, deltaC);
    const angVel = maxDelta / dtSeconds;
    if (angVel > maxRotaryVelocityDegSec) {
      maxRotaryVelocityDegSec = angVel;
    }

    // Check pole singularity (tilt near 0 with rapid C flip)
    const tilt = kinematicsId === 'table_table_ac' ? Math.abs(currAngles.A) : Math.abs(currAngles.B);
    if (tilt < 1.5 && deltaC > 25.0) {
      warnings.push(`Step ${i}: Gimbal pole singularity! Rotary C flips ${deltaC.toFixed(1)}° while tilt is ${tilt.toFixed(1)}°.`);
      singularityIndices.push(i);
    }

    if (angVel > 180.0) {
      warnings.push(`Step ${i}: Rotary axis rapid jump (${angVel.toFixed(0)}°/s) exceeds machine limit.`);
    }
  }

  const hasSingularity = singularityIndices.length > 0;
  const status = hasSingularity ? 'danger' : warnings.length > 0 ? 'warning' : 'safe';

  return {
    status,
    hasSingularity,
    singularityIndices,
    warnings: warnings.slice(0, 10),
    totalWarnings: warnings.length,
    maxRotaryVelocityDegSec: Number(maxRotaryVelocityDegSec.toFixed(1)),
    evaluatedPoints: trajectoryPoints.length
  };
}

/**
 * Generates Mastercam 5-Axis Multiaxis Morph Toolpath
 */
export function generateMultiaxisMorphToolpath(bounds, toolInput = {}, opParams = {}, model = null) {
  const safeBounds = resolveSafeBounds(bounds);
  const topY = safeBounds.max.y;
  const bottomY = safeBounds.min.y;
  const minX = safeBounds.min.x;
  const maxX = safeBounds.max.x;
  const minZ = safeBounds.min.z;
  const maxZ = safeBounds.max.z;

  const tool = {
    id: toolInput.id || 3,
    number: toolInput.number || 3,
    diameter: Number(toolInput.diameter || 10.0),
    type: toolInput.type || 'ball',
    name: toolInput.name || '10mm Ball Nose',
    spindleSpeed: Number(toolInput.spindleSpeed || opParams.tool?.spindleSpeed || 12000),
    feedRate: Number(toolInput.feedRate || opParams.tool?.feedRate || 3000),
    plungeRate: Number(toolInput.plungeRate || opParams.tool?.plungeRate || 600)
  };

  // Extract parameters
  const cutPattern = opParams.cutPattern || {};
  const toolAxisControl = opParams.toolAxisControl || {};
  const machineKinematics = opParams.machineKinematics || {};
  const linking = opParams.linkingParameters || {};

  const passes = Math.max(3, Number(cutPattern.numberOfCuts || opParams.passes || 25));
  const cuttingMethod = cutPattern.cuttingMethod || opParams.cuttingMethod || 'zigzag';
  const cutOrder = cutPattern.cutOrder || 'curve1_to_curve2';
  const leadAngleDeg = Number(toolAxisControl.leadAngleDeg ?? opParams.leadAngleDeg ?? 10.0);
  const tiltAngleDeg = Number(toolAxisControl.tiltAngleDeg ?? opParams.tiltAngleDeg ?? 15.0);
  const kinematicsId = machineKinematics.kinematicsId || opParams.kinematicsId || 'table_table_ac';
  const clearanceZ = Number(linking.clearancePlaneZ ?? opParams.clearancePlane ?? 25.0);
  const retractDist = Number(linking.retractDistanceMm ?? opParams.retractHeight ?? 5.0);

  const cuttingLines = [];
  const rapidLines = [];
  const waypoints = [];
  const trajectoryPoints = [];
  const vectorNeedles = [];

  const needleLength = Math.min(12.0, (tool.diameter || 10) * 1.2);

  // Guide Curve 1 (Inner / Top Rail)
  // Parametric formulation: arch along X with smooth depth curvature
  const curve1 = (u) => {
    const x = minX + 5 + u * (maxX - minX - 10);
    const zSpan = (maxZ - minZ) * 0.4;
    const z = minZ + 8 + Math.sin(u * Math.PI) * zSpan;
    // Aerodynamic crown / crown rise
    const crown = Math.sin(u * Math.PI) * 4.0;
    const y = topY - 2.0 + crown;
    return new THREE.Vector3(x, y, z);
  };

  // Guide Curve 2 (Outer / Bottom Rail)
  // Flared outer boundary matching mold cavity / aerofoil flank
  const curve2 = (u) => {
    const x = minX + u * (maxX - minX);
    const zSpan = (maxZ - minZ) * 0.85;
    const z = minZ + 4 + Math.sin(u * Math.PI * 0.95 + 0.1) * zSpan;
    const draftDrop = Math.cos(u * Math.PI) * 3.0;
    const y = bottomY + 3.0 + draftDrop;
    return new THREE.Vector3(x, y, z);
  };

  let totalDist = 0;
  let cuttingDist = 0;
  let lastPos = null;

  const addCut = (p1, p2, isRapid = false, isPlunge = false, note = '') => {
    const d = p1.distanceTo(p2);
    if (d < 0.0001) return;
    totalDist += d;
    if (isRapid) {
      rapidLines.push([p1.clone(), p2.clone()]);
    } else {
      cuttingDist += d;
      cuttingLines.push([p1.clone(), p2.clone()]);
    }
    waypoints.push({
      pos: p2.clone(),
      isRapid,
      isPlunge,
      feed: isRapid ? 8000 : isPlunge ? tool.plungeRate : tool.feedRate,
      note
    });
  };

  // Initial Rapid approach to clearance above start point of pass 0
  const startP = (cutOrder === 'curve2_to_curve1') ? curve2(0) : curve1(0);
  const clearancePos = new THREE.Vector3(startP.x, topY + clearanceZ, startP.z);
  const feedPlanePos = new THREE.Vector3(startP.x, startP.y + retractDist, startP.z);

  waypoints.push({ pos: clearancePos.clone(), isRapid: true, feed: 8000, note: '5X Initial Clearance' });
  addCut(clearancePos, feedPlanePos, true, false, 'Rapid Approach to Feed Plane');
  addCut(feedPlanePos, startP, false, true, 'Plunge to Start of Morph');
  lastPos = startP.clone();

  // Morph loop across passes
  const numStepsPerPass = 36;

  for (let p = 0; p < passes; p++) {
    // Morph interpolation factor t in [0, 1]
    let t = p / (passes - 1 || 1);
    if (cutOrder === 'curve2_to_curve1') {
      t = 1 - t;
    }

    const isReversed = (cuttingMethod === 'zigzag' && p % 2 === 1);
    const passPoints = [];

    for (let step = 0; step <= numStepsPerPass; step++) {
      const uRaw = step / numStepsPerPass;
      const u = isReversed ? (1 - uRaw) : uRaw;

      // Morphed position between Curve 1 and Curve 2
      const p1 = curve1(u);
      const p2 = curve2(u);

      // Smooth cubic blend interpolation
      const blend = t * t * (3 - 2 * t);
      const pt = new THREE.Vector3(
        (1 - blend) * p1.x + blend * p2.x,
        (1 - blend) * p1.y + blend * p2.y,
        (1 - blend) * p1.z + blend * p2.z
      );

      // Tangent along feed direction
      const uNext = Math.min(1.0, u + 0.02);
      const uPrev = Math.max(0.0, u - 0.02);
      const pNext = new THREE.Vector3().lerpVectors(curve1(uNext), curve2(uNext), blend);
      const pPrev = new THREE.Vector3().lerpVectors(curve1(uPrev), curve2(uPrev), blend);
      const tangent = pNext.clone().sub(pPrev).normalize();
      if (isReversed) tangent.negate();

      // Surface normal: blend between curve normals and vertical
      const spanVec = p2.clone().sub(p1).normalize();
      let normal = new THREE.Vector3().crossVectors(tangent, spanVec).normalize();
      if (normal.y < 0) normal.negate();
      if (normal.y < 0.2) normal.y = 0.5;
      normal.normalize();

      // Compute 5-axis orientation vector with Lead and Tilt
      const toolVec = calculate5AxisOrientationVector(tangent, normal, leadAngleDeg, tiltAngleDeg);
      const angles = solve5AxisMachineAngles(toolVec, kinematicsId);

      passPoints.push(pt);
      trajectoryPoints.push({
        point: pt.clone(),
        vector: toolVec.clone(),
        angles,
        feed: tool.feedRate
      });

      // Needle representation for 3D Viewport
      if (step % 3 === 0) {
        const needleEnd = pt.clone().add(toolVec.clone().multiplyScalar(needleLength));
        vectorNeedles.push([pt.clone(), needleEnd]);
      }
    }

    // Connect passes:
    // If not first pass, link previous pass end to this pass start
    if (p > 0 && passPoints.length > 0) {
      if (cuttingMethod === 'oneway') {
        // Retract to feed plane, rapid to next pass start, plunge
        const retractUp = new THREE.Vector3(lastPos.x, lastPos.y + retractDist, lastPos.z);
        const nextStart = passPoints[0];
        const nextFeedPlane = new THREE.Vector3(nextStart.x, nextStart.y + retractDist, nextStart.z);
        addCut(lastPos, retractUp, true, false, 'Pass Retract');
        addCut(retractUp, nextFeedPlane, true, false, 'Rapid to Next Morph Pass');
        addCut(nextFeedPlane, nextStart, false, true, 'Plunge to Morph Pass');
      } else {
        // Zigzag: smooth tangential blend move directly to next pass start
        addCut(lastPos, passPoints[0], false, false, 'Zigzag Morph Link');
      }
    }

    // Add pass cutting segments
    for (let i = 0; i < passPoints.length - 1; i++) {
      addCut(passPoints[i], passPoints[i + 1], false, false, `5X Morph Pass ${p + 1}`);
    }
    lastPos = passPoints[passPoints.length - 1].clone();
  }

  // Final Retract to Clearance Plane
  const finalClearance = new THREE.Vector3(lastPos.x, topY + clearanceZ, lastPos.z);
  addCut(lastPos, finalClearance, true, false, '5X Final Clearance Retract');

  // Perform Kinematic Singularity Audit
  const audit = audit5AxisMorphTrajectory(trajectoryPoints, kinematicsId, tool.feedRate);

  // Compute 5-Axis Dynamics & Physics
  const physics = calculateMultiaxisMorphPhysics(
    tool,
    {
      leadAngleDeg,
      tiltAngleDeg,
      stepoverMm: Number(cutPattern.stepoverDistanceMm || 1.5),
      depthOfCutMm: 0.5
    },
    opParams.selectedMaterialKey || 'ALU_6061'
  );

  return {
    strategy: 'multiaxis_morph',
    cuttingLines,
    rapidLines,
    lines: cuttingLines,
    rapids: rapidLines,
    waypoints,
    trajectoryPoints,
    vectorNeedles,
    bounds: safeBounds,
    topY,
    audit,
    physics,
    stats: {
      totalDistanceMm: Number(totalDist.toFixed(2)),
      cuttingDistanceMm: Number(cuttingDist.toFixed(2)),
      passesCount: passes,
      pointsCount: trajectoryPoints.length,
      estimatedTimeMin: Number((cuttingDist / tool.feedRate + (totalDist - cuttingDist) / 8000).toFixed(2))
    }
  };
}

/**
 * Standard Production 5-Axis CNC G-Code Generator with TCPM Management
 */
export function generateMultiaxisMorphGCode(
  toolpathData,
  toolInput = {},
  opParams = {},
  machineConfig = {},
  programNumber = 1,
  programName = 'MULTIAXIS_MORPH'
) {
  if (!toolpathData || !Array.isArray(toolpathData.trajectoryPoints) || toolpathData.trajectoryPoints.length === 0) {
    return '%\nO0001 (ERROR: NO 5-AXIS TOOLPATH GENERATED)\nM30\n%';
  }

  const tool = {
    number: toolInput.number || toolInput.id || 3,
    diameter: Number(toolInput.diameter || 10.0),
    name: toolInput.name || `${toolInput.diameter || 10}mm Ball Nose 5X`,
    spindleSpeed: Number(toolInput.spindleSpeed || opParams.tool?.spindleSpeed || 12000),
    feedRate: Number(toolInput.feedRate || opParams.tool?.feedRate || 3000),
    plungeRate: Number(toolInput.plungeRate || opParams.tool?.plungeRate || 600)
  };

  const kinematicsId = opParams.kinematicsId || opParams.machineKinematics?.kinematicsId || 'table_table_ac';
  const dialectKey = String(opParams.tcpmMode || opParams.machineKinematics?.tcpmMode || opParams.controllerFormat || 'fanuc').toLowerCase();
  const tcpm = MULTIAXIS_TCPM_OPTIONS.find((t) => t.id === dialectKey || dialectKey.includes(t.id) || t.id.includes(dialectKey)) || MULTIAXIS_TCPM_OPTIONS[0];

  const safeBounds = toolpathData.bounds || { max: { y: 0 } };
  const topY = safeBounds.max?.y || 0;

  // CNC Coordinate Mapping:
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
  lines.push('(--- ARGUS CAM MULTIAXIS 5-AXIS POST-PROCESSOR ---)');
  lines.push(`(MACHINE: ${machineConfig.name || 'Fanuc Robodrill 5X / Haas UMC-750'})`);
  lines.push(`(KINEMATICS: ${kinematicsId.toUpperCase()})`);
  lines.push(`(TCPM PROTOCOL: ${tcpm.name})`);
  lines.push(`(DATE: ${new Date().toISOString().slice(0, 10)})`);
  lines.push(`(MATERIAL: ${opParams.selectedMaterialKey || 'Alu 6061-T6'})`);
  lines.push(`${nextN()} G90 G21 G17 G54 G94`);
  lines.push(`${nextN()} G28 G91 Z0.`);
  lines.push(`${nextN()} G90`);
  lines.push('');
  lines.push('(================================================)');
  lines.push(`(OPERATION 1: 5-AXIS MULTIAXIS MORPH BETWEEN 2 CURVES)`);
  lines.push(`(TOOL: T${tool.number} [${tool.name}] | DIA: ${tool.diameter}mm)`);
  lines.push('(================================================)');
  lines.push(`${nextN()} T${tool.number} M06 (${tool.name})`);
  lines.push(`${nextN()} S${tool.spindleSpeed} M03`);

  // High-Speed Lookahead smoothing
  if (tcpm.id === 'fanuc') {
    lines.push(`${nextN()} G05.1 Q1 (HIGH SPEED AICC II LOOK-AHEAD ACCEL/DECEL)`);
  } else if (tcpm.id === 'haas') {
    lines.push(`${nextN()} G187 P2 (HAAS HIGH SPEED MACHINING - MEDIUM SMOOTHING)`);
  }

  // Initial Rapid to Clearance
  const points = toolpathData.trajectoryPoints;
  const firstPt = points[0];
  const firstCnc = toCnc(firstPt.point);

  lines.push(`${nextN()} G00 X${firstCnc.x.toFixed(3)} Y${firstCnc.y.toFixed(3)}`);
  lines.push(`${nextN()} G00 G43 H${tool.number} Z25.000 M08`);

  // Activate Tool Center Point Management
  const tcpmActivate = tcpm.code.replace('{T}', String(tool.number));
  lines.push(`${nextN()} ${tcpmActivate}`);

  // Emit 5-axis continuous blocks
  let currentFeed = tool.feedRate;

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const cnc = toCnc(pt.point);
    const ang = pt.angles;

    let block = '';
    if (dialectKey === 'heidenhain') {
      block = `${nextN()} L X${cnc.x.toFixed(3)} Y${cnc.y.toFixed(3)} Z${cnc.z.toFixed(3)} B${ang.B >= 0 ? '+' : ''}${ang.B.toFixed(3)} C${ang.C >= 0 ? '+' : ''}${ang.C.toFixed(3)} F${tool.feedRate}`;
    } else if (dialectKey === 'siemens') {
      block = `${nextN()} G01 X${cnc.x.toFixed(3)} Y${cnc.y.toFixed(3)} Z${cnc.z.toFixed(3)} B=${ang.B.toFixed(3)} C=${ang.C.toFixed(3)} F${tool.feedRate}`;
    } else if (dialectKey === 'haas') {
      block = `${nextN()} G01 X${cnc.x.toFixed(3)} Y${cnc.y.toFixed(3)} Z${cnc.z.toFixed(3)} B${ang.B.toFixed(3)} C${ang.C.toFixed(3)} F${tool.feedRate}`;
    } else {
      // Fanuc standard: can emit A/C rotary angles or I/J/K tool direction vectors
      if (kinematicsId === 'table_table_ac' || kinematicsId === 'head_head_ab') {
        block = `${nextN()} G01 X${cnc.x.toFixed(3)} Y${cnc.y.toFixed(3)} Z${cnc.z.toFixed(3)} A${ang.A.toFixed(3)} C${ang.C.toFixed(3)} F${tool.feedRate}`;
      } else {
        block = `${nextN()} G01 X${cnc.x.toFixed(3)} Y${cnc.y.toFixed(3)} Z${cnc.z.toFixed(3)} B${ang.B.toFixed(3)} C${ang.C.toFixed(3)} F${tool.feedRate}`;
      }
    }
    lines.push(block);
  }

  // Cancel TCPM & Retract
  lines.push('');
  lines.push('(--- TCPM CANCEL & RETRACT ---)');
  lines.push(`${nextN()} ${tcpm.cancel}`);
  if (tcpm.id === 'fanuc') {
    lines.push(`${nextN()} G05.1 Q0 (AICC II OFF)`);
  }
  lines.push(`${nextN()} G00 Z25.000 M09`);
  lines.push(`${nextN()} M05`);
  lines.push(`${nextN()} G28 G91 Z0.`);
  lines.push(`${nextN()} G28 G91 X0. Y0.`);
  lines.push(`${nextN()} G90`);
  lines.push(`${nextN()} M30`);
  lines.push('%');

  return lines.join('\n');
}
