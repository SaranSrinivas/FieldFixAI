import argparse
import os
from pathlib import Path

from pdfminer.high_level import extract_text


def convert_pdf_to_text(source_path: Path, target_path: Path) -> None:
    text = extract_text(source_path)
    target_path.write_text(text or "", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert PDF manuals into plain text files stored in the /manuals directory."
    )
    parser.add_argument(
        "source",
        nargs="+",
        help="Path(s) to PDF file(s) to convert.",
    )
    parser.add_argument(
        "--output-dir",
        default="manuals",
        help="Directory where converted text files will be written.",
    )

    args = parser.parse_args()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    for source in args.source:
        source_path = Path(source)
        if not source_path.exists() or source_path.suffix.lower() != ".pdf":
            print(f"Skipping invalid PDF: {source}")
            continue

        target_path = output_dir / f"{source_path.stem}.txt"
        print(f"Converting {source_path} -> {target_path}")
        convert_pdf_to_text(source_path, target_path)

    print("Conversion complete.")


if __name__ == "__main__":
    main()
