import json
import re
import sqlite3
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .manual_search import (
    extract_pdf_text,
    get_symptom_suggestions,
    init_manual_metadata_db,
    init_vector_db,
    keyword_search_text,
    list_stored_manuals,
    save_text_to_manuals,
    search_catalog,
    search_chunks_in_db,
    search_manual_text,
    split_text_into_chunks,
    store_manual_chunks_in_db,
    store_tribal_note_in_db,
)
from .suggestion_engine import generate_suggestions

ROOT_DIR = Path(__file__).resolve().parents[2]
MANUALS_DIR = ROOT_DIR / "manuals"
AI_CACHE_DIR = ROOT_DIR / "ai_cache"
MANUALS_DB_PATH = ROOT_DIR / "manuals" / "manuals.sqlite"
FRONTEND_DIST_DIR = ROOT_DIR / "frontend" / "dist"

app = FastAPI(title="FieldFix AI")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    init_vector_db(MANUALS_DB_PATH)
    init_manual_metadata_db(MANUALS_DB_PATH)


class SearchResponse(BaseModel):
    query: str
    matches: list[dict[str, Any]]


class AISuggestionRequest(BaseModel):
    issue: str
    snippets: list[str] = []


class CatalogSearchRequest(BaseModel):
    query: str
    mode: str = "top_k"
    top_k: int = 5


class UnifiedSearchRequest(BaseModel):
    query: str
    mode: str = "top_k"
    top_k: int = 5
    include_catalog: bool = True
    include_documents: bool = True
    source_types: Optional[list[str]] = None


class TribalNoteRequest(BaseModel):
    title: str
    body: str
    machine_id: Optional[int] = None


class TribalNoteResponse(BaseModel):
    filename: str
    chunks_indexed: int


class DocumentInfo(BaseModel):
    id: int
    filename: str
    machine_id: Optional[int] = None
    created_at: str
    source_type: str
    title: Optional[str] = None


class AISuggestionResponse(BaseModel):
    causes: list[str]
    temporary_fixes: list[str]
    diagnostics: list[str]
    safety_notes: list[str]


class ManualInfo(BaseModel):
    id: int
    filename: str
    machine_id: Optional[int] = None
    created_at: str


class UploadManualResponse(BaseModel):
    filename: str
    chunks_indexed: int


class ManualMetadata(BaseModel):
    id: int
    model: str
    name: str
    version: str
    category: Optional[str]
    created_at: str


def fallback_ai_suggestions() -> dict[str, list[str]]:
    return {
        "causes": [
            "Likely caused by worn or damaged mechanical components.",
            "Possible electrical fault or low voltage supply.",
        ],
        "temporary_fixes": [
            "Check the cable connections and tighten loose terminals.",
            "Restart the equipment after a brief cooling period.",
        ],
        "diagnostics": [
            "Inspect sensors for debris or misalignment.",
            "Measure voltage and current at key points.",
        ],
        "safety_notes": [
            "Always lock out power before servicing.",
            "Use proper PPE when working near moving equipment.",
        ],
    }


def load_cached_ai_suggestions(issue: str, cache_dir: Path) -> Optional[dict[str, list[str]]]:
    cache_dir.mkdir(parents=True, exist_ok=True)
    safe_key = re.sub(r"[^a-zA-Z0-9_-]+", "_", issue.strip().lower())[:128]
    filename = cache_dir / f"{safe_key}.json"

    if not filename.exists():
        return None

    try:
        return json.loads(filename.read_text(encoding="utf-8"))
    except Exception:
        return None


def cache_ai_suggestions(issue: str, suggestions: dict[str, list[str]], cache_dir: Path) -> None:
    cache_dir.mkdir(parents=True, exist_ok=True)
    safe_key = re.sub(r"[^a-zA-Z0-9_-]+", "_", issue.strip().lower())[:128]
    filename = cache_dir / f"{safe_key}.json"
    filename.write_text(json.dumps(suggestions, indent=2), encoding="utf-8")


@app.post("/upload_manual", response_model=UploadManualResponse)
async def upload_manual(file: UploadFile = File(...)):
    file_bytes = await file.read()
    text = extract_pdf_text(file_bytes)
    save_text_to_manuals(text, file.filename, MANUALS_DIR)

    chunks = split_text_into_chunks(text)
    store_manual_chunks_in_db(file.filename, text, chunks, MANUALS_DB_PATH)

    return UploadManualResponse(filename=file.filename, chunks_indexed=len(chunks))


@app.post("/search_manuals", response_model=SearchResponse)
async def search_manuals(query: str = Form(...), file: UploadFile = File(...)):
    file_bytes = await file.read()
    text = extract_pdf_text(file_bytes)
    save_text_to_manuals(text, file.filename, MANUALS_DIR)

    chunks = split_text_into_chunks(text)
    store_manual_chunks_in_db(file.filename, text, chunks, MANUALS_DB_PATH)

    matches = search_chunks_in_db(query, MANUALS_DB_PATH)
    if not matches:
        matches = keyword_search_text(text, query)

    return SearchResponse(query=query, matches=matches)


