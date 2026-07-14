from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, Sequence

from app.services.parser import ParsedSection


class Tokenizer(Protocol):
    def encode(self, text: str, *, add_special_tokens: bool = False) -> list[int]: ...

    def decode(
        self,
        token_ids: Sequence[int],
        *,
        skip_special_tokens: bool = True,
        clean_up_tokenization_spaces: bool = True,
    ) -> str: ...


@dataclass(frozen=True, slots=True)
class TextChunk:
    text: str
    token_count: int
    page_number: int | None


class SlidingWindowChunker:
    def __init__(self, tokenizer: Tokenizer, chunk_tokens: int, overlap_tokens: int) -> None:
        if chunk_tokens <= 0:
            raise ValueError("chunk_tokens must be positive")
        if overlap_tokens < 0 or overlap_tokens >= chunk_tokens:
            raise ValueError("overlap_tokens must be non-negative and smaller than chunk_tokens")
        self.tokenizer = tokenizer
        self.chunk_tokens = chunk_tokens
        self.overlap_tokens = overlap_tokens

    def split(self, sections: list[ParsedSection]) -> list[TextChunk]:
        chunks: list[TextChunk] = []
        stride = self.chunk_tokens - self.overlap_tokens
        for section in sections:
            token_ids = self.tokenizer.encode(section.text, add_special_tokens=False)
            if not token_ids:
                continue
            for start in range(0, len(token_ids), stride):
                window = token_ids[start : start + self.chunk_tokens]
                text = self.tokenizer.decode(
                    window,
                    skip_special_tokens=True,
                    clean_up_tokenization_spaces=True,
                ).strip()
                if text:
                    chunks.append(
                        TextChunk(
                            text=text,
                            token_count=len(window),
                            page_number=section.page_number,
                        )
                    )
                if start + self.chunk_tokens >= len(token_ids):
                    break
        if not chunks:
            raise ValueError("No text chunks were produced")
        return chunks
