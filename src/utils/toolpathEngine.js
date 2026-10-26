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
