from __future__ import annotations

import secrets

from fastapi import Header, HTTPException, status

from app.config import get_settings


async def require_internal_key(
    x_beka_rag_key: str | None = Header(default=None),
) -> None:
    expected = (
        get_settings()
        .internal_api_key
        .get_secret_value()
    )

    if (
        not expected
        or not x_beka_rag_key
        or not secrets.compare_digest(
            expected,
            x_beka_rag_key,
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        )