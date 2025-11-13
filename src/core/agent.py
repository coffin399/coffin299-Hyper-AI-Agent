from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, validator

from ..core.config import get_settings
from ..core.models import ProviderType
from ..providers.registry import get_provider
from ..services.conversation_service import ConversationService, conversation_service
from ..services.memory_service import MemoryService, memory_service
from ..services.provider_manager import ProviderManager, provider_manager
from ..services.summarization_service import SummarizationService, summarization_service


class AgentConfig(BaseModel):
    """Runtime configuration for the Hyper AI Agent."""

    system_prompt: str = "You are Hyper AI, a helpful AI assistant."
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(2000, gt=0)
    max_context_messages: int = Field(50, ge=1)


class ToolCall(BaseModel):
    """Normalized representation of a tool/function invocation."""

    id: Optional[str] = None
    name: Optional[str] = None
    arguments: Optional[str] = None


class ChatRequest(BaseModel):
    """Incoming chat payload from the desktop frontend."""

    project_name: str
    message: str
    provider: ProviderType
    conversation_id: Optional[int] = None
    project_description: Optional[str] = None
    model_name: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, gt=0)
    tools: Optional[List[Dict[str, Any]]] = None
    tags: Optional[List[str]] = None

    @validator("message")
    def _ensure_message(cls, value: str) -> str:  # type: ignore[override]
        if not value or not value.strip():
            raise ValueError("message must not be empty")
        return value


class ChatResponse(BaseModel):
    """Return payload for chat responses."""

    conversation_id: int
    provider: ProviderType
    model_name: str
    response_text: str
    tool_calls: List[ToolCall]
    usage: Dict[str, Any]
    used_key_id: Optional[int] = None


class HyperAIAgent:
    """Hyper AI Agent core class with multi-provider failover support."""

    def __init__(
        self,
        config: Optional[Dict[str, Any]] = None,
        provider_mgr: Optional[ProviderManager] = None,
        convo_service: Optional[ConversationService] = None,
        memory_svc: Optional[MemoryService] = None,
        summary_svc: Optional[SummarizationService] = None,
    ) -> None:
        self.config = AgentConfig(**(config or {}))
        self.settings = get_settings()
        self.provider_manager = provider_mgr or provider_manager
        self.conversation_service = convo_service or conversation_service
        self.memory_service = memory_svc or memory_service
        self.summarization_service = summary_svc or summarization_service

    async def process_chat(self, request: ChatRequest) -> ChatResponse:
        """Process a chat request using failover-aware provider routing."""

        temperature = request.temperature if request.temperature is not None else self.config.temperature
        max_tokens = request.max_tokens if request.max_tokens is not None else self.config.max_tokens

        project = await self.conversation_service.ensure_project(
            name=request.project_name,
            description=request.project_description,
        )

        conversation = None
        if request.conversation_id:
            conversation = await self.conversation_service.get_conversation(request.conversation_id)

        if not conversation:
            model_name = request.model_name or self._default_model_for(request.provider)
            conversation = await self.conversation_service.create_conversation(
                project_id=project.id,
                provider=request.provider,
                model_name=model_name,
                title=request.project_name,
            )
        elif request.model_name and conversation.model_name != request.model_name:
            updated = await self.conversation_service.update_conversation_model(
                conversation_id=conversation.id,
                model_name=request.model_name,
            )
            if updated:
                conversation = updated

        model_in_use = request.model_name or conversation.model_name

        context_messages = await self.conversation_service.list_conversation_context(
            conversation_id=conversation.id,
            limit=self.config.max_context_messages,
        )

        memory_matches = await self.memory_service.search_memories(
            project_id=project.id,
            query=request.message,
            top_k=5,
        )
        memory_context = self.memory_service.render_context(memory_matches)

        dispatch_messages = [
            {"role": "system", "content": self.config.system_prompt},
        ]
        if memory_context:
            dispatch_messages.append({"role": "system", "content": memory_context})
        dispatch_messages.extend(context_messages)
        dispatch_messages.append({"role": "user", "content": request.message})

        # Persist the user message before provider invocation
        await self.conversation_service.add_message(
            conversation_id=conversation.id,
            role="user",
            content=request.message,
        )

        provider = get_provider(request.provider, model_in_use)
        used_key: Dict[str, Optional[int]] = {"id": None}

        async def _invoke(api_key: str, key_id: int):
            used_key["id"] = key_id
            return await provider.generate(
                api_key=api_key,
                messages=dispatch_messages,
                temperature=temperature,
                max_tokens=max_tokens,
                tools=request.tools,
            )

        result = await self.provider_manager.rotate_until_success(request.provider, _invoke)

        response_text = result.get("text", "")
        usage = result.get("usage", {})
        tool_calls_raw = result.get("tool_calls", []) or []
        tool_calls = [ToolCall(**call) for call in tool_calls_raw if call]

        await self.conversation_service.add_message(
            conversation_id=conversation.id,
            role="assistant",
            content=response_text,
            token_usage=usage.get("completion_tokens") or usage.get("output_tokens"),
        )

        tokens_prompt = usage.get("prompt_tokens") or usage.get("input_tokens") or 0
        tokens_completion = usage.get("completion_tokens") or usage.get("output_tokens") or 0

        await self.conversation_service.record_usage(
            project_id=project.id,
            provider=request.provider,
            model_name=model_in_use,
            tokens_prompt=int(tokens_prompt),
            tokens_completion=int(tokens_completion),
            metadata={"tool_calls": [call.dict() for call in tool_calls]},
        )

        await self._maybe_generate_summary(
            project=project,
            conversation_id=conversation.id,
            provider=request.provider,
            model_name=model_in_use,
            tags=request.tags,
        )

        return ChatResponse(
            conversation_id=conversation.id,
            provider=request.provider,
            model_name=model_in_use,
            response_text=response_text,
            tool_calls=tool_calls,
            usage=usage,
            used_key_id=used_key.get("id"),
        )

    def _default_model_for(self, provider: ProviderType) -> str:
        if provider is ProviderType.OPENAI:
            return self.settings.default_openai_model
        if provider is ProviderType.ANTHROPIC:
            return self.settings.default_anthropic_model
        if provider is ProviderType.GEMINI:
            return self.settings.default_gemini_model
        if provider is ProviderType.OLLAMA:
            return self.settings.default_ollama_model
        raise ValueError(f"Unsupported provider: {provider}")

    def reset_conversation(self) -> None:
        """No-op placeholder for compatibility; conversations persist in the database."""
        return None

    async def _maybe_generate_summary(
        self,
        project,
        conversation_id: int,
        provider: ProviderType,
        model_name: str,
        tags: Optional[List[str]],
    ) -> None:
        message_count = await self.conversation_service.count_messages(conversation_id)
        if message_count < self.settings.summary_trigger_messages:
            return
        if message_count % self.settings.summary_trigger_messages != 0:
            return

        context_messages = await self.conversation_service.list_conversation_context(
            conversation_id=conversation_id,
            limit=self.settings.max_context_messages,
        )
        summary_text = await self.summarization_service.generate_summary(
            provider=provider,
            model_name=model_name,
            project_name=project.name,
            messages=context_messages,
        )
        if not summary_text:
            return

        await self.conversation_service.save_summary(conversation_id, summary_text)

        summary_tags = list(tags or []) + ["summary", f"conversation:{conversation_id}"]
        await self.memory_service.add_memory(
            project_id=project.id,
            content=summary_text,
            summary=summary_text,
            tags=summary_tags,
            metadata={
                "type": "conversation_summary",
                "conversation_id": conversation_id,
            },
        )
