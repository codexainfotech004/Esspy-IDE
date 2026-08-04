/**
 * =============================================
 * BharatBlocks IDE - Electron Main Process
 * =============================================
 * 
 * This file creates the desktop application window
 * and handles native OS integration.
 * 
 * When the user opens BharatBlocks.exe, this file:
 * 1. Creates a full-screen browser window
 * 2. Loads the index.html file
 * 3. Optionally starts the Flask backend
 * 
 * Author: BharatBlocks Team
 * License: MIT
 */

const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// ==========================================
// Global References  
// ==========================================

/** @type {BrowserWindow} Main application window */
let mainWindow = null;

/** @type {ChildProcess} Flask backend process */
let backendProcess = null;

// ==========================================
// Window Creation
// ==========================================

/**
 * Create the main application window
 */
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 600,
        title: 'BharatBlocks IDE',
        backgroundColor: '#0f0f1a',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        show: false, // Show after content loads
    });

    // Load the frontend
    mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

    // Show window when ready to prevent flash of white
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.maximize();
    });

    // Handle window close
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// ==========================================
// Custom Menu
// ==========================================

/**
 * Build custom application menu
 */
function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                { label: 'New Project', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.executeJavaScript('newProject()') },
                { label: 'Save Project', accelerator: 'CmdOrCtrl+S', click: () => mainWindow.webContents.executeJavaScript('saveProject()') },
                { label: 'Open Project', accelerator: 'CmdOrCtrl+O', click: () => mainWindow.webContents.executeJavaScript('document.getElementById("fileInput").click()') },
                { type: 'separator' },
                { label: 'Exit', accelerator: 'Alt+F4', role: 'quit' },
            ],
        },
        {
            label: 'Edit',
            submenu: [
                { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
                { label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
                { type: 'separator' },
                { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
                { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
                { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
            ],
        },
        {
            label: 'View',
            submenu: [
                { label: 'Toggle Code Panel', click: () => mainWindow.webContents.executeJavaScript('toggleCodePanel()') },
                { label: 'Toggle Console', click: () => mainWindow.webContents.executeJavaScript('toggleConsole()') },
                { type: 'separator' },
                { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', role: 'zoomIn' },
                { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
                { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
                { type: 'separator' },
                { label: 'Full Screen', accelerator: 'F11', role: 'togglefullscreen' },
                { label: 'Developer Tools', accelerator: 'F12', role: 'toggleDevTools' },
            ],
        },
        {
            label: 'Run',
            submenu: [
                { label: 'Generate Code', accelerator: 'F5', click: () => mainWindow.webContents.executeJavaScript('runCode()') },
                { label: 'Upload to ESP32', click: () => mainWindow.webContents.executeJavaScript('uploadToESP32()') },
                { label: 'Simulate', click: () => mainWindow.webContents.executeJavaScript('toggleSimulation()') },
            ],
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About BharatBlocks',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About BharatBlocks IDE',
                            message: 'BharatBlocks IDE v1.0',
                            detail: 'A block-based programming IDE for ESP32/Arduino with Marathi language support.\n\nBuilt with ❤️ in India.',
                        });
                    },
                },
                {
                    label: 'Documentation',
                    click: () => shell.openExternal('https://github.com/bharatblocks'),
                },
            ],
        },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// ==========================================
// Flask Backend Management (Optional)
// ==========================================

/**
 * Start the Flask backend server
 * This is optional — the frontend works without it,
 * but the upload feature requires it.
 */
function startBackend() {
    const fs = require('fs');
    let backendPath;
    let cwd;

    // In production (packaged), backend is unpacked to <resources>/app.asar.unpacked/backend/
    const unpackedBackend = path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'app.py');
    if (fs.existsSync(unpackedBackend)) {
        backendPath = unpackedBackend;
        cwd = path.join(process.resourcesPath, 'app.asar.unpacked');
        console.log('[Backend] Using unpacked backend:', backendPath);
    } else {
        // In development, backend is at <project>/backend/app.py
        backendPath = path.join(__dirname, '..', 'backend', 'app.py');
        cwd = path.join(__dirname, '..');
        console.log('[Backend] Using dev backend:', backendPath);
    }

    try {
        let pythonCmd;
        
        if (process.platform === 'win32') {
            // On Windows, use bundled Python from resources folder
            const bundledPython = path.join(process.resourcesPath, 'python-3.12.8-embed-amd64', 'python.exe');
            
            if (fs.existsSync(bundledPython)) {
                pythonCmd = bundledPython;
                console.log('[Backend] Using bundled Python:', bundledPython);
            } else {
                // Fall back to system Python
                const { execSync } = require('child_process');
                try {
                    execSync('python --version', { stdio: 'ignore' });
                    pythonCmd = 'python';
                    console.log('[Backend] Using system Python');
                } catch {
                    try {
                        execSync('python3 --version', { stdio: 'ignore' });
                        pythonCmd = 'python3';
                        console.log('[Backend] Using system Python3');
                    } catch {
                        console.error('[Backend] Python not found. Backend will not start.');
                        return;
                    }
                }
            }
        } else {
            // On macOS/Linux, use python3
            pythonCmd = 'python3';
        }

        backendProcess = spawn(pythonCmd, [backendPath], {
            cwd: cwd,
            stdio: 'pipe',
            shell: false, // Turn off shell to prevent path with spaces splitting issues
            detached: false, // Do not detach to ensure it is killed when parent exits
        });

        backendProcess.stdout.on('data', (data) => {
            console.log(`[Backend] ${data}`);
        });

        backendProcess.stderr.on('data', (data) => {
            console.error(`[Backend Error] ${data}`);
        });

        backendProcess.on('close', (code) => {
            console.log(`[Backend] Process exited with code ${code}`);
        });

        backendProcess.on('error', (err) => {
            console.error('[Backend] Failed to start:', err.message);
        });

        console.log('[Backend] Flask server started');
    } catch (err) {
        console.error('[Backend] Failed to start:', err.message);
    }
}

/**
 * Stop the Flask backend server
 */
function stopBackend() {
    if (backendProcess) {
        backendProcess.kill();
        backendProcess = null;
        console.log('[Backend] Flask server stopped');
    }
}

// ==========================================
// App Lifecycle Events
// ==========================================

// Create window when Electron is ready
app.whenReady().then(() => {
    createWindow();
    createMenu();

    // Optionally start the backend for upload support
    // Uncomment the line below if you want auto-start:
    startBackend();

    app.on('activate', () => {
        // macOS: Re-create window when dock icon is clicked
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
    stopBackend();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Clean up on exit
app.on('before-quit', () => {
    stopBackend();
});
