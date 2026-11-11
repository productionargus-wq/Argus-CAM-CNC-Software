import * as THREE from 'three';
import {
  extractPointsFromCadEntity,
  buildChainFromEntity
} from './cadDrawingEngine.js';

/**
 * Returns the stable unique key used to identify a custom CAD/CAM entity across renders & undo history.
 */
export function getCustomEntityId(entity) {
  if (!entity) return null;
  return entity.userData?.customId || entity.uuid || entity.name || null;
}

/**
 * Classifies an entity inside customGeometry into a clear CAD category.
 */
export function getCustomEntityCategory(entity) {
  if (!entity) return 'other';
  const ud = entity.userData || {};
  const cadType = String(ud.cadType || ud.type || '').toLowerCase();
  const name = String(entity.name || '').toLowerCase();

  if (name.startsWith('drafting_') || cadType.includes('dimension')) return 'drafting';
  if (cadType === 'solid' || name.startsWith('solid_')) return 'solid';
  if (
    name.startsWith('surface_') ||
    name.startsWith('cad_surface') ||
    cadType === 'surface_extrusion' ||
    cadType === 'surface_plane' ||
    cadType === 'surface_sweep' ||
    cadType === 'planar_surface'
  ) {
    return 'surface';
  }
  if (cadType === 'drill' || cadType === 'datum_point' || name.startsWith('drill_') || name.startsWith('hole_')) {
    return 'point';
  }
  if (cadType === 'circle' || name.includes('circle')) return 'circle';
  if (cadType === 'arc' || name.includes('arc')) return 'arc';
  if (cadType === 'rect' || cadType === 'rectangle' || name.includes('rect')) return 'rect';
  if (cadType === 'line' || name.includes('line')) return 'line';
  if (cadType === 'polyline' || cadType === 'polygon' || cadType === 'spline' || cadType === 'bolt_hole_circle') {
    return 'spline';
  }
  if (entity.isLine) return 'line';
  if (entity.isMesh) return 'surface';
  return 'other';
}

/**
 * Checks whether an entity passes the active Solid/Topology filter toggle in the floating pill.
 */
export function matchesTopologyFilter(entity, solidFilter = 'all') {
  if (!entity || !solidFilter || solidFilter === 'all') return true;
  const cat = getCustomEntityCategory(entity);
  if (solidFilter === 'wireframe') {
    return ['line', 'circle', 'rect', 'arc', 'spline', 'point', 'drafting'].includes(cat);
  }
  if (solidFilter === 'solid_edge') {
    return ['line', 'circle', 'rect', 'arc', 'spline', 'surface', 'solid'].includes(cat);
  }
  if (solidFilter === 'solid_face') {
    return cat === 'surface' || cat === 'solid';
  }
  if (solidFilter === 'solid_body') {
    return cat === 'solid' || cat === 'surface';
  }
  return true;
}

/**
 * Checks whether an entity passes the active Quick Mask filter.
 */
export function matchesSelectionMask(entity, mask = 'all') {
  if (!entity || entity.visible === false) return false;
  if (!mask || mask === 'all' || mask === 'clear' || mask === 'colors') return true;
  const cat = getCustomEntityCategory(entity);
  if (mask === 'wireframe') return ['line', 'circle', 'rect', 'arc', 'spline'].includes(cat);
  if (mask === 'points') return cat === 'point';
  if (mask === 'arcs') return cat === 'circle' || cat === 'arc';
  if (mask === 'surfaces') return cat === 'surface';
  if (mask === 'solids') return cat === 'solid';
  if (mask === 'drafting') return cat === 'drafting';
  return true;
}

/**
 * Computes a summary object for an array of selected entities (counts, label, bounding box, total length).
 */
