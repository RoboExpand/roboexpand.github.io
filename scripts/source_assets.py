"""Resolve original media kept locally outside the published asset collection."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def source_asset(relative):
    for base in (ROOT / 'assets', ROOT / 'work/source-assets'):
        candidate = base / relative
        if candidate.is_file():
            return candidate
    raise FileNotFoundError(
        f'Original asset not found: {relative}. Restore the source collection '
        'under work/source-assets/ to regenerate derived media.'
    )
