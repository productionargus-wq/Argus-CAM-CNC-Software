import * as THREE from 'three';

/**
 * Creates an infinite math plane for raycasting cursor positions.
 * @param {string} planeType - 'G17' (Top/XY), 'G18' (Front/XZ), or 'G19' (Right/YZ)
 * @param {number} elevation - Plane offset (e.g. top of part Y)
 */
export function createSketchPlane(planeType = 'G17', elevation = 0) {
  const normal = new THREE.Vector3(0, 1, 0); // Default G17 normal along Y
  if (planeType === 'G18') normal.set(0, 0, 1); // Front view normal along Z
  if (planeType === 'G19') normal.set(1, 0, 0); // Right view normal along X

  const plane = new THREE.Plane();
  plane.setFromNormalAndCoplanarPoint(normal, new THREE.Vector3(0, elevation, 0));
  return plane;
}

/**
 * Snaps a 3D coordinate vector to the active grid step and optional orthogonal lock.
 */
export function snapToGrid(point, gridStep = 5.0, isOrtho = false, anchorPoint = null) {
  if (!point) return new THREE.Vector3(0, 0, 0);

  let sx = Math.round(point.x / gridStep) * gridStep;
  let sy = Math.round(point.y / gridStep) * gridStep;
  let sz = Math.round(point.z / gridStep) * gridStep;

  // Preserve plane elevation if drawing on flat plane
  if (anchorPoint && isOrtho) {
    const dx = Math.abs(sx - anchorPoint.x);
    const dz = Math.abs(sz - anchorPoint.z);
    if (dx > dz) {
      sz = anchorPoint.z; // lock to horizontal line
    } else {
      sx = anchorPoint.x; // lock to vertical line
    }
  }

  return new THREE.Vector3(
    Number(sx.toFixed(3)),
    Number(sy.toFixed(3)),
    Number(sz.toFixed(3))
  );
}

/**
 * Detects whether the cursor is near any existing vertex, midpoint, or circle center.
 * Returns { snapped: boolean, point: Vector3, type: 'endpoint' | 'midpoint' | 'center' }
 */
export function snapToEntityPoints(cursorPoint, existingEntities = [], snapTolerance = 6.0, options = {}) {
  if (!cursorPoint || !existingEntities || existingEntities.length === 0) {
    return { snapped: false, point: cursorPoint, type: null };
  }

  let closestDist = snapTolerance;
  let snappedPoint = null;
  let snapType = null;
  const anchor = options.anchorPoint ? new THREE.Vector3(options.anchorPoint.x, options.anchorPoint.y ?? cursorPoint.y, options.anchorPoint.z) : null;

  existingEntities.forEach((entity) => {
    if (!entity || !entity.userData) return;
    const { cadType, points, center, p1, p2, radius: rawRadius } = entity.userData;

    // 1. Check Line endpoints and midpoint
    if (cadType === 'line' && p1 && p2) {
      const v1 = new THREE.Vector3(p1.x, p1.y, p1.z);
      const v2 = new THREE.Vector3(p2.x, p2.y, p2.z);
      const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);

      const d1 = cursorPoint.distanceTo(v1);
      const d2 = cursorPoint.distanceTo(v2);
      const dMid = cursorPoint.distanceTo(mid);

      if (d1 < closestDist) {
        closestDist = d1;
        snappedPoint = v1.clone();
        snapType = 'endpoint';
      }
      if (d2 < closestDist) {
        closestDist = d2;
        snappedPoint = v2.clone();
        snapType = 'endpoint';
      }
      if (dMid < closestDist) {
        closestDist = dMid;
        snappedPoint = mid.clone();
        snapType = 'midpoint';
      }
    }

    // 2. Check Circle/Arc center, cardinal quadrants, and tangent touch points
    if ((cadType === 'circle' || cadType === 'arc') && center) {
      const cx = center.x || 0;
      const cy = center.y ?? cursorPoint.y;
      const cz = center.z ?? center.y ?? 0;
      const c = new THREE.Vector3(cx, cy, cz);
      const r = Number(rawRadius || (entity.geometry?.parameters?.radius) || 25);

      // 2a. True Mathematical Tangent snap from Anchor Point to Circle (TOP PRIORITY when drawing lines)
      if (anchor) {
        const dx = anchor.x - cx;
        const dz = anchor.z - cz;
        const distToAnchor = Math.hypot(dx, dz);
        if (distToAnchor > r + 0.1) {
          const theta = Math.atan2(dz, dx);
          const cosBeta = Math.max(-1.0, Math.min(1.0, r / distToAnchor));
          const beta = Math.acos(cosBeta);

          // Two exact analytical tangent touch points on the circle perimeter
          const t1 = new THREE.Vector3(cx + r * Math.cos(theta + beta), cy, cz + r * Math.sin(theta + beta));
          const t2 = new THREE.Vector3(cx + r * Math.cos(theta - beta), cy, cz + r * Math.sin(theta - beta));

          // Tangent snap has highest magnetic pull when connecting to circles
          const tanSnapRadius = options.isLineTangent
            ? Math.max(45.0, snapTolerance * 3.5)
            : Math.max(25.0, snapTolerance * 2.2);
          const dt1 = cursorPoint.distanceTo(t1);
          const dt2 = cursorPoint.distanceTo(t2);

          if (dt1 < tanSnapRadius && (dt1 < closestDist || snapType === 'nearest' || snapType === 'endpoint')) {
            closestDist = dt1;
            snappedPoint = t1.clone();
            snapType = 'tangent';
          }
          if (dt2 < tanSnapRadius && (dt2 < closestDist || snapType === 'nearest' || snapType === 'endpoint')) {
            closestDist = dt2;
            snappedPoint = t2.clone();
            snapType = 'tangent';
          }
        }
      }

      // 2b. Cardinal Quadrants (North, South, East, West in G17 XZ plane)
      if (snapType !== 'tangent') {
        const quadrants = [
          new THREE.Vector3(cx, cy, cz - r), // North (-Z / +Y 2D)
          new THREE.Vector3(cx, cy, cz + r), // South (+Z / -Y 2D)
          new THREE.Vector3(cx + r, cy, cz), // East (+X)
          new THREE.Vector3(cx - r, cy, cz)  // West (-X)
        ];

        quadrants.forEach((q) => {
          const dQ = cursorPoint.distanceTo(q);
          if (dQ < closestDist && snapType !== 'tangent') {
            closestDist = dQ;
            snappedPoint = q.clone();
            snapType = 'quadrant';
          }
        });
      }

      // 2c. Center snap
      const dCenter = cursorPoint.distanceTo(c);
      if (dCenter < closestDist && snapType !== 'tangent') {
        closestDist = dCenter;
        snappedPoint = c.clone();
        snapType = 'center';
      }

      // 2d. Exact Circumference Projection (fallback only if no specific snap found)
      if (!snapType || snapType === 'nearest') {
        const curDistCenter = Math.hypot(cursorPoint.x - cx, cursorPoint.z - cz);
        const radDelta = Math.abs(curDistCenter - r);
        if (radDelta < closestDist && curDistCenter > 0.001) {
          const factor = r / curDistCenter;
          const onCirc = new THREE.Vector3(
            cx + (cursorPoint.x - cx) * factor,
            cy,
            cz + (cursorPoint.z - cz) * factor
          );
          closestDist = radDelta;
          snappedPoint = onCirc;
          snapType = 'nearest';
        }
      }
    }

    // 3. Check general point arrays (rectangles, polygons ONLY - NOT circles/arcs!)
    if (cadType !== 'circle' && cadType !== 'arc' && Array.isArray(points)) {
      points.forEach((p) => {
        const v = new THREE.Vector3(p.x, p.y, p.z);
        const d = cursorPoint.distanceTo(v);
        if (d < closestDist && snapType !== 'tangent') {
          closestDist = d;
          snappedPoint = v.clone();
          snapType = 'endpoint';
        }
      });
    }
  });

  if (snappedPoint) {
    return { snapped: true, point: snappedPoint, type: snapType };
  }

  return { snapped: false, point: cursorPoint, type: null };
}

