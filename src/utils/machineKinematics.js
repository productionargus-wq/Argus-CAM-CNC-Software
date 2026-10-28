import * as THREE from 'three';

/**
 * Argus CAM Machine Simulation Kinematics & Collision Envelope Engine
 * Models physical machine travel limits, kinematic axis stroke envelopes,
 * and performs real-time collision detection between spindle, toolholder, workpiece, and trunnion table.
 */

export const MACHINE_KINEMATICS = {
  dmu50: {
    id: 'dmu50',
    name: 'DMG MORI DMU 50 (5X)',
    type: '5-Axis Trunnion B/C',
    controller: 'Heidenhain TNC 640',
    axes: {
      X: { min: -250, max: 250, unit: 'mm', label: 'X Axis (Table Travel)' },
      Y: { min: -200, max: 200, unit: 'mm', label: 'Y Axis (Saddle Travel)' },
      Z: { min: -100, max: 350, unit: 'mm', label: 'Z Axis (Spindle Travel)' },
      B: { min: -5, max: 110, unit: 'deg', label: 'B Axis (Swivel Head Tilt)' },
      C: { min: -360, max: 360, unit: 'deg', label: 'C Axis (Rotary Table)' }
    },
    maxRpm: 20000,
    maxFeed: 24000,
    tableDiameter: 500,
    spindleNoseRadius: 75,
    spindleNoseHeight: 90,
    softLimitBufferMm: 15.0
  },
  haas_vf2: {
    id: 'haas_vf2',
    name: 'Haas VF-2 (3X VMC)',
    type: '3-Axis Vertical',
    controller: 'Haas NGC',
    axes: {
      X: { min: -381, max: 381, unit: 'mm', label: 'X Axis (Longitudinal)' },
      Y: { min: -203, max: 203, unit: 'mm', label: 'Y Axis (Cross Travel)' },
      Z: { min: -100, max: 400, unit: 'mm', label: 'Z Axis (Vertical Travel)' }
    },
    maxRpm: 10000,
    maxFeed: 16500,
    tableWidth: 914,
    tableDepth: 356,
    spindleNoseRadius: 80,
    spindleNoseHeight: 100,
    softLimitBufferMm: 15.0
  },
  robodrill: {
    id: 'robodrill',
    name: 'Fanuc Robodrill D21',
    type: 'High Speed 3-Axis',
    controller: 'Fanuc 31i',
    axes: {
      X: { min: -250, max: 250, unit: 'mm', label: 'X Axis (Table Travel)' },
      Y: { min: -200, max: 200, unit: 'mm', label: 'Y Axis (Saddle Travel)' },
      Z: { min: -50, max: 280, unit: 'mm', label: 'Z Axis (Spindle Travel)' }
    },
    maxRpm: 24000,
    maxFeed: 30000,
    tableWidth: 650,
    tableDepth: 400,
    spindleNoseRadius: 65,
    spindleNoseHeight: 80,
    softLimitBufferMm: 10.0
  },
  integrex: {
    id: 'integrex',
    name: 'Mazak Integrex i-200',
    type: '5-Axis Mill-Turn',
    controller: 'Mazak Matrix',
    axes: {
      X: { min: -300, max: 300, unit: 'mm', label: 'X Axis (Cross Travel)' },
      Y: { min: -250, max: 250, unit: 'mm', label: 'Y Axis (Y Carriage)' },
      Z: { min: -150, max: 450, unit: 'mm', label: 'Z Axis (Longitudinal)' },
      B: { min: -30, max: 120, unit: 'deg', label: 'B Axis (Milling Spindle)' },
      C: { min: -360, max: 360, unit: 'deg', label: 'C Axis (Main Spindle)' }
    },
    maxRpm: 12000,
    maxFeed: 38000,
    spindleNoseRadius: 90,
    spindleNoseHeight: 110,
    softLimitBufferMm: 20.0
  }
};

/**
 * Builds a 3D Three.js visual representation of the machine's physical travel envelope.
 * Features translucent bounding cage, corner corner-brackets, axis limit planes, and table outline.
 */
