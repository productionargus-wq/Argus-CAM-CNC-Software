/**
 * Argus Mastercam Project Storage & Serialization Utility
 * Handles .mcam file packages, auto-save backups, and recent project history.
 */

const AUTOSAVE_KEY = 'argus_cam_autosave_v1';
const RECENT_PROJECTS_KEY = 'argus_cam_recent_projects_v1';

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
