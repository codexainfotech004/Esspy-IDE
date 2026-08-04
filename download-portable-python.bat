@echo off
REM =============================================
REM Download Portable Python for BharatBlocks
REM =============================================
REM This script downloads a portable Python distribution
REM and installs the required Flask dependencies.
REM The bundled Python will be included in the app.
REM =============================================

setlocal enabledelayedexpansion

echo.
echo ============================================
echo   Downloading Portable Python
echo ============================================
echo.

REM Create resources directory
if not exist "resources" mkdir resources
cd resources

REM Python 3.11 portable zip for Windows x64
set PYTHON_URL=https://www.python.org/ftp/python/3.11.7/python-3.11.7-embed-amd64.zip
set PYTHON_ZIP=python-3.11.7-embed-amd64.zip
set PYTHON_DIR=python-3.11.7-embed-amd64

echo Downloading Python 3.11.7 (portable)...
echo This may take a few minutes...
echo.

REM Check if curl exists (Windows 10+)
curl --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: curl not found. Please download manually:
    echo %PYTHON_URL%
    echo Extract to: resources\%PYTHON_DIR%
    pause
    exit /b 1
)

REM Download Python
curl -L -o %PYTHON_ZIP% %PYTHON_URL%
if errorlevel 1 (
    echo ERROR: Failed to download Python
    pause
    exit /b 1
)

echo Extracting Python...
powershell -Command "Expand-Archive -Force %PYTHON_ZIP% ."
if errorlevel 1 (
    echo ERROR: Failed to extract Python
    pause
    exit /b 1
)

REM Clean up zip file
del %PYTHON_ZIP%

echo.
echo Configuring portable Python...
cd %PYTHON_DIR%

REM Modify python311._pth to allow imports
echo python311._pth > python311._pth.new
echo python310.zip >> python311._pth.new
echo . >> python311._pth.new
echo import site >> python311._pth.new

move /Y python311._pth.new python311._pth

REM Create get-pip.py for installing packages
echo Downloading get-pip.py...
curl -o get-pip.py https://bootstrap.pypa.io/get-pip.py
if errorlevel 1 (
    echo WARNING: Failed to download get-pip.py
    echo You may need to install pip manually
)

REM Install pip if get-pip.py was downloaded
if exist get-pip.py (
    echo Installing pip...
    python.exe get-pip.py --no-warn-script-location
    del get-pip.py
)

REM Install Flask and Flask-CORS
echo Installing Flask and Flask-CORS...
python.exe -m pip install --no-warn-script-location flask flask-cors --target .

echo.
echo ============================================
echo   Portable Python Setup Complete!
echo ============================================
echo.
echo Portable Python is ready at: resources\%PYTHON_DIR%
echo.

cd ..\..

pause
