from __future__ import annotations

from dataclasses import dataclass

from app.config import Settings
from app.database import Database
from app.services.embedder import Embedder
from app.services.ingestion import IngestionService
from app.services.llm import GeminiGenerator
from app.services.retriever import Retriever


@dataclass(frozen=True, slots=True)
class Container:
    settings: Settings
    database: Database
    embedder: Embedder
    retriever: Retriever
    ingestion: IngestionService
    generator: GeminiGenerator


def build_container(settings: Settings) -> Container:
    database = Database(settings.database_path)
    database.initialize()

    embedder = Embedder(
        settings.embedding_model,
        settings.embedding_device,
        settings.embedding_batch_size,
    )

    return Container(
        settings=settings,
        database=database,
        embedder=embedder,
        retriever=Retriever(
            database,
            embedder,
        ),
        ingestion=IngestionService(
            database,
            embedder,
            settings,
        ),
        generator=GeminiGenerator(settings),
    )