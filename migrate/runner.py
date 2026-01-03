"""Migration runner - orchestrates database migrations.

Steps:
  1.1 create_run - Initialize migration plan with checkpoints
  1.2 save_run / load_run - Persist migration state
  2.1 advance_checkpoint - Move to next checkpoint
  2.2 execute_checkpoint - Run checkpoint logic
  3.1 rollback - Revert migration if needed
"""

from __future__ import annotations
import json
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional, Callable

from .state import (
    MigrationRun, MigrationCheckpoint, MigrationStatus,
    CheckpointStatus, MigrationStrategy, now
)


# Default checkpoint sequence for platform migrations
DEFAULT_CHECKPOINTS = [
    "ProvisionTarget",   # 1.1 Create target database/schema
    "StartSync",         # 1.2 Begin data replication
    "ParityChecks",      # 2.1 Validate data matches
    "CutoverRead",       # 2.2 Switch reads to target
    "CutoverWrite",      # 2.3 Switch writes to target
    "ColdStandby",       # 3.1 Keep source as backup
    "Decommission",      # 3.2 Remove source
]

# Checkpoint descriptions for UI/reports
CHECKPOINT_DESCRIPTIONS = {
    "ProvisionTarget": "Create target database, schemas, and tables",
    "StartSync": "Initialize data replication from source to target",
    "ParityChecks": "Validate row counts and checksums match",
    "CutoverRead": "Switch read operations to target database",
    "CutoverWrite": "Switch write operations to target database",
    "ColdStandby": "Keep source in cold standby for rollback",
    "Decommission": "Remove source database after retention period",
}


def create_run(
    project_id: str,
    source: Dict[str, Any],
    target: Dict[str, Any],
    strategy: str = MigrationStrategy.DUAL_LIVE.value,
    created_by: Optional[str] = None,
    cold_days: int = 30,
    delete_days: int = 90,
) -> Dict[str, Any]:
    """Create a new migration run.

    Steps:
      1.1 Generate migration ID
      1.2 Create checkpoints from template
      1.3 Calculate retention dates
      1.4 Return serialized run
    """
    # 1.1 Generate ID
    mid = str(uuid.uuid4())

    # 1.2 Create checkpoints
    checkpoints = [MigrationCheckpoint(code=c) for c in DEFAULT_CHECKPOINTS]

    # 1.3 Calculate dates
    now_dt = datetime.now(timezone.utc)
    cold_until = (now_dt + timedelta(days=cold_days)).strftime("%Y-%m-%dT%H:%M:%SZ")
    delete_after = (now_dt + timedelta(days=delete_days)).strftime("%Y-%m-%dT%H:%M:%SZ")
    rollback_until = (now_dt + timedelta(days=cold_days)).strftime("%Y-%m-%dT%H:%M:%SZ")

    # 1.4 Build run
    run = MigrationRun(
        migrationId=mid,
        projectId=project_id,
        source=source,
        target=target,
        strategy=strategy,
        createdBy=created_by,
        checkpoints=checkpoints,
        coldUntilUTC=cold_until,
        deleteAfterUTC=delete_after,
        rollbackAvailableUntil=rollback_until,
    )
    return _serialize(run)


def _serialize(obj: Any) -> Dict[str, Any]:
    """Serialize dataclass to dict."""
    return json.loads(json.dumps(obj, default=lambda o: o.__dict__))


def save_run(out_dir: str, run: Dict[str, Any]) -> str:
    """Save migration run to JSON file."""
    p = Path(out_dir)
    p.mkdir(parents=True, exist_ok=True)
    f = p / f"{run['migrationId']}.json"
    f.write_text(json.dumps(run, indent=2), encoding="utf-8")
    return str(f)


def load_run(path: str) -> Dict[str, Any]:
    """Load migration run from JSON file."""
    return json.loads(Path(path).read_text(encoding="utf-8"))


def list_runs(out_dir: str) -> List[Dict[str, Any]]:
    """List all migration runs in directory."""
    p = Path(out_dir)
    if not p.exists():
        return []
    runs = []
    for f in p.glob("*.json"):
        try:
            runs.append(load_run(str(f)))
        except Exception:
            pass
    return sorted(runs, key=lambda r: r.get("createdAtUTC", ""), reverse=True)


