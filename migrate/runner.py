from __future__ import annotations
import json, uuid
from pathlib import Path
from typing import Dict, Any
from .state import MigrationRun, MigrationCheckpoint, now

DEFAULT_CHECKPOINTS=[
  "ProvisionTarget","StartSync","ParityChecks","CutoverRead","CutoverWrite","ColdStandby","Decommission"
]

def create_run(project_id: str, source: Dict[str, Any], target: Dict[str, Any]) -> Dict[str, Any]:
    mid=str(uuid.uuid4())
    run=MigrationRun(
        migrationId=mid,
        projectId=project_id,
        source=source,
        target=target,
        checkpoints=[MigrationCheckpoint(code=c) for c in DEFAULT_CHECKPOINTS],
        coldUntilUTC=now(),
        deleteAfterUTC=now(),
    )
    return json.loads(json.dumps(run, default=lambda o: o.__dict__))

def save_run(out_dir: str, run: Dict[str, Any]) -> str:
    p=Path(out_dir)
    p.mkdir(parents=True, exist_ok=True)
    f=p/f"{run['migrationId']}.json"
    f.write_text(json.dumps(run, indent=2), encoding="utf-8")
    return str(f)
