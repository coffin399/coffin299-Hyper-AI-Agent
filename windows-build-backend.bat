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
REM Step 3: Clean previous backend build outputs
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
REM Step 4: Build backend (Briefcase)
REM -----------------------------------------------------------------------------
echo [INFO] Building backend with Briefcase (Windows)...

briefcase create windows
if errorlevel 1 (
    echo [ERROR] Briefcase create failed.
    echo.
    pause
    exit /b 1
)

briefcase build windows -u
if errorlevel 1 (
    echo [ERROR] Briefcase build failed.
    echo.
    pause
    exit /b 1
)

REM -----------------------------------------------------------------------------
REM Step 5: Move backend.exe into a stable output directory
REM -----------------------------------------------------------------------------
set "APP_PATH=windows\Hyper AI Agent Backend\app\Hyper AI Agent Backend.exe"
if exist "%APP_PATH%" (
    mkdir dist\backend 2>nul
    copy /y "%APP_PATH%" dist\backend\backend.exe >nul
    echo [SUCCESS] Backend executable created at: dist\backend\backend.exe
) else (
    echo [ERROR] Backend build output not found: %APP_PATH%.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Backend build completed (Windows).
echo Executable: dist\backend\backend.exe
echo ========================================
echo.

endlocal
pause
