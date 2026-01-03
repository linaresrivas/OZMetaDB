#!/usr/bin/env python3
"""DB Exporter - exports MetaDB to snapshot JSON.

Steps:
  1.1 Load contract (ozmeta.exporter.contract.json)
  1.2 Connect to database
  2.1 Resolve client/project context
  2.2 Execute queries in contract order
  2.3 Map results to snapshot paths
  3.1 Write snapshot JSON
"""

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

# Mapping: contract query name -> snapshot target path
QUERY_TO_PATH: Dict[str, str] = {
  "tables": "objects.model.tables",
  "fields": "objects.model.fields",
  "relations": "objects.model.relations",
  "texts": "objects.texts.textKeys",
  "text_keys_project": "objects.texts.textKeys",
  "translations_project": "objects.texts.translations",
  "project_languages": "objects.texts.languages",
  "workflows": "objects.workflows.workflows",
  "workflow_states": "objects.workflows.states",
  "workflow_transitions": "objects.workflows.transitions",
  "security_policies": "objects.security.policies",
  "roles": "objects.security.roles",
  "document_types": "objects.documents.documentTypes",
  "retention_policies": "objects.documents.retentionPolicies",
  "redaction_policies": "objects.documents.redactionPolicies",
  "ui_apps": "objects.ui.apps",
  "ui_pages": "objects.ui.pages",
  "ui_components": "objects.ui.components",
  "ui_page_components": "objects.ui.pageComponents",
  "ui_validation_rules": "objects.ui.validationRules",
  "ui_search_facets": "objects.ui.searchFacets",
  "semantic_models": "objects.bi.semanticModels",
  "semantic_measures": "objects.bi.measures",
  "features": "objects.ai.features",
  "models": "objects.ai.models",
  "runtime_bindings": "objects.runtime.bindings",
  "purposes": "objects.governance.purposes",
  "consent_policies": "objects.governance.consentPolicies",
  "residency_policies": "objects.governance.residencyPolicies",
  "outbox_specs": "objects.reliability.outboxSpecs",
  "inbox_specs": "objects.reliability.inboxSpecs",
  "graph_models": "objects.graph.models",
  "graph_node_types": "objects.graph.nodeTypes",
  "graph_edge_types": "objects.graph.edgeTypes",
  "platform_service_map": "objects.platform.serviceMap",
  "dr_topologies": "objects.platform.drTopology",
  "source_systems": "objects.integrations.sources",
  "map_fields": "objects.integrations.mappings",
  "ingestion_specs": "objects.integrations.pipelines",
}

REQUIRED_OBJECTS = {
  "model": {"tables": [], "fields": [], "relations": []},
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
  "bi": {"semanticModels": [], "measures": []},
  "integrations": {"sources": [], "mappings": [], "pipelines": []},
  "ai": {"features": [], "models": []},
  "platform": {"serviceMap": [], "drTopology": []},
  "identityResolution": {"matchRules": []},
}

def now_utc_iso() -> str:
  return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def deep_copy(o: Any) -> Any:
  return json.loads(json.dumps(o))


def _set_nested(obj: Dict[str, Any], path: str, value: Any) -> None:
  """Set a nested value in a dict using dot notation path."""
  parts = path.split(".")
  for p in parts[:-1]:
    obj = obj.setdefault(p, {})
  obj[parts[-1]] = value


def _convert_row(row: Dict[str, Any]) -> Dict[str, Any]:
  """Convert SQL row to JSON-safe dict with camelCase keys."""
  out: Dict[str, Any] = {}
  for k, v in row.items():
    # 1.1 Convert column names: TB_SchemaName -> schema, TB_TableName -> code
    key = k
    if k.startswith(("TB_", "FD_", "WF_", "ST_", "TRN_", "SP_", "RL_", "DT_")):
      # Strip prefix and convert to camelCase
      suffix = k.split("_", 1)[1] if "_" in k else k
      key = suffix[0].lower() + suffix[1:] if suffix else k
    # 1.2 Handle special renames
    renames = {
      "SchemaName": "schema", "TableName": "code", "Code": "code",
      "ID": "id", "Description": "description", "Name": "name",
    }
    for old, new in renames.items():
      if key.endswith(old) or key == old:
        key = new
        break
    # 1.3 Convert value types
    if v is None:
      out[key] = None
    elif isinstance(v, bool):
      out[key] = v
    elif hasattr(v, "isoformat"):
      out[key] = v.isoformat()
    else:
      out[key] = v
  return out