/**
 * Mathematically computes all 4 bitangent lines (2 outer, 2 inner) connecting two circles.
 * @param {THREE.Object3D|Object} circleA First circle entity
 * @param {THREE.Object3D|Object} circleB Second circle entity
 * @returns {{ upperOuter: { p1: THREE.Vector3, p2: THREE.Vector3 }, lowerOuter: { p1: THREE.Vector3, p2: THREE.Vector3 }, cross1: object|null, cross2: object|null, topTangent: object, bottomTangent: object, candidates: Array } | null}
 */
export function computeBitangentLines(circleA, circleB) {
  if (!circleA || !circleB) return null;
  const cA = circleA.userData?.center || { x: 0, y: 0, z: 0 };
  const cB = circleB.userData?.center || { x: 0, y: 0, z: 0 };
  const rA = Number(circleA.userData?.radius || 25);
  const rB = Number(circleB.userData?.radius || 25);
  const y = (cA.y !== undefined && cA.y !== null) ? Number(cA.y) : (circleA.position?.y ?? 0);

  const ax = cA.x || 0;
  const az = cA.z ?? cA.y ?? 0;
  const bx = cB.x || 0;
  const bz = cB.z ?? cB.y ?? 0;

  const dx = bx - ax;
  const dz = bz - az;
  const d = Math.hypot(dx, dz);
  if (d <= Math.abs(rA - rB) + 0.1) return null; // One circle is completely inside the other

  const gamma = Math.atan2(dz, dx);
  const cosPhi = Math.max(-1.0, Math.min(1.0, (rA - rB) / d));
  const phi = Math.acos(cosPhi);

  // Outer bitangent candidate 1
  const a1 = gamma + phi;
  const p1_1 = new THREE.Vector3(ax + rA * Math.cos(a1), y, az + rA * Math.sin(a1));
  const p2_1 = new THREE.Vector3(bx + rB * Math.cos(a1), y, bz + rB * Math.sin(a1));

  // Outer bitangent candidate 2
  const a2 = gamma - phi;
  const p1_2 = new THREE.Vector3(ax + rA * Math.cos(a2), y, az + rA * Math.sin(a2));
  const p2_2 = new THREE.Vector3(bx + rB * Math.cos(a2), y, bz + rB * Math.sin(a2));

  // In Top view (G17 / XZ plane), more negative Z = higher Y_2D (top crest)
  const upperOuter = p1_1.z <= p1_2.z
    ? { p1: p1_1, p2: p2_1 }
    : { p1: p1_2, p2: p2_2 };
  const lowerOuter = p1_1.z > p1_2.z
    ? { p1: p1_1, p2: p2_1 }
    : { p1: p1_2, p2: p2_2 };

  // Internal cross bitangents (only if circles do not overlap)
  let cross1 = null;
  let cross2 = null;
  if (d > rA + rB + 0.1) {
    const cosPhiInt = Math.max(-1.0, Math.min(1.0, (rA + rB) / d));
    const phiInt = Math.acos(cosPhiInt);
    const ac1 = gamma + phiInt;
    const ac2 = gamma - phiInt;
    cross1 = {
      p1: new THREE.Vector3(ax + rA * Math.cos(ac1), y, az + rA * Math.sin(ac1)),
      p2: new THREE.Vector3(bx + rB * Math.cos(ac1 + Math.PI), y, bz + rB * Math.sin(ac1 + Math.PI))
    };
    cross2 = {
      p1: new THREE.Vector3(ax + rA * Math.cos(ac2), y, az + rA * Math.sin(ac2)),
      p2: new THREE.Vector3(bx + rB * Math.cos(ac2 + Math.PI), y, bz + rB * Math.sin(ac2 + Math.PI))
    };
  }

  const candidates = [upperOuter, lowerOuter, cross1, cross2].filter(Boolean);

  return {
    upperOuter,
    lowerOuter,
    cross1,
    cross2,
    topTangent: upperOuter,     // backward-compatible alias pointing to true +Y crest
    bottomTangent: lowerOuter,  // backward-compatible alias pointing to -Y crest
    candidates
  };
}

/**
 * Computes the two analytical tangent contact points on a circle from an external point.
 */
export function computeCirclePointTangent(circle, externalPt) {
  if (!circle || !externalPt) return null;
  const c = circle.userData?.center || { x: 0, y: 0, z: 0 };
  const r = Number(circle.userData?.radius || 25);
  const cx = c.x || 0;
  const cz = c.z ?? c.y ?? 0;
  const cy = (c.y !== undefined && c.y !== null) ? Number(c.y) : (circle.position?.y ?? (externalPt.y || 0));

  const dx = externalPt.x - cx;
  const dz = externalPt.z - cz;
  const d = Math.hypot(dx, dz);
  if (d <= r + 0.1) return null;

  const theta = Math.atan2(dz, dx);
  const cosBeta = Math.max(-1.0, Math.min(1.0, r / d));
  const beta = Math.acos(cosBeta);

  const t1 = new THREE.Vector3(cx + r * Math.cos(theta + beta), cy, cz + r * Math.sin(theta + beta));
  const t2 = new THREE.Vector3(cx + r * Math.cos(theta - beta), cy, cz + r * Math.sin(theta - beta));

  return { t1, t2 };
}

/**
 * Computes consistent rectangle center and full dimensions for both rubber-band previews
 * and final entity creation, supporting locked dimensions and anchor-to-center mode.
 */
