from __future__ import annotations

import json
from pathlib import Path
from jsonschema import validate

from loaders.snapshot_loader import load_snapshot, validate_snapshot


CONTRACT_PATH = Path(__file__).resolve().parents[2] / "contracts" / "ozmeta.runtime.dsl.schema.json"

def validate_dsl(obj: dict) -> None:
    schema = json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))
    validate(instance=obj, schema=schema)

def compile_expr(expr: dict, target: str) -> str:
    # TODO: implement per target
    raise NotImplementedError(f"compile_expr not implemented for target={target}")

def compile_actions(actions: list[dict], target: str) -> list[str]:
    # TODO: implement per target
    raise NotImplementedError(f"compile_actions not implemented for target={target}")

def main() -> None:
    """Offline starter: validate snapshot + DSL examples."""

    # Offline mode: validate snapshot
    snapshot_path = Path(__file__).resolve().parents[2] / 'exports' / 'samples' / 'sample.snapshot.json'
    snap = load_snapshot(snapshot_path)
    validate_snapshot(snap)
    print('Snapshot validated OK')

    # Placeholder CLI entry
    example = Path(__file__).resolve().parents[2] / "contracts" / "examples" / "guard.approve.supervisor.json"
    obj = json.loads(example.read_text(encoding="utf-8"))
    validate_dsl(obj)
    print("DSL example validated OK")

if __name__ == "__main__":
    main()
