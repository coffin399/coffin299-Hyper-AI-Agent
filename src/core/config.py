from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from pydantic import Field, SecretStr, validator
from pydantic_settings import BaseSettings


# Available LLM Models (November 2025)
OPENAI_MODELS = [
    # GPT-5 Series
    "gpt-5",
    "gpt-5.1-instant",
    "gpt-5.1-thinking",
    "gpt-5-instant",
    "gpt-5-thinking",
    "gpt-5-pro",
    "gpt-5-nano",
    "gpt-5-mini",
    # o-Series (Reasoning Models)
    "o4-mini",
    "o3",
    "o3-mini",
    # GPT-4 Series
    "gpt-4.1",
    "gpt-4o",
    "gpt-4.5",
    # Coding Specialized
    "gpt-5-codex",
    "gpt-5-codex-mini",
    # Image Generation
    "dall-e-2",
    "dall-e-3",
]

GEMINI_MODELS = [
    # Gemini 3 Series (Latest)
    "gemini-3-pro",
    # Gemini 2.5 Series
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash-native-audio",
    "gemini-robotics-er-1.5",
    # Image Generation
    "nano-banana",  # gemini-2.5-flash-image
    # Video Generation
    "veo-3",
    "veo-3-fast",
    "veo-3.1",
    "veo-3.1-fast",
    # Embedding Models
    "gemini-embedding-001",
]

ANTHROPIC_MODELS = [
    # Claude 4 Series
    "claude-sonnet-4-5-20250929",
    "claude-opus-4-1-20250805",
    "claude-sonnet-4-20250522",
    "claude-opus-4-20250522",
    "claude-haiku-4-5-20251015",
    # Claude 3.7 Series
    "claude-sonnet-3-7",
    "claude-haiku-3-5",
    # Claude 3 Series (Legacy)
    "claude-3-opus",
    "claude-3-sonnet",
    "claude-3-haiku",
]

GROK_MODELS = [
    # Grok 4 Series
    "grok-4",
    "grok-4-heavy",  # supergrok-heavy
    "grok-4-fast",
    # Coding Specialized
    "grok-code-fast-1",
    # Grok 3 Series
    "grok-3",
    "grok-3-mini",
    # Grok 2 Series
    "grok-2",
    "grok-2-mini",
    # Grok 1 Series (Legacy)
    "grok-1",
    "grok-1.5",
    "grok-1.5v",
]


class Settings(BaseSettings):
    """Application-level settings loaded from environment variables."""

    app_name: str = "Hyper AI Agent"
    environment: str = Field("development", pattern=r"^(development|staging|production)$")
    
    # Backend mode: "local" (bundled) or "network" (remote API)
    backend_mode: str = Field("local", pattern=r"^(local|network)$")
    backend_port: int = Field(18000, ge=1024, le=65535)
    network_api_url: str = Field("", description="API base URL when backend_mode=network")

    # Storage configuration
    data_dir: Path = Path(".data")
    database_path: Path = Field(default_factory=lambda: Path(".data") / "agent.db")
    plugins_dir: Path = Field(default_factory=lambda: Path(".data") / "plugins")

    # Encryption secret for BYOK storage (base64 urlsafe string for Fernet)
    # In production or self-hosted deployments, override via KEYSTORE_SECRET env var.
    # The default value is only intended for local development and packaged desktop builds.
    keystore_secret: SecretStr = Field("change-me-in-production", env="KEYSTORE_SECRET")

    # Allowed hosts for CORS (comma-separated list)
    cors_origins: str = "*"

    # Default provider model fallbacks
    default_openai_model: str = "gpt-5"
    default_anthropic_model: str = "claude-sonnet-4-5-20250929"
    default_gemini_model: str = "gemini-3-pro"
    default_ollama_model: str = "llama3"
    default_grok_model: str = "grok-4"
    default_openrouter_model: str = "anthropic/claude-sonnet-4-5-20250929"
    default_nvidia_nim_model: str = "meta/llama-3.1-405b-instruct"
    
    # Provider base URLs
    ollama_base_url: str = "http://localhost:11434"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    nvidia_nim_base_url: str = "https://integrate.api.nvidia.com/v1"

    # Conversation tuning
    max_context_messages: int = 20
    summary_trigger_messages: int = 12

    # Unsafe execution (advanced / self-hosted only)
    enable_unsafe_exec: bool = False
    # Global developer mode flag for enabling advanced, potentially unsafe features
    developer_mode: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @validator("data_dir", "database_path", "plugins_dir", pre=True)
    def _expand_paths(cls, value: Path | str) -> Path:  # type: ignore[override]
        path = Path(value).expanduser().resolve()
        if path.suffix:
            # If file path, ensure parent exists
            path.parent.mkdir(parents=True, exist_ok=True)
        else:
            path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def allowed_origins(self) -> List[str]:
        if self.cors_origins == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
