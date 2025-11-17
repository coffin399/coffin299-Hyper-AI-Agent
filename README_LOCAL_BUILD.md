# Local Build Guide

This guide explains how to build Hyper AI Agent on your local machine.

## Prerequisites

- **Python 3.11 or higher**
- **Node.js 20 or higher**
- **Git**
- **(Optional) C Compiler** (MSVC on Windows, GCC on Linux, Clang on macOS)
  - 一部の Python パッケージがバイナリホイールを持たない場合に必要になることがあります

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
- Build the backend with **Briefcase 0.3.25** (Windows 用実行ファイルを生成)
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
Uses **Briefcase 0.3.25** to build the Python backend into a standalone executable:

- **Windows**: `dist/backend/backend.exe`
- **Linux/macOS**: `dist/backend/backend`

実際の処理内容（スクリプト内部）:

- Windows (`build-local.bat`)
  - `briefcase create windows`
  - `briefcase build windows -u`
  - `windows\Hyper AI Agent Backend\app\Hyper AI Agent Backend.exe` → `dist\backend\backend.exe` にコピー
- Linux/macOS (`build-local.sh`)
  - `uname` で Linux / macOS を判定
  - Linux: `briefcase create linux && briefcase build linux -u`
    - `linux/Hyper AI Agent Backend/app/Hyper AI Agent Backend` → `dist/backend/backend` へコピー
  - macOS: `briefcase create macOS && briefcase build macOS -u`
    - `macOS/Hyper AI Agent Backend.app/Contents/MacOS/Hyper AI Agent Backend` → `dist/backend/backend` へコピー

**Note**: 初回ビルドは Briefcase がテンプレートアプリや依存ツールを準備するため数分かかることがあります。2 回目以降はキャッシュが効きます。

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
1. `requirements.txt` から依存関係が正しくインストールされているか確認してください。
2. Briefcase がインストール済みか確認してください:

   ```bash
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. 一部のパッケージで C コンパイラが必要になる場合があります:
   - **Windows**: Visual Studio Build Tools または MSVC をインストール
   - **Linux**: `sudo apt-get install gcc` or `sudo yum install gcc`
   - **macOS**: Xcode Command Line Tools: `xcode-select --install`

### Build is very slow

Briefcase 初回実行時は、テンプレートアプリの取得や依存関係コピーなどに時間がかかる場合があります:

- **First build**: 数分〜十数分（テンプレート/依存ツールの準備）
- **Subsequent builds**: キャッシュ済みのテンプレート/依存関係を再利用するため高速化

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

# 2. Build backend with Briefcase

## Windows
briefcase create windows
briefcase build windows -u

# dist/backend/backend.exe にコピー
mkdir dist\backend 2>nul
copy /y "windows\Hyper AI Agent Backend\app\Hyper AI Agent Backend.exe" dist\backend\backend.exe

## Linux / macOS
briefcase create linux   # Linux の場合
briefcase build linux -u

# または
briefcase create macOS   # macOS の場合
briefcase build macOS -u

# dist/backend/backend にコピー
mkdir -p dist/backend
cp "linux/Hyper AI Agent Backend/app/Hyper AI Agent Backend" dist/backend/backend  # Linux
cp "macOS/Hyper AI Agent Backend.app/Contents/MacOS/Hyper AI Agent Backend" dist/backend/backend  # macOS

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
Backend のビルドロジックは主に以下の場所にあります:

- `scripts/build_backend.ps1` / `scripts/build_backend.sh`
- `build-local.bat` / `build-local.sh`
- OS 別バックエンドスクリプト: `windows-build-backend.bat`, `linux-build-backend.sh`, `macos-build-backend.sh`

これらのスクリプトは内部で Briefcase を実行し、生成されたアプリから実行ファイルを `dist/backend/backend(.exe)` にコピーします。

カスタマイズ例:

- Briefcase のターゲットプラットフォームや追加オプションを変更したい場合:
  - `pyproject.toml` の `[tool.briefcase.app.hyper-ai-agent-backend.*]` セクションを編集
  - あるいはスクリプト内の `briefcase create/build ...` コマンドにフラグを追加

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
