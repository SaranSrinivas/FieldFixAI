import re
import sqlite3
from pathlib import Path
from typing import Any, Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

SAFETY_KEYWORDS = (
    "ppe", "lockout", "tagout", "safety", "caution", "hazard", "danger",
    "protective", "certified", "clearance", "power off", "de-energize",
)
FIX_KEYWORDS = (
    "replace", "tighten", "lubricate", "clean", "reset", "restart",
    "reposition", "grease", "recalibrat", "realign", "seal",
)
DIAGNOSTIC_KEYWORDS = (
    "inspect", "check", "measure", "test", "verify", "monitor",
    "diagnos", "scan", "observe",
)

LOW_RELEVANCE_CUTOFF = 0.15
MAX_ITEMS_PER_BUCKET = 4


def _empty_buckets() -> dict[str, list[str]]:
    return {"causes": [], "temporary_fixes": [], "diagnostics": [], "safety_notes": []}


def _bucket_for_sentence(sentence: str) -> str:
    lowered = sentence.lower()
    if any(keyword in lowered for keyword in SAFETY_KEYWORDS):
        return "safety_notes"
    if any(keyword in lowered for keyword in FIX_KEYWORDS):
        return "temporary_fixes"
    if any(keyword in lowered for keyword in DIAGNOSTIC_KEYWORDS):
        return "diagnostics"
    return "causes"


def _collect_candidates(db_path: Path, extra_snippets: Optional[list[str]] = None) -> list[str]:
    candidates: list[str] = [text for text in (extra_snippets or []) if text and text.strip()]

    if not db_path.exists():
        return candidates

    with sqlite3.connect(db_path) as conn:
        for issue, cause, resolution in conn.execute(
            "SELECT issue, cause, resolution FROM troubleshooting"
        ).fetchall():
            text = " ".join(filter(None, [issue, cause, resolution])).strip()
            if text:
                candidates.append(text)

        for (snippet,) in conn.execute("SELECT snippet FROM chunks").fetchall():
            if snippet and snippet.strip():
                candidates.append(snippet)

    return candidates


def generate_suggestions(
    issue: str,
    db_path: Path,
    extra_snippets: Optional[list[str]] = None,
    top_k: int = 6,
) -> dict[str, list[str]]:
    buckets = _empty_buckets()

    if not issue or not issue.strip():
        return buckets

    candidates = _collect_candidates(db_path, extra_snippets)
    if not candidates:
        return buckets

    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    candidate_matrix = vectorizer.fit_transform(candidates)
    issue_vector = vectorizer.transform([issue])
    scores = candidate_matrix.dot(issue_vector.T).toarray().ravel()

    ranked_indices = np.argsort(scores)[::-1][:top_k].tolist()

    seen_sentences: set[str] = set()
    for idx in ranked_indices:
        if float(scores[idx]) <= LOW_RELEVANCE_CUTOFF:
            continue

        for sentence in re.split(r"(?<=[.!?])\s+", candidates[idx]):
            cleaned = sentence.strip()
            word_count = len(cleaned.split())
            if word_count < 4 or word_count > 40:
                continue

            key = cleaned.lower()
            if key in seen_sentences:
                continue
            seen_sentences.add(key)

            bucket = _bucket_for_sentence(cleaned)
            if len(buckets[bucket]) < MAX_ITEMS_PER_BUCKET:
                buckets[bucket].append(cleaned)

    return buckets
