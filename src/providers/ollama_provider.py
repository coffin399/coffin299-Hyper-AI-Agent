from __future__ import annotations

from typing import Any, Dict, Iterable, Optional

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_ollama import ChatOllama

from ..core.config import get_settings
from ..core.models import ProviderType
from .base import ChatProvider


class OllamaProvider(ChatProvider):
    provider_type = ProviderType.OLLAMA

    def __init__(self, model_name: Optional[str] = None) -> None:
        super().__init__(model_name)
        self.settings = get_settings()

    @property
    def default_model(self) -> str:  # pragma: no cover - configuration constant
        return self.settings.default_ollama_model

    def _convert_messages(self, messages: Iterable[Dict[str, str]]) -> list[BaseMessage]:
        converted: list[BaseMessage] = []
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            if role == "system":
                converted.append(SystemMessage(content=content))
            elif role == "assistant":
                converted.append(AIMessage(content=content))
            else:
                converted.append(HumanMessage(content=content))
        return converted

    async def generate(
        self,
        api_key: str,
        messages: Iterable[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        tools: Optional[list[dict]] = None,
    ) -> Dict[str, Any]:
        chat = ChatOllama(
            model=self.model_name or self.default_model,
            temperature=temperature,
            num_predict=max_tokens,
            base_url=self.settings.ollama_base_url,
        )
        result = await chat.ainvoke(self._convert_messages(messages), run_name="hyper-ai-agent")
        return {
            "text": result.content,
            "usage": {},
            "tool_calls": [],
        }

    def format_tool_call(self, tool_call: Any) -> Dict[str, Any]:  # pragma: no cover - unused for Ollama
        return {}
