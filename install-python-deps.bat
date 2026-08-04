@echo off
REM =============================================
REM BharatBlocks IDE - Python Dependencies Installer
REM =============================================
REM This script installs Python dependencies
REM required for the backend Flask server.
REM =============================================

echo.
echo ============================================
echo   Installing Python Dependencies
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.9+ from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

echo Python found: 
python --version
echo.

REM Install dependencies
echo Installing Flask and Flask-CORS...
cd /d "%~dp0"
cd backend
pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install dependencies
    echo Try running as Administrator or check your internet connection
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Python Dependencies Installed Successfully!
echo ============================================
echo.
echo The backend server is now ready to run.
echo.
pause
