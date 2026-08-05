/**
 * =============================================
 * Sarang AI Studio - Main Application Logic
 * =============================================
 * 
 * This file handles:
 *   - Blockly workspace initialization
 *   - Code generation (blocks → Arduino C++ / MicroPython)
 *   - Save / Load projects (JSON with AI data)
 *   - Simulation mode
 *   - AI Studio integration
 *   - Language switching (English / Marathi)
 *   - Console output management
 *   - Upload to ESP32 (via backend)
 *   - UI interactions and animations
 * 
 * Author: ESPY Team
 * License: MIT
 */

// ==========================================
// Global Variables
// ==========================================

/** @type {Blockly.WorkspaceSvg} Main Blockly workspace */
let workspace = null;

/** Current code generator: 'arduino' (default for Blix Boards) or 'micropython' */
let currentCodeGenerator = localStorage.getItem('currentCodeGenerator') || 'arduino';

/** Console message count */
let consoleCount = 0;

/** Current project file name */
let currentProjectName = 'untitled';

/** Simulation running state */
let isSimulating = false;

/** Flag to disable block centering during bulk load/import operations */
let _disableCentering = false;

/** Current code language: 'python' or 'cpp' */
let codeLang = 'cpp';

function _getCodeUiForGenerator(gen) {
    if (gen === 'micropython') {
        return {
            title: 'MicroPython Code',
            downloadLabel: 'Download .py',
            placeholder: '# Generated MicroPython code will appear here...\n# Add blocks to the workspace to generate code.',
            noCodePrefix: '# No blocks',
            ext: '.py',
            langName: 'MicroPython',
        };
    }
    return {
        title: 'Arduino C++ Code',
        downloadLabel: 'Download .ino',
        placeholder: '// Generated Arduino C++ code will appear here...\n// Add blocks to the workspace to generate code.',
        noCodePrefix: '// No blocks',
        ext: '.ino',
        langName: 'Arduino C++',
    };
}

function _syncCodeUiToGenerator() {
    const ui = _getCodeUiForGenerator(currentCodeGenerator);
    codeLang = currentCodeGenerator === 'micropython' ? 'python' : 'cpp';

    const title = document.getElementById('codePanelTitle');
    const downloadBtn = document.getElementById('btnDownloadCode');
    const codeOutput = document.getElementById('codeOutput');

    if (title) title.textContent = ui.title;
    if (downloadBtn) downloadBtn.innerHTML = `<span class="btn__icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span> ${ui.downloadLabel}`;
    if (codeOutput) codeOutput.placeholder = ui.placeholder;
}

/**
 * Wrapper around Blockly.serialization.workspaces.save()
 * Suppresses the internal 'getAllVariables' deprecation warning
 * that Blockly v11+ emits from its own serialization code.
 */
function blocklyWorkspaceSave(ws) {
    const _origWarn = console.warn;
    console.warn = (...args) => {
        if (typeof args[0] === 'string' && args[0].includes('getAllVariables')) return;
        _origWarn.apply(console, args);
    };
    const state = Blockly.serialization.workspaces.save(ws);
    console.warn = _origWarn;
    return state;
}

// ==========================================
// Initialization
// ==========================================

/**
 * Initialize the application when the page loads
 */
window.addEventListener('DOMContentLoaded', () => {
    // Show splash screen for a moment, then initialize
    setTimeout(() => {
        try {
            initWorkspace();
            initBlockSearch();
            initEventListeners();
            initAIStudio();
            initSerialMonitor();
            initBoardSelection();
            switchCodeGenerator(currentCodeGenerator);
            detectESP32Port(); // Auto-detect ESP32 board on startup
            logToConsole('info', 'Sarang AI Studio initialized successfully.');
            logToConsole('info', 'AI features: Camera, Hand, Pose, Face, Speech');
            logToConsole('info', 'Ready to create! Drag blocks from the toolbox.');
        } catch (err) {
            console.error('Initialization error:', err);
        } finally {
            // Hide splash - ALWAYS run this so the user is never stuck
            const splash = document.getElementById('splash');
            if (splash) {
                splash.classList.add('splash--hidden');
                setTimeout(() => splash.remove(), 500);
            }
        }
    }, 2000);
});

// ==========================================
// Performance: Debounced code generation
// ==========================================

/** Timer ID for debounced code generation */
let _codeGenTimer = null;

/** Whether a block is currently being dragged */
let _isDragging = false;

/**
 * Schedule code generation after a short delay.
 * If called again before the delay fires, the previous call is cancelled.
 * This prevents expensive code generation from running on every single
 * mouse-move event during a block drag.
 * @param {number} delay - Debounce delay in ms (default 300)
 */
function scheduleCodeGen(delay = 300) {
    if (_codeGenTimer) clearTimeout(_codeGenTimer);
    _codeGenTimer = setTimeout(() => {
        _codeGenTimer = null;
        generateCode();
        updateBlockCount();
    }, delay);
}

/**
 * Initialize the Blockly workspace with custom theme and configuration
 */
function initWorkspace() {
    // Define a custom dark theme with blue color scheme
    const darkTheme = Blockly.Theme.defineTheme('bharatblocks_dark', {
        'base': Blockly.Themes.Classic,
        'componentStyles': {
            'workspaceBackgroundColour': '#0f172a',
            'toolboxBackgroundColour': '#1e293b',
            'toolboxForegroundColour': '#f8fafc',
            'flyoutBackgroundColour': '#1e293b',
            'flyoutForegroundColour': '#cbd5e1',
            'flyoutOpacity': 0.97,
            'scrollbarColour': 'rgba(59, 130, 246, 0.3)',
            'insertionMarkerColour': '#3b82f6',
            'insertionMarkerOpacity': 0.5,
            'scrollbarOpacity': 0.5,
            'cursorColour': '#3b82f6',
        },
        'fontStyle': {
            'family': 'Inter, sans-serif',
            'weight': '500',
            'size': 12,
        }
    });

    // Inject Blockly workspace
    workspace = Blockly.inject('blocklyDiv', {
        toolbox: document.getElementById('toolbox'),
        theme: darkTheme,
        grid: {
            spacing: 25,
            length: 3,
            colour: 'rgba(255,255,255,0.04)',
            snap: true,
        },
        zoom: {
            controls: true,
            wheel: false,
            startScale: 1.0,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2,
            pinch: true,
        },
        trashcan: true,
        move: {
            scrollbars: {
                horizontal: true,
                vertical: true,
            },
            drag: true,
            wheel: true,
        },
        renderer: 'zelos',
        sounds: true,
    });

    // Add a default start_program block
    addDefaultBlocks();

    // Add custom color classes to sidebar categories
    setTimeout(() => {
        applyCategoryColors();
        matchSearchBarWidth();
    }, 500);

    // Listen for workspace changes to auto-generate code
    // PERFORMANCE FIX: debounce code generation and skip during drags
    workspace.addChangeListener((event) => {
        // Ignore pure UI events (viewport pan/zoom, toolbox open, etc.)
        if (event.type === Blockly.Events.UI) return;

        // Track drag state — skip code-gen entirely while dragging
        if (event.type === Blockly.Events.BLOCK_DRAG) {
            _isDragging = event.isStart;
            // Pause/resume CSS animations during drag for performance
            document.body.classList.toggle('dragging-active', _isDragging);
            if (!_isDragging) {
                // Drag ended — schedule a single code-gen
                scheduleCodeGen(150);
            }
            return;
        }

        // While a drag is in progress, skip individual move events
        if (_isDragging && event.type === Blockly.Events.BLOCK_MOVE) {
            return;
        }

        // For all other events (create, delete, field change, etc.),
        // debounce so rapid edits don't each trigger full code-gen
        scheduleCodeGen(250);
    });

    // Position newly created blocks in the center of the visible workspace
    workspace.addChangeListener((event) => {
        if (_disableCentering) return;

        // When a block is created (e.g. from toolbox click)
        if (event.type === Blockly.Events.BLOCK_CREATE || event.type === Blockly.Events.CREATE) {
            const block = workspace.getBlockById(event.blockId);
            if (block) {
                if (block.type === 'start_program') return;
                
                setTimeout(() => {
                    // Check if block has parent before attempting to move it
                    if (block && !block.getParent()) {
                        const metrics = workspace.getMetrics();
                        if (metrics) {
                            const scale = workspace.scale || 1.0;
                            const centerX = metrics.viewLeft + (metrics.viewWidth / scale) / 2;
                            const centerY = metrics.viewTop + (metrics.viewHeight / scale) / 2;
                            
                            const currentPos = block.getRelativeToSurfaceXY();
                            const blockWidth = block.width || 0;
                            const blockHeight = block.height || 0;
                            
                            const dx = centerX - currentPos.x - (blockWidth / 2);
                            const dy = centerY - currentPos.y - (blockHeight / 2);
                            
                            block.moveBy(dx, dy);
                        }
                    }
                }, 50);
            }
        }
    });

    // Handle window resize — call svgResize immediately for fast fullscreen response
    window.addEventListener('resize', () => {
        Blockly.svgResize(workspace);
    });

    // Initial resize
    setTimeout(() => Blockly.svgResize(workspace), 100);
}

/**
 * Apply custom colors to toolbox category rows
 */
function applyCategoryColors() {
    const categoryColors = {
        'AI Camera': '#9c27b0',
        'Hand Gesture': '#00bcd4',
        'Body Pose': '#ff9800',
        'Face': '#4caf50',
        'Speech': '#2196f3',
        'AI Control': '#e91e63',
        'Control': '#607d8b',
        'GPIO': '#ff5722',
        'Servo Motor': '#4fc3f7',
        'Ultrasonic Sensor': '#ff5252',
        'IR Sensor': '#ffd740',
        'DHT Sensor': '#69f0ae',
        'Touch Sensor': '#80deea',
        'Soil Moisture': '#795548',
        'Sound Sensor': '#ffeb3b',
        'IR Receiver': '#e040fb',
        'Joystick': '#ff9e80',
        'Rotary Encoder': '#b388ff',
        'Push Button': '#80cbc4',
        'Buzzer': '#ffab91',
        'Relay': '#a5d6a7',
        'DC Motor': '#90caf9',
        'LCD Display': '#ce93d8',
        'WiFi': '#fff59d',
        'Logic': '#f48fb1',
        'Loops': '#bcaaa4',
        'Variables': '#c5e1a5',
        'Math': '#81d4fa'
    };

    const treeRows = document.querySelectorAll('.blocklyTreeRow');
    treeRows.forEach(row => {
        const label = row.querySelector('.blocklyTreeLabel');
        if (label) {
            const categoryName = label.textContent.trim();
            if (categoryColors[categoryName]) {
                const color = categoryColors[categoryName];
                row.style.setProperty('--category-color', color);
                row.classList.add('category-colored');
                row.dataset.categoryColor = color;
            }
        }
    });
}

/**
 * Match search bar width to Blockly toolbox width
 */
function matchSearchBarWidth() {
    const searchBar = document.getElementById('blockSearchContainer');
    const toolbox = document.querySelector('.blocklyToolboxDiv');
    if (searchBar && toolbox) {
        const width = toolbox.offsetWidth;
        if (width > 0) {
            searchBar.style.width = width + 'px';
        }
    }
}

// Re-match on window resize
window.addEventListener('resize', () => setTimeout(matchSearchBarWidth, 150));

/**
 * Initialize block search functionality
 */
function initBlockSearch() {
    const searchInput = document.getElementById('blockSearchInput');
    const clearBtn = document.getElementById('blockSearchClear');
    const originalToolbox = document.getElementById('toolbox');
    let searchDebounceTimer = null;
    let blockIndex = [];

    // Build searchable index from toolbox XML
    function buildBlockIndex() {
        blockIndex = [];
        const categories = originalToolbox.querySelectorAll('category');
        categories.forEach(cat => {
            const catName = cat.getAttribute('name');
            const blocks = cat.querySelectorAll('block');
            blocks.forEach(block => {
                const type = block.getAttribute('type');
                if (!type) return;
                
                const label = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                
                blockIndex.push({
                    type,
                    category: catName,
                    label,
                    element: block.cloneNode(true)
                });
            });
        });
    }

    function filterBlocks(query) {
        if (!query) return [];
        const lower = query.toLowerCase();
        return blockIndex.filter(b => 
            b.type.toLowerCase().includes(lower) ||
            b.label.toLowerCase().includes(lower) ||
            b.category.toLowerCase().includes(lower)
        );
    }

    function createSearchToolbox(matches) {
        const xmlDoc = document.implementation.createDocument(null, 'xml', null);
        const root = xmlDoc.documentElement;
        root.setAttribute('id', 'searchToolbox');
        root.setAttribute('style', 'display: none');
        
        const category = xmlDoc.createElement('category');
        category.setAttribute('name', matches.length > 0 
            ? `Search Results (${matches.length})` 
            : 'No Results');
        category.setAttribute('colour', '#3b82f6');
        
        matches.forEach(b => {
            const imported = xmlDoc.importNode(b.element, true);
            category.appendChild(imported);
        });
        
        root.appendChild(category);
        return root;
    }

    function performSearch() {
        const query = searchInput.value.trim();
        if (!query) {
            workspace.updateToolbox(originalToolbox);
            applyCategoryColors();
            setTimeout(matchSearchBarWidth, 200);
            return;
        }
        
        const matches = filterBlocks(query);
        const newToolbox = createSearchToolbox(matches);
        workspace.updateToolbox(newToolbox);
        applyCategoryColors();
        setTimeout(matchSearchBarWidth, 200);
    }

    function onSearchInput() {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(performSearch, 200);
    }

    function onClearSearch() {
        searchInput.value = '';
        performSearch();
        searchInput.focus();
    }

    setTimeout(() => {
        buildBlockIndex();
        searchInput.addEventListener('input', onSearchInput);
        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                onClearSearch();
                searchInput.blur();
            }
        });
        clearBtn.addEventListener('click', onClearSearch);
    }, 600);
}

/**
 * Detect ESP32 board connection
 * Calls backend API to check for connected ESP32 boards
 */
async function detectESP32Port() {
    const portStatus = document.getElementById('portStatus');
    const portStatusIcon = document.getElementById('portStatusIcon');
    const portStatusText = document.getElementById('portStatusText');
    const popoverStatus = document.getElementById('popoverStatus');
    const popoverPort = document.getElementById('popoverPort');

    try {
        const response = await fetch('http://localhost:5001/api/detect-port');
        const data = await response.json();

        if (data.success && data.ports && data.ports.length > 0) {
            const port = data.ports[0];
            portStatusIcon.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>';
            portStatusText.textContent = port.label;
            portStatus.classList.add('port-status--connected');
            portStatus.classList.remove('port-status--disconnected');

            if (popoverStatus) {
                popoverStatus.textContent = 'Connected';
                popoverStatus.style.color = '#22c55e';
            }
            if (popoverPort) popoverPort.textContent = port.address;

            logToConsole('success', `ESP32 board detected: ${port.address}`);
        } else {
            portStatusIcon.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
            portStatusText.textContent = 'Not Connected';
            portStatus.classList.add('port-status--disconnected');
            portStatus.classList.remove('port-status--connected');

            if (popoverStatus) {
                popoverStatus.textContent = 'Disconnected';
                popoverStatus.style.color = '#ef4444';
            }
            if (popoverPort) popoverPort.textContent = 'None';
        }
    } catch (error) {
        portStatusIcon.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
        portStatusText.textContent = 'Backend Offline';
        portStatus.classList.add('port-status--disconnected');
        portStatus.classList.remove('port-status--connected');

        if (popoverStatus) {
            popoverStatus.textContent = 'Backend Offline';
            popoverStatus.style.color = '#ef4444';
        }
        if (popoverPort) popoverPort.textContent = 'None';
    }
}

/**
 * Add default blocks to the workspace
 * Creates a start_program block in the center
 */
function addDefaultBlocks() {
    const startBlock = workspace.newBlock('start_program');
    startBlock.initSvg();
    startBlock.render();
    
    // Center the block on screen
    const workspaceMetrics = workspace.getMetrics();
    const blockWidth = startBlock.width;
    const blockHeight = startBlock.height;
    
    const centerX = (workspaceMetrics.viewWidth / 2) - (blockWidth / 2);
    const centerY = (workspaceMetrics.viewHeight / 2) - (blockHeight / 2);
    
    startBlock.moveBy(centerX, centerY);
}

// ==========================================
// Event Listeners Setup
// ==========================================

/**
 * Attach all UI event listeners
 */