export function computeRectPlacement(anchorPt, targetPt, options = {}) {
  const {
    anchorToCenter = false,
    lockedWidth = null,
    lockedHeight = null,
    dirX: fallbackDirX = 1,
    dirZ: fallbackDirZ = -1
  } = options;

  const dx = (targetPt?.x ?? anchorPt.x) - anchorPt.x;
  const dz = (targetPt?.z ?? anchorPt.z) - anchorPt.z;
  const dirX = Math.abs(dx) > 0.001 ? (dx >= 0 ? 1 : -1) : (fallbackDirX || 1);
  const dirZ = Math.abs(dz) > 0.001 ? (dz >= 0 ? 1 : -1) : (fallbackDirZ || -1);

  const hasLockedW = lockedWidth !== null && lockedWidth !== undefined && Math.abs(Number(lockedWidth)) > 0;
  const hasLockedH = lockedHeight !== null && lockedHeight !== undefined && Math.abs(Number(lockedHeight)) > 0;

  let width;
  let height;
  let cx;
  let cz;

  if (anchorToCenter) {
    width = hasLockedW ? Math.abs(Number(lockedWidth)) : Math.abs(dx) * 2;
    height = hasLockedH ? Math.abs(Number(lockedHeight)) : Math.abs(dz) * 2;
    cx = anchorPt.x;
    cz = anchorPt.z;
  } else {
    width = hasLockedW ? Math.abs(Number(lockedWidth)) : Math.abs(dx);
    height = hasLockedH ? Math.abs(Number(lockedHeight)) : Math.abs(dz);
    cx = anchorPt.x + dirX * (width / 2);
    cz = anchorPt.z + dirZ * (height / 2);
  }

  return { width, height, cx, cz, dirX, dirZ };
}

/**
 * Computes line endpoint honoring horizontal/vertical constraint and locked length/angle.
 */
export function computeLineEnd(anchorPt, targetPt, options = {}) {
  const {
    lineType = 'freeform',
    lockedLength = null,
    lockedAngle = null
  } = options;

  let p2 = (targetPt || anchorPt).clone();
  p2.y = anchorPt.y;

  if (lockedAngle !== null && lockedAngle !== undefined && Number.isFinite(Number(lockedAngle))) {
    const rawLen = anchorPt.distanceTo(p2);
    const len = (lockedLength !== null && lockedLength !== undefined && Number(lockedLength) > 0)
      ? Math.abs(Number(lockedLength))
      : Math.max(1, rawLen);
    const rad = (Number(lockedAngle) * Math.PI) / 180;
    p2 = new THREE.Vector3(
      anchorPt.x + Math.cos(rad) * len,
      anchorPt.y,
      anchorPt.z - Math.sin(rad) * len
    );
  } else {
    if (lineType === 'horizontal') {
      p2.z = anchorPt.z;
    } else if (lineType === 'vertical') {
      p2.x = anchorPt.x;
    }
    if (lockedLength !== null && lockedLength !== undefined && Number(lockedLength) > 0) {
      const dir = new THREE.Vector3().subVectors(p2, anchorPt);
      if (dir.lengthSq() < 1e-6) {
        dir.set(lineType === 'vertical' ? 0 : 1, 0, lineType === 'vertical' ? -1 : 0);
      } else {
        dir.normalize();
      }
      p2 = anchorPt.clone().addScaledVector(dir, Math.abs(Number(lockedLength)));
    }
  }

  const length = anchorPt.distanceTo(p2);
  const dx = p2.x - anchorPt.x;
  const dz = p2.z - anchorPt.z;
  const angle = (Math.atan2(-dz, dx) * 180 / Math.PI + 360) % 360;

  return { p2, length, angle };
}

/**
 * Creates a dynamic rubber-band preview mesh for mouse drag drawing.
 */
export function createGhostPreview(tool, startPt, currentPt, options = {}) {
  const group = new THREE.Group();
  group.name = "Ghost_Sketch_Preview";

  const dashedMaterial = new THREE.LineDashedMaterial({
    color: 0x38bdf8,
    dashSize: 4,
    gapSize: 2,
    linewidth: 2
  });

  if (tool === 'line') {
    const { p2 } = options.exactEnd ? { p2: currentPt } : computeLineEnd(startPt, currentPt, options);
    const geo = new THREE.BufferGeometry().setFromPoints([startPt, p2]);
    const line = new THREE.Line(geo, dashedMaterial);
    line.computeLineDistances();
    group.add(line);
  } else if (tool === 'rect') {
    const { width, height, cx, cz } = computeRectPlacement(startPt, currentPt, options);
    const halfW = Math.max(0.5, width / 2);
    const halfD = Math.max(0.5, height / 2);
    const y = startPt.y;
    const p1 = new THREE.Vector3(cx - halfW, y, cz - halfD);
    const p2 = new THREE.Vector3(cx + halfW, y, cz - halfD);
    const p3 = new THREE.Vector3(cx + halfW, y, cz + halfD);
    const p4 = new THREE.Vector3(cx - halfW, y, cz + halfD);

    const geo = new THREE.BufferGeometry().setFromPoints([p1, p2, p3, p4, p1]);
    const line = new THREE.Line(geo, dashedMaterial);
    line.computeLineDistances();
    group.add(line);

    if (options.createSurface) {
      const planeGeo = new THREE.PlaneGeometry(Math.max(1, width), Math.max(1, height));
      planeGeo.rotateX(-Math.PI / 2);
      const planeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
      const plane = new THREE.Mesh(planeGeo, planeMat);
      plane.position.set(cx, y, cz);
      group.add(plane);
    }
  } else if (tool === 'circle' || tool === 'arc_tangent' || tool === 'arctangent') {
    const radius = (options.lockedRadius && options.lockedRadius > 0)
      ? Number(options.lockedRadius)
      : Math.max(0.5, startPt.distanceTo(currentPt));
    const segments = 64;
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        startPt.x + Math.cos(theta) * radius,
        startPt.y,
        startPt.z + Math.sin(theta) * radius
      ));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const circle = new THREE.Line(geo, dashedMaterial);
    circle.computeLineDistances();
    group.add(circle);

    // Center point marker dot
    const centerDotGeo = new THREE.SphereGeometry(0.8, 8, 8);
    const centerDotMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const centerDot = new THREE.Mesh(centerDotGeo, centerDotMat);
    centerDot.position.copy(startPt);
    group.add(centerDot);

    // Radius guideline
    const radEnd = (options.lockedRadius && options.lockedRadius > 0)
      ? new THREE.Vector3(startPt.x + radius, startPt.y, startPt.z)
      : currentPt;
    const radGeo = new THREE.BufferGeometry().setFromPoints([startPt, radEnd]);
    const radLine = new THREE.Line(radGeo, dashedMaterial);
    radLine.computeLineDistances();
    group.add(radLine);
  } else if (tool === 'drill' || tool === 'point' || tool === 'datum') {
    const markerGeo = new THREE.RingGeometry(1.5, 3.0, 16);
    markerGeo.rotateX(-Math.PI / 2);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.copy(currentPt);
    group.add(marker);

    // Crosshair lines
    const chMat = new THREE.LineBasicMaterial({ color: 0xef4444 });
    const chGeo1 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(currentPt.x - 4, currentPt.y, currentPt.z),
      new THREE.Vector3(currentPt.x + 4, currentPt.y, currentPt.z)
    ]);
    const chGeo2 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(currentPt.x, currentPt.y, currentPt.z - 4),
      new THREE.Vector3(currentPt.x, currentPt.y, currentPt.z + 4)
    ]);
    group.add(new THREE.Line(chGeo1, chMat));
    group.add(new THREE.Line(chGeo2, chMat));
  } else if (tool === 'bolt_circle' || tool === 'pcd') {
    const pcd = options.pcd || 60;
    const radius = (options.lockedRadius && options.lockedRadius > 0)
      ? Number(options.lockedRadius)
      : Math.max(5, (pcd / 2) || startPt.distanceTo(currentPt));
    const numHoles = options.numHoles || 6;
    const holeRadius = options.holeRadius || 3.4;

    // Pitch circle dashed
    const pts = [];
    const segs = 64;
    for (let i = 0; i <= segs; i++) {
      const th = (i / segs) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        startPt.x + Math.cos(th) * radius,
        startPt.y,
        startPt.z + Math.sin(th) * radius
      ));
    }
    const circle = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), dashedMaterial);
    circle.computeLineDistances();
    group.add(circle);

    // Center marker
    const cDot = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
    cDot.position.copy(startPt);
    group.add(cDot);

    // Holes preview
    const startAng = ((options.startAngleDeg || 0) * Math.PI) / 180;
    const stepAng = (Math.PI * 2) / Math.max(1, numHoles);
    const holeMat = new THREE.LineBasicMaterial({ color: 0x0284c7 });

    for (let h = 0; h < numHoles; h++) {
      const hAng = startAng + h * stepAng;
      const hx = startPt.x + radius * Math.cos(hAng);
      const hz = startPt.z + radius * Math.sin(hAng);
      const hPts = [];
      for (let s = 0; s <= 16; s++) {
        const a = (s / 16) * Math.PI * 2;
        hPts.push(new THREE.Vector3(hx + Math.cos(a) * holeRadius, startPt.y, hz + Math.sin(a) * holeRadius));
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(hPts), holeMat));
    }
  } else if (tool === 'dynamic_trim') {
    // Red scissor cutting stroke
    const strokeMat = new THREE.LineDashedMaterial({ color: 0xef4444, dashSize: 3, gapSize: 2, linewidth: 2 });
    const strokeLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([startPt, currentPt]), strokeMat);
    strokeLine.computeLineDistances();
    group.add(strokeLine);

    // End scissor indicator dot
    const endDot = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    endDot.position.copy(currentPt);
    group.add(endDot);
  } else if (tool === 'arc_3pt' || tool === 'arc3pt') {
    if (options.pt2) {
      // We have pt1 (startPt), pt2 (options.pt2), and currentPt (pt3)
      const solved = computeArc3Points(startPt, options.pt2, currentPt);
      if (solved) {
        const arcPts = [];
        const segs = 48;
        const startRad = solved.startAngle;
        const totalRad = solved.sweepAngleRad;
        const dir = solved.isCCW ? 1 : -1;
        for (let i = 0; i <= segs; i++) {
          const a = startRad + dir * (i / segs) * totalRad;
          arcPts.push(new THREE.Vector3(
            solved.center.x + Math.cos(a) * solved.radius,
            solved.center.y,
            solved.center.z + Math.sin(a) * solved.radius
          ));
        }
        const arcLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPts), dashedMaterial);
        arcLine.computeLineDistances();
        group.add(arcLine);
      }
    } else {
      // 2 points chosen so far: show line between them
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([startPt, currentPt]), dashedMaterial);
      l.computeLineDistances();
      group.add(l);
    }
  } else if (tool === 'spline') {
    const pts = options.splinePoints ? [...options.splinePoints, currentPt] : [startPt, currentPt];
    if (pts.length >= 2) {
      const curve = new THREE.CatmullRomCurve3(pts);
      const curvePts = curve.getPoints(Math.max(20, pts.length * 10));
      const spLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curvePts), dashedMaterial);
      spLine.computeLineDistances();
      group.add(spLine);

      // Node markers
      pts.forEach((pt) => {
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
        dot.position.copy(pt);
        group.add(dot);
      });
    }
  }

  return group;
}

