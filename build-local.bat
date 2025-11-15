@echo off
chcp 65001 >nul
REM ============================================================================
REM Local Build Script for Hyper AI Agent
REM This script builds both frontend and backend, then packages with Electron
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ========================================
echo Hyper AI Agent - Local Build Script
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.11 or higher
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 20 or higher
    pause
    exit /b 1
)

echo [INFO] Python version:
python --version
echo [INFO] Node.js version:
node --version
echo.

REM ============================================================================
REM Step 1: Setup Python Virtual Environment
REM ============================================================================
echo [STEP 1/6] Setting up Python virtual environment...
echo.

if exist venv (
    echo [INFO] Virtual environment already exists
) else (
    echo [INFO] Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
)

echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

echo [INFO] Upgrading pip...
python -m pip install --upgrade pip --quiet

echo [INFO] Installing Python dependencies...
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo [ERROR] Failed to install Python dependencies
    pause
    exit /b 1
)

echo [SUCCESS] Python environment ready
echo.

REM ============================================================================
REM Step 2: Build Backend with PyInstaller
REM ============================================================================
echo [STEP 2/6] Building backend with PyInstaller...
echo.

if exist build (
    echo [INFO] Cleaning previous build directory...
    rmdir /s /q build
)

if exist dist\backend (
    echo [INFO] Cleaning previous dist\backend directory...
    rmdir /s /q dist\backend
)

echo [INFO] Running Nuitka (this may take 10-30 minutes)...
echo [INFO] Note: First build will be slow as Nuitka downloads dependencies
python -m nuitka --standalone --onefile --output-dir=dist --output-filename=backend.exe --include-package=fastapi --include-package=uvicorn --include-package=pydantic --include-package=sqlalchemy --include-package=langchain --include-package=langchain_core --include-package=langchain_community --include-package=langchain_openai --include-package=langchain_anthropic --include-package=langchain_google_genai --include-package=langchain_ollama --include-package=openai --include-package=anthropic --include-package=google.generativeai --include-package=aiofiles --include-package=httpx --include-package=cryptography --include-package=apscheduler --include-package=email_validator --include-package=bs4 --include-package=markdown --include-package=pypdf --include-package=docx --include-package=lxml --include-package=psutil --enable-plugin=anti-bloat --assume-yes-for-downloads --disable-console --windows-console-mode=attach src/main.py
if errorlevel 1 (
    echo [ERROR] Backend build failed
    pause
    exit /b 1
)

REM Move backend.exe to dist/backend directory
if exist dist\backend.exe (
    mkdir dist\backend 2>nul
    move /y dist\backend.exe dist\backend\backend.exe >nul
    echo [SUCCESS] Backend built successfully
    echo.
) else (
    echo [ERROR] Backend build output not found
    pause
    exit /b 1
)

REM Clean up build artifacts to save disk space
if exist build (
    echo [INFO] Cleaning up build artifacts...
    rmdir /s /q build
)

REM ============================================================================
REM Step 3: Install Node.js Dependencies
REM ============================================================================
echo [STEP 3/6] Installing Node.js dependencies...
echo.

if exist node_modules (
    echo [INFO] node_modules already exists, skipping install
) else (
    echo [INFO] Installing Node.js packages...
    call npm install --silent
    if errorlevel 1 (
        echo [ERROR] Failed to install Node.js dependencies
        pause
        exit /b 1
    )
)

echo [SUCCESS] Node.js dependencies ready
echo.

REM ============================================================================
REM Step 4: Build Frontend
REM ============================================================================
echo [STEP 4/6] Building frontend...
echo.

echo [INFO] Building React frontend...
call npm run build:frontend
if errorlevel 1 (
    echo [ERROR] Frontend build failed
    pause
    exit /b 1
)

echo [SUCCESS] Frontend built successfully
echo.

REM ============================================================================
REM Step 5: Build Electron App
REM ============================================================================
echo [STEP 5/6] Building Electron application...
echo.

echo [INFO] Packaging with electron-builder...
call npm run build -- --win --publish=never
if errorlevel 1 (
    echo [ERROR] Electron build failed
    pause
    exit /b 1
)

echo [SUCCESS] Electron app built successfully
echo.

REM ============================================================================
REM Step 6: Copy Output to 'output' Folder
REM ============================================================================
echo [STEP 6/6] Copying build artifacts to output folder...
echo.

if not exist output (
    echo [INFO] Creating output directory...
    mkdir output
)

echo [INFO] Copying executable files...

REM Copy Windows installer
if exist "release\Hyper AI Agent Setup*.exe" (
    copy /y "release\Hyper AI Agent Setup*.exe" output\ >nul
    echo [SUCCESS] Copied installer to output\
)

REM Copy portable exe if exists
if exist "release\Hyper AI Agent-*.exe" (
    copy /y "release\Hyper AI Agent-*.exe" output\ >nul
    echo [SUCCESS] Copied portable exe to output\
)

REM Copy unpacked app if exists
if exist release\win-unpacked (
    echo [INFO] Copying unpacked application...
    if exist output\win-unpacked (
        rmdir /s /q output\win-unpacked
    )
    xcopy /e /i /y release\win-unpacked output\win-unpacked >nul
    echo [SUCCESS] Copied unpacked app to output\win-unpacked\
)

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Output files are in the 'output' folder:
dir /b output
echo.
echo You can run the installer or portable exe from the output folder.
echo.

pause
