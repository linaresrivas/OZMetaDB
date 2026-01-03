from __future__ import annotations
from typing import Dict, Any
from ..ir import ProjectIR

BQ_TYPE_MAP={"uuidv7":"STRING","datetime2":"TIMESTAMP"}
def map_type(t: str) -> str:
    return BQ_TYPE_MAP.get(t, "STRING" if "nvarchar" in t else t.upper())

class BigQueryEmitter:
    name="bigquery"
    def emit(self, ir: ProjectIR, options: Dict[str, Any]) -> Dict[str, str]:
        dataset=options.get("dataset","dp")
        lines=[f"-- BigQuery DDL (starter) dataset={dataset}"]
        for tb in ir.tables:
            table=f"`{dataset}.{tb.code}`"
            cols=[]
            for f in tb.fields:
                cols.append(f"  {f.code} {map_type(f.type)}" + (" NOT NULL" if not f.nullable else ""))
            lines.append(f"CREATE TABLE IF NOT EXISTS {table} (\n" + ",\n".join(cols) + "\n);\n")
        lines.append("-- Security: emit Row Access Policies / Authorized Views (future)")
        return {"sql/10-data-plane.bigquery.sql":"\n".join(lines)}
