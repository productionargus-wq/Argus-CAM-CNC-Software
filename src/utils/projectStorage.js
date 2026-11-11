/**
 * Argus Mastercam Project Storage & Serialization Utility
 * Handles .mcam file packages, auto-save backups, and recent project history.
 */

import * as THREE from 'three';
import {
  createWireframeCircle,
  createWireframeRect,
  createWireframeLine,
  createWireframeArc,
  createWireframeSpline,
  createPointMarker,
  createParametricChainExtrusion,
  createExtrudedSurface
} from './cadGeometry.js';

const AUTOSAVE_KEY = 'argus_cam_autosave_v1';
const RECENT_PROJECTS_KEY = 'argus_cam_recent_projects_v1';

const PARAMETRIC_CAD_TYPES = new Set([
  'circle',
  'arc',
  'rect',
  'rectangle',
  'line',
  'spline',
  'drill',
  'datum_point',
  'surface_extrusion'
]);

function countObjectVertices(obj) {
  let count = 0;
  if (!obj?.traverse) return 0;
  obj.traverse((node) => {
    const posAttr = node.geometry?.attributes?.position;
    if (posAttr?.count) count += posAttr.count;
  });
  return count;
}

/**
 * Serializes custom Three.js geometry entities (circles, rects, lines, drill points, surfaces, solids)
 * into a clean, JSON-serializable array for .mcam and IndexedDB storage.
 */