/**
 * Creates a visual snap indicator marker (small green square/circle) at the snapped position.
 */
export function createSnapIndicator(point, snapType = 'endpoint') {
  const group = new THREE.Group();
  group.name = "Snap_Indicator_Marker";

  const color = snapType === 'endpoint' ? 0x10b981 :
                snapType === 'midpoint' ? 0x06b6d4 :
                snapType === 'quadrant' ? 0x0284c7 :
                snapType === 'tangent' ? 0x10b981 :
                snapType === 'nearest' ? 0x06b6d4 :
                0xf59e0b;

  if (snapType === 'endpoint') {
    // Green square box
    const size = 2.5;
    const pts = [
      new THREE.Vector3(point.x - size, point.y + 0.1, point.z - size),
      new THREE.Vector3(point.x + size, point.y + 0.1, point.z - size),
      new THREE.Vector3(point.x + size, point.y + 0.1, point.z + size),
      new THREE.Vector3(point.x - size, point.y + 0.1, point.z + size),
      new THREE.Vector3(point.x - size, point.y + 0.1, point.z - size)
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, linewidth: 2 }));
    group.add(line);
  } else if (snapType === 'midpoint') {
    // Triangle
    const size = 2.5;
    const pts = [
      new THREE.Vector3(point.x, point.y + 0.1, point.z - size),
      new THREE.Vector3(point.x + size, point.y + 0.1, point.z + size),
      new THREE.Vector3(point.x - size, point.y + 0.1, point.z + size),
      new THREE.Vector3(point.x, point.y + 0.1, point.z - size)
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, linewidth: 2 }));
    group.add(line);
  } else if (snapType === 'quadrant') {
    // Diamond (Mastercam Quadrant glyph ◇)
    const size = 4.0;
    const pts = [
      new THREE.Vector3(point.x, point.y + 0.3, point.z - size),
      new THREE.Vector3(point.x + size, point.y + 0.3, point.z),
      new THREE.Vector3(point.x, point.y + 0.3, point.z + size),
      new THREE.Vector3(point.x - size, point.y + 0.3, point.z),
      new THREE.Vector3(point.x, point.y + 0.3, point.z - size)
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 3, depthTest: false }));
    group.add(line);
  } else if (snapType === 'tangent') {
    // Mastercam Tangent badge (⊘): clean, lightweight 2.2mm wireframe ring with tangent bar
    const r = 2.2;
    const circlePts = [];
    const segs = 20;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      circlePts.push(new THREE.Vector3(point.x + Math.cos(a) * r, point.y + 0.3, point.z + Math.sin(a) * r));
    }
    const cGeo = new THREE.BufferGeometry().setFromPoints(circlePts);
    const cLine = new THREE.Line(cGeo, new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2, depthTest: false }));
    group.add(cLine);

    // Tangent bar on top
    const barPts = [
      new THREE.Vector3(point.x - 3.2, point.y + 0.3, point.z - r),
      new THREE.Vector3(point.x + 3.2, point.y + 0.3, point.z - r)
    ];
    const bGeo = new THREE.BufferGeometry().setFromPoints(barPts);
    const bLine = new THREE.Line(bGeo, new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2, depthTest: false }));
    group.add(bLine);
  } else if (snapType === 'nearest') {
    // Hourglass (On-circle / on-curve snap ⧗)
    const size = 3.0;
    const pts = [
      new THREE.Vector3(point.x - size, point.y + 0.3, point.z - size),
      new THREE.Vector3(point.x + size, point.y + 0.3, point.z - size),
      new THREE.Vector3(point.x - size, point.y + 0.3, point.z + size),
      new THREE.Vector3(point.x + size, point.y + 0.3, point.z + size),
      new THREE.Vector3(point.x - size, point.y + 0.3, point.z - size)
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x06b6d4, linewidth: 2, depthTest: false }));
    group.add(line);
  } else {
    // Center Circle (⊙)
    const geo = new THREE.RingGeometry(1.8, 3.2, 20);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, depthTest: false }));
    mesh.position.set(point.x, point.y + 0.3, point.z);
    group.add(mesh);
  }

  return group;
}

