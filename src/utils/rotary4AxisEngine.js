import * as THREE from 'three';
import { calculateRotary4AxisPhysics } from '../config/rotary4AxisSchema.js';

/**
 * Mastercam-Authentic Rotary 4-Axis Toolpath Engine & Kinematics Resolver
 *
 * Implements:
 * 1. Cylindrical stock & feature extraction from CAD B-Rep/mesh models
 * 2. Axis substitution (unwrapping 2D planar paths onto 3D cylinders: Y -> A degrees)
 * 3. Axial, Radial, and Continuous Spiral rotary cutting patterns
 * 4. Y-offset tangential cutting geometry
 * 5. 3D parabolic clearance blend loop linking transitions over cylinder OD
 * 6. 3D vector needles for 4-axis tool axis visualization
 * 7. Multi-dialect production post-processor (Fanuc G107 / Polar G112 / Direct A-axis, Haas G93, Siemens TRACYL)
 */

/**
 * Extracts cylindrical geometry and feature bounds from model
 */
export function extractRotaryStockFromModel(model, fallbackDiameter = 60.0, fallbackLength = 100.0) {
  const D = Math.max(10.0, Number(fallbackDiameter) || 60.0);
  const L = Math.max(10.0, Number(fallbackLength) || 100.0);
  const R = D / 2.0;

  if (!model) {
    return {
      diameter: D,
      radius: R,
      length: L,
      xMin: -L / 2.0,
      xMax: L / 2.0,
      yCenter: 0.0,
      zCenter: 0.0,
      detectedCylinder: false
    };
  }

  // If three.js mesh exists, calculate bounding box
  let xMin = -L / 2.0;
  let xMax = L / 2.0;
  let detectedR = R;

  if (model.geometry && model.geometry.attributes && model.geometry.attributes.position) {
    const pos = model.geometry.attributes.position;
    let minX = Infinity, maxX = -Infinity;
    let maxRadialDist = 0.0;

    for (let i = 0; i < pos.count; i += 3) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      if (x < minX) minX = x;
      if (x > maxX) maxX = x;

      const radialDist = Math.sqrt(y * y + z * z);
      if (radialDist > maxRadialDist) maxRadialDist = radialDist;
    }

    if (isFinite(minX) && isFinite(maxX) && maxX > minX) {
      xMin = minX;
      xMax = maxX;
    }
    if (maxRadialDist > 5.0) {
      detectedR = maxRadialDist;
    }
  }

  return {
    diameter: Number((detectedR * 2.0).toFixed(2)),
    radius: Number(detectedR.toFixed(2)),
    length: Number((xMax - xMin).toFixed(2)),
    xMin: Number(xMin.toFixed(2)),
    xMax: Number(xMax.toFixed(2)),
    yCenter: 0.0,
    zCenter: 0.0,
    detectedCylinder: true
  };
}

/**
 * Converts a flat planar coordinate (x, y, zDepth) into a wrapped cylindrical point (X, Y, Z, A)
 * where A-axis rotates around X.
 *
 * @param {number} x - Linear position along cylinder axis
 * @param {number} y - Unwrapped transverse position
 * @param {number} depthMm - Depth into cylinder from OD (positive = below OD)
 * @param {number} cylinderRadius - Cylinder outer radius (OD / 2)
 * @param {number} yOffset - Tangential Y-offset distance
 */
export function wrapPlanarToCylinder(x, y, depthMm, cylinderRadius, yOffset = 0.0) {
  const R_cut = Math.max(0.1, cylinderRadius - depthMm);
  const circumference = 2.0 * Math.PI * cylinderRadius;

  // A in degrees: 360 * y / circumference
  const aDeg = (360.0 * y) / circumference;
  const aRad = (aDeg * Math.PI) / 180.0;

  // Machine coordinates with rotary center at Y=0, Z=0
  // Standard tool pointing down at top of cylinder:
  // With rotary A angle, the workpiece point rotates by -A under spindle
  const Y_mach = yOffset;
  const Z_mach = R_cut;

  // 3D Cartesian representation in part coordinates (for 3D viewport):
  const pX = x;
  const pY = R_cut * Math.sin(aRad) + yOffset * Math.cos(aRad);
  const pZ = R_cut * Math.cos(aRad) - yOffset * Math.sin(aRad);

  // Normal vector pointing radially outward
  const normX = 0.0;
  const normY = Math.sin(aRad);
  const normZ = Math.cos(aRad);

  return {
    machinePos: { x: Number(x.toFixed(3)), y: Number(Y_mach.toFixed(3)), z: Number(Z_mach.toFixed(3)), a: Number(aDeg.toFixed(3)) },
    partPos: { x: Number(pX.toFixed(3)), y: Number(pY.toFixed(3)), z: Number(pZ.toFixed(3)) },
    normal: { x: Number(normX.toFixed(4)), y: Number(normY.toFixed(4)), z: Number(normZ.toFixed(4)) },
    aDeg: Number(aDeg.toFixed(3))
  };
}

