const { app, BrowserWindow, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const { exec } = require('child_process');

let mainWindow;
let childProcess;

app.commandLine.appendSwitch('ignore-certificate-errors');
const isDev = process.argv.includes('--dev');

function detectOperatingSystem() {
  switch (process.platform) {
    case 'win32':
      return 'Windows';
    case 'darwin':
      return 'macOS';
    case 'linux':
      return 'Linux';
    default:
      return 'Unknown';
  }
}

function isDotnetInstalled(callback) {
  exec('dotnet --version', (error, stdout, stderr) => {
    if (error || stderr) {
      callback(false);
    } else {
      callback(true);
    }
  });
}

function loadMainProgram() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 1024,
    autoHideMenuBar: true,
  });

  if (isDev) {
    try {
      mainWindow.webContents.openDevTools();
      let configPath;
      const os = detectOperatingSystem();

      if (os === 'Windows') {
        configPath = path.join(__dirname, 'assets', 'HistoriaLocal', 'HistWeb.exe');
      } else if (os === "Linux") {
        configPath = path.join(__dirname, 'assets', 'HistoriaLocal', 'HistWeb');
      } else {
        configPath = path.join(__dirname, 'assets', 'HistoriaLocal', 'HistWeb.dll');
      }

      childProcess = spawn(configPath, { cwd: os === 'Linux' ? path.join(__dirname, 'assets', 'HistoriaLocal') : undefined });

      childProcess.stdout.on('data', (data) => {
        console.log(`Child process stdout: ${data}`);
      });

      childProcess.stderr.on('data', (data) => {
        console.error(`Child process stderr: ${data}`);
      });

      childProcess.on('exit', (code) => {
        console.log(`Child process exited with code ${code}`);
      });
    } catch (e) {
      console.error("ERROR:", e);
    }
  } else {
    try {
      let configPath;
      const os = detectOperatingSystem();

      if (os === 'Windows') {
        configPath = path.join(path.dirname(__dirname), 'HistoriaLocal', 'HistWeb.exe');
      } else if (os === "Linux") {
        configPath = path.join(path.dirname(__dirname), 'HistoriaLocal', 'HistWeb');
      } else {
        configPath = path.join(path.dirname(__dirname), 'HistoriaLocal', 'HistWeb.dll');
      }

      childProcess = spawn(configPath, { cwd: os === 'Linux' ? path.join(process.resourcesPath, 'HistoriaLocal') : undefined });

      childProcess.stdout.on('data', (data) => {
        console.log(`Child process stdout: ${data}`);
      });

      childProcess.stderr.on('data', (data) => {
        console.error(`Child process stderr: ${data}`);
      });

      childProcess.on('exit', (code) => {
        console.log(`Child process exited with code ${code}`);
      });
    } catch (e) {
      console.error("ERROR:", e);
    }
  }

  app.on('before-quit', () => {
    if (childProcess) {
      console.log('Terminating C# process...');
      childProcess.kill();
    }
  });

  // Wait for a moment to ensure the C# server has started
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:5000/');
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }, 2000);
}

function loadRequirementsPage() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 1024,
    autoHideMenuBar: true,
  });

  mainWindow.loadFile(path.join(__dirname, 'requirements', 'requirements.html'));

  // Handle the link click event
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Open external links in the user's default web browser
    if (url.startsWith('http://') || url.startsWith('https://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

app.on('ready', async () => {
  try {
    let dotnetPath;
    const os = detectOperatingSystem();
    console.log('OS is:', os);

    isDotnetInstalled((dotnetInstalled) => {
      if (dotnetInstalled) {
        dotnetPath = "/usr/local/share/dotnet/dotnet";
        loadMainProgram();
      } else {
        console.log('.NET is not installed.');
        loadRequirementsPage();
      }
    });
  } catch (err) {
    console.error('Error checking dotnet installation:', err);
  }
});

app.on('window-all-closed', () => {
  app.quit();
});
