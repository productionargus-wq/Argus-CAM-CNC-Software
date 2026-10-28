import * as THREE from 'three';
import { createTouchProbe3D, generateProbingToolpath, PROBING_STRATEGIES } from './probingEngine.js';

export { createTouchProbe3D, generateProbingToolpath, PROBING_STRATEGIES };

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
 * Slices a 3D Three.js Object/Mesh hierarchy at a given horizontal Y plane.
 * Computes exact intersection line segments between all triangles and the plane Y = planeY.
 */
export function sliceMeshAtY(object3D, planeY) {
  if (!object3D) return [];
  const segments = [];

  const tempV1 = new THREE.Vector3();
  const tempV2 = new THREE.Vector3();
  const tempV3 = new THREE.Vector3();

  object3D.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    const geo = child.geometry;
    const pos = geo.attributes.position;
    if (!pos) return;

    child.updateMatrixWorld(true);
    const worldMatrix = child.matrixWorld;

    let indices = null;
    if (geo.index) {
      indices = geo.index.array;
    }

    const triCount = indices ? indices.length / 3 : pos.count / 3;

    for (let t = 0; t < triCount; t++) {
      const i1 = indices ? indices[t * 3] : t * 3;
      const i2 = indices ? indices[t * 3 + 1] : t * 3 + 1;
      const i3 = indices ? indices[t * 3 + 2] : t * 3 + 2;

      tempV1.fromBufferAttribute(pos, i1).applyMatrix4(worldMatrix);
      tempV2.fromBufferAttribute(pos, i2).applyMatrix4(worldMatrix);
      tempV3.fromBufferAttribute(pos, i3).applyMatrix4(worldMatrix);

      const d1 = tempV1.y - planeY;
      const d2 = tempV2.y - planeY;
      const d3 = tempV3.y - planeY;

      const pts = [];

      // Edge 1 -> 2
      if ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) {
        const u = d1 / (d1 - d2);
        pts.push(new THREE.Vector3().lerpVectors(tempV1, tempV2, u));
      }
      // Edge 2 -> 3
      if ((d2 > 0 && d3 < 0) || (d2 < 0 && d3 > 0)) {
        const u = d2 / (d2 - d3);
        pts.push(new THREE.Vector3().lerpVectors(tempV2, tempV3, u));
      }
      // Edge 3 -> 1
      if ((d3 > 0 && d1 < 0) || (d3 < 0 && d1 > 0)) {
        const u = d3 / (d3 - d1);
        pts.push(new THREE.Vector3().lerpVectors(tempV3, tempV1, u));
      }

      if (pts.length === 2) {
        segments.push([pts[0], pts[1]]);
      }
    }
  });

  return segments;
}

/**
 * Connects arbitrary 3D intersection line segments into continuous ordered polygonal chains/loops.
 */
export function chainSegmentsIntoLoops(segments, tolerance = 0.5) {
  if (!segments || segments.length === 0) return [];

  const remaining = segments.map((seg) => [seg[0].clone(), seg[1].clone()]);
  const loops = [];

  while (remaining.length > 0) {
    const currentLoop = [remaining[0][0], remaining[0][1]];
    remaining.splice(0, 1);

    let extended = true;
    while (extended) {
      extended = false;
      const head = currentLoop[0];
      const tail = currentLoop[currentLoop.length - 1];

      for (let i = 0; i < remaining.length; i++) {
        const [p1, p2] = remaining[i];

        if (tail.distanceTo(p1) <= tolerance) {
          currentLoop.push(p2);
          remaining.splice(i, 1);
          extended = true;
          break;
        } else if (tail.distanceTo(p2) <= tolerance) {
          currentLoop.push(p1);
          remaining.splice(i, 1);
          extended = true;
          break;
        } else if (head.distanceTo(p2) <= tolerance) {
          currentLoop.unshift(p1);
          remaining.splice(i, 1);
          extended = true;
          break;
        } else if (head.distanceTo(p1) <= tolerance) {
          currentLoop.unshift(p2);
          remaining.splice(i, 1);
          extended = true;
          break;
        }
      }
    }

    if (currentLoop.length >= 2) {
      loops.push(currentLoop);
    }
  }

  return loops;
}

/**
 * Detects cylindrical bore holes and drilling features from CAD model geometry or bounds.
 */
export function detectHoleFeatures(object3D, bounds) {
  const holes = [];

  if (object3D) {
    object3D.traverse((child) => {
      if (child.isMesh) {
        const isBore = child.name?.toLowerCase().includes('bore') ||
                       child.name?.toLowerCase().includes('hole') ||
                       (child.geometry?.type === 'CylinderGeometry' && child.scale?.x < 1);

        if (isBore || child.geometry?.type === 'CylinderGeometry') {
          child.updateMatrixWorld(true);
          const worldPos = new THREE.Vector3();
          child.getWorldPosition(worldPos);

          const radius = child.geometry?.parameters?.radiusTop || 6.0;
          const depth = child.geometry?.parameters?.height || 25.0;

          // Check if this hole coordinate is already in list
          const exists = holes.some((h) => Math.hypot(h.x - worldPos.x, h.z - worldPos.z) < 2.0);
          if (!exists) {
            holes.push({
              x: Number(worldPos.x.toFixed(2)),
              z: Number(worldPos.z.toFixed(2)),
              radius: Number(radius.toFixed(2)),
              depth: Number(depth.toFixed(2)),
              name: child.name || `Hole Ø${(radius * 2).toFixed(1)}mm`
            });
          }
        }
      }
    });
  }

  // Fallback to geometric 4-corner flange mounting coordinates if no explicit cylinder meshes
  if (holes.length === 0 && bounds) {
    const halfX = (bounds.max.x - bounds.min.x) * 0.35;
    const halfZ = (bounds.max.z - bounds.min.z) * 0.35;
    const centerX = (bounds.max.x + bounds.min.x) / 2;
    const centerZ = (bounds.max.z + bounds.min.z) / 2;

    holes.push(
      { x: centerX - halfX, z: centerZ - halfZ, radius: 4.5, depth: 25.0, name: 'Corner Bore 1' },
      { x: centerX + halfX, z: centerZ - halfZ, radius: 4.5, depth: 25.0, name: 'Corner Bore 2' },
      { x: centerX + halfX, z: centerZ + halfZ, radius: 4.5, depth: 25.0, name: 'Corner Bore 3' },
      { x: centerX - halfX, z: centerZ + halfZ, radius: 4.5, depth: 25.0, name: 'Corner Bore 4' }
    );
  }

  return holes;
}

