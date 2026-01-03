#!/usr/bin/env python3
"""OZMetaDB Generator (snapshot-first, minimal working)

- Reads a metadata snapshot JSON
- Emits deterministic artifacts (SQL templates) so CI can validate generator viability

Extend by adding emitters for:
- constraints/indexes profiles
- tenancy and security enforcement
- document/evidence storage patterns
- BI semantic models
- search/graph adapters
"""

from __future__ import annotations

import argparse
import json
import re
import hashlib
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List


def load_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def sha256_bytes(b: bytes) -> str:
    h = hashlib.sha256()
    h.update(b)
    return h.hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def write_manifest(out_dir: Path, snapshot_path: Path) -> None:
    """Write deterministic manifest.json with per-file hashes."""
    files = []
    for p in sorted([x for x in out_dir.rglob("*") if x.is_file()]):
        rel = p.relative_to(out_dir).as_posix()
        if rel == "manifest.json":
            continue
        data = p.read_bytes()
        files.append({"path": rel, "bytes": len(data), "sha256": sha256_bytes(data)})

    snap_hash = sha256_file(snapshot_path)
    # stable aggregate hash over (path + sha256)
    agg_lines = [f'{f["path"]}\t{f["sha256"]}' for f in files]
    outputs_hash = sha256_bytes(("\n".join(agg_lines) + "\n").encode("utf-8"))

    manifest = {
        "schema": "ozmeta.manifest.v1",
        "generatedAtUTC": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "snapshot": {"path": snapshot_path.as_posix(), "sha256": snap_hash},
        "outputsSha256": outputs_hash,
        "files": files,
    }
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


@dataclass
class Table:
    schema: str
    code: str
    fields: List[Dict[str, Any]]


def collect_tables(snapshot: Dict[str, Any]) -> List[Table]:
    objs = snapshot.get("objects", {})
    model = objs.get("model", {})
    tables = model.get("tables", [])
    out: List[Table] = []
    for t in tables:
        out.append(Table(schema=t.get("schema", "dbo"), code=t.get("code", "Unknown"), fields=t.get("fields", [])))
    return out


def sql_type(field: Dict[str, Any]) -> str:
    t = str(field.get("type", "nvarchar(200)")).lower()
    if t in ("uuid", "uniqueidentifier", "uuidv7"):
        return "uniqueidentifier"
    if t in ("datetime", "datetime2", "timestamp"):
        return "datetime2(3)"
    if t in ("int", "integer"):
        return "int"
    if t.startswith("nvarchar") or t.startswith("varchar"):
        return t
    return "nvarchar(200)"


def emit_data_plane_sql(tables: List[Table]) -> str:
    lines: List[str] = [
        "/* Generated Data Plane DDL (starter) */",
        "/* Extend: PK/FK, indexes, soft-delete, archive, tenancy, security */",
        "",
        "CREATE SCHEMA dp;",
        "GO",
        "",
    ]
    if not tables:
        lines += [
            "-- No model.tables found in snapshot, emitting dp.Sample",
            "IF OBJECT_ID('dp.Sample','U') IS NULL",
            "BEGIN",
            "  CREATE TABLE dp.Sample (",
            "    Sample_ID uniqueidentifier NOT NULL,",
            "    Sample_Name nvarchar(200) NOT NULL,",
            "    _CreateDate datetime2(3) NOT NULL DEFAULT (sysutcdatetime()),",
            "    _CreatedBy nvarchar(128) NULL,",
            "    _DeleteDate datetime2(3) NULL,",
            "    _DeletedBy nvarchar(128) NULL,",
            "    CONSTRAINT pk_Sample PRIMARY KEY (Sample_ID)",
            "  );",
            "END",
            "GO",
        ]
        return "\n".join(lines)

    for t in tables:
        full = f"[{t.schema}].[{t.code}]"
        lines += [f"IF OBJECT_ID('{t.schema}.{t.code}','U') IS NULL", "BEGIN", f"  CREATE TABLE {full} ("]
        if not t.fields:
            lines += ["    ID uniqueidentifier NOT NULL,", "    Name nvarchar(200) NOT NULL,"]
        else:
            for f in t.fields:
                name = f.get("code", "Field")
                nullable = bool(f.get("nullable", True))
                lines.append(f"    [{name}] {sql_type(f)} {'NULL' if nullable else 'NOT NULL'},")
        lines += [
            "    _CreateDate datetime2(3) NOT NULL DEFAULT (sysutcdatetime()),",
            "    _CreatedBy nvarchar(128) NULL,",
            "    _UpdateDate datetime2(3) NULL,",
            "    _UpdatedBy nvarchar(128) NULL,",
            "    _DeleteDate datetime2(3) NULL,",
            "    _DeletedBy nvarchar(128) NULL",
            "  );",
            "END",
            "GO",
            "",
        ]
    return "\n".join(lines)