function initEventListeners() {
    // --- File Operations ---
    document.getElementById('btnNew').addEventListener('click', newProject);
    document.getElementById('btnSave').addEventListener('click', saveProject);
    document.getElementById('btnOpen').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    document.getElementById('fileInput').addEventListener('change', openProject);

    // --- Sample Projects Dropdown ---
    const examplesMenu = document.getElementById('examplesMenu');
    const btnExamples = document.getElementById('btnExamples');
    
    // Toggle dropdown on button click
    btnExamples.addEventListener('click', (e) => {
        e.stopPropagation();
        examplesMenu.classList.toggle('dropdown__menu--show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!btnExamples.contains(e.target) && !examplesMenu.contains(e.target)) {
            examplesMenu.classList.remove('dropdown__menu--show');
        }
    });
    
    // Handle example selection
    document.querySelectorAll('.dropdown__item').forEach(item => {
        item.addEventListener('click', () => {
            const exampleId = item.getAttribute('data-example');
            loadSampleProject(exampleId);
            examplesMenu.classList.remove('dropdown__menu--show');
        });
    });

    // --- Code Actions ---
    document.getElementById('btnRun').addEventListener('click', runCode);
    document.getElementById('btnUpload').addEventListener('click', uploadToESP32);
    document.getElementById('btnSimulate').addEventListener('click', toggleSimulation);

    // --- Upload Modal Actions ---
    const uploadOverlay = document.getElementById('uploadOverlay');
    const uploadClose = document.getElementById('uploadClose');
    const btnUploadClose = document.getElementById('btnUploadClose');
    const uploadLogsHeader = document.getElementById('uploadLogsHeader');
    const uploadLogs = document.getElementById('uploadLogs');
    
    if (uploadClose) uploadClose.addEventListener('click', () => uploadOverlay.style.display = 'none');
    if (btnUploadClose) btnUploadClose.addEventListener('click', () => uploadOverlay.style.display = 'none');
    if (uploadLogsHeader) {
        uploadLogsHeader.addEventListener('click', () => {
            const isHidden = uploadLogs.style.display === 'none';
            uploadLogs.style.display = isHidden ? 'block' : 'none';
            document.getElementById('uploadLogsToggle').textContent = isHidden ? '▲' : '▼';
        });
    }

    // --- Code Panel ---
    document.getElementById('btnToggleCode').addEventListener('click', toggleCodePanel);
    document.getElementById('btnCopyCode').addEventListener('click', copyCode);
    document.getElementById('btnDownloadCode').addEventListener('click', downloadCode);
    document.getElementById('btnManualCode').addEventListener('click', toggleManualCodeMode);
    document.getElementById('btnGenerateBlocks').addEventListener('click', generateBlocksFromCode);
    document.getElementById('btnImportCode').addEventListener('click', () => document.getElementById('codeInput').click());
    document.getElementById('codeInput').addEventListener('change', importCodeFile);

    // --- Console ---
    document.getElementById('consoleHeader').addEventListener('click', toggleConsole);
    document.getElementById('btnClearConsole').addEventListener('click', clearConsole);

    // --- Language Toggle ---
    document.getElementById('langEn').addEventListener('click', () => switchLanguage('en'));
    document.getElementById('langMr').addEventListener('click', () => switchLanguage('mr'));

    // --- Connection Popover ---
    const portStatusBtn = document.getElementById('portStatus');
    const connectionPopoverPanel = document.getElementById('connectionPopover');
    const btnRescanPortBtn = document.getElementById('btnRescanPort');
    
    portStatusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        connectionPopoverPanel.classList.toggle('connection-popover--show');
        if (connectionPopoverPanel.classList.contains('connection-popover--show')) {
            detectESP32Port();
        }
    });
    
    document.addEventListener('click', (e) => {
        if (!portStatusBtn.contains(e.target) && !connectionPopoverPanel.contains(e.target)) {
            connectionPopoverPanel.classList.remove('connection-popover--show');
        }
    });
    
    btnRescanPortBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        detectESP32Port();
        showToast('info', 'Scanning for Blix Board...');
    });

    // --- Code Generator Toggle ---
    const genMicroPythonBtn = document.getElementById('genMicroPython');
    const genArduinoBtn = document.getElementById('genArduino');
    if (genMicroPythonBtn) genMicroPythonBtn.addEventListener('click', () => switchCodeGenerator('micropython'));
    if (genArduinoBtn) genArduinoBtn.addEventListener('click', () => switchCodeGenerator('arduino'));

    // --- Simulation ---
    document.getElementById('simClose').addEventListener('click', closeSimulation);
    document.getElementById('btnStartSim').addEventListener('click', startAnimatedSimulation);
    document.getElementById('btnStopSim').addEventListener('click', stopAnimatedSimulation);
    document.getElementById('simOverlay').addEventListener('click', (e) => {
        if (e.target === document.getElementById('simOverlay')) closeSimulation();
    });

    // --- Keyboard Shortcuts ---
    document.addEventListener('keydown', handleKeyboard);

    // Code language is always Python (MicroPython)

    // --- AI Studio ---
    document.getElementById('btnAIStudio').addEventListener('click', () => {
        const panel = document.getElementById('aiStudioPanel');
        if (panel.classList.contains('ai-studio--open')) {
            aiCloseStudio();
        } else {
            aiOpenStudio();
            // Start camera for default mode on first open
            if (!AIStudio.activeMode) {
                aiSwitchMode('camera');
            }
        }
        // Resize Blockly after animation
        setTimeout(() => Blockly.svgResize(workspace), 450);
    });
    document.getElementById('aiStudioClose').addEventListener('click', () => {
        aiCloseStudio();
        setTimeout(() => Blockly.svgResize(workspace), 450);
    });

    // --- Line Follower Mini-Project ---
    initLineFollowerSim();
}

// ==========================================
// Code Generation
// ==========================================

/**
 * Generate code from the workspace blocks
 * Uses the currently selected code language (Python or C++)
 */
function generateCode() {
    try {
        let code;
        if (currentCodeGenerator === 'micropython') {
            code = micropythonGenerator.workspaceToCode(workspace);
            document.getElementById('codeOutput').value = code || '# No blocks in workspace\n# Drag a "Start Program" block to begin!';
        } else {
            code = arduinoGenerator.workspaceToCode(workspace);
            document.getElementById('codeOutput').value = code || '// No blocks in workspace\n// Drag a "Start Program" block to begin!';
        }
    } catch (err) {
        const comment = currentCodeGenerator === 'micropython' ? '#' : '//';
        document.getElementById('codeOutput').value = `${comment} Error generating code:\n${comment} ` + err.message;
        console.error('Code generation error:', err);
    }
}

/**
 * Switch code language — now always MicroPython
 */
function switchCodeLang(lang) {
    // Deprecated: kept for backward compatibility.
    // Use the code-generator toggle (MicroPython / Arduino C++) instead.
    _syncCodeUiToGenerator();
    generateCode();
}

/**
 * Run button handler - generates and displays code
 */
function runCode() {
    generateCode();
    const code = document.getElementById('codeOutput').value;
    const noCode = currentCodeGenerator === 'micropython' ? '# No blocks' : '// No blocks';

    if (!code || code.startsWith(noCode)) {
        showToast('warning', 'No blocks found! Add blocks to the workspace first.');
        logToConsole('warning', 'No blocks to compile.');
        return;
    }

    const langName = currentCodeGenerator === 'micropython' ? 'MicroPython' : 'Arduino C++';
    logToConsole('info', `Generating ${langName} code...`);
    logToConsole('success', 'Code generated successfully!');
    logToConsole('info', `Generated ${code.split('\n').length} lines of code.`);

    // Make sure code panel is visible
    const codePanel = document.getElementById('codePanel');
    codePanel.classList.add('code-panel--open');
    codePanel.classList.remove('code-panel--collapsed');

    showToast('success', 'Code generated successfully!');
}

// ==========================================
// Project Save / Load
// ==========================================

/**
 * Create a new project - clears the workspace
 */
function newProject() {
    if (workspace.getAllBlocks().length > 1) {
        if (!confirm('Create a new project? All unsaved changes will be lost.')) {
            return;
        }
    }

    _disableCentering = true;
    workspace.clear();
    addDefaultBlocks();
    _disableCentering = false;
    currentProjectName = 'untitled';
    logToConsole('info', 'New project created.');
    showToast('info', 'New project created');
}

/**
 * Save the current project as a JSON file
 * The workspace state is serialized using Blockly's built-in serialization
 */
function saveProject() {
    try {
        // Serialize workspace state
        const state = blocklyWorkspaceSave(workspace);

        // Create project data (including AI Studio data)
        const projectData = {
            name: currentProjectName,
            version: '2.0',
            created: new Date().toISOString(),
            language: currentLang,
            workspace: state,
            aiStudio: typeof aiGetSaveData === 'function' ? aiGetSaveData() : null,
        };

        // Convert to JSON and download
        const jsonStr = JSON.stringify(projectData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${currentProjectName}.bbp`;
        link.click();

        URL.revokeObjectURL(url);

        logToConsole('success', `Project saved as "${currentProjectName}.bbp"`);
        showToast('success', 'Project saved successfully!');
    } catch (err) {
        logToConsole('error', `Error saving project: ${err.message}`);
        showToast('error', 'Failed to save project');
    }
}

/**
 * Open a project file from disk
 * @param {Event} event - File input change event
 */
function openProject(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const projectData = JSON.parse(e.target.result);

            // Validate project format
            if (!projectData.workspace) {
                throw new Error('Invalid project file format');
            }

            // Clear workspace and load state
            _disableCentering = true;
            workspace.clear();
            Blockly.serialization.workspaces.load(projectData.workspace, workspace);
            _disableCentering = false;

            // Restore language
            if (projectData.language) {
                switchLanguage(projectData.language);
            }

            currentProjectName = projectData.name || 'loaded_project';

            // Restore AI Studio data
            if (projectData.aiStudio && typeof aiLoadSaveData === 'function') {
                aiLoadSaveData(projectData.aiStudio);
            }

            logToConsole('success', `Project "${currentProjectName}" loaded successfully.`);
            showToast('success', `Project "${currentProjectName}" loaded!`);
        } catch (err) {
            logToConsole('error', `Error loading project: ${err.message}`);
            showToast('error', 'Failed to load project file');
        }
    };

    reader.readAsText(file);
    // Reset file input so same file can be opened again
    event.target.value = '';
}

// ==========================================
// Sample Projects
// ==========================================

/**
 * Pre-built sample project templates for common use cases
 */
const SAMPLE_PROJECTS = {
    motor: {
        name: 'DC Motor Control',
        description: 'Spin motor forward on Port 1 (GPIO 18, 19)',
        blocks: {
            "blocks": {
                "languageVersion": 0,
                "blocks": [
                    {
                        "type": "start_program",
                        "id": "start_block",
                        "x": 50,
                        "y": 50,
                        "next": {
                            "type": "motor_forward",
                            "id": "motor_block",
                            "fields": {
                                "IN1": 18,
                                "IN2": 19,
                                "EN": 18,
                                "SPEED": 200
                            },
                            "next": {
                                "type": "delay_ms",
                                "id": "delay_block",
                                "fields": {
                                    "DELAY": 2000
                                },
                                "next": {
                                    "type": "motor_stop",
                                    "id": "stop_block",
                                    "fields": {
                                        "IN1": 18,
                                        "IN2": 19,
                                        "EN": 18
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    led_blink: {
        name: 'LED Blink',
        description: 'Blink LED with delay',
        blocks: {
            "blocks": {
                "languageVersion": 0,
                "blocks": [
                    {
                        "type": "start_program",
                        "id": "start_block",
                        "x": 50,
                        "y": 50,
                        "next": {
                            "type": "led_on",
                            "id": "led_on",
                            "fields": { "PIN": "2" },
                            "next": {
                                "type": "delay_ms",
                                "id": "delay1",
                                "fields": { "MS": 1000 },
                                "next": {
                                    "type": "led_off",
                                    "id": "led_off",
                                    "fields": { "PIN": "2" },
                                    "next": {
                                        "type": "delay_ms",
                                        "id": "delay2",
                                        "fields": { "MS": 1000 }
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    servo: {
        name: 'Servo Motor',
        description: 'Rotate servo motor to different angles',
        blocks: {
            "blocks": {
                "languageVersion": 0,
                "blocks": [
                    {
                        "type": "start_program",
                        "id": "start_block",
                        "x": 50,
                        "y": 50,
                        "next": {
                            "type": "servo_attach",
                            "id": "servo_attach",
                            "fields": { "PIN": 13 },
                            "next": {
                                "type": "servo_write",
                                "id": "servo_90",
                                "fields": { "PIN": 13, "ANGLE": 90 },
                                "next": {
                                    "type": "delay_ms",
                                    "id": "delay1",
                                    "fields": { "DELAY": 1000 },
                                    "next": {
                                        "type": "servo_write",
                                        "id": "servo_180",
                                        "fields": { "PIN": 13, "ANGLE": 180 },
                                        "next": {
                                            "type": "delay_ms",
                                            "id": "delay2",
                                            "fields": { "DELAY": 1000 }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
};

/**
 * Load a sample project into the workspace
 * @param {string} exampleId - The sample project ID (motor, led_blink, servo)
 */
function loadSampleProject(exampleId) {
    // Confirm if workspace has existing blocks
    if (workspace.getAllBlocks().length > 1) {
        if (!confirm(`Load sample project? Current project will be replaced.`)) {
            return;
        }
    }

    _disableCentering = true;
    // Clear workspace
    workspace.clear();

    // Create blocks without connecting them
    try {
        if (exampleId === 'motor') {
            // Start Program
            const startBlock = workspace.newBlock('start_program');
            startBlock.initSvg();
            startBlock.render();

            // Motor Forward with correct pins
            const motorBlock = workspace.newBlock('motor_forward');
            motorBlock.setFieldValue(18, 'IN1');
            motorBlock.setFieldValue(19, 'IN2');
            motorBlock.setFieldValue(18, 'EN');
            motorBlock.setFieldValue(200, 'SPEED');
            motorBlock.initSvg();
            motorBlock.render();

            // Delay
            const delayBlock = workspace.newBlock('delay_ms');
            delayBlock.setFieldValue(2000, 'MS');
            delayBlock.initSvg();
            delayBlock.render();

            // Motor Stop
            const stopBlock = workspace.newBlock('motor_stop');
            stopBlock.setFieldValue(18, 'IN1');
            stopBlock.setFieldValue(19, 'IN2');
            stopBlock.setFieldValue(18, 'EN');
            stopBlock.initSvg();
            stopBlock.render();

            currentProjectName = 'dc_motor_control';
            logToConsole('info', `📚 Loaded DC Motor Control blocks`);
            logToConsole('info', `   Connect: Start → Motor → Delay → Stop`);
            showToast('info', 'Blocks loaded - connect them manually');
        }
        else if (exampleId === 'led_blink') {
            const startBlock = workspace.newBlock('start_program');
            startBlock.initSvg();
            startBlock.render();

            const ledOn = workspace.newBlock('led_on');
            ledOn.setFieldValue('2', 'PIN');
            ledOn.initSvg();
            ledOn.render();

            const delay1 = workspace.newBlock('delay_ms');
            delay1.setFieldValue(1000, 'MS');
            delay1.initSvg();
            delay1.render();

            const ledOff = workspace.newBlock('led_off');
            ledOff.setFieldValue('2', 'PIN');
            ledOff.initSvg();
            ledOff.render();

            const delay2 = workspace.newBlock('delay_ms');
            delay2.setFieldValue(1000, 'MS');
            delay2.initSvg();
            delay2.render();

            currentProjectName = 'led_blink';
            logToConsole('info', `📚 Loaded LED Blink blocks`);
            showToast('info', 'Blocks loaded - connect them manually');
        }
        else if (exampleId === 'servo') {
            const startBlock = workspace.newBlock('start_program');
            startBlock.initSvg();
            startBlock.render();
            
            const attach = workspace.newBlock('servo_attach');
            attach.setFieldValue(13, 'PIN');
            attach.initSvg();
            attach.render();

            const servo90 = workspace.newBlock('servo_write');
            servo90.setFieldValue(13, 'PIN');
            servo90.setFieldValue(90, 'ANGLE');
            servo90.initSvg();
            servo90.render();

            const delay1 = workspace.newBlock('delay_ms');
            delay1.setFieldValue(1000, 'MS');
            delay1.initSvg();
            delay1.render();

            const servo180 = workspace.newBlock('servo_write');
            servo180.setFieldValue(13, 'PIN');
            servo180.setFieldValue(180, 'ANGLE');
            servo180.initSvg();
            servo180.render();

            const delay2 = workspace.newBlock('delay_ms');
            delay2.setFieldValue(1000, 'MS');
            delay2.initSvg();
            delay2.render();

            currentProjectName = 'servo_motor';
            logToConsole('info', `📚 Loaded Servo Motor blocks`);
            showToast('info', 'Blocks loaded - connect them manually');
        }
        else if (exampleId === 'ultrasonic_buzzer') {
            const startBlock = workspace.newBlock('start_program');
            startBlock.initSvg();
            startBlock.render();

            const setupBlock = workspace.newBlock('ultrasonic_setup');
            setupBlock.setFieldValue('12', 'TRIG');
            setupBlock.setFieldValue('13', 'ECHO');
            setupBlock.initSvg();
            setupBlock.render();
            startBlock.getInput('SETUP').connection.connect(setupBlock.previousConnection);

            const ifBlock = workspace.newBlock('if_condition');
            ifBlock.initSvg();
            ifBlock.render();
            startBlock.getInput('LOOP').connection.connect(ifBlock.previousConnection);

            const compBlock = workspace.newBlock('comparison');
            compBlock.setFieldValue('LT', 'OP');
            compBlock.initSvg();
            compBlock.render();
            ifBlock.getInput('CONDITION').connection.connect(compBlock.outputConnection);

            const readBlock = workspace.newBlock('ultrasonic_read');
            readBlock.setFieldValue('12', 'TRIG');
            readBlock.setFieldValue('13', 'ECHO');
            readBlock.initSvg();
            readBlock.render();
            compBlock.getInput('A').connection.connect(readBlock.outputConnection);

            const numBlock = workspace.newBlock('math_number');
            numBlock.setFieldValue(20, 'NUM');
            numBlock.initSvg();
            numBlock.render();
            compBlock.getInput('B').connection.connect(numBlock.outputConnection);

            const buzzerOnBlock = workspace.newBlock('buzzer_on');
            buzzerOnBlock.setFieldValue('18', 'PIN');
            buzzerOnBlock.initSvg();
            buzzerOnBlock.render();
            ifBlock.getInput('DO').connection.connect(buzzerOnBlock.previousConnection);

            const delay1Block = workspace.newBlock('delay_ms');
            delay1Block.setFieldValue(300, 'MS');
            delay1Block.initSvg();
            delay1Block.render();
            buzzerOnBlock.nextConnection.connect(delay1Block.previousConnection);

            const buzzerOffBlock = workspace.newBlock('buzzer_off');
            buzzerOffBlock.setFieldValue('18', 'PIN');
            buzzerOffBlock.initSvg();
            buzzerOffBlock.render();
            delay1Block.nextConnection.connect(buzzerOffBlock.previousConnection);

            const delay2Block = workspace.newBlock('delay_ms');
            delay2Block.setFieldValue(100, 'MS');
            delay2Block.initSvg();
            delay2Block.render();
            buzzerOffBlock.nextConnection.connect(delay2Block.previousConnection);

            currentProjectName = 'ultrasonic_alarm';
            logToConsole('info', `📚 Loaded Ultrasonic Alarm blocks`);
            logToConsole('info', `   Trig Pin: 12, Echo Pin: 13, Buzzer Pin: 18`);
            showToast('info', 'Ultrasonic Alarm example loaded successfully!');
        }
        else if (exampleId === 'line_follower') {
            loadLineFollowerBlocks();
        }
    } catch (err) {
        logToConsole('error', `Error loading sample: ${err.message}`);
        showToast('error', 'Failed to load sample project');
    } finally {
        _disableCentering = false;
    }
}

// ==========================================
// ESP32 Upload
// ==========================================

/**
 * Upload generated code to ESP32 via the Flask backend
 * Requires the backend server to be running
 */
/**
 * Helper to update the state of a step in the upload progress modal
 */
function setUploadStepState(stepId, state) {
    const stepEl = document.getElementById(`step-${stepId}`);
    if (!stepEl) return;
    
    stepEl.classList.remove('upload-step--pending', 'upload-step--active', 'upload-step--success', 'upload-step--failed');
    const iconEl = stepEl.querySelector('.upload-step__icon');
    
    if (state === 'pending') {
        stepEl.classList.add('upload-step--pending');
        iconEl.innerHTML = '⚪';
    } else if (state === 'active') {
        stepEl.classList.add('upload-step--active');
        iconEl.innerHTML = `<svg class="spinner" width="16" height="16" viewBox="0 0 50 50"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle></svg>`;
    } else if (state === 'success') {
        stepEl.classList.add('upload-step--success');
        iconEl.innerHTML = '✅';
    } else if (state === 'failed') {
        stepEl.classList.add('upload-step--failed');
        iconEl.innerHTML = '❌';
    }
}

/**
 * Helper to append a line to the upload progress log
 */
function appendUploadLog(text, type = 'info') {
    const logsEl = document.getElementById('uploadLogs');
    if (!logsEl) return;
    
    const line = document.createElement('div');
    line.className = `upload-log-line upload-log-line--${type}`;
    line.textContent = text;
    logsEl.appendChild(line);
    logsEl.scrollTop = logsEl.scrollHeight;
}

/**
 * Upload generated code to ESP32 via the Flask backend
 * Requires the backend server to be running
 */
async function uploadToESP32() {
    // 1. Always generate fresh code first
    generateCode();
    const code = document.getElementById('codeOutput').value;
    const isMicroPython = currentCodeGenerator === 'micropython';
    const noCode = isMicroPython ? '# No blocks' : '// No blocks';

    const hasGenerationError = code.startsWith('# Error generating code') || code.startsWith('// Error generating code');
    if (!code || code.startsWith(noCode) || hasGenerationError) {
        showToast('warning', 'Please add valid blocks to generate code before uploading!');
        return;
    }

    // 2. Show the Upload Progress Modal
    const overlay = document.getElementById('uploadOverlay');
    const statusText = document.getElementById('uploadStatusText');
    const actions = document.getElementById('uploadActions');
    const closeBtn = document.getElementById('uploadClose');
    const logsEl = document.getElementById('uploadLogs');

    overlay.style.display = 'flex';
    logsEl.innerHTML = '';
    actions.style.display = 'none';
    closeBtn.style.display = 'none';

    // Set initial step states
    setUploadStepState('generate', 'active');
    setUploadStepState('prepare', 'pending');
    setUploadStepState('compile', 'pending');
    setUploadStepState('upload', 'pending');
    setUploadStepState('verify', 'pending');

    statusText.textContent = 'Generating code from Blockly workspace...';
    appendUploadLog('>>> Starting ESP32 upload pipeline...', 'info');
    appendUploadLog(`Selected firmware target: ${isMicroPython ? 'MicroPython' : 'Arduino C++'}`, 'info');

    // Wait a brief moment to show the generation step
    await new Promise(r => setTimeout(r, 600));
    setUploadStepState('generate', 'success');
    appendUploadLog('Code generated successfully from Blockly workspace.', 'success');

    // Step 2: Preparing Sketch
    setUploadStepState('prepare', 'active');
    statusText.textContent = 'Preparing sketch directory and temporary files...';
    appendUploadLog('Creating temporary sketch directory...', 'info');
    
    // Step 3: Compiling
    if (isMicroPython) {
        setUploadStepState('prepare', 'success');
        setUploadStepState('compile', 'success'); // MicroPython doesn't need compilation
        appendUploadLog('MicroPython target: Skipping compilation step.', 'success');
    } else {
        setUploadStepState('prepare', 'success');
        setUploadStepState('compile', 'active');
        statusText.textContent = 'Compiling sketch using Arduino CLI... (this may take a minute)';
        appendUploadLog('Compiling sketch with --clean flag to prevent stale build artifacts...', 'info');
    }

    try {
        // Resolve port
        let detectedPort = 'auto';
        appendUploadLog('Scanning for connected serial ports...', 'info');
        try {
            const portResponse = await fetch('http://localhost:5001/api/detect-port');
            if (portResponse.ok) {
                const portData = await portResponse.json();
                if (portData.success && portData.ports && portData.ports.length > 0) {
                    detectedPort = portData.ports[0].address;
                    appendUploadLog(`Detected port: ${portData.ports[0].label}`, 'success');
                } else {
                    appendUploadLog('No port detected. Attempting upload on default port.', 'warning');
                }
            }
        } catch (e) {
            appendUploadLog(`Port scan failed: ${e.message}. Using default.`, 'warning');
        }

        const selectedFqbn = document.getElementById('boardTypeSelect')?.value || 'esp32:esp32:esp32';
        const selectedBaud = document.getElementById('baudRateSelect')?.value || '115200';
        appendUploadLog(`Selected board FQBN: ${selectedFqbn}`, 'info');
        appendUploadLog(`Selected upload speed: ${selectedBaud} bps`, 'info');
        
        const uploadBody = { code: code, port: detectedPort, fqbn: selectedFqbn, baud_rate: selectedBaud };
        const endpoint = isMicroPython ? '/upload' : '/upload-arduino';

        if (!isMicroPython) {
            setUploadStepState('upload', 'pending');
        } else {
            setUploadStepState('upload', 'active');
            statusText.textContent = 'Uploading MicroPython code to ESP32...';
        }

        appendUploadLog(`Sending upload request to backend endpoint: ${endpoint}`, 'info');
        const response = await fetch(`http://localhost:5001${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(uploadBody),
        });

        const result = await response.json();

        // Print backend logs to our UI terminal
        if (result.logs && Array.isArray(result.logs)) {
            result.logs.forEach(logLine => {
                let type = 'info';
                if (logLine.includes('Error') || logLine.includes('failed')) type = 'error';
                else if (logLine.includes('successful') || logLine.includes('verified')) type = 'success';
                else if (logLine.includes('Warning')) type = 'warning';
                appendUploadLog(logLine, type);
            });
        }

        if (response.ok && result.success) {
            if (!isMicroPython) {
                setUploadStepState('compile', 'success');
                setUploadStepState('upload', 'success');
                setUploadStepState('verify', result.flash_verified ? 'success' : 'pending');
            } else {
                setUploadStepState('upload', 'success');
                setUploadStepState('verify', 'success');
            }

            statusText.textContent = 'Upload Successful!';
            statusText.style.color = '#4ade80';
            appendUploadLog('>>> Upload pipeline completed successfully!', 'success');
            showToast('success', 'Code uploaded to ESP32 successfully!');
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    } catch (err) {
        // Find where it failed based on active step
        if (document.getElementById('step-compile').classList.contains('upload-step--active')) {
            setUploadStepState('compile', 'failed');
        } else {
            setUploadStepState('upload', 'failed');
        }
        setUploadStepState('verify', 'failed');

        statusText.textContent = 'Upload Failed!';
        statusText.style.color = '#f87171';
        appendUploadLog(`>>> Error: ${err.message}`, 'error');
        if (err.output) {
            appendUploadLog(`Details:\n${err.output}`, 'error');
        }
        showToast('error', 'Upload failed! Check logs for details.');
    } finally {
        actions.style.display = 'flex';
        closeBtn.style.display = 'block';
    }
}