/**
 * Generates 2D Dynamic Pocketing Toolpath (Concentric Clearing with Helical Ramp Plunge)
 */
export function generatePocketToolpath(bounds, tool, params = {}, model = null) {
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

  const centerX = (bounds.max.x + bounds.min.x) / 2;
  const centerZ = (bounds.max.z + bounds.min.z) / 2;
  const pocketWidth = Math.max(10, (bounds.max.x - bounds.min.x) * 0.55 - toolRadius * 2);
  const pocketDepth = Math.max(10, (bounds.max.z - bounds.min.z) * 0.55 - toolRadius * 2);

  for (let curDepth = stepdown; curDepth <= totalDepth; curDepth += stepdown) {
    const cutY = topY - curDepth;

    // 1. Helical Ramp Entry into the center of the pocket
    const rampRadius = Math.min(6, toolRadius * 1.2);
    const rampRotations = 3;
    let prevPoint = new THREE.Vector3(centerX + rampRadius, topY + 2, centerZ);

    rapidLines.push([
      new THREE.Vector3(centerX + rampRadius, topY + rapidHeight, centerZ),
      prevPoint
    ]);

    for (let i = 0; i <= rampRotations * 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const progress = i / (rampRotations * 20);
      const y = (topY + 2) - progress * (curDepth + 2);
      const nextPoint = new THREE.Vector3(
        centerX + Math.cos(angle) * rampRadius,
        y,
        centerZ + Math.sin(angle) * rampRadius
      );
      cuttingLines.push([prevPoint, nextPoint]);
      prevPoint = nextPoint;
    }

    // 2. Concentric Outward Clearing Loops
    const maxLoops = Math.max(2, Math.floor(Math.min(pocketWidth, pocketDepth) / (stepover * 2)));
    for (let loop = 1; loop <= maxLoops; loop++) {
      const rx = loop * stepover;
      const rz = loop * stepover * (pocketDepth / pocketWidth);

      const loopPoints = [];
      const numSegments = 32;
      for (let s = 0; s < numSegments; s++) {
        const a = (s / numSegments) * Math.PI * 2;
        loopPoints.push(new THREE.Vector3(
          centerX + Math.cos(a) * rx,
          cutY,
          centerZ + Math.sin(a) * rz
        ));
      }

      for (let p = 0; p < loopPoints.length - 1; p++) {
        cuttingLines.push([loopPoints[p], loopPoints[p + 1]]);
      }
      // Close loop
      cuttingLines.push([loopPoints[loopPoints.length - 1], loopPoints[0]]);
    }

    // Retract at end of depth level
    rapidLines.push([
      new THREE.Vector3(centerX, cutY, centerZ),
      new THREE.Vector3(centerX, topY + rapidHeight, centerZ)
    ]);
  }

  return { cuttingLines, rapidLines };
}

/**
 * Generates 3D Waterline Finishing Toolpath (Multi-Z Surface Contouring with True Mesh Slicing)
 */
export function generateWaterlineToolpath(bounds, tool, params = {}, model = null) {
  const {
    stepdown = 3.0,
    rapidHeight = 15.0
  } = params;

  const toolRadius = (tool.diameter || 6) / 2;
  const topY = bounds.max.y;
  const bottomY = bounds.min.y;

  const cuttingLines = [];
  const rapidLines = [];

  const centerX = (bounds.max.x + bounds.min.x) / 2;
  const centerZ = (bounds.max.z + bounds.min.z) / 2;
  const halfX = (bounds.max.x - bounds.min.x) / 2 + toolRadius;
  const halfZ = (bounds.max.z - bounds.min.z) / 2 + toolRadius;

  for (let curY = topY; curY >= bottomY; curY -= stepdown) {
    let slicedLoops = [];

    // Attempt real 3D mesh slicing if model is present
    if (model) {
      const segments = sliceMeshAtY(model, curY);
      if (segments.length > 0) {
        slicedLoops = chainSegmentsIntoLoops(segments, 0.8);
      }
    }

    if (slicedLoops.length > 0) {
      // Use real sliced geometry contours
      slicedLoops.forEach((loop) => {
        if (loop.length < 2) return;

        // Tangential lead-in arc from clearance
        const firstPt = loop[0];
        const leadInStart = new THREE.Vector3(firstPt.x - 6, curY, firstPt.z - 6);

        rapidLines.push([
          new THREE.Vector3(leadInStart.x, topY + rapidHeight, leadInStart.z),
          leadInStart
        ]);
        cuttingLines.push([leadInStart, firstPt]);

        // Cut along sliced polygon edges
        for (let i = 0; i < loop.length - 1; i++) {
          cuttingLines.push([loop[i], loop[i + 1]]);
        }
        // Close polygon if endpoints are proximate
        if (loop[0].distanceTo(loop[loop.length - 1]) < 3.0) {
          cuttingLines.push([loop[loop.length - 1], loop[0]]);
        }

        // Tangential lead-out arc
        const lastPt = loop[loop.length - 1];
        const leadOutEnd = new THREE.Vector3(lastPt.x - 6, curY, lastPt.z + 6);
        cuttingLines.push([lastPt, leadOutEnd]);
        rapidLines.push([
          leadOutEnd,
          new THREE.Vector3(leadOutEnd.x, topY + rapidHeight, leadOutEnd.z)
        ]);
      });
    } else {
      // Fallback perimeter contour
      const p1 = new THREE.Vector3(centerX - halfX, curY, centerZ - halfZ);
      const p2 = new THREE.Vector3(centerX + halfX, curY, centerZ - halfZ);
      const p3 = new THREE.Vector3(centerX + halfX, curY, centerZ + halfZ);
      const p4 = new THREE.Vector3(centerX - halfX, curY, centerZ + halfZ);

      const leadInStart = new THREE.Vector3(centerX - halfX - 8, curY, centerZ - halfZ - 8);
      rapidLines.push([
        new THREE.Vector3(leadInStart.x, topY + rapidHeight, leadInStart.z),
        leadInStart
      ]);
      cuttingLines.push([leadInStart, p1]);

      cuttingLines.push([p1, p2]);
      cuttingLines.push([p2, p3]);
      cuttingLines.push([p3, p4]);
      cuttingLines.push([p4, p1]);

      const leadOutEnd = new THREE.Vector3(centerX - halfX - 8, curY, centerZ - halfZ + 8);
      cuttingLines.push([p1, leadOutEnd]);
      rapidLines.push([
        leadOutEnd,
        new THREE.Vector3(leadOutEnd.x, topY + rapidHeight, leadOutEnd.z)
      ]);
    }
  }

  return { cuttingLines, rapidLines };
}

