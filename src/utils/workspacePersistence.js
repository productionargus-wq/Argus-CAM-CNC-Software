/**
 * Argus Mastercam Workspace Persistence Engine
 * Uses browser IndexedDB to persist the active CAD model, CAM operations, tools,
 * stock setup, machine settings, and viewport states across page reloads (F5/refresh).
 */

import { serializeCustomGeometry } from './projectStorage';

const DB_NAME = 'ArgusMastercamWorkspaceDB';
const DB_VERSION = 1;
const STORE_NAME = 'active_session';
const SESSION_KEY = 'current_workspace';

/**
 * Open (or create) IndexedDB instance
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Safely strips non-cloneable Three.js closures, functions, DOM elements, and cyclic references
 * so IndexedDB's structuredClone will never throw DataCloneError.
 */
function sanitizeForIndexedDB(data) {
  if (!data || typeof data !== 'object') return data;

  const seen = new WeakSet();

  function clean(val, key = '') {
    if (val === null || val === undefined) return val;
    if (typeof val === 'function' || typeof val === 'symbol') return undefined;
    if (typeof val !== 'object') return val;

    // Filter out Three.js internal callbacks and circular references
    if (key === '_onChange' || key === '_onChangeCallback' || key.startsWith('__')) {
      return undefined;
    }

    if (seen.has(val)) return undefined;
    seen.add(val);

    // If it's a Three.js Vector3 or Euler
    if (val.isVector3 || val.isEuler) {
      return { x: val.x, y: val.y, z: val.z };
    }
    // If it's a Three.js Box3
    if (val.isBox3) {
      return {
        min: { x: val.min.x, y: val.min.y, z: val.min.z },
        max: { x: val.max.x, y: val.max.y, z: val.max.z }
      };
    }

    // If it's a Three.js Line, Mesh, or Object3D
    if (val.isObject3D) {
      return {
        uuid: val.uuid,
        name: val.name,
        type: val.type,
        userData: clean(val.userData),
        position: { x: val.position.x, y: val.position.y, z: val.position.z }
      };
    }

    if (Array.isArray(val)) {
      return val.map((item) => clean(item)).filter((item) => item !== undefined);
    }

    const out = {};
    for (const [k, v] of Object.entries(val)) {
      if (typeof v === 'function' || typeof v === 'symbol') continue;
      if (k === '_onChange' || k === '_onChangeCallback') continue;
      const cleaned = clean(v, k);
      if (cleaned !== undefined) {
        out[k] = cleaned;
      }
    }
    return out;
  }

  return clean(data);
}

/**
 * Save current workspace session state into IndexedDB
 */
export async function saveWorkspaceSession(sessionData) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const prepared = {
        ...sessionData,
        customGeometry: Array.isArray(sessionData?.customGeometry)
          ? serializeCustomGeometry(sessionData.customGeometry)
          : []
      };
      const safeData = sanitizeForIndexedDB(prepared) || {};
      const record = {
        ...safeData,
        savedAt: Date.now()
      };

      const putRequest = store.put(record, SESSION_KEY);

      putRequest.onsuccess = () => resolve(true);
      putRequest.onerror = () => {
        console.warn('Failed to save workspace session in IndexedDB:', putRequest.error);
        reject(putRequest.error);
      };

      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('Workspace persistence save error:', err);
    return false;
  }
}

/**
 * Load active workspace session from IndexedDB
 */
export async function loadWorkspaceSession() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get(SESSION_KEY);

      getRequest.onsuccess = () => {
        resolve(getRequest.result || null);
      };

      getRequest.onerror = () => {
        console.warn('Failed to read workspace session from IndexedDB:', getRequest.error);
        reject(getRequest.error);
      };

      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('Workspace persistence load error:', err);
    return null;
  }
}

/**
 * Clear the active workspace session (e.g. when user clicks File -> New Part)
 */
export async function clearWorkspaceSession() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const deleteRequest = store.delete(SESSION_KEY);

      deleteRequest.onsuccess = () => resolve(true);
      deleteRequest.onerror = () => reject(deleteRequest.error);

      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('Failed to clear workspace session in IndexedDB:', err);
    return false;
  }
}
