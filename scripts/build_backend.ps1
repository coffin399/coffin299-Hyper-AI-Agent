# Nuitka Build Script for Backend
# This script compiles the Python backend into a standalone executable using Nuitka

param(
    [string]$OutputDir = "dist/backend",
    [string]$PythonVersion = "3.11"
)

Write-Host "Building Hyper AI Agent Backend with Nuitka..." -ForegroundColor Green

# Check if Nuitka is installed
try {
    python -m nuitka --version | Out-Null
} catch {
    Write-Host "Nuitka not found. Installing..." -ForegroundColor Yellow
    pip install nuitka==2.4.9
}

# Create output directory
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

# Build with Nuitka
Write-Host "Compiling backend..." -ForegroundColor Cyan

python -m nuitka `
    --standalone `
    --onefile `
    --output-dir=$OutputDir `
    --output-filename=backend.exe `
    --include-package=src `
    --include-package=fastapi `
    --include-package=uvicorn `
    --include-package=pydantic `
    --include-package=sqlalchemy `
    --include-package=langchain `
    --include-package=langchain_core `
    --include-package=langchain_community `
    --include-package=langchain_openai `
    --include-package=langchain_anthropic `
    --include-package=langchain_google_genai `
    --include-package=langchain_ollama `
    --enable-plugin=anti-bloat `
    --assume-yes-for-downloads `
    --show-progress `
    --show-memory `
    src/main.py

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBuild successful! Backend executable created at: $OutputDir/backend.exe" -ForegroundColor Green
    Write-Host "You can now bundle this with your Electron app." -ForegroundColor Green
} else {
    Write-Host "`nBuild failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}