def emit_workflow_runtime_sql() -> str:
    return """/* Workflow Runtime (starter) */
CREATE SCHEMA wf;
GO

IF OBJECT_ID('wf.WorkflowInstance','U') IS NULL
BEGIN
  CREATE TABLE wf.WorkflowInstance (
    WI_ID uniqueidentifier NOT NULL CONSTRAINT pk_WI PRIMARY KEY,
    WI_WorkflowCode nvarchar(120) NOT NULL,
    WI_EntityID uniqueidentifier NULL,
    WI_CurrentState nvarchar(120) NOT NULL,
    WI_SlaDueUTC datetime2(3) NULL,
    WI_SlaBreached bit NOT NULL DEFAULT (0),
    WI_EscalationLevel int NOT NULL DEFAULT (0),
    _CreateDate datetime2(3) NOT NULL DEFAULT (sysutcdatetime()),
    _CreatedBy nvarchar(128) NULL,
    _UpdateDate datetime2(3) NULL,
    _UpdatedBy nvarchar(128) NULL
  );
END
GO

IF OBJECT_ID('wf.WorkflowEvent','U') IS NULL
BEGIN
  CREATE TABLE wf.WorkflowEvent (
    WE_ID uniqueidentifier NOT NULL CONSTRAINT pk_WE PRIMARY KEY,
    WI_ID uniqueidentifier NOT NULL,
    WE_AtUTC datetime2(3) NOT NULL,
    WE_EventType nvarchar(60) NOT NULL,
    WE_FromState nvarchar(120) NULL,
    WE_ToState nvarchar(120) NULL,
    WE_Actor nvarchar(200) NULL,
    WE_PayloadJSON nvarchar(max) NULL,
    CONSTRAINT fk_WE_WI FOREIGN KEY (WI_ID) REFERENCES wf.WorkflowInstance(WI_ID)
  );
  CREATE INDEX ix_WE_WI ON wf.WorkflowEvent(WI_ID, WE_AtUTC);
END
GO
"""


def emit_audit_sql() -> str:
    return """/* Immutable Audit Journal (starter) */
CREATE SCHEMA aud;
GO

IF OBJECT_ID('aud.AuditEvent','U') IS NULL
BEGIN
  CREATE TABLE aud.AuditEvent (
    AE_ID uniqueidentifier NOT NULL CONSTRAINT pk_AE PRIMARY KEY,
    AE_AtUTC datetime2(3) NOT NULL,
    AE_Actor nvarchar(200) NULL,
    AE_Action nvarchar(120) NOT NULL,
    AE_ObjectType nvarchar(80) NULL,
    AE_ObjectID uniqueidentifier NULL,
    AE_CorrelationID nvarchar(80) NULL,
    AE_PayloadJSON nvarchar(max) NULL
  );
  CREATE INDEX ix_AE_At ON aud.AuditEvent(AE_AtUTC);
END
GO
"""

