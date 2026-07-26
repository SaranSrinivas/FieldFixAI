"""Import each machine's PDF manual and PNG render into manuals/manuals.sqlite.

Matches files in /manuals by the leading word of the machine name, e.g.
machine "DeepMiner DV-3100" -> manuals/DeepMiner.pdf + manuals/DeepMinerRender.png.

Usage (from repo root):
    python backend/scripts/import_machine_manuals.py
"""
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.manual_search import (  # noqa: E402
    extract_pdf_text,
    save_text_to_manuals,
    split_text_into_chunks,
    store_manual_chunks_in_db,
)

ROOT_DIR = Path(__file__).resolve().parents[2]
MANUALS_DIR = ROOT_DIR / "manuals"
DB_PATH = MANUALS_DIR / "manuals.sqlite"


def ensure_image_column(conn: sqlite3.Connection) -> None:
    columns = {row[1] for row in conn.execute("PRAGMA table_info(machines)").fetchall()}
    if "image_path" not in columns:
        conn.execute("ALTER TABLE machines ADD COLUMN image_path TEXT")


def main() -> None:
    with sqlite3.connect(DB_PATH) as conn:
        ensure_image_column(conn)
        conn.commit()
        machines = conn.execute("SELECT id, name FROM machines ORDER BY id").fetchall()

    for machine_id, name in machines:
        prefix = name.split()[0]
        pdf_path = MANUALS_DIR / f"{prefix}.pdf"
        png_path = MANUALS_DIR / f"{prefix}Render.png"

        if pdf_path.exists():
            text = extract_pdf_text(pdf_path.read_bytes())
            save_text_to_manuals(text, pdf_path.name, MANUALS_DIR)
            chunks = split_text_into_chunks(text)
            store_manual_chunks_in_db(pdf_path.name, text, chunks, DB_PATH, machine_id=machine_id)
            print(f"[{name}] indexed {pdf_path.name} -> {len(chunks)} chunks (machine_id={machine_id})")
        else:
            print(f"[{name}] no manual found at {pdf_path}")

        if png_path.exists():
            relative_path = png_path.relative_to(ROOT_DIR).as_posix()
            with sqlite3.connect(DB_PATH) as conn:
                conn.execute("UPDATE machines SET image_path = ? WHERE id = ?", (relative_path, machine_id))
                conn.commit()
            print(f"[{name}] linked render image -> {relative_path}")
        else:
            print(f"[{name}] no render image found at {png_path}")


if __name__ == "__main__":
    main()
