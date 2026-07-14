from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response,  UploadFile, status

from app.container import Container
from app.dependencies import get_container
from app.schemas import SourcePatch, SourceView, WebsiteSyncRequest
from app.security import require_internal_key
from app.services.ingestion import SourceValidationError
from app.services.parser import DocumentParseError


router = APIRouter(
    prefix="/internal/admin",
    tags=["admin"],
    dependencies=[Depends(require_internal_key)],
)


@router.get("/sources", response_model=list[SourceView])
async def list_sources(container: Container = Depends(get_container)) -> list[SourceView]:
    rows = await asyncio.to_thread(container.ingestion.list_sources)
    return [SourceView.model_validate(row) for row in rows]


@router.post("/sources/upload", response_model=SourceView, status_code=status.HTTP_201_CREATED)
async def upload_source(
    file: UploadFile = File(...),
    title: str = Form(..., min_length=2, max_length=240),
    actor: str = Form(..., min_length=1, max_length=80),
    canonical_url: str | None = Form(default=None, max_length=2000),
    issuer: str | None = Form(default=None, max_length=160),
    jurisdiction: str | None = Form(default=None, max_length=120),
    container: Container = Depends(get_container),
) -> SourceView:
    if not file.filename:
        raise HTTPException(status_code=400, detail="A filename is required")
    data = await file.read(container.settings.max_upload_bytes + 1)
    await file.close()
    try:
        source_id = await asyncio.to_thread(
            container.ingestion.ingest_upload,
            data=data,
            filename=file.filename,
            title=title,
            canonical_url=canonical_url,
            issuer=issuer,
            jurisdiction=jurisdiction,
            actor=actor,
        )
    except (SourceValidationError, DocumentParseError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    rows = await asyncio.to_thread(container.ingestion.list_sources)
    source = next(row for row in rows if row["id"] == source_id)
    return SourceView.model_validate(source)


@router.post("/sources/sync-site")
async def sync_site(
    payload: WebsiteSyncRequest,
    container: Container = Depends(get_container),
) -> dict[str, object]:
    try:
        source_ids = await asyncio.to_thread(
            container.ingestion.sync_website,
            payload.documents,
            payload.actor,
        )
    except (SourceValidationError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"synced": len(source_ids), "source_ids": source_ids}


@router.patch("/sources/{source_id}", response_model=SourceView)
async def patch_source(
    source_id: str,
    payload: SourcePatch,
    container: Container = Depends(get_container),
) -> SourceView:
    try:
        found = await asyncio.to_thread(container.ingestion.patch_source, source_id, payload)
    except SourceValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    if not found:
        raise HTTPException(status_code=404, detail="Source not found or no changes supplied")
    rows = await asyncio.to_thread(container.ingestion.list_sources)
    source = next(row for row in rows if row["id"] == source_id)
    return SourceView.model_validate(source)


@router.post("/sources/{source_id}/reindex", response_model=SourceView)
async def reindex_source(
    source_id: str,
    actor: str = Form(..., min_length=1, max_length=80),
    container: Container = Depends(get_container),
) -> SourceView:
    found = await asyncio.to_thread(container.ingestion.reindex_source, source_id, actor)
    if not found:
        raise HTTPException(status_code=404, detail="Source not found")
    rows = await asyncio.to_thread(container.ingestion.list_sources)
    source = next(row for row in rows if row["id"] == source_id)
    return SourceView.model_validate(source)


@router.delete(
    "/sources/{source_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def delete_source(
    source_id: str,
    actor: str,
    container: Container = Depends(get_container),
) -> Response:
    if not actor.strip() or len(actor) > 80:
        raise HTTPException(status_code=422, detail="A valid actor is required")

    found = await asyncio.to_thread(
        container.ingestion.delete_source,
        source_id,
        actor,
    )

    if not found:
        raise HTTPException(status_code=404, detail="Source not found")

    return Response(status_code=status.HTTP_204_NO_CONTENT)