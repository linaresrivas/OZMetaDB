#!/usr/bin/env python3
"""DB Exporter (stub, full-fidelity snapshot shape)."""

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

REQUIRED_OBJECTS = {
  "model": {"tables": []},
  "texts": {"languages": ["en-US"], "textKeys": [], "translations": []},
  "ui": {"apps": [], "pages": [], "components": [], "pageComponents": [], "validationRules": [], "searchFacets": []},
  "uiThemes": [],
  "enums": {"enums": [], "values": []},
  "documents": {"documentTypes": [], "retentionPolicies": [], "redactionPolicies": []},
  "workflows": {"workflows": [], "states": [], "transitions": []},
  "runtime": {"bindings": []},
  "governance": {"purposes": [], "consentPolicies": [], "residencyPolicies": []},
  "reliability": {"outboxSpecs": [], "inboxSpecs": []},
  "graph": {"models": [], "nodeTypes": [], "edgeTypes": []},
  "security": {"roles": [], "policies": []},
  "bi": {"metrics": [], "dimensions": [], "semanticModels": []},
  "integrations": {"sources": [], "mappings": [], "pipelines": []},
  "ai": {"features": [], "models": []},
  "platform": {"serviceMap": [], "drTopology": []},
  "identityResolution": {"matchRules": []},
}

def now_utc_iso() -> str:
  return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def deep_copy(o: Any) -> Any:
  return json.loads(json.dumps(o))

def export_stub(project_id: str) -> Dict[str, Any]:
  snap: Dict[str, Any] = {
    "meta": {
      "version": "0.1",
      "exportedAtUTC": now_utc_iso(),
      "projectId": project_id,
      "exporter": {"name": "export_from_db.py(stub)", "db": "none"},
    },
    "objects": deep_copy(REQUIRED_OBJECTS),
  }

  snap["objects"]["model"]["tables"] = [
    {
      "schema": "dp",
      "code": "Transaction",
      "fields": [
        {"code": "TR_ID", "type": "uuidv7", "nullable": False},
        {"code": "TREM_ID", "type": "uuidv7", "nullable": False},
        {"code": "TREM_ApprovedBy", "type": "uuidv7", "nullable": True},
        {"code": "_TenantID", "type": "uuidv7", "nullable": False},
        {"code": "_CreateDate", "type": "datetime2", "nullable": False},
      ],
    }
  ]
  return snap

def main() -> int:
  ap = argparse.ArgumentParser()
  ap.add_argument("--out", required=True)
  ap.add_argument("--project-id", default=os.environ.get("OZ_PROJECT_ID", "00000000-0000-0000-0000-000000000000"))
  ap.add_argument("--provider", default=os.environ.get("OZ_DB_PROVIDER", "stub"), choices=["stub", "sqlserver"])
  ap.add_argument("--connection", default=os.environ.get("OZ_DB_CONNECTION", ""))
  args = ap.parse_args()

  snap = export_stub(args.project_id)  # implement sqlserver provider in deployments

  out = Path(args.out)
  out.parent.mkdir(parents=True, exist_ok=True)
  out.write_text(json.dumps(snap, indent=2), encoding="utf-8")
  return 0

if __name__ == "__main__":
  raise SystemExit(main())