def emit_enums_sql(snapshot: Dict[str, Any]) -> str:
    enums = snapshot.get("objects", {}).get("enums", {})
    if isinstance(enums, list):
        enums = {"enums": enums, "values": []}
    enum_list = enums.get("enums", [])
    values = enums.get("values", [])
    lines = ["/* Generated Enums (starter) */", "CREATE SCHEMA lkp;", "GO", ""]
    if not enum_list:
        lines.append("-- No enums in snapshot.")
        return "\n".join(lines)

    for e in enum_list:
        code = e.get("code") or e.get("EN_Code") or "Enum"
        table = f"lkp.{code}"
        lines += [
            f"IF OBJECT_ID('{table}','U') IS NULL",
            "BEGIN",
            f"  CREATE TABLE {table} (",
            f"    {code}_Code nvarchar(80) NOT NULL,",
            "    SortOrder int NOT NULL CONSTRAINT df_Sort DEFAULT (0),",
            "    IsDefault bit NOT NULL CONSTRAINT df_IsDefault DEFAULT (0),",
            "    _CreateDate datetime2(3) NOT NULL DEFAULT (sysutcdatetime()),",
            "    _CreatedBy nvarchar(128) NULL,",
            "    _DeleteDate datetime2(3) NULL,",
            "    _DeletedBy nvarchar(128) NULL,",
            f"    CONSTRAINT pk_{code} PRIMARY KEY ({code}_Code)",
            "  );",
            "END",
            "GO",
            "",
        ]
        rows = [v for v in values if v.get("enumCode") == code or v.get("enumId") == e.get("id") or v.get("EV_EnumCode") == code]
        for v in sorted(rows, key=lambda x: int(x.get("sort", x.get("EV_Sort", 0)) or 0)):
            vcode = v.get("code") or v.get("EV_Code")
            sort = int(v.get("sort", v.get("EV_Sort", 0)) or 0)
            isdef = 1 if (v.get("isDefault") or v.get("EV_IsDefault")) else 0
            if vcode:
                lines.append(f"IF NOT EXISTS (SELECT 1 FROM {table} WHERE {code}_Code = '{vcode}') INSERT INTO {table}({code}_Code, SortOrder, IsDefault) VALUES ('{vcode}', {sort}, {isdef});")
        lines += ["GO", ""]
    return "\n".join(lines)


def emit_documents_sql(snapshot: Dict[str, Any]) -> str:
    docs = snapshot.get("objects", {}).get("documents", {})
    if isinstance(docs, list):
        docs = {"documentTypes": docs, "retentionPolicies": [], "redactionPolicies": []}
    dtypes = docs.get("documentTypes", [])
    lines = [
        "/* Generated Documents/Evidence Tables (starter) */",
        "CREATE SCHEMA doc;",
        "GO",
        "",
        "IF OBJECT_ID('doc.Document','U') IS NULL",
        "BEGIN",
        "  CREATE TABLE doc.Document (",
        "    DOC_ID uniqueidentifier NOT NULL CONSTRAINT pk_DOC PRIMARY KEY,",
        "    DOC_TypeCode nvarchar(120) NOT NULL,",
        "    DOC_Title nvarchar(300) NULL,",
        "    DOC_MimeType nvarchar(120) NULL,",
        "    DOC_SizeBytes bigint NULL,",
        "    DOC_StorageUri nvarchar(1000) NULL,",
        "    DOC_ContentHash nvarchar(200) NULL,",
        "    DOC_IntegrityMode nvarchar(40) NULL,",
        "    DOC_Class nvarchar(60) NULL,",
        "    _TenantID uniqueidentifier NULL,",
        "    _CreateDate datetime2(3) NOT NULL DEFAULT (sysutcdatetime()),",
        "    _CreatedBy nvarchar(128) NULL,",
        "    _DeleteDate datetime2(3) NULL,",
        "    _DeletedBy nvarchar(128) NULL",
        "  );",
        "  CREATE INDEX ix_DOC_Type ON doc.Document(DOC_TypeCode, _TenantID) WHERE _DeleteDate IS NULL;",
        "END",
        "GO",
        "",
        "IF OBJECT_ID('doc.ChainOfCustodyEvent','U') IS NULL",
        "BEGIN",
        "  CREATE TABLE doc.ChainOfCustodyEvent (",
        "    COC_ID uniqueidentifier NOT NULL CONSTRAINT pk_COC PRIMARY KEY,",
        "    DOC_ID uniqueidentifier NOT NULL,",
        "    COC_AtUTC datetime2(3) NOT NULL,",
        "    COC_Action nvarchar(120) NOT NULL,",
        "    COC_Actor nvarchar(200) NULL,",
        "    COC_PayloadJSON nvarchar(max) NULL,",
        "    CONSTRAINT fk_COC_DOC FOREIGN KEY (DOC_ID) REFERENCES doc.Document(DOC_ID)",
        "  );",
        "  CREATE INDEX ix_COC_DOC ON doc.ChainOfCustodyEvent(DOC_ID, COC_AtUTC);",
        "END",
        "GO",
        "",
    ]
    if dtypes:
        lines += ["-- Document types present in snapshot:"] + [f"-- - {d.get('code') or d.get('DT_Code')}" for d in dtypes]
    return "\n".join(lines)


