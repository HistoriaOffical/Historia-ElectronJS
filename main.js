const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const { exec } = require('child_process');
let mainWindow;

app.commandLine.appendSwitch('ignore-certificate-errors')
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

app.on('ready', async () => {
    try {

      let dotnetPath;
      const os = detectOperatingSystem();
      console.log('OS is:', os);
        dotnetPath = "/usr/local/share/dotnet/dotnet";
        if (dotnetPath) {
          mainWindow = new BrowserWindow({
            width: 1280,
            height: 1024,
            autoHideMenuBar: true,
          });
          if (isDev) {
              try {
                mainWindow.webContents.openDevTools();
                let configPath;
                if (os === 'Windows') {
                  configPath = path.join(__dirname, 'assets', 'HistoriaLocal', 'HistWeb.exe');
                  console.log("WINDOWS");
                  childProcess = spawn(configPath);
                } else if(os === "Linux"){
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
                if (os === 'Windows') {
                  configPath = path.join(path.dirname(__dirname), 'HistoriaLocal', 'HistWeb.exe');
                  console.log("WIN32");
                  childProcess = spawn(configPath);

		            } else if(os === "Linux"){
                  configPath = path.join(path.dirname(__dirname), 'HistoriaLocal','HistWeb');
                  const args = [configPath];
                  console.log("Linux");
                  childProcess = spawn(configPath, {
                        cwd: path.join(process.resourcesPath, 'HistoriaLocal')
                  });

                } else {
                  configPath = path.join(path.dirname(__dirname), 'HistoriaLocal','HistWeb.dll');
                  const args = [configPath];
                  childProcess = spawn(dotnetPath, args);  
                }

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
              childProcess.kill(); // Terminate the child process when Electron app is quitting.
            }
          });

          // Wait for a moment to ensure the C# server has started
          setTimeout(() => {
          mainWindow.loadURL('http://localhost:5000/');
          mainWindow.on('closed', () => {
            mainWindow = null;
          });
          }, 2000); 

        } else {
          console.log('.NET is not installed.');
        }

  } catch (err) {
    console.error('Error checking dotnet installation:', err);

  }
});

app.on('window-all-closed', () => {
    app.quit();
});