/**
 * Extracts ordered 3D vertices from any wireframe Three.js entity (userData or BufferGeometry fallback).
 */
export function extractPointsFromCadEntity(entity) {
  if (!entity) return [];
  const ud = entity.userData || {};
  const rawType = String(ud.cadType || ud.type || '').toLowerCase();

  if (Array.isArray(ud.points) && ud.points.length >= 2) {
    return ud.points.map((p) => new THREE.Vector3(p.x || 0, p.y || 0, p.z || 0));
  }

  if (rawType === 'circle' && ud.center && ud.radius) {
    const pts = [];
    const segs = 48;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        (ud.center.x || 0) + Math.cos(a) * ud.radius,
        ud.center.y || 0,
        (ud.center.z || 0) + Math.sin(a) * ud.radius
      ));
    }
    return pts;
  }

  if (rawType === 'line' && ud.p1 && ud.p2) {
    return [
      new THREE.Vector3(ud.p1.x || 0, ud.p1.y || 0, ud.p1.z || 0),
      new THREE.Vector3(ud.p2.x || 0, ud.p2.y || 0, ud.p2.z || 0)
    ];
  }

  const posAttr = entity.geometry?.attributes?.position;
  if (posAttr && posAttr.count >= 2) {
    const pts = [];
    for (let i = 0; i < posAttr.count; i++) {
      pts.push(new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i)));
    }
    return pts;
  }

  return [];
}

/**
 * Checks whether an entity belongs to selectable wireframe geometry (excludes surface sheets / toolpaths / drill markers).
 */
export function isSelectableWireframeEntity(entity) {
  if (!entity || entity.visible === false) return false;
  const ud = entity.userData || {};
  const cadType = String(ud.cadType || ud.type || '').toLowerCase();
  if (entity.name?.startsWith('Surface_') || entity.name?.startsWith('CAD_Surface') || cadType === 'surface_extrusion' || cadType === 'surface_plane' || cadType === 'drill' || cadType === 'datum_point') {
    return false;
  }
  if (entity.isLine || entity.name?.startsWith('Wireframe_') || ['circle', 'rect', 'rectangle', 'line', 'arc', 'polyline', 'polygon', 'spline'].includes(cadType)) {
    return extractPointsFromCadEntity(entity).length >= 2;
  }
  return false;
}

/**
 * Builds a single chain object from a seed wireframe entity, tracing connected open segments when method === 'chain'.
 */
export function buildChainFromEntity(seedEntity, allEntities = [], options = {}) {
  const { method = 'chain', planeMode = '3d', tolerance = 0.75, reverse = false } = options;
  if (!seedEntity || !isSelectableWireframeEntity(seedEntity)) return null;

  const seedPts = extractPointsFromCadEntity(seedEntity);
  if (seedPts.length < 2) return null;

  const ud = seedEntity.userData || {};
  const rawType = String(ud.cadType || ud.type || '').toLowerCase();
  const isSelfClosed = seedPts.length >= 3 && seedPts[0].distanceTo(seedPts[seedPts.length - 1]) < 0.8;

  let finalPts = seedPts;
  const sourceEntityIds = [seedEntity.uuid || ud.customId || seedEntity.name];

  if (method === 'chain' && !isSelfClosed) {
    const pool = allEntities
      .filter((ent) => ent !== seedEntity && isSelectableWireframeEntity(ent))
      .map((ent) => ({ entity: ent, pts: extractPointsFromCadEntity(ent) }))
      .filter(({ pts }) => {
        if (pts.length < 2) return false;
        const closed = pts.length >= 3 && pts[0].distanceTo(pts[pts.length - 1]) < 0.8;
        if (closed) return false;
        if (planeMode === 'cplane') {
          return Math.abs(pts[0].y - seedPts[0].y) < 0.5 && Math.abs(pts[pts.length - 1].y - seedPts[0].y) < 0.5;
        }
        return true;
      });

    const combined = [...seedPts];
    const used = new Set();
    let changed = true;
    while (changed) {
      changed = false;
      const head = combined[0];
      const tail = combined[combined.length - 1];
      if (combined.length >= 3 && head.distanceTo(tail) <= tolerance) break;

      for (let i = 0; i < pool.length; i++) {
        if (used.has(i)) continue;
        const { entity, pts } = pool[i];
        const pStart = pts[0];
        const pEnd = pts[pts.length - 1];

        if (tail.distanceTo(pStart) <= tolerance) {
          combined.push(...pts.slice(1));
          used.add(i);
          sourceEntityIds.push(entity.uuid || entity.userData?.customId || entity.name);
          changed = true;
          break;
        } else if (tail.distanceTo(pEnd) <= tolerance) {
          combined.push(...[...pts].reverse().slice(1));
          used.add(i);
          sourceEntityIds.push(entity.uuid || entity.userData?.customId || entity.name);
          changed = true;
          break;
        } else if (head.distanceTo(pEnd) <= tolerance) {
          combined.unshift(...pts.slice(0, -1));
          used.add(i);
          sourceEntityIds.push(entity.uuid || entity.userData?.customId || entity.name);
          changed = true;
          break;
        } else if (head.distanceTo(pStart) <= tolerance) {
          combined.unshift(...[...pts].reverse().slice(0, -1));
          used.add(i);
          sourceEntityIds.push(entity.uuid || entity.userData?.customId || entity.name);
          changed = true;
          break;
        }
      }
    }
    finalPts = combined;
  }

  if (reverse) {
    finalPts = [...finalPts].reverse();
  }

  const isClosed = finalPts.length >= 3 && finalPts[0].distanceTo(finalPts[finalPts.length - 1]) < 0.8;
  const bounds = new THREE.Box3().setFromPoints(finalPts);
  const centerVec = ud.center
    ? new THREE.Vector3(ud.center.x || 0, ud.center.y || 0, ud.center.z || 0)
    : bounds.getCenter(new THREE.Vector3());

  return {
    id: seedEntity.uuid || ud.customId || `chain_${Math.random().toString(36).slice(2, 8)}`,
    type: rawType === 'circle' ? 'circle_loop' : rawType === 'rect' || rawType === 'rectangle' ? 'rectangle_loop' : isClosed ? 'polyline_loop' : 'open_chain',
    name: seedEntity.name || (sourceEntityIds.length > 1 ? `Connected Chain (${sourceEntityIds.length})` : `Chain_${rawType || 'wire'}`),
    points: finalPts.map((p) => p.clone()),
    isClosed,
    bounds,
    center: centerVec,
    radius: ud.radius ?? null,
    direction: reverse ? 'CCW / Reversed' : 'CW / Forward',
    sourceEntityIds
  };
}

