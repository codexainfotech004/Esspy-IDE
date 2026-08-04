@echo off
REM =============================================
REM BharatBlocks IDE - Single File Builder
REM =============================================
REM This script creates a single EXE file that
REM contains the entire application. When run,
REM it self-extracts to temp and launches the app.
REM =============================================

setlocal enabledelayedexpansion

echo.
echo ============================================
echo   BharatBlocks IDE - Single File Builder
echo ============================================
echo.

REM Step 1: Build portable version
echo [1/3] Building portable version...
if not exist "BharatBlocks-Portable\ESPY IDE.exe" (
    echo Portable version not found. Building...
    call build-portable.bat
    if errorlevel 1 (
        echo ERROR: Failed to build portable version
        pause
        exit /b 1
    )
) else (
    echo Portable version already exists.
)

REM Step 2: Check for 7-Zip
echo.
echo [2/3] Checking for 7-Zip...
set SEVENZIP=
if exist "C:\Program Files\7-Zip\7z.exe" set SEVENZIP="C:\Program Files\7-Zip\7z.exe"
if exist "C:\Program Files (x86)\7-Zip\7z.exe" set SEVENZIP="C:\Program Files (x86)\7-Zip\7z.exe"

if "%SEVENZIP%"=="" (
    echo ERROR: 7-Zip not found.
    echo Please install 7-Zip from https://www.7-zip.org/
    echo.
    echo Alternative: Use NSIS to build single file:
    echo   makensis build-single-file.nsi
    pause
    exit /b 1
)

echo 7-Zip found at %SEVENZIP%

REM Step 3: Create self-extracting archive
echo.
echo [3/3] Creating self-extracting EXE...
echo This may take a few minutes...

REM Create config file for SFX
echo ;!@Install@!UTF-8! > config.txt
echo Title="BharatBlocks IDE" >> config.txt
echo BeginPrompt="BharatBlocks IDE will be extracted and launched." >> config.txt
echo RunProgram="ESPY IDE.exe" >> config.txt
echo ;!@InstallEnd@! >> config.txt

REM Download 7-Zip SFX module if not present
if not exist "7z.sfx" (
    echo Downloading 7-Zip SFX module...
    curl -L -o 7z.sfx https://www.7-zip.org/a/7zS.sfx
    if errorlevel 1 (
        echo ERROR: Failed to download SFX module
        del config.txt
        pause
        exit /b 1
    )
)

REM Create the archive
%SEVENZIP% a -sfx7z.sfx -t7z -m0=lzma2 -mx9 -mfb=64 -md=32m -ms=on "BharatBlocks-IDE.exe" "BharatBlocks-Portable\*" -config=config.txt

if errorlevel 1 (
    echo ERROR: Failed to create self-extracting archive
    del config.txt
    pause
    exit /b 1
)

REM Cleanup
del config.txt

echo.
echo ============================================
echo   Single File Build Complete!
echo ============================================
echo.
echo Created: BharatBlocks-IDE.exe
echo.
echo This is a single EXE file that contains everything.
echo Share this file with anyone - they just double-click it.
echo No installation, no dependencies required.
echo.
echo File size:
dir "BharatBlocks-IDE.exe" | find "BharatBlocks-IDE.exe"
echo.
pause
