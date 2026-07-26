import io
import json
import re
import sqlite3
import uuid
from pathlib import Path
from typing import Any

import numpy as np
from pdfminer.high_level import extract_text
from sklearn.feature_extraction.text import HashingVectorizer, TfidfVectorizer
from sklearn.preprocessing import normalize


ROOT_DIR = Path(__file__).resolve().parents[2]

SEED_SYMPTOMS = [
    "hydraulic pressure loss",
    "unusual vibration",
    "overheating motor",
    "gearbox noise",
    "hose leaking fluid",
    "engine won't start",
    "warning light on",
    "slow response time",
    "excessive fuel consumption",
    "control panel not responding",
    "bearing failure",
    "loss of power",
    "electrical short",
    "sensor reading incorrect",
    "belt slipping",
]

try:
    import faiss
except ImportError:  # pragma: no cover - exercised in environments without faiss
    faiss = None


def _resolve_db_path(db_path: str | Path | None) -> Path:
    if db_path is None:
        return ROOT_DIR / "manuals" / "manuals.sqlite"

    path = Path(db_path)
    if not path.is_absolute():
        return ROOT_DIR / path
    return path


def _normalize_search_text(value: Any) -> str:
    if value is None:
        return ""
    return " ".join(re.findall(r"[a-z0-9]+", str(value).lower()))


def extract_pdf_text(file_bytes: bytes) -> str:
    with io.BytesIO(file_bytes) as stream:
        return extract_text(stream) or ""


def _ensure_column(conn: sqlite3.Connection, table: str, column: str, ddl: str) -> None:
    existing = {row[1] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()}
    if column not in existing:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {ddl}")


