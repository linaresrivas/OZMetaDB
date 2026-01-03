"""Job/Pipeline Compiler - compiles jobs to scheduler-specific formats.

Steps:
  1.1 Parse job metadata
  1.2 Build step DAG
  1.3 Emit to target scheduler
"""

from __future__ import annotations
import json
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set, Tuple
from datetime import datetime
from enum import Enum

# Scheduler constants
SCHEDULER_AIRFLOW = "airflow"
SCHEDULER_PREFECT = "prefect"
SCHEDULER_DAGSTER = "dagster"
SCHEDULER_CRON = "cron"
SCHEDULER_ADF = "adf"
SCHEDULER_DATABRICKS = "databricks"
SCHEDULER_STEP_FUNCTIONS = "step_functions"
SCHEDULER_FABRIC = "fabric"


class StepType(str, Enum):
    """Step execution types."""
    SQL = "sql"
    PYTHON = "python"
    NOTEBOOK = "notebook"
    SHELL = "shell"
    HTTP = "http"
    COPY = "copy"
    SPARK = "spark"
    STORED_PROC = "stored_proc"


@dataclass
class JobStep:
    """A step in a job/pipeline."""
    code: str
    name: str
    stepType: StepType
    command: Optional[str] = None
    script: Optional[str] = None
    parameters: Dict[str, Any] = field(default_factory=dict)
    dependsOn: List[str] = field(default_factory=list)
    timeout: Optional[int] = None  # seconds
    retries: int = 0
    retryDelay: int = 60  # seconds
    condition: Optional[str] = None  # Skip condition
    onFailure: Optional[str] = None  # Step to run on failure


@dataclass
class Job:
    """A job/pipeline definition."""
    code: str
    name: str
    description: Optional[str] = None
    schedule: Optional[str] = None  # Cron expression
    steps: List[JobStep] = field(default_factory=list)
    parameters: Dict[str, Any] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)
    owner: Optional[str] = None
    timeout: Optional[int] = None
    maxConcurrency: int = 1
    retries: int = 0
    alertOnFailure: bool = True
    alertEmail: Optional[str] = None


@dataclass
class CompiledJob:
    """Result of compiling a job."""
    jobCode: str
    scheduler: str
    code: str  # Generated code/config
    fileExtension: str
    dependencies: List[str] = field(default_factory=list)
    notes: Optional[str] = None


def parse_job(job_def: Dict[str, Any]) -> Job:
    """Parse a job definition from snapshot.

    Steps:
      1.1 Parse job metadata
      1.2 Parse steps
      1.3 Validate DAG
    """
    code = job_def.get("code") or job_def.get("JB_Code", "unknown_job")
    name = job_def.get("name") or job_def.get("JB_Name", code)

    steps = []
    for step_def in job_def.get("steps", []):
        step_type_str = step_def.get("type") or step_def.get("JS_Type", "sql")
        try:
            step_type = StepType(step_type_str.lower())
        except ValueError:
            step_type = StepType.SQL

        step = JobStep(
            code=step_def.get("code") or step_def.get("JS_Code", "step"),
            name=step_def.get("name") or step_def.get("JS_Name", "Step"),
            stepType=step_type,
            command=step_def.get("command") or step_def.get("JS_Command"),
            script=step_def.get("script") or step_def.get("JS_Script"),
            parameters=step_def.get("parameters") or step_def.get("JS_Parameters", {}),
            dependsOn=step_def.get("dependsOn") or step_def.get("JS_DependsOn", []),
            timeout=step_def.get("timeout") or step_def.get("JS_TimeoutSec"),
            retries=step_def.get("retries") or step_def.get("JS_Retries", 0),
            retryDelay=step_def.get("retryDelay") or step_def.get("JS_RetryDelaySec", 60),
            condition=step_def.get("condition") or step_def.get("JS_Condition"),
            onFailure=step_def.get("onFailure") or step_def.get("JS_OnFailure"),
        )
        steps.append(step)

    return Job(
        code=code,
        name=name,
        description=job_def.get("description") or job_def.get("JB_Description"),
        schedule=job_def.get("schedule") or job_def.get("JB_Schedule"),
        steps=steps,
        parameters=job_def.get("parameters") or job_def.get("JB_Parameters", {}),
        tags=job_def.get("tags") or job_def.get("JB_Tags", []),
        owner=job_def.get("owner") or job_def.get("JB_Owner"),
        timeout=job_def.get("timeout") or job_def.get("JB_TimeoutSec"),
        maxConcurrency=job_def.get("maxConcurrency") or job_def.get("JB_MaxConcurrency", 1),
        retries=job_def.get("retries") or job_def.get("JB_Retries", 0),
        alertOnFailure=job_def.get("alertOnFailure", True),
        alertEmail=job_def.get("alertEmail") or job_def.get("JB_AlertEmail"),
    )