/**
 * Hit-tests closest wireframe entity near a 3D cursor coordinate on the XZ sketch plane.
 */
export function hitTestWireframeEntity(cursorPt, entities = [], tolerance = 7.0, planeMode = '3d') {
  if (!cursorPt || !Array.isArray(entities) || entities.length === 0) return null;

  let bestEntity = null;
  let bestDist = tolerance;
  const tempProj = new THREE.Vector3();
  const segLine = new THREE.Line3();

  entities.forEach((entity) => {
    if (!isSelectableWireframeEntity(entity)) return;
    const pts = extractPointsFromCadEntity(entity);
    if (pts.length < 2) return;

    if (planeMode === 'cplane') {
      const avgY = pts.reduce((a, p) => a + p.y, 0) / pts.length;
      if (Math.abs(avgY - cursorPt.y) > 2.5) return;
    }

    for (let i = 0; i < pts.length - 1; i++) {
      segLine.set(pts[i], pts[i + 1]);
      segLine.closestPointToPoint(cursorPt, true, tempProj);
      const dist = planeMode === 'cplane'
        ? Math.hypot(cursorPt.x - tempProj.x, cursorPt.z - tempProj.z)
        : cursorPt.distanceTo(tempProj);
      if (dist < bestDist) {
        bestDist = dist;
        bestEntity = entity;
      }
    }
  });

  return bestEntity;
}

/**
 * Extracts selectable contour chains (rectangles, circles, closed polygons/splines) from CAD entities.
 */
export function extractClosedChainsFromCAD(entities = []) {
  const chains = [];

  entities.forEach((entity) => {
    if (!entity || !entity.userData) return;
    const { cadType, type, points, center, radius } = entity.userData;
    const resolvedType = String(cadType || type || '').toLowerCase();

    if ((resolvedType === 'rect' || resolvedType === 'rectangle') && Array.isArray(points) && points.length >= 4) {
      const vecs = points.map((p) => new THREE.Vector3(p.x, p.y, p.z));
      if (vecs[0].distanceTo(vecs[vecs.length - 1]) > 0.05) {
        vecs.push(vecs[0].clone());
      }
      const bounds = new THREE.Box3().setFromPoints(vecs);
      chains.push({
        id: entity.uuid || Math.random(),
        type: 'rectangle_loop',
        name: entity.name || 'Drawn Rectangle',
        center: bounds.getCenter(new THREE.Vector3()),
        points: vecs,
        isClosed: true,
        bounds
      });
    } else if (resolvedType === 'circle' && center && radius) {
      const circlePts = [];
      const segs = 64;
      for (let i = 0; i <= segs; i++) {
        const rad = (i / segs) * Math.PI * 2;
        circlePts.push(new THREE.Vector3(
          center.x + Math.cos(rad) * radius,
          center.y,
          center.z + Math.sin(rad) * radius
        ));
      }
      chains.push({
        id: entity.uuid || Math.random(),
        type: 'circle_loop',
        name: entity.name || 'Drawn Circle',
        center: new THREE.Vector3(center.x, center.y, center.z),
        radius,
        points: circlePts,
        isClosed: true,
        bounds: new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(center.x, center.y, center.z),
          new THREE.Vector3(radius * 2, 2, radius * 2)
        )
      });
    } else if (['polyline', 'polygon', 'spline'].includes(resolvedType)) {
      const vecs = extractPointsFromCadEntity(entity);
      if (vecs.length >= 3 && vecs[0].distanceTo(vecs[vecs.length - 1]) < 0.8) {
        if (vecs[0].distanceTo(vecs[vecs.length - 1]) > 0.05) {
          vecs.push(vecs[0].clone());
        }
        const bounds = new THREE.Box3().setFromPoints(vecs);
        chains.push({
          id: entity.uuid || Math.random(),
          type: 'polyline_loop',
          name: entity.name || 'Drawn Polyline',
          center: bounds.getCenter(new THREE.Vector3()),
          points: vecs,
          isClosed: true,
          bounds
        });
      }
    }
  });

  return chains;
}

/**
 * ============================================================================
 * MASTERCAM WIREFRAME SUITE: ADVANCED GEOMETRIC & TRIMMING CALCULATION ENGINES
 * ============================================================================
 */

/**
 * Computes an arc passing through 3 non-collinear points in 3D (CPlane projected).
 */
export function computeArc3Points(p1, p2, p3) {
  if (!p1 || !p2 || !p3) return null;
  const x1 = p1.x, z1 = p1.z ?? p1.y;
  const x2 = p2.x, z2 = p2.z ?? p2.y;
  const x3 = p3.x, z3 = p3.z ?? p3.y;
  const y = (p1.y + p2.y + p3.y) / 3;

  const D = 2 * (x1 * (z2 - z3) + x2 * (z3 - z1) + x3 * (z1 - z2));
  if (Math.abs(D) < 1e-7) return null; // Collinear points cannot form a unique circular arc

  const cx = ((x1 * x1 + z1 * z1) * (z2 - z3) + (x2 * x2 + z2 * z2) * (z3 - z1) + (x3 * x3 + z3 * z3) * (z1 - z2)) / D;
  const cz = ((x1 * x1 + z1 * z1) * (x3 - x2) + (x2 * x2 + z2 * z2) * (x1 - x3) + (x3 * x3 + z3 * z3) * (x2 - x1)) / D;
  const radius = Math.hypot(x1 - cx, z1 - cz);

  let a1 = Math.atan2(z1 - cz, x1 - cx);
  let a2 = Math.atan2(z2 - cz, x2 - cx);
  let a3 = Math.atan2(z3 - cz, x3 - cx);
  if (a1 < 0) a1 += Math.PI * 2;
  if (a2 < 0) a2 += Math.PI * 2;
  if (a3 < 0) a3 += Math.PI * 2;

  // Determine CCW vs CW sweep: does a2 lie between a1 and a3 going CCW?
  const diffCCW = (a3 - a1 + Math.PI * 2) % (Math.PI * 2);
  const midDiff = (a2 - a1 + Math.PI * 2) % (Math.PI * 2);
  const isCCW = midDiff < diffCCW;

  return {
    center: new THREE.Vector3(cx, y, cz),
    radius,
    startAngle: a1,
    midAngle: a2,
    endAngle: a3,
    startAngleDeg: (a1 * 180) / Math.PI,
    endAngleDeg: (a3 * 180) / Math.PI,
    isCCW,
    sweepAngleRad: isCCW ? diffCCW : (Math.PI * 2 - diffCCW)
  };
}

/**
 * Computes Pitch Circle Diameter (PCD) bolt hole positions and reference geometry.
 */