def emit_constraint_profile_notes(snapshot: Dict[str, Any]) -> str:
    return "/* ConstraintProfile: pass-3 will compile naming/index/enforcement rules from Meta.ConstraintProfile */\n"


def _safe_ident(s: str) -> str:
    # minimal identifier safety for generated SQL
    return re.sub(r"[^A-Za-z0-9_\[\]\.]", "_", s)


def emit_constraints_sql(snapshot: Dict[str, Any]) -> str:
    """Emit PK/FK constraints based on optional field metadata.

    Supported field shapes:
    - { code, type, nullable, fk: { schema, table, field }, fkName? }
    - { code, ..., ref: { table, field, schema? } }
    """
    tables = snapshot.get("objects", {}).get("model", {}).get("tables", [])
    lines = ["/* Generated Constraints (PK/FK) */", "/* Notes: extend to composite keys, deferrable FKs, check constraints */", ""]
    if not tables:
        lines.append("-- No model.tables found.")
        return "\n".join(lines)

    for t in tables:
        schema = t.get("schema", "dbo")
        code = t.get("code", "Unknown")
        full = f"[{schema}].[{code}]"
        fields = t.get("fields", [])
        for f in fields:
            fk = f.get("fk") or f.get("ref")
            if not fk:
                continue
            ref_schema = fk.get("schema", "dbo")
            ref_table = fk.get("table") or fk.get("TB_Code") or fk.get("tableCode") or fk.get("code")
            ref_field = fk.get("field") or fk.get("FD_Code") or fk.get("fieldCode") or "ID"
            col = f.get("code") or f.get("FD_Code")
            if not (ref_table and col):
                continue
            cname = f.get("fkName") or f"fk_{code}_{col}"
            lines += [
                f"IF OBJECT_ID('{schema}.{code}','U') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = '{cname}')",
                "BEGIN",
                f"  ALTER TABLE {full} WITH CHECK ADD CONSTRAINT [{cname}] FOREIGN KEY ([{col}]) REFERENCES [{ref_schema}].[{ref_table}]([{ref_field}]);",
                f"  ALTER TABLE {full} CHECK CONSTRAINT [{cname}];",
                "END",
                "GO",
                "",
            ]
    return "\n".join(lines)


def emit_indexes_sql(snapshot: Dict[str, Any]) -> str:
    """Emit indexes based on optional metadata.

    Supported:
    - table.indexes: [{ name, columns:[...], unique, where, include:[...] }]
    - field.isIndexed / field.index: true
    """
    tables = snapshot.get("objects", {}).get("model", {}).get("tables", [])
    lines = ["/* Generated Indexes */", ""]
    if not tables:
        lines.append("-- No model.tables found.")
        return "\n".join(lines)

    for t in tables:
        schema = t.get("schema", "dbo")
        code = t.get("code", "Unknown")
        full = f"[{schema}].[{code}]"
        idxs = t.get("indexes", []) or []
        # derive from fields
        fields = t.get("fields", []) or []
        for f in fields:
            if f.get("isIndexed") or f.get("index") is True:
                col = f.get("code") or "Field"
                idxs.append({"name": f"ix_{code}_{col}", "columns": [col], "unique": False, "where": None, "include": []})

        for ix in idxs:
            name = ix.get("name") or f"ix_{code}_auto"
            cols = ix.get("columns") or []
            if not cols:
                continue
            cols_sql = ", ".join(f"[{c}]" for c in cols)
            unique = "UNIQUE " if ix.get("unique") else ""
            include = ix.get("include") or []
            include_sql = f" INCLUDE ({', '.join(f'[{c}]' for c in include)})" if include else ""
            where = ix.get("where")
            where_sql = f" WHERE {where}" if where else ""
            lines += [
                f"IF OBJECT_ID('{schema}.{code}','U') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = '{name}' AND object_id = OBJECT_ID('{schema}.{code}'))",
                "BEGIN",
                f"  CREATE {unique}INDEX [{name}] ON {full} ({cols_sql}){include_sql}{where_sql};",
                "END",
                "GO",
                "",
            ]
    return "\n".join(lines)