// ==========================================
// Simulation Mode
// ==========================================

/**
 * Toggle the simulation panel visibility
 */
function toggleSimulation() {
    const overlay = document.getElementById('simOverlay');
    isSimulating = !isSimulating;

    if (isSimulating) {
        runSimulation();
        overlay.classList.add('sim-overlay--visible');
        logToConsole('info', 'Simulation started.');
    } else {
        closeSimulation();
    }
}

/**
 * Close the simulation panel
 */
function closeSimulation() {
    stopAnimatedSimulation();  // Stop any running animation
    const overlay = document.getElementById('simOverlay');
    overlay.classList.remove('sim-overlay--visible');
    isSimulating = false;
}

/**
 * Run the simulation by analyzing ALL blocks in the workspace
 * Shows virtual LEDs, servos, sensors, buzzer, relay, motor, etc.
 */
function runSimulation() {
    const blocks = workspace.getAllBlocks(true);
    const ledsContainer = document.getElementById('simLeds');
    const servoContainer = document.getElementById('simServo');

    // Clear previous simulation state
    ledsContainer.innerHTML = '';
    servoContainer.style.display = 'none';

    // Track device states
    const ledPins = {};
    let servoPin = null;
    let servoAngle = 0;
    const devices = {
        ultrasonic: [],
        ir: [],
        buzzer: [],
        relay: [],
        motor: [],
        dht: [],
        touch: [],
        lcd: false,
    };

    // Analyze all blocks for device usage
    blocks.forEach(block => {
        switch (block.type) {
            case 'led_on':
            case 'led_blink':
                ledPins[block.getFieldValue('PIN')] = true;
                break;
            case 'led_off':
                if (!(block.getFieldValue('PIN') in ledPins)) ledPins[block.getFieldValue('PIN')] = false;
                break;
            case 'digital_write': {
                const pin = block.getFieldValue('PIN');
                const state = block.getFieldValue('STATE');
                ledPins[pin] = state === 'HIGH';
                break;
            }
            case 'servo_control':
                servoPin = block.getFieldValue('PIN');
                servoAngle = block.getFieldValue('ANGLE');
                break;
            case 'servo_sweep':
                servoPin = block.getFieldValue('PIN');
                servoAngle = block.getFieldValue('TO');
                break;
            case 'ultrasonic_setup':
            case 'ultrasonic_read':
                devices.ultrasonic.push({ trig: block.getFieldValue('TRIG'), echo: block.getFieldValue('ECHO') });
                break;
            case 'ir_read':
            case 'ir_detected':
                devices.ir.push({ pin: block.getFieldValue('PIN') });
                break;
            case 'buzzer_on':
            case 'buzzer_tone':
            case 'buzzer_note':
                devices.buzzer.push({ pin: block.getFieldValue('PIN'), on: true });
                break;
            case 'buzzer_off':
            case 'buzzer_notone':
                devices.buzzer.push({ pin: block.getFieldValue('PIN'), on: false });
                break;
            case 'relay_on':
                devices.relay.push({ pin: block.getFieldValue('PIN'), on: true });
                break;
            case 'relay_off':
                devices.relay.push({ pin: block.getFieldValue('PIN'), on: false });
                break;
            case 'motor_forward':
                devices.motor.push({ in1: block.getFieldValue('IN1'), dir: 'Forward', speed: block.getFieldValue('SPEED') });
                break;
            case 'motor_backward':
                devices.motor.push({ in1: block.getFieldValue('IN1'), dir: 'Backward', speed: block.getFieldValue('SPEED') });
                break;
            case 'motor_stop':
                devices.motor.push({ in1: block.getFieldValue('IN1'), dir: 'Stopped', speed: 0 });
                break;
            case 'dht_setup':
            case 'dht_read_temp':
            case 'dht_read_humidity':
                devices.dht.push({ pin: block.getFieldValue('PIN') });
                break;
            case 'touch_read':
            case 'touch_detected':
                devices.touch.push({ pin: block.getFieldValue('PIN') });
                break;
            case 'lcd_setup':
            case 'lcd_print':
                devices.lcd = true;
                break;
            // AI Control blocks map to hardware
            case 'ai_control_device':
                ledPins[block.getFieldValue('PIN')] = block.getFieldValue('ACTION') === 'ON';
                break;
            case 'ai_control_servo':
                servoPin = block.getFieldValue('PIN');
                servoAngle = block.getFieldValue('ANGLE');
                break;
            case 'ai_control_motor':
                devices.motor.push({ in1: block.getFieldValue('PIN'), dir: block.getFieldValue('DIRECTION'), speed: block.getFieldValue('SPEED') });
                break;
            // AI event blocks — recognized so workspace isn't "empty"
            case 'ai_when_detected':
            case 'ai_get_prediction':
            case 'ai_get_confidence':
            case 'ai_start_prediction':
            case 'ai_stop_prediction':
            case 'ai_when_hand':
            case 'ai_get_hand_gesture':
            case 'ai_hand_detected':
            case 'ai_when_pose':
            case 'ai_get_pose':
            case 'ai_when_face':
            case 'ai_face_detected':
            case 'ai_get_face_expression':
            case 'ai_when_speech':
            case 'ai_get_speech':
            case 'ai_start_listening':
            case 'ai_stop_listening':
            case 'ai_print_result':
                // AI event blocks are browser-side only
                break;
        }
    });

    // --- Render LEDs ---
    if (Object.keys(ledPins).length === 0 && Object.values(devices).every(v => Array.isArray(v) ? v.length === 0 : !v)) {
        [2, 4, 5].forEach(pin => { ledPins[pin] = false; });
    }
    for (const [pin, isOn] of Object.entries(ledPins)) {
        ledsContainer.insertAdjacentHTML('beforeend', `
            <div class="sim-led">
                <div class="sim-led__light ${isOn ? 'sim-led__light--on' : ''}"></div>
                <div class="sim-led__label">LED Pin ${pin}</div>
            </div>
        `);
    }

    // --- Render Ultrasonic Sensor ---
    const uniqueUS = [...new Map(devices.ultrasonic.map(d => [d.trig, d])).values()];
    uniqueUS.forEach(us => {
        const dist = (Math.random() * 100 + 5).toFixed(1);
        ledsContainer.insertAdjacentHTML('beforeend', `
            <div class="sim-led">
                <div class="sim-led__light" style="background: radial-gradient(circle, #4fc3f7, #0288d1); border-color: #4fc3f7; box-shadow: 0 0 15px rgba(79,195,247,0.5);">
                    <span style="color: #fff; font-size: 14px; display: flex; align-items: center; justify-content: center; height: 100%;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg></span>
                </div>
                <div class="sim-led__label">Ultrasonic (T:${us.trig})</div>
                <div class="sim-led__label" style="color: #4fc3f7; font-weight: 600;">${dist} cm</div>
            </div>
        `);
    });

    // --- Render IR Sensor ---
    const uniqueIR = [...new Map(devices.ir.map(d => [d.pin, d])).values()];
    uniqueIR.forEach(ir => {
        const detected = Math.random() > 0.5;
        ledsContainer.insertAdjacentHTML('beforeend', `
            <div class="sim-led">
                <div class="sim-led__light" style="background: ${detected ? 'radial-gradient(circle, #ff5252, #c62828)' : '#333'}; border-color: ${detected ? '#ff5252' : '#555'}; box-shadow: ${detected ? '0 0 15px rgba(255,82,82,0.5)' : 'none'};">
                    <span style="color: #fff; font-size: 14px; display: flex; align-items: center; justify-content: center; height: 100%;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg></span>
                </div>
                <div class="sim-led__label">IR Pin ${ir.pin}</div>
                <div class="sim-led__label" style="color: ${detected ? '#ff5252' : '#888'}; font-weight: 600;">${detected ? 'Obstacle!' : 'Clear'}</div>
            </div>
        `);
    });

    // --- Render Buzzer ---
    const uniqueBuzzer = [...new Map(devices.buzzer.map(d => [d.pin, d])).values()];
    uniqueBuzzer.forEach(bz => {
        ledsContainer.insertAdjacentHTML('beforeend', `
            <div class="sim-led">
                <div class="sim-led__light" style="background: ${bz.on ? 'radial-gradient(circle, #ffd740, #ff8f00)' : '#333'}; border-color: ${bz.on ? '#ffd740' : '#555'}; box-shadow: ${bz.on ? '0 0 20px rgba(255,215,64,0.6)' : 'none'}; ${bz.on ? 'animation: ledGlow 0.3s ease-in-out infinite;' : ''}">
                    <span style="color: ${bz.on ? '#333' : '#fff'}; font-size: 14px; display: flex; align-items: center; justify-content: center; height: 100%;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4v-14z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg></span>
                </div>
                <div class="sim-led__label">Buzzer Pin ${bz.pin}</div>
                <div class="sim-led__label" style="color: ${bz.on ? '#ffd740' : '#888'}; font-weight: 600;">${bz.on ? 'Playing ♪' : 'Silent'}</div>
            </div>
        `);
    });

    // --- Render Relay ---
    const uniqueRelay = [...new Map(devices.relay.map(d => [d.pin, d])).values()];
    uniqueRelay.forEach(rl => {
        ledsContainer.insertAdjacentHTML('beforeend', `
            <div class="sim-led">
                <div class="sim-led__light" style="background: ${rl.on ? 'radial-gradient(circle, #69f0ae, #00c853)' : '#333'}; border-color: ${rl.on ? '#69f0ae' : '#555'}; box-shadow: ${rl.on ? '0 0 15px rgba(105,240,174,0.5)' : 'none'};">
                    <span style="color: #fff; font-size: 14px; display: flex; align-items: center; justify-content: center; height: 100%;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20"/><path d="M12 2l4 4"/><path d="M12 6l-4-4"/><path d="M12 18l4 4"/><path d="M12 22l-4-4"/></svg></span>
                </div>
                <div class="sim-led__label">Relay Pin ${rl.pin}</div>
                <div class="sim-led__label" style="color: ${rl.on ? '#69f0ae' : '#888'}; font-weight: 600;">${rl.on ? 'ON' : 'OFF'}</div>
            </div>
        `);
    });

    // --- Render Motor ---
    const uniqueMotor = [...new Map(devices.motor.map(d => [d.in1, d])).values()];
    uniqueMotor.forEach(mt => {
        const isRunning = mt.dir !== 'Stopped';
        ledsContainer.insertAdjacentHTML('beforeend', `
            <div class="sim-led">
                <div class="sim-led__light" style="background: ${isRunning ? 'radial-gradient(circle, #e040fb, #9c27b0)' : '#333'}; border-color: ${isRunning ? '#e040fb' : '#555'}; box-shadow: ${isRunning ? '0 0 15px rgba(224,64,251,0.5)' : 'none'}; ${isRunning ? 'animation: ledGlow 0.5s ease-in-out infinite;' : ''}">
                    <span style="color: #fff; font-size: 14px; display: flex; align-items: center; justify-content: center; height: 100%;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></span>
                </div>
                <div class="sim-led__label">Motor IN1:${mt.in1}</div>
                <div class="sim-led__label" style="color: ${isRunning ? '#e040fb' : '#888'}; font-weight: 600;">${mt.dir} ${isRunning ? `(${mt.speed})` : ''}</div>
            </div>
        `);
    });

    // --- Render DHT ---
    const uniqueDHT = [...new Map(devices.dht.map(d => [d.pin, d])).values()];
    uniqueDHT.forEach(dht => {
        const temp = (20 + Math.random() * 15).toFixed(1);
        const hum = (40 + Math.random() * 30).toFixed(0);
        ledsContainer.insertAdjacentHTML('beforeend', `
            <div class="sim-led">
                <div class="sim-led__light" style="background: radial-gradient(circle, #ff7043, #e64a19); border-color: #ff7043; box-shadow: 0 0 12px rgba(255,112,67,0.4);">
                    <span style="color: #fff; font-size: 14px; display: flex; align-items: center; justify-content: center; height: 100%;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg></span>
                </div>
                <div class="sim-led__label">DHT Pin ${dht.pin}</div>
                <div class="sim-led__label" style="color: #ff7043; font-weight: 600;">${temp}°C | ${hum}%</div>
            </div>
        `);
    });

    // --- Render Touch Sensor ---
    const uniqueTouch = [...new Map(devices.touch.map(d => [d.pin, d])).values()];
    uniqueTouch.forEach(tc => {
        const val = Math.floor(Math.random() * 80);
        const touched = val < 40;
        ledsContainer.insertAdjacentHTML('beforeend', `
            <div class="sim-led">
                <div class="sim-led__light" style="background: ${touched ? 'radial-gradient(circle, #80deea, #00bcd4)' : '#333'}; border-color: ${touched ? '#80deea' : '#555'}; box-shadow: ${touched ? '0 0 15px rgba(128,222,234,0.5)' : 'none'};">
                    <span style="color: #fff; font-size: 14px; display: flex; align-items: center; justify-content: center; height: 100%;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg></span>
                </div>
                <div class="sim-led__label">Touch GPIO ${tc.pin}</div>
                <div class="sim-led__label" style="color: ${touched ? '#80deea' : '#888'}; font-weight: 600;">Val: ${val} ${touched ? '(Touched!)' : ''}</div>
            </div>
        `);
    });

    // --- Render LCD ---
    if (devices.lcd) {
        ledsContainer.insertAdjacentHTML('beforeend', `
            <div class="sim-led">
                <div style="width: 120px; height: 40px; background: #1a237e; border: 2px solid #5c6bc0; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #64ffda; font-family: var(--font-mono); font-size: 11px; box-shadow: 0 0 10px rgba(92,107,192,0.4);">
                    Hello World!
                </div>
                <div class="sim-led__label" style="margin-top: 6px;">LCD I2C Display</div>
            </div>
        `);
    }

    // --- Render Servo Gauge ---
    if (servoPin !== null) {
        servoContainer.style.display = 'flex';
        const needle = document.getElementById('simServoNeedle');
        const angleLabel = document.getElementById('simServoAngle');
        const rotation = servoAngle - 90;
        needle.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
        angleLabel.textContent = servoAngle;
    }

    // --- Log Summary ---
    const totalDevices = Object.keys(ledPins).length + uniqueUS.length + uniqueIR.length +
        uniqueBuzzer.length + uniqueRelay.length + uniqueMotor.length + uniqueDHT.length +
        uniqueTouch.length + (devices.lcd ? 1 : 0) + (servoPin !== null ? 1 : 0);
    logToConsole('info', `Simulation: ${totalDevices} device(s) detected`);
    if (uniqueUS.length) logToConsole('info', `  Ultrasonic sensor(s): ${uniqueUS.length}`);
    if (uniqueIR.length) logToConsole('info', `  IR sensor(s): ${uniqueIR.length}`);
    if (uniqueBuzzer.length) logToConsole('info', `  Buzzer(s): ${uniqueBuzzer.length}`);
    if (uniqueRelay.length) logToConsole('info', `  Relay(s): ${uniqueRelay.length}`);
    if (uniqueMotor.length) logToConsole('info', `  Motor(s): ${uniqueMotor.length}`);
    if (uniqueDHT.length) logToConsole('info', `  DHT sensor(s): ${uniqueDHT.length}`);
    if (uniqueTouch.length) logToConsole('info', `  Touch sensor(s): ${uniqueTouch.length}`);
    if (devices.lcd) logToConsole('info', `  LCD Display: Active`);
    if (servoPin !== null) logToConsole('info', `  Servo: Pin ${servoPin} at ${servoAngle}°`);
}