export function computeBoltCircle(center = { x: 0, y: 0, z: 0 }, pcd = 60, numHoles = 6, startAngleDeg = 0, holeRadius = 3.4, sweepAngleDeg = 360) {
  const holes = [];
  const radius = pcd / 2;
  const safeHoles = Math.max(1, Math.round(numHoles));
  const stepAngle = sweepAngleDeg === 360
    ? (360 / safeHoles)
    : (safeHoles > 1 ? sweepAngleDeg / (safeHoles - 1) : 0);

  for (let i = 0; i < safeHoles; i++) {
    const angDeg = startAngleDeg + i * stepAngle;
    const rad = (angDeg * Math.PI) / 180;
    holes.push({
      index: i + 1,
      angleDeg: angDeg,
      x: center.x + radius * Math.cos(rad),
      y: center.y,
      z: center.z + radius * Math.sin(rad),
      radius: holeRadius
    });
  }

  return {
    center: new THREE.Vector3(center.x, center.y, center.z),
    pcd,
    radius,
    numHoles: safeHoles,
    startAngleDeg,
    sweepAngleDeg,
    holeRadius,
    holes
  };
}

/**
 * Robust 2D Line-Line intersection solver on CPlane.
 */
export function findLineIntersection2D(p1, p2, p3, p4) {
  const dx12 = p2.x - p1.x;
  const dz12 = (p2.z ?? p2.y) - (p1.z ?? p1.y);
  const dx34 = p4.x - p3.x;
  const dz34 = (p4.z ?? p4.y) - (p3.z ?? p3.y);

  const det = dx12 * dz34 - dz12 * dx34;
  if (Math.abs(det) < 1e-8) return null; // Parallel or collinear

  const dx13 = (p3.x) - (p1.x);
  const dz13 = (p3.z ?? p3.y) - (p1.z ?? p1.y);

  const t = (dx13 * dz34 - dz13 * dx34) / det;
  const u = (dx13 * dz12 - dz13 * dx12) / det;

  const y = (p1.y + p2.y + p3.y + p4.y) / 4;
  const intPt = new THREE.Vector3(p1.x + t * dx12, y, (p1.z ?? p1.y) + t * dz12);

  return {
    point: intPt,
    t,
    u,
    isSegmentA: t >= -1e-4 && t <= 1 + 1e-4,
    isSegmentB: u >= -1e-4 && u <= 1 + 1e-4
  };
}

/**
 * Robust 2D Line-Circle intersection solver on CPlane.
 */
export function findLineCircleIntersection2D(p1, p2, center, radius) {
  const dx = p2.x - p1.x;
  const dz = (p2.z ?? p2.y) - (p1.z ?? p1.y);
  const fx = p1.x - center.x;
  const fz = (p1.z ?? p1.y) - (center.z ?? center.y);

  const a = dx * dx + dz * dz;
  const b = 2 * (fx * dx + fz * dz);
  const c = fx * fx + fz * fz - radius * radius;

  if (Math.abs(a) < 1e-9) return [];
  const discriminant = b * b - 4 * a * c;
  if (discriminant < -1e-6) return [];

  const safeDisc = Math.max(0, discriminant);
  const sqrtDisc = Math.sqrt(safeDisc);
  const t1 = (-b - sqrtDisc) / (2 * a);
  const t2 = (-b + sqrtDisc) / (2 * a);

  const results = [];
  const y = (p1.y + p2.y + center.y) / 3;

  [t1, t2].forEach((t) => {
    results.push({
      point: new THREE.Vector3(p1.x + t * dx, y, (p1.z ?? p1.y) + t * dz),
      t,
      isSegment: t >= -1e-4 && t <= 1 + 1e-4
    });
  });

  return results;
}

/**
 * Finds all intersections between two arbitrary CAD wireframe entities.
 */
export function findCurveIntersections(entA, entB) {
  if (!entA || !entB || entA === entB) return [];
  const ptsA = extractPointsFromCadEntity(entA);
  const ptsB = extractPointsFromCadEntity(entB);
  if (ptsA.length < 2 || ptsB.length < 2) return [];

  const intersections = [];
  for (let i = 0; i < ptsA.length - 1; i++) {
    for (let j = 0; j < ptsB.length - 1; j++) {
      const res = findLineIntersection2D(ptsA[i], ptsA[i + 1], ptsB[j], ptsB[j + 1]);
      if (res && res.isSegmentA && res.isSegmentB) {
        intersections.push(res.point);
      }
    }
  }
  return intersections;
}

/**
 * Mastercam Signature Dynamic Trim:
 * Given a scissor line stroke (startPt, endPt), detects crossed wireframe entities,
 * partitions them at nearest intersecting boundaries with all other entities, and snips that segment.
 */
export function performDynamicTrim(scissorStart, scissorEnd, allEntities = []) {
  if (!scissorStart || !scissorEnd || !allEntities.length) return null;

  // 1. Find which entities are intersected by the scissor stroke line
  const hitCandidates = [];

  allEntities.forEach((entity) => {
    if (!isSelectableWireframeEntity(entity)) return;
    const pts = extractPointsFromCadEntity(entity);
    if (pts.length < 2) return;

    for (let i = 0; i < pts.length - 1; i++) {
      const hit = findLineIntersection2D(scissorStart, scissorEnd, pts[i], pts[i + 1]);
      if (hit && hit.isSegmentA && hit.isSegmentB) {
        hitCandidates.push({
          entity,
          segIndex: i,
          hitPoint: hit.point,
          hitT: hit.u,
          pts
        });
        break;
      }
    }
  });

  if (!hitCandidates.length) return null;

  const target = hitCandidates[0];
  const { entity, pts, hitPoint } = target;

  // 2. Find all intersections of this target entity with ALL OTHER entities in the model
  const cutParams = [0, 1]; // Endpoints
  const otherEntities = allEntities.filter((e) => e.uuid !== entity.uuid && isSelectableWireframeEntity(e));

  for (let i = 0; i < pts.length - 1; i++) {
    const pA = pts[i];
    const pB = pts[i + 1];
    const segLen = pA.distanceTo(pB);
    if (segLen < 1e-4) continue;

    otherEntities.forEach((other) => {
      const otherPts = extractPointsFromCadEntity(other);
      for (let j = 0; j < otherPts.length - 1; j++) {
        const xRes = findLineIntersection2D(pA, pB, otherPts[j], otherPts[j + 1]);
        if (xRes && xRes.isSegmentA && xRes.isSegmentB) {
          // Compute cumulative parameter along full polyline/line
          cutParams.push(xRes.t);
        }
      }
    });
  }

  // Remove duplicate cut parameters and sort
  const sortedParams = [...new Set(cutParams.map((t) => Number(t.toFixed(5))))].sort((a, b) => a - b);

  // Find parameter of scissor cut hitPoint
  const pStart = pts[0];
  const pEnd = pts[pts.length - 1];
  const fullLen = pStart.distanceTo(pEnd);
  const scissorT = fullLen > 0 ? pStart.distanceTo(hitPoint) / fullLen : target.hitT;

  // Find sub-interval containing scissorT
  let snipIdx = 0;
  for (let k = 0; k < sortedParams.length - 1; k++) {
    if (scissorT >= sortedParams[k] - 1e-3 && scissorT <= sortedParams[k + 1] + 1e-3) {
      snipIdx = k;
      break;
    }
  }

  // Sub-segments to keep: all except snipIdx
  const keptSegments = [];
  for (let k = 0; k < sortedParams.length - 1; k++) {
    if (k !== snipIdx) {
      const tA = sortedParams[k];
      const tB = sortedParams[k + 1];
      const ptA = new THREE.Vector3().lerpVectors(pStart, pEnd, tA);
      const ptB = new THREE.Vector3().lerpVectors(pStart, pEnd, tB);
      if (ptA.distanceTo(ptB) > 0.5) {
        keptSegments.push({ p1: ptA, p2: ptB });
      }
    }
  }

  return {
    targetEntity: entity,
    hitPoint,
    keptSegments,
    snippedInterval: [sortedParams[snipIdx], sortedParams[snipIdx + 1]]
  };
}

