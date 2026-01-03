from __future__ import annotations
import json, uuid
from datetime import datetime, timezone
from typing import Any, Dict
from . import storage

def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def load_wizard_pack(code: str) -> Dict[str, Any]:
    from pathlib import Path
    here = Path(__file__).resolve()
    pack = here.parents[2] / "wizard" / "packs" / f"{code}.wizard.json"
    return json.loads(pack.read_text(encoding="utf-8"))

def start_wizard(code: str, project_id: str) -> Dict[str, Any]:
    w = load_wizard_pack(code)
    run_id = str(uuid.uuid4())
    run = {"wizardRunId": run_id, "wizardCode": code, "projectId": project_id, "startedAtUTC": _now(), "answers": {}, "status":"InProgress"}
    storage.ensure_dirs()
    p = storage._p("wizard-runs", f"{run_id}.json")
    p.write_text(json.dumps(run, indent=2), encoding="utf-8")
    return {"wizardRunId": run_id, "wizard": w, "run": run}

def get_run(run_id: str) -> Dict[str, Any]:
    p = storage._p("wizard-runs", f"{run_id}.json")
    return json.loads(p.read_text(encoding="utf-8"))

def save_run(run: Dict[str, Any]) -> None:
    p = storage._p("wizard-runs", f"{run['wizardRunId']}.json")
    p.write_text(json.dumps(run, indent=2), encoding="utf-8")

def answer(run_id: str, key: str, value: Any) -> Dict[str, Any]:
    run = get_run(run_id)
    run["answers"][key] = value
    save_run(run)
    return run

def preview_change_request(run_id: str) -> Dict[str, Any]:
    run = get_run(run_id)
    w = load_wizard_pack(run["wizardCode"])
    actions = []
    for step in w.get("steps", []):
        for gen in step.get("actionGenerators", []):
            if gen.get("type") == "CreateCoreTables":
                schema = run["answers"].get("dataSchema","dp")
                actions += [
                    {"actionId": str(uuid.uuid4()), "type":"CreateTable", "order": 10,
                     "payload":{"schema": schema, "code": gen.get("caseTable","Case"), "fields": gen.get("caseFields", [])}},
                    {"actionId": str(uuid.uuid4()), "type":"CreateTable", "order": 20,
                     "payload":{"schema": schema, "code": gen.get("personTable","Person"), "fields": gen.get("personFields", [])}},
                ]
            if gen.get("type") == "CreateWorkflowTemplate":
                wf_code = gen.get("workflowCode","Workflow")
                actions.append({"actionId": str(uuid.uuid4()), "type":"CreateWorkflow", "order": 30, "payload":{"id": str(uuid.uuid4()), "code": wf_code, "isEnabled": True}})
    return {"projectId": run["projectId"], "title": f"Wizard {run['wizardCode']} output", "actions": actions}
