#!/usr/bin/env python3
"""
Gera `public/Emoji/manifest.json` a partir dos PNGs presentes em `public/Emoji/`.

Uso: npm run emoji:sync   (ou: python3 scripts/emoji_sync.py)

A grade de emojis do editor lê este manifest primeiro; as demais estratégias
(listagem do diretório / lista estática validada por HEAD) cobrem os casos
em que o manifest está ausente ou dessincronizado.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EMOJI_DIR = ROOT / "public" / "Emoji"
MANIFEST = EMOJI_DIR / "manifest.json"


def main() -> int:
    if not EMOJI_DIR.is_dir():
        print(f"Erro: pasta não encontrada: {EMOJI_DIR}", file=sys.stderr)
        return 1

    files = sorted(
        (f for f in EMOJI_DIR.iterdir() if f.is_file() and f.suffix.lower() == ".png"),
        key=lambda f: f.name,
    )

    items = [
        {
            "src": f"Emoji/{f.name}",
            "name": f.stem,
        }
        for f in files
    ]

    MANIFEST.write_text(
        json.dumps(items, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"OK: {MANIFEST.relative_to(ROOT)} gerado com {len(items)} emoji(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
