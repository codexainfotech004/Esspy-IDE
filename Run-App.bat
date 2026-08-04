@echo off
REM =============================================
REM BharatBlocks IDE - Application Launcher
REM =============================================
REM This script checks dependencies and launches
REM the application. Use this to run the app
REM from the source code folder.
REM =============================================

setlocal enabledelayedexpansion

echo.
echo ============================================
echo   BharatBlocks IDE
echo ============================================
echo.

REM Check Python
echo Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Python is not installed or not in PATH
    echo.
    echo Please install Python 3.9+ from: https://www.python.org/downloads/
    echo IMPORTANT: Check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)
python --version
echo Python: OK
echo.

REM Check Node.js
echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
node --version
echo Node.js: OK
echo.

REM Check Python dependencies
echo Checking Python dependencies...
cd backend
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo Flask not found. Installing...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install Python dependencies
        cd ..
        pause
        exit /b 1
    )
)
cd ..
echo Python dependencies: OK
echo.

REM Check Node.js dependencies
echo Checking Node.js dependencies...
if not exist "node_modules" (
    echo Node modules not found. Installing...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install Node.js dependencies
        pause
        exit /b 1
    )
)
echo Node.js dependencies: OK
echo.

REM Launch the application
echo ============================================
echo   Launching BharatBlocks IDE...
echo ============================================
echo.
call npm start