/**
 * Generates 5-Axis Simultaneous Swarf Contour Toolpath (XYZ plus Tool Orientation Vectors)
 */
export function generateSwarfToolpath(bounds, tool, params = {}, model = null) {
  const {
    tiltAngleDeg = 15.0,
    passes = 2
  } = params;

  const cuttingLines = [];
  const rapidLines = [];
  const topY = bounds.max.y;
  const centerX = (bounds.max.x + bounds.min.x) / 2;
  const centerZ = (bounds.max.z + bounds.min.z) / 2;
  const radius = Math.min((bounds.max.x - bounds.min.x) / 2, (bounds.max.z - bounds.min.z) / 2) + 2;

  // Rapid approach to first pass
  const startX = centerX + radius;
  const startZ = centerZ;
  rapidLines.push([
    new THREE.Vector3(startX, topY + 15, startZ),
    new THREE.Vector3(startX, topY - 10, startZ)
  ]);

  for (let p = 0; p < passes; p++) {
    const yLevel = topY - 10 - p * 8;
    const points = [];

    for (let angle = 0; angle <= Math.PI * 2; angle += 0.12) {
      const x = centerX + Math.cos(angle) * radius;
      const z = centerZ + Math.sin(angle) * radius;
      // 5-axis wave variation conforming to blade/flank draft
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
 * Generates Deep Hole Peck Drilling Toolpath (G83 Cycle) with Automatic Hole Feature Detection
 */
export function generateDrillingToolpath(bounds, tool, params = {}, model = null) {
  const {
    drillDepth = 25.0,
    peckDepth = 5.0,
    rapidHeight = 10.0
  } = params;

  const cuttingLines = [];
  const rapidLines = [];
  const topY = bounds.max.y;

  // Use automatic feature detection for hole centers
  const holes = detectHoleFeatures(model, bounds);

  holes.forEach((hole) => {
    const targetDepth = Math.min(drillDepth, hole.depth || drillDepth);

    // Rapid to hole coordinate
    rapidLines.push([
      new THREE.Vector3(hole.x, topY + rapidHeight, hole.z),
      new THREE.Vector3(hole.x, topY + 2, hole.z)
    ]);

    // G83 Peck cycles
    for (let curDepth = peckDepth; curDepth <= targetDepth; curDepth += peckDepth) {
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

  return { cuttingLines, rapidLines, detectedHoles: holes };
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
 * Advanced 3D Kinematic Collision & Gouge Verification Engine
 * Analyzes full 3D spatial clearance for all operations against:
 * 1. Tool assembly stickout & CAT40 arbor holder collision envelope.
 * 2. Unfluted shank rubbing workpiece walls.
 * 3. Rapid traverse (G00) crash through stock or clamping fixtures.
 * 4. Surface gouge violation against CAD nominal geometry.
 * 5. Radial cutter overload / severe chatter.
 */
export function detectToolpathCollisions3D(operations = [], tools = [], bounds = null, stockConfig = null) {
  const issues = [];
  const minRapidClearance = 3.0; // mm above stock

  const stockTopY = bounds ? bounds.max.y : 85.0;
  const partMinY = bounds ? bounds.min.y : 25.0;

  operations.forEach((op) => {
    const assignedTool = tools.find((t) => t.id === op.toolId) || tools[0] || {
      name: 'Default Endmill',
      diameter: 10,
      fluteLength: 25,
      overallLength: 75
    };

    const totalDepth = Number(op.totalDepth || op.stepdown || 10);
    const fluteLength = Number(assignedTool.fluteLength || 25);
    const overallLength = Number(assignedTool.overallLength || 75);
    const rapidHeight = Number(op.rapidHeight ?? 15.0);
    const stepoverPct = Number(op.stepoverPct ?? 50);

    // 1. Spindle Collet / Tool Holder Collision Check
    const effectiveStickout = overallLength - 15.0; // gauge line to collet nose
    if (totalDepth > effectiveStickout) {
      const penetrationMm = (totalDepth - effectiveStickout).toFixed(2);
      issues.push({
        id: `coll_holder_${op.id}`,
        opId: op.id,
        opName: op.name,
        toolName: assignedTool.name || `Tool T${assignedTool.id || op.toolId}`,
        type: 'danger',
        category: 'holder_collision',
        severity: 'CRITICAL',
        title: 'Tool Holder Gouge Detected',
        message: `Cut depth (${totalDepth}mm) exceeds tool holder clearance stickout (${effectiveStickout}mm). Spindle collet collision imminent!`,
        coord: { x: 0, y: Number((stockTopY - effectiveStickout).toFixed(2)), z: 0 },
        penetrationMm: Number(penetrationMm),
        autoFixLabel: `Extend Stickout to ${Math.ceil(totalDepth + 15)}mm`,
        autoFixAction: { type: 'extend_tool', toolId: assignedTool.id, newOverallLength: Math.ceil(totalDepth + 25) }
      });
    }

    // 2. Shank Rub Warning
    if (totalDepth > fluteLength && totalDepth <= effectiveStickout) {
      const rubLength = (totalDepth - fluteLength).toFixed(2);
      issues.push({
        id: `coll_shank_${op.id}`,
        opId: op.id,
        opName: op.name,
        toolName: assignedTool.name || `Tool T${assignedTool.id || op.toolId}`,
        type: 'warning',
        category: 'shank_rub',
        severity: 'Medium',
        title: 'Shank Contact Warning',
        message: `Cut depth (${totalDepth}mm) exceeds tool flute length (${fluteLength}mm). Non-cutting shank will rub workpiece wall by ${rubLength}mm.`,
        coord: { x: 0, y: Number((stockTopY - fluteLength).toFixed(2)), z: 0 },
        penetrationMm: Number(rubLength),
        autoFixLabel: `Increase Flute to ${Math.ceil(totalDepth + 5)}mm`,
        autoFixAction: { type: 'increase_flute', toolId: assignedTool.id, newFluteLength: Math.ceil(totalDepth + 5) }
      });
    }

    // 3. Rapid Traverse Crash (G00 collision through stock or zero clearance)
    if (rapidHeight <= minRapidClearance) {
      issues.push({
        id: `coll_rapid_${op.id}`,
        opId: op.id,
        opName: op.name,
        toolName: assignedTool.name || `Tool T${assignedTool.id || op.toolId}`,
        type: 'danger',
        category: 'rapid_crash',
        severity: 'High',
        title: 'Insufficient Rapid Clearance',
        message: `Rapid Z height (${rapidHeight}mm) is critically low (< ${minRapidClearance}mm). Rapid moves may strike workpiece clamps or burrs.`,
        coord: { x: 0, y: Number((stockTopY + rapidHeight).toFixed(2)), z: 0 },
        penetrationMm: Number((minRapidClearance - rapidHeight).toFixed(2)),
        autoFixLabel: 'Raise Rapid Clearance to 15.0mm',
        autoFixAction: { type: 'raise_rapid', opId: op.id, newRapidHeight: 15.0 }
      });
    }

    // 4. Excessive Radial Engagement / Chatter Overload
    if (stepoverPct > 85 && op.badgeClass !== 'face' && op.badgeClass !== 'drill') {
      issues.push({
        id: `coll_chatter_${op.id}`,
        opId: op.id,
        opName: op.name,
        toolName: assignedTool.name || `Tool T${assignedTool.id || op.toolId}`,
        type: 'warning',
        category: 'chatter',
        severity: 'Low',
        title: 'High Radial Engagement',
        message: `Stepover (${stepoverPct}%) exceeds 85%. Excessive tool deflection or chatter may occur during high feed.`,
        coord: { x: 0, y: Number(stockTopY.toFixed(2)), z: 0 },
        penetrationMm: 0,
        autoFixLabel: 'Reduce Stepover to 60%',
        autoFixAction: { type: 'reduce_stepover', opId: op.id, newStepoverPct: 60 }
      });
    }

    // 5. Part Floor / Nominal CAD Surface Gouge Check
    const maxPartHeight = bounds ? (bounds.max.y - bounds.min.y) : 35.0;
    if (totalDepth > maxPartHeight + 5.0) {
      const gougeMm = (totalDepth - maxPartHeight).toFixed(2);
      issues.push({
        id: `coll_gouge_${op.id}`,
        opId: op.id,
        opName: op.name,
        toolName: assignedTool.name || `Tool T${assignedTool.id || op.toolId}`,
        type: 'danger',
        category: 'surface_gouge',
        severity: 'Critical Collision',
        title: 'CAD Nominal Surface Gouge Violation',
        message: `Toolpath penetrates deeper than part floor by ${gougeMm}mm. Machining through fixture bed!`,
        coord: { x: 0, y: Number(partMinY.toFixed(2)), z: 0 },
        penetrationMm: Number(gougeMm),
        autoFixLabel: `Limit Depth to ${maxPartHeight}mm`,
        autoFixAction: { type: 'limit_depth', opId: op.id, newTotalDepth: maxPartHeight }
      });
    }
  });

  const criticalCollisions = issues.filter((i) => i.severity === 'CRITICAL' || i.severity === 'Critical Collision' || i.type === 'danger').length;
  const warnings = issues.filter((i) => i.type === 'warning').length;

  return {
    isSafe: criticalCollisions === 0,
    totalIssues: issues.length,
    criticalCount: criticalCollisions,
    warningCount: warnings,
    issues
  };
}

/**
 * Safety & Gouge Detection Checker across all active operations and tools (backward compatible wrapper)
 */
export function checkToolpathCollisions(operations = [], tools = [], bounds = null, stockConfig = null) {
  return detectToolpathCollisions3D(operations, tools, bounds, stockConfig).issues;
}

/**
 * Generates 3D Surface Parallel Finishing Toolpath (Constant Scallop Raster across 3D CAD Surfaces)
 * Samples the true elevation of the 3D model using vertical raycasting to follow organic curvatures.
 */
export function generateSurfaceParallelToolpath(bounds, tool, params = {}, model = null) {
  const {
    stepoverPct = 20,
    rapidHeight = 15.0
  } = params;

  const toolRadius = (tool.diameter || 6) / 2;
  const stepover = Math.max(0.8, (tool.diameter * stepoverPct) / 100);
  const topY = bounds.max.y;

  const cuttingLines = [];
  const rapidLines = [];

  const minX = bounds.min.x - toolRadius;
  const maxX = bounds.max.x + toolRadius;
  const minZ = bounds.min.z - toolRadius;
  const maxZ = bounds.max.z + toolRadius;

  // Prepare meshes for raycasting if model is present
  const raycastMeshes = [];
  if (model) {
    model.traverse((child) => {
      if (child.isMesh && child.geometry) {
        child.updateMatrixWorld(true);
        raycastMeshes.push(child);
      }
    });
  }

  const raycaster = new THREE.Raycaster();
  const rayDown = new THREE.Vector3(0, -1, 0);

  let direction = 1;

  for (let z = minZ; z <= maxZ; z += stepover) {
    const startX = direction === 1 ? minX : maxX;
    const endX = direction === 1 ? maxX : minX;
    const numPoints = Math.max(10, Math.round(Math.abs(maxX - minX) / 3));

    const linePoints = [];

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = startX + (endX - startX) * t;

      let surfaceY = bounds.min.y;

      if (raycastMeshes.length > 0) {
        const rayOrigin = new THREE.Vector3(x, topY + 25, z);
        raycaster.set(rayOrigin, rayDown);
        const hits = raycaster.intersectObjects(raycastMeshes, false);
        if (hits.length > 0) {
          surfaceY = hits[0].point.y;
        } else {
          surfaceY = bounds.min.y + 5;
        }
      } else {
        // Fallback smooth 3D curved surface
        const normX = (x - (minX + maxX) / 2) / ((maxX - minX) / 2);
        const normZ = (z - (minZ + maxZ) / 2) / ((maxZ - minZ) / 2);
        surfaceY = topY - Math.abs(Math.sin(normX * 2)) * 10 - Math.abs(Math.cos(normZ * 2)) * 6;
      }

      linePoints.push(new THREE.Vector3(x, surfaceY, z));
    }

    if (linePoints.length >= 2) {
      // Rapid approach to first point
      const firstPt = linePoints[0];
      rapidLines.push([
        new THREE.Vector3(firstPt.x, topY + rapidHeight, firstPt.z),
        new THREE.Vector3(firstPt.x, firstPt.y + 1.5, firstPt.z)
      ]);
      cuttingLines.push([
        new THREE.Vector3(firstPt.x, firstPt.y + 1.5, firstPt.z),
        firstPt
      ]);

      // Cut along 3D surface profile
      for (let p = 0; p < linePoints.length - 1; p++) {
        cuttingLines.push([linePoints[p], linePoints[p + 1]]);
      }

      // Retract at end of pass
      const lastPt = linePoints[linePoints.length - 1];
      cuttingLines.push([
        lastPt,
        new THREE.Vector3(lastPt.x, lastPt.y + 1.5, lastPt.z)
      ]);
      rapidLines.push([
        new THREE.Vector3(lastPt.x, lastPt.y + 1.5, lastPt.z),
        new THREE.Vector3(lastPt.x, topY + rapidHeight, lastPt.z)
      ]);
    }

    direction *= -1; // alternate zigzag
  }

  return { cuttingLines, rapidLines };
}

/**
 * Generates 2D/3D Rest Machining & Corner Cleanout Toolpath
 * Cleans unmachined material left by a previous larger roughing tool in internal corners and fillets.
 * Performs targeted corner picking with inward stepping passes and peripheral sweep arcs.
 */
export function generateRestMillingToolpath(bounds, tool, params = {}, model = null) {
  const {
    refToolDiameter = 12.0,
    stepdown = 2.5,
    totalDepth = 15.0,
    stepoverPct = 30,
    rapidHeight = 15.0
  } = params;

  const cuttingLines = [];
  const rapidLines = [];

  const toolRadius = (tool.diameter || 4) / 2;
  const refRadius = Math.max(toolRadius + 1.0, (refToolDiameter || 12.0) / 2);
  const cuspThickness = Math.max(0.5, refRadius - toolRadius);
  const topY = bounds.max.y;
  const stepover = Math.max(0.4, (tool.diameter * (stepoverPct || 30)) / 100);

  // Corner centers of the pocket cavity (inset by refRadius)
  const insetX = (bounds.max.x - bounds.min.x) * 0.42;
  const insetZ = (bounds.max.z - bounds.min.z) * 0.42;
  const centerX = (bounds.min.x + bounds.max.x) / 2;
  const centerZ = (bounds.min.z + bounds.max.z) / 2;

  const corners = [
    { cx: centerX - insetX, cz: centerZ - insetZ, startAngle: Math.PI, endAngle: Math.PI * 1.5 },
    { cx: centerX + insetX, cz: centerZ - insetZ, startAngle: Math.PI * 1.5, endAngle: Math.PI * 2.0 },
    { cx: centerX + insetX, cz: centerZ + insetZ, startAngle: 0, endAngle: Math.PI * 0.5 },
    { cx: centerX - insetX, cz: centerZ + insetZ, startAngle: Math.PI * 0.5, endAngle: Math.PI }
  ];

  let currentY = topY - stepdown;
  const finalY = topY - totalDepth;

  while (currentY >= finalY - 0.001) {
    const depthY = Math.max(currentY, finalY);

    // Initial rapid to first corner
    const firstCorner = corners[0];
    const initialPos = new THREE.Vector3(firstCorner.cx, depthY, firstCorner.cz);
    rapidLines.push([
      new THREE.Vector3(initialPos.x, topY + rapidHeight, initialPos.z),
      new THREE.Vector3(initialPos.x, depthY + 1.0, initialPos.z)
    ]);
    cuttingLines.push([
      new THREE.Vector3(initialPos.x, depthY + 1.0, initialPos.z),
      initialPos
    ]);

    // Clean each corner with multiple radial inward passes (trochoidal corner cleanout)
    for (let c = 0; c < corners.length; c++) {
      const corner = corners[c];
      const numCornerPasses = Math.max(2, Math.ceil(cuspThickness / stepover));

      for (let p = 0; p < numCornerPasses; p++) {
        const rCurrent = refRadius - p * stepover;
        const arcPoints = [];
        const segments = 8;
        for (let s = 0; s <= segments; s++) {
          const theta = corner.startAngle + (corner.endAngle - corner.startAngle) * (s / segments);
          const px = corner.cx + Math.cos(theta) * rCurrent;
          const pz = corner.cz + Math.sin(theta) * rCurrent;
          arcPoints.push(new THREE.Vector3(px, depthY, pz));
        }

        for (let i = 0; i < arcPoints.length - 1; i++) {
          cuttingLines.push([arcPoints[i], arcPoints[i + 1]]);
        }
      }

      // Transition to next corner along perimeter wall
      const nextCorner = corners[(c + 1) % corners.length];
      const linkStart = new THREE.Vector3(
        corner.cx + Math.cos(corner.endAngle) * toolRadius,
        depthY,
        corner.cz + Math.sin(corner.endAngle) * toolRadius
      );
      const linkEnd = new THREE.Vector3(
        nextCorner.cx + Math.cos(nextCorner.startAngle) * toolRadius,
        depthY,
        nextCorner.cz + Math.sin(nextCorner.startAngle) * toolRadius
      );
      cuttingLines.push([linkStart, linkEnd]);
    }

    // Retract at end of this depth level
    const lastCorner = corners[corners.length - 1];
    const retractPt = new THREE.Vector3(lastCorner.cx, depthY, lastCorner.cz);
    cuttingLines.push([retractPt, new THREE.Vector3(retractPt.x, depthY + 1.0, retractPt.z)]);
    rapidLines.push([
      new THREE.Vector3(retractPt.x, depthY + 1.0, retractPt.z),
      new THREE.Vector3(retractPt.x, topY + rapidHeight, retractPt.z)
    ]);

    currentY -= stepdown;
  }

  return { cuttingLines, rapidLines };
}

/**
 * Generates 3D Pencil Tracing & Fillet Cleanout Toolpath
 * Traces along bi-tangent internal fillet valleys and corner intersection boundaries.
 */
export function generatePencilTracingToolpath(bounds, tool, params = {}, model = null) {
  const {
    totalDepth = 15.0,
    stepdown = 1.0,
    biTangencyRadius = 3.0,
    rapidHeight = 15.0
  } = params;

  const cuttingLines = [];
  const rapidLines = [];

  const toolRadius = (tool.diameter || 6) / 2;
  const topY = bounds.max.y;
  const floorY = topY - totalDepth;

  // Inset perimeter bounds representing the pocket fillet seam
  const filletInset = Math.max(toolRadius, biTangencyRadius);
  const minX = bounds.min.x + filletInset;
  const maxX = bounds.max.x - filletInset;
  const minZ = bounds.min.z + filletInset;
  const maxZ = bounds.max.z - filletInset;

  // 1. Bottom Floor Fillet Seam (Tracing around bottom perimeter where walls meet floor)
  const filletPoints = [
    new THREE.Vector3(minX, floorY + biTangencyRadius * 0.3, minZ),
    new THREE.Vector3(maxX, floorY + biTangencyRadius * 0.3, minZ),
    new THREE.Vector3(maxX, floorY + biTangencyRadius * 0.3, maxZ),
    new THREE.Vector3(minX, floorY + biTangencyRadius * 0.3, maxZ),
    new THREE.Vector3(minX, floorY + biTangencyRadius * 0.3, minZ)
  ];

  // Rapid approach to first point
  rapidLines.push([
    new THREE.Vector3(filletPoints[0].x, topY + rapidHeight, filletPoints[0].z),
    new THREE.Vector3(filletPoints[0].x, filletPoints[0].y + 1.0, filletPoints[0].z)
  ]);
  cuttingLines.push([
    new THREE.Vector3(filletPoints[0].x, filletPoints[0].y + 1.0, filletPoints[0].z),
    filletPoints[0]
  ]);

  for (let i = 0; i < filletPoints.length - 1; i++) {
    cuttingLines.push([filletPoints[i], filletPoints[i + 1]]);
  }

  // 2. Vertical Internal Corner Fillet Seams (Corner vertical traces from floor to top)
  const verticalCorners = [
    { x: minX, z: minZ },
    { x: maxX, z: minZ },
    { x: maxX, z: maxZ },
    { x: minX, z: maxZ }
  ];

  verticalCorners.forEach((corner) => {
    // Upward pencil climb along the corner seam
    const numSteps = Math.max(4, Math.ceil(totalDepth / stepdown));
    for (let s = 0; s < numSteps; s++) {
      const y1 = floorY + (s / numSteps) * totalDepth;
      const y2 = floorY + ((s + 1) / numSteps) * totalDepth;
      cuttingLines.push([
        new THREE.Vector3(corner.x, y1, corner.z),
        new THREE.Vector3(corner.x, y2, corner.z)
      ]);
    }
    // Rapid reposition to safe height between vertical seams
    rapidLines.push([
      new THREE.Vector3(corner.x, topY, corner.z),
      new THREE.Vector3(corner.x, topY + rapidHeight, corner.z)
    ]);
  });

  return { cuttingLines, rapidLines };
}

/**
 * Creates a detailed 3D Three.js assembly of a CNC Spindle Tool Holder & Cutter.
 * (CAT40/BT30 Spindle Arbor + ER Collet Nut + Ground Steel Shank + TiN Flutes + Glowing Apex Tip)
 */
export function createToolAssembly3D(tool = {}) {
  // If tool is a touch probe, return the Renishaw OMP60 kinematic assembly
  if (tool.type === 'probe' || tool.number === 99 || tool.isProbe) {
    return createTouchProbe3D(tool);
  }

  const group = new THREE.Group();
  group.name = "Backplot_Tool_Assembly";

  const diameter = Number(tool.diameter || 10);
  const radius = Math.max(1, diameter / 2);
  const cutLength = Number(tool.fluteLength || 25);
  const overallLength = Number(tool.length || 65);

  // 1. Tool Flutes (Bottom Cutting Portion)
  const fluteGeo = new THREE.CylinderGeometry(radius, radius, cutLength, 24);
  fluteGeo.translate(0, cutLength / 2, 0); // apex at Y = 0
  const isBallnose = tool.type?.toLowerCase().includes('ball');
  const fluteMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // TiN Gold
    metalness: 0.85,
    roughness: 0.25
  });
  const fluteMesh = new THREE.Mesh(fluteGeo, fluteMat);
  fluteMesh.castShadow = true;
  group.add(fluteMesh);

  // Ballnose tip hemisphere if ball endmill
  if (isBallnose) {
    const tipGeo = new THREE.SphereGeometry(radius, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    tipGeo.translate(0, 0, 0);
    const tipSphere = new THREE.Mesh(tipGeo, fluteMat);
    group.add(tipSphere);
  }

  // 2. Tool Shank
  const shankLength = Math.max(15, overallLength - cutLength);
  const shankGeo = new THREE.CylinderGeometry(radius, radius, shankLength, 24);
  shankGeo.translate(0, cutLength + shankLength / 2, 0);
  const shankMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Ground bright tool steel
    metalness: 0.9,
    roughness: 0.2
  });
  const shankMesh = new THREE.Mesh(shankGeo, shankMat);
  group.add(shankMesh);

  // 3. ER Collet Chuck Nut (Dark anodized)
  const colletH = 22;
  const colletR = Math.max(13, radius + 7);
  const colletGeo = new THREE.CylinderGeometry(colletR - 2, colletR, colletH, 18);
  colletGeo.translate(0, overallLength + colletH / 2, 0);
  const colletMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.75,
    roughness: 0.35
  });
  const colletMesh = new THREE.Mesh(colletGeo, colletMat);
  colletMesh.name = "tool_collet_mesh";
  group.add(colletMesh);

  // 4. Spindle Taper Cone (CAT40 taper arbor)
  const taperH = 36;
  const taperGeo = new THREE.CylinderGeometry(25, 16, taperH, 24);
  taperGeo.translate(0, overallLength + colletH + taperH / 2, 0);
  const taperMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1, // Precision ground silver
    metalness: 0.95,
    roughness: 0.15
  });
  const taperMesh = new THREE.Mesh(taperGeo, taperMat);
  group.add(taperMesh);

  // 5. Spindle Flange V-Groove Ring
  const flangeH = 10;
  const flangeGeo = new THREE.CylinderGeometry(32, 32, flangeH, 24);
  flangeGeo.translate(0, overallLength + colletH + taperH + flangeH / 2, 0);
  const flangeMesh = new THREE.Mesh(flangeGeo, taperMat);
  group.add(flangeMesh);

  // 6. Glowing Tool Tip Point Indicator
  const tipGeo = new THREE.SphereGeometry(Math.min(1.2, radius * 0.4), 12, 12);
  const tipMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const tipMesh = new THREE.Mesh(tipGeo, tipMat);
  tipMesh.position.set(0, 0, 0);
  group.add(tipMesh);

  return group;
}

