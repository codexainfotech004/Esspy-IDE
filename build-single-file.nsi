; =============================================
; BharatBlocks IDE - Single File EXE Script
; =============================================
; This NSIS script creates a self-extracting
; single EXE that contains the entire portable
; application. No installation required.
; =============================================

!define APPNAME "BharatBlocks IDE"
!define COMPANYNAME "BharatBlocks Team"
!define DESCRIPTION "Offline Block Programming for ESP32/Arduino"
!define VERSIONMAJOR 1
!define VERSIONMINOR 0
!define VERSIONBUILD 0

!define HELPURL "https://github.com/bharatblocks"
!define UPDATEURL "https://github.com/bharatblocks"
!define ABOUTURL "https://github.com/bharatblocks"
!define INSTALLSIZE 500000

; Silent installer - no UI
SilentInstall silent
SilentUninstall silent

; General
Name "${APPNAME}"
OutFile "BharatBlocks-IDE.exe"
Unicode True
RequestExecutionLevel user
ShowInstDetails nevershow

; Installer Sections
Section "BharatBlocks IDE" SecApp
    
    ; Set output path to a temporary directory
    SetOutPath $TEMP\BharatBlocksIDE
    
    ; Extract all files from portable folder
    File /r "BharatBlocks-Portable\*.*"
    
    ; Run the application
    Exec '"$TEMP\BharatBlocksIDE\ESPY IDE.exe"'
    
SectionEnd
