const { contextBridge } = require('electron');

// Expose safe desktop environment info and capabilities to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,
  version: process.versions.electron
});