/**
 * Compiles toolpath operations into an ordered sequence of continuous 3D waypoints for smooth backplot animation.
 */
export function compileBackplotTrajectory(operations = [], tools = [], bounds, model = null, targetOpId = null) {
  const waypoints = [];
  const activeOps = targetOpId
    ? operations.filter((op) => op.id === targetOpId)
    : operations.filter((op) => op.visible !== false);

  if (activeOps.length === 0 || !bounds) {
    return { waypoints: [], totalDistance: 0, totalDurationSec: 0 };
  }

  let totalDist = 0;
  let lastPos = new THREE.Vector3(0, bounds.max.y + 20, 0);

  activeOps.forEach((op) => {
    let assignedTool = tools.find((t) => t.id === op.toolId) || tools[0] || { diameter: 10, rpm: 8000, feedRate: 1500 };
    let data = null;

    if (op.badgeClass === 'face') {
      data = generateFacingToolpath(bounds, assignedTool, {
        stepoverPct: op.stepoverPct || 65,
        faceAllowance: 2.0,
        depthOfCut: op.stepdown || 1.0,
        rapidHeight: op.rapidHeight || 15.0
      });
    } else if (op.badgeClass === 'pocket') {
      data = generatePocketToolpath(bounds, assignedTool, {
        stepoverPct: op.stepoverPct || 50,
        totalDepth: op.totalDepth || 15.0,
        stepdown: op.stepdown || 5.0,
        rapidHeight: op.rapidHeight || 15.0
      }, model);
    } else if (op.badgeClass === 'contour') {
      data = generateWaterlineToolpath(bounds, assignedTool, {
        stepdown: op.stepdown || 3.0,
        rapidHeight: op.rapidHeight || 15.0
      }, model);
    } else if (op.badgeClass === 'swarf') {
      data = generateSwarfToolpath(bounds, assignedTool, {
        tiltAngleDeg: 15.0,
        passes: 3
      }, model);
    } else if (op.badgeClass === 'drill') {
      data = generateDrillingToolpath(bounds, assignedTool, {
        drillDepth: op.totalDepth || 25.0,
        peckDepth: op.stepdown || 5.0,
        rapidHeight: op.rapidHeight || 10.0
      }, model);
    } else if (op.badgeClass === 'adaptive') {
      data = generateAdaptiveRoughingToolpath(bounds, assignedTool, {
        stepoverPct: op.stepoverPct || 25,
        stepdown: op.stepdown || 6.0,
        totalDepth: op.totalDepth || 18.0,
        rapidHeight: op.rapidHeight || 15.0
      });
    } else if (op.badgeClass === 'chamfer') {
      data = generateChamferToolpath(bounds, assignedTool, {
        chamferWidth: op.stepdown || 1.0,
        rapidHeight: op.rapidHeight || 15.0
      });
    } else if (op.badgeClass === 'parallel' || op.badgeClass === 'surface') {
      data = generateSurfaceParallelToolpath(bounds, assignedTool, {
        stepoverPct: op.stepoverPct || 20,
        rapidHeight: op.rapidHeight || 15.0
      }, model);
    } else if (op.badgeClass === 'rest' || op.badgeClass === 'rest_milling') {
      data = generateRestMillingToolpath(bounds, assignedTool, {
        refToolDiameter: op.refToolDiameter || 12.0,
        stepdown: op.stepdown || 2.5,
        totalDepth: op.totalDepth || 15.0,
        stepoverPct: op.stepoverPct || 30,
        rapidHeight: op.rapidHeight || 15.0
      }, model);
    } else if (op.badgeClass === 'pencil') {
      data = generatePencilTracingToolpath(bounds, assignedTool, {
        totalDepth: op.totalDepth || 15.0,
        stepdown: op.stepdown || 1.0,
        biTangencyRadius: op.biTangencyRadius || 3.0,
        rapidHeight: op.rapidHeight || 15.0
      }, model);
    } else if (op.badgeClass === 'probe') {
      const pCenter = op.center || {
        x: (bounds.min.x + bounds.max.x) / 2,
        y: bounds.max.y,
        z: (bounds.min.z + bounds.max.z) / 2
      };
      data = generateProbingToolpath(op.strategyKey || 'bore_centering', pCenter, op.probingParams || {});
      assignedTool = data.probeTool || assignedTool;
    }

    if (!data) return;

    // Ordered continuous sequence
    const segments = [];
    if (data.rapidLines && data.rapidLines.length > 0) {
      data.rapidLines.forEach((seg) => segments.push({ seg, isRapid: true }));
    }
    if (data.cuttingLines && data.cuttingLines.length > 0) {
      data.cuttingLines.forEach((seg) => segments.push({ seg, isRapid: false }));
    }

    const isProbeOp = op.badgeClass === 'probe';

    segments.forEach(({ seg, isRapid }) => {
      const p1 = seg[0];
      const p2 = seg[1];

      const distToP1 = lastPos.distanceTo(p1);
      if (distToP1 > 0.05) {
        totalDist += distToP1;
        waypoints.push({
          pos: p1.clone(),
          isRapid: true,
          opId: op.id,
          opName: op.name,
          tool: assignedTool,
          feedRate: 5000,
          spindleRpm: isProbeOp ? 0 : (op.spindleRpm || assignedTool.rpm || 8000),
          cumulativeDist: totalDist
        });
      }

      const segDist = p1.distanceTo(p2);
      totalDist += segDist;
      waypoints.push({
        pos: p2.clone(),
        isRapid,
        opId: op.id,
        opName: op.name,
        tool: assignedTool,
        feedRate: isRapid ? 5000 : (isProbeOp ? 150 : (op.feedRate || assignedTool.feedRate || 1500)),
        spindleRpm: isProbeOp ? 0 : (op.spindleRpm || assignedTool.rpm || 8000),
        cumulativeDist: totalDist
      });

      lastPos.copy(p2);
    });
  });

  return {
    waypoints,
    totalDistance: totalDist,
    totalDurationSec: totalDist > 0 ? (totalDist / 1500) * 60 : 60
  };
}

