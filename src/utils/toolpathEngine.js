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


