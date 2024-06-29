// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  log: (message) => ipcRenderer.send('log', message)
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('Renderer process loaded');
  ipcRenderer.send('log', 'Renderer process loaded');
});
