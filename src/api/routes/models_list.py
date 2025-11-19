from __future__ import annotations

from pathlib import Path
from typing import Dict, List

from fastapi import APIRouter

from ...core.config import ANTHROPIC_MODELS, GEMINI_MODELS, GROK_MODELS, OPENAI_MODELS, get_settings

router = APIRouter(prefix="/models-list", tags=["models"])


@router.get("/", response_model=Dict[str, List[str]])
async def get_available_models():
    """Get list of available models for each provider (November 2025)."""
    settings = get_settings()
    
    ollama_models = ["llama3", "llama3.1", "llama3.2", "mistral", "mixtral", "codellama"]
    if settings.local_execution_mode == "native":
        from ...services.model_service import model_service
        downloaded = model_service.get_downloaded_models()
        # Filter for native mode models and extract names
        # The frontend expects a list of strings.
        # We should probably return the model name that the provider can resolve.
        # Our naming convention in ModelService is {model}-{quantization}.gguf
        # But the provider receives this name.
        # Let's return the filenames or a constructed ID.
        # ModelService returns 'path' which is the full path.
        # Let's return the filename for simplicity, or the model ID if we can map it back.
        # For now, returning the filename (e.g. "qwen3-0.6b-Q4_K_M.gguf") is safest as the provider can look for it.
        ollama_models = [Path(m["path"]).name for m in downloaded if m.get("mode") == "native"]
        
        # Fallback if no models downloaded but path is set in config
        if not ollama_models and settings.native_model_path:
            ollama_models = [Path(settings.native_model_path).name]

    return {
        "openai": OPENAI_MODELS,
        "anthropic": ANTHROPIC_MODELS,
        "gemini": GEMINI_MODELS,
        "grok": GROK_MODELS,
        "ollama": ollama_models,
        "openrouter": [
            "anthropic/claude-sonnet-4-5-20250929",
            "anthropic/claude-opus-4-1-20250805",
            "openai/gpt-5",
            "openai/gpt-4o",
            "google/gemini-3-pro",
            "meta-llama/llama-3.1-405b-instruct",
        ],
        "nvidia_nim": [
            "meta/llama-3.1-405b-instruct",
            "meta/llama-3.1-70b-instruct",
            "meta/llama-3.1-8b-instruct",
            "mistralai/mixtral-8x7b-instruct-v0.1",
            "mistralai/mistral-7b-instruct-v0.2",
        ],
    }


@router.get("/openai", response_model=List[str])
async def get_openai_models():
    """Get available OpenAI models."""
    return OPENAI_MODELS


@router.get("/anthropic", response_model=List[str])
async def get_anthropic_models():
    """Get available Anthropic (Claude) models."""
    return ANTHROPIC_MODELS


@router.get("/gemini", response_model=List[str])
async def get_gemini_models():
    """Get available Google Gemini models."""
    return GEMINI_MODELS


@router.get("/grok", response_model=List[str])
async def get_grok_models():
    """Get available xAI Grok models."""
    return GROK_MODELS
