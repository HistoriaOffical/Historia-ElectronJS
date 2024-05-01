const { app, BrowserWindow, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const winston = require('winston');
const { exec } = require('child_process');

let mainWindow;
let childProcess;

app.commandLine.appendSwitch('ignore-certificate-errors');
const isDev = process.argv.includes('--dev');

const logFileName = path.join(app.getPath('userData'), 'app.log');
winston.add(new winston.transports.File({ filename: logFileName }));


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
  // Specify the path to dotnet based on the operating system
  let dotnetPath = '';
  if (os.platform() === 'win32') {
    dotnetPath = 'dotnet'; // Assuming dotnet is in the system PATH on Windows
  } else if (os.platform() === 'darwin' || os.platform() === 'linux') {
    dotnetPath = '/usr/local/share/dotnet/dotnet'; // Adjust the path as needed for OSX/Linux
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
  });

  if (isDev) {
    console.log("DEV");
    try {
      mainWindow.webContents.openDevTools();
      let configPath;
      let dotnetPath = "/usr/local/share/dotnet/dotnet";
      const os = detectOperatingSystem();

      if (os === 'Windows') {
        configPath = path.join(path.dirname(__dirname), 'HistoriaLocal', 'HistWeb.exe');
        const resourcesPath = path.join(process.resourcesPath, 'HistoriaLocal');
        childProcess = spawn(configPath, {cwd: resourcesPath });
      } else if (os === "Linux") {
        configPath = path.join(__dirname, 'assets', 'HistoriaLocal', 'HistWeb');
        const args = [configPath];
        console.log("Linux");
        childProcess = spawn(configPath, { 
          cwd: path.join(__dirname, 'assets', 'HistoriaLocal')
        });
      } else {
        configPath = path.join(__dirname, 'assets', 'HistoriaLocal', 'HistWeb.dll');
        const args = [configPath];
        console.log("OSX");
        childProcess = spawn(dotnetPath, args);  
      }



      //childProcess = spawn(configPath, { cwd: os === 'Linux' ? path.join(__dirname, 'assets', 'HistoriaLocal') : undefined });

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
    winston.info('PROD');
    try {

      let configPath;
      const os = detectOperatingSystem();
      let dotnetPath = "/usr/local/share/dotnet/dotnet";
      if (os === 'Windows') {
        winston.info("WINDOWS");
        configPath = path.join(path.dirname(__dirname), 'HistoriaLocal', 'HistWeb.exe');
        const resourcesPath = path.join(process.resourcesPath, 'HistoriaLocal');
        childProcess = spawn(configPath, {cwd: resourcesPath });

      } else if (os === "Linux") {
        winston.info("Linux");
        configPath = path.join(path.dirname(__dirname), 'HistoriaLocal','HistWeb');
        const args = [configPath];
        console.log("Linux");
        childProcess = spawn(configPath, {
              cwd: path.join(process.resourcesPath, 'HistoriaLocal')
        });

      } else {
        winston.info('OSX');
        configPath = path.join(path.dirname(__dirname), 'HistoriaLocal','HistWeb.dll');
        const args = [configPath];
        const resourcesPath = path.join(process.resourcesPath, 'HistoriaLocal');
        childProcess = spawn(dotnetPath, args, { cwd: resourcesPath });  
      }


      
      //childProcess = spawn(configPath, { cwd: os === 'Linux' ? path.join(process.resourcesPath, 'HistoriaLocal') : undefined });

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
  }, 4000);
}

function loadRequirementsPage() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 1024,
    autoHideMenuBar: true,
  });
  if (isDev) { 
    mainWindow.loadFile(path.join(__dirname, 'requirements', 'requirements.html'));
  } else {
    const filePath = path.join(__dirname, '..', 'requirements', 'requirements.html');
    mainWindow.loadFile(filePath);
  }

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
        winston.info('dotnet installed');
      } else {
        winston.info('dotnet NOT INSTALLED');
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
