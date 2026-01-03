#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Dict, Any, List, Set

from jsonschema import validate  # type: ignore

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / "exports" / "spec" / "ozmeta.metadata.snapshot.schema.json"

def load_json(p: Path) -> Dict[str, Any]:
    return json.loads(p.read_text(encoding="utf-8"))

def validate_schema(snapshot: Dict[str, Any]) -> None:
    schema = load_json(SCHEMA)
    validate(instance=snapshot, schema=schema)

def required_languages(snapshot: Dict[str, Any]) -> Set[str]:
    # Prefer explicit projectLanguages
    pl = snapshot["objects"].get("localization", {}).get("projectLanguages", [])
    langs = {row.get("LG_Code") for row in pl if row.get("PL_IsRequired", True)}
    langs = {x for x in langs if x}
    if langs:
        return langs
    # Fallback to languages list if present
    langs2 = snapshot["objects"].get("texts", {}).get("languages", [])
    return set(langs2) if isinstance(langs2, list) else set()

def missing_translations(snapshot: Dict[str, Any]) -> List[str]:
    langs = required_languages(snapshot)
    keys = snapshot["objects"]["texts"].get("textKeys", [])
    trs = snapshot["objects"]["texts"].get("translations", [])
    if not keys:
        return []

    key_ids = {k["TK_ID"] for k in keys if "TK_ID" in k}
    # Build translation set
    have = {(t.get("TK_ID"), t.get("LG_Code")) for t in trs}
    missing = []
    for kid in key_ids:
        for lg in langs:
            if (kid, lg) not in have:
                missing.append(f"Missing translation: TK_ID={kid} LG={lg}")
    return missing

def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: validate_snapshot.py <snapshot.json>")
        return 2
    p = Path(sys.argv[1])
    snap = load_json(p)
    validate_schema(snap)

    miss = missing_translations(snap)
    if miss:
        print("\n".join(miss))
        return 3

    print("OK: snapshot schema valid and translations complete for required languages.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