@app.post("/catalog_search", response_model=list[dict[str, Any]])
async def catalog_search(request: CatalogSearchRequest):
    if not request.query or not request.query.strip():
        raise HTTPException(status_code=400, detail="Query is required")

    results = search_catalog(request.query, mode=request.mode, db_path=MANUALS_DB_PATH, top_k=request.top_k)
    return results


@app.post("/search")
async def unified_search(request: UnifiedSearchRequest):
    if not request.query or not request.query.strip():
        raise HTTPException(status_code=400, detail="Query is required")

    results: dict[str, list[dict[str, Any]]] = {"catalog": [], "documents": []}

    if request.include_catalog:
        results["catalog"] = search_catalog(
            request.query, mode=request.mode, db_path=MANUALS_DB_PATH, top_k=request.top_k
        )

    if request.include_documents:
        results["documents"] = search_chunks_in_db(
            request.query, MANUALS_DB_PATH, top_k=request.top_k, source_types=request.source_types
        )

    return results


@app.post("/upload_document", response_model=UploadManualResponse)
async def upload_document(
    file: UploadFile = File(...),
    source_type: str = Form("manual"),
    machine_id: Optional[int] = Form(None),
):
    file_bytes = await file.read()
    if file.filename.lower().endswith(".pdf"):
        text = extract_pdf_text(file_bytes)
    else:
        text = file_bytes.decode("utf-8", errors="ignore")

    save_text_to_manuals(text, file.filename, MANUALS_DIR)

    chunks = split_text_into_chunks(text)
    store_manual_chunks_in_db(
        file.filename, text, chunks, MANUALS_DB_PATH, machine_id=machine_id, source_type=source_type
    )

    return UploadManualResponse(filename=file.filename, chunks_indexed=len(chunks))


@app.post("/tribal_notes", response_model=TribalNoteResponse)
async def create_tribal_note(request: TribalNoteRequest):
    if not request.body or not request.body.strip():
        raise HTTPException(status_code=400, detail="Note body is required")

    result = store_tribal_note_in_db(request.title, request.body, MANUALS_DB_PATH, machine_id=request.machine_id)
    return TribalNoteResponse(**result)


@app.get("/documents", response_model=list[DocumentInfo])
def get_documents() -> list[DocumentInfo]:
    documents = list_stored_manuals(MANUALS_DB_PATH)
    return [DocumentInfo(**document) for document in documents]


@app.get("/symptom_suggestions", response_model=list[str])
def symptom_suggestions(q: str = "", limit: int = 8) -> list[str]:
    if not q.strip():
        return []
    return get_symptom_suggestions(q, MANUALS_DB_PATH, limit=limit)


@app.post("/ai_suggestions", response_model=AISuggestionResponse)
async def ai_suggestions(request: AISuggestionRequest):
    if not request.issue or not request.issue.strip():
        raise HTTPException(status_code=400, detail="Issue description is required")

    cached = load_cached_ai_suggestions(request.issue, AI_CACHE_DIR)
    if cached is not None:
        return AISuggestionResponse(**cached)

    suggestions = generate_suggestions(request.issue, MANUALS_DB_PATH, extra_snippets=request.snippets)
    if any(suggestions.values()):
        cache_ai_suggestions(request.issue, suggestions, AI_CACHE_DIR)
    else:
        suggestions = fallback_ai_suggestions()

    return AISuggestionResponse(**suggestions)


@app.get("/manuals", response_model=list[ManualInfo])
def get_manuals() -> list[ManualInfo]:
    manuals = list_stored_manuals(MANUALS_DB_PATH)
    return [ManualInfo(**manual) for manual in manuals]


@app.get("/manuals/metadata", response_model=list[ManualMetadata])
def get_manuals_metadata() -> list[ManualMetadata]:
    with sqlite3.connect(MANUALS_DB_PATH) as conn:
        rows = conn.execute(
            "SELECT id, model, name, version, category, created_at FROM manual_metadata ORDER BY created_at DESC"
        ).fetchall()

    return [ManualMetadata(**{
        "id": row[0],
        "model": row[1],
        "name": row[2],
        "version": row[3],
        "category": row[4],
        "created_at": row[5],
    }) for row in rows]


# Serve the built React app (frontend/dist) from the same origin as the API.
# Registered last so it never shadows the API routes above it.
if FRONTEND_DIST_DIR.exists():
    assets_dir = FRONTEND_DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str) -> FileResponse:
        candidate = FRONTEND_DIST_DIR / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST_DIR / "index.html")
