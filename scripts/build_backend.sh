#!/bin/bash
# Nuitka Build Script for Backend (Linux/macOS)
# This script compiles the Python backend into a standalone executable using Nuitka

set -e

OUTPUT_DIR="${1:-dist/backend}"
PYTHON_VERSION="${2:-3.11}"

echo "Building Hyper AI Agent Backend with Nuitka..."

# Check if Nuitka is installed
if ! python3 -c "import nuitka" 2>/dev/null; then
    echo "Nuitka not found. Installing..."
    pip3 install nuitka==2.4.9 ordered-set==4.1.0
fi

# Clean previous build
if [ -d "build" ]; then
    rm -rf build
fi
if [ -d "$OUTPUT_DIR" ]; then
    rm -rf "$OUTPUT_DIR"
fi

# Build with Nuitka
echo "Compiling backend (this may take 10-30 minutes)..."
echo "Note: First build will be slow as Nuitka downloads dependencies"

python3 -m nuitka \
    --standalone \
    --onefile \
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

if [ $? -eq 0 ]; then
    # Nuitka creates backend in dist/
    if [ -f "dist/backend" ]; then
        # Create output directory structure
        mkdir -p "$OUTPUT_DIR"
        mv "dist/backend" "$OUTPUT_DIR/backend"
        chmod +x "$OUTPUT_DIR/backend"
        
        echo ""
        echo "Build successful! Backend executable created at: $OUTPUT_DIR/backend"
        echo "Executable size: $(du -h "$OUTPUT_DIR/backend" | cut -f1)"
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