// ==========================================
// Buzzer Audio System (Web Audio API)
// ==========================================

/** @type {AudioContext} Shared audio context for buzzer sounds */
let _audioCtx = null;

/** @type {OscillatorNode} Currently playing oscillator */
let _buzzerOsc = null;

/** @type {GainNode} Gain node for volume control & fade */
let _buzzerGain = null;

/**
 * Get or create the shared AudioContext (lazy init).
 * Must be called from a user gesture (click/tap) the first time.
 */
function getBuzzerAudioCtx() {
    if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (browsers require user gesture)
    if (_audioCtx.state === 'suspended') {
        _audioCtx.resume();
    }
    return _audioCtx;
}

/**
 * Play a buzzer tone at a given frequency.
 * Uses a square wave oscillator to mimic a piezo buzzer.
 * @param {number} freq - Frequency in Hz (e.g. 440 for A4)
 * @param {number} [durationMs] - Optional duration in ms. If omitted, plays indefinitely until stopBuzzerSound().
 */
function playBuzzerSound(freq, durationMs) {
    // Stop any currently playing tone first
    stopBuzzerSound();

    const ctx = getBuzzerAudioCtx();

    // Create oscillator (square wave = buzzer-like)
    _buzzerOsc = ctx.createOscillator();
    _buzzerOsc.type = 'square';
    _buzzerOsc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Create gain node for volume & smooth start/stop
    _buzzerGain = ctx.createGain();
    _buzzerGain.gain.setValueAtTime(0, ctx.currentTime);
    _buzzerGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02); // Fade in

    // Connect: oscillator → gain → speakers
    _buzzerOsc.connect(_buzzerGain);
    _buzzerGain.connect(ctx.destination);

    _buzzerOsc.start();

    // If duration specified, auto-stop after that time
    if (durationMs && durationMs > 0) {
        const stopTime = ctx.currentTime + (durationMs / 1000);
        _buzzerGain.gain.setValueAtTime(0.15, stopTime - 0.02);
        _buzzerGain.gain.linearRampToValueAtTime(0, stopTime); // Fade out
        _buzzerOsc.stop(stopTime + 0.01);
        _buzzerOsc.onended = () => {
            _buzzerOsc = null;
            _buzzerGain = null;
        };
    }
}

/**
 * Stop the currently playing buzzer sound (if any).
 */
function stopBuzzerSound() {
    if (_buzzerOsc) {
        try {
            const ctx = getBuzzerAudioCtx();
            if (_buzzerGain) {
                _buzzerGain.gain.setValueAtTime(_buzzerGain.gain.value, ctx.currentTime);
                _buzzerGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.02);
            }
            _buzzerOsc.stop(ctx.currentTime + 0.03);
        } catch (e) {
            // Already stopped
        }
        _buzzerOsc = null;
        _buzzerGain = null;
    }
}

// ==========================================
// Animated Step-by-Step Simulation
// ==========================================

let simAnimationTimer = null;
let simIsRunning = false;

/**
 * Collect ordered actions from blocks inside the LOOP input of start_program.
 * Walks the chain of connected blocks and returns an array of step descriptors.
 */
function collectSimSteps() {
    const allBlocks = workspace.getAllBlocks(true);
    const startBlock = allBlocks.find(b => b.type === 'start_program');
    if (!startBlock) return [];

    const steps = [];

    // Collect SETUP steps
    let setupBlock = startBlock.getInputTargetBlock('SETUP');
    while (setupBlock) {
        steps.push({ ...describeBlock(setupBlock), phase: 'setup' });
        setupBlock = setupBlock.getNextBlock();
    }

    // Collect LOOP steps
    let loopBlock = startBlock.getInputTargetBlock('LOOP');
    while (loopBlock) {
        steps.push({ ...describeBlock(loopBlock), phase: 'loop' });
        loopBlock = loopBlock.getNextBlock();
    }

    return steps;
}

/**
 * Describe a single block as a simulation step
 */
function describeBlock(block) {
    const type = block.type;
    switch (type) {
        case 'led_on':
            return { action: 'led', pin: block.getFieldValue('PIN'), state: true, label: `LED Pin ${block.getFieldValue('PIN')} → ON` };
        case 'led_off':
            return { action: 'led', pin: block.getFieldValue('PIN'), state: false, label: `LED Pin ${block.getFieldValue('PIN')} → OFF` };
        case 'led_blink':
            return { action: 'blink', pin: block.getFieldValue('PIN'), delay: parseInt(block.getFieldValue('DELAY')), label: `LED Pin ${block.getFieldValue('PIN')} Blink (${block.getFieldValue('DELAY')}ms)` };
        case 'digital_write': {
            const state = block.getFieldValue('STATE');
            return { action: 'led', pin: block.getFieldValue('PIN'), state: state === 'HIGH', label: `Pin ${block.getFieldValue('PIN')} → ${state}` };
        }
        case 'servo_control':
            return { action: 'servo', pin: block.getFieldValue('PIN'), angle: parseInt(block.getFieldValue('ANGLE')), label: `Servo Pin ${block.getFieldValue('PIN')} → ${block.getFieldValue('ANGLE')}°` };
        case 'servo_sweep':
            return { action: 'sweep', pin: block.getFieldValue('PIN'), from: parseInt(block.getFieldValue('FROM')), to: parseInt(block.getFieldValue('TO')), speed: parseInt(block.getFieldValue('SPEED')), label: `Servo Sweep ${block.getFieldValue('FROM')}° → ${block.getFieldValue('TO')}°` };
        case 'delay_ms':
            return { action: 'delay', ms: parseInt(block.getFieldValue('MS')), label: `Delay ${block.getFieldValue('MS')}ms` };
        case 'buzzer_on':
            return { action: 'buzzer', pin: block.getFieldValue('PIN'), state: true, label: `Buzzer Pin ${block.getFieldValue('PIN')} ON` };
        case 'buzzer_off':
        case 'buzzer_notone':
            return { action: 'buzzer', pin: block.getFieldValue('PIN'), state: false, label: `Buzzer Pin ${block.getFieldValue('PIN')} OFF` };
        case 'buzzer_tone':
            return { action: 'buzzer_tone', pin: block.getFieldValue('PIN'), freq: block.getFieldValue('FREQ'), dur: parseInt(block.getFieldValue('DUR')), label: `Buzzer ${block.getFieldValue('FREQ')}Hz for ${block.getFieldValue('DUR')}ms` };
        case 'buzzer_note':
            return { action: 'buzzer_tone', pin: block.getFieldValue('PIN'), freq: block.getFieldValue('NOTE'), dur: parseInt(block.getFieldValue('DUR')), label: `Play note for ${block.getFieldValue('DUR')}ms` };
        case 'relay_on':
            return { action: 'relay', pin: block.getFieldValue('PIN'), state: true, label: `Relay Pin ${block.getFieldValue('PIN')} → ON` };
        case 'relay_off':
            return { action: 'relay', pin: block.getFieldValue('PIN'), state: false, label: `Relay Pin ${block.getFieldValue('PIN')} → OFF` };
        case 'motor_forward':
            return { action: 'motor', dir: 'Forward', speed: block.getFieldValue('SPEED'), label: `Motor Forward (speed ${block.getFieldValue('SPEED')})` };
        case 'motor_backward':
            return { action: 'motor', dir: 'Backward', speed: block.getFieldValue('SPEED'), label: `Motor Backward (speed ${block.getFieldValue('SPEED')})` };
        case 'motor_stop':
            return { action: 'motor', dir: 'Stopped', speed: 0, label: `Motor Stop` };
        case 'serial_print':
            return { action: 'print', label: `Serial Print` };
        default:
            return { action: 'unknown', label: `${type}` };
    }
}

/**
 * Start the animated simulation — walks through blocks step by step
 */
function startAnimatedSimulation() {
    const steps = collectSimSteps();
    if (steps.length === 0) {
        showToast('warning', 'No blocks to simulate! Add blocks to the workspace.');
        return;
    }

    simIsRunning = true;
    document.getElementById('btnStartSim').style.display = 'none';
    document.getElementById('btnStopSim').style.display = 'inline-flex';

    const simLog = document.getElementById('simLog');
    simLog.style.display = 'block';
    simLog.innerHTML = '<div style="color:#4fc3f7;">Simulation started...</div>';

    logToConsole('info', 'Animated simulation started.');

    // Find loop steps (we'll repeat them)
    const setupSteps = steps.filter(s => s.phase === 'setup');
    const loopSteps = steps.filter(s => s.phase === 'loop');

    let currentStep = 0;
    let currentPhase = 'setup';
    let phaseSteps = setupSteps.length > 0 ? setupSteps : loopSteps;
    if (setupSteps.length === 0) currentPhase = 'loop';

    function logStep(msg, color) {
        const line = document.createElement('div');
        line.style.color = color || '#ccc';
        line.textContent = msg;
        simLog.appendChild(line);
        simLog.scrollTop = simLog.scrollHeight;
    }

    function executeStep() {
        if (!simIsRunning) return;

        if (currentStep >= phaseSteps.length) {
            if (currentPhase === 'setup') {
                // Move from setup to loop
                currentPhase = 'loop';
                phaseSteps = loopSteps;
                currentStep = 0;
                logStep('--- Loop started (repeats) ---', '#ffd740');
                if (phaseSteps.length === 0) {
                    logStep('No loop blocks to execute.', '#ff5252');
                    stopAnimatedSimulation();
                    return;
                }
            } else {
                // Restart loop
                currentStep = 0;
                logStep('↻ Loop repeating...', '#888');
            }
        }

        const step = phaseSteps[currentStep];
        if (!step) { stopAnimatedSimulation(); return; }

        // Highlight the step label
        logStep(`[Step ${currentStep + 1}] ${step.label}`, '#69f0ae');

        // Execute the visual action
        let delayMs = 400; // Default animation speed

        switch (step.action) {
            case 'led': {
                const ledEls = document.querySelectorAll('.sim-led__label');
                ledEls.forEach(el => {
                    if (el.textContent.includes(`Pin ${step.pin}`)) {
                        const light = el.parentElement.querySelector('.sim-led__light');
                        if (light) {
                            light.classList.toggle('sim-led__light--on', step.state);
                        }
                    }
                });
                break;
            }
            case 'blink': {
                // Simulate a blink: ON then OFF
                const ledEls2 = document.querySelectorAll('.sim-led__label');
                ledEls2.forEach(el => {
                    if (el.textContent.includes(`Pin ${step.pin}`)) {
                        const light = el.parentElement.querySelector('.sim-led__light');
                        if (light) {
                            light.classList.add('sim-led__light--on');
                            setTimeout(() => {
                                if (simIsRunning) light.classList.remove('sim-led__light--on');
                            }, Math.min(step.delay, 1000));
                        }
                    }
                });
                delayMs = Math.min(step.delay * 2, 2000);
                break;
            }
            case 'servo': {
                const servoEl = document.getElementById('simServo');
                servoEl.style.display = 'flex';
                const needle = document.getElementById('simServoNeedle');
                const angleLabel = document.getElementById('simServoAngle');
                needle.style.transition = 'transform 0.5s ease';
                needle.style.transform = `translateX(-50%) rotate(${step.angle - 90}deg)`;
                angleLabel.textContent = step.angle;
                break;
            }
            case 'sweep': {
                const servoEl2 = document.getElementById('simServo');
                servoEl2.style.display = 'flex';
                const needle2 = document.getElementById('simServoNeedle');
                const angleLabel2 = document.getElementById('simServoAngle');
                needle2.style.transition = 'transform 0.5s ease';
                // Animate from → to
                const totalSteps = Math.abs(step.to - step.from);
                const sweepTime = Math.min(totalSteps * step.speed, 3000); // Cap at 3 seconds visually
                needle2.style.transition = `transform ${sweepTime / 1000}s linear`;
                needle2.style.transform = `translateX(-50%) rotate(${step.to - 90}deg)`;
                angleLabel2.textContent = step.to;
                delayMs = sweepTime + 200;
                break;
            }
            case 'delay': {
                delayMs = Math.min(step.ms, 3000); // Cap visual delay at 3s
                logStep(`  ⏳ Waiting ${step.ms}ms...`, '#888');
                break;
            }
            case 'buzzer':
            case 'buzzer_tone': {
                const buzzerEls = document.querySelectorAll('.sim-led__label');
                buzzerEls.forEach(el => {
                    if (el.textContent.includes('Buzzer')) {
                        const light = el.parentElement.querySelector('.sim-led__light');
                        const stateLbl = el.parentElement.querySelector('.sim-led__label:last-child');
                        if (light) {
                            const isOn = step.action === 'buzzer' ? step.state : true;
                            light.style.background = isOn ? 'radial-gradient(circle, #ffd740, #ff8f00)' : '#333';
                            light.style.boxShadow = isOn ? '0 0 20px rgba(255,215,64,0.6)' : 'none';
                            if (stateLbl) stateLbl.textContent = isOn ? 'Playing ♪' : 'Silent';

                            // 🔊 Play actual buzzer sound via Web Audio API
                            if (isOn) {
                                const freq = parseInt(step.freq) || 1000; // Default 1kHz for buzzer_on
                                if (step.action === 'buzzer_tone') {
                                    const dur = Math.min(step.dur || 500, 3000);
                                    playBuzzerSound(freq, dur);
                                    setTimeout(() => {
                                        if (simIsRunning) {
                                            light.style.background = '#333';
                                            light.style.boxShadow = 'none';
                                            if (stateLbl) stateLbl.textContent = 'Silent';
                                        }
                                    }, Math.min(step.dur || 500, 2000));
                                    delayMs = Math.min((step.dur || 500) + 200, 2500);
                                } else {
                                    // buzzer_on: play continuous tone
                                    playBuzzerSound(freq);
                                }
                            } else {
                                // buzzer off — stop the sound
                                stopBuzzerSound();
                            }
                        }
                    }
                });
                break;
            }
            case 'relay': {
                const relayEls = document.querySelectorAll('.sim-led__label');
                relayEls.forEach(el => {
                    if (el.textContent.includes('Relay')) {
                        const light = el.parentElement.querySelector('.sim-led__light');
                        const stateLbl = el.parentElement.querySelector('.sim-led__label:last-child');
                        if (light) {
                            light.style.background = step.state ? 'radial-gradient(circle, #69f0ae, #00c853)' : '#333';
                            light.style.boxShadow = step.state ? '0 0 15px rgba(105,240,174,0.5)' : 'none';
                            if (stateLbl) stateLbl.textContent = step.state ? 'ON' : 'OFF';
                        }
                    }
                });
                break;
            }
            case 'motor': {
                const motorEls = document.querySelectorAll('.sim-led__label');
                motorEls.forEach(el => {
                    if (el.textContent.includes('Motor')) {
                        const light = el.parentElement.querySelector('.sim-led__light');
                        const stateLbl = el.parentElement.querySelector('.sim-led__label:last-child');
                        const isRunning = step.dir !== 'Stopped';
                        if (light) {
                            light.style.background = isRunning ? 'radial-gradient(circle, #e040fb, #9c27b0)' : '#333';
                            light.style.boxShadow = isRunning ? '0 0 15px rgba(224,64,251,0.5)' : 'none';
                        }
                        if (stateLbl) stateLbl.textContent = `${step.dir} ${isRunning ? '(' + step.speed + ')' : ''}`;
                    }
                });
                break;
            }
            default:
                break;
        }

        currentStep++;
        simAnimationTimer = setTimeout(executeStep, delayMs);
    }

    // Begin execution
    if (setupSteps.length > 0) {
        logStep('--- Setup phase ---', '#4fc3f7');
    }
    executeStep();
}

