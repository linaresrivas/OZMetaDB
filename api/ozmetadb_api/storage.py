from __future__ import annotations
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from .config import settings

def _p(*parts: str) -> Path:
    return Path(settings.data_dir, *parts)

def ensure_dirs() -> None:
    _p().mkdir(parents=True, exist_ok=True)
    _p("projects").mkdir(parents=True, exist_ok=True)
    _p("change-requests").mkdir(parents=True, exist_ok=True)
    _p("wizard-runs").mkdir(parents=True, exist_ok=True)

def list_projects() -> List[Dict[str, Any]]:
    ensure_dirs()
    out=[]
    for pj in _p("projects").glob("*.json"):
        out.append(json.loads(pj.read_text(encoding="utf-8")))
    return sorted(out, key=lambda x: x.get("projectCode",""))

def get_project(project_id: str) -> Optional[Dict[str, Any]]:
    ensure_dirs()
    f=_p("projects", f"{project_id}.json")
    return json.loads(f.read_text(encoding="utf-8")) if f.exists() else None

def save_project(project: Dict[str, Any]) -> None:
    ensure_dirs()
    _p("projects", f"{project['projectId']}.json").write_text(json.dumps(project, indent=2), encoding="utf-8")

def get_snapshot(project_id: str) -> Optional[Dict[str, Any]]:
    ensure_dirs()
    f=_p("projects", project_id, "snapshot.json")
    return json.loads(f.read_text(encoding="utf-8")) if f.exists() else None

def save_snapshot(project_id: str, snapshot: Dict[str, Any]) -> None:
    ensure_dirs()
    d=_p("projects", project_id)
    d.mkdir(parents=True, exist_ok=True)
    (d/"snapshot.json").write_text(json.dumps(snapshot, indent=2), encoding="utf-8")

def list_change_requests(project_id: Optional[str]=None) -> List[Dict[str, Any]]:
    ensure_dirs()
    items=[]
    for f in _p("change-requests").glob("*.json"):
        cr=json.loads(f.read_text(encoding="utf-8"))
        if project_id and cr.get("projectId")!=project_id: 
            continue
        items.append(cr)
    return sorted(items, key=lambda x: x.get("createdAtUTC",""))

def get_change_request(cr_id: str) -> Optional[Dict[str, Any]]:
    ensure_dirs()
    f=_p("change-requests", f"{cr_id}.json")
    return json.loads(f.read_text(encoding="utf-8")) if f.exists() else None

def save_change_request(cr: Dict[str, Any]) -> None:
    ensure_dirs()
    _p("change-requests", f"{cr['crId']}.json").write_text(json.dumps(cr, indent=2), encoding="utf-8")
