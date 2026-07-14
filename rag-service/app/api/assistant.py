from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import logging
import time
from datetime import UTC, datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, Response, status 
from fastapi.responses import StreamingResponse

from app.container import Container
from app.dependencies import get_container
from app.schemas import AssistantRequest, FeedbackRequest
from app.security import require_internal_key
from app.services.llm import GeneratorUnavailable


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/internal",
    tags=["assistant"],
    dependencies=[Depends(require_internal_key)],
)


NO_CONTEXT = {
    "en": "I could not find enough information in Beka's approved public sources to answer that. You can rephrase the question or contact the firm for general assistance.",
    "am": "ይህን ጥያቄ ለመመለስ በቂ መረጃ አላገኘሁም። ጥያቄውን በሌላ መንገድ ይጻፉ ወይም ለአጠቃላይ እገዛ ድርጅቱን ያነጋግሩ።",
    "om": "Gaaffii kana deebisuuf madda uummataa BEKA raggaasise keessatti odeeffannoo gahaa hin arganne. Gaafficha haala biraatiin gaafachuu ykn gargaarsa waliigalaaf dhaabbaticha qunnamuu dandeessu.",
}


def _sse(event: str, payload: object) -> bytes:
    data = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    return f"event: {event}\ndata: {data}\n\n".encode("utf-8")


def _session_hash(session_id: str, secret: str) -> str:
    return hmac.new(secret.encode(), session_id.encode(), hashlib.sha256).hexdigest()


def _log_query(
    container: Container,
    *,
    event_id: str,
    session_hash: str,
    locale: str,
    source_ids: list[str],
    outcome: str,
    latency_ms: int,
) -> None:
    with container.database.transaction() as connection:
        connection.execute(
            """
            INSERT INTO query_events (
              id, at, session_hash, locale, retrieved_source_ids, outcome, latency_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                event_id,
                datetime.now(UTC).isoformat(),
                session_hash,
                locale,
                json.dumps(source_ids),
                outcome,
                latency_ms,
            ),
        )


@router.post("/assistant")
async def assistant(
    payload: AssistantRequest,
    container: Container = Depends(get_container),
) -> StreamingResponse:
    async def event_stream():
        started = time.perf_counter()
        response_id = uuid4().hex
        secret = container.settings.internal_api_key.get_secret_value()
        session_hash = _session_hash(payload.session_id, secret)
        source_ids: list[str] = []
        outcome = "error"
        yield _sse("metadata", {"response_id": response_id, "locale": payload.locale})
        try:
            hits = await asyncio.to_thread(
                container.retriever.search,
                payload.message,
                container.settings.retrieval_top_k,
                container.settings.retrieval_min_score,
            )
            source_ids = list(dict.fromkeys(hit.source_id for hit in hits))
            if not hits:
                outcome = "no_context"
                yield _sse("token", {"text": NO_CONTEXT[payload.locale]})
                yield _sse("done", {"response_id": response_id})
                return

            async with asyncio.timeout(container.settings.request_timeout_seconds):
                async for text in container.generator.stream(
                    question=payload.message,
                    locale=payload.locale,
                    history=payload.history,
                    hits=hits,
                ):
                    yield _sse("token", {"text": text})

            for index, hit in enumerate(hits, start=1):
                yield _sse(
                    "citation",
                    {
                        "id": f"S{index}",
                        "source_id": hit.source_id,
                        "title": hit.title,
                        "url": hit.canonical_url,
                        "issuer": hit.issuer,
                        "jurisdiction": hit.jurisdiction,
                        "page": hit.page_number,
                        "score": round(hit.score, 4),
                    },
                )
            outcome = "answered"
            yield _sse("done", {"response_id": response_id})
        except GeneratorUnavailable:
            logger.error("Gemini generation is not configured")
            yield _sse("error", {"code": "generator_unavailable", "message": "The assistant is temporarily unavailable."})
        except TimeoutError:
            logger.warning("Assistant generation timed out")
            outcome = "timeout"
            yield _sse("error", {"code": "timeout", "message": "The response took too long. Please try again."})
        except asyncio.CancelledError:
            outcome = "cancelled"
            raise
        except Exception:
            logger.exception("Assistant request failed")
            yield _sse("error", {"code": "internal_error", "message": "The assistant could not complete this request."})
        finally:
            latency_ms = round((time.perf_counter() - started) * 1000)
            try:
                await asyncio.to_thread(
                    _log_query,
                    container,
                    event_id=response_id,
                    session_hash=session_hash,
                    locale=payload.locale,
                    source_ids=source_ids,
                    outcome=outcome,
                    latency_ms=latency_ms,
                )
            except Exception:
                logger.exception("Failed to write privacy-preserving query telemetry")

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-store, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post(
    "/assistant/feedback",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def feedback(
    payload: FeedbackRequest,
    container: Container = Depends(get_container),
) -> Response:
    secret = container.settings.internal_api_key.get_secret_value()

    with container.database.transaction() as connection:
        connection.execute(
            """
            INSERT INTO feedback (id, response_id, at, session_hash, rating, comment)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                uuid4().hex,
                payload.response_id,
                datetime.now(UTC).isoformat(),
                _session_hash(payload.session_id, secret),
                payload.rating,
                payload.comment,
            ),
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