def _topological_sort(steps: List[JobStep]) -> List[JobStep]:
    """Sort steps topologically based on dependencies."""
    step_map = {s.code: s for s in steps}
    visited: Set[str] = set()
    result: List[JobStep] = []

    def visit(code: str) -> None:
        if code in visited:
            return
        visited.add(code)
        step = step_map.get(code)
        if step:
            for dep in step.dependsOn:
                visit(dep)
            result.append(step)

    for step in steps:
        visit(step.code)

    return result


class JobCompiler:
    """Compiles jobs to scheduler-specific formats."""

    def __init__(self, scheduler: str = SCHEDULER_AIRFLOW):
        """Initialize compiler with target scheduler."""
        self.scheduler = scheduler.lower()

    def compile(self, job: Job) -> CompiledJob:
        """Compile a job to target scheduler format.

        Steps:
          1.1 Sort steps topologically
          1.2 Generate code for target scheduler
        """
        sorted_steps = _topological_sort(job.steps)

        if self.scheduler == SCHEDULER_AIRFLOW:
            code, ext = self._compile_airflow(job, sorted_steps)
        elif self.scheduler == SCHEDULER_PREFECT:
            code, ext = self._compile_prefect(job, sorted_steps)
        elif self.scheduler == SCHEDULER_DAGSTER:
            code, ext = self._compile_dagster(job, sorted_steps)
        elif self.scheduler == SCHEDULER_CRON:
            code, ext = self._compile_cron(job, sorted_steps)
        elif self.scheduler == SCHEDULER_ADF:
            code, ext = self._compile_adf(job, sorted_steps)
        elif self.scheduler == SCHEDULER_DATABRICKS:
            code, ext = self._compile_databricks(job, sorted_steps)
        elif self.scheduler == SCHEDULER_STEP_FUNCTIONS:
            code, ext = self._compile_step_functions(job, sorted_steps)
        elif self.scheduler == SCHEDULER_FABRIC:
            code, ext = self._compile_fabric(job, sorted_steps)
        else:
            code, ext = self._compile_airflow(job, sorted_steps)  # Default

        return CompiledJob(
            jobCode=job.code,
            scheduler=self.scheduler,
            code=code,
            fileExtension=ext,
        )

    def _compile_airflow(self, job: Job, steps: List[JobStep]) -> Tuple[str, str]:
        """Compile to Apache Airflow DAG."""
        lines = [
            '"""Auto-generated Airflow DAG from OZMetaDB."""',
            "",
            "from datetime import datetime, timedelta",
            "from airflow import DAG",
            "from airflow.operators.python import PythonOperator",
            "from airflow.operators.bash import BashOperator",
            "from airflow.providers.common.sql.operators.sql import SQLExecuteQueryOperator",
            "from airflow.providers.http.operators.http import SimpleHttpOperator",
            "",
            f"# Job: {job.name}",
            f"# Generated: {datetime.utcnow().isoformat()}Z",
            "",
            "default_args = {",
            f"    'owner': '{job.owner or 'airflow'}',",
            f"    'retries': {job.retries},",
            "    'retry_delay': timedelta(minutes=5),",
            "}",
            "",
        ]

        # DAG definition
        schedule = f"'{job.schedule}'" if job.schedule else "None"
        lines.extend([
            f"with DAG(",
            f"    dag_id='{job.code}',",
            f"    description='{job.description or ''}',",
            f"    schedule={schedule},",
            f"    start_date=datetime(2024, 1, 1),",
            f"    catchup=False,",
            f"    default_args=default_args,",
            f"    tags={job.tags},",
            f"    max_active_runs={job.maxConcurrency},",
            f") as dag:",
            "",
        ])

        # Generate tasks
        task_ids = []
        for step in steps:
            task_id = step.code.replace("-", "_")
            task_ids.append((task_id, step.dependsOn))

            if step.stepType == StepType.SQL:
                lines.extend([
                    f"    {task_id} = SQLExecuteQueryOperator(",
                    f"        task_id='{task_id}',",
                    f"        sql=\"\"\"{step.command or step.script or ''}\"\"\",",
                    f"        conn_id='default_db',",
                    "    )",
                    "",
                ])
            elif step.stepType == StepType.PYTHON:
                lines.extend([
                    f"    def _{task_id}_fn(**kwargs):",
                    f"        # {step.name}",
                    f"        {step.script or 'pass'}",
                    "",
                    f"    {task_id} = PythonOperator(",
                    f"        task_id='{task_id}',",
                    f"        python_callable=_{task_id}_fn,",
                    "    )",
                    "",
                ])
            elif step.stepType == StepType.SHELL:
                lines.extend([
                    f"    {task_id} = BashOperator(",
                    f"        task_id='{task_id}',",
                    f"        bash_command='{step.command or step.script or 'echo done'}',",
                    "    )",
                    "",
                ])
            elif step.stepType == StepType.HTTP:
                lines.extend([
                    f"    {task_id} = SimpleHttpOperator(",
                    f"        task_id='{task_id}',",
                    f"        http_conn_id='http_default',",
                    f"        endpoint='{step.command or '/'}',",
                    f"        method='POST',",
                    "    )",
                    "",
                ])
            else:
                lines.extend([
                    f"    {task_id} = PythonOperator(",
                    f"        task_id='{task_id}',",
                    f"        python_callable=lambda: print('{step.name}'),",
                    "    )",
                    "",
                ])

        # Add dependencies
        lines.append("    # Dependencies")
        for task_id, deps in task_ids:
            for dep in deps:
                dep_id = dep.replace("-", "_")
                lines.append(f"    {dep_id} >> {task_id}")

        return "\n".join(lines), ".py"

    def _compile_prefect(self, job: Job, steps: List[JobStep]) -> Tuple[str, str]:
        """Compile to Prefect Flow."""
        lines = [
            '"""Auto-generated Prefect Flow from OZMetaDB."""',
            "",
            "from prefect import flow, task",
            "from prefect.tasks import task_input_hash",
            "from datetime import timedelta",
            "",
            f"# Job: {job.name}",
            "",
        ]

        # Generate tasks
        for step in steps:
            task_name = step.code.replace("-", "_")
            retry_str = f"retries={step.retries}, retry_delay_seconds={step.retryDelay}" if step.retries else ""

            lines.extend([
                f"@task(name='{step.name}'{', ' + retry_str if retry_str else ''})",
                f"def {task_name}():",
                f"    \"\"\"{step.name}\"\"\"",
            ])

            if step.stepType == StepType.PYTHON and step.script:
                lines.append(f"    {step.script}")
            elif step.stepType == StepType.SHELL and step.command:
                lines.extend([
                    "    import subprocess",
                    f"    subprocess.run('{step.command}', shell=True, check=True)",
                ])
            else:
                lines.append(f"    print('Executing {step.name}')")

            lines.extend(["", ""])

        # Generate flow
        lines.extend([
            f"@flow(name='{job.name}')",
            f"def {job.code.replace('-', '_')}_flow():",
            f'    """{job.description or job.name}"""',
        ])

        # Call tasks in order
        for step in steps:
            task_name = step.code.replace("-", "_")
            deps_wait = ""
            if step.dependsOn:
                deps_wait = f"  # depends on: {', '.join(step.dependsOn)}"
            lines.append(f"    {task_name}(){deps_wait}")

        lines.extend([
            "",
            "",
            "if __name__ == '__main__':",
            f"    {job.code.replace('-', '_')}_flow()",
        ])

        return "\n".join(lines), ".py"

    def _compile_dagster(self, job: Job, steps: List[JobStep]) -> Tuple[str, str]:
        """Compile to Dagster Job."""
        lines = [
            '"""Auto-generated Dagster Job from OZMetaDB."""',
            "",
            "from dagster import job, op, In, Out, Nothing",
            "",
            f"# Job: {job.name}",
            "",
        ]

        # Generate ops
        for step in steps:
            op_name = step.code.replace("-", "_")

            # Determine inputs
            if step.dependsOn:
                ins = ", ".join(f'"{d.replace("-", "_")}": In(Nothing)' for d in step.dependsOn)
                ins_arg = f"ins={{{ins}}}"
            else:
                ins_arg = ""

            lines.extend([
                f"@op({ins_arg})",
                f"def {op_name}():",
                f'    """{step.name}"""',
            ])

            if step.stepType == StepType.PYTHON and step.script:
                lines.append(f"    {step.script}")
            else:
                lines.append(f"    print('Executing {step.name}')")

            lines.extend(["", ""])

        # Generate job
        lines.extend([
            f"@job(description='{job.description or job.name}')",
            f"def {job.code.replace('-', '_')}_job():",
        ])

        # Call ops - handle dependencies via results
        for step in steps:
            op_name = step.code.replace("-", "_")
            if step.dependsOn:
                deps = ", ".join(d.replace("-", "_") + "()" for d in step.dependsOn)
                lines.append(f"    {op_name}({deps})")
            else:
                lines.append(f"    {op_name}()")

        return "\n".join(lines), ".py"

    def _compile_cron(self, job: Job, steps: List[JobStep]) -> Tuple[str, str]:
        """Compile to crontab format with shell script."""
        lines = [
            f"# Job: {job.name}",
            f"# Generated from OZMetaDB",
            "",
        ]

        if job.schedule:
            # Add crontab entry
            script_name = f"/opt/jobs/{job.code}.sh"
            lines.append(f"{job.schedule} {script_name}")
        else:
            lines.append(f"# No schedule defined - run manually")

        lines.extend([
            "",
            "# ======== Shell Script ========",
            "#!/bin/bash",
            f"# {job.name}",
            "set -e",
            "",
        ])

        for step in steps:
            lines.append(f"# Step: {step.name}")
            if step.stepType == StepType.SHELL and step.command:
                lines.append(step.command)
            elif step.stepType == StepType.SQL and step.command:
                lines.append(f'sqlcmd -Q "{step.command}"')
            elif step.stepType == StepType.PYTHON and step.script:
                lines.append(f'python3 -c "{step.script}"')
            else:
                lines.append(f'echo "Executing {step.name}"')
            lines.append("")

        lines.append('echo "Job completed successfully"')

        return "\n".join(lines), ".cron"

    def _compile_adf(self, job: Job, steps: List[JobStep]) -> Tuple[str, str]:
        """Compile to Azure Data Factory pipeline JSON."""
        activities = []

        for step in steps:
            activity = {
                "name": step.code,
                "type": self._adf_activity_type(step.stepType),
                "dependsOn": [
                    {"activity": dep, "dependencyConditions": ["Succeeded"]}
                    for dep in step.dependsOn
                ],
            }

            if step.stepType == StepType.SQL:
                activity["typeProperties"] = {
                    "storedProcedureName": step.command or "sp_" + step.code,
                }
            elif step.stepType == StepType.COPY:
                activity["typeProperties"] = {
                    "source": {"type": "SqlServerSource"},
                    "sink": {"type": "SqlServerSink"},
                }
            elif step.stepType == StepType.NOTEBOOK:
                activity["typeProperties"] = {
                    "notebookPath": step.script or f"/notebooks/{step.code}",
                }

            if step.timeout:
                activity["timeout"] = f"0.{step.timeout // 3600:02d}:{(step.timeout % 3600) // 60:02d}:00"

            activities.append(activity)

        pipeline = {
            "name": job.code,
            "properties": {
                "description": job.description or job.name,
                "activities": activities,
                "parameters": {
                    k: {"type": "String", "defaultValue": str(v)}
                    for k, v in job.parameters.items()
                },
                "annotations": job.tags,
            },
        }

        return json.dumps(pipeline, indent=2), ".json"

    def _adf_activity_type(self, step_type: StepType) -> str:
        """Map step type to ADF activity type."""
        mapping = {
            StepType.SQL: "SqlServerStoredProcedure",
            StepType.COPY: "Copy",
            StepType.NOTEBOOK: "DatabricksNotebook",
            StepType.PYTHON: "AzureFunctionActivity",
            StepType.HTTP: "WebActivity",
            StepType.SPARK: "DatabricksSparkPython",
        }
        return mapping.get(step_type, "ExecutePipeline")

    def _compile_databricks(self, job: Job, steps: List[JobStep]) -> Tuple[str, str]:
        """Compile to Databricks Workflow JSON."""
        tasks = []

        for step in steps:
            task = {
                "task_key": step.code,
                "description": step.name,
                "depends_on": [{"task_key": dep} for dep in step.dependsOn],
            }

            if step.stepType == StepType.NOTEBOOK:
                task["notebook_task"] = {
                    "notebook_path": step.script or f"/Workspace/jobs/{step.code}",
                    "base_parameters": step.parameters,
                }
            elif step.stepType == StepType.SQL:
                task["sql_task"] = {
                    "query": {"value": step.command or step.script or "SELECT 1"},
                    "warehouse_id": "{{warehouse_id}}",
                }
            elif step.stepType == StepType.PYTHON:
                task["python_wheel_task"] = {
                    "package_name": "ozmetadb_jobs",
                    "entry_point": step.code.replace("-", "_"),
                }
            elif step.stepType == StepType.SPARK:
                task["spark_python_task"] = {
                    "python_file": step.script or f"dbfs:/jobs/{step.code}.py",
                }
            else:
                task["notebook_task"] = {
                    "notebook_path": f"/Workspace/jobs/{step.code}",
                }

            if step.timeout:
                task["timeout_seconds"] = step.timeout

            if step.retries:
                task["retry_on_timeout"] = True
                task["max_retries"] = step.retries

            tasks.append(task)

        workflow = {
            "name": job.code,
            "description": job.description or job.name,
            "tags": {tag: "true" for tag in job.tags},
            "tasks": tasks,
            "max_concurrent_runs": job.maxConcurrency,
        }

        if job.schedule:
            workflow["schedule"] = {
                "quartz_cron_expression": self._cron_to_quartz(job.schedule),
                "timezone_id": "UTC",
            }

        if job.alertEmail:
            workflow["email_notifications"] = {
                "on_failure": [job.alertEmail],
            }

        return json.dumps(workflow, indent=2), ".json"

    def _compile_step_functions(self, job: Job, steps: List[JobStep]) -> Tuple[str, str]:
        """Compile to AWS Step Functions state machine."""
        states = {}
        first_step = steps[0].code if steps else "End"

        for i, step in enumerate(steps):
            next_step = steps[i + 1].code if i + 1 < len(steps) else None

            state = {
                "Type": "Task",
                "Comment": step.name,
            }

            if step.stepType == StepType.PYTHON:
                state["Resource"] = f"arn:aws:lambda:${{region}}:${{account}}:function:{step.code}"
            elif step.stepType == StepType.SQL:
                state["Resource"] = "arn:aws:states:::athena:startQueryExecution.sync"
                state["Parameters"] = {
                    "QueryString": step.command or step.script,
                    "WorkGroup": "primary",
                }
            else:
                state["Resource"] = f"arn:aws:states:::lambda:invoke"
                state["Parameters"] = {
                    "FunctionName": step.code,
                    "Payload.$": "$",
                }

            if next_step:
                state["Next"] = next_step
            else:
                state["End"] = True

            if step.retries:
                state["Retry"] = [{
                    "ErrorEquals": ["States.ALL"],
                    "MaxAttempts": step.retries,
                    "IntervalSeconds": step.retryDelay,
                }]

            if step.timeout:
                state["TimeoutSeconds"] = step.timeout

            states[step.code] = state

        state_machine = {
            "Comment": job.description or job.name,
            "StartAt": first_step,
            "States": states,
        }

        return json.dumps(state_machine, indent=2), ".asl.json"

    def _compile_fabric(self, job: Job, steps: List[JobStep]) -> Tuple[str, str]:
        """Compile to Microsoft Fabric pipeline JSON."""
        activities = []

        for step in steps:
            activity = {
                "name": step.code,
                "type": self._fabric_activity_type(step.stepType),
                "dependsOn": [
                    {"activity": dep, "dependencyConditions": ["Succeeded"]}
                    for dep in step.dependsOn
                ],
                "policy": {
                    "timeout": f"0.{step.timeout // 3600 if step.timeout else 0:02d}:{((step.timeout or 0) % 3600) // 60:02d}:00",
                    "retry": step.retries,
                    "retryIntervalInSeconds": step.retryDelay,
                },
            }

            if step.stepType == StepType.NOTEBOOK:
                activity["typeProperties"] = {
                    "notebook": {"referenceName": step.script or step.code},
                    "parameters": step.parameters,
                }
            elif step.stepType == StepType.SQL:
                activity["typeProperties"] = {
                    "sqlScript": {"content": step.command or step.script},
                }
            elif step.stepType == StepType.SPARK:
                activity["typeProperties"] = {
                    "sparkJob": {"referenceName": step.code},
                }
            elif step.stepType == StepType.COPY:
                activity["typeProperties"] = {
                    "source": {"type": "LakehouseTableSource"},
                    "sink": {"type": "LakehouseTableSink"},
                }

            activities.append(activity)

        pipeline = {
            "$schema": "https://developer.microsoft.com/json-schemas/fabric/pipeline/v1/pipeline.json",
            "name": job.code,
            "properties": {
                "description": job.description or job.name,
                "activities": activities,
                "parameters": job.parameters,
            },
        }

        return json.dumps(pipeline, indent=2), ".json"

    def _fabric_activity_type(self, step_type: StepType) -> str:
        """Map step type to Fabric activity type."""
        mapping = {
            StepType.NOTEBOOK: "TridentNotebook",
            StepType.SQL: "Script",
            StepType.SPARK: "SparkJob",
            StepType.COPY: "Copy",
            StepType.HTTP: "WebActivity",
        }
        return mapping.get(step_type, "TridentNotebook")

    def _cron_to_quartz(self, cron: str) -> str:
        """Convert standard cron to Quartz cron format."""
        parts = cron.split()
        if len(parts) == 5:
            # Standard cron: min hour day month dow
            # Quartz: sec min hour day month dow year
            return f"0 {parts[0]} {parts[1]} {parts[2]} {parts[3]} {parts[4]}"
        return cron


def compile_job(
    job_def: Dict[str, Any],
    scheduler: str = SCHEDULER_AIRFLOW
) -> CompiledJob:
    """Compile a job definition to scheduler format.

    Args:
        job_def: Job definition from snapshot
        scheduler: Target scheduler

    Returns:
        CompiledJob with generated code
    """
    job = parse_job(job_def)
    compiler = JobCompiler(scheduler)
    return compiler.compile(job)


def compile_pipeline(
    pipeline_def: Dict[str, Any],
    scheduler: str = SCHEDULER_AIRFLOW
) -> CompiledJob:
    """Alias for compile_job for semantic clarity."""
    return compile_job(pipeline_def, scheduler)