export function summarizeSelectedEntities(entities = []) {
  const byCategory = {};
  const combinedBox = new THREE.Box3();
  let totalLengthMm = 0;

  entities.forEach((ent) => {
    if (!ent) return;
    const cat = getCustomEntityCategory(ent);
    byCategory[cat] = (byCategory[cat] || 0) + 1;

    const clone = ent.clone(true);
    clone.updateMatrixWorld(true);
    const entBox = new THREE.Box3().setFromObject(clone);
    if (!entBox.isEmpty()) combinedBox.union(entBox);

    const pts = extractPointsFromCadEntity(ent);
    for (let i = 1; i < pts.length; i++) {
      totalLengthMm += pts[i - 1].distanceTo(pts[i]);
    }
  });

  const labelNames = {
    circle: ['Circle', 'Circles'],
    arc: ['Arc', 'Arcs'],
    rect: ['Rect', 'Rects'],
    line: ['Line', 'Lines'],
    spline: ['Spline', 'Splines'],
    point: ['Point', 'Points'],
    surface: ['Surface', 'Surfaces'],
    solid: ['Solid', 'Solids'],
    drafting: ['Dim', 'Dims'],
    other: ['Entity', 'Entities']
  };

  const parts = Object.entries(byCategory).map(([cat, count]) => {
    const [singular, plural] = labelNames[cat] || labelNames.other;
    return `${count} ${count === 1 ? singular : plural}`;
  });

  return {
    count: entities.length,
    byCategory,
    label: parts.join(', '),
    combinedBox: combinedBox.isEmpty() ? null : combinedBox,
    totalLengthMm: Number(totalLengthMm.toFixed(2))
  };
}

/**
 * Computes the world-space transform matrix for a node inside customGeometry (shifted +worldYOffset in Y).
 */
function buildWorldMatrixInCustomGroup(node, rootEntity, worldYOffset = 49) {
  rootEntity.updateMatrix();
  const rootM = rootEntity.matrix.clone();
  const worldShift = new THREE.Matrix4().makeTranslation(0, worldYOffset, 0);

  if (node === rootEntity) {
    return worldShift.multiply(rootM);
  }

  const chain = [];
  let cur = node;
  while (cur && cur !== rootEntity) {
    cur.updateMatrix();
    chain.unshift(cur.matrix.clone());
    cur = cur.parent;
  }
  const combined = worldShift.multiply(rootM);
  chain.forEach((m) => combined.multiply(m));
  return combined;
}

/**
 * Samples representative 3D world-space vertices and edges for any CAD entity (wireframe, point, surface, solid, dim).
 */
export function sampleEntityWorldGeometry(entity, worldYOffset = 49) {
  const points = [];
  const segments = [];
  const rootMatrix = buildWorldMatrixInCustomGroup(entity, entity, worldYOffset);

  const wirePts = extractPointsFromCadEntity(entity);
  if (wirePts.length >= 2) {
    const worldPts = wirePts.map((p) => p.clone().applyMatrix4(rootMatrix));
    worldPts.forEach((p) => points.push(p));
    for (let i = 0; i < worldPts.length - 1; i++) {
      segments.push([worldPts[i], worldPts[i + 1]]);
    }
    return { points, segments };
  }

  // Fallback for groups, extruded/planar surfaces, drill/datum points, solids, and drafting dimensions
  entity.traverse((child) => {
    if (child.visible === false) return;
    const mat = buildWorldMatrixInCustomGroup(child, entity, worldYOffset);

    if ((child.isLine || child.isLineSegments) && child.geometry?.attributes?.position) {
      const pos = child.geometry.attributes.position;
      const step = child.isLineSegments ? 2 : 1;
      for (let i = 0; i + 1 < pos.count; i += step) {
        const p1 = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mat);
        const p2 = new THREE.Vector3(pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1)).applyMatrix4(mat);
        points.push(p1, p2);
        segments.push([p1, p2]);
      }
      return;
    }

    if (child.isMesh && child.geometry) {
      if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
      const pos = child.geometry.attributes?.position;
      if (pos && pos.count > 0) {
        // Subsample mesh vertices evenly so dense cylinders still test accurately and fast
        const stride = Math.max(1, Math.floor(pos.count / 36));
        for (let i = 0; i < pos.count; i += stride) {
          points.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mat));
        }
      }
      const bb = child.geometry.boundingBox;
      if (bb) {
        const c = [
          new THREE.Vector3(bb.min.x, bb.min.y, bb.min.z).applyMatrix4(mat),
          new THREE.Vector3(bb.max.x, bb.min.y, bb.min.z).applyMatrix4(mat),
          new THREE.Vector3(bb.max.x, bb.min.y, bb.max.z).applyMatrix4(mat),
          new THREE.Vector3(bb.min.x, bb.min.y, bb.max.z).applyMatrix4(mat),
          new THREE.Vector3(bb.min.x, bb.max.y, bb.min.z).applyMatrix4(mat),
          new THREE.Vector3(bb.max.x, bb.max.y, bb.min.z).applyMatrix4(mat),
          new THREE.Vector3(bb.max.x, bb.max.y, bb.max.z).applyMatrix4(mat),
          new THREE.Vector3(bb.min.x, bb.max.y, bb.max.z).applyMatrix4(mat)
        ];
        c.forEach((pt) => points.push(pt));
        const edgeIdx = [
          [0, 1], [1, 2], [2, 3], [3, 0],
          [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7]
        ];
        edgeIdx.forEach(([a, b]) => segments.push([c[a], c[b]]));
      }
    }
  });

  if (points.length === 0) {
    const pos = new THREE.Vector3(0, 0, 0).applyMatrix4(rootMatrix);
    points.push(pos);
  }

  return { points, segments };
}

