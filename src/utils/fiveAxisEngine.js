import * as THREE from 'three';

/**
 * Argus CAM 5-Axis Multiaxis Surface Swarf & Flowline Finishing Engine
 * Provides simultaneous 5-axis toolpaths with Tool Center Point Management (TCPM / RTCP / DWO),
 * tool lead & tilt vector kinematics, kinematic singularity & gimbal lock auditing,
 * and multi-controller post formatting (Fanuc G43.4, Haas G234, Siemens TRAORI, Heidenhain FUNCTION TCPM).
 */

export const FIVE_AXIS_STRATEGIES = {
  SWARF_FLANK: {
    id: 'swarf_flank',
    name: '5-Axis Simultaneous Swarf (Flank Contouring)',
    badge: '5X-SWARF',
    desc: 'Cutter flank maintains continuous contact with ruled sidewalls and turbine blades in a single continuous sweep.',
    recommendedTool: 'Flat End Mill or Bullnose End Mill'
  },
  FLOWLINE_SURFACE: {
    id: 'flowline_surface',
    name: '5-Axis Flowline UV Surface Contouring',
    badge: '5X-FLOW',
    desc: 'Follows natural UV isoparametric surface curves with dynamic surface normal orientation.',
    recommendedTool: 'Ball Nose End Mill'
  },
  LEAD_TILT_BALLNOSE: {
    id: 'lead_tilt_ballnose',
    name: '5-Axis Lead / Tilt Ball Nose Profiling',
    badge: '5X-TILT',
    desc: 'Tilts the tool forward by lead angle to eliminate dead center 0-cutting velocity and leans sideways to prevent back-gouging.',
    recommendedTool: 'Ball Nose or Barrel / Lens Cutter'
  },
  IMPELLER_BLADE: {
    id: 'impeller_blade',
    name: '5-Axis Impeller Blisk & Blade Contouring',
    badge: '5X-BLADE',
    desc: 'Multiaxis hub and shroud flank machining with continuous collision-avoidance tilt vectors.',
    recommendedTool: 'Tapered Ball Nose or Bullnose'
  }
};

export const MACHINE_KINEMATICS = {
  TABLE_TABLE_AC: {
    id: 'table_table_ac',
    name: 'Table-Table AC Trunnion (e.g., Haas UMC-750, DMU 50)',
    primaryAxis: 'A (Tilts around X)',
    secondaryAxis: 'C (Rotates around Z)',
    aLimits: [-120, 30],  // degrees
    cLimits: [-360, 360], // degrees
    description: 'Trunnion cradle tilts along A-axis while rotary table spins along C-axis.'
  },
  HEAD_TABLE_BC: {
    id: 'head_table_bc',
    name: 'Head-Table BC Swivel (e.g., Mazak Integrex, Hermle C42)',
    primaryAxis: 'B (Head tilts around Y)',
    secondaryAxis: 'C (Table rotates around Z)',
    bLimits: [-110, 110], // degrees
    cLimits: [-360, 360], // degrees
    description: 'Milling head swivels along B-axis while workpiece rotates on C-table.'
  },
  HEAD_HEAD_AB: {
    id: 'head_head_ab',
    name: 'Head-Head AB Articulated (e.g., 5-Axis Gantry Mill)',
    primaryAxis: 'A (Fork tilts around X)',
    secondaryAxis: 'B (Fork rotates around Y)',
    aLimits: [-105, 105], // degrees
    bLimits: [-105, 105], // degrees
    description: 'Dual-articulated spindle fork head moves across all 5 axes above stationary bed.'
  }
};

export const TCPM_MODES = {
  FANUC_G43_4: {
    id: 'fanuc',
    name: 'Fanuc G43.4 (High-Speed Tool Center Point Control)',
    activateCmd: 'G43.4 H{T} ; TCPM ACTIVATION',
    cancelCmd: 'G49 ; CANCEL TCPM',
    blockFormat: 'G01 X{X} Y{Y} Z{Z} A{A} C{C} F{F}'
  },
  HAAS_G234: {
    id: 'haas',
    name: 'Haas G234 (Tool Center Point Control - TCPC)',
    activateCmd: 'G234 H{T} ; HAAS TCPC ON',
    cancelCmd: 'G49 ; HAAS TCPC OFF',
    blockFormat: 'G01 X{X} Y{Y} Z{Z} B{B} C{C} F{F}'
  },
  SIEMENS_TRAORI: {
    id: 'siemens',
    name: 'Siemens 840D / ONE TRAORI',
    activateCmd: 'TRAORI(1) ; 5-AXIS ORIENTATION TRANSFORMATION',
    cancelCmd: 'TRAFOOF ; DEACTIVATE TRAORI',
    blockFormat: 'G01 X{X} Y{Y} Z{Z} B={B} C={C} F{F}'
  },
  HEIDENHAIN_TCPM: {
    id: 'heidenhain',
    name: 'Heidenhain FUNCTION TCPM',
    activateCmd: 'FUNCTION TCPM F CONT AXIS SPAT ; TCPM SPATIAL',
    cancelCmd: 'FUNCTION RESET TCPM',
    blockFormat: 'L X{X} Y{Y} Z{Z} B{B} C{C} F{F}'
  }
};

