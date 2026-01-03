from __future__ import annotations
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Any, Dict, List
import uuid
from datetime import datetime, timezone
from . import storage
from .apply_engine import apply_change_request
from .compiler_trigger import compile_project
from .wizard_runtime import start_wizard, answer as wiz_answer, preview_change_request

app = FastAPI(title="OZMetaDB Control Plane API", version="0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

@app.on_event("startup")
def _startup():
    storage.ensure_dirs()
    if not storage.list_projects():
        pj = {"projectId": str(uuid.uuid4()), "clientCode":"SFO", "projectCode":"CaseMgmt", "createdAtUTC": _now()}
        storage.save_project(pj)
        import pathlib, json
        sample = pathlib.Path("../exports/samples/sample.snapshot.json")
        storage.save_snapshot(pj["projectId"], json.loads(sample.read_text(encoding="utf-8")))

@app.get("/v1/projects")
def projects() -> List[Dict[str, Any]]:
    return storage.list_projects()

@app.get("/v1/projects/{projectId}/snapshot")
def project_snapshot(projectId: str) -> Dict[str, Any]:
    s = storage.get_snapshot(projectId)
    if not s:
        raise HTTPException(404, "snapshot not found")
    return s

@app.get("/v1/change-requests")
def change_requests(projectId: str | None = None) -> List[Dict[str, Any]]:
    return storage.list_change_requests(projectId)

@app.get("/v1/change-requests/{crId}")
def get_cr(crId: str) -> Dict[str, Any]:
    cr = storage.get_change_request(crId)
    if not cr:
        raise HTTPException(404, "change request not found")
    return cr

@app.post("/v1/change-requests")
def create_cr(body: Dict[str, Any]) -> Dict[str, Any]:
    cr_id = str(uuid.uuid4())
    snap = storage.get_snapshot(body["projectId"]) or {}
    cr = {
        "crId": cr_id,
        "projectId": body["projectId"],
        "title": body.get("title","Untitled"),
        "rationale": body.get("rationale"),
        "status": "Draft",
        "createdAtUTC": _now(),
        "createdBy": body.get("createdBy"),
        "actions": body.get("actions", []),
        "baseSnapshotVersion": int(snap.get("snapshotVersion", 0)),
        "validation": {},
    }
    storage.save_change_request(cr)
    return cr

@app.post("/v1/change-requests/{crId}/submit")
def submit_cr(crId: str) -> Dict[str, Any]:
    cr = storage.get_change_request(crId)
    if not cr: raise HTTPException(404, "change request not found")
    cr["status"] = "Submitted"
    storage.save_change_request(cr)
    return cr

@app.post("/v1/change-requests/{crId}/approve")
def approve_cr(crId: str, body: Dict[str, Any] = {}) -> Dict[str, Any]:
    cr = storage.get_change_request(crId)
    if not cr: raise HTTPException(404, "change request not found")
    cr["status"] = "Approved"
    cr["approvedAtUTC"] = _now()
    cr["approvedBy"] = body.get("approvedBy")
    storage.save_change_request(cr)
    return cr

@app.post("/v1/change-requests/{crId}/apply")
def apply_cr(crId: str, body: Dict[str, Any] = {}) -> Dict[str, Any]:
    cr = storage.get_change_request(crId)
    if not cr: raise HTTPException(404, "change request not found")
    snap = apply_change_request(cr["projectId"], cr)
    cr["status"] = "Applied"
    cr["appliedAtUTC"] = _now()
    cr["appliedBy"] = body.get("appliedBy")
    storage.save_change_request(cr)
    return {"ok": True, "snapshotVersion": snap.get("snapshotVersion"), "snapshot": snap}

@app.post("/v1/compile/{projectId}")
def compile_endpoint(projectId: str) -> Dict[str, Any]:
    try:
        return compile_project(projectId)
    except Exception as e:
        raise HTTPException(400, str(e))

@app.post("/v1/wizards/{wizardCode}/start")
def wizard_start(wizardCode: str, body: Dict[str, Any]) -> Dict[str, Any]:
    return start_wizard(wizardCode, body["projectId"])

@app.post("/v1/wizard-runs/{wizardRunId}/answer")
def wizard_answer(wizardRunId: str, body: Dict[str, Any]) -> Dict[str, Any]:
    return wiz_answer(wizardRunId, body["key"], body.get("value"))

@app.post("/v1/wizard-runs/{wizardRunId}/preview-change-request")
def wizard_preview(wizardRunId: str) -> Dict[str, Any]:
    return preview_change_request(wizardRunId)