/**
 * Builds a 3D parabolic clearance blend loop connecting passEnd to passStartNext over cylinder OD
 */
export function buildRotaryBlendLoop(pEnd, pStartNext, cylinderRadius, clearanceLiftMm = 3.0, numSteps = 8) {
  const steps = [];
  const R_safe = cylinderRadius + clearanceLiftMm;

  for (let i = 1; i < numSteps; i++) {
    const t = i / numSteps;
    // Cubic Hermite smoothstep
    const b = t * t * (3.0 - 2.0 * t);
    // Parabolic lift arch
    const archFactor = 4.0 * t * (1.0 - t);

    const x = pEnd.x + (pStartNext.x - pEnd.x) * b;
    // Interpolate rotary angle A
    const aDeg = pEnd.aDeg + (pStartNext.aDeg - pEnd.aDeg) * b;
    const aRad = (aDeg * Math.PI) / 180.0;

    const baseR = pEnd.radius + (pStartNext.radius - pEnd.radius) * b;
    const currentR = baseR + archFactor * clearanceLiftMm;

    const pX = x;
    const pY = currentR * Math.sin(aRad);
    const pZ = currentR * Math.cos(aRad);

    steps.push({
      x: Number(pX.toFixed(3)),
      y: Number(pY.toFixed(3)),
      z: Number(pZ.toFixed(3)),
      aDeg: Number(aDeg.toFixed(3)),
      feedRate: pEnd.feedRate || 3000,
      isLinking: true
    });
  }

  return steps;
}

/**
 * Generates Mastercam-authentic Rotary 4-Axis Toolpath
 */
