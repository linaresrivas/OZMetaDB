"""Snowflake DDL emitter.

Steps:
  1.1 Map types to Snowflake types
  1.2 Generate CREATE SCHEMA statements
  2.1 Generate CREATE TABLE statements
  2.2 Add clustering keys and constraints
  3.1 Generate RLS policies (future)
"""

from __future__ import annotations
from typing import Dict, Any
from ..ir import ProjectIR


# Type mapping: OZMetaDB type -> Snowflake type
SNOWFLAKE_TYPE_MAP = {
    "uuidv7": "VARCHAR(36)",
    "uuid": "VARCHAR(36)",
    "uniqueidentifier": "VARCHAR(36)",
    "datetime2": "TIMESTAMP_NTZ",
    "datetime": "TIMESTAMP_NTZ",
    "timestamp": "TIMESTAMP_NTZ",
    "int": "INTEGER",
    "integer": "INTEGER",
    "bigint": "BIGINT",
    "decimal": "DECIMAL(18,2)",
    "float": "FLOAT",
    "bit": "BOOLEAN",
    "boolean": "BOOLEAN",
    "nvarchar(max)": "VARCHAR(16777216)",
    "text": "VARCHAR(16777216)",
}


def map_type(t: str) -> str:
    """Map OZMetaDB type to Snowflake type."""
    t_lower = t.lower()
    if t_lower in SNOWFLAKE_TYPE_MAP:
        return SNOWFLAKE_TYPE_MAP[t_lower]
    # Handle nvarchar(N) -> VARCHAR(N)
    if t_lower.startswith("nvarchar"):
        return t.upper().replace("NVARCHAR", "VARCHAR")
    if t_lower.startswith("varchar"):
        return t.upper()
    return "VARCHAR(1000)"


class SnowflakeEmitter:
    """Snowflake DDL emitter."""
    name = "snowflake"

    def emit(self, ir: ProjectIR, options: Dict[str, Any]) -> Dict[str, str]:
        """Emit Snowflake DDL files.

        Steps:
          1.1 Collect unique schemas
          1.2 Generate schema DDL
          2.1 Generate table DDL with columns
          2.2 Add soft-delete columns
          3.1 Return file map
        """
        lines = [
            "-- Generated Snowflake DDL",
            "-- OZMetaDB Compiler",
            "",
            "-- Note: Run with appropriate role and warehouse",
            "-- USE ROLE SYSADMIN;",
            "-- USE WAREHOUSE COMPUTE_WH;",
            "",
        ]

        # 1.1 Collect unique schemas
        schemas = set()
        for tb in ir.tables:
            schemas.add(tb.schema)

        # 1.2 Generate schema DDL
        for schema in sorted(schemas):
            lines.append(f'CREATE SCHEMA IF NOT EXISTS "{schema.upper()}";')
        lines.append("")

        # 2.1 Generate table DDL
        for tb in ir.tables:
            schema_upper = tb.schema.upper()
            table_upper = tb.code.upper()

            cols = []
            pk_col = None

            for f in tb.fields:
                col_type = map_type(f.type)
                null_clause = "" if f.nullable else " NOT NULL"
                cols.append(f'    "{f.code}" {col_type}{null_clause}')
                if f.code.endswith("_ID") and pk_col is None:
                    pk_col = f.code

            # 2.2 Add soft-delete columns
            cols.extend([
                '    "_CreateDate" TIMESTAMP_NTZ NOT NULL DEFAULT CURRENT_TIMESTAMP()',
                '    "_CreatedBy" VARCHAR(128)',
                '    "_UpdateDate" TIMESTAMP_NTZ',
                '    "_UpdatedBy" VARCHAR(128)',
                '    "_DeleteDate" TIMESTAMP_NTZ',
                '    "_DeletedBy" VARCHAR(128)',
            ])

            lines.append(f'CREATE TABLE IF NOT EXISTS "{schema_upper}"."{table_upper}" (')
            lines.append(",\n".join(cols))
            lines.append(");")
            lines.append("")

            # Add clustering key on _CreateDate for time-series queries
            lines.append(f'ALTER TABLE "{schema_upper}"."{table_upper}" CLUSTER BY ("_CreateDate");')
            lines.append("")

        # Add comment about row access policies
        lines.extend([
            "-- Row Access Policies (RLS)",
            "-- Create row access policy for multi-tenant filtering:",
            "-- CREATE OR REPLACE ROW ACCESS POLICY tenant_filter AS (tenant_id VARCHAR)",
            "--   RETURNS BOOLEAN -> tenant_id = CURRENT_SESSION()::VARIANT:tenant_id;",
            "",
        ])

        return {"sql/10-data-plane.snowflake.sql": "\n".join(lines)}
