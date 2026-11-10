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
export function snapToEntityPoints(cursorPoint, existingEntities = [], snapTolerance = 4.0) {
  if (!cursorPoint || !existingEntities || existingEntities.length === 0) {
    return { snapped: false, point: cursorPoint, type: null };
  }

  let closestDist = snapTolerance;
  let snappedPoint = null;
  let snapType = null;

  existingEntities.forEach((entity) => {
    if (!entity || !entity.userData) return;
    const { cadType, points, center, p1, p2 } = entity.userData;

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

    // 2. Check Circle/Arc center and quadrant points
    if ((cadType === 'circle' || cadType === 'arc') && center) {
      const c = new THREE.Vector3(center.x, center.y, center.z);
      const dCenter = cursorPoint.distanceTo(c);
      if (dCenter < closestDist) {
        closestDist = dCenter;
        snappedPoint = c.clone();
        snapType = 'center';
      }
    }

    // 3. Check general point arrays (rectangles, polygons)
    if (Array.isArray(points)) {
      points.forEach((p) => {
        const v = new THREE.Vector3(p.x, p.y, p.z);
        const d = cursorPoint.distanceTo(v);
        if (d < closestDist) {
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
    const { p2 } = computeLineEnd(startPt, currentPt, options);
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
  } else if (tool === 'drill') {
    const markerGeo = new THREE.RingGeometry(1.5, 3.0, 16);
    markerGeo.rotateX(-Math.PI / 2);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.copy(currentPt);
    group.add(marker);
  }

  return group;
}

/**
 * Creates a visual snap indicator marker (small green square/circle) at the snapped position.
 */
export function createSnapIndicator(point, snapType = 'endpoint') {
  const group = new THREE.Group();
  group.name = "Snap_Indicator_Marker";

  const color = snapType === 'endpoint' ? 0x10b981 : snapType === 'midpoint' ? 0x06b6d4 : 0xf59e0b;

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
  } else {
    // Center Circle
    const geo = new THREE.RingGeometry(1.2, 2.2, 16);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    mesh.position.set(point.x, point.y + 0.1, point.z);
    group.add(mesh);
  }

  return group;
}

/**
 * Automatically detects closed loop chains from drawn lines, arcs, and rectangles.
 * Returns array of closed point loops formatted for CAM pocketing / contouring.
 */
export function extractClosedChainsFromCAD(entities = []) {
  const chains = [];

  entities.forEach((entity) => {
    if (!entity || !entity.userData) return;
    const { cadType, points, center, radius } = entity.userData;

    if (cadType === 'rect' && Array.isArray(points) && points.length >= 4) {
      chains.push({
        id: entity.uuid || Math.random(),
        type: 'rectangle_loop',
        name: entity.name || 'Drawn Rectangle',
        points: points.map(p => new THREE.Vector3(p.x, p.y, p.z)),
        isClosed: true,
        bounds: new THREE.Box3().setFromPoints(points.map(p => new THREE.Vector3(p.x, p.y, p.z)))
      });
    } else if (cadType === 'circle' && center && radius) {
      const circlePts = [];
      const segs = 36;
      for (let i = 0; i < segs; i++) {
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
    } else if (cadType === 'polyline' && Array.isArray(points) && points.length >= 3) {
      chains.push({
        id: entity.uuid || Math.random(),
        type: 'polyline_loop',
        name: entity.name || 'Drawn Polyline',
        points: points.map(p => new THREE.Vector3(p.x, p.y, p.z)),
        isClosed: points[0].distanceTo(points[points.length - 1]) < 0.5,
        bounds: new THREE.Box3().setFromPoints(points.map(p => new THREE.Vector3(p.x, p.y, p.z)))
      });
    }
  });

  return chains;
}

