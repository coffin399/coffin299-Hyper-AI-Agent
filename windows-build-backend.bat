@echo off
chcp 65001 >nul

REM ============================================================================
REM Backend Build Script (Nuitka, Windows)
REM Builds the Python backend with Nuitka and uses a local Nuitka cache.
REM ============================================================================

setlocal enabledelayedexpansion

REM Prefer Python 3.11 via py launcher if available, otherwise fall back to 'python'
set "PY_CMD=python"
py -3.11 --version >nul 2>&1
if not errorlevel 1 (
    set "PY_CMD=py -3.11"
)

echo.
echo ========================================
echo Hyper AI Agent - Backend Nuitka Build (Windows)
echo ========================================
echo.

REM -----------------------------------------------------------------------------
REM Step 0: Check Python (prefer 3.11 if available)
REM -----------------------------------------------------------------------------
%PY_CMD% --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.11 or higher.
    echo.
    pause
    exit /b 1
)
echo [INFO] Using Python command: %PY_CMD%
echo [INFO] Python version:
%PY_CMD% --version
echo.

REM -----------------------------------------------------------------------------
REM Step 1: Setup Python virtual environment (project-local)
REM -----------------------------------------------------------------------------
if exist venv (
    echo [INFO] Using existing virtual environment 'venv'.
) else (
    echo [INFO] Creating virtual environment 'venv'...
    %PY_CMD% -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment.
        echo.
        pause
        exit /b 1
    )
)

echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

echo [INFO] Upgrading pip...
python -m pip install --upgrade pip --quiet

echo [INFO] Installing Python dependencies from requirements.txt...
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo [ERROR] Failed to install Python dependencies.
    echo.
    pause
    exit /b 1
)

echo [SUCCESS] Python environment ready.
echo.

REM -----------------------------------------------------------------------------
REM Step 2: Configure Nuitka compilation cache directory
REM -----------------------------------------------------------------------------
set "NUITKA_CACHE_DIR=%CD%\.nuitka-cache"
echo [INFO] Using Nuitka cache directory: %NUITKA_CACHE_DIR%

if not exist "%NUITKA_CACHE_DIR%" (
    echo [INFO] Creating Nuitka cache directory...
    mkdir "%NUITKA_CACHE_DIR%"
)

REM -----------------------------------------------------------------------------
REM Step 3: Clean previous backend build outputs (but keep the cache)
REM -----------------------------------------------------------------------------
if exist build (
    echo [INFO] Cleaning previous 'build' directory...
    rmdir /s /q build
)

if exist dist\backend (
    echo [INFO] Cleaning previous 'dist\backend' directory...
    rmdir /s /q dist\backend
)

REM -----------------------------------------------------------------------------
REM Step 4: Build backend with Nuitka (uses the cache directory)
REM -----------------------------------------------------------------------------
echo [INFO] Running Nuitka (this may take 10-30 minutes)...
echo [INFO] Note: first build will be slow while Nuitka populates the cache.

python -m nuitka --standalone --onefile --output-dir=dist --output-filename=backend.exe --include-package=fastapi --include-package=uvicorn --include-package=pydantic --include-package=sqlalchemy --include-package=langchain --include-package=langchain_core --include-package=langchain_community --include-package=langchain_openai --include-package=langchain_anthropic --include-package=langchain_google_genai --include-package=langchain_ollama --include-package=openai --include-package=anthropic --include-package=google.generativeai --include-package=aiofiles --include-package=httpx --include-package=cryptography --include-package=apscheduler --include-package=email_validator --include-package=bs4 --include-package=markdown --include-package=pypdf --include-package=docx --include-package=lxml --include-package=psutil --enable-plugin=anti-bloat --assume-yes-for-downloads --disable-console --windows-console-mode=attach src/main.py
if errorlevel 1 (
    echo [ERROR] Backend build failed.
    echo.
    pause
    exit /b 1
)

REM -----------------------------------------------------------------------------
REM Step 5: Move backend.exe into a stable output directory
REM -----------------------------------------------------------------------------
if exist dist\backend.exe (
    mkdir dist\backend 2>nul
    move /y dist\backend.exe dist\backend\backend.exe >nul
    echo [SUCCESS] Backend executable created at: dist\backend\backend.exe
    echo [SUCCESS] Nuitka cache directory: %NUITKA_CACHE_DIR%
) else (
    echo [ERROR] Backend build output not found (dist\backend.exe).
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Backend build with Nuitka completed (Windows).
echo Executable: dist\backend\backend.exe
echo Nuitka cache: %NUITKA_CACHE_DIR%
echo ========================================
echo.

endlocal
pause
