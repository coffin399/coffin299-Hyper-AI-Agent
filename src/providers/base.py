from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, Iterable, Optional

from ..core.models import ProviderType


class ChatProvider(ABC):
    """Abstract base class for chat completion providers."""

    provider_type: ProviderType

    def __init__(self, model_name: Optional[str] = None) -> None:
        self.model_name = model_name

    @abstractmethod
    async def generate(
        self,
        api_key: str,
        messages: Iterable[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        tools: Optional[list[dict]] = None,
    ) -> Dict[str, Any]:
        """Return structured response with text, usage, tool_calls."""

    @property
    @abstractmethod
    def default_model(self) -> str:
        """Return provider default model."""

    @abstractmethod
    def format_tool_call(self, tool_call: Any) -> Dict[str, Any]:
        """Normalize provider-specific tool invocation format."""