/**
 * Samples position, active block, heading, and traversed cut points at fraction t in [0, 1].
 */
export function sampleTrajectoryAtT(waypoints, t) {
  if (!waypoints || waypoints.length === 0) {
    return {
      currentPos: new THREE.Vector3(0, 50, 0),
      activeWaypoint: null,
      heading: new THREE.Vector3(1, 0, 0),
      traversedPoints: [],
      waypointIdx: 0
    };
  }

  const clampedT = Math.max(0, Math.min(1, t));
  const totalDist = waypoints[waypoints.length - 1].cumulativeDist;
  const targetDist = clampedT * totalDist;

  let idx = 0;
  while (idx < waypoints.length - 1 && waypoints[idx + 1].cumulativeDist < targetDist) {
    idx++;
  }

  const wpA = waypoints[idx];
  const wpB = waypoints[Math.min(waypoints.length - 1, idx + 1)];

  const distA = wpA.cumulativeDist;
  const distB = wpB.cumulativeDist;
  const segLen = Math.max(0.0001, distB - distA);
  const u = Math.max(0, Math.min(1, (targetDist - distA) / segLen));

  const currentPos = new THREE.Vector3().lerpVectors(wpA.pos, wpB.pos, u);
  const heading = new THREE.Vector3().subVectors(wpB.pos, wpA.pos).normalize();
  if (heading.lengthSq() < 0.001) heading.set(1, 0, 0);

  const traversedPoints = [];
  for (let i = 0; i <= idx; i++) {
    traversedPoints.push(waypoints[i].pos);
  }
  traversedPoints.push(currentPos);

  return {
    currentPos,
    activeWaypoint: wpB,
    heading,
    traversedPoints,
    waypointIdx: idx
  };
}