export function serializeCustomGeometry(customGeometry = []) {
  if (!Array.isArray(customGeometry)) return [];
  return customGeometry.map((entity) => {
    if (!entity) return null;
    const ud = entity.userData && Object.keys(entity.userData).length > 0 ? entity.userData : entity;
    const rawType = ud.cadType || ud.type || entity.cadType || '';
    const cadType = ['Line', 'Group', 'Mesh', 'Object3D'].includes(rawType)
      ? (entity.name?.toLowerCase().includes('circle') ? 'circle'
        : entity.name?.toLowerCase().includes('rect') ? 'rect'
        : entity.name?.toLowerCase().includes('line') ? 'line'
        : entity.name?.toLowerCase().includes('arc') ? 'arc'
        : entity.name?.toLowerCase().includes('drill') ? 'drill'
        : 'wireframe')
      : (rawType || (entity.name?.startsWith('Surface_Extrude_') ? 'surface_extrusion' : 'wireframe'));

    let hexColor = entity.material?.color?.getHex
      ? entity.material.color.getHex()
      : (typeof entity.color === 'number' ? entity.color : (typeof ud.color === 'number' ? ud.color : 0x1d4ed8));
    if (hexColor === 0x1d4ed8 && cadType === 'surface_extrusion') {
      hexColor = 0x22d3ee;
    }

    const centerVal = ud.center || entity.center;
    const normCenter = Array.isArray(centerVal)
      ? { x: centerVal[0] || 0, y: centerVal[1] || 0, z: centerVal[2] || 0 }
      : (centerVal ? { x: centerVal.x || 0, y: centerVal.y || 0, z: centerVal.z || 0 } : null);

    const hasNonTrivialTransform =
      Math.abs(entity.rotation?.x || 0) > 1e-5 ||
      Math.abs(entity.rotation?.y || 0) > 1e-5 ||
      Math.abs(entity.rotation?.z || 0) > 1e-5 ||
      Math.abs((entity.scale?.x ?? 1) - 1) > 1e-5 ||
      Math.abs((entity.scale?.y ?? 1) - 1) > 1e-5 ||
      Math.abs((entity.scale?.z ?? 1) - 1) > 1e-5;

    const canReconstructParametrically =
      PARAMETRIC_CAD_TYPES.has(cadType) &&
      (cadType !== 'surface_extrusion' || (Array.isArray(ud.chains) && ud.chains.length > 0 && ud.params));

    let object3dJson = null;
    if ((!canReconstructParametrically || hasNonTrivialTransform) && typeof entity.toJSON === 'function') {
      try {
        if (countObjectVertices(entity) <= 50000) {
          object3dJson = entity.toJSON();
        }
      } catch (err) {
        console.warn('Skipped Three.js toJSON serialization for custom entity:', entity.name, err);
      }
    }

    return {
      name: entity.name || `Wireframe_${cadType}`,
      uuid: entity.uuid || ud.customId || null,
      customId: ud.customId || entity.uuid || null,
      type: ud.type || cadType,
      cadType,
      visible: entity.visible !== false,
      isBlanked: Boolean(ud.isBlanked || entity.visible === false),
      radius: ud.radius !== undefined ? ud.radius : (entity.radius ?? null),
      diameter: ud.diameter !== undefined ? ud.diameter : (ud.radius ? ud.radius * 2 : (entity.diameter ?? null)),
      width: ud.width !== undefined ? ud.width : (entity.width ?? null),
      depth: ud.depth !== undefined ? ud.depth : (ud.height !== undefined ? ud.height : (entity.depth ?? entity.height ?? null)),
      height: ud.height !== undefined ? ud.height : (ud.depth !== undefined ? ud.depth : (entity.height ?? entity.depth ?? null)),
      filletRadius: ud.filletRadius ?? entity.filletRadius ?? 0,
      startAngleDeg: ud.startAngleDeg ?? entity.startAngleDeg ?? 0,
      endAngleDeg: ud.endAngleDeg ?? entity.endAngleDeg ?? 360,
      controlPoints: ud.controlPoints || entity.controlPoints || null,
      center: normCenter,
      p1: ud.p1 || entity.p1 ? { x: (ud.p1 || entity.p1).x || 0, y: (ud.p1 || entity.p1).y || 0, z: (ud.p1 || entity.p1).z || 0 } : null,
      p2: ud.p2 || entity.p2 ? { x: (ud.p2 || entity.p2).x || 0, y: (ud.p2 || entity.p2).y || 0, z: (ud.p2 || entity.p2).z || 0 } : null,
      points: Array.isArray(ud.points || entity.points)
        ? (ud.points || entity.points).map((p) => Array.isArray(p)
            ? { x: p[0] || 0, y: p[1] || 0, z: p[2] || 0 }
            : { x: p.x || 0, y: p.y || 0, z: p.z || 0 })
        : null,
      position: {
        x: entity.position?.x || 0,
        y: entity.position?.y || 0,
        z: entity.position?.z || 0
      },
      rotation: {
        x: entity.rotation?.x || 0,
        y: entity.rotation?.y || 0,
        z: entity.rotation?.z || 0
      },
      scale: {
        x: entity.scale?.x ?? 1,
        y: entity.scale?.y ?? 1,
        z: entity.scale?.z ?? 1
      },
      chains: Array.isArray(ud.chains || entity.chains) ? (ud.chains || entity.chains) : null,
      extrudeParams: ud.params || entity.extrudeParams || null,
      surfaceRole: ud.surfaceRole || ud.role || entity.surfaceRole || null,
      color: hexColor,
      object3dJson
    };
  }).filter(Boolean);
}

/**
 * Reconstructs interactive Three.js wireframe entities from serialized JSON data.
 */