/**
 * Stop the animated simulation
 */
function stopAnimatedSimulation() {
    simIsRunning = false;
    if (simAnimationTimer) {
        clearTimeout(simAnimationTimer);
        simAnimationTimer = null;
    }

    // Stop any buzzer sound that might be playing
    stopBuzzerSound();

    const startBtn = document.getElementById('btnStartSim');
    const stopBtn = document.getElementById('btnStopSim');
    if (startBtn) startBtn.style.display = 'inline-flex';
    if (stopBtn) stopBtn.style.display = 'none';

    const simLog = document.getElementById('simLog');
    if (simLog) {
        const line = document.createElement('div');
        line.style.color = '#ff5252';
        line.textContent = 'Simulation stopped.';
        simLog.appendChild(line);
        simLog.scrollTop = simLog.scrollHeight;
    }

    logToConsole('info', 'Simulation stopped.');
}

// ==========================================
// Language Switching
// ==========================================

/**
 * Switch the UI and block language
 * @param {string} lang - Language code ('en' or 'mr')
 */
function switchLanguage(lang) {
    currentLang = lang;
    
    // Update global language variable that blocks use
    window.currentLang = lang;
    
    // Update AI Studio language if function exists
    if (typeof aiSetLanguage === 'function') {
        aiSetLanguage(lang);
    }

    // Update toggle button states
    document.getElementById('langEn').classList.toggle('lang-toggle__btn--active', lang === 'en');
    document.getElementById('langMr').classList.toggle('lang-toggle__btn--active', lang === 'mr');

    // ==========================================
    // Full UI Translation Dictionary
    // ==========================================
    const UI_TEXT = {
        en: {
            // Header buttons
            new: 'New', save: 'Save', open: 'Open',
            run: 'Run', upload: 'Upload', simulate: 'Simulate', code: 'Code',
            aiStudioBtn: 'AI Studio',
        },
        mr: {
            new: 'नवीन', save: 'सेव्ह करा', open: 'घडा',
            run: 'चालवा', upload: 'अपलोड', simulate: 'सिम्युलेशन', code: 'कोड',
            aiStudioBtn: 'AI स्टुडिओ',
        }
    };

    const text = UI_TEXT[lang] || UI_TEXT['en'];

    // Update button texts
    document.getElementById('btnNew').innerHTML = `<span class="btn__icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg></span> ${text.new}`;
    document.getElementById('btnSave').innerHTML = `<span class="btn__icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg></span> ${text.save}`;
    document.getElementById('btnOpen').innerHTML = `<span class="btn__icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></span> ${text.open}`;
    document.getElementById('btnRun').innerHTML = `<span class="btn__icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg></span> ${text.run}`;
    document.getElementById('btnUpload').innerHTML = `<span class="btn__icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></span> ${text.upload}`;
    document.getElementById('btnSimulate').innerHTML = `<span class="btn__icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></span> ${text.simulate}`;
    document.getElementById('btnToggleCode').innerHTML = `<span class="btn__icon">{ }</span> ${text.code}`;
    document.getElementById('btnAIStudio').innerHTML = `<span class="btn__icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z"/><path d="M12 14a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0v-2a5 5 0 0 0-5-5z"/><path d="M7 7h10"/><path d="M7 17h10"/></svg></span> ${text.aiStudioBtn}`;

    // ==========================================
    // Toolbox Category Translations
    // ==========================================
    const CATEGORY_TRANSLATIONS = {
        en: {
            'AI Camera': 'AI Camera',
            'Hand Gesture': 'Hand Gesture',
            'Body Pose': 'Body Pose',
            'Face': 'Face',
            'Speech': 'Speech',
            'AI Control': 'AI Control',
            'Basic': 'Basic',
            'Control': 'Control',
            'GPIO': 'GPIO',
            'ESP32 / Arduino': 'ESP32 / Arduino',
            'Servo Motor': 'Servo Motor',
            'Ultrasonic Sensor': 'Ultrasonic Sensor',
            'IR Sensor': 'IR Sensor',
            'Buzzer': 'Buzzer',
            'Relay': 'Relay',
            'DC Motor': 'DC Motor',
            'DHT Sensor': 'DHT Sensor',
            'Touch Sensor': 'Touch Sensor',
            'LCD Display': 'LCD Display',
            'Soil Moisture': 'Soil Moisture',
            'Sound Sensor': 'Sound Sensor',
            'IR Receiver': 'IR Receiver',
            'Joystick': 'Joystick',
            'Rotary Encoder': 'Rotary Encoder',
            'Push Button': 'Push Button',
            'Electromagnet': 'Electromagnet',
            'WiFi': 'WiFi',
            'Logic': 'Logic',
            'Loops': 'Loops',
            'Variables': 'Variables',
            'Math': 'Math',
        },
        mr: {
            'AI Camera': 'AI कॅमेरा',
            'Hand Gesture': 'हाताचा हावभाव',
            'Body Pose': 'शरीर पोझ',
            'Face': 'चेहरा',
            'Speech': 'आवाज',
            'AI Control': 'AI नियंत्रण',
            'Basic': 'मूलभूत',
            'Control': 'नियंत्रण',
            'GPIO': 'GPIO',
            'ESP32 / Arduino': 'ESP32 / Arduino',
            'Servo Motor': 'सर्वो मोटर',
            'Ultrasonic Sensor': 'अल्ट्रासोनिक सेन्सर',
            'IR Sensor': 'IR सेन्सर',
            'Buzzer': 'बझर',
            'Relay': 'रिले',
            'DC Motor': 'DC मोटर',
            'DHT Sensor': 'DHT सेन्सर',
            'Touch Sensor': 'टच सेन्सर',
            'LCD Display': 'LCD डिस्प्ले',
            'Soil Moisture': 'माती ओलावा',
            'Sound Sensor': 'ध्वनी सेन्सर',
            'IR Receiver': 'IR रिसीव्हर',
            'Joystick': 'जॉयस्टिक',
            'Rotary Encoder': 'रोटरी एनकोडर',
            'Push Button': 'पुश बटन',
            'Electromagnet': 'इलेक्ट्रोमॅग्नेट',
            'WiFi': 'WiFi',
            'Logic': 'लॉजिक',
            'Loops': 'लूप्स',
            'Variables': 'व्हेरिएबल्स',
            'Math': 'गणित',
        }
    };

    // Update toolbox category names
    // KEY FIX: store original English name in data-original-name on first call,
    // then always translate FROM the original English name, not the already-translated name.
    const toolboxXml = document.getElementById('toolbox');
    const categories = toolboxXml.getElementsByTagName('category');
    const translations = CATEGORY_TRANSLATIONS[lang] || CATEGORY_TRANSLATIONS['en'];
    
    for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        // Store original English name on first translation call
        if (!cat.dataset.originalName) {
            cat.dataset.originalName = cat.getAttribute('name');
        }
        const originalName = cat.dataset.originalName;
        const translated = translations[originalName];
        if (translated) {
            cat.setAttribute('name', translated);
        } else {
            // No translation key? Keep the original English name.
            cat.setAttribute('name', originalName);
        }
    }
    
    // Update workspace toolbox to apply changes
    workspace.updateToolbox(toolboxXml);

    // Save workspace, clear it, and reload to force block recreation with new language
    _disableCentering = true;
    const xml = Blockly.Xml.workspaceToDom(workspace);
    workspace.clear();
    Blockly.Xml.domToWorkspace(xml, workspace);
    _disableCentering = false;
    
    // Regenerate code with new language
    generateCode();
    
    // Re-match search bar to potentially resized toolbox
    setTimeout(matchSearchBarWidth, 300);
}

/**
 * Switch code generator between MicroPython and Arduino C++
 */
function switchCodeGenerator(gen) {
    currentCodeGenerator = gen;
    localStorage.setItem('currentCodeGenerator', gen);
    _syncCodeUiToGenerator();

    // Update toggle button states
    const genMicroPython = document.getElementById('genMicroPython');
    const genArduino = document.getElementById('genArduino');
    if (genMicroPython) genMicroPython.classList.toggle('lang-toggle__btn--active', gen === 'micropython');
    if (genArduino) genArduino.classList.toggle('lang-toggle__btn--active', gen === 'arduino');

    logToConsole('info', `Code generator switched to: ${gen === 'micropython' ? 'MicroPython' : 'Arduino C++'}`);

    // Regenerate code with new generator
    generateCode();
}

// ==========================================
// UI Panel Toggles
// ==========================================

/**
 * Toggle the code panel (right sidebar) visibility
 */
function toggleCodePanel() {
    const panel = document.getElementById('codePanel');
    panel.classList.toggle('code-panel--open');
    panel.classList.toggle('code-panel--collapsed');
}

/**
 * Toggle the console panel visibility
 */
function toggleConsole() {
    const console = document.getElementById('console');
    const icon = document.getElementById('consoleToggleIcon');
    console.classList.toggle('console--collapsed');
    icon.textContent = console.classList.contains('console--collapsed') ? '▲' : '▼';

    // Resize Blockly after animation
    setTimeout(() => Blockly.svgResize(workspace), 400);
}

// ==========================================
// Console Management
// ==========================================

/**
 * Log a message to the output console
 * @param {'info'|'success'|'error'|'warning'} type - Message type
 * @param {string} message - The message to log
 */
function logToConsole(type, message) {
    const body = document.getElementById('consoleBody');
    const badge = document.getElementById('consoleBadge');

    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { hour12: false });

    const line = document.createElement('div');
    line.className = `console__line console__line--${type}`;
    line.innerHTML = `
    <span class="console__timestamp">[${timestamp}]</span>
    <span>${message}</span>
  `;

    body.appendChild(line);
    body.scrollTop = body.scrollHeight;

    consoleCount++;
    badge.textContent = consoleCount;
}

/**
 * Clear all console messages
 */
function clearConsole() {
    document.getElementById('consoleBody').innerHTML = '';
    consoleCount = 0;
    document.getElementById('consoleBadge').textContent = '0';
}

// ==========================================
// Code Actions
// ==========================================

/**
 * Copy generated code to clipboard
 */
function copyCode() {
    const codeOutput = document.getElementById('codeOutput');
    const text = codeOutput.value;
    if (!text || text.startsWith('# No blocks') || text.startsWith('// No blocks')) {
        showToast('warning', 'No code to copy! Generate code first.');
        return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('success', 'Code copied to clipboard!');
        }).catch(() => {
            _fallbackCopyCode(text);
        });
    } else {
        _fallbackCopyCode(text);
    }
}

function _fallbackCopyCode(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
        document.execCommand('copy');
        showToast('success', 'Code copied!');
    } catch (e) {
        showToast('error', 'Copy failed — please select and copy manually.');
    }
    document.body.removeChild(ta);
}

/**
 * Download generated code as a .ino file
 */
function downloadCode() {
    const code = document.getElementById('codeOutput').value;
    const ui = _getCodeUiForGenerator(currentCodeGenerator);
    const noCode = ui.noCodePrefix;
    if (!code || code.startsWith(noCode)) {
        showToast('warning', 'No code to download!');
        return;
    }

    const ext = ui.ext;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentProjectName}${ext}`;
    link.click();

    URL.revokeObjectURL(url);

    logToConsole('success', `Code downloaded as "${currentProjectName}${ext}"`);
    showToast('success', 'Code downloaded!');
}

// ==========================================
// Toast Notification System
// ==========================================

/**
 * Show a toast notification
 * @param {'success'|'error'|'warning'|'info'} type - Toast type
 * @param {string} message - Message to display
 * @param {number} duration - Duration in ms (default: 3000)
 */
function showToast(type, message, duration = 3000) {
    const container = document.getElementById('toastContainer');

    const icons = {
        success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    };

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span>${icons[type]}</span> <span>${message}</span>`;

    container.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ==========================================
// Block Count Display
// ==========================================

/**
 * Update the block count in the status bar
 */
let _blockCountEl = null;
function updateBlockCount() {
    if (!_blockCountEl) _blockCountEl = document.getElementById('blockCount');
    if (_blockCountEl) {
        const label = (typeof currentLang !== 'undefined' && currentLang === 'mr') ? 'ब्लॉक्स' : 'Blocks';
        _blockCountEl.textContent = `${label}: ${workspace.getAllBlocks().length}`;
    }
}

// ==========================================
// Keyboard Shortcuts
// ==========================================

/**
 * Handle keyboard shortcuts
 * @param {KeyboardEvent} event
 */
function handleKeyboard(event) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const mod = isMac ? event.metaKey : event.ctrlKey;

    if (mod && event.key === 's') {
        event.preventDefault();
        saveProject();
    } else if (mod && event.key === 'o') {
        event.preventDefault();
        document.getElementById('fileInput').click();
    } else if (mod && event.key === 'n') {
        event.preventDefault();
        newProject();
    } else if (event.key === 'F5') {
        event.preventDefault();
        runCode();
    }
}

// End of script.js

// ==========================================
// AI Studio Initialization
// ==========================================

// ---- AI Block Runtime State ----
/** Tracks which AI gesture/action blocks have been recently triggered to avoid spam */
let _aiBlockCooldowns = {};
/** Minimum ms between repeated triggers of the same block (prevents rapid re-fire from video frames) */
const AI_BLOCK_COOLDOWN_MS = 2000;
/** Whether the AI Block Runtime is active */
let _aiBlockRuntimeActive = false;

/**
 * Initialize AI Studio integration
 * Sets up event listeners for AI-to-block communication
 * AND the runtime engine that executes workspace blocks on AI events
 */
function initAIStudio() {
    // Register AI event listeners that can trigger block actions
    if (typeof aiOnEvent === 'function') {
        // Listen for AI predictions and update status bar
        aiOnEvent('prediction', (result) => {
            const statusText = document.getElementById('aiStatusText');
            if (statusText) {
                statusText.textContent = `AI: ${result.className} (${Math.round(result.confidence * 100)}%)`;
            }
            // Execute ai_when_detected blocks
            aiBlockRuntime_onPrediction(result);
        });

        // Listen for hand gestures → EXECUTE matching blocks
        aiOnEvent('hand_gesture', (data) => {
            const statusText = document.getElementById('aiStatusText');
            if (statusText) {
                statusText.textContent = `AI: ${data.gesture}`;
            }
            // ★ Execute blocks connected inside ai_when_hand
            aiBlockRuntime_onHandGesture(data);
        });

        // Listen for pose detection → EXECUTE matching blocks
        aiOnEvent('pose_detected', (data) => {
            const statusText = document.getElementById('aiStatusText');
            if (statusText) {
                statusText.textContent = `AI: ${data.pose}`;
            }
            aiBlockRuntime_onPose(data);
        });

        // Listen for face detection → EXECUTE matching blocks
        aiOnEvent('face_detected', (data) => {
            const statusText = document.getElementById('aiStatusText');
            if (statusText) {
                statusText.textContent = `AI: ${data.expression}`;
            }
            aiBlockRuntime_onFace(data);
        });

        // Listen for speech commands → EXECUTE matching blocks
        aiOnEvent('speech_command', (data) => {
            const statusText = document.getElementById('aiStatusText');
            if (statusText) {
                statusText.textContent = `AI: Voice "${data.command}"`;
            }
            aiBlockRuntime_onSpeech(data);
        });
    }

    _aiBlockRuntimeActive = true;
    logToConsole('info', 'AI Studio module loaded');
    logToConsole('info', 'AI → Block runtime engine active');
}

// ==========================================
// AI Block Runtime Engine
// ==========================================
// This engine bridges AI Studio detection events to the Blockly workspace.
// When the AI detects a hand gesture (or pose, face, speech), the engine
// scans the workspace for matching event blocks (e.g. ai_when_hand)
// and executes the child blocks connected inside them (buzzer, LED, etc.).

