from __future__ import annotations

import math
import pickle
import hashlib
from typing import Iterable, List, Sequence


EMBEDDING_DIM = 256


class EmbeddingService:
    """Generate and convert lightweight embeddings for semantic memory and RAG."""

    def __init__(self, dim: int = EMBEDDING_DIM) -> None:
        self.dim = dim

    def embed(self, texts: Iterable[str]) -> List[List[float]]:
        vectors: List[List[float]] = []
        for text in texts:
            vectors.append(self._embed_text(text))
        return vectors

    def _embed_text(self, text: str) -> List[float]:
        vec = [0.0] * self.dim
        normalized = (text or "").strip().lower()
        if not normalized:
            return vec

        tokens = normalized.split()
        for token in tokens:
            h = int(hashlib.md5(token.encode("utf-8")).hexdigest(), 16)
            idx = h % self.dim
            vec[idx] += 1.0

            if len(token) > 1:
                for i in range(len(token) - 1):
                    bigram = token[i : i + 2]
                    hb = int(hashlib.sha1(bigram.encode("utf-8")).hexdigest(), 16)
                    idx_bi = hb % self.dim
                    vec[idx_bi] += 0.5

        return vec

    @staticmethod
    def to_bytes(vector: Sequence[float]) -> bytes:
        return pickle.dumps(list(vector), protocol=pickle.HIGHEST_PROTOCOL)

    @staticmethod
    def from_bytes(blob: bytes) -> List[float]:
        obj = pickle.loads(blob)
        if isinstance(obj, list):
            return obj
        if isinstance(obj, tuple):
            return list(obj)
        try:
            return [float(x) for x in obj]
        except Exception:
            return []

    @staticmethod
    def cosine_similarity(a: Sequence[float], b: Sequence[float]) -> float:
        if not a or not b or len(a) != len(b):
            return 0.0
        norm_a = math.sqrt(sum(x * x for x in a))
        norm_b = math.sqrt(sum(y * y for y in b))
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        dot = sum(x * y for x, y in zip(a, b))
        return float(dot / (norm_a * norm_b))


embedding_service = EmbeddingService()
