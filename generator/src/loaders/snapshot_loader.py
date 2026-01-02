from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

SNAPSHOT_SCHEMA = Path(__file__).resolve().parents[3] / "exports" / "spec" / "ozmeta.metadata.snapshot.schema.json"

def load_snapshot(path: str | Path) -> Dict[str, Any]:
    p = Path(path)
    return json.loads(p.read_text(encoding="utf-8"))

def validate_snapshot(snapshot: Dict[str, Any]) -> None:
    # Optional dependency: jsonschema
    from jsonschema import validate  # type: ignore
    schema = json.loads(SNAPSHOT_SCHEMA.read_text(encoding="utf-8"))
    validate(instance=snapshot, schema=schema)
