# PyInstaller Build Script for Backend
# This script compiles the Python backend into a standalone executable using PyInstaller
# Includes anti-virus false positive mitigation

param(
    [string]$OutputDir = "dist/backend",
    [string]$PythonVersion = "3.11"
)

Write-Host "Building Hyper AI Agent Backend with PyInstaller..." -ForegroundColor Green

# Check if PyInstaller is installed
try {
    python -c "import PyInstaller" 2>$null
    if ($LASTEXITCODE -ne 0) { throw }
} catch {
    Write-Host "PyInstaller not found. Installing..." -ForegroundColor Yellow
    pip install pyinstaller==6.11.1
}

# Clean previous build
if (Test-Path "build") {
    Remove-Item -Recurse -Force "build"
}
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}

# Build with PyInstaller
Write-Host "Compiling backend (this may take a few minutes)..." -ForegroundColor Cyan

pyinstaller backend.spec --clean --noconfirm

if ($LASTEXITCODE -eq 0) {
    # PyInstaller creates backend directory in dist/ (onedir mode)
    if (Test-Path "dist\backend" -PathType Container) {
        # If OUTPUT_DIR is default (dist/backend), it's already in the right place
        if ($OutputDir -ne "dist\backend") {
            # For custom output dirs, copy the entire directory
            if (Test-Path $OutputDir) {
                Remove-Item -Recurse -Force $OutputDir
            }
            Copy-Item -Path "dist\backend" -Destination $OutputDir -Recurse -Force
        }
        
        Write-Host "`nBuild successful! Backend bundle created at: $OutputDir\" -ForegroundColor Green
        Write-Host "Note: UPX compression is disabled to avoid antivirus false positives." -ForegroundColor Yellow
        Write-Host "You can now bundle this with your Electron app." -ForegroundColor Green
    } else {
        Write-Host "`nBuild failed: No backend directory found in dist/" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "`nBuild failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}
