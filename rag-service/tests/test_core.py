from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import numpy as np

from app.database import (
    Database,
    deserialize_float32,
    normalize_float32,
    serialize_float32,
)
from app.services.chunker import SlidingWindowChunker
from app.services.parser import ParsedSection, parse_document


class WhitespaceTokenizer:
    def __init__(self) -> None:
        self.words: list[str] = []

    def encode(self, text: str, *, add_special_tokens: bool = False) -> list[int]:
        del add_special_tokens
        self.words = text.split()
        return list(range(len(self.words)))

    def decode(
        self,
        token_ids,
        *,
        skip_special_tokens: bool = True,
        clean_up_tokenization_spaces: bool = True,
    ) -> str:
        del skip_special_tokens, clean_up_tokenization_spaces
        return " ".join(self.words[index] for index in token_ids)


class DatabaseTests(unittest.TestCase):
    def test_float32_blob_round_trip(self) -> None:
        original = normalize_float32(np.array([3.0, 4.0, 0.0], dtype=np.float64))
        blob, dimension = serialize_float32(original)
        restored = deserialize_float32(blob, dimension)
        np.testing.assert_allclose(restored, original, rtol=0, atol=1e-7)
        self.assertEqual(restored.dtype, np.float32)

    def test_schema_and_revision(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            database = Database(Path(directory) / "rag.sqlite3")
            database.initialize()
            self.assertEqual(database.revision(), 0)
            with database.transaction() as connection:
                self.assertEqual(database.bump_revision(connection), 1)
            self.assertEqual(database.revision(), 1)


class ParserAndChunkerTests(unittest.TestCase):
    def test_utf8_text_parser_normalizes_whitespace(self) -> None:
        sections = parse_document("One  two\r\n\r\n\r\nthree".encode(), "source.txt")
        self.assertEqual(sections[0].text, "One two\n\nthree")

    def test_sliding_window_overlap(self) -> None:
        chunker = SlidingWindowChunker(WhitespaceTokenizer(), chunk_tokens=4, overlap_tokens=1)
        chunks = chunker.split([ParsedSection("zero one two three four five six")])
        self.assertEqual([chunk.text for chunk in chunks], ["zero one two three", "three four five six"])
        self.assertEqual([chunk.token_count for chunk in chunks], [4, 4])


if __name__ == "__main__":
    unittest.main()
