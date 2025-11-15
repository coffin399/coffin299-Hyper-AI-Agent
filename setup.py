"""
cx_Freeze setup script for Hyper AI Agent Backend
Builds standalone executable for Windows, Linux, and macOS
"""
import sys
from cx_Freeze import setup, Executable

# Dependencies are automatically detected, but some modules need help
build_exe_options = {
    "packages": [
        "fastapi",
        "uvicorn",
        "pydantic",
        "sqlalchemy",
        "aiosqlite",
        "alembic",
        "aiofiles",
        "httpx",
        "yaml",
        "langchain",
        "langchain_core",
        "langchain_community",
        "langchain_openai",
        "langchain_anthropic",
        "langchain_google_genai",
        "langchain_ollama",
        "openai",
        "anthropic",
        "google.generativeai",
        "ollama",
        "cryptography",
        "apscheduler",
        "watchdog",
        "crontab",
        "aiosmtplib",
        "email_validator",
        "bs4",
        "markdown",
        "pypdf",
        "docx",
        "playwright",
        "lxml",
        "psutil",
        "google.auth",
        "google.oauth2",
        "googleapiclient",
        "discord",
        "linebot",
        "pytesseract",
        "PIL",
        "pdf2image",
        "speech_recognition",
        "pydub",
        "multipart",
        "tenacity",
    ],
    "excludes": [
        "tkinter",
        "unittest",
        "test",
        "distutils",
        "setuptools",
        "numpy.distutils",
        "numpy.f2py",
        "matplotlib",
        "IPython",
        "jupyter",
        "notebook",
    ],
    "include_files": [
        # Add any additional files/directories needed at runtime
    ],
    "zip_include_packages": [
        "sentence_transformers",
        "transformers",
        "torch",
        "numpy",
        "scipy",
    ],
    "optimize": 2,
}

# Base for GUI applications (use None for console apps)
base = None
if sys.platform == "win32":
    # Use console base for backend server
    base = None

setup(
    name="HyperAIAgentBackend",
    version="0.1.0",
    description="Hyper AI Agent Backend Server",
    options={"build_exe": build_exe_options},
    executables=[
        Executable(
            "src/main.py",
            base=base,
            target_name="backend.exe" if sys.platform == "win32" else "backend",
        )
    ],
)
