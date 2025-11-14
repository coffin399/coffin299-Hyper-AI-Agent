from __future__ import annotations

from typing import Dict, Type

from ..core.models import ProviderType
from .anthropic_provider import AnthropicProvider
from .base import ChatProvider
from .gemini_provider import GeminiProvider
from .grok_provider import GrokProvider
from .nvidia_nim_provider import NvidiaNimProvider
from .ollama_provider import OllamaProvider
from .openai_provider import OpenAIProvider
from .openrouter_provider import OpenRouterProvider

PROVIDER_CLASSES: Dict[ProviderType, Type[ChatProvider]] = {
    ProviderType.OPENAI: OpenAIProvider,
    ProviderType.ANTHROPIC: AnthropicProvider,
    ProviderType.GEMINI: GeminiProvider,
    ProviderType.OLLAMA: OllamaProvider,
    ProviderType.GROK: GrokProvider,
    ProviderType.OPENROUTER: OpenRouterProvider,
    ProviderType.NVIDIA_NIM: NvidiaNimProvider,
}


def get_provider(provider: ProviderType, model_name: str | None = None) -> ChatProvider:
    provider_cls = PROVIDER_CLASSES.get(provider)
    if not provider_cls:
        raise ValueError(f"Unknown provider: {provider}")
    return provider_cls(model_name=model_name)
