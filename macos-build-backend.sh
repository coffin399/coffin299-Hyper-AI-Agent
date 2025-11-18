#!/bin/bash
# ============================================================================
# Backend Build Script (Nuitka, macOS)
# Builds the Python backend with Nuitka for macOS.
# ============================================================================

set -e

echo ""
echo "========================================"
echo "Hyper AI Agent - Backend Build (macOS)"
echo "========================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
  echo "[ERROR] python3 is not installed"
  echo "Please install Python 3.11 or higher"
  exit 1
fi

PY_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "[INFO] Using Python version: $PY_VERSION"

# Setup venv
if [ -d "venv" ]; then
  echo "[INFO] Using existing virtual environment 'venv'"
else
  echo "[INFO] Creating virtual environment 'venv'..."
  python3 -m venv venv
fi

source venv/bin/activate

echo "[INFO] Upgrading pip..."
python -m pip install --upgrade pip --quiet

echo "[INFO] Installing Python dependencies from requirements.txt..."
pip install -r requirements.txt --quiet

echo "[SUCCESS] Python environment ready"
echo ""

# Clean previous dist/build
if [ -d "build" ]; then
  echo "[INFO] Cleaning previous build directory..."
  rm -rf build
fi

if [ -d "dist/backend" ]; then
  echo "[INFO] Cleaning previous dist/backend directory..."
  rm -rf dist/backend
fi

echo "[INFO] Building backend with Briefcase (macOS)..."
briefcase create macOS
briefcase build macOS -u

APP="build/hyper-ai-agent-backend/macos/app/Hyper AI Agent Backend.app/Contents/MacOS/Hyper AI Agent Backend"
if [ ! -f "$APP" ]; then
  echo "[ERROR] Backend binary not found: $APP"
  exit 1
fi

echo "[INFO] Moving backend binary to dist/backend/backend..."
mkdir -p dist/backend
cp "$APP" dist/backend/backend
chmod +x dist/backend/backend

echo ""
echo "========================================"
echo "Backend build with Nuitka completed (macOS)."
echo "Executable: dist/backend/backend"
echo "========================================"
echo ""