def emit_workflow_defs_sql(snapshot: Dict[str, Any]) -> str:
    wf = snapshot.get("objects", {}).get("workflows", {})
    workflows = wf.get("workflows", []) if isinstance(wf, dict) else []
    states = wf.get("states", []) if isinstance(wf, dict) else []
    trans = wf.get("transitions", []) if isinstance(wf, dict) else []
    lines = [
        "/* Generated Workflow Definitions (seed tables) */",
        "CREATE SCHEMA wfd;",
        "GO",
        "",
        "IF OBJECT_ID('wfd.Workflow','U') IS NULL",
        "BEGIN",
        "  CREATE TABLE wfd.Workflow(",
        "    WF_ID uniqueidentifier NOT NULL CONSTRAINT pk_wfd_WF PRIMARY KEY,",
        "    WF_Code nvarchar(120) NOT NULL,",
        "    WF_ConfigJSON nvarchar(max) NULL,",
        "    _CreateDate datetime2(3) NOT NULL DEFAULT (sysutcdatetime()),",
        "    _CreatedBy nvarchar(128) NULL,",
        "    _DeleteDate datetime2(3) NULL,",
        "    _DeletedBy nvarchar(128) NULL",
        "  );",
        "  CREATE UNIQUE INDEX ix_wfd_WF_Code ON wfd.Workflow(WF_Code) WHERE _DeleteDate IS NULL;",
        "END",
        "GO",
        "",
        "IF OBJECT_ID('wfd.State','U') IS NULL",
        "BEGIN",
        "  CREATE TABLE wfd.State(",
        "    ST_ID uniqueidentifier NOT NULL CONSTRAINT pk_wfd_ST PRIMARY KEY,",
        "    WF_ID uniqueidentifier NOT NULL,",
        "    ST_Code nvarchar(120) NOT NULL,",
        "    ST_IsInitial bit NOT NULL DEFAULT (0),",
        "    ST_IsTerminal bit NOT NULL DEFAULT (0),",
        "    ST_SlaMinutes int NULL,",
        "    ST_ConfigJSON nvarchar(max) NULL,",
        "    CONSTRAINT fk_wfd_ST_WF FOREIGN KEY (WF_ID) REFERENCES wfd.Workflow(WF_ID)",
        "  );",
        "  CREATE INDEX ix_wfd_ST_WF ON wfd.State(WF_ID, ST_Code);",
        "END",
        "GO",
        "",
        "IF OBJECT_ID('wfd.Transition','U') IS NULL",
        "BEGIN",
        "  CREATE TABLE wfd.Transition(",
        "    TRN_ID uniqueidentifier NOT NULL CONSTRAINT pk_wfd_TRN PRIMARY KEY,",
        "    WF_ID uniqueidentifier NOT NULL,",
        "    TRN_Code nvarchar(120) NOT NULL,",
        "    FromST_ID uniqueidentifier NULL,",
        "    ToST_ID uniqueidentifier NOT NULL,",
        "    TRN_GuardDSL nvarchar(max) NULL,",
        "    TRN_ActionDSL nvarchar(max) NULL,",
        "    TRN_ApprovalPolicyID uniqueidentifier NULL,",
        "    TRN_ConfigJSON nvarchar(max) NULL,",
        "    CONSTRAINT fk_wfd_TRN_WF FOREIGN KEY (WF_ID) REFERENCES wfd.Workflow(WF_ID),",
        "    CONSTRAINT fk_wfd_TRN_From FOREIGN KEY (FromST_ID) REFERENCES wfd.State(ST_ID),",
        "    CONSTRAINT fk_wfd_TRN_To FOREIGN KEY (ToST_ID) REFERENCES wfd.State(ST_ID)",
        "  );",
        "  CREATE INDEX ix_wfd_TRN_WF ON wfd.Transition(WF_ID);",
        "END",
        "GO",
        "",
    ]

    # Seed data (idempotent)
    if workflows:
        lines.append("-- Seed workflows/states/transitions from snapshot")
        for w in workflows:
            wid=w.get("id") or w.get("WF_ID")
            code=w.get("code") or w.get("WF_Code")
            cfg=w.get("configJson") or w.get("WF_ConfigJSON") or "{}"
            if wid and code:
                lines.append(f"IF NOT EXISTS (SELECT 1 FROM wfd.Workflow WHERE WF_ID = '{wid}') INSERT INTO wfd.Workflow(WF_ID, WF_Code, WF_ConfigJSON) VALUES ('{wid}', '{code}', '{cfg}');")
        lines.append("GO")
        for s in states:
            sid=s.get("id") or s.get("ST_ID")
            wid=s.get("workflowId") or s.get("WF_ID")
            code=s.get("code") or s.get("ST_Code")
            ini=1 if (s.get("isInitial") or s.get("ST_IsInitial")) else 0
            ter=1 if (s.get("isTerminal") or s.get("ST_IsTerminal")) else 0
            sla=s.get("slaMinutes") or s.get("ST_SlaMinutes")
            sla_sql="NULL" if sla is None else str(int(sla))
            cfg=s.get("configJson") or s.get("ST_ConfigJSON") or "{}"
            if sid and wid and code:
                lines.append(f"IF NOT EXISTS (SELECT 1 FROM wfd.State WHERE ST_ID = '{sid}') INSERT INTO wfd.State(ST_ID, WF_ID, ST_Code, ST_IsInitial, ST_IsTerminal, ST_SlaMinutes, ST_ConfigJSON) VALUES ('{sid}', '{wid}', '{code}', {ini}, {ter}, {sla_sql}, '{cfg}');")
        lines.append("GO")
        for tr in trans:
            tid=tr.get("id") or tr.get("TRN_ID")
            wid=tr.get("workflowId") or tr.get("WF_ID")
            code=tr.get("code") or tr.get("TRN_Code")
            fs=tr.get("fromStateId") or tr.get("FromST_ID")
            ts=tr.get("toStateId") or tr.get("ToST_ID")
            gd=tr.get("guardDsl") or tr.get("TRN_GuardDSL") or ""
            ad=tr.get("actionDsl") or tr.get("TRN_ActionDSL") or ""
            ap=tr.get("approvalPolicyId") or tr.get("TRN_ApprovalPolicyID")
            ap_sql="NULL" if not ap else f"'{ap}'"
            cfg=tr.get("configJson") or tr.get("TRN_ConfigJSON") or "{}"
            if tid and wid and code and ts:
                fs_sql="NULL" if not fs else f"'{fs}'"
                lines.append(f"IF NOT EXISTS (SELECT 1 FROM wfd.Transition WHERE TRN_ID = '{tid}') INSERT INTO wfd.Transition(TRN_ID, WF_ID, TRN_Code, FromST_ID, ToST_ID, TRN_GuardDSL, TRN_ActionDSL, TRN_ApprovalPolicyID, TRN_ConfigJSON) VALUES ('{tid}', '{wid}', '{code}', {fs_sql}, '{ts}', '{gd}', '{ad}', {ap_sql}, '{cfg}');")
        lines.append("GO")
    else:
        lines.append("-- No workflows in snapshot; definitions tables only.")
    return "\n".join(lines)