def advance_checkpoint(run: Dict[str, Any], notes: Optional[str] = None) -> Dict[str, Any]:
    """Advance to the next checkpoint.

    Steps:
      1.1 Find current checkpoint
      1.2 Mark as completed
      1.3 Start next checkpoint (if any)
      1.4 Update run status
    """
    checkpoints = run.get("checkpoints", [])

    # 1.1 Find current in-progress checkpoint
    current_idx = None
    for i, cp in enumerate(checkpoints):
        if cp.get("status") == CheckpointStatus.IN_PROGRESS.value:
            current_idx = i
            break

    # 1.2 Complete current checkpoint
    if current_idx is not None:
        cp = checkpoints[current_idx]
        cp["status"] = CheckpointStatus.COMPLETED.value
        cp["finishedAtUTC"] = now()
        if notes:
            cp["notes"] = notes
        if cp.get("startedAtUTC"):
            start = datetime.fromisoformat(cp["startedAtUTC"].replace("Z", "+00:00"))
            end = datetime.fromisoformat(cp["finishedAtUTC"].replace("Z", "+00:00"))
            cp["durationSeconds"] = int((end - start).total_seconds())

        # 1.3 Start next checkpoint
        next_idx = current_idx + 1
        if next_idx < len(checkpoints):
            checkpoints[next_idx]["status"] = CheckpointStatus.IN_PROGRESS.value
            checkpoints[next_idx]["startedAtUTC"] = now()
            run["status"] = MigrationStatus.IN_PROGRESS.value
        else:
            # All done
            run["status"] = MigrationStatus.COMPLETED.value
    else:
        # No checkpoint in progress - start first pending
        for cp in checkpoints:
            if cp.get("status") == CheckpointStatus.PENDING.value:
                cp["status"] = CheckpointStatus.IN_PROGRESS.value
                cp["startedAtUTC"] = now()
                run["status"] = MigrationStatus.IN_PROGRESS.value
                break

    return run


def fail_checkpoint(run: Dict[str, Any], error: str) -> Dict[str, Any]:
    """Mark current checkpoint as failed."""
    checkpoints = run.get("checkpoints", [])
    for cp in checkpoints:
        if cp.get("status") == CheckpointStatus.IN_PROGRESS.value:
            cp["status"] = CheckpointStatus.FAILED.value
            cp["finishedAtUTC"] = now()
            cp["errorMessage"] = error
            break
    run["status"] = MigrationStatus.FAILED.value
    return run


def rollback(run: Dict[str, Any], reason: str) -> Dict[str, Any]:
    """Rollback migration to source.

    Steps:
      1.1 Check rollback is available
      1.2 Mark remaining checkpoints as skipped
      1.3 Update status
    """
    # 1.1 Check rollback available
    rollback_until = run.get("rollbackAvailableUntil")
    if rollback_until:
        deadline = datetime.fromisoformat(rollback_until.replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > deadline:
            raise ValueError("Rollback period has expired")

    # 1.2 Skip remaining checkpoints
    checkpoints = run.get("checkpoints", [])
    for cp in checkpoints:
        if cp.get("status") in (CheckpointStatus.PENDING.value, CheckpointStatus.IN_PROGRESS.value):
            cp["status"] = CheckpointStatus.SKIPPED.value
            cp["notes"] = f"Skipped due to rollback: {reason}"

    # 1.3 Update status
    run["status"] = MigrationStatus.ROLLED_BACK.value
    return run


def get_progress(run: Dict[str, Any]) -> Dict[str, Any]:
    """Get migration progress summary."""
    checkpoints = run.get("checkpoints", [])
    total = len(checkpoints)
    completed = sum(1 for cp in checkpoints if cp.get("status") == CheckpointStatus.COMPLETED.value)
    failed = sum(1 for cp in checkpoints if cp.get("status") == CheckpointStatus.FAILED.value)
    skipped = sum(1 for cp in checkpoints if cp.get("status") == CheckpointStatus.SKIPPED.value)

    current = None
    for cp in checkpoints:
        if cp.get("status") == CheckpointStatus.IN_PROGRESS.value:
            current = cp.get("code")
            break

    return {
        "migrationId": run.get("migrationId"),
        "status": run.get("status"),
        "percent": int(100 * (completed + skipped) / total) if total > 0 else 0,
        "currentCheckpoint": current,
        "completed": completed,
        "failed": failed,
        "skipped": skipped,
        "total": total,
    }
