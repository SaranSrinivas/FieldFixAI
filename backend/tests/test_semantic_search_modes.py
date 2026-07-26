import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.manual_search import search_catalog


class SemanticCatalogSearchTests(unittest.TestCase):
    def test_top_k_semantic_search_returns_results(self) -> None:
        results = search_catalog("hydraulic hammer", "top_k", db_path=Path("manuals/manuals.sqlite"), top_k=3)
        self.assertTrue(results)
        self.assertTrue(all("label" in item for item in results))

    def test_component_semantic_search_returns_component_results(self) -> None:
        results = search_catalog("gearbox", "component", db_path=Path("manuals/manuals.sqlite"), top_k=3)
        self.assertTrue(results)
        self.assertTrue(any("Gearbox" in item["label"] for item in results))

    def test_machine_semantic_search_returns_machine_results(self) -> None:
        results = search_catalog("crusher", "machine", db_path=Path("manuals/manuals.sqlite"), top_k=3)
        self.assertTrue(results)
        self.assertTrue(any("RockMauler" in item["label"] for item in results))

    def test_animation_semantic_search_returns_animation_results(self) -> None:
        results = search_catalog("breakdown", "animation", db_path=Path("manuals/manuals.sqlite"), top_k=3)
        self.assertTrue(results)
        self.assertTrue(any(item.get("kind") == "animation" for item in results))
