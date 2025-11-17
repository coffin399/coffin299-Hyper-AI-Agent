@echo off
setlocal ENABLEDELAYEDEXPANSION

REM プロジェクトルートを、このバッチファイルの場所として扱う
set "PROJECT_ROOT=%~dp0"

REM Python スクリプトを実行
"%PROJECT_ROOT%venv\Scripts\python.exe" "%PROJECT_ROOT%tools\generate_notice.py" 2>"%PROJECT_ROOT%generate_notice_error.log"
if errorlevel 1 (
    echo NOTICE の生成に失敗しました。詳細は generate_notice_error.log を確認してください。
    echo venv を使っていない場合は、次のように実行してください:
    echo   python tools\generate_notice.py
    exit /b 1
)

echo NOTICE を生成しました。
endlocal
