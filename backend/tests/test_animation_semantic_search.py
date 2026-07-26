import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.manual_search import build_embedding_index, search_manual_text


class ManualSearchTests(unittest.TestCase):
    def test_build_embedding_index_returns_vectors(self) -> None:
        chunks = [{"page": 1, "snippet": "Hydraulic hammer breakdown and repair steps."}]
        index, embeddings, vectorizer = build_embedding_index(chunks)

        self.assertEqual(embeddings.shape[0], 1)
        self.assertIsNotNone(vectorizer)
        self.assertTrue(index is None or hasattr(index, "search"))

    def test_search_manual_text_returns_results(self) -> None:
        chunks = [{"page": 1, "snippet": "Hydraulic hammer breakdown and repair steps."}]
        build_embedding_index(chunks)
        results = search_manual_text("hydraulic hammer", "hydraulic hammer", top_k=1)
        self.assertTrue(results)


if __name__ == "__main__":
    unittest.main()
