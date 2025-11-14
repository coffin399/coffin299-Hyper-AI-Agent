# Backend Build Guide

This guide explains how to build the Python backend into a standalone executable using Nuitka.

## Prerequisites

- Python 3.11 or higher
- All dependencies from `requirements.txt` installed
- Nuitka (will be installed automatically by the build script)
- C compiler (MSVC on Windows, GCC on Linux, Clang on macOS)

## Building the Backend

### Windows

```powershell
# Run the build script
.\scripts\build_backend.ps1

# The executable will be created at: dist/backend/backend.exe
```

### Linux/macOS

```bash
# Make the script executable
chmod +x scripts/build_backend.sh

# Run the build script
./scripts/build_backend.sh

# The executable will be created at: dist/backend/backend
```

## Build Options

The build script accepts the following parameters:

- `OutputDir`: Directory for build output (default: `dist/backend`)
- `PythonVersion`: Python version to use (default: `3.11`)

Example:
```powershell
.\scripts\build_backend.ps1 -OutputDir "custom/path" -PythonVersion "3.12"
```

## Testing the Backend

After building, you can test the backend executable:

```bash
# Start the backend on default port (18000)
./dist/backend/backend.exe

# Start on custom port
./dist/backend/backend.exe --port 8080

# Start on custom host and port
./dist/backend/backend.exe --host 0.0.0.0 --port 8080
```

The backend API documentation will be available at `http://localhost:18000/docs`

## Integration with Electron

The Electron app automatically:
1. Loads user settings from `userData/settings.json`
2. Starts the backend executable if mode is "local"
3. Performs health checks to ensure backend is ready
4. Passes the API base URL to the frontend
5. Stops the backend when the app closes

## Backend Modes

### Local Mode (On-Premise)
- Backend runs as a bundled executable on the user's computer
- All data stays local
- No internet required for core functionality
- Best for privacy and offline use

### Network Mode (Remote)
- Backend runs on a remote server
- Requires network connection
- Can be shared by multiple users
- Best for team collaboration

Users can switch between modes in the Settings screen.

## Troubleshooting

### Build fails with "Nuitka not found"
Install Nuitka manually:
```bash
pip install nuitka==2.4.9
```

### Build fails with "C compiler not found"
Install a C compiler:
- **Windows**: Install Visual Studio Build Tools or MSVC
- **Linux**: `sudo apt-get install gcc` or `sudo yum install gcc`
- **macOS**: Install Xcode Command Line Tools: `xcode-select --install`

### Backend fails to start
1. Check if port 18000 is already in use
2. Check backend logs in Electron console
3. Try running backend manually to see error messages
4. Ensure all dependencies are included in the build

### "Backend executable not found" error
Make sure to build the backend before building the Electron app:
```bash
# Build backend first
.\scripts\build_backend.ps1

# Then build Electron app
npm run build
```

## CI/CD Integration

To integrate backend building into your CI/CD pipeline:

1. Install Python and dependencies
2. Run the build script
3. Copy `dist/backend/backend.exe` to Electron's resources
4. Build Electron app with electron-builder

Example GitHub Actions workflow:
```yaml
- name: Build Backend
  run: |
    pip install -r requirements.txt
    python -m nuitka --standalone --onefile src/main.py
    
- name: Build Electron
  run: |
    npm run build:frontend
    npm run build
```

## File Size Optimization

The bundled backend executable is large (~200-300MB) because it includes:
- Python runtime
- All dependencies (FastAPI, LangChain, etc.)
- Native libraries

To reduce size:
1. Use `--enable-plugin=anti-bloat` (already enabled)
2. Exclude unused packages
3. Use compression (handled by electron-builder)

## Security Considerations

- The bundled executable includes all source code (compiled)
- Environment variables should be set at runtime, not baked in
- API keys should be stored in user's config, not in the executable
- Use HTTPS for network mode connections
