# Native Local LLM Setup Troubleshooting

## 🔴 Critical Issue: Python 3.14 Compatibility

You are currently using **Python 3.14.0**.
The library `llama-cpp-python`, which is required for running local LLMs without Ollama, **does not yet have pre-built wheels for Python 3.14**.

### Solutions

You have two options to fix this:

#### Option A: Install Visual Studio Build Tools (Recommended for Python 3.14)
To compile the library from source for Python 3.14, you need a C++ compiler.
1.  Download **Visual Studio Build Tools** from [Microsoft](https://visualstudio.microsoft.com/visual-cpp-build-tools/).
2.  Run the installer and select **"Desktop development with C++"**.
3.  Ensure **MSVC v143** (or later) and **Windows 10/11 SDK** are selected.
4.  After installation, run `setup_native.bat` again.

#### Option B: Use Python 3.10, 3.11, or 3.12
Downgrade your Python version or create a new virtual environment with an older version. Pre-built wheels are available for these versions, so no compiler is needed.

```powershell
# Example: Create a new venv with Python 3.12 (if installed)
py -3.12 -m venv venv_compatible
.\venv_compatible\Scripts\activate
pip install -r requirements.txt
.\setup_native.bat
```

## 🟡 GPU Acceleration
If you have an NVIDIA GPU, you also need **CUDA Toolkit** installed to use GPU acceleration.
If you don't have CUDA, the model will run on **CPU only** (slow).

To enable GPU build (after installing Build Tools and CUDA):
```powershell
set CMAKE_ARGS="-DGGML_CUDA=on"
pip install llama-cpp-python --force-reinstall --no-cache-dir
```
