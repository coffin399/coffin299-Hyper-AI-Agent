# Nuitka Build Script for Backend
# This script compiles the Python backend into a standalone executable using Nuitka

param(
    [string]$OutputDir = "dist/backend",
    [string]$PythonVersion = "3.11"
)

Write-Host "Building Hyper AI Agent Backend with Nuitka..." -ForegroundColor Green

# Check if Nuitka is installed
try {
    python -c "import nuitka" 2>$null
    if ($LASTEXITCODE -ne 0) { throw }
} catch {
    Write-Host "Nuitka not found. Installing..." -ForegroundColor Yellow
    pip install nuitka==2.4.9 ordered-set==4.1.0
}

# Clean previous build
if (Test-Path "build") {
    Remove-Item -Recurse -Force "build"
}
if (Test-Path $OutputDir) {
    Remove-Item -Recurse -Force $OutputDir
}

# Build with Nuitka
Write-Host "Compiling backend (this may take 10-30 minutes)..." -ForegroundColor Cyan
Write-Host "Note: First build will be slow as Nuitka downloads dependencies" -ForegroundColor Yellow

python -m nuitka `
    --standalone `
    --onefile `
    --output-dir=dist `
    --output-filename=backend.exe `
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
    --include-package=openai `
    --include-package=anthropic `
    --include-package=google.generativeai `
    --include-package=aiofiles `
    --include-package=httpx `
    --include-package=cryptography `
    --include-package=apscheduler `
    --include-package=email_validator `
    --include-package=bs4 `
    --include-package=markdown `
    --include-package=pypdf `
    --include-package=docx `
    --include-package=lxml `
    --include-package=psutil `
    --enable-plugin=anti-bloat `
    --assume-yes-for-downloads `
    --disable-console `
    --windows-console-mode=attach `
    src/main.py

if ($LASTEXITCODE -eq 0) {
    # Nuitka creates backend.exe in dist/
    if (Test-Path "dist\backend.exe") {
        # Create output directory structure
        New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
        Move-Item -Path "dist\backend.exe" -Destination "$OutputDir\backend.exe" -Force
        
        Write-Host "`nBuild successful! Backend executable created at: $OutputDir\backend.exe" -ForegroundColor Green
        Write-Host "Executable size: $((Get-Item "$OutputDir\backend.exe").Length / 1MB) MB" -ForegroundColor Cyan
        Write-Host "You can now bundle this with your Electron app." -ForegroundColor Green
    } else {
        Write-Host "`nBuild failed: No backend.exe found in dist/" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "`nBuild failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}
