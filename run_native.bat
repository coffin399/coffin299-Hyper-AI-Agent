@echo off
echo [INFO] Starting Hyper AI Agent in NATIVE LOCAL mode...

set LOCAL_EXECUTION_MODE=native
set NATIVE_GPU_LAYERS=-1
set NATIVE_MAIN_GPU=0

:: Check if model path is set, otherwise it will use the default or download one
:: set NATIVE_MODEL_PATH=models/my-model.gguf

echo [INFO] Environment variables set.
echo [INFO] LOCAL_EXECUTION_MODE=%LOCAL_EXECUTION_MODE%

.\venv_native\Scripts\uvicorn src.main:app --host 0.0.0.0 --port 18000 --reload
pause
