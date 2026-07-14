from __future__ import annotations

import threading
from typing import Sequence

import numpy as np
from numpy.typing import NDArray
from sentence_transformers import SentenceTransformer

from app.database import normalize_float32


class Embedder:
    """Lazy CPU wrapper for the single pinned E5 embedding space."""

    def __init__(self, model_name: str, device: str, batch_size: int) -> None:
        self.model_name = model_name
        self.device = device
        self.batch_size = batch_size
        self._model: SentenceTransformer | None = None
        self._lock = threading.RLock()

    @property
    def model(self) -> SentenceTransformer:
        with self._lock:
            if self._model is None:
                self._model = SentenceTransformer(self.model_name, device=self.device)
            return self._model

    @property
    def tokenizer(self):
        return self.model.tokenizer

    def _encode(self, texts: Sequence[str]) -> NDArray[np.float32]:
        if not texts:
            return np.empty((0, 0), dtype=np.float32)
        with self._lock:
            vectors = self.model.encode(
                list(texts),
                batch_size=self.batch_size,
                convert_to_numpy=True,
                normalize_embeddings=True,
                show_progress_bar=False,
            )
        array = np.asarray(vectors, dtype=np.float32)
        if array.ndim != 2 or array.shape[0] != len(texts):
            raise RuntimeError("Embedding model returned an unexpected matrix shape")
        if not np.isfinite(array).all():
            raise RuntimeError("Embedding model returned a non-finite value")
        return np.ascontiguousarray(array)

    def encode_passages(self, passages: Sequence[str]) -> NDArray[np.float32]:
        return self._encode([f"passage: {text.strip()}" for text in passages])

    def encode_query(self, query: str) -> NDArray[np.float32]:
        matrix = self._encode([f"query: {query.strip()}"])
        return normalize_float32(matrix[0])


def exact_cosine_top_indices(
    query: NDArray[np.floating],
    matrix: NDArray[np.floating],
    top_k: int,
) -> tuple[NDArray[np.int64], NDArray[np.float32]]:
    if top_k <= 0 or matrix.ndim != 2 or matrix.shape[0] == 0:
        return np.empty(0, dtype=np.int64), np.empty(0, dtype=np.float32)
    normalized_query = normalize_float32(query)
    candidates = np.asarray(matrix, dtype=np.float32)
    if candidates.shape[1] != normalized_query.size:
        raise ValueError("Query and passage embedding dimensions differ")
    scores = candidates @ normalized_query
    take = min(top_k, scores.size)
    if take == scores.size:
        indices = np.argsort(scores)[::-1]
    else:
        partition = np.argpartition(scores, -take)[-take:]
        indices = partition[np.argsort(scores[partition])[::-1]]
    typed_indices = np.asarray(indices, dtype=np.int64)
    return typed_indices, np.asarray(scores[typed_indices], dtype=np.float32)
