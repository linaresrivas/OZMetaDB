"""Multi-platform DDL compiler.

Steps:
  1.1 Load snapshot JSON
  1.2 Build intermediate representation (IR)
  2.1 Select target emitter
  2.2 Emit DDL files
  3.1 Write output files

Supported targets:
  - postgres   : PostgreSQL
  - bigquery   : Google BigQuery
  - redshift   : Amazon Redshift
  - snowflake  : Snowflake
  - spark      : Spark SQL / Databricks
"""

from __future__ import annotations
import argparse
import json
from pathlib import Path
from .ir import build_ir
from .emitters.postgres import PostgresEmitter
from .emitters.bigquery import BigQueryEmitter
from .emitters.redshift import RedshiftEmitter
from .emitters.snowflake import SnowflakeEmitter
from .emitters.spark import SparkEmitter

EMITTERS = {
    "postgres": PostgresEmitter(),
    "bigquery": BigQueryEmitter(),
    "redshift": RedshiftEmitter(),
    "snowflake": SnowflakeEmitter(),
    "spark": SparkEmitter(),
}

def main() -> int:
    ap=argparse.ArgumentParser()
    ap.add_argument("--snapshot", required=True)
    ap.add_argument("--target", required=True, choices=sorted(EMITTERS.keys()))
    ap.add_argument("--out", required=True)
    ap.add_argument("--options", default="{}")
    args=ap.parse_args()

    snap=json.loads(Path(args.snapshot).read_text(encoding="utf-8"))
    ir=build_ir(snap)
    opts=json.loads(args.options)
    files=EMITTERS[args.target].emit(ir, opts)
    out=Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    for rel, content in files.items():
        p=out/rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