/**
 * Computes a Mastercam Corner Fillet between two line entities.
 * Automatically computes intersection, tangent touch points, and creates tangent circular fillet arc.
 */
export function computeFilletBetweenEntities(entA, entB, radius = 5, trimMode = 'trim') {
  if (!entA || !entB || radius <= 0) return null;
  const ptsA = extractPointsFromCadEntity(entA);
  const ptsB = extractPointsFromCadEntity(entB);
  if (ptsA.length < 2 || ptsB.length < 2) return null;

  const p1 = ptsA[0], p2 = ptsA[ptsA.length - 1];
  const p3 = ptsB[0], p4 = ptsB[ptsB.length - 1];

  const intRes = findLineIntersection2D(p1, p2, p3, p4);
  if (!intRes) return null; // Lines are parallel

  const corner = intRes.point;

  // Direction vectors pointing away from the corner on each line
  const d1 = p1.distanceTo(corner) > p2.distanceTo(corner) ? p1 : p2;
  const d2 = p3.distanceTo(corner) > p4.distanceTo(corner) ? p3 : p4;

  const uA = new THREE.Vector3(d1.x - corner.x, 0, d1.z - corner.z).normalize();
  const uB = new THREE.Vector3(d2.x - corner.x, 0, d2.z - corner.z).normalize();

  const dot = Math.max(-0.999, Math.min(0.999, uA.dot(uB)));
  const angle = Math.acos(dot);
  if (angle < 0.05 || angle > Math.PI - 0.05) return null;

  const tanDist = radius / Math.tan(angle / 2);
  const touchA = new THREE.Vector3(corner.x + uA.x * tanDist, corner.y, corner.z + uA.z * tanDist);
  const touchB = new THREE.Vector3(corner.x + uB.x * tanDist, corner.y, corner.z + uB.z * tanDist);

  // Center is along the angle bisector at distance radius / sin(angle / 2)
  const bisector = new THREE.Vector3().addVectors(uA, uB).normalize();
  const centerDist = radius / Math.sin(angle / 2);
  const center = new THREE.Vector3(corner.x + bisector.x * centerDist, corner.y, corner.z + bisector.z * centerDist);

  // Arc angles
  let angA = Math.atan2(touchA.z - center.z, touchA.x - center.x);
  let angB = Math.atan2(touchB.z - center.z, touchB.x - center.x);

  return {
    center,
    radius,
    touchA,
    touchB,
    corner,
    angleDeg: (angle * 180) / Math.PI,
    filletArcData: {
      center: [center.x, center.y, center.z],
      radius,
      startAngleDeg: (angA * 180) / Math.PI,
      endAngleDeg: (angB * 180) / Math.PI
    },
    trimmedLineA: { p1: d1, p2: touchA },
    trimmedLineB: { p1: d2, p2: touchB }
  };
}

/**
 * Computes a Mastercam Corner Chamfer between two line entities.
 */
export function computeChamferBetweenEntities(entA, entB, dist1 = 5, dist2 = 5, trimMode = 'trim') {
  if (!entA || !entB || dist1 <= 0) return null;
  const ptsA = extractPointsFromCadEntity(entA);
  const ptsB = extractPointsFromCadEntity(entB);
  if (ptsA.length < 2 || ptsB.length < 2) return null;

  const p1 = ptsA[0], p2 = ptsA[ptsA.length - 1];
  const p3 = ptsB[0], p4 = ptsB[ptsB.length - 1];

  const intRes = findLineIntersection2D(p1, p2, p3, p4);
  if (!intRes) return null;

  const corner = intRes.point;
  const d1 = p1.distanceTo(corner) > p2.distanceTo(corner) ? p1 : p2;
  const d2 = p3.distanceTo(corner) > p4.distanceTo(corner) ? p3 : p4;

  const uA = new THREE.Vector3(d1.x - corner.x, 0, d1.z - corner.z).normalize();
  const uB = new THREE.Vector3(d2.x - corner.x, 0, d2.z - corner.z).normalize();

  const cA = new THREE.Vector3(corner.x + uA.x * dist1, corner.y, corner.z + uA.z * dist1);
  const cB = new THREE.Vector3(corner.x + uB.x * dist2, corner.y, corner.z + uB.z * dist2);

  return {
    corner,
    chamferLine: { p1: cA, p2: cB },
    trimmedLineA: { p1: d1, p2: cA },
    trimmedLineB: { p1: d2, p2: cB }
  };
}

/**
 * Mastercam Modify Length: Adjusts line length by delta, total length, or percentage.
 */
export function computeModifyLength(entity, value = 10, mode = 'delta', endToModify = 2) {
  if (!entity) return null;
  const pts = extractPointsFromCadEntity(entity);
  if (pts.length < 2) return null;

  const p1 = pts[0].clone();
  const p2 = pts[pts.length - 1].clone();
  const curLen = p1.distanceTo(p2);
  if (curLen < 1e-4) return null;

  let newLen = curLen;
  if (mode === 'delta') newLen = Math.max(0.1, curLen + value);
  else if (mode === 'total') newLen = Math.max(0.1, value);
  else if (mode === 'percent') newLen = Math.max(0.1, curLen * (value / 100));

  const dir = new THREE.Vector3().subVectors(p2, p1).normalize();

  if (endToModify === 2) {
    p2.copy(p1).addScaledVector(dir, newLen);
  } else {
    p1.copy(p2).addScaledVector(dir.negate(), newLen);
  }

  return { p1, p2, oldLength: curLen, newLength: newLen };
}

/**
 * Mastercam Close Arc: Converts open circular arc into a full 360° circle.
 */
export function computeCloseArc(arcEntity) {
  if (!arcEntity || !arcEntity.userData) return null;
  const { center, radius } = arcEntity.userData;
  if (!center || !radius) {
    const pts = extractPointsFromCadEntity(arcEntity);
    if (pts.length >= 3) {
      const solved = computeArc3Points(pts[0], pts[Math.floor(pts.length / 2)], pts[pts.length - 1]);
      if (solved) return { center: solved.center, radius: solved.radius, startAngleDeg: 0, endAngleDeg: 360, isFullCircle: true };
    }
    return null;
  }
  return { center: new THREE.Vector3(center.x, center.y, center.z), radius, startAngleDeg: 0, endAngleDeg: 360, isFullCircle: true };
}