def _compile_predicate_dsl_to_sql(dsl: str) -> str:
    """Very small portable DSL stub (pass-3+ will replace).

    Supported examples:
    - "tenant" => "_TenantID = CAST(SESSION_CONTEXT(N'TenantID') as uniqueidentifier)"
    - "allow" => "1=1"
    Unknown => "1=0" (deny by default in generated RLS)
    """
    d = (dsl or "").strip().lower()
    if d in ("tenant", "tenant_only", "tenantid"):
        return "_TenantID = CAST(SESSION_CONTEXT(N'TenantID') as uniqueidentifier)"
    if d in ("allow", "true", "1=1"):
        return "1=1"
    return "1=0"


def emit_rls_sql(snapshot: Dict[str, Any]) -> str:
    """Emit SQL Server RLS scaffolding. Uses security policies metadata if present."""
    sec = snapshot.get("objects", {}).get("security", {})
    policies = sec.get("policies", []) if isinstance(sec, dict) else []
    tables = snapshot.get("objects", {}).get("model", {}).get("tables", [])
    lines = [
        "/* Generated RLS/FLS Scaffolding (SQL Server) */",
        "/* Uses SESSION_CONTEXT('TenantID') and optional policy DSL */",
        "CREATE SCHEMA sec;",
        "GO",
        "",
        "IF OBJECT_ID('sec.fn_rls_tenant','IF') IS NULL",
        "BEGIN",
        "  EXEC('CREATE FUNCTION sec.fn_rls_tenant(@TenantID uniqueidentifier) RETURNS TABLE WITH SCHEMABINDING AS RETURN SELECT 1 AS fn_result WHERE @TenantID = CAST(SESSION_CONTEXT(N''TenantID'') as uniqueidentifier);');",
        "END",
        "GO",
        "",
    ]

    # Default: apply tenant RLS to any table that has _TenantID column
    for t in tables or []:
        schema=t.get("schema","dbo"); code=t.get("code","Unknown"); full=f"[{schema}].[{code}]"
        fields=t.get("fields",[])
        has_tenant=any((f.get("code") or "").lower() in ("_tenantid","_tenant_id") for f in fields)
        if not has_tenant:
            continue
        policy_name=f"rls_{schema}_{code}"
        lines += [
            f"IF OBJECT_ID('{schema}.{code}','U') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys.security_policies WHERE name = '{policy_name}')",
            "BEGIN",
            f"  CREATE SECURITY POLICY [{policy_name}] ADD FILTER PREDICATE sec.fn_rls_tenant(_TenantID) ON {full} WITH (STATE = ON);",
            "END",
            "GO",
            "",
        ]

    # Policy DSL (optional, future) - emit comment placeholders
    if policies:
        lines.append("-- Additional policies defined in snapshot.security.policies (DSL compile stub)")
        for p in policies:
            code=p.get("code") or "Policy"
            dsl=p.get("ruleDsl") or p.get("dsl") or ""
            sql=_compile_predicate_dsl_to_sql(dsl)
            lines.append(f"-- {code}: {dsl} => {sql}")
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--snapshot", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    snap = load_json(Path(args.snapshot))
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    tables = collect_tables(snap)

    write_text(out / "README.md", "# Generated Artifacts\n\nGenerated from snapshot.\n")
    write_text(out / "sql" / "10-data-plane.sql", emit_data_plane_sql(tables))
    write_text(out / "sql" / "20-workflow-runtime.sql", emit_workflow_runtime_sql())
    write_text(out / "sql" / "30-audit.sql", emit_audit_sql())
    write_text(out / "sql" / "40-enums.sql", emit_enums_sql(snap))
    write_text(out / "sql" / "50-documents.sql", emit_documents_sql(snap))
    write_text(out / "sql" / "90-constraint-profile.sql", emit_constraint_profile_notes(snap))
    write_text(out / "sql" / "60-constraints.sql", emit_constraints_sql(snap))
    write_text(out / "sql" / "70-indexes.sql", emit_indexes_sql(snap))
    write_text(out / "sql" / "80-workflow-defs.sql", emit_workflow_defs_sql(snap))
    write_text(out / "sql" / "85-rls.sql", emit_rls_sql(snap))

    # Deterministic manifest for CI/golden tests
    write_manifest(out, Path(args.snapshot))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