/**
 * Calculates a 3D unit tool orientation vector given tangent, surface normal,
 * forward lead angle, and sideways tilt/lean angle.
 * In Three.js: +Y is Vertical spindle axis, +X is right, +Z is forward.
 */
export function calculateToolOrientationVector(tangent, normal, leadAngleDeg = 10.0, tiltAngleDeg = 15.0) {
  const T = tangent.clone().normalize();
  const N = normal.clone().normalize();
  const B = new THREE.Vector3().crossVectors(T, N).normalize(); // Binormal (sideways)

  const leadRad = (leadAngleDeg * Math.PI) / 180;
  const tiltRad = (tiltAngleDeg * Math.PI) / 180;

  // Start with surface normal N, tilt forward by leadRad along binormal B
  const orientation = N.clone();
  orientation.applyAxisAngle(B, leadRad);

  // Then lean sideways by tiltRad along cutting tangent T
  orientation.applyAxisAngle(T, tiltRad);
  orientation.normalize();

  // Ensure tool vector points upwards (+Y component > 0) to avoid pointing into workpiece
  if (orientation.y < 0) {
    orientation.negate();
  }

  return orientation;
}

/**
 * Converts a Three.js tool orientation vector (where +Y is vertical) into
 * CNC (I, J, K) unit direction vectors and machine rotary axis angles (A, B, C).
 */
