# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for Hyper AI Agent Backend
Includes anti-virus false positive mitigation strategies
"""

import sys
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

block_cipher = None

# Collect all data files for key packages
datas = []
datas += collect_data_files('langchain')
datas += collect_data_files('langchain_core')
datas += collect_data_files('langchain_community')
datas += collect_data_files('sentence_transformers')
datas += collect_data_files('transformers')
datas += collect_data_files('tiktoken')
datas += collect_data_files('pydantic')

# Collect all submodules to ensure complete packaging
hiddenimports = []
hiddenimports += collect_submodules('langchain')
hiddenimports += collect_submodules('langchain_core')
hiddenimports += collect_submodules('langchain_community')
hiddenimports += collect_submodules('langchain_openai')
hiddenimports += collect_submodules('langchain_anthropic')
hiddenimports += collect_submodules('langchain_google_genai')
hiddenimports += collect_submodules('langchain_ollama')
hiddenimports += collect_submodules('uvicorn')
hiddenimports += collect_submodules('fastapi')
hiddenimports += collect_submodules('pydantic')
hiddenimports += collect_submodules('sqlalchemy')
hiddenimports += ['uvicorn.logging', 'uvicorn.loops', 'uvicorn.loops.auto', 'uvicorn.protocols', 
                  'uvicorn.protocols.http', 'uvicorn.protocols.http.auto', 'uvicorn.protocols.websockets',
                  'uvicorn.protocols.websockets.auto', 'uvicorn.lifespan', 'uvicorn.lifespan.on']

a = Analysis(
    ['src/main.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Exclude unnecessary packages to reduce size and avoid AV false positives
        'matplotlib',
        'IPython',
        'jupyter',
        'notebook',
        'tkinter',
        'PyQt5',
        'PyQt6',
        'PySide2',
        'PySide6',
        'wx',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,  # Don't strip symbols - helps avoid AV false positives
    upx=False,  # Disable UPX compression - major cause of AV false positives
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # Console application
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    # Anti-virus false positive mitigation
    icon=None,  # Add custom icon if available
    version=None,  # Add version info if available
)
