from __future__ import annotations

import threading
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from app.database import Database, deserialize_float32
from app.services.embedder import Embedder, exact_cosine_top_indices


@dataclass(frozen=True, slots=True)
class RetrievalHit:
    chunk_id: str
    source_id: str
    title: str
    canonical_url: str | None
    issuer: str | None
    jurisdiction: str | None
    content: str
    page_number: int | None
    score: float


@dataclass(frozen=True, slots=True)
class _ChunkMeta:
    chunk_id: str
    source_id: str
    title: str
    canonical_url: str | None
    issuer: str | None
    jurisdiction: str | None
    content: str
    page_number: int | None


class Retriever:
    def __init__(self, database: Database, embedder: Embedder) -> None:
        self.database = database
        self.embedder = embedder
        self._lock = threading.RLock()
        self._revision = -1
        self._matrix: NDArray[np.float32] = np.empty((0, 0), dtype=np.float32)
        self._metadata: list[_ChunkMeta] = []

    def _refresh_if_needed(self) -> None:
        revision = self.database.revision()
        with self._lock:
            if revision == self._revision:
                return
            with self.database.connect() as connection:
                rows = connection.execute(
                    """
                    SELECT c.id AS chunk_id, c.source_id, c.content, c.page_number,
                           c.embedding, c.embedding_dim, c.embedding_model,
                           s.title, s.canonical_url, s.issuer, s.jurisdiction
                    FROM chunks c
                    JOIN sources s ON s.id = c.source_id
                    WHERE s.publication_status = 'approved' AND s.deleted_at IS NULL
                    ORDER BY s.id, c.chunk_index
                    """
                ).fetchall()
            vectors: list[NDArray[np.float32]] = []
            metadata: list[_ChunkMeta] = []
            dimension: int | None = None
            for row in rows:
                if row["embedding_model"] != self.embedder.model_name:
                    continue
                vector = deserialize_float32(row["embedding"], int(row["embedding_dim"]))
                if dimension is None:
                    dimension = vector.size
                if vector.size != dimension:
                    raise RuntimeError("Corpus contains inconsistent embedding dimensions")
                vectors.append(vector)
                metadata.append(
                    _ChunkMeta(
                        chunk_id=row["chunk_id"],
                        source_id=row["source_id"],
                        title=row["title"],
                        canonical_url=row["canonical_url"],
                        issuer=row["issuer"],
                        jurisdiction=row["jurisdiction"],
                        content=row["content"],
                        page_number=row["page_number"],
                    )
                )
            self._matrix = (
                np.ascontiguousarray(np.vstack(vectors), dtype=np.float32)
                if vectors
                else np.empty((0, 0), dtype=np.float32)
            )
            self._metadata = metadata
            self._revision = revision

    def search(self, query: str, top_k: int, min_score: float) -> list[RetrievalHit]:
        self._refresh_if_needed()
        with self._lock:
            if not self._metadata:
                return []
            query_vector = self.embedder.encode_query(query)
            candidate_count = min(len(self._metadata), max(top_k * 4, top_k))
            indices, scores = exact_cosine_top_indices(
                query_vector, self._matrix, candidate_count
            )
            hits: list[RetrievalHit] = []
            per_source: dict[str, int] = {}
            for index, score_value in zip(indices.tolist(), scores.tolist(), strict=True):
                if score_value < min_score:
                    continue
                meta = self._metadata[index]
                if per_source.get(meta.source_id, 0) >= 2:
                    continue
                per_source[meta.source_id] = per_source.get(meta.source_id, 0) + 1
                hits.append(
                    RetrievalHit(
                        chunk_id=meta.chunk_id,
                        source_id=meta.source_id,
                        title=meta.title,
                        canonical_url=meta.canonical_url,
                        issuer=meta.issuer,
                        jurisdiction=meta.jurisdiction,
                        content=meta.content,
                        page_number=meta.page_number,
                        score=float(score_value),
                    )
                )
                if len(hits) == top_k:
                    break
            return hits
