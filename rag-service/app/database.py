from __future__ import annotations

import math
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

import numpy as np
from numpy.typing import NDArray


SCHEMA = """
CREATE TABLE IF NOT EXISTS corpus_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT OR IGNORE INTO corpus_meta (key, value)
VALUES ('revision', '0');

CREATE TABLE IF NOT EXISTS sources (
  id                 TEXT PRIMARY KEY,
  external_key       TEXT UNIQUE,
  kind               TEXT NOT NULL
    CHECK (kind IN ('website','public_legal')),
  title              TEXT NOT NULL,
  canonical_url      TEXT,
  issuer             TEXT,
  jurisdiction       TEXT,
  language           TEXT NOT NULL DEFAULT 'en'
    CHECK (language IN ('en')),
  publication_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (
      publication_status IN ('pending','approved','rejected')
    ),
  media_type         TEXT NOT NULL,
  original_filename  TEXT,
  content_sha256     TEXT NOT NULL,
  content_text       TEXT NOT NULL,
  chunk_count        INTEGER NOT NULL DEFAULT 0,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL,
  approved_at        TEXT,
  approved_by        TEXT,
  deleted_at         TEXT
);
CREATE INDEX IF NOT EXISTS idx_sources_publication
  ON sources (publication_status, deleted_at);

CREATE TABLE IF NOT EXISTS chunks (
  id              TEXT PRIMARY KEY,
  source_id       TEXT NOT NULL
    REFERENCES sources(id) ON DELETE CASCADE,
  chunk_index     INTEGER NOT NULL,
  content         TEXT NOT NULL,
  token_count     INTEGER NOT NULL,
  page_number     INTEGER,
  embedding       BLOB NOT NULL,
  embedding_dim   INTEGER NOT NULL,
  embedding_model TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  UNIQUE (source_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS idx_chunks_source
  ON chunks (source_id, chunk_index);

CREATE TABLE IF NOT EXISTS query_events (
  id                   TEXT PRIMARY KEY,
  at                   TEXT NOT NULL,
  session_hash         TEXT NOT NULL,
  locale               TEXT NOT NULL
    CHECK (locale IN ('en','am','om')),
  retrieved_source_ids TEXT NOT NULL DEFAULT '[]',
  outcome              TEXT NOT NULL,
  latency_ms           INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_query_events_at
  ON query_events (at DESC);

CREATE TABLE IF NOT EXISTS feedback (
  id           TEXT PRIMARY KEY,
  response_id  TEXT NOT NULL,
  at           TEXT NOT NULL,
  session_hash TEXT NOT NULL,
  rating       INTEGER NOT NULL CHECK (rating IN (-1, 1)),
  comment      TEXT
);

CREATE TABLE IF NOT EXISTS audit_events (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  at        TEXT NOT NULL,
  actor     TEXT NOT NULL,
  action    TEXT NOT NULL,
  source_id TEXT,
  detail    TEXT
);
CREATE INDEX IF NOT EXISTS idx_rag_audit_at
  ON audit_events (at DESC);
"""


def serialize_float32(
    vector: NDArray[np.floating],
) -> tuple[bytes, int]:
    array = np.asarray(vector, dtype="<f4")

    if array.ndim != 1 or array.size == 0:
        raise ValueError(
            "Embedding must be a non-empty one-dimensional array"
        )

    if not np.isfinite(array).all():
        raise ValueError(
            "Embedding contains a non-finite value"
        )

    contiguous = np.ascontiguousarray(array)

    return contiguous.tobytes(order="C"), int(contiguous.size)


def deserialize_float32(
    blob: bytes,
    dimension: int,
) -> NDArray[np.float32]:
    item_size = np.dtype("<f4").itemsize

    if dimension <= 0 or len(blob) != dimension * item_size:
        raise ValueError(
            "Embedding BLOB length does not match its stored dimension"
        )

    vector = (
        np.frombuffer(
            blob,
            dtype="<f4",
            count=dimension,
        )
        .astype(np.float32, copy=True)
    )

    if not np.isfinite(vector).all():
        raise ValueError(
            "Stored embedding contains a non-finite value"
        )

    return vector


def normalize_float32(
    vector: NDArray[np.floating],
) -> NDArray[np.float32]:
    array = np.asarray(vector, dtype=np.float32)
    norm = float(np.linalg.norm(array))

    if not math.isfinite(norm) or norm <= 0.0:
        raise ValueError(
            "Cannot normalize an empty or zero-length embedding"
        )

    return np.ascontiguousarray(
        array / norm,
        dtype=np.float32,
    )


class Database:
    def __init__(self, path: Path) -> None:
        self.path = path

    def initialize(self) -> None:
        self.path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        with self.connect() as connection:
            connection.executescript(SCHEMA)

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        connection = sqlite3.connect(
            self.path,
            timeout=5.0,
        )

        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA busy_timeout = 5000")
        connection.execute("PRAGMA journal_mode = WAL")

        try:
            yield connection
        finally:
            connection.close()

    @contextmanager
    def transaction(self) -> Iterator[sqlite3.Connection]:
        with self.connect() as connection:
            try:
                connection.execute("BEGIN IMMEDIATE")
                yield connection
                connection.commit()
            except Exception:
                connection.rollback()
                raise

    def revision(
        self,
        connection: sqlite3.Connection | None = None,
    ) -> int:
        if connection is not None:
            row = connection.execute(
                """
                SELECT value
                FROM corpus_meta
                WHERE key = 'revision'
                """
            ).fetchone()

            return int(row["value"]) if row else 0

        with self.connect() as own_connection:
            return self.revision(own_connection)

    def bump_revision(
        self,
        connection: sqlite3.Connection,
    ) -> int:
        current = self.revision(connection) + 1

        connection.execute(
            """
            INSERT INTO corpus_meta (key, value)
            VALUES ('revision', ?)
            ON CONFLICT(key)
            DO UPDATE SET value = excluded.value
            """,
            (str(current),),
        )

        return current