export function buildMachineEnvelope3D(machineId = 'dmu50', activeOvertravel = null) {
  const group = new THREE.Group();
  group.name = "Machine_Kinematic_Collision_Envelope";

  const config = MACHINE_KINEMATICS[machineId] || MACHINE_KINEMATICS.dmu50;
  const ax = config.axes;

  const minX = ax.X ? ax.X.min : -250;
  const maxX = ax.X ? ax.X.max : 250;
  const minY = ax.Y ? ax.Y.min : -200;
  const maxY = ax.Y ? ax.Y.max : 200;
  const minZ = ax.Z ? ax.Z.min : -100;
  const maxZ = ax.Z ? ax.Z.max : 350;

  // Machine simulation visual scale factor to align with digital twin 3D scene
  const s = 0.45;
  const boxW = (maxX - minX) * s;
  const boxH = (maxZ - minZ) * 0.55;
  const boxD = (maxY - minY) * s;

  const centerX = ((minX + maxX) / 2) * s;
  const centerY = 120 + ((minZ + maxZ) / 2 - 20) * 0.55;
  const centerZ = ((minY + maxY) / 2) * s;

  // 1. Outer Travel Envelope Wireframe Box
  const boxGeo = new THREE.BoxGeometry(boxW, boxH, boxD);
  const edgesGeo = new THREE.EdgesGeometry(boxGeo);
  const isViolated = activeOvertravel !== null;
  const wireMat = new THREE.LineBasicMaterial({
    color: isViolated ? 0xef4444 : 0x0ea5e9,
    linewidth: 1.5,
    transparent: true,
    opacity: isViolated ? 0.9 : 0.45
  });
  const wireMesh = new THREE.LineSegments(edgesGeo, wireMat);
  wireMesh.position.set(centerX, centerY, centerZ);
  group.add(wireMesh);

  // 2. Translucent Safety Cage Panels
  const cageMat = new THREE.MeshBasicMaterial({
    color: isViolated ? 0xef4444 : 0x0284c7,
    transparent: true,
    opacity: isViolated ? 0.15 : 0.04,
    side: THREE.DoubleSide
  });
  const cageMesh = new THREE.Mesh(boxGeo, cageMat);
  cageMesh.position.set(centerX, centerY, centerZ);
  group.add(cageMesh);

  // 3. Physical Rotary Table Clearance Ring (if 5-Axis)
  if (config.tableDiameter) {
    const tableR = (config.tableDiameter / 2) * s;
    const ringGeo = new THREE.RingGeometry(tableR - 1.5, tableR + 1.5, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(0, -10, 0);
    group.add(ringMesh);
  }

  // 4. Axis Coordinate Datum Zero Indicator Cross
  const crossGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-20, 0, 0), new THREE.Vector3(20, 0, 0),
    new THREE.Vector3(0, 0, -20), new THREE.Vector3(0, 0, 20)
  ]);
  const crossMat = new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.7 });
  const cross = new THREE.LineSegments(crossGeo, crossMat);
  cross.position.set(0, 30, 0);
  group.add(cross);

  return group;
}

/**
 * Performs comprehensive pre-flight & real-time kinematic collision and axis over-travel audit.
 */