/**
 * Check if a block action is on cooldown
 * @param {string} blockId - Unique block ID
 * @returns {boolean} true if still cooling down
 */
function _aiBlockOnCooldown(blockId) {
    const now = Date.now();
    if (_aiBlockCooldowns[blockId] && (now - _aiBlockCooldowns[blockId]) < AI_BLOCK_COOLDOWN_MS) {
        return true;
    }
    _aiBlockCooldowns[blockId] = now;
    return false;
}

/**
 * Normalize gesture name for comparison.
 * Strips emojis, extra whitespace, converts to lowercase.
 */
function _normalizeGesture(str) {
    if (!str) return '';
    return str
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}]/gu, '')
        .replace(/[✋✊☝️👍🙌🤸💃🧍🙂👈👉]/g, '')
        .trim()
        .toLowerCase();
}

/**
 * Map dropdown values from ai_when_hand block to gesture labels
 */
function _gestureDropdownMatches(dropdownValue, detectedGesture) {
    if (dropdownValue === 'any') return true;
    const normalizedDetected = _normalizeGesture(detectedGesture);
    const mapping = {
        'open_hand': ['open hand', 'उघडा हात'],
        'closed_fist': ['closed fist', 'मूठ बंद'],
        'pointing_up': ['pointing up', 'वर बोट'],
        'thumb_up': ['thumb up', 'अंगठा वर'],
    };
    const matchTerms = mapping[dropdownValue] || [dropdownValue];
    return matchTerms.some(term => normalizedDetected.includes(term.toLowerCase()));
}

/**
 * Map dropdown values from ai_when_pose block to pose labels
 */
function _poseDropdownMatches(dropdownValue, detectedPose) {
    if (dropdownValue === 'any') return true;
    const normalizedPose = _normalizeGesture(detectedPose);
    const mapping = {
        'hands_raised': ['hands raised', 'हात वर'],
        'arms_wide': ['arms wide', 'हात पसरलेले'],
        'hand_raised': ['hand raised', 'हात वर'],
        'active_movement': ['active movement', 'सक्रिय हालचाल'],
        'standing_still': ['standing still', 'स्थिर उभे'],
    };
    const matchTerms = mapping[dropdownValue] || [dropdownValue];
    return matchTerms.some(term => normalizedPose.includes(term.toLowerCase()));
}

/**
 * Map dropdown values from ai_when_face block to expression labels
 */
function _faceDropdownMatches(dropdownValue, detectedExpression) {
    if (dropdownValue === 'any') return true;
    const normalizedExpr = _normalizeGesture(detectedExpression);
    const mapping = {
        'face_forward': ['face forward', 'चेहरा समोर'],
        'looking_left': ['looking left', 'डावीकडे पाहत'],
        'looking_right': ['looking right', 'उजवीकडे पाहत'],
        'head_up': ['head up', 'डोके वर'],
        'head_down': ['head down', 'डोके खाली'],
        'smiling': ['smiling', 'smile', 'हसणे'],
    };
    const matchTerms = mapping[dropdownValue] || [dropdownValue];
    return matchTerms.some(term => normalizedExpr.includes(term.toLowerCase()));
}

// ---- Hand Gesture → Block Execution ----
function aiBlockRuntime_onHandGesture(data) {
    if (!workspace || !_aiBlockRuntimeActive) return;
    const allBlocks = workspace.getAllBlocks(true);
    const handBlocks = allBlocks.filter(b => b.type === 'ai_when_hand');

    handBlocks.forEach(block => {
        const gesture = block.getFieldValue('GESTURE');
        if (_gestureDropdownMatches(gesture, data.gesture)) {
            if (_aiBlockOnCooldown(block.id)) return;
            logToConsole('success', `Hand gesture "${data.gesture}" → executing block actions`);
            _executeChildBlocks(block, 'DO');
        }
    });

    // Also execute ai_control_device blocks that listen for hand gestures
    _executeAIControlBlocks(allBlocks, data.gesture);
}

// ---- Pose → Block Execution ----
function aiBlockRuntime_onPose(data) {
    if (!workspace || !_aiBlockRuntimeActive) return;
    const allBlocks = workspace.getAllBlocks(true);
    const poseBlocks = allBlocks.filter(b => b.type === 'ai_when_pose');

    poseBlocks.forEach(block => {
        const pose = block.getFieldValue('POSE');
        if (_poseDropdownMatches(pose, data.pose)) {
            if (_aiBlockOnCooldown(block.id)) return;
            logToConsole('success', `Pose "${data.pose}" → executing block actions`);
            _executeChildBlocks(block, 'DO');
        }
    });
}

// ---- Face → Block Execution ----
function aiBlockRuntime_onFace(data) {
    if (!workspace || !_aiBlockRuntimeActive) return;
    const allBlocks = workspace.getAllBlocks(true);
    const faceBlocks = allBlocks.filter(b => b.type === 'ai_when_face');

    faceBlocks.forEach(block => {
        const expr = block.getFieldValue('EXPRESSION');
        if (_faceDropdownMatches(expr, data.expression)) {
            if (_aiBlockOnCooldown(block.id)) return;
            logToConsole('success', `Face "${data.expression}" → executing block actions`);
            _executeChildBlocks(block, 'DO');
        }
    });
}

// ---- Speech → Block Execution ----
function aiBlockRuntime_onSpeech(data) {
    if (!workspace || !_aiBlockRuntimeActive) return;
    const allBlocks = workspace.getAllBlocks(true);
    const speechBlocks = allBlocks.filter(b => b.type === 'ai_when_speech');

    speechBlocks.forEach(block => {
        const command = (block.getFieldValue('COMMAND') || '').toLowerCase();
        if (data.command && data.command.includes(command)) {
            if (_aiBlockOnCooldown(block.id)) return;
            logToConsole('success', `Voice "${data.command}" → executing block actions`);
            _executeChildBlocks(block, 'DO');
        }
    });
}

// ---- Camera AI Prediction → Block Execution ----
function aiBlockRuntime_onPrediction(result) {
    if (!workspace || !_aiBlockRuntimeActive) return;
    const allBlocks = workspace.getAllBlocks(true);
    const predBlocks = allBlocks.filter(b => b.type === 'ai_when_detected');

    predBlocks.forEach(block => {
        const className = (block.getFieldValue('CLASS_NAME') || '').toLowerCase();
        if (result.className && result.className.toLowerCase().includes(className) && result.confidence >= 0.6) {
            if (_aiBlockOnCooldown(block.id)) return;
            logToConsole('success', `AI detected "${result.className}" → executing block actions`);
            _executeChildBlocks(block, 'DO');
        }
    });
}

/**
 * Execute ai_control_device / ai_control_servo / ai_control_motor blocks
 * These blocks have a TRIGGER field that matches against detected classes/gestures
 */
function _executeAIControlBlocks(allBlocks, triggerLabel) {
    const normalizedTrigger = _normalizeGesture(triggerLabel);

    allBlocks.forEach(block => {
        const trigger = (block.getFieldValue('TRIGGER') || '').toLowerCase();
        if (!trigger) return;

        // Check if the trigger matches (partial match)
        if (!normalizedTrigger.includes(trigger) && !trigger.includes(normalizedTrigger)) return;
        if (_aiBlockOnCooldown(block.id + '_ctrl')) return;

        switch (block.type) {
            case 'ai_control_device': {
                const pin = block.getFieldValue('PIN');
                const state = block.getFieldValue('STATE');
                const isHigh = state === 'HIGH';
                logToConsole('success', `AI Control → Pin ${pin} ${state}`);
                _executeHardwareAction({ action: 'digital_write', pin, state: isHigh });
                break;
            }
            case 'ai_control_servo': {
                const pin = block.getFieldValue('PIN');
                const angle = block.getFieldValue('ANGLE');
                logToConsole('success', `AI Control → Servo Pin ${pin} Angle ${angle}°`);
                _executeHardwareAction({ action: 'servo', pin, angle });
                break;
            }
            case 'ai_control_motor': {
                const dir = block.getFieldValue('DIRECTION');
                logToConsole('success', `AI Control → Motor ${dir}`);
                break;
            }
        }
    });
}

/**
 * Walk the chain of child blocks within a statement input and execute each one.
 * This is the core block interpreter for AI-triggered actions.
 * @param {Blockly.Block} parentBlock - The event block (e.g. ai_when_hand)
 * @param {string} inputName - The statement input name (e.g. 'DO')
 */
function _executeChildBlocks(parentBlock, inputName) {
    let block = parentBlock.getInputTargetBlock(inputName);
    const actionQueue = [];

    // Collect all actions first
    while (block) {
        const action = _blockToAction(block);
        if (action) actionQueue.push(action);
        block = block.getNextBlock();
    }

    if (actionQueue.length === 0) {
        logToConsole('warning', 'No action blocks connected inside the AI event block');
        return;
    }

    // Execute actions sequentially with delays
    _executeActionQueue(actionQueue, 0);
}

/**
 * Convert a Blockly block into an executable action descriptor
 */
function _blockToAction(block) {
    switch (block.type) {
        // ---- Buzzer blocks ----
        case 'buzzer_on':
            return { action: 'buzzer_on', pin: block.getFieldValue('PIN') };
        case 'buzzer_off':
        case 'buzzer_notone':
            return { action: 'buzzer_off', pin: block.getFieldValue('PIN') };
        case 'buzzer_tone':
            return {
                action: 'buzzer_tone',
                pin: block.getFieldValue('PIN'),
                freq: parseInt(block.getFieldValue('FREQ')) || 1000,
                dur: parseInt(block.getFieldValue('DUR')) || 500,
            };
        case 'buzzer_note':
            return {
                action: 'buzzer_tone',
                pin: block.getFieldValue('PIN'),
                freq: parseInt(block.getFieldValue('NOTE')) || 440,
                dur: parseInt(block.getFieldValue('DUR')) || 300,
            };

        // ---- LED blocks ----
        case 'led_on':
            return { action: 'led_on', pin: block.getFieldValue('PIN') };
        case 'led_off':
            return { action: 'led_off', pin: block.getFieldValue('PIN') };
        case 'led_blink':
            return { action: 'led_blink', pin: block.getFieldValue('PIN'), delay: parseInt(block.getFieldValue('DELAY')) || 500 };

        // ---- Digital Write ----
        case 'digital_write':
            return { action: 'digital_write', pin: block.getFieldValue('PIN'), state: block.getFieldValue('STATE') === 'HIGH' };

        // ---- Servo ----
        case 'servo_control':
            return { action: 'servo', pin: block.getFieldValue('PIN'), angle: parseInt(block.getFieldValue('ANGLE')) || 90 };

        // ---- Delay ----
        case 'delay_ms':
            return { action: 'delay', ms: parseInt(block.getFieldValue('MS')) || 1000 };

        // ---- Relay ----
        case 'relay_on':
            return { action: 'relay_on', pin: block.getFieldValue('PIN') };
        case 'relay_off':
            return { action: 'relay_off', pin: block.getFieldValue('PIN') };

        // ---- Motor ----
        case 'motor_forward':
            return { action: 'motor_forward', in1: block.getFieldValue('IN1'), speed: block.getFieldValue('SPEED') };
        case 'motor_backward':
            return { action: 'motor_backward', in1: block.getFieldValue('IN1'), speed: block.getFieldValue('SPEED') };
        case 'motor_stop':
            return { action: 'motor_stop', in1: block.getFieldValue('IN1') };

        // ---- Serial Print ----
        case 'serial_print':
            return { action: 'serial_print' };

        // ---- AI Print Result ----
        case 'ai_print_result':
            return { action: 'ai_print_result' };

        default:
            logToConsole('info', `  Block "${block.type}" skipped (no runtime handler)`);
            return null;
    }
}

/**
 * Execute a queue of actions sequentially, respecting delays
 */
function _executeActionQueue(queue, index) {
    if (index >= queue.length) return;

    const action = queue[index];
    let nextDelay = 50; // Default small gap between actions

    switch (action.action) {
        case 'buzzer_on':
            logToConsole('info', `  Buzzer ON (Pin ${action.pin}) — sending to ESP32 hardware`);
            // NO Mac speaker sound — hardware only!
            _sendToESP32('buzzer_on', action);
            break;

        case 'buzzer_off':
            logToConsole('info', `  Buzzer OFF (Pin ${action.pin}) — sending to ESP32 hardware`);
            // NO Mac speaker sound — hardware only!
            _sendToESP32('buzzer_off', action);
            break;

        case 'buzzer_tone':
            logToConsole('info', `  Buzzer Tone ${action.freq}Hz for ${action.dur}ms (Pin ${action.pin}) — sending to ESP32 hardware`);
            // NO Mac speaker sound — hardware only!
            _sendToESP32('buzzer_tone', action);
            nextDelay = action.dur + 50;
            break;

        case 'led_on':
            logToConsole('info', `  LED ON (Pin ${action.pin})`);
            _updateSimLED(action.pin, true);
            _sendToESP32('led_on', action);
            break;

        case 'led_off':
            logToConsole('info', `  LED OFF (Pin ${action.pin})`);
            _updateSimLED(action.pin, false);
            _sendToESP32('led_off', action);
            break;

        case 'led_blink':
            logToConsole('info', `  LED Blink (Pin ${action.pin}, ${action.delay}ms)`);
            _updateSimLED(action.pin, true);
            setTimeout(() => _updateSimLED(action.pin, false), action.delay);
            _sendToESP32('led_blink', action);
            nextDelay = action.delay * 2 + 50;
            break;

        case 'digital_write':
            logToConsole('info', `  Pin ${action.pin} → ${action.state ? 'HIGH' : 'LOW'}`);
            _updateSimLED(action.pin, action.state);
            _sendToESP32('digital_write', action);
            break;

        case 'servo':
            logToConsole('info', `  Servo (Pin ${action.pin}) → ${action.angle}°`);
            _updateSimServo(action.angle);
            _sendToESP32('servo', action);
            break;

        case 'delay':
            logToConsole('info', `  Delay ${action.ms}ms`);
            nextDelay = Math.min(action.ms, 3000);
            break;

        case 'relay_on':
            logToConsole('info', `  Relay ON (Pin ${action.pin})`);
            _sendToESP32('relay_on', action);
            break;

        case 'relay_off':
            logToConsole('info', `  Relay OFF (Pin ${action.pin})`);
            _sendToESP32('relay_off', action);
            break;

        case 'motor_forward':
            logToConsole('info', `  Motor Forward (Speed ${action.speed})`);
            _sendToESP32('motor_forward', action);
            break;

        case 'motor_backward':
            logToConsole('info', `  Motor Backward (Speed ${action.speed})`);
            _sendToESP32('motor_backward', action);
            break;

        case 'motor_stop':
            logToConsole('info', `  Motor Stop`);
            _sendToESP32('motor_stop', action);
            break;

        case 'serial_print':
        case 'ai_print_result':
            logToConsole('info', `  AI result printed to serial`);
            break;
    }

    // Execute next action after delay
    if (index + 1 < queue.length) {
        setTimeout(() => _executeActionQueue(queue, index + 1), nextDelay);
    }
}

/**
 * Update simulation LED in the UI (if simulation is open)
 */
function _updateSimLED(pin, isOn) {
    const ledEls = document.querySelectorAll('.sim-led__label');
    ledEls.forEach(el => {
        if (el.textContent.includes(`Pin ${pin}`)) {
            const light = el.parentElement.querySelector('.sim-led__light');
            if (light) {
                light.classList.toggle('sim-led__light--on', isOn);
            }
        }
    });
}

/**
 * Update simulation servo in the UI (if simulation is open)
 */
function _updateSimServo(angle) {
    const needle = document.getElementById('simServoNeedle');
    const angleLabel = document.getElementById('simServoAngle');
    if (needle) {
        needle.style.transition = 'transform 0.5s ease';
        needle.style.transform = `translateX(-50%) rotate(${angle - 90}deg)`;
    }
    if (angleLabel) {
        angleLabel.textContent = angle;
    }
}

/**
 * Send a hardware command to ESP32 via the Flask backend.
 * This generates a small MicroPython snippet and sends it.
 * Only sends if the backend is reachable.
 * @param {string} command - Command type
 * @param {object} params - Parameters
 */
async function _sendToESP32(command, params) {
    // Build a MicroPython snippet for the command
    let code = '';
    switch (command) {
        case 'buzzer_on':
            code = `from machine import Pin, PWM\nbzr = PWM(Pin(${params.pin}))\nbzr.freq(1000)\nbzr.duty(512)\n`;
            break;
        case 'buzzer_off':
            code = `from machine import Pin, PWM\nbzr = PWM(Pin(${params.pin}))\nbzr.duty(0)\nbzr.deinit()\n`;
            break;
        case 'buzzer_tone':
            code = `from machine import Pin, PWM\nimport time\nbzr = PWM(Pin(${params.pin}))\nbzr.freq(${params.freq})\nbzr.duty(512)\ntime.sleep_ms(${params.dur})\nbzr.duty(0)\nbzr.deinit()\n`;
            break;
        case 'led_on':
            code = `from machine import Pin\nPin(${params.pin}, Pin.OUT).value(1)\n`;
            break;
        case 'led_off':
            code = `from machine import Pin\nPin(${params.pin}, Pin.OUT).value(0)\n`;
            break;
        case 'digital_write':
            code = `from machine import Pin\nPin(${params.pin}, Pin.OUT).value(${params.state ? 1 : 0})\n`;
            break;
        case 'servo': {
            const duty = Math.round(26 + (params.angle / 180) * 102);
            code = `from machine import Pin, PWM\nservo = PWM(Pin(${params.pin}), freq=50)\nservo.duty(${duty})\n`;
            break;
        }
        default:
            return; // Skip unknown commands
    }

    if (!code) return;

    try {
        const response = await fetch('http://localhost:5001/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        });
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                logToConsole('success', `  ESP32: ${command} executed on hardware!`);
            }
        }
    } catch (e) {
        // Backend not available — simulation only, no error needed
    }
}

/**
 * Expose the runtime state for global access
 */