def init_vector_db(db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS manuals ("
            "id INTEGER PRIMARY KEY, filename TEXT UNIQUE, text TEXT, machine_id INTEGER, "
            "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
        )
        _ensure_column(conn, "manuals", "machine_id", "machine_id INTEGER")
        _ensure_column(conn, "manuals", "source_type", "source_type TEXT DEFAULT 'manual'")
        _ensure_column(conn, "manuals", "title", "title TEXT")
        conn.execute(
            "CREATE TABLE IF NOT EXISTS chunks ("
            "id INTEGER PRIMARY KEY, manual_id INTEGER, page INTEGER, snippet TEXT, embedding_json TEXT, "
            "FOREIGN KEY(manual_id) REFERENCES manuals(id))"
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_chunks_manual_id ON chunks(manual_id)")


def init_manual_metadata_db(db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(db_path) as conn:
        conn.executescript(
            "CREATE TABLE IF NOT EXISTS manual_metadata ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT,"
            "model TEXT NOT NULL,"
            "name TEXT NOT NULL,"
            "version TEXT DEFAULT '1.0',"
            "category TEXT,"
            "created_at TEXT DEFAULT CURRENT_TIMESTAMP"
            ");"
            "CREATE TABLE IF NOT EXISTS sections ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT,"
            "manual_id INTEGER NOT NULL,"
            "section_type TEXT NOT NULL,"
            "content TEXT NOT NULL,"
            "FOREIGN KEY (manual_id) REFERENCES manual_metadata(id)"
            ");"
            "CREATE TABLE IF NOT EXISTS troubleshooting ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT,"
            "manual_id INTEGER NOT NULL,"
            "issue TEXT NOT NULL,"
            "cause TEXT,"
            "resolution TEXT NOT NULL,"
            "FOREIGN KEY (manual_id) REFERENCES manual_metadata(id)"
            ");"
            "CREATE VIRTUAL TABLE IF NOT EXISTS troubleshooting_search USING fts5("
            "issue, cause, resolution, manual_id UNINDEXED"
            ");"
            "CREATE TABLE IF NOT EXISTS bom ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT,"
            "manual_id INTEGER NOT NULL,"
            "part_name TEXT NOT NULL,"
            "part_number TEXT NOT NULL,"
            "description TEXT,"
            "FOREIGN KEY (manual_id) REFERENCES manual_metadata(id)"
            ");"
            "CREATE VIRTUAL TABLE IF NOT EXISTS bom_search USING fts5("
            "part_name, part_number, description, manual_id UNINDEXED"
            ");"
            "CREATE TABLE IF NOT EXISTS procedures ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT,"
            "manual_id INTEGER NOT NULL,"
            "procedure_type TEXT NOT NULL,"
            "step_number INTEGER NOT NULL,"
            "step_text TEXT NOT NULL,"
            "FOREIGN KEY (manual_id) REFERENCES manual_metadata(id)"
            ");"
            "CREATE INDEX IF NOT EXISTS idx_sections_manual ON sections(manual_id);"
            "CREATE INDEX IF NOT EXISTS idx_troubleshooting_manual ON troubleshooting(manual_id);"
            "CREATE INDEX IF NOT EXISTS idx_bom_manual ON bom(manual_id);"
            "CREATE INDEX IF NOT EXISTS idx_procedures_manual ON procedures(manual_id);"
        )


def list_stored_manuals(db_path: Path) -> list[dict[str, Any]]:
    init_vector_db(db_path)
    with sqlite3.connect(db_path) as conn:
        rows = conn.execute(
            "SELECT id, filename, machine_id, created_at, source_type, title FROM manuals ORDER BY created_at DESC"
        ).fetchall()

    return [
        {
            "id": row[0],
            "filename": row[1],
            "machine_id": row[2],
            "created_at": row[3],
            "source_type": row[4] or "manual",
            "title": row[5],
        }
        for row in rows
    ]


def vectorize_texts(texts: list[str], n_features: int = 2048) -> np.ndarray:
    vectorizer = HashingVectorizer(
        n_features=n_features,
        alternate_sign=False,
        norm=None,
        stop_words="english",
        ngram_range=(1, 2),
    )
    sparse = vectorizer.transform(texts)
    return normalize(sparse.toarray(), axis=1)


def store_manual_chunks_in_db(
    filename: str,
    text: str,
    chunks: list[dict[str, Any]],
    db_path: Path,
    machine_id: int | None = None,
    source_type: str = "manual",
    title: str | None = None,
) -> None:
    init_vector_db(db_path)
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM manuals WHERE filename = ?", (filename,))
        row = cursor.fetchone()
        if row:
            manual_id = row[0]
            if machine_id is not None:
                cursor.execute(
                    "UPDATE manuals SET text = ?, machine_id = ?, source_type = ?, title = ? WHERE id = ?",
                    (text, machine_id, source_type, title, manual_id),
                )
            else:
                cursor.execute(
                    "UPDATE manuals SET text = ?, source_type = ?, title = ? WHERE id = ?",
                    (text, source_type, title, manual_id),
                )
            cursor.execute("DELETE FROM chunks WHERE manual_id = ?", (manual_id,))
        else:
            cursor.execute(
                "INSERT INTO manuals (filename, text, machine_id, source_type, title) VALUES (?, ?, ?, ?, ?)",
                (filename, text, machine_id, source_type, title),
            )
            manual_id = cursor.lastrowid

        embeddings = vectorize_texts([chunk["snippet"] for chunk in chunks])
        for chunk, embedding in zip(chunks, embeddings):
            cursor.execute(
                "INSERT INTO chunks (manual_id, page, snippet, embedding_json) VALUES (?, ?, ?, ?)",
                (manual_id, chunk["page"], chunk["snippet"], json.dumps(embedding.tolist())),
            )
        conn.commit()


def store_tribal_note_in_db(
    title: str,
    body: str,
    db_path: Path,
    machine_id: int | None = None,
) -> dict[str, Any]:
    filename = f"note-{uuid.uuid4().hex[:8]}.txt"
    chunks = split_text_into_chunks(body)
    store_manual_chunks_in_db(
        filename,
        body,
        chunks,
        db_path,
        machine_id=machine_id,
        source_type="tribal_knowledge",
        title=title,
    )
    return {"filename": filename, "chunks_indexed": len(chunks)}


def load_chunks_from_db(
    db_path: Path, source_types: list[str] | None = None
) -> tuple[list[dict[str, Any]], np.ndarray]:
    init_vector_db(db_path)
    query = (
        "SELECT chunks.page, chunks.snippet, chunks.embedding_json, "
        "manuals.source_type, manuals.filename, manuals.title "
        "FROM chunks JOIN manuals ON chunks.manual_id = manuals.id"
    )
    params: tuple[Any, ...] = ()
    if source_types:
        placeholders = ", ".join("?" for _ in source_types)
        query += f" WHERE manuals.source_type IN ({placeholders})"
        params = tuple(source_types)

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        rows = cursor.execute(query, params).fetchall()

    chunks: list[dict[str, Any]] = []
    embeddings: list[np.ndarray] = []
    for page, snippet, embedding_json, source_type, filename, title in rows:
        try:
            embedding = np.array(json.loads(embedding_json), dtype="float32")
        except Exception:
            continue
        chunks.append({
            "page": page,
            "snippet": snippet,
            "source_type": source_type or "manual",
            "filename": filename,
            "title": title,
        })
        embeddings.append(embedding)

    if not embeddings:
        return [], np.empty((0, 0), dtype="float32")

    return chunks, np.vstack(embeddings)


def search_chunks_in_db(
    query: str, db_path: Path, top_k: int = 5, source_types: list[str] | None = None
) -> list[dict[str, Any]]:
    chunks, embeddings = load_chunks_from_db(db_path, source_types=source_types)
    if not chunks:
        return []

    query_embedding = vectorize_texts([query])[0]
    scores = embeddings.dot(query_embedding)
    order = np.argsort(scores)[::-1][:top_k]

    results: list[dict[str, Any]] = []
    for idx in order:
        if scores[idx] <= 0:
            continue
        results.append({
            "page": chunks[idx]["page"],
            "snippet": chunks[idx]["snippet"],
            "source_type": chunks[idx]["source_type"],
            "filename": chunks[idx]["filename"],
            "title": chunks[idx]["title"],
        })

    return results


def split_text_into_chunks(text: str, chunk_size: int = 250, overlap: int = 50) -> list[dict[str, Any]]:
    text = text.replace("\r", "")
    pages = text.split("\x0c")
    chunks: list[dict[str, Any]] = []

    for page_number, page in enumerate(pages, start=1):
        page = page.strip()
        if not page:
            continue

        sentences = re.split(r"(?<=[.!?])\s+", page)
        current_chunk: list[str] = []
        current_length = 0

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue

            word_count = len(sentence.split())
            if current_length + word_count > chunk_size and current_chunk:
                chunks.append({
                    "page": page_number,
                    "snippet": " ".join(current_chunk),
                })
                overlap_slice = current_chunk[-overlap:] if overlap < len(current_chunk) else current_chunk
                current_chunk = list(overlap_slice)
                current_length = sum(len(item.split()) for item in current_chunk)

            current_chunk.append(sentence)
            current_length += word_count

        if current_chunk:
            chunks.append({
                "page": page_number,
                "snippet": " ".join(current_chunk),
            })

    return chunks


def build_embedding_index(chunks: list[dict[str, Any]]) -> tuple[Any, np.ndarray, TfidfVectorizer]:
    snippets = [chunk["snippet"] for chunk in chunks]
    vectorizer = TfidfVectorizer(stop_words="english")
    matrix = vectorizer.fit_transform(snippets)
    embeddings = matrix.toarray().astype("float32")

    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    embeddings /= norms

    if faiss is not None:
        index = faiss.IndexFlatIP(embeddings.shape[1])
        index.add(embeddings)
        return index, embeddings, vectorizer

    return None, embeddings, vectorizer


def save_text_to_manuals(text: str, source_filename: str, manuals_dir: Path) -> Path:
    manuals_dir.mkdir(parents=True, exist_ok=True)
    safe_name = re.sub(r"[^a-zA-Z0-9_-]+", "_", Path(source_filename).stem)
    target_path = manuals_dir / f"{safe_name}.txt"
    target_path.write_text(text or "", encoding="utf-8")
    return target_path


def keyword_search_text(text: str, query: str, top_k: int = 5) -> list[dict[str, Any]]:
    query_terms = [term.lower() for term in re.findall(r"\w+", query) if term]
    if not query_terms:
        return []

    pages = text.split("\x0c")
    scored_results: list[tuple[int, int, str]] = []

    for page_number, page in enumerate(pages, start=1):
        page_text = page.strip()
        if not page_text:
            continue

        page_lower = page_text.lower()
        score = sum(page_lower.count(term) for term in query_terms)
        if score == 0:
            continue

        highlighted_sentence = ""
        for sentence in re.split(r"(?<=[.!?])\s+", page_text):
            sentence_lower = sentence.lower()
            if any(term in sentence_lower for term in query_terms):
                highlighted_sentence = sentence.strip()
                break

        snippet = highlighted_sentence or page_text[:320]
        scored_results.append((score, page_number, snippet))

    scored_results.sort(key=lambda item: (-item[0], item[1]))
    return [
        {"page": page, "snippet": snippet}
        for _, page, snippet in scored_results[:top_k]
    ]


def search_manual_text(text: str, query: str, top_k: int = 5) -> list[dict[str, Any]]:
    chunks = split_text_into_chunks(text)
    if not chunks:
        return []

    index, embeddings, vectorizer = build_embedding_index(chunks)
    query_vector = vectorizer.transform([query]).toarray().astype("float32")
    query_norm = np.linalg.norm(query_vector, axis=1, keepdims=True)
    query_norm[query_norm == 0] = 1.0
    query_vector /= query_norm

    if index is None:
        similarity_scores = np.dot(embeddings, query_vector.T).ravel()
        top_indices = np.argsort(similarity_scores)[::-1][: min(top_k, len(chunks))]
    else:
        _, indices = index.search(query_vector, min(top_k, len(chunks)))
        top_indices = [int(idx) for idx in indices[0]]

    results: list[dict[str, Any]] = []

    for idx in top_indices:
        snippet = chunks[int(idx)]
        results.append({
            "page": snippet["page"],
            "snippet": snippet["snippet"],
        })

    return results


def _split_tags(*values: Any) -> list[str]:
    tags: list[str] = []
    for value in values:
        if not value:
            continue
        for part in str(value).split(","):
            cleaned = part.strip()
            if cleaned and cleaned.lower() not in (tag.lower() for tag in tags):
                tags.append(cleaned)
    return tags


def _fetch_catalog_rows(db_path: Path) -> list[dict[str, Any]]:
    if not db_path.exists():
        return []

    with sqlite3.connect(db_path) as conn:
        component_rows = conn.execute(
            """
            SELECT
                c.id,
                c.name,
                c.motion_type,
                c.motion_direction,
                c.engineering_role,
                c.tags,
                a.sequence_type,
                a.notes,
                m.name AS machine_name,
                m.category AS machine_category,
                m.function AS machine_function,
                m.motion_signature AS machine_motion_signature,
                m.id AS machine_id,
                m.image_path AS machine_image_path
            FROM components AS c
            LEFT JOIN animations AS a ON c.animation_id = a.id
            LEFT JOIN machines AS m ON a.machine_id = m.id
            """
        ).fetchall()

        machine_rows = conn.execute(
            "SELECT id, name, category, function, motion_signature, description, image_path FROM machines"
        ).fetchall()

        animation_rows = conn.execute(
            """
            SELECT
                a.id,
                a.file_path,
                a.duration,
                a.fps,
                a.resolution,
                a.sequence_type,
                a.notes,
                m.name AS machine_name
            FROM animations AS a
            LEFT JOIN machines AS m ON a.machine_id = m.id
            """
        ).fetchall()

    component_records = []
    for row in component_rows:
        component_records.append({
            "kind": "component",
            "label": row[1],
            "text": " ".join(filter(None, [row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9], row[10], row[11]])),
            "machine": row[8],
            "details": row[4] or row[2] or row[5],
            "tags": _split_tags(row[5], row[2], row[3], row[4]),
            "score": 0.0,
            "image_url": f"/machines/{row[12]}/image" if row[13] else None,
        })

    machine_records = []
    for row in machine_rows:
        machine_records.append({
            "kind": "machine",
            "label": row[1],
            "text": " ".join(filter(None, [row[1], row[2], row[3], row[4], row[5]])),
            "machine": row[1],
            "details": row[3] or row[4] or row[5],
            "tags": _split_tags(row[2], row[4]),
            "score": 0.0,
            "image_url": f"/machines/{row[0]}/image" if row[6] else None,
        })

    animation_records = []
    for row in animation_rows:
        animation_records.append({
            "kind": "animation",
            "label": row[7] or row[1],
            "text": " ".join(filter(None, [row[1], row[5], row[6], row[7]])),
            "machine": row[7],
            "details": row[5] or row[6],
            "tags": _split_tags(row[5]),
            "score": 0.0,
        })

    return component_records + machine_records + animation_records


def search_catalog(query: str, mode: str = "top_k", db_path: str | Path | None = None, top_k: int = 5) -> list[dict[str, Any]]:
    if not query or not query.strip():
        return []

    resolved_db_path = _resolve_db_path(db_path)
    records = _fetch_catalog_rows(resolved_db_path)
    if not records:
        return []

    normalized_mode = (mode or "top_k").strip().lower()

    if normalized_mode == "tag":
        query_terms = [term for term in re.findall(r"[a-z0-9]+", query.lower()) if term]
        ranked: list[dict[str, Any]] = []
        for record in records:
            tags = record.get("tags") or []
            tag_text = " ".join(tags).lower()
            if not tag_text:
                continue
            score = sum(1 for term in query_terms if term in tag_text)
            if score <= 0:
                continue
            ranked.append({
                "kind": record["kind"],
                "label": record["label"],
                "machine": record.get("machine"),
                "details": record.get("details"),
                "tags": tags,
                "score": float(score),
                "image_url": record.get("image_url"),
            })
        ranked.sort(key=lambda item: (-item["score"], item["label"].lower()))
        return ranked[:top_k]

    if normalized_mode == "component":
        records = [item for item in records if item["kind"] == "component"]
    elif normalized_mode == "machine":
        records = [item for item in records if item["kind"] == "machine"]
    elif normalized_mode == "animation":
        records = [item for item in records if item["kind"] == "animation"]
    elif normalized_mode == "motion_signature":
        records = [item for item in records if item["kind"] == "machine"]
    elif normalized_mode == "machine_to_machine":
        records = [item for item in records if item["kind"] == "machine"]
    elif normalized_mode == "cross_component":
        records = [item for item in records if item["kind"] == "component"]
    elif normalized_mode == "motion_type":
        records = [item for item in records if item["kind"] == "component"]
    elif normalized_mode == "engineering_role":
        records = [item for item in records if item["kind"] == "component"]

    if not records:
        return []

    texts = [item["text"] for item in records]
    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    document_matrix = vectorizer.fit_transform(texts)
    query_vector = vectorizer.transform([query])
    scores = document_matrix.dot(query_vector.T).toarray().ravel()

    ranked: list[dict[str, Any]] = []
    for record, score in zip(records, scores):
        if score <= 0:
            continue
        ranked.append({
            "kind": record["kind"],
            "label": record["label"],
            "machine": record.get("machine"),
            "details": record.get("details"),
            "tags": record.get("tags", []),
            "score": round(float(score), 3),
            "image_url": record.get("image_url"),
        })

    ranked.sort(key=lambda item: (-item["score"], item["label"].lower()))
    return ranked[:top_k]


def get_symptom_suggestions(query: str, db_path: str | Path | None = None, limit: int = 8) -> list[str]:
    normalized_query = query.strip().lower()
    if not normalized_query:
        return []

    resolved_db_path = _resolve_db_path(db_path)

    candidates: list[str] = list(SEED_SYMPTOMS)

    for record in _fetch_catalog_rows(resolved_db_path):
        candidates.extend(record.get("tags") or [])

    if resolved_db_path.exists():
        with sqlite3.connect(resolved_db_path) as conn:
            candidates.extend(
                row[0]
                for row in conn.execute("SELECT issue FROM troubleshooting").fetchall()
                if row[0]
            )

            for (snippet,) in conn.execute("SELECT snippet FROM chunks").fetchall():
                if not snippet:
                    continue
                for sentence in re.split(r"(?<=[.!?])\s+", snippet)[:3]:
                    words = sentence.strip().split()
                    if 3 <= len(words) <= 10:
                        candidates.append(" ".join(words))

    seen: set[str] = set()
    deduped: list[str] = []
    for candidate in candidates:
        cleaned = candidate.strip()
        key = cleaned.lower()
        if not cleaned or key in seen:
            continue
        seen.add(key)
        deduped.append(cleaned)

    prefix_matches = [c for c in deduped if c.lower().startswith(normalized_query)]
    substring_matches = [
        c for c in deduped if normalized_query in c.lower() and c not in prefix_matches
    ]

    prefix_matches.sort(key=len)
    substring_matches.sort(key=len)

    return (prefix_matches + substring_matches)[:limit]


