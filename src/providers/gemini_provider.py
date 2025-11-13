from __future__ import annotations

from typing import Any, Dict, Iterable, Optional

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from ..core.config import get_settings
from ..core.models import ProviderType
from .base import ChatProvider


class GeminiProvider(ChatProvider):
    provider_type = ProviderType.GEMINI

    def __init__(self, model_name: Optional[str] = None) -> None:
        super().__init__(model_name)

    @property
    def default_model(self) -> str:  # pragma: no cover - configuration constant
        return get_settings().default_gemini_model

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
        chat = ChatGoogleGenerativeAI(
            model=self.model_name or self.default_model,
            temperature=temperature,
            max_output_tokens=max_tokens,
            google_api_key=api_key,
        )
        result = await chat.ainvoke(self._convert_messages(messages), run_name="hyper-ai-agent")
        usage = result.response_metadata.get("usage_metadata", {})
        tool_calls = result.additional_kwargs.get("tool_calls", [])
        return {
            "text": result.content,
            "usage": {
                "prompt_tokens": usage.get("prompt_token_count"),
                "completion_tokens": usage.get("candidates_token_count"),
                "total_tokens": usage.get("total_token_count"),
            },
            "tool_calls": [self.format_tool_call(call) for call in tool_calls],
        }

    def format_tool_call(self, tool_call: Any) -> Dict[str, Any]:  # pragma: no cover - traversal only
        if not tool_call:
            return {}
        func = tool_call.get("function_call", {})
        return {
            "id": tool_call.get("id"),
            "name": func.get("name"),
            "arguments": func.get("args"),
        }
