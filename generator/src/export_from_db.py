from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple

# NOTE:
# This is a **stub** exporter implementation.
# Replace the `run_query` function with actual DB connectivity (pyodbc/pymssql/sqlalchemy).
# The goal is to produce a snapshot matching exports/spec/ozmeta.metadata.snapshot.schema.json.

CONTRACT_PATH = Path(__file__).resolve().parents[2] / "contracts" / "ozmeta.exporter.contract.json"
SNAPSHOT_SCHEMA = Path(__file__).resolve().parents[2] / "exports" / "spec" / "ozmeta.metadata.snapshot.schema.json"

@dataclass(frozen=True)
class ExportContext:
    cl_code: str
    pj_code: str

def load_contract() -> Dict[str, Any]:
    return json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))

def validate_snapshot(snapshot: Dict[str, Any]) -> None:
    from jsonschema import validate  # type: ignore
    schema = json.loads(SNAPSHOT_SCHEMA.read_text(encoding="utf-8"))
    validate(instance=snapshot, schema=schema)

def run_query(connection: Any, sql: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Stub: return rows as list[dict].
    Implement using your preferred DB driver. Keep column names as returned by SQL.
    """
    raise NotImplementedError("Implement DB query execution and return list of dict rows")

def export_snapshot(connection: Any, ctx: ExportContext) -> Dict[str, Any]:
    contract = load_contract()

    def q(name: str) -> Dict[str, Any]:
        return next(q for q in contract["queries"] if q["name"] == name)

    # 1) Resolve context IDs
    rows0 = run_query(connection, q("client_project_context")["sql"], {"CL_Code": ctx.cl_code, "PJ_Code": ctx.pj_code})
    if not rows0:
        raise ValueError("Client/Project not found for provided codes")
    base = rows0[0]
    pj_id = base["PJ_ID"]

    # 2) Canonical model
    tables = run_query(connection, q("tables")["sql"], {"PJ_ID": pj_id})
    fields = run_query(connection, q("fields")["sql"], {"PJ_ID": pj_id})
    relations = run_query(connection, q("relations")["sql"], {"PJ_ID": pj_id})

    # 3) Workflows / roles / SLAs
    roles = run_query(connection, q("roles")["sql"], {"PJ_ID": pj_id})
    workflows = run_query(connection, q("workflows")["sql"], {"PJ_ID": pj_id})
    wf_states = run_query(connection, q("workflow_states")["sql"], {"PJ_ID": pj_id})
    wf_transitions = run_query(connection, q("workflow_transitions")["sql"], {"PJ_ID": pj_id})
    wf_tr_roles = run_query(connection, q("workflow_transition_roles")["sql"], {"PJ_ID": pj_id})
    slas = run_query(connection, q("sla_policies")["sql"], {"PJ_ID": pj_id})

    # 4) Security
    sec_policies = run_query(connection, q("security_policies")["sql"], {"PJ_ID": pj_id})
    table_sec = run_query(connection, q("table_security")["sql"], {"PJ_ID": pj_id})
    field_sec = run_query(connection, q("field_security")["sql"], {"PJ_ID": pj_id})
    dp_policies = run_query(connection, q("data_protection_policies")["sql"], {"PJ_ID": pj_id})
    field_prot = run_query(connection, q("field_protection")["sql"], {"PJ_ID": pj_id})

    # 5) Runtime
    rt_bindings = run_query(connection, q("runtime_bindings")["sql"], {"PJ_ID": pj_id})
    rt_sla_bindings = run_query(connection, q("runtime_sla_bindings")["sql"], {"PJ_ID": pj_id})
    rt_signals = run_query(connection, q("runtime_signal_types")["sql"], {"PJ_ID": pj_id})

    # 6) Texts (languages starter; keys/translations can be added with additional queries)
    languages = run_query(connection, q("texts")["sql"], {})

    # Build workflow packs
    wf_by_id = {w["WF_ID"]: w for w in workflows}
    states_by_wf = {}
    for s in wf_states:
        states_by_wf.setdefault(s["WF_ID"], []).append(s)
    trans_by_wf = {}
    for t in wf_transitions:
        trans_by_wf.setdefault(t["WF_ID"], []).append(t)

    tr_roles_by_wf = {}
    # Need WT->WF mapping
    wt_to_wf = {t["WT_ID"]: t["WF_ID"] for t in wf_transitions}
    for r in wf_tr_roles:
        wf_id = wt_to_wf.get(r["WT_ID"])
        if wf_id is not None:
            tr_roles_by_wf.setdefault(wf_id, []).append(r)

    workflow_packs = []
    for wf_id, wf in wf_by_id.items():
        workflow_packs.append({
            "workflow": wf,
            "states": states_by_wf.get(wf_id, []),
            "transitions": trans_by_wf.get(wf_id, []),
            "transitionRoles": tr_roles_by_wf.get(wf_id, []),
            "approvalFlows": [],
            "slas": slas,   # project-level SLAs; finer linking can be derived by SL_ObjectType/ObjectID
            "events": []
        })

    snap: Dict[str, Any] = {
        "snapshotVersion": 1,
        "generatedAtUTC": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "clientCode": ctx.cl_code,
        "projectCode": ctx.pj_code,
        "source": {
            "metadb": "OZMetaDB",
            "modelVersion": None,
            "mapVersion": None
        },
        "objects": {
            "tables": [
                {
                    "tbId": str(r["TB_ID"]),
                    "schemaName": r["TB_SchemaName"],
                    "tableName": r["TB_TableName"],
                    "code": r["CD_Code"].strip() if isinstance(r["CD_Code"], str) else r["CD_Code"],
                    "tableType": r["TB_TableType"],
                    "textKey": str(r["TB_TextKeyID"]) if r.get("TB_TextKeyID") else None,
                    "description": r.get("TB_Description"),
                    "flags": {
                        "isActual": bool(r.get("TB_IsActual", 0)),
                        "isForecast": bool(r.get("TB_IsForecast", 0)),
                        "requiresTenant": bool(r.get("TB_RequiresTenant", 1)),
                        "softDeleteEnabled": bool(r.get("TB_SoftDeleteEnabled", 1)),
                        "sourceTrackingEnabled": bool(r.get("TB_SourceTrackingEnabled", 1)),
                    }
                }
                for r in tables
            ],
            "fields": [
                {
                    "fdId": str(r["FD_ID"]),
                    "tbId": str(r["TB_ID"]),
                    "fieldName": r["FD_FieldName"],
                    "logicalType": r["LT_Code"],
                    "isPK": bool(r.get("FD_IsPK", 0)),
                    "isFK": bool(r.get("FD_IsFK", 0)),
                    "isInternal": bool(r.get("FD_IsInternal", 0)),
                    "isNullable": bool(r.get("FD_IsNullable", 1)),
                    "defaultRule": r.get("FD_DefaultRule"),
                    "sensitivity": r.get("FD_Sensitivity"),
                    "textKey": str(r["FD_TextKeyID"]) if r.get("FD_TextKeyID") else None,
                    "enumCode": r.get("EnumCode"),
                    "format": r.get("FD_Format"),
                    "mask": r.get("FD_Mask"),
                    "description": r.get("FD_Description")
                }
                for r in fields
            ],
            "relations": [
                {
                    "fromFdId": str(r["RL_FromFD_ID"]),
                    "toFdId": str(r["RL_ToFD_ID"]),
                    "roleName": r.get("RL_RoleName"),
                    "cardinality": r.get("RL_Cardinality"),
                    "enforceInDB": bool(r.get("RL_EnforceInDB", 1)),
                    "textKey": str(r["RL_TextKeyID"]) if r.get("RL_TextKeyID") else None,
                    "description": r.get("RL_Description")
                }
                for r in relations
            ],
            "workflows": workflow_packs,
            "security": {
                "policies": sec_policies,
                "tableSecurity": table_sec,
                "fieldSecurity": field_sec,
                "dataProtectionPolicies": dp_policies,
                "fieldProtection": field_prot,
                "roles": roles
            },
            "runtime": {
                "bindings": rt_bindings,
                "slaBindings": rt_sla_bindings,
                "signalTypes": rt_signals
            },
            "metrics": [],
            "dimensions": [],
            "jobs": [],
            "templates": [],
            "texts": {
                "languages": languages,
                "textKeys": [],
                "translations": []
            },
            "enums": [],
"sources": {"sourceSystems": source_systems, "sourceObjects": source_objects, "sourceFields": source_fields},
"mappings": {"mapVersions": map_versions, "mapFields": map_fields},
"ingestion": {"ingestionSpecs": ingestion_specs},
"quality": {"rules": dq_rules, "certifications": dataset_certs},
"documents": {"documentTypes": document_types, "redactionPolicies": redaction_policies},
"eventing": {"eventBuses": event_buses, "channels": event_channels, "subscriptions": event_subscriptions},
"semantic": {"semanticModels": semantic_models, "measures": semantic_measures},
"ai": {"features": features, "models": models},
"devops": {"environments": environments, "deployments": deployments},
"platform": {"serviceMap": platform_service_map, "drTopologies": dr_topologies},
"lifecycle": {"changeRequests": change_requests},
            "ui": {"apps": ui_apps, "pages": ui_pages, "components": ui_components, "pageComponents": ui_page_components, "validationRules": ui_validation_rules, "searchFacets": ui_search_facets},
            "lineage": {"assets": lineage_assets, "edges": lineage_edges, "jobRuns": job_runs, "jobRunAssets": job_run_assets},
            "sync": {"policies": sync_policies},
            "biModel": {"facts": bi_facts, "dimensions": bi_dimensions, "partitions": bi_partitions}

        }
    }

    validate_snapshot(snap)
    return snap

def save_snapshot(snapshot: Dict[str, Any], out_path: str | Path) -> None:
    Path(out_path).write_text(json.dumps(snapshot, indent=2), encoding="utf-8")