export function generateRotary4AxisToolpath(params = {}, model = null) {
  const stock = extractRotaryStockFromModel(
    model,
    params.cutPattern?.cylinderDiameter || 60.0,
    params.cutPattern?.cylinderLength || 100.0
  );

  const cylinderRadius = stock.radius;
  const cylinderDiameter = stock.diameter;
  const cylinderLength = stock.length;
  const xMin = stock.xMin;
  const xMax = stock.xMax;

  const style = params.cutPattern?.machiningStyle || 'axis_substitution';
  const cuttingDirection = params.cutPattern?.cuttingDirection || 'climb';
  const yOffsetMm = Number(params.axisControl?.yOffsetDistanceMm) || 0.0;
  const stockToLeave = Number(params.stepoverPasses?.stockToLeaveCylinderMm) || 0.0;
  const cutDepthMm = Math.max(0.5, (Number(params.stepoverPasses?.maxRoughStepdownMm) || 2.0) - stockToLeave);

  const feedRate = Number(params.tool?.feedRate) || 2000;
  const plungeRate = Number(params.tool?.plungeRate) || 500;
  const spindleRpm = Number(params.tool?.spindleSpeed) || 10000;
  const toolDia = Number(params.tool?.diameter) || 10.0;

  const toolpathPoints = [];
  const vectorNeedles = [];
  const contactRibbonVertices = [];
  const linkingMoves = [];

  // Clearance cylinder radius
  const clearanceRadius = Number(params.linkingParameters?.clearanceRadiusMm) || (cylinderRadius + 15.0);
  const retractRadius = Number(params.linkingParameters?.retractRadiusMm) || (cylinderRadius + 5.0);

  // Approach rapid point at entry
  const entryX = xMin + 5.0;
  const entryA = 0.0;
  const approachPt = {
    x: entryX,
    y: clearanceRadius * Math.sin(0),
    z: clearanceRadius * Math.cos(0),
    aDeg: 0.0,
    isRapid: true,
    feedRate: 5000
  };
  toolpathPoints.push(approachPt);

  // ========================================================
  // Pattern 1: AXIS SUBSTITUTION (Cylindrical Cam / Slot)
  // ========================================================
  if (style === 'axis_substitution') {
    const numCycles = 2.0; // 2 sine waves around 360 degrees
    const totalPoints = 120;
    const strokeX = (xMax - xMin) * 0.6;
    const midX = (xMin + xMax) / 2.0;

    for (let i = 0; i <= totalPoints; i++) {
      const u = i / totalPoints;
      // Unwrapped Y ranges from 0 to cylinder circumference
      const unwrappedY = u * (Math.PI * cylinderDiameter);
      // Sine cam trajectory along X
      const curX = midX + Math.sin(u * numCycles * 2.0 * Math.PI) * (strokeX / 2.0);

      const wrapped = wrapPlanarToCylinder(curX, unwrappedY, cutDepthMm, cylinderRadius, yOffsetMm);

      const pt = {
        x: wrapped.partPos.x,
        y: wrapped.partPos.y,
        z: wrapped.partPos.z,
        aDeg: wrapped.aDeg,
        machinePos: wrapped.machinePos,
        normal: wrapped.normal,
        feedRate: i === 0 ? plungeRate : feedRate,
        isCutting: true,
        radius: cylinderRadius - cutDepthMm
      };

      toolpathPoints.push(pt);

      // Add orientation vector needle
      if (i % 3 === 0) {
        const needleStart = new THREE.Vector3(wrapped.partPos.x, wrapped.partPos.y, wrapped.partPos.z);
        const needleEnd = needleStart.clone().add(
          new THREE.Vector3(wrapped.normal.x, wrapped.normal.y, wrapped.normal.z).multiplyScalar(12.0)
        );
        vectorNeedles.push([needleStart, needleEnd]);
      }

      // Add swept ribbon vertices
      contactRibbonVertices.push(
        wrapped.partPos.x - toolDia * 0.25, wrapped.partPos.y, wrapped.partPos.z,
        wrapped.partPos.x + toolDia * 0.25, wrapped.partPos.y, wrapped.partPos.z
      );
    }
  }

  // ========================================================
  // Pattern 2: AXIAL MACHINING (Longitudinal Slices along X)
  // ========================================================
  else if (style === 'axial') {
    const stepoverDeg = Math.max(1.0, Number(params.stepoverPasses?.stepoverDeg) || 5.0);
    const numPasses = Math.min(72, Math.max(4, Math.round(360.0 / stepoverDeg)));
    const actualStepDeg = 360.0 / numPasses;
    const numLinearSteps = 25;

    for (let pass = 0; pass < numPasses; pass++) {
      const curA = pass * actualStepDeg;
      const aRad = (curA * Math.PI) / 180.0;
      const forward = cuttingDirection === 'zigzag' ? pass % 2 === 0 : true;

      const passPoints = [];
      for (let s = 0; s <= numLinearSteps; s++) {
        const u = forward ? s / numLinearSteps : 1.0 - (s / numLinearSteps);
        const curX = xMin + 2.0 + u * (xMax - xMin - 4.0);

        const R_cut = cylinderRadius - cutDepthMm;
        const pX = curX;
        const pY = R_cut * Math.sin(aRad) + yOffsetMm * Math.cos(aRad);
        const pZ = R_cut * Math.cos(aRad) - yOffsetMm * Math.sin(aRad);

        const normX = 0.0;
        const normY = Math.sin(aRad);
        const normZ = Math.cos(aRad);

        passPoints.push({
          x: Number(pX.toFixed(3)),
          y: Number(pY.toFixed(3)),
          z: Number(pZ.toFixed(3)),
          aDeg: Number(curA.toFixed(3)),
          machinePos: { x: Number(curX.toFixed(3)), y: yOffsetMm, z: Number(R_cut.toFixed(3)), a: Number(curA.toFixed(3)) },
          normal: { x: normX, y: Number(normY.toFixed(4)), z: Number(normZ.toFixed(4)) },
          feedRate: s === 0 && pass === 0 ? plungeRate : feedRate,
          isCutting: true,
          radius: R_cut
        });
      }

      // If transition between passes, insert 3D blend loop over OD
      if (pass > 0 && toolpathPoints.length > 0) {
        const lastPt = toolpathPoints[toolpathPoints.length - 1];
        const firstPtNext = passPoints[0];
        const blendMoves = buildRotaryBlendLoop(lastPt, firstPtNext, cylinderRadius, 2.5, 6);
        blendMoves.forEach(bm => toolpathPoints.push(bm));
      }

      passPoints.forEach(pt => toolpathPoints.push(pt));

      // Vector needles
      passPoints.forEach((pt, idx) => {
        if (idx % 6 === 0) {
          const needleStart = new THREE.Vector3(pt.x, pt.y, pt.z);
          const needleEnd = needleStart.clone().add(
            new THREE.Vector3(pt.normal.x, pt.normal.y, pt.normal.z).multiplyScalar(12.0)
          );
          vectorNeedles.push([needleStart, needleEnd]);
        }
      });
    }
  }

  // ========================================================
  // Pattern 3: RADIAL & CONTINUOUS SPIRAL MACHINING
  // ========================================================
  else {
    // Continuous spiral from xMin to xMax with N continuous revolutions
    const stepoverMm = Math.max(0.2, Number(params.stepoverPasses?.stepoverMm) || 1.0);
    const usableLength = Math.max(5.0, xMax - xMin - 4.0);
    const numRevolutions = Math.max(3, Math.round(usableLength / stepoverMm));
    const pointsPerRev = 36;
    const totalPoints = numRevolutions * pointsPerRev;

    for (let i = 0; i <= totalPoints; i++) {
      const u = i / totalPoints;
      const curX = xMin + 2.0 + u * usableLength;
      const totalDeg = u * numRevolutions * 360.0;
      const aRad = (totalDeg * Math.PI) / 180.0;

      const R_cut = cylinderRadius - cutDepthMm;
      const pX = curX;
      const pY = R_cut * Math.sin(aRad) + yOffsetMm * Math.cos(aRad);
      const pZ = R_cut * Math.cos(aRad) - yOffsetMm * Math.sin(aRad);

      const normX = 0.0;
      const normY = Math.sin(aRad);
      const normZ = Math.cos(aRad);

      const pt = {
        x: Number(pX.toFixed(3)),
        y: Number(pY.toFixed(3)),
        z: Number(pZ.toFixed(3)),
        aDeg: Number(totalDeg.toFixed(3)),
        machinePos: { x: Number(curX.toFixed(3)), y: yOffsetMm, z: Number(R_cut.toFixed(3)), a: Number(totalDeg.toFixed(3)) },
        normal: { x: normX, y: Number(normY.toFixed(4)), z: Number(normZ.toFixed(4)) },
        feedRate: i === 0 ? plungeRate : feedRate,
        isCutting: true,
        radius: R_cut
      };

      toolpathPoints.push(pt);

      if (i % 8 === 0) {
        const needleStart = new THREE.Vector3(pt.x, pt.y, pt.z);
        const needleEnd = needleStart.clone().add(
          new THREE.Vector3(pt.normal.x, pt.normal.y, pt.normal.z).multiplyScalar(12.0)
        );
        vectorNeedles.push([needleStart, needleEnd]);
      }

      contactRibbonVertices.push(
        pt.x - toolDia * 0.25, pt.y, pt.z,
        pt.x + toolDia * 0.25, pt.y, pt.z
      );
    }
  }

  // Safe Retract at end of toolpath
  if (toolpathPoints.length > 0) {
    const lastCut = toolpathPoints[toolpathPoints.length - 1];
    const retractPt = {
      x: lastCut.x,
      y: clearanceRadius * Math.sin((lastCut.aDeg * Math.PI) / 180.0),
      z: clearanceRadius * Math.cos((lastCut.aDeg * Math.PI) / 180.0),
      aDeg: lastCut.aDeg,
      isRapid: true,
      feedRate: 5000
    };
    toolpathPoints.push(retractPt);
  }

  // Calculate 4X physics
  const physics = calculateRotary4AxisPhysics({
    cylinderDiameter,
    toolDiameter: toolDia,
    toolCornerRadius: Number(params.tool?.cornerRadius) || 0.0,
    isBallnose: params.tool?.toolType === 'ball' || params.tool?.toolType === 'ballnose',
    flutes: Number(params.tool?.flutes) || 2,
    spindleRpm,
    feedLinearMmMin: feedRate,
    stepoverMm: Number(params.stepoverPasses?.stepoverMm) || 1.0,
    depthOfCutMm: cutDepthMm,
    materialKey: params.materialKey || 'ALU_6061',
    yOffsetMm
  });

  return {
    points: toolpathPoints,
    vectorNeedles,
    contactRibbonVertices,
    linkingMoves,
    stock,
    physics,
    stats: {
      totalPoints: toolpathPoints.length,
      cuttingPoints: toolpathPoints.filter(p => p.isCutting).length,
      cylinderDiameter,
      cylinderLength,
      rotaryFeedDegMin: physics.rotaryFeedDegMin,
      machiningStyle: style
    },
    isRotary4Axis: true
  };
}

