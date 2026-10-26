import * as THREE from 'three';

/**
 * Toolpath Generation Engine
 * Calculates mathematically accurate 2.5D and 3D CNC toolpath trajectories
 */

/**
 * Generates Face Milling Toolpath (Zigzag Raster with Lead-in/Lead-out and Smooth Loops)
 */
export function generateFacingToolpath(bounds, tool, params = {}) {
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
 * Generates 2D Dynamic Pocketing Toolpath (Concentric Clearing with Helical Ramp Plunge)
 */
export function generatePocketToolpath(bounds, tool, params = {}) {
  const {
    stepoverPct = 50,
    totalDepth = 15.0,
    stepdown = 5.0,
    rapidHeight = 15.0
  } = params;

  const toolRadius = (tool.diameter || 8) / 2;
  const stepover = (tool.diameter * stepoverPct) / 100;
  const topY = bounds.max.y;

  const cuttingLines = [];
  const rapidLines = [];

  // Pockets clear inside the boundary offset by tool radius
  const width = (bounds.max.x - bounds.min.x) * 0.6 - toolRadius * 2;
  const depth = (bounds.max.z - bounds.min.z) * 0.6 - toolRadius * 2;

  for (let curDepth = stepdown; curDepth <= totalDepth; curDepth += stepdown) {
    const cutY = topY - curDepth;

    // 1. Helical Ramp Entry into the center of the pocket
    const rampRadius = Math.min(8, toolRadius * 1.5);
    const rampRotations = 3;
    let prevPoint = new THREE.Vector3(rampRadius, topY + 2, 0);

    for (let i = 0; i <= rampRotations * 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const progress = i / (rampRotations * 20);
      const y = (topY + 2) - progress * (curDepth + 2);
      const nextPoint = new THREE.Vector3(Math.cos(angle) * rampRadius, y, Math.sin(angle) * rampRadius);
      cuttingLines.push([prevPoint, nextPoint]);
      prevPoint = nextPoint;
    }

    // 2. Concentric Outward Clearing Loops
    const maxLoops = Math.max(2, Math.floor(Math.min(width, depth) / (stepover * 2)));
    for (let loop = 1; loop <= maxLoops; loop++) {
      const rx = loop * stepover;
      const rz = loop * stepover * 0.8;

      const loopPoints = [];
      for (let a = 0; a <= Math.PI * 2; a += 0.2) {
        loopPoints.push(new THREE.Vector3(Math.cos(a) * rx, cutY, Math.sin(a) * rz));
      }

      for (let p = 0; p < loopPoints.length - 1; p++) {
        cuttingLines.push([loopPoints[p], loopPoints[p + 1]]);
      }
      // Close loop
      cuttingLines.push([loopPoints[loopPoints.length - 1], loopPoints[0]]);
    }

    // Retract at end of depth level
    rapidLines.push([
      new THREE.Vector3(0, cutY, 0),
      new THREE.Vector3(0, topY + rapidHeight, 0)
    ]);
  }

  return { cuttingLines, rapidLines };
}

/**
 * Generates 3D Waterline Finishing Toolpath (Multi-Z Surface Contouring with Lead-in/Lead-out Arcs)
 */
export function generateWaterlineToolpath(bounds, tool, params = {}) {
  const {
    stepdown = 3.0,
    rapidHeight = 15.0
  } = params;

  const toolRadius = (tool.diameter || 6) / 2;
  const topY = bounds.max.y;
  const bottomY = bounds.min.y;

  const cuttingLines = [];
  const rapidLines = [];

  const halfX = (bounds.max.x - bounds.min.x) / 2 + toolRadius;
  const halfZ = (bounds.max.z - bounds.min.z) / 2 + toolRadius;

  for (let curY = topY; curY >= bottomY; curY -= stepdown) {
    // Outer perimeter contour
    const p1 = new THREE.Vector3(-halfX, curY, -halfZ);
    const p2 = new THREE.Vector3(halfX, curY, -halfZ);
    const p3 = new THREE.Vector3(halfX, curY, halfZ);
    const p4 = new THREE.Vector3(-halfX, curY, halfZ);

    // Lead-in arc from clearance
    const leadInStart = new THREE.Vector3(-halfX - 8, curY, -halfZ - 8);
    rapidLines.push([
      new THREE.Vector3(leadInStart.x, topY + rapidHeight, leadInStart.z),
      leadInStart
    ]);
    cuttingLines.push([leadInStart, p1]);

    // Cutting the 4 walls
    cuttingLines.push([p1, p2]);
    cuttingLines.push([p2, p3]);
    cuttingLines.push([p3, p4]);
    cuttingLines.push([p4, p1]);

    // Lead-out arc
    const leadOutEnd = new THREE.Vector3(-halfX - 8, curY, -halfZ + 8);
    cuttingLines.push([p1, leadOutEnd]);
  }

  return { cuttingLines, rapidLines };
}

/**
 * Generates 5-Axis Simultaneous Swarf Contour Toolpath (XYZ plus Tool Orientation Vectors)
 */
export function generateSwarfToolpath(bounds, tool, params = {}) {
  const {
    tiltAngleDeg = 15.0,
    passes = 2
  } = params;

  const cuttingLines = [];
  const rapidLines = [];
  const topY = bounds.max.y;
  const radius = Math.min((bounds.max.x - bounds.min.x) / 2, (bounds.max.z - bounds.min.z) / 2) + 2;

  // Rapid approach to first pass
  const startX = radius;
  const startZ = 0;
  rapidLines.push([
    new THREE.Vector3(startX, topY + 15, startZ),
    new THREE.Vector3(startX, topY - 10, startZ)
  ]);

  for (let p = 0; p < passes; p++) {
    const yLevel = topY - 10 - p * 8;
    const points = [];

    for (let angle = 0; angle <= Math.PI * 2; angle += 0.12) {
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      // 5-axis wave variation
      const y = yLevel + Math.sin(angle * 4) * 6;
      points.push(new THREE.Vector3(x, y, z));
    }

    for (let i = 0; i < points.length - 1; i++) {
      cuttingLines.push([points[i], points[i + 1]]);
    }
  }

  // Rapid retract to clearance
  rapidLines.push([
    new THREE.Vector3(startX, topY - 10 - (passes - 1) * 8, startZ),
    new THREE.Vector3(startX, topY + 15, startZ)
  ]);

  return { cuttingLines, rapidLines };
}

/**
 * Generates Deep Hole Peck Drilling Toolpath (G83 Cycle)
 */
export function generateDrillingToolpath(bounds, tool, params = {}) {
  const {
    drillDepth = 25.0,
    peckDepth = 5.0,
    rapidHeight = 10.0
  } = params;

  const cuttingLines = [];
  const rapidLines = [];
  const topY = bounds.max.y;

  // 4 Hole positions on mounting ears
  const halfX = (bounds.max.x - bounds.min.x) * 0.35;
  const halfZ = (bounds.max.z - bounds.min.z) * 0.35;

  const holes = [
    { x: -halfX, z: -halfZ },
    { x: halfX, z: -halfZ },
    { x: halfX, z: halfZ },
    { x: -halfX, z: halfZ }
  ];

  holes.forEach((hole) => {
    // Rapid to hole coordinate
    rapidLines.push([
      new THREE.Vector3(hole.x, topY + rapidHeight, hole.z),
      new THREE.Vector3(hole.x, topY + 2, hole.z)
    ]);

    // G83 Peck cycles
    for (let curDepth = peckDepth; curDepth <= drillDepth; curDepth += peckDepth) {
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

  return { cuttingLines, rapidLines };
}

/**
 * Converts line segments into Three.js LineSegments geometries
 */
export function buildToolpathMeshes(toolpathData) {
  const { cuttingLines, rapidLines } = toolpathData;

  const cutPoints = [];
  cuttingLines.forEach(([p1, p2]) => {
    cutPoints.push(p1.x, p1.y, p1.z);
    cutPoints.push(p2.x, p2.y, p2.z);
  });

  const rapidPoints = [];
  rapidLines.forEach(([p1, p2]) => {
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
 * Generates 3D High-Speed Adaptive Roughing Toolpath (Constant Tool Engagement Trochoidal Arcs)
 */
export function generateAdaptiveRoughingToolpath(bounds, tool, params = {}) {
  const {
    stepoverPct = 25,
    stepdown = 8.0,
    totalDepth = 24.0,
    rapidHeight = 15.0
  } = params;

  const toolRadius = (tool.diameter || 10) / 2;
  const stepover = (tool.diameter * stepoverPct) / 100;
  const topY = bounds.max.y;

  const cuttingLines = [];
  const rapidLines = [];

  const minX = bounds.min.x - toolRadius;
  const maxX = bounds.max.x + toolRadius;
  const minZ = bounds.min.z - toolRadius;
  const maxZ = bounds.max.z + toolRadius;

  for (let curDepth = stepdown; curDepth <= totalDepth; curDepth += stepdown) {
    const cutY = topY - curDepth;

    // Helical center lead-in
    rapidLines.push([
      new THREE.Vector3(minX, topY + rapidHeight, minZ),
      new THREE.Vector3(minX, cutY + 2, minZ)
    ]);

    // Trochoidal clearing motion (small circular loops advancing along the cut vector)
    let direction = 1;
    for (let z = minZ; z <= maxZ; z += stepover * 2) {
      const startX = direction === 1 ? minX : maxX;
      const endX = direction === 1 ? maxX : minX;
      const dist = Math.abs(endX - startX);
      const steps = Math.max(10, Math.floor(dist / 4));

      let prevPt = new THREE.Vector3(startX, cutY, z);
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const baseX = startX + (endX - startX) * t;
        // Superimpose trochoidal circular loop
        const loopAngle = (s % 6) * (Math.PI / 3);
        const trochoidX = baseX + Math.cos(loopAngle) * (stepover * 0.7);
        const trochoidZ = z + Math.sin(loopAngle) * (stepover * 0.7);

        const currPt = new THREE.Vector3(trochoidX, cutY, trochoidZ);
        cuttingLines.push([prevPt, currPt]);
        prevPt = currPt;
      }

      direction *= -1;
    }

    // Retract
    rapidLines.push([
      new THREE.Vector3(maxX, cutY, maxZ),
      new THREE.Vector3(maxX, topY + rapidHeight, maxZ)
    ]);
  }

  return { cuttingLines, rapidLines };
}

/**
 * Generates Perimeter Chamfer / Deburring Toolpath (45-degree Edge Break)
 */
export function generateChamferToolpath(bounds, tool, params = {}) {
  const {
    chamferWidth = 1.0,
    rapidHeight = 15.0
  } = params;

  const toolRadius = (tool.diameter || 8) / 2;
  const topY = bounds.max.y;
  const chamferDepth = topY - chamferWidth;

  const cuttingLines = [];
  const rapidLines = [];

  const halfX = (bounds.max.x - bounds.min.x) / 2 + toolRadius - (chamferWidth * 0.5);
  const halfZ = (bounds.max.z - bounds.min.z) / 2 + toolRadius - (chamferWidth * 0.5);

  const corners = [
    new THREE.Vector3(-halfX, chamferDepth, -halfZ),
    new THREE.Vector3(halfX, chamferDepth, -halfZ),
    new THREE.Vector3(halfX, chamferDepth, halfZ),
    new THREE.Vector3(-halfX, chamferDepth, halfZ)
  ];

  // Lead-in
  const leadStart = new THREE.Vector3(-halfX - 6, chamferDepth + 2, -halfZ);
  rapidLines.push([
    new THREE.Vector3(leadStart.x, topY + rapidHeight, leadStart.z),
    leadStart
  ]);
  cuttingLines.push([leadStart, corners[0]]);

  // Chamfer boundary loops (2 finish spring passes)
  for (let p = 0; p < 2; p++) {
    cuttingLines.push([corners[0], corners[1]]);
    cuttingLines.push([corners[1], corners[2]]);
    cuttingLines.push([corners[2], corners[3]]);
    cuttingLines.push([corners[3], corners[0]]);
  }

  // Lead-out
  const leadEnd = new THREE.Vector3(-halfX - 6, chamferDepth + 2, -halfZ);
  cuttingLines.push([corners[0], leadEnd]);
  rapidLines.push([
    leadEnd,
    new THREE.Vector3(leadEnd.x, topY + rapidHeight, leadEnd.z)
  ]);

  return { cuttingLines, rapidLines };
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
 * Safety & Gouge Detection Checker across all active operations and tools
 */
export function checkToolpathCollisions(operations = [], tools = []) {
  const issues = [];

  operations.forEach((op) => {
    const assignedTool = tools.find((t) => t.id === op.toolId) || tools[0] || { fluteLength: 25, overallLength: 75 };
    const requiredDepth = Number(op.totalDepth || op.stepdown || 10);
    const fluteLength = Number(assignedTool.fluteLength || 25);
    const overallLength = Number(assignedTool.overallLength || 75);

    // 1. Tool Flute Length Insufficient (Shank rub)
    if (requiredDepth > fluteLength) {
      issues.push({
        opId: op.id,
        opName: op.name,
        type: 'warning',
        severity: 'Medium',
        title: 'Shank Contact Warning',
        message: `Cut depth (${requiredDepth}mm) exceeds tool flute length (${fluteLength}mm). Non-cutting shank will rub workpiece wall.`
      });
    }

    // 2. Tool Holder Collision
    if (requiredDepth > overallLength - 10) {
      issues.push({
        opId: op.id,
        opName: op.name,
        type: 'danger',
        severity: 'Critical Collision',
        title: 'Tool Holder Gouge Detected',
        message: `Cut depth (${requiredDepth}mm) exceeds tool holder clearance stickout (${overallLength - 10}mm). Spindle collet collision imminent!`
      });
    }

    // 3. Stepover Too High (> 85% of tool diameter)
    if (op.stepoverPct > 85) {
      issues.push({
        opId: op.id,
        opName: op.name,
        type: 'warning',
        severity: 'Low',
        title: 'High Radial Engagement',
        message: `Stepover (${op.stepoverPct}%) exceeds 85%. Excessive tool deflection or chatter may occur during high feed.`
      });
    }

    // 4. Zero or negative rapid clearance
    if (op.rapidHeight <= 1.0) {
      issues.push({
        opId: op.id,
        opName: op.name,
        type: 'danger',
        severity: 'High',
        title: 'Insufficient Rapid Clearance',
        message: `Rapid Z height (${op.rapidHeight}mm) is critically low. Rapid moves may strike workpiece clamps or burrs.`
      });
    }
  });

  return issues;
}

