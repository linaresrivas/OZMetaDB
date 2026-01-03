from __future__ import annotations
from typing import Dict, Any
from ..ir import ProjectIR

RS_TYPE_MAP={"uuidv7":"VARCHAR(36)","datetime2":"TIMESTAMP"}
def map_type(t: str) -> str:
    return RS_TYPE_MAP.get(t, "VARCHAR(256)" if "nvarchar" in t else t.upper())

class RedshiftEmitter:
    name="redshift"
    def emit(self, ir: ProjectIR, options: Dict[str, Any]) -> Dict[str, str]:
        schema=options.get("schema","dp")
        lines=[f"-- Redshift DDL (starter) schema={schema}", f"CREATE SCHEMA IF NOT EXISTS {schema};\n"]
        for tb in ir.tables:
            cols=[]
            for f in tb.fields:
                cols.append(f"  {f.code} {map_type(f.type)}" + (" NOT NULL" if not f.nullable else ""))
            lines.append(f"CREATE TABLE IF NOT EXISTS {schema}.{tb.code} (\n" + ",\n".join(cols) + "\n);\n")
        lines.append("-- Security: views-first + GRANTs (future)")
        return {"sql/10-data-plane.redshift.sql":"\n".join(lines)}
