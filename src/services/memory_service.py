from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Iterable, List, Optional

import numpy as np

from ..core.models import MemoryRecord
from .conversation_service import ConversationService, conversation_service
from .embedding_service import EmbeddingService, embedding_service


@dataclass
class MemoryMatch:
    record: MemoryRecord
    score: float
    metadata: Optional[dict]


class MemoryService:
    """Manage long-term memory storage and semantic retrieval."""

    def __init__(
        self,
        convo_service: ConversationService | None = None,
        embed_service: EmbeddingService | None = None,
    ) -> None:
        self.conversation_service = convo_service or conversation_service
        self.embedding_service = embed_service or embedding_service

    async def add_memory(
        self,
        project_id: int,
        content: str,
        summary: Optional[str] = None,
        tags: Optional[Iterable[str]] = None,
        metadata: Optional[dict] = None,
    ) -> MemoryRecord:
        vectors = await asyncio.to_thread(self.embedding_service.embed, [content])
        vector = vectors[0]
        embedding_blob = self.embedding_service.to_bytes(vector)
        return await self.conversation_service.store_memory(
            project_id=project_id,
            content=content,
            summary=summary,
            embedding=embedding_blob,
            tags=tags,
            metadata=metadata,
        )

    async def search_memories(
        self,
        project_id: int,
        query: str,
        top_k: int = 5,
        min_score: float = 0.35,
    ) -> List[MemoryMatch]:
        if not query.strip():
            return []
        query_vector_list = await asyncio.to_thread(self.embedding_service.embed, [query])
        query_vector: np.ndarray = query_vector_list[0]

        records = await self.conversation_service.list_memories(project_id=project_id)
        scored: List[MemoryMatch] = []
        for record in records:
            if not record.embedding:
                continue
            vector = self.embedding_service.from_bytes(record.embedding)
            score = self.embedding_service.cosine_similarity(query_vector, vector)
            if score < min_score:
                continue
            metadata = self._deserialize_metadata(record)
            scored.append(MemoryMatch(record=record, score=score, metadata=metadata))

        scored.sort(key=lambda m: m.score, reverse=True)
        return scored[:top_k]

    def render_context(self, matches: Iterable[MemoryMatch]) -> Optional[str]:
        matches_list = list(matches)
        if not matches_list:
            return None
        lines: List[str] = ["Relevant long-term memories:"]
        for idx, match in enumerate(matches_list, start=1):
            record = match.record
            snippet = (record.summary or record.content or "").strip()
            snippet_single = " ".join(snippet.split())
            if len(snippet_single) > 350:
                snippet_single = snippet_single[:347] + "..."
            meta_info = ""
            if match.metadata:
                source = match.metadata.get("source") or match.metadata.get("url")
                if source:
                    meta_info = f" (source: {source})"
                elif match.metadata.get("type"):
                    meta_info = f" ({match.metadata['type']})"
            lines.append(f"{idx}. {snippet_single}{meta_info}")
        return "\n".join(lines)

    @staticmethod
    def _deserialize_metadata(record: MemoryRecord) -> Optional[dict]:
        if not record.metadata_json:
            return None
        try:
            import json

            return json.loads(record.metadata_json)
        except Exception:  # pragma: no cover - defensive
            return None


memory_service = MemoryService()
