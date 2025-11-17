# Backend Build Guide

This guide explains how to build the Python backend into a standalone executable using Briefcase 0.3.25.

## Prerequisites

- Python 3.11 or higher
- All dependencies from `requirements.txt` installed
  - `requirements.txt` には `briefcase==0.3.25` が含まれています
- Briefcase 0.3.25（`pip install -r requirements.txt` でインストールされます）
- （必要に応じて）C コンパイラ
  - 一部の Python パッケージがホイールを持たない場合にビルドに必要
- **Note**: 初回の Briefcase ビルドではテンプレートアプリや依存ツールのセットアップが入るため、数分程度かかることがあります

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

### Build fails with "briefcase: command not found" / "No module named 'briefcase'"

Briefcase が正しくインストールされていない可能性があります。

```bash
# 推奨: プロジェクトルートで
python -m pip install --upgrade pip
pip install -r requirements.txt

# または直接インストール
pip install briefcase==0.3.25
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
2. Run the Briefcase build (per OS)
3. Copy `dist/backend/backend(.exe)` to Electron のリソースとして含める
4. Build Electron app with electron-builder

Example GitHub Actions workflow:
```yaml
- name: Install Python dependencies
  run: |
    python -m pip install --upgrade pip
    pip install -r requirements.txt

- name: Build Backend with Briefcase (Windows)
  if: runner.os == 'Windows'
  shell: pwsh
  run: |
    briefcase create windows
    briefcase build windows -u

    $appPath = "windows\Hyper AI Agent Backend\app\Hyper AI Agent Backend.exe"
    if (-not (Test-Path $appPath)) {
      throw "Backend executable not found: $appPath"
    }

    New-Item -ItemType Directory -Force -Path "dist\backend" | Out-Null
    Copy-Item -Path $appPath -Destination "dist\backend\backend.exe" -Force

- name: Build Electron
  run: |
    npm run build:frontend
    npm run build
```

## Bundle Size & Performance

### Bundle size

Briefcase でパッケージされたバックエンド実行ファイル / アプリは、概ね **150〜250MB** 程度になります。含まれるもの:

- Python ランタイム
- すべてのバックエンド依存パッケージ（FastAPI, LangChain など）
- それらのネイティブライブラリ

圧縮や差分アップデートなどは Electron 側（electron-builder）の設定に依存します。

### Build Performance

- **初回ビルド**
  - Briefcase がテンプレートアプリや依存ツールを準備するため、時間がかかる場合があります
  - OS ごとのアプリ構造を生成し、Python 依存関係をコピー
- **2 回目以降のビルド**
  - 既存のテンプレートとキャッシュ済み依存関係を再利用するため、比較的高速になります

CI では、`.briefcase-cache` などのキャッシュディレクトリを再利用することでビルド時間を短縮できます（Windows 用の `build-backend-nuitka-cache.bat` はローカルと CI で共有可能なキャッシュディレクトリを想定しています）。

## Security Considerations

- The bundled executable includes all source code (compiled)
- Environment variables should be set at runtime, not baked in
- API keys should be stored in user's config, not in the executable
- Use HTTPS for network mode connections