window._aiBlockRuntimeActive = _aiBlockRuntimeActive;

// ==========================================
// Manual Coding Mode
// ==========================================

/** Whether manual coding mode is active */
let isManualCodeMode = false;

/**
 * Toggle manual coding mode
 * Allows users to edit code directly and generate blocks from it
 */
function toggleManualCodeMode() {
    isManualCodeMode = !isManualCodeMode;
    const codeOutput = document.getElementById('codeOutput');
    const btnManual = document.getElementById('btnManualCode');
    const btnGenerate = document.getElementById('btnGenerateBlocks');
    const manualCodeHint = document.getElementById('manualCodeHint');

    if (isManualCodeMode) {
        // Enable manual mode
        codeOutput.removeAttribute('readonly');
        codeOutput.style.backgroundColor = '#1e293b';
        codeOutput.style.border = '2px solid #3b82f6';
        btnManual.classList.add('btn--primary');
        btnGenerate.style.display = 'inline-flex';
        manualCodeHint.style.display = 'block';
        logToConsole('info', 'Manual coding mode enabled. Write code and click "Generate Blocks" to convert to blocks.');
    } else {
        // Disable manual mode
        codeOutput.setAttribute('readonly', true);
        codeOutput.style.backgroundColor = '';
        codeOutput.style.border = '';
        btnManual.classList.remove('btn--primary');
        btnGenerate.style.display = 'none';
        manualCodeHint.style.display = 'none';
        // Regenerate code from blocks
        generateCode();
        logToConsole('info', 'Manual coding mode disabled. Code is now generated from blocks.');
    }
}

/**
 * Generate blocks from code
 * Parses Arduino C++ or MicroPython code and creates corresponding blocks
 */
function generateBlocksFromCode() {
    const code = document.getElementById('codeOutput').value;
    if (!code.trim()) {
        showToast('warning', 'No code to convert. Write some code first.');
        return;
    }

    _disableCentering = true;
    try {
        workspace.clear();

        const parsed = parseCodeToBlocks(code);
        if (parsed.length === 0) {
            showToast('warning', 'No recognizable code patterns found.');
            logToConsole('warning', 'Could not parse code into blocks.');
            return;
        }

        // Create start_program block
        const startBlock = workspace.newBlock('start_program');
        startBlock.initSvg();
        startBlock.render();
        startBlock.moveBy(50, 50);

        // Separate setup and loop blocks
        const setupBlocks = parsed.filter(b => b.target === 'setup');
        const loopBlocks = parsed.filter(b => b.target !== 'setup');

        // Connect setup blocks into SETUP input
        let prevSetup = null;
        setupBlocks.forEach((cfg, i) => {
            const block = createBlockWithChildren(cfg, i);
            block.moveBy(250, 80 + (i * 100));
            if (i === 0) {
                startBlock.getInput('SETUP').connection.connect(block.previousConnection);
            } else if (prevSetup) {
                prevSetup.nextConnection.connect(block.previousConnection);
            }
            prevSetup = block;
        });

        // Connect loop blocks into LOOP input
        let prevLoop = null;
        loopBlocks.forEach((cfg, i) => {
            const block = createBlockWithChildren(cfg, i);
            block.moveBy(250, 200 + (i * 100));
            if (i === 0) {
                startBlock.getInput('LOOP').connection.connect(block.previousConnection);
            } else if (prevLoop) {
                prevLoop.nextConnection.connect(block.previousConnection);
            }
            prevLoop = block;
        });

        toggleManualCodeMode();

        const total = parsed.length;
        showToast('success', `Generated ${total} block${total > 1 ? 's' : ''} from code.`);
        logToConsole('success', `Successfully converted code to ${total} blocks.`);
    } catch (error) {
        showToast('error', 'Failed to generate blocks: ' + error.message);
        logToConsole('error', 'Block generation error: ' + error.message);
        console.error(error);
    } finally {
        _disableCentering = false;
    }
}

/**
 * Create a block and its child value blocks from a config object
 */
function createBlockWithChildren(cfg, index) {
    const block = workspace.newBlock(cfg.type);
    if (cfg.fields) {
        Object.keys(cfg.fields).forEach(fieldName => {
            try {
                block.setFieldValue(cfg.fields[fieldName], fieldName);
            } catch (e) {
                // Silently skip invalid field names
            }
        });
    }
    block.initSvg();
    block.render();

    // Connect child blocks to value inputs
    if (cfg.inputs) {
        Object.keys(cfg.inputs).forEach(inputName => {
            const childCfg = cfg.inputs[inputName];
            const childBlock = workspace.newBlock(childCfg.type);
            if (childCfg.fields) {
                Object.keys(childCfg.fields).forEach(fn => {
                    try {
                        childBlock.setFieldValue(childCfg.fields[fn], fn);
                    } catch (e) {}
                });
            }
            childBlock.initSvg();
            childBlock.render();
            childBlock.moveBy(250 + (index * 20), 80 + (index * 100));

            const input = block.getInput(inputName);
            if (input && input.connection && childBlock.outputConnection) {
                input.connection.connect(childBlock.outputConnection);
            }
        });
    }

    return block;
}

/**
 * Import code from file
 * @param {Event} event - File input change event
 */
function importCodeFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const code = e.target.result;
        document.getElementById('codeOutput').value = code;

        // Enable manual mode automatically
        if (!isManualCodeMode) {
            toggleManualCodeMode();
        }

        logToConsole('info', `Imported code from ${file.name}`);
        showToast('success', `Code imported from ${file.name}`);
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
}

/**
 * Parse code into block configurations
 * Supports Arduino C++ and MicroPython patterns
 * @param {string} code - The code to parse
 * @returns {Array} Array of block configuration objects
 */
function parseCodeToBlocks(code) {
    const blocks = [];
    const lines = code.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//') && !line.startsWith('#'));

    lines.forEach(line => {
        // --- PIN MODE (Arduino) ---
        let m = line.match(/pinMode\s*\(\s*(\d+)\s*,\s*(INPUT|OUTPUT|INPUT_PULLUP)\s*\)/i);
        if (m) {
            blocks.push({ type: 'pin_mode', fields: { PIN: m[1], MODE: m[2].toUpperCase() }, target: 'setup' });
            return;
        }

        // --- MicroPython Pin init as OUTPUT/INPUT ---
        m = line.match(/Pin\s*\(\s*(\w+)\s*,\s*Pin\.(IN|OUT|IN_PULLUP)\s*\)/i);
        if (m) {
            blocks.push({ type: 'pin_mode', fields: { PIN: m[1], MODE: m[2].toUpperCase() }, target: 'setup' });
            return;
        }

        // --- PWM init ---
        m = line.match(/PWM\s*\(\s*Pin\s*\(\s*(\w+)\s*\)/i);
        if (m) {
            blocks.push({ type: 'pin_mode', fields: { PIN: m[1], MODE: 'OUTPUT' }, target: 'setup' });
            return;
        }

        // --- LED ON: digitalWrite(pin, HIGH) or Pin(pin).value(1) or variable.value(1) ---
        m = line.match(/digitalWrite\s*\(\s*(\d+)\s*,\s*HIGH\s*\)/i);
        if (m) { blocks.push({ type: 'led_on', fields: { PIN: m[1] } }); return; }

        m = line.match(/(\w+)\.value\s*\(\s*1\s*\)/i);
        if (m) { blocks.push({ type: 'led_on', fields: { PIN: m[1] } }); return; }

        // --- LED OFF: digitalWrite(pin, LOW) or Pin(pin).value(0) or variable.value(0) ---
        m = line.match(/digitalWrite\s*\(\s*(\d+)\s*,\s*LOW\s*\)/i);
        if (m) { blocks.push({ type: 'led_off', fields: { PIN: m[1] } }); return; }

        m = line.match(/(\w+)\.value\s*\(\s*0\s*\)/i);
        if (m) { blocks.push({ type: 'led_off', fields: { PIN: m[1] } }); return; }

        // --- DIGITAL READ ---
        m = line.match(/\.value\s*\(\s*\)\s*==\s*0|\bsensor.*value.*==\s*0|ir_sensor\.value/i);
        if (m) { return; } // skip IR sensor reads (can't map to blocks well)

        m = line.match(/digitalRead\s*\(\s*(\d+)\s*\)/i);
        if (m) { return; }

        // --- ANALOG READ ---
        m = line.match(/analogRead\s*\(\s*(\d+)\s*\)/i);
        if (m) {
            blocks.push({ type: 'analog_read', fields: { PIN: m[1] } });
            return;
        }

        // --- ANALOG WRITE ---
        m = line.match(/analogWrite\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/i);
        if (m) { blocks.push({ type: 'analog_write', fields: { PIN: m[1], VALUE: m[2] } }); return; }

        m = line.match(/ledcWrite\s*\(\s*\d+\s*,\s*(\d+)\s*,\s*(\d+)\s*\)|dac\.write\s*\(\s*(\d+)\s*\)/i);
        if (m) {
            blocks.push({ type: 'analog_write', fields: { PIN: m[2] || m[3] || '25', VALUE: m[1] || m[3] || '128' } });
            return;
        }

        // --- PWM duty (motor speed) ---
        m = line.match(/(?:pwm|pwm_m\d)\.duty\s*\(\s*(\d+)\s*\)/i);
        if (m) { return; } // skip, can't map cleanly to blocks

        // --- DELAY: delay(n) or sleep(n) or time.sleep(n) or time.sleep_ms(n) ---
        m = line.match(/delay\s*\(\s*(\d+)\s*\)/i);
        if (m) { blocks.push({ type: 'delay_ms', fields: { MS: m[1] } }); return; }

        m = line.match(/sleep\s*\(\s*(\d+)\s*\)/i);
        if (m) { blocks.push({ type: 'delay_ms', fields: { MS: String(parseInt(m[1]) * 1000) } }); return; }

        m = line.match(/sleep\s*\(\s*([\d.]+)\s*\)/i);
        if (m) { blocks.push({ type: 'delay_ms', fields: { MS: String(Math.round(parseFloat(m[1]) * 1000)) } }); return; }

        m = line.match(/time\.sleep_ms\s*\(\s*(\d+)\s*\)|time\.sleep\s*\(\s*([\d.]+)\s*\)/i);
        if (m) {
            const ms = m[1] || (parseFloat(m[2]) * 1000);
            blocks.push({ type: 'delay_ms', fields: { MS: String(Math.round(ms)) } });
            return;
        }

        // --- PRINT ---
        m = line.match(/(?:Serial\.println|Serial\.print|print)\s*\(\s*["'](.+?)["']\s*\)/i);
        if (m) {
            blocks.push({
                type: 'serial_print',
                fields: {},
                inputs: { 'MSG': { type: 'text_value', fields: { TEXT: m[1] } } }
            });
            return;
        }

        // --- SERVO ---
        m = line.match(/servo\.write\s*\(\s*(\d+)\s*\)/i);
        if (m) { blocks.push({ type: 'servo_control', fields: { PIN: '13', ANGLE: m[1] } }); return; }

        m = line.match(/servo\.duty\s*\(\s*(\d+)\s*\)/i);
        if (m) {
            const angle = Math.round((parseInt(m[1]) - 26) / 102 * 180);
            blocks.push({ type: 'servo_control', fields: { PIN: '13', ANGLE: String(angle) } });
            return;
        }

        m = line.match(/servo(?:_)?.?attach\s*\(\s*(\d+)\s*\)/i);
        if (m) { blocks.push({ type: 'servo_control', fields: { PIN: m[1], ANGLE: '90' } }); return; }

        // --- BUZZER TONE ---
        m = line.match(/tone\s*\(\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+))?\s*\)/i);
        if (m) {
            blocks.push({ type: 'buzzer_tone', fields: { PIN: m[1], FREQ: m[2], DUR: m[3] || '500' } });
            return;
        }

        m = line.match(/buzzer\.freq\s*\(\s*(\d+)\s*\)/i);
        if (m) { blocks.push({ type: 'buzzer_tone', fields: { PIN: '18', FREQ: m[1], DUR: '500' } }); return; }

        // --- BUZZER ON ---
        m = line.match(/buzzer\.on\s*\(\)|activate_alarm/i);
        if (m) { blocks.push({ type: 'buzzer_on', fields: { PIN: '18' } }); return; }

        // --- BUZZER OFF ---
        m = line.match(/noTone\s*\(\s*(\d+)\s*\)|buzzer\.deinit\s*\(\)|buzzer\.off\s*\(\)/i);
        if (m) {
            blocks.push({ type: 'buzzer_off', fields: { PIN: m[1] || '18' } });
            return;
        }

        // --- RELAY ON/OFF ---
        m = line.match(/digitalWrite.*HIGH.*relay|relay.*on/i);
        if (m) { blocks.push({ type: 'relay_on', fields: { PIN: '4' } }); return; }

        m = line.match(/digitalWrite.*LOW.*relay|relay.*off/i);
        if (m) { blocks.push({ type: 'relay_off', fields: { PIN: '4' } }); return; }

        // --- DC MOTOR (keyword-based) ---
        m = line.match(/motor.*forward|set_motors_forward|motors.*forward/i);
        if (m) { blocks.push({ type: 'motor_forward', fields: { PORT: 'PORT1', SPEED: '200' } }); return; }

        m = line.match(/motor.*backward|motors.*backward/i);
        if (m) { blocks.push({ type: 'motor_backward', fields: { PORT: 'PORT1', SPEED: '200' } }); return; }

        m = line.match(/motor.*stop|stop_motors|motors.*stop/i);
        if (m) { blocks.push({ type: 'motor_stop', fields: { PORT: 'PORT1' } }); return; }

        // --- ULTRASONIC keyword ---
        m = line.match(/ultrasonic|HC-SR04|NewPing|HCSR04/i);
        if (m) {
            blocks.push({ type: 'ultrasonic_setup', fields: { TRIG: '12', ECHO: '13' }, target: 'setup' });
            return;
        }

        // --- DHT keyword ---
        m = line.match(/dht\.readTemp|dht_read|DHT11|DHT22/i);
        if (m) {
            blocks.push({ type: 'dht_setup', fields: { PIN: '4', TYPE: 'DHT11' }, target: 'setup' });
            return;
        }

        // --- IR SENSOR keyword ---
        m = line.match(/ir_sensor|ir.*read|IR.*sensor|IrSensor/i);
        if (m) { blocks.push({ type: 'ir_read', fields: { PIN: '4' } }); return; }

        // --- TOUCH ---
        m = line.match(/touchRead\s*\(\s*(\d+)\s*\)|touch.*read/i);
        if (m) { blocks.push({ type: 'touch_read', fields: { PIN: m[1] || '4' } }); return; }

        // --- WIFI ---
        m = line.match(/WiFi\.begin\s*\(\s*["'](.+?)["']\s*,\s*["'](.+?)["']\s*\)/i);
        if (m) {
            blocks.push({ type: 'wifi_connect', fields: { SSID: m[1], PASS: m[2] }, target: 'setup' });
            return;
        }
    });

    return blocks;
}

// ==========================================
// Board Selection
// ==========================================

function initBoardSelection() {
    const sel = document.getElementById('boardTypeSelect');
    if (!sel) return;

    // Restore saved board
    const saved = localStorage.getItem('currentBoardFqbn');
    if (saved) sel.value = saved;

    // Regenerate code on board change
    sel.addEventListener('change', () => {
        localStorage.setItem('currentBoardFqbn', sel.value);

        // Refresh all dropdown fields in workspace blocks
        const blocks = workspace.getAllBlocks();
        for (const block of blocks) {
            for (const input of block.inputList) {
                for (const field of input.fieldRow) {
                    if (field instanceof Blockly.FieldDropdown && field.menuGenerator_) {
                        field.refreshOptions();
                        const opts = field.getOptions();
                        const valid = opts.some(o => o[1] === field.getValue());
                        if (!valid && opts.length > 0) {
                            field.setValue(opts[0][1]);
                        }
                    }
                }
            }
        }

        generateCode();
    });
}

// ==========================================
// Serial Monitor
// ==========================================

let _serialEventSource = null;

function initSerialMonitor() {
    const overlay = document.getElementById('serialOverlay');
    const output = document.getElementById('serialOutput');
    const input = document.getElementById('serialInput');
    const sendBtn = document.getElementById('btnSerialSend');
    const connectBtn = document.getElementById('btnSerialConnect');
    const disconnectBtn = document.getElementById('btnSerialDisconnect');
    const closeBtn = document.getElementById('serialClose');
    const clearBtn = document.getElementById('btnSerialClear');
    const portSelect = document.getElementById('serialPortSelect');
    const baudSelect = document.getElementById('serialBaudSelect');
    const statusDot = document.getElementById('serialStatusDot');
    const autoScroll = document.getElementById('serialAutoScroll');
    const openBtn = document.getElementById('btnSerialMonitor');

    let connected = false;
    let currentPort = '';

    function appendLine(text, className) {
        const line = document.createElement('span');
        line.className = 'serial-line' + (className ? ' ' + className : '');
        line.textContent = text;
        output.appendChild(line);
        if (autoScroll.checked) {
            output.scrollTop = output.scrollHeight;
        }
    }

    function appendInfo(msg) {
        const ts = new Date().toLocaleTimeString();
        appendLine(`[${ts}] ${msg}`, 'serial-line--info');
    }

    function appendError(msg) {
        const ts = new Date().toLocaleTimeString();
        appendLine(`[${ts}] ERROR: ${msg}`, 'serial-line--error');
    }

    function setConnected(port) {
        connected = true;
        currentPort = port;
        statusDot.classList.add('serial-panel__status-dot--connected');
        connectBtn.style.display = 'none';
        disconnectBtn.style.display = '';
        input.disabled = false;
        sendBtn.disabled = false;
        portSelect.disabled = true;
        baudSelect.disabled = true;
        appendInfo(`Connected to ${port}`);
    }

    function setDisconnected() {
        connected = false;
        currentPort = '';
        if (_serialEventSource) {
            _serialEventSource.close();
            _serialEventSource = null;
        }
        statusDot.classList.remove('serial-panel__status-dot--connected');
        connectBtn.style.display = '';
        disconnectBtn.style.display = 'none';
        input.disabled = true;
        sendBtn.disabled = true;
        portSelect.disabled = false;
        baudSelect.disabled = false;
    }

    async function connectSerial() {
        const port = portSelect.value;
        const baud = parseInt(baudSelect.value);
        if (!port) { appendError('Please select a port'); return; }

        appendInfo(`Opening ${port} at ${baud} baud...`);

        try {
            const resp = await fetch('http://localhost:5001/api/serial-monitor/open', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ port, baud })
            });
            const data = await resp.json();
            if (!data.success) {
                appendError(data.error || 'Failed to open port');
                return;
            }
            setConnected(port);

            // Start SSE stream
            _serialEventSource = new EventSource('http://localhost:5001/api/serial-monitor/stream');
            _serialEventSource.onmessage = (e) => {
                try {
                    const msg = JSON.parse(e.data);
                    if (msg.type === 'data') {
                        appendLine(msg.text);
                    } else if (msg.type === 'error') {
                        appendError(msg.message);
                        setDisconnected();
                    }
                } catch (err) {
                    // ignore parse errors
                }
            };
            _serialEventSource.onerror = () => {
                appendError('Serial stream disconnected');
                setDisconnected();
            };
        } catch (err) {
            appendError('Failed to connect: ' + err.message);
        }
    }

    async function disconnectSerial() {
        try {
            await fetch('http://localhost:5001/api/serial-monitor/close', { method: 'POST' });
        } catch (e) { /* ignore */ }
        setDisconnected();
        appendInfo('Disconnected');
    }

    async function sendSerial() {
        const text = input.value;
        if (!text || !connected) return;
        input.value = '';
        try {
            const resp = await fetch('http://localhost:5001/api/serial-monitor/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text + '\n' })
            });
            const data = await resp.json();
            if (data.success) {
                appendLine(`> ${text}`, 'serial-line--sent');
            } else {
                appendError('Send failed: ' + (data.error || ''));
            }
        } catch (err) {
            appendError('Send error: ' + err.message);
        }
    }

    async function refreshPorts() {
        try {
            const resp = await fetch('http://localhost:5001/api/detect-port');
            const data = await resp.json();
            if (data.success && data.ports) {
                const current = portSelect.value;
                portSelect.innerHTML = '<option value="">Select port...</option>';
                data.ports.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.address;
                    opt.textContent = p.label;
                    portSelect.appendChild(opt);
                });
                if (current) portSelect.value = current;
                if (data.ports.length === 1) portSelect.value = data.ports[0].address;
            }
        } catch (e) { /* ignore */ }
    }

    // Event listeners
    openBtn.addEventListener('click', () => {
        overlay.style.display = 'flex';
        refreshPorts();
        appendInfo('Serial Monitor opened');
    });

    closeBtn.addEventListener('click', () => {
        if (connected) disconnectSerial();
        overlay.style.display = 'none';
    });

    connectBtn.addEventListener('click', connectSerial);
    disconnectBtn.addEventListener('click', disconnectSerial);
    sendBtn.addEventListener('click', sendSerial);

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendSerial();
    });

    clearBtn.addEventListener('click', () => {
        output.innerHTML = '';
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            if (connected) disconnectSerial();
            overlay.style.display = 'none';
        }
    });
}