export function deserializeCustomGeometry(serializedList = []) {
  if (!Array.isArray(serializedList)) return [];
  return serializedList.map((item) => {
    if (!item) return null;
    if (typeof item.clone === 'function' && item.isObject3D) return item;

    let obj = null;
    const ud = item.userData || {};
    const col = item.color || ud.color || 0x38bdf8;
    const pos = item.position || { x: 0, y: 0, z: 0 };
    const rawType = item.cadType || ud.cadType || ud.type || (['Line', 'Group', 'Mesh', 'Object3D'].includes(item.type) ? '' : item.type) || '';
    const cadType = rawType || (item.name?.toLowerCase().includes('circle') ? 'circle'
      : item.name?.toLowerCase().includes('rect') ? 'rect'
      : item.name?.toLowerCase().includes('line') ? 'line'
      : item.name?.toLowerCase().includes('arc') ? 'arc'
      : (item.name?.startsWith('Drill_') ? 'drill' : ''));

    const centerRaw = item.center || ud.center;
    const centerObj = Array.isArray(centerRaw)
      ? { x: centerRaw[0] || 0, y: centerRaw[1] || 0, z: centerRaw[2] || 0 }
      : centerRaw;

    if (item.object3dJson) {
      try {
        obj = new THREE.ObjectLoader().parse(item.object3dJson);
      } catch (err) {
        console.warn('Failed to parse Object3D JSON for custom entity, falling back to parametric rebuild:', item.name, err);
      }
    }

    if (!obj) {
      if (cadType === 'circle') {
        const cx = centerObj?.x ?? pos.x ?? 0;
        const cz = centerObj?.z ?? pos.z ?? 0;
        const y = centerObj?.y ?? pos.y ?? 0;
        const r = item.radius ?? ud.radius ?? (item.diameter ? item.diameter / 2 : 25.0);
        obj = createWireframeCircle(r, y, [cx, cz], 0, 360, 'G17', { color: col, name: item.name });
      } else if (cadType === 'arc') {
        const cx = centerObj?.x ?? pos.x ?? 0;
        const cy = centerObj?.y ?? pos.y ?? 0;
        const cz = centerObj?.z ?? pos.z ?? 0;
        const r = item.radius ?? ud.radius ?? 25.0;
        const sAngle = item.startAngleDeg ?? ud.startAngleDeg ?? 0;
        const eAngle = item.endAngleDeg ?? ud.endAngleDeg ?? 180;
        obj = createWireframeArc([cx, cy, cz], r, sAngle, eAngle, { color: col, name: item.name });
      } else if (cadType === 'rect' || cadType === 'rectangle') {
        const cx = centerObj?.x ?? pos.x ?? 0;
        const cz = centerObj?.z ?? pos.z ?? 0;
        const y = centerObj?.y ?? pos.y ?? 0;
        const w = item.width ?? ud.width ?? 80.0;
        const d = item.depth ?? item.height ?? ud.depth ?? ud.height ?? 50.0;
        const fr = item.filletRadius ?? ud.filletRadius ?? 0;
        obj = createWireframeRect(w, d, y, fr, [cx, cz], { color: col, name: item.name });
      } else if (cadType === 'line') {
        const p1Raw = item.p1 || ud.p1;
        const p2Raw = item.p2 || ud.p2;
        const p1 = p1Raw ? [p1Raw.x || 0, p1Raw.y || 0, p1Raw.z || 0] : [-25, 0, 0];
        const p2 = p2Raw ? [p2Raw.x || 0, p2Raw.y || 0, p2Raw.z || 0] : [25, 0, 0];
        obj = createWireframeLine(p1, p2, { color: col, name: item.name });
      } else if (cadType === 'spline') {
        const ctrl = item.controlPoints || ud.controlPoints;
        if (Array.isArray(ctrl) && ctrl.length >= 2) {
          obj = createWireframeSpline(ctrl, { color: col, name: item.name });
        }
      } else if (cadType === 'drill' || cadType === 'datum_point' || item.name?.startsWith('Drill_')) {
        const coordsRaw = ud.coords || item.coords;
        const p = Array.isArray(coordsRaw)
          ? coordsRaw
          : [pos.x || 0, pos.y || 0, pos.z || 0];
        obj = createPointMarker(p, item.name || 'Drill_Point', col);
      } else if (cadType === 'surface_extrusion' || item.name?.startsWith('Surface_Extrude_')) {
        const savedChains = item.chains || ud.chains;
        const savedParams = item.extrudeParams || ud.params;
        if (Array.isArray(savedChains) && savedChains.length > 0 && savedParams) {
          obj = createParametricChainExtrusion(savedChains, savedParams, {
            name: item.name,
            color: col && col !== 0x1d4ed8 ? col : 0x22d3ee
          });
        } else {
          obj = createExtrudedSurface(
            item.width ?? ud.width ?? 60,
            item.depth ?? ud.depth ?? 40,
            item.height ?? ud.height ?? 30,
            pos.y || 0,
            [pos.x || 0, pos.z || 0],
            { name: item.name, role: item.surfaceRole || ud.surfaceRole || 'drive' }
          );
        }
      }

      if (obj) {
        if (item.position && (Math.abs(item.position.x || 0) > 1e-6 || Math.abs(item.position.y || 0) > 1e-6 || Math.abs(item.position.z || 0) > 1e-6)) {
          if (Math.hypot(obj.position.x, obj.position.y, obj.position.z) < 1e-6 && cadType !== 'circle' && cadType !== 'rect' && cadType !== 'line' && cadType !== 'arc') {
            obj.position.set(item.position.x || 0, item.position.y || 0, item.position.z || 0);
          }
        }
        if (item.rotation) {
          obj.rotation.set(item.rotation.x || 0, item.rotation.y || 0, item.rotation.z || 0);
        }
        if (item.scale) {
          obj.scale.set(item.scale.x ?? 1, item.scale.y ?? 1, item.scale.z ?? 1);
        }
      }
    }

    if (obj) {
      if (item.uuid) obj.uuid = item.uuid;
      const isBlanked = Boolean(item.isBlanked || item.visible === false);
      obj.visible = !isBlanked;
      if (obj.userData) {
        obj.userData.customId = item.customId || item.uuid || obj.uuid;
        obj.userData.isBlanked = isBlanked;
        if (centerObj) obj.userData.center = centerObj;
        if (item.radius ?? ud.radius) obj.userData.radius = item.radius ?? ud.radius;
        if (item.width ?? ud.width) obj.userData.width = item.width ?? ud.width;
        if (item.depth ?? ud.depth) obj.userData.depth = item.depth ?? ud.depth;
        if (item.points || ud.points) obj.userData.points = item.points || ud.points;
      }
    }
    return obj;
  }).filter((o) => o && typeof o.clone === 'function');
}

