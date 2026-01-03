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
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List


def load_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


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
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
