"""Job/Pipeline Compiler - compiles canonical jobs to scheduler formats.

Steps:
  1.1 Parse job definition (steps, dependencies)
  1.2 Resolve step order via DAG
  2.1 Emit to target scheduler

Supports:
  - Airflow (DAG Python)
  - Prefect (Flow Python)
  - Dagster (Job Python)
  - Cron (crontab format)
  - Azure Data Factory (ADF JSON)
  - Databricks Workflows (JSON)
  - AWS Step Functions (JSON)
  - Fabric Pipelines (JSON)
"""

from .compiler import (
    JobCompiler,
    compile_job,
    compile_pipeline,
    SCHEDULER_AIRFLOW,
    SCHEDULER_PREFECT,
    SCHEDULER_DAGSTER,
    SCHEDULER_CRON,
    SCHEDULER_ADF,
    SCHEDULER_DATABRICKS,
    SCHEDULER_STEP_FUNCTIONS,
    SCHEDULER_FABRIC,
)

__all__ = [
    "JobCompiler",
    "compile_job",
    "compile_pipeline",
    "SCHEDULER_AIRFLOW",
    "SCHEDULER_PREFECT",
    "SCHEDULER_DAGSTER",
    "SCHEDULER_CRON",
    "SCHEDULER_ADF",
    "SCHEDULER_DATABRICKS",
    "SCHEDULER_STEP_FUNCTIONS",
    "SCHEDULER_FABRIC",
]