/**
 * Serializes and triggers direct browser download of the active .mcam project
 */
export function exportProjectMCAM(projectState, filename = "Project.mcam") {
  const safeFilename = filename.endsWith('.mcam') ? filename : `${filename}.mcam`;
  
  const payload = {
    schemaVersion: "Argus-Mastercam-2026-v1.0",
    savedAt: new Date().toISOString(),
    filename: safeFilename,
    projectName: projectState.projectName || safeFilename,
    stockConfig: projectState.stockConfig,
    tools: projectState.tools,
    operations: projectState.operations,
    customGeometry: Array.isArray(projectState.customGeometry) && projectState.customGeometry.length > 0 && typeof projectState.customGeometry[0].userData !== 'undefined'
      ? serializeCustomGeometry(projectState.customGeometry)
      : (projectState.customGeometry || []),
    partMetrics: projectState.partMetrics || null,
    solidsList: projectState.solidsList || [],
    activeMachine: projectState.activeMachine,
    activeWcs: projectState.activeWcs,
    workpieceColor: projectState.workpieceColor,
    partTransform: projectState.partTransform,
    customGeometryNotes: projectState.customGeometryNotes || []
  };

  const dataStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Record in recent projects
  recordRecentProject({
    filename: safeFilename,
    projectName: payload.projectName,
    savedAt: payload.savedAt,
    machine: projectState.activeMachine?.name || 'DMG MORI DMU 50',
    opsCount: projectState.operations?.length || 0,
    toolsCount: projectState.tools?.length || 0
  });
}

/**
 * Reads and parses user-uploaded .mcam file
 */
export async function parseProjectMCAM(file) {
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    if (!data.operations && !data.tools) {
      throw new Error("Invalid .mcam file schema: Missing operations or tool library data.");
    }
    return data;
  } catch (err) {
    console.error("Failed to parse .mcam project file:", err);
    throw new Error(`Invalid .mcam project file: ${err.message}`);
  }
}

