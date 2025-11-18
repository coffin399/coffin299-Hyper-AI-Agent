# Nuitka Build Script for Backend
# This script compiles the Python backend into a standalone executable using Nuitka

param(
    [string]$OutputDir = "dist/backend",
    [string]$PythonVersion = "3.11"
)

Write-Host "Building Hyper AI Agent Backend with Briefcase..." -ForegroundColor Green

# Clean previous output
if (Test-Path $OutputDir) {
    Remove-Item -Recurse -Force $OutputDir
}

Write-Host "Running Briefcase create (windows)..." -ForegroundColor Cyan
briefcase create windows
if ($LASTEXITCODE -ne 0) {
    Write-Host "Briefcase create failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Running Briefcase build (windows)..." -ForegroundColor Cyan
briefcase build windows -u
if ($LASTEXITCODE -ne 0) {
    Write-Host "Briefcase build failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

$appPath = "build\hyper-ai-agent-backend\windows\app\src\hyper-ai-agent-backend.exe"
if (-not (Test-Path $appPath)) {
    Write-Host "Backend executable not found: $appPath" -ForegroundColor Red
    exit 1
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
Copy-Item -Path $appPath -Destination (Join-Path $OutputDir "backend.exe") -Force

Write-Host "`nBuild successful! Backend executable created at: $OutputDir\backend.exe" -ForegroundColor Green
Write-Host "Executable size: $((Get-Item "$OutputDir\backend.exe").Length / 1MB) MB" -ForegroundColor Cyan
Write-Host "You can now bundle this with your Electron app." -ForegroundColor Green
