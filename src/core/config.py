from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from pydantic import BaseSettings, Field, SecretStr, validator


class Settings(BaseSettings):
    """Application-level settings loaded from environment variables."""

    app_name: str = "Hyper AI Agent"
    environment: str = Field("development", regex=r"^(development|staging|production)$")
    
    # Backend mode: "local" (bundled) or "network" (remote API)
    backend_mode: str = Field("local", regex=r"^(local|network)$")
    backend_port: int = Field(18000, ge=1024, le=65535)
    network_api_url: str = Field("", description="API base URL when backend_mode=network")

    # Storage configuration
    data_dir: Path = Path(".data")
    database_path: Path = Field(default_factory=lambda: Path(".data") / "agent.db")
    plugins_dir: Path = Field(default_factory=lambda: Path(".data") / "plugins")

    # Encryption secret for BYOK storage (base64 urlsafe string for Fernet)
    keystore_secret: SecretStr = Field(..., env="KEYSTORE_SECRET")

    # Allowed hosts for CORS (comma-separated list)
    cors_origins: str = "*"

    # Default provider model fallbacks
    default_openai_model: str = "gpt-4o"
    default_anthropic_model: str = "claude-3-opus-20240229"
    default_gemini_model: str = "gemini-1.5-pro-latest"
    default_ollama_model: str = "llama3"
    ollama_base_url: str = "http://localhost:11434"

    # Conversation tuning
    max_context_messages: int = 20
    summary_trigger_messages: int = 12

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
