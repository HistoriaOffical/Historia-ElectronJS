const { ipcRenderer } = require('electron');

document.getElementById('minimize-btn').addEventListener('click', () => {
    ipcRenderer.send('minimize');
});

document.getElementById('maximize-btn').addEventListener('click', () => {
    ipcRenderer.send('toggle-maximize');
});

document.getElementById('close-btn').addEventListener('click', () => {
    ipcRenderer.send('close');
});

var windowTopBar = document.createElement('div')
windowTopBar.style.width = "100%"
windowTopBar.style.height = "32px"
windowTopBar.style.backgroundColor = "#000"
windowTopBar.style.position = "absolute"
windowTopBar.style.top = windowTopBar.style.left = 0
windowTopBar.style.webkitAppRegion = "drag"
document.body.appendChild(windowTopBar)
