@echo off
echo [INFO] Setting up Native Local LLM Environment...

echo [INFO] Checking for CMake...
cmake --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] CMake is not found. Please install CMake to build llama-cpp-python.
    echo [INFO] You can download it from https://cmake.org/download/
    pause
    exit /b 1
)

echo [INFO] Installing dependencies...
echo [INFO] Installing huggingface-hub...
.\venv_native\Scripts\pip install huggingface-hub
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install huggingface-hub.
    pause
    exit /b 1
)

echo [INFO] Installing llama-cpp-python...
echo [NOTE] This may take a while as it compiles the C++ extensions.
echo [NOTE] If you have a GPU, make sure CUDA is installed and set CMAKE_ARGS="-DGGML_CUDA=on" before running this.
echo [NOTE] Current CMAKE_ARGS: %CMAKE_ARGS%

.\venv_native\Scripts\pip install llama-cpp-python --no-cache-dir --force-reinstall --verbose
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install llama-cpp-python.
    echo [TIP] You might need Visual Studio Build Tools installed with "Desktop development with C++".
    echo [TIP] See: https://github.com/abetlen/llama-cpp-python#installation
    pause
    exit /b 1
)

echo [SUCCESS] Environment setup complete!
pause
