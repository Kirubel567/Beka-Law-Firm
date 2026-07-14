from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api import admin, assistant, health
from app.config import get_settings
from app.container import build_container


@asynccontextmanager
async def lifespan(app: FastAPI):
    
    app.state.container = build_container(get_settings())
    yield
    client = app.state.container.generator._client
    if client is not None:
        await client.aio.aclose()
        client.close()


app = FastAPI(
    title="Beka Legal Information Assistant",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    lifespan=lifespan,
)
app.include_router(health.router)
app.include_router(assistant.router)
app.include_router(admin.router)