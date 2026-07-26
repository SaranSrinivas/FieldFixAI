import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path('backend').resolve()))
suite = unittest.defaultTestLoader.loadTestsFromName('backend.tests.test_animation_semantic_search')
result = unittest.TextTestRunner(verbosity=2).run(suite)
raise SystemExit(0 if result.wasSuccessful() else 1)
