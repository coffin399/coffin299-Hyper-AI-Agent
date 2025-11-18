from __future__ import annotations

import pickle
from functools import lru_cache
from typing import Iterable, List

import numpy as np
try:
    from sentence_transformers import SentenceTransformer
except Exception:
    SentenceTransformer = None


EMBEDDING_MODEL = "all-MiniLM-L6-v2"


@lru_cache(maxsize=1)
def _load_model() -> "SentenceTransformer":  # pragma: no cover - heavy external dependency
    if SentenceTransformer is None:
        raise RuntimeError("sentence-transformers is not installed; embedding features are unavailable on this platform.")
    return SentenceTransformer(EMBEDDING_MODEL)


class EmbeddingService:
    """Generate and convert embeddings for semantic memory and RAG."""

    def __init__(self, model_name: str = EMBEDDING_MODEL) -> None:
        self.model_name = model_name

    def embed(self, texts: Iterable[str]) -> List[np.ndarray]:
        model = _load_model()
        vectors = model.encode(list(texts), convert_to_numpy=True, show_progress_bar=False)
        return [np.asarray(vector, dtype=np.float32) for vector in vectors]

    @staticmethod
    def to_bytes(vector: np.ndarray) -> bytes:
        return pickle.dumps(vector.astype(np.float32))

    @staticmethod
    def from_bytes(blob: bytes) -> np.ndarray:
        return pickle.loads(blob)

    @staticmethod
    def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        a_norm = np.linalg.norm(a)
        b_norm = np.linalg.norm(b)
        if a_norm == 0 or b_norm == 0:
            return 0.0
        return float(np.dot(a, b) / (a_norm * b_norm))


embedding_service = EmbeddingService()