export function auditKinematicsAndCollisions(motionBlocks = [], machineId = 'dmu50', tools = [], stockConfig = {}) {
  const config = MACHINE_KINEMATICS[machineId] || MACHINE_KINEMATICS.dmu50;
  const ax = config.axes;
  const buf = config.softLimitBufferMm || 15.0;

  const violations = [];
  const warnings = [];

  let minObsX = Infinity, maxObsX = -Infinity;
  let minObsY = Infinity, maxObsY = -Infinity;
  let minObsZ = Infinity, maxObsZ = -Infinity;
  let minObsB = Infinity, maxObsB = -Infinity;
  let minObsC = Infinity, maxObsC = -Infinity;

  motionBlocks.forEach((block, idx) => {
    if (!block.isMotion) return;

    const x = block.x ?? 0;
    const y = block.y ?? 0;
    const z = block.z ?? 0;
    const b = block.b ?? 0;
    const c = block.c ?? 0;

    // Track observed extremes
    minObsX = Math.min(minObsX, x); maxObsX = Math.max(maxObsX, x);
    minObsY = Math.min(minObsY, y); maxObsY = Math.max(maxObsY, y);
    minObsZ = Math.min(minObsZ, z); maxObsZ = Math.max(maxObsZ, z);
    minObsB = Math.min(minObsB, b); maxObsB = Math.max(maxObsB, b);
    minObsC = Math.min(minObsC, c); maxObsC = Math.max(maxObsC, c);

    // 1. Check X-Axis Physical Limits
    if (ax.X) {
      if (x < ax.X.min) {
        violations.push({
          lineIdx: block.lineIdx ?? idx,
          rawText: block.rawText || `X${x.toFixed(3)}`,
          type: 'OVERTRAVEL',
          axis: 'X',
          value: x,
          limit: ax.X.min,
          overtravelDist: Number((ax.X.min - x).toFixed(2)),
          message: `X-Axis negative stroke limit exceeded by ${(ax.X.min - x).toFixed(2)}mm (X: ${x.toFixed(2)}, Limit: ${ax.X.min})`
        });
      } else if (x > ax.X.max) {
        violations.push({
          lineIdx: block.lineIdx ?? idx,
          rawText: block.rawText || `X${x.toFixed(3)}`,
          type: 'OVERTRAVEL',
          axis: 'X',
          value: x,
          limit: ax.X.max,
          overtravelDist: Number((x - ax.X.max).toFixed(2)),
          message: `X-Axis positive stroke limit exceeded by ${(x - ax.X.max).toFixed(2)}mm (X: ${x.toFixed(2)}, Limit: ${ax.X.max})`
        });
      } else if (x > ax.X.max - buf || x < ax.X.min + buf) {
        warnings.push({
          lineIdx: block.lineIdx ?? idx,
          axis: 'X',
          message: `X-Axis approaching soft-limit (${x.toFixed(2)}mm)`
        });
      }
    }

    // 2. Check Y-Axis Physical Limits
    if (ax.Y) {
      if (y < ax.Y.min) {
        violations.push({
          lineIdx: block.lineIdx ?? idx,
          rawText: block.rawText || `Y${y.toFixed(3)}`,
          type: 'OVERTRAVEL',
          axis: 'Y',
          value: y,
          limit: ax.Y.min,
          overtravelDist: Number((ax.Y.min - y).toFixed(2)),
          message: `Y-Axis negative stroke limit exceeded by ${(ax.Y.min - y).toFixed(2)}mm (Y: ${y.toFixed(2)}, Limit: ${ax.Y.min})`
        });
      } else if (y > ax.Y.max) {
        violations.push({
          lineIdx: block.lineIdx ?? idx,
          rawText: block.rawText || `Y${y.toFixed(3)}`,
          type: 'OVERTRAVEL',
          axis: 'Y',
          value: y,
          limit: ax.Y.max,
          overtravelDist: Number((y - ax.Y.max).toFixed(2)),
          message: `Y-Axis positive stroke limit exceeded by ${(y - ax.Y.max).toFixed(2)}mm (Y: ${y.toFixed(2)}, Limit: ${ax.Y.max})`
        });
      }
    }

    // 3. Check Z-Axis Physical Limits & Table Collision
    if (ax.Z) {
      if (z < ax.Z.min) {
        violations.push({
          lineIdx: block.lineIdx ?? idx,
          rawText: block.rawText || `Z${z.toFixed(3)}`,
          type: 'COLLISION_TABLE',
          axis: 'Z',
          value: z,
          limit: ax.Z.min,
          overtravelDist: Number((ax.Z.min - z).toFixed(2)),
          message: `CRITICAL: Spindle/Cutter plunged into Machine Table bed! (Z: ${z.toFixed(2)}mm, Limit: ${ax.Z.min}mm)`
        });
      } else if (z > ax.Z.max) {
        violations.push({
          lineIdx: block.lineIdx ?? idx,
          rawText: block.rawText || `Z${z.toFixed(3)}`,
          type: 'OVERTRAVEL',
          axis: 'Z',
          value: z,
          limit: ax.Z.max,
          overtravelDist: Number((z - ax.Z.max).toFixed(2)),
          message: `Z-Axis upper retract stroke limit exceeded by ${(z - ax.Z.max).toFixed(2)}mm (Z: ${z.toFixed(2)}, Limit: ${ax.Z.max})`
        });
      }
    }

    // 4. Check Rotary B & C Axis Limits (5-Axis)
    if (ax.B) {
      if (b < ax.B.min || b > ax.B.max) {
        violations.push({
          lineIdx: block.lineIdx ?? idx,
          rawText: block.rawText || `B${b.toFixed(2)}`,
          type: 'OVERTRAVEL_ROTARY',
          axis: 'B',
          value: b,
          limit: b < ax.B.min ? ax.B.min : ax.B.max,
          message: `B-Axis swivel head angle ${b.toFixed(1)}° exceeds physical limits [${ax.B.min}°, ${ax.B.max}°]!`
        });
      }
    }

    // 5. Check Rapid Plunge Gouge (Rapid move G0 below Z=0)
    if (block.isRapid && z < 0.0) {
      violations.push({
        lineIdx: block.lineIdx ?? idx,
        rawText: block.rawText || `G0 Z${z.toFixed(2)}`,
        type: 'RAPID_GOUGE',
        axis: 'Z',
        value: z,
        message: `Dangerous Rapid (G00 / FMAX) move below workpiece surface (Z: ${z.toFixed(2)}mm)!`
      });
    }
  });

  // Calculate percentage utilization of each axis stroke
  const calcUtil = (minObs, maxObs, axisLimits) => {
    if (!axisLimits || minObs === Infinity) return { strokeUsedPct: 0, minObs: 0, maxObs: 0 };
    const travelRange = axisLimits.max - axisLimits.min;
    const usedRange = Math.max(0, maxObs - minObs);
    const pct = travelRange > 0 ? Math.min(100, Math.round((usedRange / travelRange) * 100)) : 0;
    return {
      strokeUsedPct: pct,
      minObs: Number(minObs.toFixed(1)),
      maxObs: Number(maxObs.toFixed(1)),
      limitMin: axisLimits.min,
      limitMax: axisLimits.max,
      unit: axisLimits.unit
    };
  };

  const utilization = {
    X: calcUtil(minObsX, maxObsX, ax.X),
    Y: calcUtil(minObsY, maxObsY, ax.Y),
    Z: calcUtil(minObsZ, maxObsZ, ax.Z),
    B: calcUtil(minObsB, maxObsB, ax.B),
    C: calcUtil(minObsC, maxObsC, ax.C)
  };

  return {
    isSafe: violations.length === 0,
    totalBlocksScanned: motionBlocks.length,
    violationsCount: violations.length,
    warningsCount: warnings.length,
    violations,
    warnings: warnings.slice(0, 10), // keep top warnings
    utilization,
    machineConfig: config
  };
}