/**
 * Saves a timestamped auto-save snapshot into localStorage
 */
export function saveAutoSaveSnapshot(projectState) {
  try {
    const payload = {
      timestamp: new Date().toISOString(),
      projectName: projectState.projectName,
      stockConfig: projectState.stockConfig,
      tools: projectState.tools,
      operations: projectState.operations,
      customGeometry: Array.isArray(projectState.customGeometry) && projectState.customGeometry.length > 0 && typeof projectState.customGeometry[0].userData !== 'undefined'
        ? serializeCustomGeometry(projectState.customGeometry)
        : (projectState.customGeometry || []),
      partMetrics: projectState.partMetrics || null,
      solidsList: projectState.solidsList || [],
      activeMachine: projectState.activeMachine,
      activeWcs: projectState.activeWcs,
      workpieceColor: projectState.workpieceColor,
      partTransform: projectState.partTransform
    };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("Auto-save failed to write to localStorage:", err);
  }
}

/**
 * Retrieves the auto-save snapshot from localStorage
 */
export function getAutoSaveSnapshot() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read auto-save:", err);
    return null;
  }
}

/**
 * Checks if a valid auto-save snapshot exists
 */
export function hasAutoSaveSnapshot() {
  return Boolean(localStorage.getItem(AUTOSAVE_KEY));
}

/**
 * Clears auto-save snapshot
 */
export function clearAutoSaveSnapshot() {
  localStorage.removeItem(AUTOSAVE_KEY);
}

/**
 * Retrieves recent projects list
 */
export function getRecentProjects() {
  try {
    const raw = localStorage.getItem(RECENT_PROJECTS_KEY);
    if (!raw) {
      return [
        {
          filename: 'TITAN-1M_Mastercam_Benchmark.mcam',
          projectName: 'TITAN-1M Aerospace Benchmark Milling (Facing, Dynamic Mill, Contour, Pocket, Chamfer, Drill, Tap)',
          savedAt: new Date().toISOString(),
          machine: 'Haas VF-2 (3X VMC)',
          opsCount: 8,
          toolsCount: 5,
          sampleType: 'titan_1m'
        },
        {
          filename: 'Mastercam2019_Milling_Tutorial.mcam',
          projectName: 'Mastercam 2019 Milling Operations Tutorial (Face, Contour, Pocket, Drill)',
          savedAt: new Date().toISOString(),
          machine: 'Haas VF-2 (3X VMC)',
          opsCount: 5,
          toolsCount: 4,
          sampleType: 'mastercam2019_tutorial'
        },
        {
          filename: 'DMU50_5Axis_Impeller.mcam',
          projectName: '5-Axis Turbine Impeller',
          savedAt: new Date(Date.now() - 3600000).toISOString(),
          machine: 'DMG MORI DMU 50 (5X)',
          opsCount: 5,
          toolsCount: 5,
          sampleType: 'impeller'
        },
        {
          filename: 'DMU50_Aero_Bracket.mcam',
          projectName: 'Aerospace Structural Bracket',
          savedAt: new Date(Date.now() - 86400000).toISOString(),
          machine: 'Haas VF-2 (3X VMC)',
          opsCount: 4,
          toolsCount: 4,
          sampleType: 'bracket'
        },
        {
          filename: 'DMU50_Mold_Core.mcam',
          projectName: 'Precision Injection Mold Core',
          savedAt: new Date(Date.now() - 172800000).toISOString(),
          machine: 'DMG MORI DMU 50 (5X)',
          opsCount: 4,
          toolsCount: 3,
          sampleType: 'mold'
        }
      ];
    }
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

/**
 * Records a recent project entry
 */
export function recordRecentProject(record) {
  try {
    const list = getRecentProjects().filter((p) => p.filename !== record.filename);
    list.unshift(record);
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(list.slice(0, 10)));
  } catch (err) {
    console.warn("Failed to record recent project:", err);
  }
}
