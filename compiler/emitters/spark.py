"""Spark SQL / Databricks DDL emitter.

Steps:
  1.1 Map types to Spark SQL types
  1.2 Generate CREATE SCHEMA statements
  2.1 Generate CREATE TABLE statements (Delta Lake)
  2.2 Add partitioning and Z-ORDER clustering
  3.1 Generate table properties
"""

from __future__ import annotations
from typing import Dict, Any
from ..ir import ProjectIR


# Type mapping: OZMetaDB type -> Spark SQL type
SPARK_TYPE_MAP = {
    "uuidv7": "STRING",
    "uuid": "STRING",
    "uniqueidentifier": "STRING",
    "datetime2": "TIMESTAMP",
    "datetime": "TIMESTAMP",
    "timestamp": "TIMESTAMP",
    "int": "INT",
    "integer": "INT",
    "bigint": "BIGINT",
    "decimal": "DECIMAL(18,2)",
    "float": "DOUBLE",
    "bit": "BOOLEAN",
    "boolean": "BOOLEAN",
    "nvarchar(max)": "STRING",
    "text": "STRING",
}


def map_type(t: str) -> str:
    """Map OZMetaDB type to Spark SQL type."""
    t_lower = t.lower()
    if t_lower in SPARK_TYPE_MAP:
        return SPARK_TYPE_MAP[t_lower]
    # Handle nvarchar(N) -> STRING
    if t_lower.startswith("nvarchar") or t_lower.startswith("varchar"):
        return "STRING"
    return "STRING"


class SparkEmitter:
    """Spark SQL / Databricks DDL emitter."""
    name = "spark"

    def emit(self, ir: ProjectIR, options: Dict[str, Any]) -> Dict[str, str]:
        """Emit Spark SQL DDL files.

        Steps:
          1.1 Collect unique schemas
          1.2 Generate schema DDL
          2.1 Generate table DDL with columns
          2.2 Add soft-delete columns
          2.3 Configure Delta Lake properties
          3.1 Return file map
        """
        catalog = options.get("catalog", "main")
        use_unity_catalog = options.get("unity_catalog", True)

        lines = [
            "-- Generated Spark SQL / Databricks DDL",
            "-- OZMetaDB Compiler",
            "",
            f"-- Catalog: {catalog}",
            f"-- Unity Catalog: {use_unity_catalog}",
            "",
        ]

        if use_unity_catalog:
            lines.append(f"USE CATALOG {catalog};")
            lines.append("")

        # 1.1 Collect unique schemas
        schemas = set()
        for tb in ir.tables:
            schemas.add(tb.schema)

        # 1.2 Generate schema DDL
        for schema in sorted(schemas):
            lines.append(f"CREATE SCHEMA IF NOT EXISTS {schema};")
        lines.append("")

        # 2.1 Generate table DDL
        for tb in ir.tables:
            cols = []
            pk_col = None
            has_tenant = False

            for f in tb.fields:
                col_type = map_type(f.type)
                null_clause = " NOT NULL" if not f.nullable else ""
                comment = ""
                if f.ref:
                    comment = f" COMMENT 'FK to {f.ref}'"
                cols.append(f"    {f.code} {col_type}{null_clause}{comment}")
                if f.code.endswith("_ID") and pk_col is None:
                    pk_col = f.code
                if f.code.lower() == "_tenantid":
                    has_tenant = True

            # 2.2 Add soft-delete columns
            cols.extend([
                "    _CreateDate TIMESTAMP NOT NULL",
                "    _CreatedBy STRING",
                "    _UpdateDate TIMESTAMP",
                "    _UpdatedBy STRING",
                "    _DeleteDate TIMESTAMP",
                "    _DeletedBy STRING",
            ])

            lines.append(f"CREATE TABLE IF NOT EXISTS {tb.schema}.{tb.code} (")
            lines.append(",\n".join(cols))
            lines.append(")")
            lines.append("USING DELTA")

            # 2.3 Configure Delta Lake properties
            if has_tenant:
                lines.append("PARTITIONED BY (_TenantID)")

            lines.append("TBLPROPERTIES (")
            lines.append("    'delta.autoOptimize.optimizeWrite' = 'true',")
            lines.append("    'delta.autoOptimize.autoCompact' = 'true',")
            lines.append("    'delta.deletedFileRetentionDuration' = 'interval 30 days',")
            lines.append("    'delta.logRetentionDuration' = 'interval 90 days'")
            lines.append(");")
            lines.append("")

            # Add Z-ORDER optimization hint
            if pk_col:
                lines.append(f"-- OPTIMIZE {tb.schema}.{tb.code} ZORDER BY ({pk_col}, _CreateDate);")
                lines.append("")

        # Add row-level security note
        lines.extend([
            "-- Row-Level Security (Unity Catalog)",
            "-- Use row filters for multi-tenant access:",
            "-- ALTER TABLE schema.table SET ROW FILTER tenant_filter ON (_TenantID);",
            "",
            "-- CREATE FUNCTION tenant_filter(tenant_id STRING)",
            "--   RETURNS BOOLEAN",
            "--   RETURN tenant_id = current_user_tenant();",
            "",
        ])

        return {"sql/10-data-plane.spark.sql": "\n".join(lines)}
