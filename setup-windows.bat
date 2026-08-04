@echo off
REM =============================================
REM BharatBlocks IDE - One-Click Windows Setup
REM =============================================
REM This script sets up everything needed to run
REM BharatBlocks IDE on Windows with backend support.
REM
REM Features:
REM - Checks Python installation
REM - Checks Node.js installation
REM - Installs Python dependencies
REM - Installs Node.js dependencies
REM - Builds Windows executable
REM - Runs the application
REM =============================================

setlocal enabledelayedexpansion

echo.
echo ============================================
echo   BharatBlocks IDE - Windows Setup
echo ============================================
echo.

REM Check if Python is installed
echo [1/6] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.9+ from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)
python --version
echo Python found successfully!
echo.

REM Check if Node.js is installed
echo [2/6] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo Node.js found successfully!
echo.

REM Install Python dependencies
echo [3/6] Installing Python dependencies...
cd /d "%~dp0"
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)
echo Python dependencies installed successfully!
echo.

REM Install Node.js dependencies
echo [4/6] Installing Node.js dependencies...
cd /d "%~dp0"
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install Node.js dependencies
    pause
    exit /b 1
)
echo Node.js dependencies installed successfully!
echo.

REM Build Windows executable
echo [5/6] Building Windows executable...
echo This may take a few minutes...
call npm run build-win
if errorlevel 1 (
    echo ERROR: Failed to build Windows executable
    pause
    exit /b 1
)
echo Windows executable built successfully!
echo.

REM Run the application
echo [6/6] Starting BharatBlocks IDE...
echo.
echo Setup complete! The application will now start.
echo.
echo The executable is located in: dist\ESPY IDE Setup 1.0.0.exe
echo.

REM Ask if user wants to run the app now
set /p run_now="Do you want to run the application now? (Y/N): "
if /i "!run_now!"=="Y" (
    echo.
    echo Starting BharatBlocks IDE...
    call npm start
) else (
    echo.
    echo You can run the application later by:
    echo 1. Double-clicking: dist\ESPY IDE Setup 1.0.0.exe
    echo 2. Or running: npm start
    echo.
)

echo.
echo ============================================
echo   Setup Complete!
echo ============================================
echo.
pause
