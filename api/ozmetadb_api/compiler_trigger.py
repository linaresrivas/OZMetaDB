from __future__ import annotations
import subprocess, sys, json
from pathlib import Path
from typing import Dict, Any
from .config import settings
from . import storage

def compile_project(project_id: str) -> Dict[str, Any]:
    snap = storage.get_snapshot(project_id)
    if not snap:
        raise ValueError("no snapshot for project")
    out = Path("../out/compiled") / project_id
    out.mkdir(parents=True, exist_ok=True)
    snap_path = out / "snapshot.json"
    snap_path.write_text(json.dumps(snap, indent=2), encoding="utf-8")
    cmd = [sys.executable, settings.generator_cmd, "--snapshot", str(snap_path), "--out", str(out)]
    p = subprocess.run(cmd, capture_output=True, text=True)
    return {"ok": p.returncode==0, "returncode": p.returncode, "stdout": p.stdout, "stderr": p.stderr, "outDir": str(out)}
