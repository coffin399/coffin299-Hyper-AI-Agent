const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Future: expose APIs for file dialogs, notifications, etc.
});
