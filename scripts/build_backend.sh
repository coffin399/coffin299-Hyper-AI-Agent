#!/bin/bash
# Nuitka Build Script for Backend (Linux/macOS)
# This script compiles the Python backend into a standalone executable using Nuitka

set -e

OUTPUT_DIR="${1:-dist/backend}"
PYTHON_VERSION="${2:-3.11}"

echo "Building Hyper AI Agent Backend with Briefcase..."

# Clean previous output
if [ -d "$OUTPUT_DIR" ]; then
    rm -rf "$OUTPUT_DIR"
fi

PLATFORM="$(uname)"
echo "Detected platform: $PLATFORM"

if [ "$PLATFORM" = "Darwin" ]; then
    briefcase create macOS
    briefcase build macOS -u

    APP="macOS/Hyper AI Agent Backend.app/Contents/MacOS/Hyper AI Agent Backend"
    if [ ! -f "$APP" ]; then
        echo "Backend binary not found: $APP"
        exit 1
    fi

    mkdir -p "$OUTPUT_DIR"
    cp "$APP" "$OUTPUT_DIR/backend"
    chmod +x "$OUTPUT_DIR/backend"
elif [ "$PLATFORM" = "Linux" ]; then
    briefcase create linux
    briefcase build linux -u

    BIN="$(find build/hyper-ai-agent-backend -type f -name hyper-ai-agent-backend -path '*usr/bin/*' -print -quit)"
    if [ -z "$BIN" ] || [ ! -f "$BIN" ]; then
        echo "Backend binary not found in Briefcase build output"
        exit 1
    fi

    mkdir -p "$OUTPUT_DIR"
    cp "$BIN" "$OUTPUT_DIR/backend"
    chmod +x "$OUTPUT_DIR/backend"
else
    echo "Unsupported platform: $PLATFORM"
    exit 1
fi

echo ""
echo "Build successful! Backend executable created at: $OUTPUT_DIR/backend"
echo "Executable size: $(du -h "$OUTPUT_DIR/backend" | cut -f1)"
echo "You can now bundle this with your Electron app."
