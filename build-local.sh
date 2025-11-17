#!/bin/bash
# ============================================================================
# Local Build Script for Hyper AI Agent
# This script builds both frontend and backend, then packages with Electron
# ============================================================================

set -e

echo ""
echo "========================================"
echo "Hyper AI Agent - Local Build Script"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python is not installed"
    echo "Please install Python 3.11 or higher"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed"
    echo "Please install Node.js 20 or higher"
    exit 1
fi

echo "[INFO] Python version:"
python3 --version
echo "[INFO] Node.js version:"
node --version
echo ""

# ============================================================================
# Step 1: Setup Python Virtual Environment
# ============================================================================
echo "[STEP 1/6] Setting up Python virtual environment..."
echo ""

if [ -d "venv" ]; then
    echo "[INFO] Virtual environment already exists"
else
    echo "[INFO] Creating virtual environment..."
    python3 -m venv venv
fi

echo "[INFO] Activating virtual environment..."
source venv/bin/activate

echo "[INFO] Upgrading pip..."
python -m pip install --upgrade pip --quiet

echo "[INFO] Installing Python dependencies..."
pip install -r requirements.txt --quiet

echo "[SUCCESS] Python environment ready"
echo ""

# ============================================================================
# Step 2: Build Backend with PyInstaller
# ============================================================================
echo "[STEP 2/6] Building backend with Briefcase..."
echo ""

if [ -d "dist/backend" ]; then
    echo "[INFO] Cleaning previous dist/backend directory..."
    rm -rf dist/backend
fi

PLATFORM="$(uname)"
echo "[INFO] Detected platform: $PLATFORM"

if [[ "$PLATFORM" == "Darwin" ]]; then
    echo "[INFO] Building backend with Briefcase (macOS)..."
    briefcase create macOS
    briefcase build macOS -u

    APP="macOS/Hyper AI Agent Backend.app/Contents/MacOS/Hyper AI Agent Backend"
    if [ ! -f "$APP" ]; then
        echo "[ERROR] Backend binary not found: $APP"
        exit 1
    fi

    mkdir -p dist/backend
    cp "$APP" dist/backend/backend
    chmod +x dist/backend/backend
elif [[ "$PLATFORM" == "Linux" ]]; then
    echo "[INFO] Building backend with Briefcase (Linux)..."
    briefcase create linux
    briefcase build linux -u

    APP_DIR="linux/Hyper AI Agent Backend/app"
    BIN="$APP_DIR/Hyper AI Agent Backend"
    if [ ! -f "$BIN" ]; then
        echo "[ERROR] Backend binary not found: $BIN"
        exit 1
    fi

    mkdir -p dist/backend
    cp "$BIN" dist/backend/backend
    chmod +x dist/backend/backend
else
    echo "[ERROR] Unsupported platform: $PLATFORM"
    exit 1
fi

echo "[SUCCESS] Backend built successfully"
echo ""

# ============================================================================
# Step 3: Install Node.js Dependencies
# ============================================================================
echo "[STEP 3/6] Installing Node.js dependencies..."
echo ""

if [ -d "node_modules" ]; then
    echo "[INFO] node_modules already exists, skipping install"
else
    echo "[INFO] Installing Node.js packages..."
    npm install --silent
fi

echo "[SUCCESS] Node.js dependencies ready"
echo ""

# ============================================================================
# Step 4: Build Frontend
# ============================================================================
echo "[STEP 4/6] Building frontend..."
echo ""

echo "[INFO] Building React frontend..."
npm run build:frontend

echo "[SUCCESS] Frontend built successfully"
echo ""

# ============================================================================
# Step 5: Build Electron App
# ============================================================================
echo "[STEP 5/6] Building Electron application..."
echo ""

echo "[INFO] Packaging with electron-builder..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    npm run build -- --mac --publish=never
else
    npm run build -- --linux --publish=never
fi

echo "[SUCCESS] Electron app built successfully"
echo ""

# ============================================================================
# Step 6: Copy Output to 'output' Folder
# ============================================================================
echo "[STEP 6/6] Copying build artifacts to output folder..."
echo ""

mkdir -p output

echo "[INFO] Copying executable files..."

# Copy macOS app
if [ -f release/*.dmg ]; then
    cp release/*.dmg output/
    echo "[SUCCESS] Copied DMG to output/"
fi

if [ -d release/*.app ]; then
    cp -r release/*.app output/
    echo "[SUCCESS] Copied app bundle to output/"
fi

# Copy Linux packages
if [ -f release/*.AppImage ]; then
    cp release/*.AppImage output/
    echo "[SUCCESS] Copied AppImage to output/"
fi

if [ -f release/*.deb ]; then
    cp release/*.deb output/
    echo "[SUCCESS] Copied deb package to output/"
fi

if [ -f release/*.rpm ]; then
    cp release/*.rpm output/
    echo "[SUCCESS] Copied rpm package to output/"
fi

# Copy unpacked app if exists
if [ -d "release/linux-unpacked" ]; then
    echo "[INFO] Copying unpacked application..."
    rm -rf output/linux-unpacked
    cp -r release/linux-unpacked output/
    echo "[SUCCESS] Copied unpacked app to output/linux-unpacked/"
fi

if [ -d "release/mac" ]; then
    echo "[INFO] Copying unpacked application..."
    rm -rf output/mac
    cp -r release/mac output/
    echo "[SUCCESS] Copied unpacked app to output/mac/"
fi

echo ""
echo "========================================"
echo "Build Complete!"
echo "========================================"
echo ""
echo "Output files are in the 'output' folder:"
ls -lh output/
echo ""
echo "You can run the installer or executable from the output folder."
echo ""
