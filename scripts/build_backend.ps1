# cx_Freeze Build Script for Backend
# This script compiles the Python backend into a standalone executable using cx_Freeze

param(
    [string]$OutputDir = "dist/backend",
    [string]$PythonVersion = "3.11"
)

Write-Host "Building Hyper AI Agent Backend with cx_Freeze..." -ForegroundColor Green

# Check if cx_Freeze is installed
try {
    python -c "import cx_Freeze" 2>$null
    if ($LASTEXITCODE -ne 0) { throw }
} catch {
    Write-Host "cx_Freeze not found. Installing..." -ForegroundColor Yellow
    pip install cx-Freeze==7.2.5
}

# Clean previous build
if (Test-Path "build") {
    Remove-Item -Recurse -Force "build"
}

# Build with cx_Freeze
Write-Host "Compiling backend..." -ForegroundColor Cyan

python setup.py build_exe

if ($LASTEXITCODE -eq 0) {
    # Move build output to desired location
    if (Test-Path $OutputDir) {
        Remove-Item -Recurse -Force $OutputDir
    }
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
    
    $exeDir = Get-ChildItem -Path "build" -Filter "exe.*" -Directory | Select-Object -First 1
    if ($exeDir) {
        Copy-Item -Path "$($exeDir.FullName)\*" -Destination $OutputDir -Recurse -Force
        Write-Host "`nBuild successful! Backend executable created in: $OutputDir" -ForegroundColor Green
        Write-Host "You can now bundle this with your Electron app." -ForegroundColor Green
    } else {
        Write-Host "`nBuild failed: No exe.* directory found in build/" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "`nBuild failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}
