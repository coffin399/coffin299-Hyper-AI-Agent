from __future__ import annotations

import logging
from typing import Iterable, List, Optional

from ..core.models import ProviderType
from ..providers.registry import get_provider
from ..services.provider_manager import ProviderManager, provider_manager

logger = logging.getLogger(__name__)


SUMMARY_SYSTEM_PROMPT = (
    "You summarize conversation transcripts for an AI agent project. "
    "Return a concise markdown summary with:\n"
    "- Key decisions and rationale\n"
    "- Open questions or follow-ups\n"
    "- Action items with owners if mentioned\n"
    "Keep critical data points and avoid fluff."
)


def _format_transcript(messages: Iterable[dict[str, str]]) -> str:
    lines: List[str] = []
    for message in messages:
        role = message.get("role", "user")
        content = message.get("content", "").strip()
        if not content:
            continue
        lines.append(f"{role.upper()}: {content}")
    return "\n".join(lines)


class SummarizationService:
    """Use the configured provider stack to create conversation summaries."""

    def __init__(self, provider_mgr: ProviderManager | None = None) -> None:
        self.provider_manager = provider_mgr or provider_manager

    async def generate_summary(
        self,
        provider: ProviderType,
        model_name: str,
        project_name: str,
        messages: Iterable[dict[str, str]],
    ) -> Optional[str]:
        transcript = _format_transcript(messages)
        if not transcript:
            return None

        provider_instance = get_provider(provider, model_name)
        payload = [
            {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Project: {project_name}\n"
                    "Summarize the following conversation transcript:\n\n"
                    f"{transcript}"
                ),
            },
        ]

        async def _invoke(api_key: str, key_id: int):
            return await provider_instance.generate(
                api_key=api_key,
                messages=payload,
                temperature=0.2,
                max_tokens=512,
                tools=None,
            )

        try:
            result = await self.provider_manager.rotate_until_success(provider, _invoke)
        except Exception as exc:  # pragma: no cover - network interaction
            logger.warning("Failed to generate summary: %s", exc)
            return None

        text = result.get("text", "").strip()
        return text or None


summarization_service = SummarizationService()