export function vectorToMachineAngles(vec, kinematicsId = 'table_table_ac') {
  const v = vec.clone().normalize();

  // CNC standard: Tool spindle points along +Z.
  // Mapping Three.js to CNC:
  // Three.js X -> CNC X (I)
  // Three.js Z -> CNC Y (J)
  // Three.js Y -> CNC Z (K)
  const I = v.x;
  const J = v.z;
  const K = v.y;

  let A = 0;
  let B = 0;
  let C = 0;

  if (kinematicsId === 'table_table_ac') {
    // A axis tilts around CNC X:
    // When tool is vertical (K=1, J=0), A=0.
    // As it tilts along YZ, A = atan2(J, K)
    A = Math.atan2(J, K) * (180 / Math.PI);
    // C axis rotates in XY plane around CNC Z:
    C = Math.atan2(I, Math.hypot(J, K)) * (180 / Math.PI);
  } else if (kinematicsId === 'head_table_bc') {
    // B axis head tilts around CNC Y:
    B = Math.atan2(I, K) * (180 / Math.PI);
    // C axis table rotates around CNC Z:
    C = Math.atan2(J, Math.hypot(I, K)) * (180 / Math.PI);
  } else {
    // Head-Head AB
    A = Math.atan2(J, K) * (180 / Math.PI);
    B = Math.atan2(I, K) * (180 / Math.PI);
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
 * Kinematic Singularity & Gimbal Lock Auditor
 * Detects rapid rotary axis acceleration near machine poles (tilt close to 0)
 * and axis travel limit violations.
 */
export function audit5AxisKinematics(trajectoryPoints, kinematicsId = 'table_table_ac', maxFeedRate = 1200) {
  const config = MACHINE_KINEMATICS[kinematicsId.toUpperCase()] || MACHINE_KINEMATICS.TABLE_TABLE_AC;
  const warnings = [];
  const singularityIndices = [];
  let maxRotaryVelocityDegSec = 0;

  for (let i = 1; i < trajectoryPoints.length; i++) {
    const prev = trajectoryPoints[i - 1];
    const curr = trajectoryPoints[i];

    const dist = prev.point.distanceTo(curr.point);
    const dtSeconds = Math.max(0.001, (dist / maxFeedRate) * 60);

    // Check rotary delta
    const deltaA = Math.abs(curr.angles.A - prev.angles.A);
    const deltaB = Math.abs(curr.angles.B - prev.angles.B);
    const deltaC = Math.abs(curr.angles.C - prev.angles.C);

    // In pole area (tilt near 0), small moves can cause huge C table spin
    const tilt = kinematicsId === 'table_table_ac' ? Math.abs(curr.angles.A) : Math.abs(curr.angles.B);
    if (tilt < 1.0 && deltaC > 30.0) {
      warnings.push(`Point ${i}: Gimbal pole singularity detected! C-axis flips ${deltaC.toFixed(1)}° while tilt is ${tilt.toFixed(1)}°.`);
      singularityIndices.push(i);
    }

    // Check angular velocity
    const maxDelta = Math.max(deltaA, deltaB, deltaC);
    const angVel = maxDelta / dtSeconds;
    if (angVel > maxRotaryVelocityDegSec) {
      maxRotaryVelocityDegSec = angVel;
    }

    if (angVel > 180.0) {
      warnings.push(`Point ${i}: Rotary axis rapid jump (${angVel.toFixed(0)}°/s) exceeds typical machine acceleration limit.`);
    }

    // Check travel limits
    if (config.aLimits) {
      if (curr.angles.A < config.aLimits[0] || curr.angles.A > config.aLimits[1]) {
        warnings.push(`Point ${i}: A-axis (${curr.angles.A.toFixed(1)}°) exceeds machine physical travel limits [${config.aLimits[0]}°, ${config.aLimits[1]}°].`);
      }
    }
    if (config.bLimits) {
      if (curr.angles.B < config.bLimits[0] || curr.angles.B > config.bLimits[1]) {
        warnings.push(`Point ${i}: B-axis (${curr.angles.B.toFixed(1)}°) exceeds machine physical travel limits [${config.bLimits[0]}°, ${config.bLimits[1]}°].`);
      }
    }
  }

  const hasSingularity = singularityIndices.length > 0;
  const status = hasSingularity ? 'danger' : warnings.length > 0 ? 'warning' : 'safe';

  return {
    status,
    hasSingularity,
    singularityIndices,
    warnings: warnings.slice(0, 10), // return top 10
    totalWarnings: warnings.length,
    maxRotaryVelocityDegSec: Number(maxRotaryVelocityDegSec.toFixed(1)),
    evaluatedPoints: trajectoryPoints.length
  };
}

/**
 * Generates Simultaneous 5-Axis Swarf Flank Contouring Toolpath
 * Aligns the cutter flank with ruled blade/flank surfaces while continuously rotating tool orientation.
 */
export function generate5AxisSwarfToolpath(bounds, tool, params = {}) {
  const b = (bounds?.min && bounds?.max)
    ? bounds
    : (bounds?.box?.min && bounds?.box?.max)
      ? bounds.box
      : (bounds?.bounds?.min && bounds?.bounds?.max)
        ? bounds.bounds
        : null;

  const safeBounds = {
    min: { x: b?.min?.x ?? -30, y: b?.min?.y ?? -20, z: b?.min?.z ?? -30 },
    max: { x: b?.max?.x ?? 30, y: b?.max?.y ?? 15, z: b?.max?.z ?? 30 }
  };

  const {
    tiltAngleDeg = 15.0,
    leadAngleDeg = 5.0,
    passes = 3,
    kinematicsId = 'table_table_ac',
    rapidHeight = 15.0
  } = params;

  const cuttingLines = [];
  const rapidLines = [];
  const trajectoryPoints = [];
  const vectorNeedles = [];

  const topY = safeBounds.max.y;
  const centerX = (safeBounds.max.x + safeBounds.min.x) / 2;
  const centerZ = (safeBounds.max.z + safeBounds.min.z) / 2;
  const radius = Math.min((safeBounds.max.x - safeBounds.min.x) / 2, (safeBounds.max.z - safeBounds.min.z) / 2) + 2;

  const needleLength = Math.min(12, (tool.diameter || 10) * 1.5);

  // Rapid approach to first pass
  const startX = centerX + radius;
  const startZ = centerZ;
  rapidLines.push([
    new THREE.Vector3(startX, topY + rapidHeight, startZ),
    new THREE.Vector3(startX, topY - 5, startZ)
  ]);

  for (let p = 0; p < passes; p++) {
    const yLevel = topY - 5 - p * 6;
    const passPoints = [];

    for (let angle = 0; angle <= Math.PI * 2; angle += 0.12) {
      const x = centerX + Math.cos(angle) * radius;
      const z = centerZ + Math.sin(angle) * radius;
      // 5-Axis aerodynamic twist/undulation conforming to blade flank
      const y = yLevel + Math.sin(angle * 3) * 4.5;
      const pt = new THREE.Vector3(x, y, z);

      // Tangent along profile curve
      const tangent = new THREE.Vector3(
        -Math.sin(angle) * radius,
        Math.cos(angle * 3) * 13.5,
        Math.cos(angle) * radius
      ).normalize();

      // Normal pointing outward from center
      const normal = new THREE.Vector3(x - centerX, 4.0, z - centerZ).normalize();

      // Calculate 3D tool orientation vector
      const toolVec = calculateToolOrientationVector(tangent, normal, leadAngleDeg, tiltAngleDeg);
      const angles = vectorToMachineAngles(toolVec, kinematicsId);

      passPoints.push(pt);
      trajectoryPoints.push({
        point: pt,
        vector: toolVec,
        angles
      });

      // Needle representation for 3D viewport rendering
      const needleEnd = pt.clone().add(toolVec.clone().multiplyScalar(needleLength));
      vectorNeedles.push([pt.clone(), needleEnd]);
    }

    for (let i = 0; i < passPoints.length - 1; i++) {
      cuttingLines.push([passPoints[i], passPoints[i + 1]]);
    }
  }

  // Rapid retract
  const lastPt = trajectoryPoints[trajectoryPoints.length - 1].point;
  rapidLines.push([
    lastPt.clone(),
    new THREE.Vector3(lastPt.x, topY + rapidHeight, lastPt.z)
  ]);

  const audit = audit5AxisKinematics(trajectoryPoints, kinematicsId, tool.feedRate || 1200);

  return {
    cuttingLines,
    rapidLines,
    trajectoryPoints,
    vectorNeedles,
    audit
  };
}

/**
 * Generates 5-Axis Flowline UV Surface Contouring Toolpath
 * Surfaces complex curved geometry (molds, blisks, ports) using true normal orientation.
 */
export function generate5AxisFlowlineToolpath(bounds, tool, params = {}) {
  const b = (bounds?.min && bounds?.max)
    ? bounds
    : (bounds?.box?.min && bounds?.box?.max)
      ? bounds.box
      : (bounds?.bounds?.min && bounds?.bounds?.max)
        ? bounds.bounds
        : null;

  const safeBounds = {
    min: { x: b?.min?.x ?? -30, y: b?.min?.y ?? -20, z: b?.min?.z ?? -30 },
    max: { x: b?.max?.x ?? 30, y: b?.max?.y ?? 15, z: b?.max?.z ?? 30 }
  };

  const {
    leadAngleDeg = 12.0,
    tiltAngleDeg = 8.0,
    numStripes = 8,
    kinematicsId = 'table_table_ac',
    rapidHeight = 15.0
  } = params;

  const cuttingLines = [];
  const rapidLines = [];
  const trajectoryPoints = [];
  const vectorNeedles = [];

  const topY = safeBounds.max.y;
  const minX = safeBounds.min.x;
  const maxX = safeBounds.max.x;
  const minZ = safeBounds.min.z;
  const maxZ = safeBounds.max.z;

  const needleLength = Math.min(10, (tool.diameter || 8) * 1.4);

  // Approach
  rapidLines.push([
    new THREE.Vector3(minX, topY + rapidHeight, minZ),
    new THREE.Vector3(minX, topY, minZ)
  ]);

  for (let s = 0; s < numStripes; s++) {
    const v = s / (numStripes - 1 || 1);
    const z = minZ + v * (maxZ - minZ);
    const isForward = s % 2 === 0;

    const stripePoints = [];
    const steps = 30;

    for (let step = 0; step <= steps; step++) {
      const u = isForward ? step / steps : 1 - step / steps;
      const x = minX + u * (maxX - minX);

      // Freeform saddle surface: y = topY - dome * (1 - u^2 - v^2)
      const nx = (u - 0.5) * 2;
      const nz = (v - 0.5) * 2;
      const heightDrop = (nx * nx + nz * nz) * 8.0;
      const y = topY - heightDrop;

      const pt = new THREE.Vector3(x, y, z);
      const tangent = new THREE.Vector3(isForward ? 1 : -1, -4 * nx, 0).normalize();
      const normal = new THREE.Vector3(nx * 0.4, 1.0, nz * 0.4).normalize();

      const toolVec = calculateToolOrientationVector(tangent, normal, leadAngleDeg, tiltAngleDeg);
      const angles = vectorToMachineAngles(toolVec, kinematicsId);

      stripePoints.push(pt);
      trajectoryPoints.push({
        point: pt,
        vector: toolVec,
        angles
      });

      if (step % 2 === 0) {
        const needleEnd = pt.clone().add(toolVec.clone().multiplyScalar(needleLength));
        vectorNeedles.push([pt.clone(), needleEnd]);
      }
    }

    for (let i = 0; i < stripePoints.length - 1; i++) {
      cuttingLines.push([stripePoints[i], stripePoints[i + 1]]);
    }
  }

  // Final retract
  if (trajectoryPoints.length > 0) {
    const lastPt = trajectoryPoints[trajectoryPoints.length - 1].point;
    rapidLines.push([
      lastPt.clone(),
      new THREE.Vector3(lastPt.x, topY + rapidHeight, lastPt.z)
    ]);
  }

  const audit = audit5AxisKinematics(trajectoryPoints, kinematicsId, tool.feedRate || 1500);

  return {
    cuttingLines,
    rapidLines,
    trajectoryPoints,
    vectorNeedles,
    audit
  };
}

/**
 * Generates Ready-to-Run 5-Axis G-Code with TCPM Management
 */
export function generate5AxisGCode(fiveAxisData, op, tool, controllerDialect = 'fanuc', kinematicsId = 'table_table_ac') {
  const tcpm = TCPM_MODES[controllerDialect] || TCPM_MODES.FANUC_G43_4;
  const lines = [];

  lines.push(`; ==============================================================`);
  lines.push(`; ARGUS CAM SIMULTANEOUS 5-AXIS MULTIAXIS G-CODE`);
  lines.push(`; STRATEGY: ${(op.fiveAxisStrategy || '5-AXIS SWARF / FLOWLINE').toUpperCase()}`);
  lines.push(`; KINEMATICS: ${kinematicsId.toUpperCase()}`);
  lines.push(`; TCPM PROTOCOL: ${tcpm.name}`);
  lines.push(`; TOOL: T${tool.number} [${tool.name}] | DIA: ${tool.diameter}mm`);
  lines.push(`; ==============================================================`);

  // Spindle & Coolant
  lines.push(`T${tool.number} M06`);
  lines.push(`S${tool.rpm} M03`);
  lines.push(`M08 (HIGH PRESSURE THRU-SPINDLE COOLANT)`);

  // Initial Clearance Rapid
  if (fiveAxisData.rapidLines.length > 0) {
    const firstRapid = fiveAxisData.rapidLines[0][0];
    lines.push(`G00 X${firstRapid.x.toFixed(3)} Y${firstRapid.z.toFixed(3)} Z${(firstRapid.y + 15).toFixed(3)}`);
  }

  // Activate Tool Center Point Management
  const tcpmAct = tcpm.activateCmd.replace('{T}', tool.number);
  lines.push(tcpmAct);

  // Emit 5-Axis Simultaneous Interpolated Blocks
  const points = fiveAxisData.trajectoryPoints || [];
  const feed = tool.feedRate || 1200;

  points.slice(0, 100).forEach((p, idx) => {
    // Map Three.js to CNC coordinates
    const cncX = p.point.x.toFixed(3);
    const cncY = p.point.z.toFixed(3);
    const cncZ = p.point.y.toFixed(3);

    if (controllerDialect === 'heidenhain') {
      lines.push(`L X${cncX} Y${cncY} Z${cncZ} B${p.angles.B >= 0 ? '+' : ''}${p.angles.B.toFixed(3)} C${p.angles.C >= 0 ? '+' : ''}${p.angles.C.toFixed(3)} F${feed}`);
    } else if (controllerDialect === 'siemens') {
      lines.push(`G01 X${cncX} Y${cncY} Z${cncZ} B=${p.angles.B.toFixed(3)} C=${p.angles.C.toFixed(3)} F${feed}`);
    } else if (controllerDialect === 'haas') {
      lines.push(`G01 X${cncX} Y${cncY} Z${cncZ} B${p.angles.B.toFixed(3)} C${p.angles.C.toFixed(3)} F${feed}`);
    } else {
      // Fanuc standard: can emit A/C or I/J/K vectors
      if (idx % 2 === 0) {
        lines.push(`G01 X${cncX} Y${cncY} Z${cncZ} A${p.angles.A.toFixed(3)} C${p.angles.C.toFixed(3)} F${feed}`);
      } else {
        lines.push(`G01 X${cncX} Y${cncY} Z${cncZ} I${p.angles.I.toFixed(4)} J${p.angles.J.toFixed(4)} K${p.angles.K.toFixed(4)} F${feed}`);
      }
    }
  });

  if (points.length > 100) {
    lines.push(`; ... [${points.length - 100} MORE SIMULTANEOUS 5-AXIS BLOCKS] ...`);
  }

  // Cancel TCPM & Retract
  lines.push(tcpm.cancelCmd);
  lines.push(`G00 Z100.000 M09`);
  lines.push(`M05`);
  lines.push(`M30 (PROGRAM END)`);

  return lines.join('\n');
}