// ==========================================
// Line Follower Robot Mini-Project & Simulator Engine
// ==========================================

/**
 * Automatically loads pre-configured Line Follower Robot blocks into Blockly workspace
 */
function loadLineFollowerBlocks() {
    _disableCentering = true;
    workspace.clear();

    try {
        const startBlock = workspace.newBlock('start_program');
        startBlock.initSvg();
        startBlock.render();
        startBlock.moveBy(50, 50);

        // Setup: Pin mode D2 (Left IR) and D3 (Right IR)
        const pm1 = workspace.newBlock('pin_mode');
        pm1.setFieldValue('2', 'PIN');
        pm1.setFieldValue('INPUT', 'MODE');
        pm1.initSvg();
        pm1.render();
        startBlock.getInput('SETUP').connection.connect(pm1.previousConnection);

        const pm2 = workspace.newBlock('pin_mode');
        pm2.setFieldValue('3', 'PIN');
        pm2.setFieldValue('INPUT', 'MODE');
        pm2.initSvg();
        pm2.render();
        pm1.nextConnection.connect(pm2.previousConnection);

        // Loop: Line Follower Algorithm
        const comment = workspace.newBlock('comment_block');
        comment.setFieldValue('// Line Follower Bot Logic: Left IR (D2), Right IR (D3)', 'TEXT');
        comment.initSvg();
        comment.render();
        startBlock.getInput('LOOP').connection.connect(comment.previousConnection);

        // ── if Left IR (D2 HIGH) → Turn Left ──────────────────────────
        const ifLeft = workspace.newBlock('if_condition');
        ifLeft.initSvg();
        ifLeft.render();
        comment.nextConnection.connect(ifLeft.previousConnection);

        const readLeft = workspace.newBlock('digital_read');
        readLeft.setFieldValue('2', 'PIN');
        readLeft.initSvg();
        readLeft.render();
        ifLeft.getInput('CONDITION').connection.connect(readLeft.outputConnection);

        // Turn Left: run Right motor (PORT5), stop Left motor (PORT4)
        const turnLeftMotorRight = workspace.newBlock('motor_forward');
        turnLeftMotorRight.setFieldValue('PORT5', 'PORT');
        turnLeftMotorRight.setFieldValue(200, 'SPEED');
        turnLeftMotorRight.initSvg();
        turnLeftMotorRight.render();
        ifLeft.getInput('DO').connection.connect(turnLeftMotorRight.previousConnection);

        const turnLeftMotorStop = workspace.newBlock('motor_stop');
        turnLeftMotorStop.setFieldValue('PORT4', 'PORT');
        turnLeftMotorStop.initSvg();
        turnLeftMotorStop.render();
        turnLeftMotorRight.nextConnection.connect(turnLeftMotorStop.previousConnection);

        // ── else-if Right IR (D3 HIGH) → Turn Right ───────────────────
        // Nest ifRight inside the ELSE of ifLeft (creates else-if chain)
        const ifRight = workspace.newBlock('if_condition');
        ifRight.initSvg();
        ifRight.render();
        ifLeft.getInput('ELSE').connection.connect(ifRight.previousConnection);

        const readRight = workspace.newBlock('digital_read');
        readRight.setFieldValue('3', 'PIN');
        readRight.initSvg();
        readRight.render();
        ifRight.getInput('CONDITION').connection.connect(readRight.outputConnection);

        // Turn Right: run Left motor (PORT4), stop Right motor (PORT5)
        const turnRightMotorLeft = workspace.newBlock('motor_forward');
        turnRightMotorLeft.setFieldValue('PORT4', 'PORT');
        turnRightMotorLeft.setFieldValue(200, 'SPEED');
        turnRightMotorLeft.initSvg();
        turnRightMotorLeft.render();
        ifRight.getInput('DO').connection.connect(turnRightMotorLeft.previousConnection);

        const turnRightMotorStop = workspace.newBlock('motor_stop');
        turnRightMotorStop.setFieldValue('PORT5', 'PORT');
        turnRightMotorStop.initSvg();
        turnRightMotorStop.render();
        turnRightMotorLeft.nextConnection.connect(turnRightMotorStop.previousConnection);

        // ── else → Go Forward (both motors on) ───────────────────────
        // Nest forward blocks inside the ELSE of ifRight
        const motorLeftFwd = workspace.newBlock('motor_forward');
        motorLeftFwd.setFieldValue('PORT4', 'PORT');
        motorLeftFwd.setFieldValue(200, 'SPEED');
        motorLeftFwd.initSvg();
        motorLeftFwd.render();
        ifRight.getInput('ELSE').connection.connect(motorLeftFwd.previousConnection);

        const motorRightFwd = workspace.newBlock('motor_forward');
        motorRightFwd.setFieldValue('PORT5', 'PORT');
        motorRightFwd.setFieldValue(200, 'SPEED');
        motorRightFwd.initSvg();
        motorRightFwd.render();
        motorLeftFwd.nextConnection.connect(motorRightFwd.previousConnection);

        currentProjectName = 'blix_boffin_line_follower';
        generateCode();
        logToConsole('info', '🤖 Loaded Blix Boffin Line Follower Robot blocks into workspace.');
        showToast('success', 'Line Follower Robot blocks loaded successfully!');
    } catch (err) {
        console.error('Error loading line follower blocks:', err);
        showToast('error', 'Failed to load line follower blocks');
    } finally {
        _disableCentering = false;
    }
}

/**
 * Line Follower Interactive Simulation & Mini-Project Manager
 */
function initLineFollowerSim() {
    const modal = document.getElementById('lineFollowerModal');
    const openBtn = document.getElementById('btnLineFollower');
    const closeBtn = document.getElementById('lfCloseBtn');
    const loadBlocksBtn = document.getElementById('btnLfLoadBlocks');

    if (!modal || !openBtn) return;

    openBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
        resetLfSim();
        drawLfTrack();
    });

    closeBtn.addEventListener('click', () => {
        stopLfSim();
        modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            stopLfSim();
            modal.style.display = 'none';
        }
    });

    if (loadBlocksBtn) {
        loadBlocksBtn.addEventListener('click', () => {
            loadLineFollowerBlocks();
            stopLfSim();
            modal.style.display = 'none';
        });
    }

    // Modal Tabs
    const tabs = modal.querySelectorAll('.lf-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('lf-tab--active'));
            tab.classList.add('lf-tab--active');
            const target = tab.getAttribute('data-tab');
            modal.querySelectorAll('.lf-tab-content').forEach(c => c.classList.remove('lf-tab-content--active'));
            const content = document.getElementById(target);
            if (content) content.classList.add('lf-tab-content--active');
            if (target === 'tab-sim') {
                drawLfTrack();
            }
        });
    });

    // Calibration Interactive Tester
    const whiteBox = document.getElementById('calibWhiteZone');
    const blackBox = document.getElementById('calibBlackZone');
    const calibLedDot = document.getElementById('calibLedDot');
    const calibLedText = document.getElementById('calibLedText');

    if (whiteBox && blackBox && calibLedDot && calibLedText) {
        whiteBox.addEventListener('click', () => {
            calibLedDot.classList.remove('lf-led-dot--on');
            calibLedText.textContent = 'Sensor Signal: LOW (White Surface - Reflected)';
        });

        blackBox.addEventListener('click', () => {
            calibLedDot.classList.add('lf-led-dot--on');
            calibLedText.textContent = 'Sensor Signal: HIGH (Black Tape - Absorbed)';
        });
    }

    // Canvas Simulator Setup
    const canvas = document.getElementById('lfCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    let animFrame = null;
    let isRunning = false;

    // Simulation Robot State
    let robot = {
        x: 140,
        y: 280,
        angle: 0, // radians
        speed: 2, // px per frame
        sensorOffset: 16,
        sensorSpread: 12
    };

    let trackPattern = 'oval';

    const runBtn = document.getElementById('btnLfRun');
    const pauseBtn = document.getElementById('btnLfPause');
    const resetBtn = document.getElementById('btnLfReset');
    const trackSelect = document.getElementById('lfTrackSelect');
    const speedRange = document.getElementById('lfSpeedRange');

    if (trackSelect) {
        trackSelect.addEventListener('change', (e) => {
            trackPattern = e.target.value;
            resetLfSim();
        });
    }

    if (speedRange) {
        speedRange.addEventListener('input', (e) => {
            robot.speed = parseFloat(e.target.value);
        });
    }

    if (runBtn) {
        runBtn.addEventListener('click', () => {
            isRunning = true;
            runBtn.style.display = 'none';
            pauseBtn.style.display = 'inline-flex';
            loopLfSim();
        });
    }

    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            stopLfSim();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetLfSim();
        });
    }

    function stopLfSim() {
        isRunning = false;
        if (animFrame) cancelAnimationFrame(animFrame);
        if (runBtn) runBtn.style.display = 'inline-flex';
        if (pauseBtn) pauseBtn.style.display = 'none';
    }

    function resetLfSim() {
        stopLfSim();
        if (trackPattern === 'oval') {
            robot.x = 280;
            robot.y = 320;
            robot.angle = 0;
        } else if (trackPattern === 'figure8') {
            robot.x = 280;
            robot.y = 190;
            robot.angle = 0;
        } else {
            robot.x = 100;
            robot.y = 310;
            robot.angle = -Math.PI / 4;
        }
        drawLfTrack();
        updateTelemetry(false, false, 'IDLE');
    }

    function drawTrackBackground() {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw track outline / floor grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Draw Black Track Line (22px thick)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 22;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        if (trackPattern === 'oval') {
            // Draw Oval Loop
            ctx.ellipse(280, 190, 180, 130, 0, 0, Math.PI * 2);
        } else if (trackPattern === 'figure8') {
            // Draw Figure 8 Track
            ctx.ellipse(190, 190, 100, 100, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(370, 190, 100, 100, 0, 0, Math.PI * 2);
        } else {
            // Draw S-Curves Track
            ctx.moveTo(80, 320);
            ctx.bezierCurveTo(150, 80, 320, 350, 480, 80);
        }
        ctx.stroke();

        // Draw inner white guide indicator line (thin dashed)
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function drawLfTrack() {
        drawTrackBackground();
        drawRobot();
    }

    function drawRobot() {
        ctx.save();
        ctx.translate(robot.x, robot.y);
        ctx.rotate(robot.angle);

        // Chassis Body
        ctx.fillStyle = '#6366f1';
        ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(-16, -12, 32, 24, 6);
        ctx.fill();

        // Wheels
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-10, -15, 12, 4); // Left rear wheel
        ctx.fillRect(-10, 11, 12, 4);  // Right rear wheel

        // Front Caster Wheel
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(10, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // IR Sensors (probes)
        const leftSensorX = robot.sensorOffset;
        const leftSensorY = -robot.sensorSpread;
        const rightSensorX = robot.sensorOffset;
        const rightSensorY = robot.sensorSpread;

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(leftSensorX, leftSensorY, 3, 0, Math.PI * 2);
        ctx.arc(rightSensorX, rightSensorY, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function readSensorColor(sensorWorldX, sensorWorldY) {
        if (sensorWorldX < 0 || sensorWorldX >= canvas.width || sensorWorldY < 0 || sensorWorldY >= canvas.height) {
            return false;
        }
        const pixel = ctx.getImageData(Math.floor(sensorWorldX), Math.floor(sensorWorldY), 1, 1).data;
        // Black line threshold (Red < 50, Green < 50, Blue < 50)
        return (pixel[0] < 50 && pixel[1] < 50 && pixel[2] < 50);
    }

    function loopLfSim() {
        if (!isRunning) return;

        // 1. Draw track background without robot overlay so sensor readings are accurate
        drawTrackBackground();

        // 2. Calculate world coordinates for Left and Right IR sensors
        const cosA = Math.cos(robot.angle);
        const sinA = Math.sin(robot.angle);

        const leftWorldX = robot.x + cosA * robot.sensorOffset - sinA * (-robot.sensorSpread);
        const leftWorldY = robot.y + sinA * robot.sensorOffset + cosA * (-robot.sensorSpread);

        const rightWorldX = robot.x + cosA * robot.sensorOffset - sinA * (robot.sensorSpread);
        const rightWorldY = robot.y + sinA * robot.sensorOffset + cosA * (robot.sensorSpread);

        // 3. Read background pixel color directly under IR sensor positions
        const leftOnLine = readSensorColor(leftWorldX, leftWorldY);
        const rightOnLine = readSensorColor(rightWorldX, rightWorldY);

        let action = 'FORWARD';
        let turnRate = 0.06;

        if (leftOnLine && !rightOnLine) {
            action = 'TURN LEFT';
            robot.angle -= turnRate * robot.speed;
        } else if (rightOnLine && !leftOnLine) {
            action = 'TURN RIGHT';
            robot.angle += turnRate * robot.speed;
        } else if (leftOnLine && rightOnLine) {
            action = 'ON LINE (BOTH)';
        } else {
            action = 'SEARCHING LINE';
        }

        // 4. Update robot position
        robot.x += Math.cos(robot.angle) * (robot.speed * 0.85);
        robot.y += Math.sin(robot.angle) * (robot.speed * 0.85);

        // Keep robot within bounds
        if (robot.x < 20) robot.x = canvas.width - 20;
        if (robot.x > canvas.width - 20) robot.x = 20;
        if (robot.y < 20) robot.y = canvas.height - 20;
        if (robot.y > canvas.height - 20) robot.y = 20;

        // 5. Render robot chassis & sensors on top
        drawRobot();

        // 6. Update telemetry UI
        updateTelemetry(leftOnLine, rightOnLine, action);

        animFrame = requestAnimationFrame(loopLfSim);
    }

    function updateTelemetry(leftOnLine, rightOnLine, action) {
        const valLeft = document.getElementById('valSensorLeft');
        const valRight = document.getElementById('valSensorRight');
        const boxLeft = document.getElementById('boxSensorLeft');
        const boxRight = document.getElementById('boxSensorRight');
        const motorStatus = document.getElementById('valMotorStatus');
        const actionBadge = document.getElementById('lfActionBadge');

        if (valLeft) valLeft.textContent = leftOnLine ? 'BLACK (1)' : 'WHITE (0)';
        if (valRight) valRight.textContent = rightOnLine ? 'BLACK (1)' : 'WHITE (0)';

        if (boxLeft) boxLeft.classList.toggle('lf-sensor-box--active', leftOnLine);
        if (boxRight) boxRight.classList.toggle('lf-sensor-box--active', rightOnLine);

        if (actionBadge) actionBadge.textContent = `Robot Action: ${action}`;

        if (motorStatus) {
            if (action === 'TURN LEFT') motorStatus.textContent = 'M1: STOP | M2: FORWARD (200)';
            else if (action === 'TURN RIGHT') motorStatus.textContent = 'M1: FORWARD (200) | M2: STOP';
            else if (action === 'FORWARD' || action === 'ON LINE (BOTH)') motorStatus.textContent = 'M1: FORWARD (200) | M2: FORWARD (200)';
            else motorStatus.textContent = 'Motors: SEARCHING / LOW';
        }
    }
}
