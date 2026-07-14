from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


SERVICE_ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=SERVICE_ROOT / ".env",
        env_prefix="RAG_",
        case_sensitive=False,
        extra="ignore",
    )

    app_env: Literal["development", "test", "production"] = "development"
    host: str = "127.0.0.1"
    port: int = Field(default=8001, ge=1, le=65535)
    log_level: str = "info"

    database_path: Path = SERVICE_ROOT / "data" / "rag.sqlite3"
    internal_api_key: SecretStr = SecretStr("")
    max_upload_bytes: int = Field(default=20 * 1024 * 1024, ge=1024)
    allowed_source_hosts: str = ""

    embedding_model: str = "intfloat/multilingual-e5-small"
    embedding_device: str = "cpu"
    embedding_batch_size: int = Field(default=32, ge=1, le=256)
    chunk_tokens: int = Field(default=384, ge=64, le=500)
    chunk_overlap_tokens: int = Field(default=64, ge=0, le=200)
    retrieval_top_k: int = Field(default=6, ge=1, le=20)
    retrieval_min_score: float = Field(default=0.25, ge=-1.0, le=1.0)

    gemini_api_key: SecretStr = SecretStr("")
    gemini_model: str = "gemini-2.5-flash"
    gemini_temperature: float = Field(default=0.15, ge=0.0, le=1.0)
    gemini_max_output_tokens: int = Field(default=1200, ge=128, le=4096)
    request_timeout_seconds: float = Field(default=45.0, ge=5.0, le=120.0)

    @model_validator(mode="after")
    def validate_security_and_chunking(self) -> "Settings":
        if self.chunk_overlap_tokens >= self.chunk_tokens:
            raise ValueError("RAG_CHUNK_OVERLAP_TOKENS must be smaller than RAG_CHUNK_TOKENS")
        if self.app_env == "production" and len(self.internal_api_key.get_secret_value()) < 32:
            raise ValueError("RAG_INTERNAL_API_KEY must contain at least 32 characters in production")
        if self.app_env == "production" and not self.gemini_api_key.get_secret_value():
            raise ValueError("RAG_GEMINI_API_KEY is required in production")
        if self.app_env == "production" and not self.source_host_allowlist:
            raise ValueError("RAG_ALLOWED_SOURCE_HOSTS is required in production")
        if not self.database_path.is_absolute():
            self.database_path = (SERVICE_ROOT / self.database_path).resolve()
        return self

    @property
    def source_host_allowlist(self) -> frozenset[str]:
        return frozenset(
            host.strip().lower().rstrip(".")
            for host in self.allowed_source_hosts.split(",")
            if host.strip()
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()