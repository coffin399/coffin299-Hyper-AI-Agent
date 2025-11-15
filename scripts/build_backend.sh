#!/bin/bash
# cx_Freeze Build Script for Backend (Linux/macOS)
# This script compiles the Python backend into a standalone executable using cx_Freeze

set -e

OUTPUT_DIR="${1:-dist/backend}"
PYTHON_VERSION="${2:-3.11}"

echo "Building Hyper AI Agent Backend with cx_Freeze..."

# Check if cx_Freeze is installed
if ! python -c "import cx_Freeze" 2>/dev/null; then
    echo "cx_Freeze not found. Installing..."
    pip install cx-Freeze==7.2.5
fi

# Clean previous build
if [ -d "build" ]; then
    rm -rf build
fi

# Build with cx_Freeze
echo "Compiling backend..."
python setup.py build_exe

if [ $? -eq 0 ]; then
    # Move build output to desired location
    if [ -d "$OUTPUT_DIR" ]; then
        rm -rf "$OUTPUT_DIR"
    fi
    mkdir -p "$OUTPUT_DIR"
    
    if [ -d build/exe.* ]; then
        cp -r build/exe.*/* "$OUTPUT_DIR/"
        echo ""
        echo "Build successful! Backend executable created in: $OUTPUT_DIR"
        echo "You can now bundle this with your Electron app."
    else
        echo ""
        echo "Build failed: No exe.* directory found in build/"
        exit 1
    fi
else
    echo ""
    echo "Build failed with exit code $?"
    exit 1
fi
