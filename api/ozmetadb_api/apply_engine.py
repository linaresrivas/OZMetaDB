from __future__ import annotations
import copy, json
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple
from jsonschema import validate
from jsonschema.exceptions import ValidationError
from .config import settings
from . import storage

def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def load_schema() -> Dict[str, Any]:
    from pathlib import Path
    return json.loads(Path(settings.schema_path).read_text(encoding="utf-8"))

def validate_snapshot(snapshot: Dict[str, Any]) -> Tuple[bool, List[str]]:
    schema = load_schema()
    try:
        validate(instance=snapshot, schema=schema)
        return True, []
    except ValidationError as e:
        return False, [str(e)]

def _ensure_envelope(snapshot: Dict[str, Any], project: Dict[str, Any]) -> Dict[str, Any]:
    s = copy.deepcopy(snapshot) if snapshot else {}
    s.setdefault("snapshotVersion", 1)
    s.setdefault("generatedAtUTC", _now())
    s.setdefault("clientCode", project.get("clientCode", "UNK"))
    s.setdefault("projectCode", project.get("projectCode", "Project"))
    s.setdefault("objects", {})
    s.setdefault("source", {"exporter":"control-plane"})
    return s

def apply_change_request(project_id: str, cr: Dict[str, Any]) -> Dict[str, Any]:
    project = storage.get_project(project_id)
    if not project:
        raise ValueError("project not found")
    base = storage.get_snapshot(project_id) or {}
    snap = _ensure_envelope(base, project)

    current_version = int(snap.get("snapshotVersion", 1))
    new_version = current_version + 1

    objects = snap.setdefault("objects", {})
    model = objects.setdefault("model", {"tables": []})
    tables = model.setdefault("tables", [])

    def find_table(schema: str, code: str):
        for t in tables:
            if t.get("schema")==schema and t.get("code")==code:
                return t
        return None

    actions = sorted(cr.get("actions", []), key=lambda a: (int(a.get("order",0)), a.get("actionId","")))
    for a in actions:
        t = a.get("type")
        target = a.get("target", {})
        payload = a.get("payload", {})
        if t == "CreateTable":
            schema = payload.get("schema","dp")
            code = payload["code"]
            if not find_table(schema, code):
                tables.append({"schema": schema, "code": code, "fields": payload.get("fields", [])})
        elif t == "CreateField":
            schema = target.get("schema","dp")
            table = target.get("tableCode")
            field = payload
            tb = find_table(schema, table) or {"schema": schema, "code": table, "fields": []}
            if tb not in tables: tables.append(tb)
            if not any(f.get("code")==field.get("code") for f in tb.get("fields", [])):
                tb.setdefault("fields", []).append(field)
        elif t == "UpdateField":
            schema = target.get("schema","dp")
            table = target.get("tableCode")
            field_code = target.get("fieldCode")
            tb = find_table(schema, table)
            if tb:
                for f in tb.get("fields", []):
                    if f.get("code")==field_code:
                        f.update(payload)
        elif t == "CreateEnum":
            enums = objects.setdefault("enums", {"enums": [], "values": []})
            if not any(e.get("code")==payload.get("code") for e in enums.get("enums", [])):
                enums["enums"].append(payload)
        elif t == "CreateWorkflow":
            wfs = objects.setdefault("workflows", {"workflows": [], "states": [], "transitions": []})
            if not any(w.get("code")==payload.get("code") for w in wfs.get("workflows", [])):
                wfs["workflows"].append(payload)
        # v1: accept other action types but no-op

    snap["snapshotVersion"] = new_version
    snap["generatedAtUTC"] = _now()
    ok, errs = validate_snapshot(snap)
    if not ok:
        raise ValueError("snapshot validation failed: " + "; ".join(errs))
    storage.save_snapshot(project_id, snap)
    return snap
