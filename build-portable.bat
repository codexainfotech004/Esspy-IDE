@echo off
REM =============================================
REM BharatBlocks IDE - Portable Build Script
REM =============================================
REM This script creates a fully self-contained
REM portable Windows application folder that
REM can be shared without requiring Python or
REM Node.js installation on the target machine.
REM =============================================

setlocal enabledelayedexpansion

echo.
echo ============================================
echo   BharatBlocks IDE - Portable Build
echo ============================================
echo.
echo This will create a portable app folder with:
echo   - Bundled Python runtime
echo   - Pre-installed Flask dependencies
echo   - Electron application
echo   - All backend functionality
echo.
echo The output will be in: BharatBlocks-Portable\
echo.
pause

REM Step 1: Download and setup portable Python
echo.
echo [1/5] Setting up portable Python...
if not exist "resources\python-3.11.7-embed-amd64\python.exe" (
    echo Portable Python not found. Downloading...
    call download-portable-python.bat
    if errorlevel 1 (
        echo ERROR: Failed to setup portable Python
        pause
        exit /b 1
    )
) else (
    echo Portable Python already exists.
)

REM Step 2: Install Flask dependencies in portable Python
echo.
echo [2/5] Installing Flask dependencies in portable Python...
cd resources\python-3.11.7-embed-amd64
python.exe -m pip install --no-warn-script-location flask flask-cors --target .
if errorlevel 1 (
    echo ERROR: Failed to install Flask dependencies
    cd ..\..
    pause
    exit /b 1
)
cd ..\..
echo Flask dependencies installed successfully.

REM Step 3: Install Node.js dependencies
echo.
echo [3/5] Installing Node.js dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install Node.js dependencies
    pause
    exit /b 1
)
echo Node.js dependencies installed successfully.

REM Step 4: Build portable Windows app
echo.
echo [4/5] Building portable Windows application...
echo This may take a few minutes...
call npm run build-win-portable
if errorlevel 1 (
    echo ERROR: Failed to build Windows app
    pause
    exit /b 1
)
echo Windows app built successfully.

REM Step 5: Copy portable Python to dist folder
echo.
echo [5/5] Copying portable Python to application folder...
if exist "dist\win-unpacked" (
    if not exist "dist\win-unpacked\resources" mkdir "dist\win-unpacked\resources"
    xcopy /E /I /Y "resources\python-3.11.7-embed-amd64" "dist\win-unpacked\resources\python-3.11.7-embed-amd64"
    echo Portable Python copied to application folder.
) else (
    echo WARNING: dist\win-unpacked not found. Python not copied.
)

REM Create portable distribution folder
echo.
echo Creating portable distribution folder...
if exist "BharatBlocks-Portable" rmdir /s /q "BharatBlocks-Portable"
mkdir "BharatBlocks-Portable"

REM Copy the built app
xcopy /E /I /Y "dist\win-unpacked\*" "BharatBlocks-Portable\"

REM Create a simple launcher batch file
echo @echo off > "BharatBlocks-Portable\Run BharatBlocks IDE.bat"
echo start "" "ESPY IDE.exe" >> "BharatBlocks-Portable\Run BharatBlocks IDE.bat"

REM Create README for portable version
echo # BharatBlocks IDE - Portable Version > "BharatBlocks-Portable\README.txt"
echo. >> "BharatBlocks-Portable\README.txt"
echo This is a portable version of BharatBlocks IDE. >> "BharatBlocks-Portable\README.txt"
echo No installation required - just run ESPY IDE.exe >> "BharatBlocks-Portable\README.txt"
echo. >> "BharatBlocks-Portable\README.txt"
echo Everything is included: >> "BharatBlocks-Portable\README.txt"
echo - Python runtime (bundled) >> "BharatBlocks-Portable\README.txt"
echo - Flask backend (pre-configured) >> "BharatBlocks-Portable\README.txt"
echo - All dependencies >> "BharatBlocks-Portable\README.txt"
echo. >> "BharatBlocks-Portable\README.txt"
echo To run: >> "BharatBlocks-Portable\README.txt"
echo   1. Double-click ESPY IDE.exe >> "BharatBlocks-Portable\README.txt"
echo   2. Or double-click "Run BharatBlocks IDE.bat" >> "BharatBlocks-Portable\README.txt"
echo. >> "BharatBlocks-Portable\README.txt"

echo.
echo ============================================
echo   Portable Build Complete!
echo ============================================
echo.
echo Portable application created in: BharatBlocks-Portable\
echo.
echo You can now share this entire folder with anyone.
echo They just need to double-click ESPY IDE.exe to run it.
echo No Python or Node.js installation required.
echo.
echo Folder size: 
dir "BharatBlocks-Portable" | find "BharatBlocks-Portable"
echo.
pause
