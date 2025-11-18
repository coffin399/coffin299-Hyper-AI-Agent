const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

let backendProcess = null;
let backendPort = 18000;
let backendMode = 'local'; // 'local' or 'network'
let networkApiUrl = '';
let developerMode = false;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Load user settings
function loadSettings() {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      backendMode = settings.backendMode || 'local';
      backendPort = settings.backendPort || 18000;
      networkApiUrl = settings.networkApiUrl || '';
      developerMode = !!settings.developerMode;
      console.log('Loaded settings:', { backendMode, backendPort, networkApiUrl, developerMode });
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }
}

// Save user settings
function saveSettings(settings) {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log('Settings saved:', settings);
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

// Start local backend process
function startBackend() {
  if (backendMode !== 'local') {
    console.log('Backend mode is network, skipping local backend startup');
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const basePath = isDev ? __dirname : process.resourcesPath;

    let exePath;
    if (process.platform === 'win32') {
      exePath = path.join('backend', 'backend.exe');
    } else if (process.platform === 'darwin') {
      if (isDev) {
        exePath = path.join('backend', 'backend');
      } else {
        exePath = path.join(
          'backend',
          'Hyper AI Agent Backend.app',
          'Contents',
          'MacOS',
          'Hyper AI Agent Backend'
        );
      }
    } else {
      exePath = path.join('backend', 'backend');
    }

    const backendExe = path.join(basePath, exePath);
    
    if (!fs.existsSync(backendExe)) {
      console.error('Backend executable not found at:', backendExe);
      reject(new Error('Backend executable not found. Please build the backend first.'));
      return;
    }

    console.log('Starting backend process:', backendExe);
    backendProcess = spawn(backendExe, ['--port', backendPort.toString()], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      env: {
        ...process.env,
        DEVELOPER_MODE: developerMode ? 'true' : 'false',
      },
    });

    backendProcess.stdout.on('data', (data) => {
      console.log('[Backend]', data.toString());
    });

    backendProcess.stderr.on('data', (data) => {
      console.error('[Backend Error]', data.toString());
    });

    backendProcess.on('error', (err) => {
      console.error('Failed to start backend:', err);
      reject(err);
    });

    backendProcess.on('exit', (code) => {
      console.log('Backend process exited with code:', code);
      backendProcess = null;
    });

    // Wait for backend to be ready
    checkBackendHealth(10, 1000)
      .then(() => {
        console.log('Backend is ready');
        resolve();
      })
      .catch(reject);
  });
}

// Check if backend is responding
function checkBackendHealth(maxRetries = 10, retryDelay = 1000) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    
    const check = () => {
      const url = backendMode === 'local' 
        ? `http://127.0.0.1:${backendPort}/docs`
        : `${networkApiUrl}/docs`;
      
      http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
      }).on('error', () => {
        retry();
      });
    };
    
    const retry = () => {
      retries++;
      if (retries >= maxRetries) {
        reject(new Error('Backend health check failed after ' + maxRetries + ' attempts'));
      } else {
        setTimeout(check, retryDelay);
      }
    };
    
    check();
  });
}

// Stop backend process
function stopBackend() {
  if (backendProcess) {
    console.log('Stopping backend process...');
    backendProcess.kill('SIGTERM');
    
    // Force kill after 5 seconds if still running
    setTimeout(() => {
      if (backendProcess) {
        console.log('Force killing backend process...');
        backendProcess.kill('SIGKILL');
      }
    }, 5000);
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'src', 'icons', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Pass backend configuration to renderer
  const apiBaseUrl = backendMode === 'local'
    ? `http://127.0.0.1:${backendPort}`
    : networkApiUrl;
  
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('backend-config', {
      mode: backendMode,
      apiBaseUrl,
    });
  });

  // In development, load the local dev server; in production, load the bundled UI
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000').catch(() => {
      console.error('Failed to load dev server. Make sure React dev server is running on port 3000.');
    });
  } else {
    const indexPath = path.join(__dirname, 'frontend', 'build', 'index.html');
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('Failed to load index.html:', err);
    });
  }
}

// IPC handlers for settings
ipcMain.handle('get-settings', () => {
  return {
    backendMode,
    backendPort,
    networkApiUrl,
    developerMode,
  };
});

ipcMain.handle('save-settings', (event, settings) => {
  backendMode = settings.backendMode || 'local';
  backendPort = settings.backendPort || 18000;
  networkApiUrl = settings.networkApiUrl || '';
   developerMode = !!settings.developerMode;
  saveSettings(settings);
  return { success: true };
});

// App lifecycle
app.whenReady().then(async () => {
  loadSettings();
  
  try {
    await startBackend();
    createWindow();
  } catch (err) {
    console.error('Failed to start backend:', err);
    // Show error dialog or create window anyway with error message
    createWindow();
  }
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
