import * as THREE from 'three';
import { extractPointsFromCadEntity } from './cadDrawingEngine.js';

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
 * Evaluates which CAD entities match a screen-space marquee rectangle.
 * - mode === 'enclosed': Window mode (L -> R drag) — requires every entity vertex inside box.
 * - mode === 'crossing': Crossing mode (R -> L drag) — matches if inside, intersected by box, or encloses box.
 */
export function hitTestEntitiesInMarquee(entities = [], camera, width, height, marqueeRect, options = {}) {
  const {
    mode = 'enclosed',
    worldYOffset = 49,
    mask = 'all',
    layerVisibility = null
  } = options;

  if (!camera || !marqueeRect || width <= 0 || height <= 0) return [];

  const normRect = {
    minX: Math.min(marqueeRect.minX, marqueeRect.maxX),
    maxX: Math.max(marqueeRect.minX, marqueeRect.maxX),
    minY: Math.min(marqueeRect.minY, marqueeRect.maxY),
    maxY: Math.max(marqueeRect.minY, marqueeRect.maxY)
  };
  const rectMidX = (normRect.minX + normRect.maxX) * 0.5;
  const rectMidY = (normRect.minY + normRect.maxY) * 0.5;

  const hits = [];
  entities.forEach((entity) => {
    if (!entity || !matchesSelectionMask(entity, mask)) return;
    const cat = getCustomEntityCategory(entity);
    if (layerVisibility) {
      const isSurf = cat === 'surface' || cat === 'solid';
      if (isSurf && layerVisibility.surfaces === false) return;
      if (!isSurf && layerVisibility.wireframe === false) return;
    }

    const { points, segments } = sampleEntityWorldGeometry(entity, worldYOffset);
    if (points.length === 0) return;

    const projPts = points.map((p) => projectPointToViewport(p, camera, width, height));

    if (mode === 'enclosed') {
      if (projPts.every((pt) => pointInRect2D(pt, normRect))) {
        hits.push(entity);
      }
      return;
    }

    // Crossing mode
    if (projPts.some((pt) => pointInRect2D(pt, normRect))) {
      hits.push(entity);
      return;
    }

    const crossed = segments.some(([a, b]) => {
      const pa = projectPointToViewport(a, camera, width, height);
      const pb = projectPointToViewport(b, camera, width, height);
      if (!pa.visible && !pb.visible) return false;
      return segmentIntersectsRect2D(pa.x, pa.y, pb.x, pb.y, normRect);
    });
    if (crossed) {
      hits.push(entity);
      return;
    }

    // Also match closed shapes whose projected silhouette completely surrounds the tiny crossing marquee
    if (cat === 'surface' || cat === 'solid') {
      let sMinX = Infinity, sMaxX = -Infinity, sMinY = Infinity, sMaxY = -Infinity;
      projPts.forEach((p) => {
        if (!p.visible) return;
        if (p.x < sMinX) sMinX = p.x;
        if (p.x > sMaxX) sMaxX = p.x;
        if (p.y < sMinY) sMinY = p.y;
        if (p.y > sMaxY) sMaxY = p.y;
      });
      if (rectMidX >= sMinX && rectMidX <= sMaxX && rectMidY >= sMinY && rectMidY <= sMaxY) {
        hits.push(entity);
      }
    }
  });

  return hits;
}

/**
 * Picks the closest single CAD entity under a viewport CSS pixel coordinate (curves, points, and surfaces).
 */
export function hitTestEntityAtScreenPoint(entities = [], camera, screenPt, width, height, options = {}) {
  const {
    tolerancePx = 11,
    worldYOffset = 49,
    mask = 'all',
    layerVisibility = null
  } = options;

  if (!camera || !screenPt || width <= 0 || height <= 0) return null;

  const visibleEntities = entities.filter((entity) => {
    if (!entity || !matchesSelectionMask(entity, mask)) return false;
    const cat = getCustomEntityCategory(entity);
    if (layerVisibility) {
      const isSurf = cat === 'surface' || cat === 'solid';
      if (isSurf && layerVisibility.surfaces === false) return false;
      if (!isSurf && layerVisibility.wireframe === false) return false;
    }
    return true;
  });

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
