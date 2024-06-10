const { app, BrowserWindow, shell, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const ps = require('ps-node');
const winston = require('winston');
const { exec } = require('child_process');

let mainWindow;
let childProcess;

app.commandLine.appendSwitch('ignore-certificate-errors');
const isDev = process.argv.includes('--dev');

const logFileName = path.join(app.getPath('userData'), 'app.log');
winston.add(new winston.transports.File({ filename: logFileName }));

log.transports.file.level = 'info';
autoUpdater.logger = log;
log.info('App starting...');

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
  let dotnetPath = '';
  if (os.platform() === 'win32') {
    dotnetPath = 'dotnet';
  } else if (os.platform() === 'darwin' || os.platform() === 'linux') {
    dotnetPath = '/usr/local/share/dotnet/dotnet';
  }

  const command = `${dotnetPath} --version`;

  exec(command, (error, stdout, stderr) => {
    if (error || stderr) {
      winston.info('dotnet error: ' + error + " " + stderr);
      callback(false);
    } else {
      winston.info('dotnet installed');
      callback(true);
    }
  });
}

function loadMainProgram() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 1024,
    autoHideMenuBar: true,
    webPreferences: {
        nodeIntegration: true,
        preload: path.join(__dirname, 'preload.js')
    }
  });

  winston.info('PROD');
  try {
    let configPath;
    const os = detectOperatingSystem();
    let dotnetPath = "/usr/local/share/dotnet/dotnet";
    if (os === 'Windows') {
      winston.info("WINDOWS");
      configPath = path.join(path.dirname(__dirname), 'HistoriaLocal', 'HistWeb.exe');
      const resourcesPath = path.join(process.resourcesPath, 'HistoriaLocal');
      childProcess = spawn(configPath, { cwd: resourcesPath });

    } else if (os === "Linux") {
      winston.info("Linux");
      configPath = path.join(path.dirname(__dirname), 'HistoriaLocal', 'HistWeb');
      const args = [configPath];
      console.log("Linux");
      childProcess = spawn(configPath, {
        cwd: path.join(process.resourcesPath, 'HistoriaLocal')
      });

    } else {
      winston.info('OSX');
      configPath = path.join(path.dirname(__dirname), 'HistoriaLocal', 'HistWeb.dll');
      const args = [configPath];
      const resourcesPath = path.join(process.resourcesPath, 'HistoriaLocal');
      childProcess = spawn(dotnetPath, args, { cwd: resourcesPath });
    }

    childProcess.stdout.on('data', (data) => {
      winston.info(`Child process stdout: ${data}`);
    });

    childProcess.stderr.on('data', (data) => {
      winston.info(`Child process stderr: ${data}`);
    });

    childProcess.on('exit', (code) => {
      winston.info(`Child process exited with code ${code}`);
    });
  } catch (e) {
    winston.info("ERROR:", e);
  }

  app.on('before-quit', async () => {
    if (childProcess) {
      console.log('Terminating C# process...');
      childProcess.kill();
    }
    app.quit();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log("Page loaded successfully");
  });

  const loadingFilePath = path.join(__dirname, 'loading.html');
  console.log(`Loading file: ${loadingFilePath}`);
  mainWindow.loadFile(loadingFilePath).then(() => {
    console.log("Loading screen displayed");
    setTimeout(() => {
      loadWithRetry('http://localhost:5000/', 10);
    }, 5000);
  }).catch(err => {
    console.error("Failed to load loading screen: ", err);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function loadWithRetry(url, retries, delay = 5000) {
  console.log(`Attempting to load: ${url}, retries left: ${retries}`);
  mainWindow.loadURL(url).catch(err => {
    console.error("Load failed: ", err);
    if (retries > 0) {
      setTimeout(() => {
        loadWithRetry(url, retries - 1, delay);
      }, delay);
    } else {
      console.error("All retries failed.");
    }
  });
}

function loadRequirementsPage() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 1024,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  if (isDev) {
    mainWindow.loadFile(path.join(__dirname, 'requirements', 'requirements.html'));
  } else {
    const filePath = path.join(__dirname, '..', 'requirements', 'requirements.html');
    mainWindow.loadFile(filePath);
  }

  mainWindow.webContents.on('will-navigate', (event, url) => {
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
        winston.info('dotnet installed');
      } else {
        winston.info('dotnet NOT INSTALLED');
        loadRequirementsPage();
      }
    });

    autoUpdater.allowPrerelease = true;
    autoUpdater.checkForUpdatesAndNotify();

  } catch (err) {
    console.error('Error checking dotnet installation:', err);
  }
});

autoUpdater.on('update-available', () => {
  log.info('Update available.');
});

autoUpdater.on('update-downloaded', () => {
  log.info('Update downloaded; will install now');
  autoUpdater.quitAndInstall();
});

ipcMain.on('shutdown', (event, arg) => {
  console.log('Shutdown command received');
  mainWindow.close(); // Closes the window
  app.quit(); // Quit the entire app
});

app.on('window-all-closed', () => {
  app.quit();
});
