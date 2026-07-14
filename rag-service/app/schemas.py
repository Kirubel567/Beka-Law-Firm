from __future__ import annotations

from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    Field,
    HttpUrl,
    StringConstraints,
    field_validator,
)


Locale = Literal["en", "am", "om"]
SourceKind = Literal["website", "public_legal"]
PublicationStatus = Literal["pending", "approved", "rejected"]

NonBlank = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=1,
    ),
]


class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
            max_length=2000,
        ),
    ]


class AssistantRequest(BaseModel):
    message: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=2,
            max_length=2000,
        ),
    ]
    locale: Locale = "en"
    session_id: Annotated[
        str,
        StringConstraints(
            min_length=16,
            max_length=128,
        ),
    ]
    history: list[HistoryMessage] = Field(
        default_factory=list,
        max_length=6,
    )


class FeedbackRequest(BaseModel):
    response_id: Annotated[
        str,
        StringConstraints(
            min_length=16,
            max_length=64,
        ),
    ]
    session_id: Annotated[
        str,
        StringConstraints(
            min_length=16,
            max_length=128,
        ),
    ]
    rating: Literal[-1, 1]
    comment: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            max_length=500,
        ),
    ] | None = None


class WebsiteDocument(BaseModel):
    external_key: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=2,
            max_length=240,
        ),
    ]
    title: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=2,
            max_length=240,
        ),
    ]
    canonical_url: HttpUrl
    text: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=20,
            max_length=500_000,
        ),
    ]
    language: Literal["en"] = "en"


class WebsiteSyncRequest(BaseModel):
    actor: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
            max_length=80,
        ),
    ]
    documents: list[WebsiteDocument] = Field(
        min_length=1,
        max_length=100,
    )


class SourcePatch(BaseModel):
    actor: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
            max_length=80,
        ),
    ]
    publication_status: PublicationStatus | None = None
    title: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=2,
            max_length=240,
        ),
    ] | None = None
    canonical_url: HttpUrl | None = None
    issuer: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            max_length=160,
        ),
    ] | None = None
    jurisdiction: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            max_length=120,
        ),
    ] | None = None

    @field_validator(
        "issuer",
        "jurisdiction",
        mode="before",
    )
    @classmethod
    def empty_to_none(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return None

        return value


class SourceView(BaseModel):
    id: str
    kind: SourceKind
    title: str
    canonical_url: str | None
    issuer: str | None
    jurisdiction: str | None
    language: str
    publication_status: PublicationStatus
    media_type: str
    original_filename: str | None
    chunk_count: int
    created_at: str
    updated_at: str
    approved_at: str | None
    approved_by: str | None


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    corpus_revision: int
    approved_sources: int
    chunks: int
    embedding_model: str
    generator_configured: bool