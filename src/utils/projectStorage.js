/**
 * Argus Mastercam Project Storage & Serialization Utility
 * Handles .mcam file packages, auto-save backups, and recent project history.
 */

import {
  createWireframeCircle,
  createWireframeRect,
  createWireframeLine,
  createPointMarker
} from './cadGeometry';

const AUTOSAVE_KEY = 'argus_cam_autosave_v1';
const RECENT_PROJECTS_KEY = 'argus_cam_recent_projects_v1';

/**
 * Serializes custom Three.js geometry entities (circles, rects, lines, drill points)
 * into a clean, JSON-serializable array for .mcam storage.
 */
export function serializeCustomGeometry(customGeometry = []) {
  if (!Array.isArray(customGeometry)) return [];
  return customGeometry.map((entity) => {
    if (!entity) return null;
    const ud = entity.userData || {};
    const cadType = ud.cadType || ud.type || 'wireframe';
    const hexColor = entity.material?.color?.getHex ? entity.material.color.getHex() : 0x1d4ed8;

    return {
      name: entity.name || `Wireframe_${cadType}`,
      uuid: entity.uuid || ud.customId || null,
      type: ud.type || cadType,
      cadType,
      radius: ud.radius !== undefined ? ud.radius : null,
      diameter: ud.diameter !== undefined ? ud.diameter : (ud.radius ? ud.radius * 2 : null),
      width: ud.width !== undefined ? ud.width : null,
      depth: ud.depth !== undefined ? ud.depth : (ud.height !== undefined ? ud.height : null),
      height: ud.height !== undefined ? ud.height : (ud.depth !== undefined ? ud.depth : null),
      center: ud.center ? { x: ud.center.x || 0, y: ud.center.y || 0, z: ud.center.z || 0 } : null,
      p1: ud.p1 ? { x: ud.p1.x || 0, y: ud.p1.y || 0, z: ud.p1.z || 0 } : null,
      p2: ud.p2 ? { x: ud.p2.x || 0, y: ud.p2.y || 0, z: ud.p2.z || 0 } : null,
      points: Array.isArray(ud.points)
        ? ud.points.map((p) => ({ x: p.x || 0, y: p.y || 0, z: p.z || 0 }))
        : null,
      position: {
        x: entity.position?.x || 0,
        y: entity.position?.y || 0,
        z: entity.position?.z || 0
      },
      color: hexColor
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
    let obj = null;
    const col = item.color || 0x1d4ed8;
    const pos = item.position || { x: 0, y: 0, z: 0 };
    const cadType = item.cadType || item.type || '';

    if (cadType === 'circle') {
      const cx = item.center?.x || pos.x || 0;
      const cz = item.center?.z || pos.z || 0;
      const y = item.center?.y || pos.y || 0;
      const r = item.radius || (item.diameter ? item.diameter / 2 : 25.0);
      obj = createWireframeCircle(r, y, [cx, cz], 0, 360, 'G17', { color: col, name: item.name });
    } else if (cadType === 'rect' || cadType === 'rectangle') {
      const cx = item.center?.x || pos.x || 0;
      const cz = item.center?.z || pos.z || 0;
      const y = item.center?.y || pos.y || 0;
      const w = item.width || 80.0;
      const d = item.depth || item.height || 50.0;
      obj = createWireframeRect(w, d, y, 0, [cx, cz], { color: col, name: item.name });
    } else if (cadType === 'line') {
      const p1 = item.p1 ? [item.p1.x, item.p1.y, item.p1.z] : [-25, 0, 0];
      const p2 = item.p2 ? [item.p2.x, item.p2.y, item.p2.z] : [25, 0, 0];
      obj = createWireframeLine(p1, p2, { color: col, name: item.name });
    } else if (cadType === 'drill' || cadType === 'datum_point' || item.name?.startsWith('Drill_')) {
      const p = item.position ? [item.position.x, item.position.y, item.position.z] : [pos.x, pos.y, pos.z];
      obj = createPointMarker(p, item.name || 'Drill_Point', col);
    }
    if (obj) {
      if (item.uuid) obj.uuid = item.uuid;
      if (obj.userData) {
        obj.userData.customId = item.uuid || obj.uuid;
        if (item.center) obj.userData.center = item.center;
        if (item.radius) obj.userData.radius = item.radius;
        if (item.width) obj.userData.width = item.width;
        if (item.depth) obj.userData.depth = item.depth;
        if (item.points) obj.userData.points = item.points;
      }
    }
    return obj;
  }).filter(Boolean);
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
