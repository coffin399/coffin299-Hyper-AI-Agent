from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, Iterable, Optional

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage

try:
    from llama_cpp import Llama
except ImportError:
    Llama = None

from ..core.config import get_settings
from ..core.models import ProviderType
from .base import ChatProvider

logger = logging.getLogger(__name__)


class NativeLocalProvider(ChatProvider):
    provider_type = ProviderType.NATIVE_LOCAL

    def __init__(self, model_name: Optional[str] = None) -> None:
        super().__init__(model_name)
        self.settings = get_settings()
        self._llm: Optional[Llama] = None

    @property
    def default_model(self) -> str:
        return self.settings.native_model_path or "model.gguf"

    def _initialize_llm(self) -> None:
        if self._llm is not None:
            return

        if Llama is None:
            raise ImportError(
                "llama-cpp-python is not installed. Please install it to use Native Local LLM mode."
            )

        model_path = None
        
        # 1. Try model_name as provided (absolute path or filename)
        if self.model_name:
            # Check if it's a full path
            p = Path(self.model_name)
            if p.exists() and p.is_file():
                model_path = str(p)
            else:
                # Check in models directory
                models_dir = Path(self.settings.data_dir) / "models"
                p_in_dir = models_dir / self.model_name
                if p_in_dir.exists() and p_in_dir.is_file():
                    model_path = str(p_in_dir)
        
        # 2. Fallback to configured default path
        if not model_path and self.settings.native_model_path:
            p = Path(self.settings.native_model_path)
            if p.exists() and p.is_file():
                model_path = str(p)

        if not model_path:
            raise ValueError(f"Native model not found. Name: {self.model_name}, Default: {self.settings.native_model_path}")

        logger.info(f"Initializing Native Local LLM from: {model_path}")
        
        self._llm = Llama(
            model_path=model_path,
            n_gpu_layers=self.settings.native_gpu_layers,
            main_gpu=self.settings.native_main_gpu,
            use_mmap=self.settings.native_use_mmap,
            use_mlock=self.settings.native_use_mlock,
            n_ctx=self.settings.native_n_ctx,
            n_batch=self.settings.native_n_batch,
            n_threads=self.settings.native_n_threads,
            verbose=True,
        )

    def _convert_messages_to_prompt(self, messages: Iterable[Dict[str, str]]) -> str:
        """
        Convert messages to a prompt string. 
        Note: llama-cpp-python has a chat_format option, but for raw control or simple models, 
        we might need to construct the prompt manually or use the create_chat_completion API directly 
        which handles templates if the model has metadata.
        
        We will use create_chat_completion which is compatible with OpenAI API format.
        """
        return "" # Not used if we use create_chat_completion

    async def generate(
        self,
        api_key: str,
        messages: Iterable[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        tools: Optional[list[dict]] = None,
    ) -> Dict[str, Any]:
        self._initialize_llm()
        
        # Convert iterable to list for llama-cpp-python
        messages_list = list(messages)
        
        # llama-cpp-python's create_chat_completion is synchronous but fast enough for local?
        # Ideally we should run this in a thread pool to not block the async event loop.
        import asyncio
        from functools import partial

        if not self._llm:
             raise RuntimeError("LLM not initialized")

        # Prepare arguments
        kwargs = {
            "messages": messages_list,
            "temperature": temperature,
            "max_tokens": max_tokens,
            # "tools": tools, # llama-cpp-python support for tools is experimental/varying, omit for now or check version
        }
        
        # Run in thread pool
        loop = asyncio.get_running_loop()
        func = partial(self._llm.create_chat_completion, **kwargs)
        
        try:
            response = await loop.run_in_executor(None, func)
        except Exception as e:
            logger.error(f"Error generating response from Native Local LLM: {e}")
            raise

        # Extract content
        # Response format mimics OpenAI: {'choices': [{'message': {'content': ...}}], ...}
        content = response["choices"][0]["message"]["content"]
        
        return {
            "text": content,
            "usage": response.get("usage", {}),
            "tool_calls": [], # Tool calls not fully supported in this basic implementation yet
        }

    def format_tool_call(self, tool_call: Any) -> Dict[str, Any]:
        return {}