def export_sqlserver(client_code: str, project_code: str, conn_str: str) -> Dict[str, Any]:
  """SQL Server exporter implementation.

  Steps:
    1.1 Load contract from contracts/ozmeta.exporter.contract.json
    1.2 Connect to database
    2.1 Resolve CL_ID and PJ_ID from client/project codes
    2.2 Execute queries in contract order
    2.3 Map results to snapshot paths using QUERY_TO_PATH
    3.1 Return assembled snapshot
  """
  # 1.1 Load contract
  try:
    import pyodbc  # type: ignore
  except ImportError as e:
    raise RuntimeError("pyodbc not installed. Run: pip install -r generator/requirements.txt") from e

  contract_path = Path(__file__).resolve().parents[2] / "contracts" / "ozmeta.exporter.contract.json"
  contract = json.loads(contract_path.read_text(encoding="utf-8"))
  queries = contract.get("queries", [])

  # 1.2 Connect to database
  if not conn_str:
    raise ValueError("Missing --connection (or OZ_DB_CONNECTION) for sqlserver exporter")

  cn = pyodbc.connect(conn_str)
  cn.autocommit = True
  cur = cn.cursor()

  # 2.1 Resolve client/project context
  ctx_query = next((q for q in queries if q.get("name") == "client_project_context"), None)
  if not ctx_query:
    raise ValueError("Contract missing client_project_context query")

  cur.execute(ctx_query["sql"].replace("@CL_Code", "?").replace("@PJ_Code", "?"), (client_code, project_code))
  ctx_row = cur.fetchone()
  if not ctx_row:
    raise ValueError(f"Client/Project not found: {client_code}/{project_code}")

  cols = [c[0] for c in cur.description]
  ctx = dict(zip(cols, ctx_row))
  pj_id = ctx["PJ_ID"]

  # Build snapshot shell
  snap: Dict[str, Any] = {
    "meta": {
      "version": "0.1",
      "exportedAtUTC": now_utc_iso(),
      "clientCode": client_code,
      "projectCode": project_code,
      "projectId": str(pj_id),
      "exporter": {"name": "export_from_db.py(sqlserver)", "db": "sqlserver"},
    },
    "objects": deep_copy(REQUIRED_OBJECTS),
  }

  # 2.2 Execute queries in contract order
  for q in queries:
    name = q.get("name")
    sql = q.get("sql")
    if not (name and sql) or name == "client_project_context":
      continue

    # 2.3 Map to snapshot path
    target_path = QUERY_TO_PATH.get(name)
    if not target_path:
      continue  # Skip queries we don't map yet

    # Replace parameters
    sql_exec = sql.replace("@PJ_ID", "?").replace("@CL_ID", "?")
    try:
      if "@PJ_ID" in sql:
        cur.execute(sql_exec, (pj_id,))
      else:
        cur.execute(sql_exec)

      cols = [c[0] for c in cur.description] if cur.description else []
      rows = [_convert_row(dict(zip(cols, row))) for row in cur.fetchall()]
      _set_nested(snap, target_path, rows)
    except Exception as e:
      # Log but continue - some queries may fail on partial schemas
      print(f"Warning: Query {name} failed: {e}")

  cn.close()
  return snap


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
  """Main entry point.

  Steps:
    1.1 Parse arguments
    1.2 Select provider (stub or sqlserver)
    2.1 Export snapshot
    3.1 Write output file
  """
  ap = argparse.ArgumentParser(description="Export MetaDB to snapshot JSON")
  ap.add_argument("--out", required=True, help="Output file path")
  ap.add_argument("--client", default=os.environ.get("OZ_CLIENT", "SFO"), help="Client code")
  ap.add_argument("--project", default=os.environ.get("OZ_PROJECT", "CaseMgmt"), help="Project code")
  ap.add_argument("--provider", default=os.environ.get("OZ_DB_PROVIDER", "stub"), choices=["stub", "sqlserver"])
  ap.add_argument("--connection", default=os.environ.get("OZ_DB_CONNECTION", ""), help="ODBC connection string")
  args = ap.parse_args()

  # 1.2 Select provider
  if args.provider == "stub":
    snap = export_stub(f"{args.client}/{args.project}")
  else:
    snap = export_sqlserver(args.client, args.project, args.connection)


  out = Path(args.out)
  out.parent.mkdir(parents=True, exist_ok=True)
  out.write_text(json.dumps(snap, indent=2), encoding="utf-8")
  return 0

if __name__ == "__main__":
  raise SystemExit(main())
