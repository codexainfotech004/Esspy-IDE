@echo off
REM =============================================
REM BharatBlocks IDE - Build Both Architectures
REM =============================================
REM This script builds both 32-bit and 64-bit
REM versions to fix compatibility errors.
REM =============================================

setlocal enabledelayedexpansion

echo.
echo ============================================
echo   BharatBlocks IDE - Build Both Versions
echo ============================================
echo.
echo This will create:
echo   1. ESPY-IDE-Portable-x64.exe (64-bit)
echo   2. ESPY-IDE-Portable-ia32.exe (32-bit)
echo.
echo Send the 32-bit version to older PCs.
echo Send the 64-bit version to modern PCs.
echo.
pause

REM Step 1: Install dependencies
echo.
echo [1/3] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

REM Step 2: Build 64-bit version
echo.
echo [2/3] Building 64-bit version...
echo This may take a few minutes...
call npm run build-win-portable
if errorlevel 1 (
    echo ERROR: Failed to build 64-bit version
    pause
    exit /b 1
)

REM Rename 64-bit output
if exist "dist\ESPY IDE Setup 1.0.0.exe" (
    move "dist\ESPY IDE Setup 1.0.0.exe" "ESPY-IDE-Portable-x64.exe"
    echo 64-bit version: ESPY-IDE-Portable-x64.exe
)

REM Step 3: Build 32-bit version
echo.
echo [3/3] Building 32-bit version...
echo This may take a few minutes...
call npm run build-win-portable-32
if errorlevel 1 (
    echo ERROR: Failed to build 32-bit version
    pause
    exit /b 1
)

REM Rename 32-bit output
if exist "dist\ESPY IDE Setup 1.0.0.exe" (
    move "dist\ESPY IDE Setup 1.0.0.exe" "ESPY-IDE-Portable-ia32.exe"
    echo 32-bit version: ESPY-IDE-Portable-ia32.exe
)

echo.
echo ============================================
echo   Build Complete!
echo ============================================
echo.
echo Created files:
echo   - ESPY-IDE-Portable-x64.exe (64-bit)
echo   - ESPY-IDE-Portable-ia32.exe (32-bit)
echo.
echo Which one to send?
echo   - 64-bit: For modern Windows 10/11 PCs
echo   - 32-bit: For older PCs or 32-bit Windows
echo.
echo File sizes:
dir ESPY-IDE-Portable-*.exe | find "ESPY-IDE"
echo.
pause