/**
 * Projects a 3D world-space coordinate into container CSS pixel coordinates.
 */
export function projectPointToViewport(worldPt, camera, width, height) {
  if (!worldPt || !camera || width <= 0 || height <= 0) {
    return { x: 0, y: 0, visible: false };
  }
  const v = worldPt.clone().project(camera);
  return {
    x: ((v.x + 1) * 0.5) * width,
    y: ((-v.y + 1) * 0.5) * height,
    visible: v.z >= -1 && v.z <= 1
  };
}

/**
 * Liang-Barsky 2D segment vs axis-aligned rectangle intersection test.
 */
export function segmentIntersectsRect2D(x1, y1, x2, y2, rect) {
  let t0 = 0;
  let t1 = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const checks = [
    [-dx, x1 - rect.minX],
    [dx, rect.maxX - x1],
    [-dy, y1 - rect.minY],
    [dy, rect.maxY - y1]
  ];
  for (const [p, q] of checks) {
    if (Math.abs(p) < 1e-8) {
      if (q < 0) return false;
    } else {
      const r = q / p;
      if (p < 0) {
        if (r > t1) return false;
        if (r > t0) t0 = r;
      } else {
        if (r < t0) return false;
        if (r < t1) t1 = r;
      }
    }
  }
  return t0 <= t1;
}

function pointInRect2D(pt, rect) {
  return pt.visible && pt.x >= rect.minX && pt.x <= rect.maxX && pt.y >= rect.minY && pt.y <= rect.maxY;
}

function distToSegment2D(px, py, x1, y1, x2, y2) {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const lenSq = vx * vx + vy * vy;
  if (lenSq < 1e-6) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * vx + (py - y1) * vy) / lenSq));
  return Math.hypot(px - (x1 + t * vx), py - (y1 + t * vy));
}

/**
 * Ray-casting 2D point-in-polygon check.
 */
