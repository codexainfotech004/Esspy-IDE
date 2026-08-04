#!/bin/bash
# =============================================
# BharatBlocks IDE - Application Launcher (macOS/Linux)
# =============================================
# This script checks dependencies and launches
# the application. Use this to run the app
# from the source code folder.
# =============================================

echo ""
echo "============================================"
echo "  BharatBlocks IDE"
echo "============================================"
echo ""

# Check Python
echo "Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo ""
    echo "[ERROR] Python 3 is not installed"
    echo ""
    echo "Please install Python 3.9+:"
    echo "  macOS: brew install python3"
    echo "  Ubuntu/Debian: sudo apt install python3 python3-pip"
    echo "  Fedora: sudo dnf install python3 python3-pip"
    echo ""
    exit 1
fi
python3 --version
echo "Python: OK"
echo ""

# Check Node.js
echo "Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo ""
    echo "[ERROR] Node.js is not installed"
    echo ""
    echo "Please install Node.js 18+: https://nodejs.org/"
    echo ""
    exit 1
fi
node --version
echo "Node.js: OK"
echo ""

# Check Python dependencies
echo "Checking Python dependencies..."
cd backend
python3 -c "import flask" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Flask not found. Installing..."
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install Python dependencies"
        cd ..
        exit 1
    fi
fi
cd ..
echo "Python dependencies: OK"
echo ""

# Check Node.js dependencies
echo "Checking Node.js dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Node modules not found. Installing..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install Node.js dependencies"
        exit 1
    fi
fi
echo "Node.js dependencies: OK"
echo ""

# Launch the application
echo "============================================"
echo "  Launching BharatBlocks IDE..."
echo "============================================"
echo ""
npm start
