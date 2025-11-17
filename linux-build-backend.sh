#!/bin/bash
# ============================================================================
# Backend Build Script (Nuitka, Linux)
# Builds the Python backend with Nuitka for Linux.
# ============================================================================

set -e

echo ""
echo "========================================"
echo "Hyper AI Agent - Backend Build (Linux)"
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

# Build backend with Nuitka
echo "[INFO] Running Nuitka (this may take 10-30 minutes)..."
echo "[INFO] Note: first build will be slow as Nuitka downloads dependencies"

python3 -m nuitka \
  --standalone --onefile \
  --output-dir=dist \
  --output-filename=backend \
  --include-package=fastapi \
  --include-package=uvicorn \
  --include-package=pydantic \
  --include-package=sqlalchemy \
  --include-package=langchain \
  --include-package=langchain_core \
  --include-package=langchain_community \
  --include-package=langchain_openai \
  --include-package=langchain_anthropic \
  --include-package=langchain_google_genai \
  --include-package=langchain_ollama \
  --include-package=openai \
  --include-package=anthropic \
  --include-package=google.generativeai \
  --include-package=aiofiles \
  --include-package=httpx \
  --include-package=cryptography \
  --include-package=apscheduler \
  --include-package=email_validator \
  --include-package=bs4 \
  --include-package=markdown \
  --include-package=pypdf \
  --include-package=docx \
  --include-package=lxml \
  --include-package=psutil \
  --enable-plugin=anti-bloat \
  --assume-yes-for-downloads \
  src/main.py

if [ ! -f "dist/backend" ]; then
  echo "[ERROR] Backend build output not found (dist/backend)"
  exit 1
fi

echo "[INFO] Moving backend binary to dist/backend/backend..."
mkdir -p dist/backend_dir
mv dist/backend dist/backend_dir/backend
chmod +x dist/backend_dir/backend
mv dist/backend_dir dist/backend

echo ""
echo "========================================"
echo "Backend build with Nuitka completed (Linux)."
echo "Executable: dist/backend/backend"
echo "========================================"
echo ""