export function pointInPolygon2D(px, py, polyPts = []) {
  if (!Array.isArray(polyPts) || polyPts.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polyPts.length - 1; i < polyPts.length; j = i++) {
    const xi = polyPts[i].x;
    const yi = polyPts[i].y;
    const xj = polyPts[j].x;
    const yj = polyPts[j].y;
    const intersect = ((yi > py) !== (yj > py))
      && (px < ((xj - xi) * (py - yi)) / ((yj - yi) || 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * 2D segment-segment intersection helper (handles endpoint contact and collinear overlap).
 */
export function segmentsIntersect2D(ax, ay, bx, by, cx, cy, dx, dy) {
  const orient = (px, py, qx, qy, rx, ry) => (qx - px) * (ry - py) - (qy - py) * (rx - px);
  const onSeg = (px, py, qx, qy, rx, ry) =>
    Math.min(px, rx) - 1e-6 <= qx && qx <= Math.max(px, rx) + 1e-6 &&
    Math.min(py, ry) - 1e-6 <= qy && qy <= Math.max(py, ry) + 1e-6;

  const o1 = orient(ax, ay, bx, by, cx, cy);
  const o2 = orient(ax, ay, bx, by, dx, dy);
  const o3 = orient(cx, cy, dx, dy, ax, ay);
  const o4 = orient(cx, cy, dx, dy, bx, by);

  if ((o1 > 1e-8 && o2 < -1e-8 || o1 < -1e-8 && o2 > 1e-8) &&
      (o3 > 1e-8 && o4 < -1e-8 || o3 < -1e-8 && o4 > 1e-8)) {
    return true;
  }
  if (Math.abs(o1) <= 1e-8 && onSeg(ax, ay, cx, cy, bx, by)) return true;
  if (Math.abs(o2) <= 1e-8 && onSeg(ax, ay, dx, dy, bx, by)) return true;
  if (Math.abs(o3) <= 1e-8 && onSeg(cx, cy, ax, ay, dx, dy)) return true;
  if (Math.abs(o4) <= 1e-8 && onSeg(cx, cy, bx, by, dx, dy)) return true;
  return false;
}

function polygonArea2D(polyPts = []) {
  if (!Array.isArray(polyPts) || polyPts.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < polyPts.length; i++) {
    const a = polyPts[i];
    const b = polyPts[(i + 1) % polyPts.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) * 0.5;
}

function filterSelectableEntities(entities, { mask = 'all', solidFilter = 'all', layerVisibility = null } = {}) {
  return entities.filter((entity) => {
    if (!entity || !matchesSelectionMask(entity, mask) || !matchesTopologyFilter(entity, solidFilter)) {
      return false;
    }
    const cat = getCustomEntityCategory(entity);
    if (layerVisibility) {
      const isSurf = cat === 'surface' || cat === 'solid';
      if (isSurf && layerVisibility.surfaces === false) return false;
      if (!isSurf && layerVisibility.wireframe === false) return false;
    }
    return true;
  });
}

function evaluateProjectedContainment(entity, camera, width, height, { worldYOffset = 49, containment = 'in_cross', pointInsideFn, segIntersectsRegionFn, segCrossesBorderFn, enclosingSeedPt }) {
  const { points, segments } = sampleEntityWorldGeometry(entity, worldYOffset);
  if (points.length === 0) return false;

  const projPts = points.map((p) => projectPointToViewport(p, camera, width, height));
  const insideList = projPts.map((pt) => pt.visible && pointInsideFn(pt));
  const allInside = insideList.length > 0 && insideList.every(Boolean);
  const anyInside = insideList.some(Boolean);

  const checkAnySegment = (fn) =>
    segments.some(([a, b]) => {
      const pa = projectPointToViewport(a, camera, width, height);
      const pb = projectPointToViewport(b, camera, width, height);
      if (!pa.visible && !pb.visible) return false;
      return fn(pa, pb);
    });

  if (containment === 'enclosed' || containment === 'inside') {
    return allInside && (!segCrossesBorderFn || !checkAnySegment(segCrossesBorderFn));
  }

  if (containment === 'outside') {
    return !anyInside && !checkAnySegment(segIntersectsRegionFn);
  }

  if (containment === 'crossing_strict') {
    return (segCrossesBorderFn ? checkAnySegment(segCrossesBorderFn) : checkAnySegment(segIntersectsRegionFn)) || (anyInside && !allInside);
  }

  // 'in_cross' / 'crossing' (default Mastercam C+: inside OR crossing OR encloses seed)
  if (anyInside || checkAnySegment(segIntersectsRegionFn)) return true;

  const cat = getCustomEntityCategory(entity);
  if (enclosingSeedPt && (cat === 'surface' || cat === 'solid')) {
    let sMinX = Infinity, sMaxX = -Infinity, sMinY = Infinity, sMaxY = -Infinity;
    projPts.forEach((p) => {
      if (!p.visible) return;
      if (p.x < sMinX) sMinX = p.x;
      if (p.x > sMaxX) sMaxX = p.x;
      if (p.y < sMinY) sMinY = p.y;
      if (p.y > sMaxY) sMaxY = p.y;
    });
    if (enclosingSeedPt.x >= sMinX && enclosingSeedPt.x <= sMaxX && enclosingSeedPt.y >= sMinY && enclosingSeedPt.y <= sMaxY) {
      return true;
    }
  }
  return false;
}

/**
 * Evaluates which CAD entities match a screen-space marquee rectangle.
 * Supports containment modes: 'enclosed' | 'inside' | 'in_cross' | 'crossing' | 'crossing_strict' | 'outside'.
 */
export function hitTestEntitiesInMarquee(entities = [], camera, width, height, marqueeRect, options = {}) {
  const {
    mode = 'enclosed',
    worldYOffset = 49,
    mask = 'all',
    solidFilter = 'all',
    layerVisibility = null
  } = options;

  if (!camera || !marqueeRect || width <= 0 || height <= 0) return [];

  const normRect = {
    minX: Math.min(marqueeRect.minX, marqueeRect.maxX),
    maxX: Math.max(marqueeRect.minX, marqueeRect.maxX),
    minY: Math.min(marqueeRect.minY, marqueeRect.maxY),
    maxY: Math.max(marqueeRect.minY, marqueeRect.maxY)
  };
  const rectMid = {
    x: (normRect.minX + normRect.maxX) * 0.5,
    y: (normRect.minY + normRect.maxY) * 0.5
  };
  const rectBorders = [
    [{ x: normRect.minX, y: normRect.minY }, { x: normRect.maxX, y: normRect.minY }],
    [{ x: normRect.maxX, y: normRect.minY }, { x: normRect.maxX, y: normRect.maxY }],
    [{ x: normRect.maxX, y: normRect.maxY }, { x: normRect.minX, y: normRect.maxY }],
    [{ x: normRect.minX, y: normRect.maxY }, { x: normRect.minX, y: normRect.minY }]
  ];

  return filterSelectableEntities(entities, { mask, solidFilter, layerVisibility }).filter((entity) =>
    evaluateProjectedContainment(entity, camera, width, height, {
      worldYOffset,
      containment: mode,
      pointInsideFn: (pt) => pointInRect2D(pt, normRect),
      segIntersectsRegionFn: (pa, pb) => segmentIntersectsRect2D(pa.x, pa.y, pb.x, pb.y, normRect),
      segCrossesBorderFn: (pa, pb) => rectBorders.some(([e1, e2]) => segmentsIntersect2D(pa.x, pa.y, pb.x, pb.y, e1.x, e1.y, e2.x, e2.y)),
      enclosingSeedPt: rectMid
    })
  );
}

/**
 * Evaluates which CAD entities match a screen-space Polygon lasso.
 */
export function hitTestEntitiesInPolygon(entities = [], camera, width, height, polyPoints = [], options = {}) {
  const {
    mode = 'in_cross',
    worldYOffset = 49,
    mask = 'all',
    solidFilter = 'all',
    layerVisibility = null
  } = options;

  if (!camera || !Array.isArray(polyPoints) || polyPoints.length < 3 || width <= 0 || height <= 0) {
    return [];
  }

  const centroid = polyPoints.reduce(
    (acc, p) => ({ x: acc.x + p.x / polyPoints.length, y: acc.y + p.y / polyPoints.length }),
    { x: 0, y: 0 }
  );

  const polyEdges = polyPoints.map((p, i) => [p, polyPoints[(i + 1) % polyPoints.length]]);

  return filterSelectableEntities(entities, { mask, solidFilter, layerVisibility }).filter((entity) =>
    evaluateProjectedContainment(entity, camera, width, height, {
      worldYOffset,
      containment: mode,
      pointInsideFn: (pt) => pointInPolygon2D(pt.x, pt.y, polyPoints),
      segIntersectsRegionFn: (pa, pb) =>
        pointInPolygon2D(pa.x, pa.y, polyPoints) ||
        pointInPolygon2D(pb.x, pb.y, polyPoints) ||
        polyEdges.some(([e1, e2]) => segmentsIntersect2D(pa.x, pa.y, pb.x, pb.y, e1.x, e1.y, e2.x, e2.y)),
      segCrossesBorderFn: (pa, pb) =>
        polyEdges.some(([e1, e2]) => segmentsIntersect2D(pa.x, pa.y, pb.x, pb.y, e1.x, e1.y, e2.x, e2.y)),
      enclosingSeedPt: centroid
    })
  );
}

/**
 * Evaluates which CAD entities intersect a 2D Vector ray segment [p1 -> p2], sorted in crossing order along the vector.
 */
export function hitTestEntitiesByVector(entities = [], camera, width, height, p1, p2, options = {}) {
  const {
    tolerancePx = 7,
    worldYOffset = 49,
    mask = 'all',
    solidFilter = 'all',
    layerVisibility = null
  } = options;

  if (!camera || !p1 || !p2 || width <= 0 || height <= 0) return [];
  const vx = p2.x - p1.x;
  const vy = p2.y - p1.y;
  const vLenSq = vx * vx + vy * vy;
  if (vLenSq < 1) return [];

  const matched = [];
  filterSelectableEntities(entities, { mask, solidFilter, layerVisibility }).forEach((entity) => {
    const { points, segments } = sampleEntityWorldGeometry(entity, worldYOffset);
    let bestT = Infinity;

    segments.forEach(([a, b]) => {
      const sa = projectPointToViewport(a, camera, width, height);
      const sb = projectPointToViewport(b, camera, width, height);
      if (!sa.visible && !sb.visible) return;
      if (segmentsIntersect2D(p1.x, p1.y, p2.x, p2.y, sa.x, sa.y, sb.x, sb.y)) {
        const midX = (sa.x + sb.x) * 0.5;
        const midY = (sa.y + sb.y) * 0.5;
        const t = Math.max(0, Math.min(1, ((midX - p1.x) * vx + (midY - p1.y) * vy) / vLenSq));
        if (t < bestT) bestT = t;
      }
    });

    if (!Number.isFinite(bestT)) {
      points.forEach((pt) => {
        const sp = projectPointToViewport(pt, camera, width, height);
        if (!sp.visible) return;
        const d = distToSegment2D(sp.x, sp.y, p1.x, p1.y, p2.x, p2.y);
        if (d <= tolerancePx) {
          const t = Math.max(0, Math.min(1, ((sp.x - p1.x) * vx + (sp.y - p1.y) * vy) / vLenSq));
          if (t < bestT) bestT = t;
        }
      });
    }

    if (Number.isFinite(bestT)) {
      matched.push({ entity, t: bestT });
    }
  });

  matched.sort((a, b) => a.t - b.t);
  return matched.map((m) => m.entity);
}

/**
 * Area Selection: finds the tightest closed contour loop (single closed shape or connected chain) enclosing the clicked screen point.
 */
export function hitTestEntitiesByArea(entities = [], camera, width, height, screenPt, options = {}) {
  const {
    worldYOffset = 49,
    mask = 'all',
    solidFilter = 'all',
    layerVisibility = null
  } = options;

  if (!camera || !screenPt || width <= 0 || height <= 0) return [];

  const filtered = filterSelectableEntities(entities, { mask, solidFilter, layerVisibility });
  const candidateLoops = [];
  const seenChainKeys = new Set();

  filtered.forEach((entity) => {
    const cat = getCustomEntityCategory(entity);
    if (cat === 'surface' || cat === 'solid' || cat === 'point') return;
    const { points: worldPts } = sampleEntityWorldGeometry(entity, worldYOffset);
    if (worldPts.length >= 3 && worldPts[0].distanceTo(worldPts[worldPts.length - 1]) < 0.8) {
      const id = getCustomEntityId(entity);
      seenChainKeys.add(id);
      candidateLoops.push({ pts3d: worldPts, entities: [entity] });
      return;
    }

    const chain = buildChainFromEntity(entity, filtered, { method: 'chain', planeMode: '3d' });
    if (chain?.isClosed && Array.isArray(chain.points) && chain.points.length >= 3) {
      const ids = Array.isArray(chain.sourceEntityIds) ? chain.sourceEntityIds : [getCustomEntityId(entity)];
      const key = [...ids].sort().join('|');
      if (!seenChainKeys.has(key)) {
        seenChainKeys.add(key);
        const loopEntities = filtered.filter((ent) => {
          const eid = getCustomEntityId(ent);
          return ids.includes(eid) || ids.includes(ent.uuid) || ids.includes(ent.name);
        });
        if (loopEntities.length > 0) {
          const chainWorldPts = chain.points.map((p) => new THREE.Vector3(p.x, p.y + worldYOffset, p.z));
          candidateLoops.push({ pts3d: chainWorldPts, entities: loopEntities });
        }
      }
    }
  });

  let bestLoop = null;
  let bestArea = Infinity;

  candidateLoops.forEach((loop) => {
    const screenPoly = loop.pts3d
      .map((worldP) => projectPointToViewport(worldP, camera, width, height))
      .filter((sp) => sp.visible);

    if (screenPoly.length < 3) return;
    if (pointInPolygon2D(screenPt.x, screenPt.y, screenPoly)) {
      const area = polygonArea2D(screenPoly);
      if (area > 4 && area < bestArea) {
        bestArea = area;
        bestLoop = loop.entities;
      }
    }
  });

  if (bestLoop) return bestLoop;

  // Fallback to surface/solid face under cursor
  const direct = hitTestEntityAtScreenPoint(filtered, camera, screenPt, width, height, {
    worldYOffset,
    mask,
    solidFilter,
    layerVisibility
  });
  return direct ? [direct] : [];
}

/**
 * Chain Selection: picks the closest wireframe entity under the cursor and expands all connected chain members.
 */
export function hitTestChainAtScreenPoint(entities = [], camera, width, height, screenPt, options = {}) {
  const {
    tolerancePx = 11,
    worldYOffset = 49,
    mask = 'all',
    solidFilter = 'all',
    planeMode = '3d',
    layerVisibility = null
  } = options;

  const filtered = filterSelectableEntities(entities, { mask, solidFilter, layerVisibility });
  const seed = hitTestEntityAtScreenPoint(filtered, camera, screenPt, width, height, {
    tolerancePx,
    worldYOffset,
    mask,
    solidFilter,
    layerVisibility
  });
  if (!seed) return [];

  const chain = buildChainFromEntity(seed, filtered, { method: 'chain', planeMode });
  if (!chain || !Array.isArray(chain.sourceEntityIds) || chain.sourceEntityIds.length === 0) {
    return [seed];
  }

  const members = filtered.filter((ent) => {
    const eid = getCustomEntityId(ent);
    return (
      chain.sourceEntityIds.includes(eid) ||
      chain.sourceEntityIds.includes(ent.uuid) ||
      chain.sourceEntityIds.includes(ent.name)
    );
  });
  return members.length > 0 ? members : [seed];
}

/**
 * Picks the closest single CAD entity under a viewport CSS pixel coordinate (curves, points, and surfaces).
 */
export function hitTestEntityAtScreenPoint(entities = [], camera, screenPt, width, height, options = {}) {
  const {
    tolerancePx = 11,
    worldYOffset = 49,
    mask = 'all',
    solidFilter = 'all',
    layerVisibility = null
  } = options;

  if (!camera || !screenPt || width <= 0 || height <= 0) return null;

  const visibleEntities = filterSelectableEntities(entities, { mask, solidFilter, layerVisibility });

  // 1. Highest priority: crisp curve/point distance pick
  let bestWire = null;
  let bestDist = tolerancePx;

  visibleEntities.forEach((entity) => {
    const cat = getCustomEntityCategory(entity);
    if (cat === 'surface' || cat === 'solid') return;
    const { points, segments } = sampleEntityWorldGeometry(entity, worldYOffset);

    points.forEach((pt) => {
      const sp = projectPointToViewport(pt, camera, width, height);
      if (!sp.visible) return;
      const d = Math.hypot(screenPt.x - sp.x, screenPt.y - sp.y);
      if (d < bestDist) {
        bestDist = d;
        bestWire = entity;
      }
    });

    segments.forEach(([a, b]) => {
      const sa = projectPointToViewport(a, camera, width, height);
      const sb = projectPointToViewport(b, camera, width, height);
      if (!sa.visible && !sb.visible) return;
      const d = distToSegment2D(screenPt.x, screenPt.y, sa.x, sa.y, sb.x, sb.y);
      if (d < bestDist) {
        bestDist = d;
        bestWire = entity;
      }
    });
  });

  if (bestWire) return bestWire;

  // 2. Fallback: Three.js Raycaster against extruded surfaces / custom solids (in world Y = +worldYOffset)
  const ndc = new THREE.Vector2(
    (screenPt.x / width) * 2 - 1,
    -(screenPt.y / height) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(ndc, camera);

  let closestSurface = null;
  let closestRayDist = Infinity;

  visibleEntities.forEach((entity) => {
    const cat = getCustomEntityCategory(entity);
    if (cat !== 'surface' && cat !== 'solid') return;
    const meshes = [];
    entity.updateMatrixWorld?.(true);
    entity.traverse((child) => {
      if (child.isMesh) meshes.push(child);
    });
    if (meshes.length === 0) return;

    const entityRaycaster = entity.parent || !worldYOffset
      ? raycaster
      : (() => {
          const r = new THREE.Raycaster();
          r.ray.copy(raycaster.ray);
          r.ray.origin.y -= worldYOffset;
          return r;
        })();

    const hits = entityRaycaster.intersectObjects(meshes, false);
    if (hits.length > 0 && hits[0].distance < closestRayDist) {
      closestRayDist = hits[0].distance;
      closestSurface = entity;
    }
  });

  return closestSurface;
}

/**
 * Clones and applies a 3D matrix transform cleanly to any CAD entity (wireframes, points, surfaces, solids),
 * keeping both Three.js geometry/transforms and userData geometry fields synchronized.
 */
export function transformCustomEntityClone(entity, matrix4, options = {}) {
  if (!entity || !matrix4) return null;
  const { preserveName = false, suffix = '' } = options;

  const clone = entity.clone(true);
  clone.userData = { ...(entity.userData || {}) };

  const transformVecObj = (v) => {
    const vec = new THREE.Vector3(v.x || 0, v.y || 0, v.z || 0).applyMatrix4(matrix4);
    return { x: Number(vec.x.toFixed(4)), y: Number(vec.y.toFixed(4)), z: Number(vec.z.toFixed(4)) };
  };

  const transformNodeMetadata = (node) => {
    if (!node.userData) return;
    const ud = { ...node.userData };
    if (Array.isArray(ud.points)) {
      ud.points = ud.points.map((p) => {
        const v = new THREE.Vector3(p.x || 0, p.y || 0, p.z || 0).applyMatrix4(matrix4);
        return new THREE.Vector3(Number(v.x.toFixed(4)), Number(v.y.toFixed(4)), Number(v.z.toFixed(4)));
      });
    }
    if (ud.center) ud.center = transformVecObj(ud.center);
    if (ud.p1) ud.p1 = transformVecObj(ud.p1);
    if (ud.p2) ud.p2 = transformVecObj(ud.p2);
    if (ud.radius && matrix4) {
      const sVec = new THREE.Vector3();
      matrix4.decompose(new THREE.Vector3(), new THREE.Quaternion(), sVec);
      const avgXZ = (Math.abs(sVec.x) + Math.abs(sVec.z)) * 0.5;
      if (Math.abs(avgXZ - 1) > 1e-4) {
        ud.radius = Number((ud.radius * avgXZ).toFixed(4));
      }
    }
    node.userData = ud;
  };

  // Root wireframe line/curve at identity origin: bake into vertices so snap/chain/slice remain origin-consistent
  if ((clone.isLine || clone.isLineSegments) && clone.geometry?.attributes?.position) {
    clone.geometry = clone.geometry.clone();
    clone.updateMatrix();
    const fullM = matrix4.clone().multiply(clone.matrix);
    clone.geometry.applyMatrix4(fullM);
    clone.position.set(0, 0, 0);
    clone.rotation.set(0, 0, 0);
    clone.scale.set(1, 1, 1);
    clone.updateMatrix();
    transformNodeMetadata(clone);
  } else {
    // Group or Mesh (Extruded surfaces, solids, point markers, drafting)
    clone.traverse((child) => {
      if (child.geometry) child.geometry = child.geometry.clone();
      if (child.material && !Array.isArray(child.material)) {
        child.material = child.material.clone();
      }
      if (child !== clone) transformNodeMetadata(child);
    });
    clone.applyMatrix4(matrix4);
    transformNodeMetadata(clone);
  }

  delete clone.userData.customId;
  if (!preserveName) {
    clone.name = suffix ? `${entity.name || 'Entity'}_${suffix}` : `${entity.name || 'Entity'}_Copy`;
  }
  return clone;
}
