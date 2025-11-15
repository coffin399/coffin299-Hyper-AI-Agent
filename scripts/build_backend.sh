#!/bin/bash
# PyInstaller Build Script for Backend (Linux/macOS)
# This script compiles the Python backend into a standalone executable using PyInstaller
# Includes anti-virus false positive mitigation

set -e

OUTPUT_DIR="${1:-dist/backend}"
PYTHON_VERSION="${2:-3.11}"

echo "Building Hyper AI Agent Backend with PyInstaller..."

# Check if PyInstaller is installed
if ! python -c "import PyInstaller" 2>/dev/null; then
    echo "PyInstaller not found. Installing..."
    pip install pyinstaller==6.11.1
fi

# Clean previous build
if [ -d "build" ]; then
    rm -rf build
fi
if [ -d "dist" ]; then
    rm -rf dist
fi

# Build with PyInstaller
echo "Compiling backend (this may take a few minutes)..."
pyinstaller backend.spec --clean --noconfirm

if [ $? -eq 0 ]; then
    # Move build output to desired location
    if [ -d "$OUTPUT_DIR" ]; then
        rm -rf "$OUTPUT_DIR"
    fi
    mkdir -p "$OUTPUT_DIR"
    
    # PyInstaller creates backend in dist/
    if [ -f "dist/backend" ]; then
        cp "dist/backend" "$OUTPUT_DIR/backend"
        echo ""
        echo "Build successful! Backend executable created at: $OUTPUT_DIR/backend"
        echo "Note: UPX compression is disabled to avoid antivirus false positives."
        echo "You can now bundle this with your Electron app."
    else
        echo ""
        echo "Build failed: No backend executable found in dist/"
        exit 1
    fi
else
    echo ""
    echo "Build failed with exit code $?"
    exit 1
fi
