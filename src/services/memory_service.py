from __future__ import annotations

import asyncio
import re
from dataclasses import dataclass
from typing import Iterable, List, Optional

from ..core.models import MemoryRecord
from .conversation_service import ConversationService, conversation_service
from .embedding_service import embedding_service


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
    ) -> None:
        self.conversation_service = convo_service or conversation_service

    async def add_memory(
        self,
        project_id: int,
        content: str,
        summary: Optional[str] = None,
        tags: Optional[Iterable[str]] = None,
        metadata: Optional[dict] = None,
    ) -> MemoryRecord:
        text_for_embedding = (summary or content or "").strip()
        embedding_bytes: Optional[bytes] = None
        if text_for_embedding:
            try:
                vectors = embedding_service.embed([text_for_embedding])
                if vectors:
                    embedding_bytes = embedding_service.to_bytes(vectors[0])
            except Exception:
                embedding_bytes = None

        return await self.conversation_service.store_memory(
            project_id=project_id,
            content=content,
            summary=summary,
            embedding=embedding_bytes,
            tags=tags,
            metadata=metadata,
        )

    async def add_document_memories(
        self,
        project_id: int,
        text: str,
        source: Optional[str] = None,
        tags: Optional[Iterable[str]] = None,
    ) -> List[MemoryRecord]:
        chunks = self._chunk_text(text)
        records: List[MemoryRecord] = []
        for index, chunk in enumerate(chunks):
            chunk_metadata = {"type": "document", "chunk_index": index}
            if source:
                chunk_metadata["source"] = source
            record = await self.add_memory(
                project_id=project_id,
                content=chunk,
                summary=None,
                tags=tags,
                metadata=chunk_metadata,
            )
            records.append(record)
        return records

    async def search_memories(
        self,
        project_id: int,
        query: str,
        top_k: int = 5,
        min_score: float = 0.35,
    ) -> List[MemoryMatch]:
        if not query.strip():
            return []

        records = await self.conversation_service.list_memories(project_id=project_id)
        scored: List[MemoryMatch] = []
        use_embeddings = False
        query_vector = None
        try:
            vectors = embedding_service.embed([query])
            if vectors:
                query_vector = vectors[0]
                use_embeddings = True
        except Exception:
            use_embeddings = False

        if use_embeddings and query_vector is not None:
            for record in records:
                if not record.embedding:
                    continue
                try:
                    vector = embedding_service.from_bytes(record.embedding)
                except Exception:
                    continue
                score = embedding_service.cosine_similarity(query_vector, vector)
                if score < min_score:
                    continue
                metadata = self._deserialize_metadata(record)
                scored.append(MemoryMatch(record=record, score=score, metadata=metadata))
        else:
            for record in records:
                text = (record.summary or record.content or "").strip()
                if not text:
                    continue
                score = self._score_plain(query, text)
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

    @staticmethod
    def _score_plain(query: str, text: str) -> float:
        """Compute a simple similarity between query and text based on token overlap.

        Score is Jaccard similarity over lowercased word tokens.
        """
        query_tokens = set(re.findall(r"\w+", query.lower()))
        text_tokens = set(re.findall(r"\w+", text.lower()))
        if not query_tokens or not text_tokens:
            return 0.0
        intersection = len(query_tokens & text_tokens)
        union = len(query_tokens | text_tokens)
        return intersection / union

    @staticmethod
    def _chunk_text(text: str, max_chars: int = 1000, overlap: int = 200) -> List[str]:
        cleaned = text.replace("\r\n", "\n").replace("\r", "\n")
        if not cleaned:
            return []
        chunks: List[str] = []
        start = 0
        length = len(cleaned)
        while start < length:
            end = min(start + max_chars, length)
            segment = cleaned[start:end].strip()
            if segment:
                chunks.append(segment)
            if end >= length:
                break
            start = max(end - overlap, 0)
        return chunks


memory_service = MemoryService()
