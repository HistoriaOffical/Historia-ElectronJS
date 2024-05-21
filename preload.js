const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
    'electronAPI', {
        sendShutdown: () => ipcRenderer.send('shutdown')
    }
);