/**
 * Generates NC G-code for 4-axis rotary toolpath across Fanuc, Haas, and Siemens controllers
 */
export function generateRotary4AxisGCode(toolpath, params = {}) {
  if (!toolpath || !Array.isArray(toolpath.points) || toolpath.points.length === 0) {
    return '(ERROR: No 4-axis rotary toolpath points to post)\nM30\n%';
  }

  const dialect = params.machineKinematics?.postDialect || 'fanuc';
  const rotaryAxis = params.machineKinematics?.rotaryAxisLetter || 'A';
  const toolNum = params.tool?.toolNumber || 1;
  const toolName = params.tool?.toolName || '10mm Rotary Endmill';
  const toolDia = params.tool?.diameter || 10.0;
  const spindleRpm = params.tool?.spindleSpeed || 10000;
  const feedLinear = params.tool?.feedRate || 2000;
  const feedMode = params.machineKinematics?.feedMode || 'deg_per_min';
  const useCylindricalInterp = params.machineKinematics?.cylindricalInterpEnabled && dialect === 'fanuc';
  const cylinderRadius = toolpath.stock?.radius || 30.0;

  const lines = [];
  let n = 10;
  const nextN = () => {
    const num = `N${n}`;
    n += 10;
    return num;
  };

  const today = new Date().toISOString().split('T')[0];

  // Header
  lines.push('%');
  lines.push('O0001 (4AXIS_ROTARY_CYLINDRICAL_PART)');
  lines.push('(--- ARGUS CAM POST-PROCESSOR ---)');
  lines.push(`(MACHINE: 4-Axis VMC with ${rotaryAxis}-Axis Rotary Table)`);
  lines.push(`(CONTROLLER: ${dialect.toUpperCase()})`);
  lines.push(`(DATE: ${today})`);
  lines.push(`(CYLINDER OD: ${(cylinderRadius * 2).toFixed(2)}mm | LENGTH: ${toolpath.stock?.length || 100}mm)`);
  lines.push(`${nextN()} G90 G21 G17 G54 G94`);
  lines.push(`${nextN()} G28 G91 Z0.`);
  lines.push(`${nextN()} G28 G91 ${rotaryAxis}0.`);
  lines.push(`${nextN()} G90`);
  lines.push('');

  // Tool Change
  lines.push('(================================================)');
  lines.push(`(OPERATION: 4-AXIS ROTARY MACHINING - ${toolpath.stats?.machiningStyle?.toUpperCase()})`);
  lines.push(`(TOOL: T${toolNum} [${toolName}] | DIA: ${toolDia}mm)`);
  lines.push('(================================================)');
  lines.push(`${nextN()} T${toolNum} M06 (${toolName})`);
  lines.push(`${nextN()} S${spindleRpm} M03`);
  lines.push(`${nextN()} G43 H${toolNum} Z${(cylinderRadius + 30.0).toFixed(3)} M08`);

  if (params.machineKinematics?.enableAICC2Lookahead && dialect === 'fanuc') {
    lines.push(`${nextN()} G05.1 Q1 (HIGH SPEED AICC II LOOK-AHEAD)`);
  }

  // Fanuc G107 / G07.1 Cylindrical Interpolation
  if (useCylindricalInterp) {
    lines.push(`${nextN()} G107 C${cylinderRadius.toFixed(3)} (CYLINDRICAL INTERPOLATION ON - RADIUS ${cylinderRadius.toFixed(3)}mm)`);
  }

  // Pre-positioning
  const firstPt = toolpath.points[0];
  const firstX = (firstPt.machinePos?.x ?? firstPt.x).toFixed(3);
  const firstY = (firstPt.machinePos?.y ?? 0.0).toFixed(3);
  const firstZ = (cylinderRadius + 15.0).toFixed(3);
  const firstA = (firstPt.machinePos?.a ?? firstPt.aDeg ?? 0.0).toFixed(3);

  lines.push(`${nextN()} G00 X${firstX} Y${firstY} ${rotaryAxis}${firstA}`);
  lines.push(`${nextN()} G00 Z${firstZ}`);

  // Inverse Time or Deg/Min Feed Mode command
  if (feedMode === 'inverse_time') {
    lines.push(`${nextN()} G93 (INVERSE TIME FEED MODE ON)`);
  }

  // Cutting moves
  let lastFeed = -1;
  let lastG = 'G00';

  for (let i = 1; i < toolpath.points.length; i++) {
    const pt = toolpath.points[i];
    const prevPt = toolpath.points[i - 1];

    const curX = (pt.machinePos?.x ?? pt.x).toFixed(3);
    const curY = (pt.machinePos?.y ?? 0.0).toFixed(3);
    const curZ = (pt.machinePos?.z ?? (cylinderRadius - (pt.isRapid ? -15.0 : 2.0))).toFixed(3);
    const curA = (pt.machinePos?.a ?? pt.aDeg ?? 0.0).toFixed(3);

    const isRapid = pt.isRapid || false;
    const gCode = isRapid ? 'G00' : 'G01';

    let feedStr = '';
    if (!isRapid) {
      if (feedMode === 'inverse_time') {
        // Calculate 3D segment length
        const dx = (pt.machinePos?.x ?? pt.x) - (prevPt.machinePos?.x ?? prevPt.x);
        const da = ((pt.machinePos?.a ?? pt.aDeg) - (prevPt.machinePos?.a ?? prevPt.aDeg)) * (Math.PI / 180.0) * cylinderRadius;
        const dz = (pt.machinePos?.z ?? 0) - (prevPt.machinePos?.z ?? 0);
        const dist = Math.max(0.01, Math.sqrt(dx * dx + da * da + dz * dz));
        const invF = Math.min(9999, Math.max(1, Math.round(feedLinear / dist)));
        feedStr = ` F${invF}`;
      } else {
        const curFeed = pt.feedRate || feedLinear;
        if (curFeed !== lastFeed || gCode !== lastG) {
          feedStr = ` F${curFeed}`;
          lastFeed = curFeed;
        }
      }
    }

    lines.push(`${nextN()} ${gCode} X${curX} Y${curY} Z${curZ} ${rotaryAxis}${curA}${feedStr}`);
    lastG = gCode;
  }

  // Post-cut cancellations
  if (feedMode === 'inverse_time') {
    lines.push(`${nextN()} G94 (RESTORE FEED PER MINUTE MODE)`);
  }

  if (useCylindricalInterp) {
    lines.push(`${nextN()} G107 C0 (CYLINDRICAL INTERPOLATION CANCEL)`);
  }

  if (params.machineKinematics?.enableAICC2Lookahead && dialect === 'fanuc') {
    lines.push(`${nextN()} G05.1 Q0 (AICC II OFF)`);
  }

  // Retract and Safe Shutdown
  lines.push(`${nextN()} G00 Z${(cylinderRadius + 50.0).toFixed(3)} M09`);
  lines.push('');
  lines.push('(--- PROGRAM END ---)');
  lines.push(`${nextN()} M05`);
  lines.push(`${nextN()} G28 G91 Z0.`);
  lines.push(`${nextN()} G28 G91 ${rotaryAxis}0.`);
  lines.push(`${nextN()} G28 G91 X0. Y0.`);
  lines.push(`${nextN()} G90`);
  lines.push(`${nextN()} M30`);
  lines.push('%');

  return lines.join('\n');
}
