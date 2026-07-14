from __future__ import annotations

import hashlib
import json
import mimetypes
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urlparse
from uuid import uuid4

from app.config import Settings
from app.database import Database, serialize_float32
from app.schemas import SourcePatch, WebsiteDocument
from app.services.chunker import SlidingWindowChunker
from app.services.embedder import Embedder
from app.services.parser import ParsedSection, parse_document, sections_text


class SourceValidationError(ValueError):
    pass


def utc_now() -> str:
    return datetime.now(UTC).isoformat()


class IngestionService:
    def __init__(self, database: Database, embedder: Embedder, settings: Settings) -> None:
        self.database = database
        self.embedder = embedder
        self.settings = settings

    def _validate_url(self, value: str | None) -> str | None:
        if not value:
            return None
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            raise SourceValidationError("Canonical URL must be an absolute HTTP or HTTPS URL")
        host = parsed.hostname.lower().rstrip(".")
        allowlist = self.settings.source_host_allowlist
        if allowlist and not any(host == allowed or host.endswith(f".{allowed}") for allowed in allowlist):
            raise SourceValidationError(f"Source host '{host}' is not in the configured allowlist")
        return value

    def _prepare_chunks(self, sections: list[ParsedSection]):
        chunker = SlidingWindowChunker(
            self.embedder.tokenizer,
            self.settings.chunk_tokens,
            self.settings.chunk_overlap_tokens,
        )
        chunks = chunker.split(sections)
        embeddings = self.embedder.encode_passages([chunk.text for chunk in chunks])
        if embeddings.shape[0] != len(chunks):
            raise RuntimeError("Embedding count does not match chunk count")
        return chunks, embeddings

    def _write_source(
        self,
        *,
        source_id: str,
        external_key: str | None,
        kind: str,
        title: str,
        canonical_url: str | None,
        issuer: str | None,
        jurisdiction: str | None,
        media_type: str,
        original_filename: str | None,
        content_sha256: str,
        content_text: str,
        sections: list[ParsedSection],
        publication_status: str,
        actor: str,
        action: str,
    ) -> str:
        chunks, embeddings = self._prepare_chunks(sections)
        timestamp = utc_now()
        approved_at = timestamp if publication_status == "approved" else None
        approved_by = actor if publication_status == "approved" else None
        with self.database.transaction() as connection:
            existing = connection.execute(
                "SELECT id, created_at FROM sources WHERE id = ?", (source_id,)
            ).fetchone()
            created_at = existing["created_at"] if existing else timestamp
            connection.execute(
                """
                INSERT INTO sources (
                  id, external_key, kind, title, canonical_url, issuer, jurisdiction,
                  language, publication_status, media_type, original_filename,
                  content_sha256, content_text, chunk_count, created_at, updated_at,
                  approved_at, approved_by, deleted_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'en', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
                ON CONFLICT(id) DO UPDATE SET
                  external_key = excluded.external_key,
                  kind = excluded.kind,
                  title = excluded.title,
                  canonical_url = excluded.canonical_url,
                  issuer = excluded.issuer,
                  jurisdiction = excluded.jurisdiction,
                  publication_status = excluded.publication_status,
                  media_type = excluded.media_type,
                  original_filename = excluded.original_filename,
                  content_sha256 = excluded.content_sha256,
                  content_text = excluded.content_text,
                  chunk_count = excluded.chunk_count,
                  updated_at = excluded.updated_at,
                  approved_at = excluded.approved_at,
                  approved_by = excluded.approved_by,
                  deleted_at = NULL
                """,
                (
                    source_id,
                    external_key,
                    kind,
                    title.strip(),
                    canonical_url,
                    issuer.strip() if issuer else None,
                    jurisdiction.strip() if jurisdiction else None,
                    publication_status,
                    media_type,
                    original_filename,
                    content_sha256,
                    content_text,
                    len(chunks),
                    created_at,
                    timestamp,
                    approved_at,
                    approved_by,
                ),
            )
            connection.execute("DELETE FROM chunks WHERE source_id = ?", (source_id,))
            for index, (chunk, vector) in enumerate(zip(chunks, embeddings, strict=True)):
                blob, dimension = serialize_float32(vector)
                connection.execute(
                    """
                    INSERT INTO chunks (
                      id, source_id, chunk_index, content, token_count, page_number,
                      embedding, embedding_dim, embedding_model, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        uuid4().hex,
                        source_id,
                        index,
                        chunk.text,
                        chunk.token_count,
                        chunk.page_number,
                        blob,
                        dimension,
                        self.embedder.model_name,
                        timestamp,
                    ),
                )
            connection.execute(
                "INSERT INTO audit_events (at, actor, action, source_id, detail) VALUES (?, ?, ?, ?, ?)",
                (timestamp, actor, action, source_id, json.dumps({"chunks": len(chunks)})),
            )
            self.database.bump_revision(connection)
        return source_id

    def ingest_upload(
        self,
        *,
        data: bytes,
        filename: str,
        title: str,
        canonical_url: str | None,
        issuer: str | None,
        jurisdiction: str | None,
        actor: str,
    ) -> str:
        if len(data) > self.settings.max_upload_bytes:
            raise SourceValidationError(
                f"File exceeds the {self.settings.max_upload_bytes // (1024 * 1024)} MB limit"
            )
        if not title.strip():
            raise SourceValidationError("Title is required")
        safe_name = Path(filename).name
        sections = parse_document(data, safe_name)
        content_text = sections_text(sections)
        media_type = mimetypes.guess_type(safe_name)[0] or "application/octet-stream"
        return self._write_source(
            source_id=uuid4().hex,
            external_key=None,
            kind="public_legal",
            title=title,
            canonical_url=self._validate_url(canonical_url),
            issuer=issuer,
            jurisdiction=jurisdiction,
            media_type=media_type,
            original_filename=safe_name,
            content_sha256=hashlib.sha256(data).hexdigest(),
            content_text=content_text,
            sections=sections,
            publication_status="pending",
            actor=actor,
            action="source.upload",
        )

    def sync_website(self, documents: list[WebsiteDocument], actor: str) -> list[str]:
        source_ids: list[str] = []
        for document in documents:
            canonical_url = self._validate_url(str(document.canonical_url))
            digest = hashlib.sha256(document.text.encode("utf-8")).hexdigest()
            with self.database.connect() as connection:
                existing = connection.execute(
                    "SELECT id, content_sha256, publication_status FROM sources WHERE external_key = ?",
                    (document.external_key,),
                ).fetchone()
            if existing and existing["content_sha256"] == digest and existing["publication_status"] == "approved":
                with self.database.transaction() as connection:
                    connection.execute(
                        "UPDATE sources SET title = ?, canonical_url = ?, updated_at = ?, deleted_at = NULL WHERE id = ?",
                        (document.title, canonical_url, utc_now(), existing["id"]),
                    )
                    connection.execute(
                        "INSERT INTO audit_events (at, actor, action, source_id, detail) VALUES (?, ?, ?, ?, ?)",
                        (utc_now(), actor, "website.sync.unchanged", existing["id"], None),
                    )
                    self.database.bump_revision(connection)
                source_ids.append(existing["id"])
                continue
            source_id = existing["id"] if existing else uuid4().hex
            source_ids.append(
                self._write_source(
                    source_id=source_id,
                    external_key=document.external_key,
                    kind="website",
                    title=document.title,
                    canonical_url=canonical_url,
                    issuer="Belay Ketema & Partners LLP",
                    jurisdiction="Ethiopia",
                    media_type="text/plain",
                    original_filename=None,
                    content_sha256=digest,
                    content_text=document.text,
                    sections=[ParsedSection(text=document.text)],
                    publication_status="approved",
                    actor=actor,
                    action="website.sync",
                )
            )
        incoming_keys = {document.external_key for document in documents}
        with self.database.transaction() as connection:
            current_rows = connection.execute(
                "SELECT id, external_key FROM sources WHERE kind = 'website' AND deleted_at IS NULL"
            ).fetchall()
            removed = [row for row in current_rows if row["external_key"] not in incoming_keys]
            for row in removed:
                connection.execute(
                    "UPDATE sources SET deleted_at = ?, updated_at = ? WHERE id = ?",
                    (utc_now(), utc_now(), row["id"]),
                )
                connection.execute("DELETE FROM chunks WHERE source_id = ?", (row["id"],))
                connection.execute(
                    "INSERT INTO audit_events (at, actor, action, source_id) VALUES (?, ?, 'website.sync.remove', ?)",
                    (utc_now(), actor, row["id"]),
                )
            if removed:
                self.database.bump_revision(connection)
        return source_ids

    def list_sources(self) -> list[dict[str, object]]:
        with self.database.connect() as connection:
            rows = connection.execute(
                """
                SELECT id, kind, title, canonical_url, issuer, jurisdiction, language,
                       publication_status, media_type, original_filename, chunk_count,
                       created_at, updated_at, approved_at, approved_by
                FROM sources WHERE deleted_at IS NULL ORDER BY updated_at DESC
                """
            ).fetchall()
        return [dict(row) for row in rows]

    def patch_source(self, source_id: str, patch: SourcePatch) -> bool:
        assignments: list[str] = []
        values: list[object] = []
        if patch.title is not None:
            assignments.append("title = ?")
            values.append(patch.title)
        if patch.canonical_url is not None:
            assignments.append("canonical_url = ?")
            values.append(self._validate_url(str(patch.canonical_url)))
        if patch.issuer is not None:
            assignments.append("issuer = ?")
            values.append(patch.issuer)
        if patch.jurisdiction is not None:
            assignments.append("jurisdiction = ?")
            values.append(patch.jurisdiction)
        if patch.publication_status is not None:
            assignments.append("publication_status = ?")
            values.append(patch.publication_status)
            assignments.extend(["approved_at = ?", "approved_by = ?"])
            if patch.publication_status == "approved":
                values.extend([utc_now(), patch.actor])
            else:
                values.extend([None, None])
        if not assignments:
            return False
        assignments.append("updated_at = ?")
        values.append(utc_now())
        values.append(source_id)
        with self.database.transaction() as connection:
            exists = connection.execute(
                "SELECT 1 FROM sources WHERE id = ? AND deleted_at IS NULL", (source_id,)
            ).fetchone()
            if not exists:
                return False
            connection.execute(
                f"UPDATE sources SET {', '.join(assignments)} WHERE id = ?", values
            )
            connection.execute(
                "INSERT INTO audit_events (at, actor, action, source_id, detail) VALUES (?, ?, ?, ?, ?)",
                (utc_now(), patch.actor, "source.update", source_id, patch.model_dump_json()),
            )
            self.database.bump_revision(connection)
        return True

    def delete_source(self, source_id: str, actor: str) -> bool:
        with self.database.transaction() as connection:
            cursor = connection.execute(
                "UPDATE sources SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL",
                (utc_now(), utc_now(), source_id),
            )
            if cursor.rowcount == 0:
                return False
            connection.execute("DELETE FROM chunks WHERE source_id = ?", (source_id,))
            connection.execute(
                "INSERT INTO audit_events (at, actor, action, source_id) VALUES (?, ?, 'source.delete', ?)",
                (utc_now(), actor, source_id),
            )
            self.database.bump_revision(connection)
        return True

    def reindex_source(self, source_id: str, actor: str) -> bool:
        with self.database.connect() as connection:
            row = connection.execute(
                "SELECT * FROM sources WHERE id = ? AND deleted_at IS NULL", (source_id,)
            ).fetchone()
        if not row:
            return False
        self._write_source(
            source_id=row["id"],
            external_key=row["external_key"],
            kind=row["kind"],
            title=row["title"],
            canonical_url=row["canonical_url"],
            issuer=row["issuer"],
            jurisdiction=row["jurisdiction"],
            media_type=row["media_type"],
            original_filename=row["original_filename"],
            content_sha256=row["content_sha256"],
            content_text=row["content_text"],
            sections=[ParsedSection(text=row["content_text"])],
            publication_status=row["publication_status"],
            actor=actor,
            action="source.reindex",
        )
        return True