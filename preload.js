const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Backend configuration
  onBackendConfig: (callback) => {
    ipcRenderer.on('backend-config', (event, config) => callback(config));
  },
  
  // Settings management
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
});
