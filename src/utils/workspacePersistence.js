/**
 * Argus Mastercam Workspace Persistence Engine
 * Uses browser IndexedDB to persist the active CAD model, CAM operations, tools,
 * stock setup, machine settings, and viewport states across page reloads (F5/refresh).
 */

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
 * Save current workspace session state into IndexedDB
 */
export async function saveWorkspaceSession(sessionData) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record = {
        ...sessionData,
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
