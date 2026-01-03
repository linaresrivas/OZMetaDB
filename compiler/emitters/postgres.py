from __future__ import annotations
from typing import Dict, Any
from ..ir import ProjectIR

PG_TYPE_MAP={"uuidv7":"uuid","datetime2":"timestamptz"}
def map_type(t: str) -> str:
    return PG_TYPE_MAP.get(t, t.replace("nvarchar","varchar"))

class PostgresEmitter:
    name="postgres"
    def emit(self, ir: ProjectIR, options: Dict[str, Any]) -> Dict[str, str]:
        lines=["-- Generated Postgres DDL (starter)"]
        for tb in ir.tables:
            lines.append(f'CREATE SCHEMA IF NOT EXISTS "{tb.schema}";')
            cols=[]
            for f in tb.fields:
                cols.append(f'"{f.code}" {map_type(f.type)} {"NOT NULL" if not f.nullable else ""}'.strip())
            pk = next((f for f in tb.fields if f.code.endswith("_ID")), None)
            if pk:
                cols.append(f'CONSTRAINT pk_{tb.code.lower()} PRIMARY KEY ("{pk.code}")')
            lines.append(f'CREATE TABLE IF NOT EXISTS "{tb.schema}"."{tb.code}" (\n  ' + ",\n  ".join(cols) + "\n);\n")
        lines.append("-- RLS: enable row level security and add policies using _TenantID")
        return {"sql/10-data-plane.postgres.sql":"\n".join(lines)}
