# Local Build Guide

This guide explains how to build Hyper AI Agent on your local machine.

## Prerequisites

- **Python 3.11 or higher**
- **Node.js 20 or higher**
- **Git**
- **C Compiler** (MSVC on Windows, GCC on Linux, Clang on macOS)

## Quick Start

### Windows

1. Open Command Prompt or PowerShell
2. Navigate to the project directory
3. Run the build script:

```cmd
build-local.bat
```

The script will:
- Create a Python virtual environment
- Install Python dependencies
- Build the backend with PyInstaller
- Install Node.js dependencies
- Build the React frontend
- Package the Electron app
- Copy output files to the `output` folder

### Linux / macOS

1. Open Terminal
2. Navigate to the project directory
3. Make the script executable (first time only):

```bash
chmod +x build-local.sh
```

4. Run the build script:

```bash
./build-local.sh
```

## Build Output

After a successful build, you will find the following in the `output` folder:

### Windows
- `Hyper AI Agent Setup-x.x.x.exe` - Installer
- `Hyper AI Agent-x.x.x.exe` - Portable executable (if configured)
- `win-unpacked/` - Unpacked application directory

### Linux
- `Hyper AI Agent-x.x.x.AppImage` - Portable executable
- `hyper-ai-agent_x.x.x_amd64.deb` - Debian package
- `hyper-ai-agent-x.x.x.x86_64.rpm` - RPM package
- `linux-unpacked/` - Unpacked application directory

### macOS
- `Hyper AI Agent-x.x.x.dmg` - Disk image installer
- `Hyper AI Agent.app` - Application bundle
- `mac/` - Unpacked application directory

## Build Steps Explained

### Step 1: Python Virtual Environment
Creates an isolated Python environment and installs all required dependencies from `requirements.txt`.

### Step 2: Backend Build
Uses Nuitka to compile the Python backend into a standalone executable in `dist/backend/`.

**Note**: First build may take 10-30 minutes as Nuitka downloads dependencies and compiles to C. Subsequent builds are faster (5-15 minutes).

### Step 3: Node.js Dependencies
Installs all Node.js packages required for the frontend and Electron.

### Step 4: Frontend Build
Builds the React frontend using Create React App. Output goes to `frontend/build/`.

### Step 5: Electron Packaging
Uses electron-builder to package the frontend, backend, and Electron runtime into platform-specific installers.

### Step 6: Copy to Output
Copies all build artifacts to the `output` folder for easy access.

## Troubleshooting

### "Python is not installed or not in PATH"
Install Python 3.11 or higher from [python.org](https://www.python.org/) and ensure it's added to your PATH.

### "Node.js is not installed or not in PATH"
Install Node.js 20 or higher from [nodejs.org](https://nodejs.org/) and ensure it's added to your PATH.

### "Failed to install Python dependencies"
Try manually installing dependencies:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/macOS
pip install -r requirements.txt
```

### "Backend build failed"
Ensure you have a C compiler installed (required for Nuitka):
- **Windows**: Install Visual Studio Build Tools or MSVC
- **Linux**: `sudo apt-get install gcc` or `sudo yum install gcc`
- **macOS**: Install Xcode Command Line Tools: `xcode-select --install`

### Build is very slow
Nuitka compiles Python to C, which takes time:
- **First build**: 10-30 minutes (downloads dependencies)
- **Subsequent builds**: 5-15 minutes (uses cache)
This is normal and results in better performance.

### "Electron build failed"
Check that you have enough disk space (at least 5GB free) and try running:
```bash
npm cache clean --force
npm install
```

### Build is very slow
The first build will be slow as it downloads and compiles all dependencies. Subsequent builds will be faster as dependencies are cached.

## Manual Build (Advanced)

If you prefer to run each step manually:

```bash
# 1. Setup Python environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/macOS
pip install -r requirements.txt

# 2. Build backend with Nuitka
python -m nuitka --standalone --onefile --output-dir=dist --output-filename=backend.exe --include-package=fastapi --include-package=uvicorn --enable-plugin=anti-bloat --assume-yes-for-downloads src/main.py

# 3. Install Node.js dependencies
npm install

# 4. Build frontend
npm run build:frontend

# 5. Build Electron app
npm run build -- --win  # Windows
npm run build -- --linux  # Linux
npm run build -- --mac  # macOS
```

## Clean Build

To perform a completely clean build, delete these directories first:
- `venv/` - Python virtual environment
- `node_modules/` - Node.js dependencies
- `build/` - PyInstaller build cache
- `dist/` - Build output
- `release/` - Electron build output
- `output/` - Final output folder
- `frontend/build/` - Frontend build output

Then run the build script again.

## Build Configuration

### Backend Configuration
Edit `scripts/build_backend.ps1` or `scripts/build_backend.sh` to customize Nuitka settings:
- Add/remove `--include-package` flags
- Change executable name with `--output-filename`
- Add optimization flags like `--lto=yes`

### Frontend Configuration
Edit `frontend/package.json` and `frontend/public/` to customize the React app.

### Electron Configuration
Edit `package.json` under the `"build"` section to customize electron-builder settings:
- Application ID
- Icons
- File associations
- Auto-update settings

## CI/CD Integration

The build scripts mirror the GitHub Actions workflow in `.github/workflows/release.yml`. You can use them as a reference for setting up your own CI/CD pipeline.

## Support

If you encounter any issues not covered in this guide, please:
1. Check the main README.md
2. Review the GitHub Actions logs for reference
3. Open an issue on GitHub with your build logs
