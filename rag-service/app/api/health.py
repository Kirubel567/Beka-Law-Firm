from __future__ import annotations

from fastapi import APIRouter, Depends

from app.container import Container
from app.dependencies import get_container
from app.schemas import HealthResponse


router = APIRouter(tags=["health"])


@router.get("/healthz", response_model=HealthResponse)
async def health(container: Container = Depends(get_container)) -> HealthResponse:
    with container.database.connect() as connection:
        source_count = connection.execute(
            "SELECT COUNT(*) AS count FROM sources WHERE publication_status = 'approved' AND deleted_at IS NULL"
        ).fetchone()["count"]
        chunk_count = connection.execute(
            """
            SELECT COUNT(*) AS count FROM chunks c JOIN sources s ON s.id = c.source_id
            WHERE s.publication_status = 'approved' AND s.deleted_at IS NULL
            """
        ).fetchone()["count"]
    return HealthResponse(
        corpus_revision=container.database.revision(),
        approved_sources=int(source_count),
        chunks=int(chunk_count),
        embedding_model=container.settings.embedding_model,
        generator_configured=bool(container.settings.gemini_api_key.get_secret_value()),
    )
