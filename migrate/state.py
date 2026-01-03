"""Migration state models.

Steps in a migration:
  1.1 ProvisionTarget - Create target database/schema
  1.2 StartSync - Begin data replication
  2.1 ParityChecks - Validate data matches
  2.2 CutoverRead - Switch reads to target
  2.3 CutoverWrite - Switch writes to target
  3.1 ColdStandby - Keep source as backup
  3.2 Decommission - Remove source
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class CheckpointStatus(str, Enum):
    PENDING = "Pending"
    IN_PROGRESS = "InProgress"
    COMPLETED = "Completed"
    FAILED = "Failed"
    SKIPPED = "Skipped"


class MigrationStrategy(str, Enum):
    DUAL_LIVE = "DualLive"        # Both source and target active during migration
    BLUE_GREEN = "BlueGreen"      # Switch all traffic at once
    CANARY = "Canary"             # Gradual traffic shift
    OFFLINE = "Offline"           # Downtime migration


class MigrationStatus(str, Enum):
    PLANNED = "Planned"
    IN_PROGRESS = "InProgress"
    PAUSED = "Paused"
    COMPLETED = "Completed"
    FAILED = "Failed"
    ROLLED_BACK = "RolledBack"


@dataclass
class MigrationCheckpoint:
    """A checkpoint in the migration process."""
    code: str
    status: str = CheckpointStatus.PENDING.value
    startedAtUTC: Optional[str] = None
    finishedAtUTC: Optional[str] = None
    durationSeconds: Optional[int] = None
    notes: Optional[str] = None
    errorMessage: Optional[str] = None
    metrics: Dict[str, Any] = field(default_factory=dict)

    def start(self) -> None:
        self.status = CheckpointStatus.IN_PROGRESS.value
        self.startedAtUTC = now()

    def complete(self, notes: Optional[str] = None) -> None:
        self.status = CheckpointStatus.COMPLETED.value
        self.finishedAtUTC = now()
        self.notes = notes
        if self.startedAtUTC:
            start = datetime.fromisoformat(self.startedAtUTC.replace("Z", "+00:00"))
            end = datetime.fromisoformat(self.finishedAtUTC.replace("Z", "+00:00"))
            self.durationSeconds = int((end - start).total_seconds())

    def fail(self, error: str) -> None:
        self.status = CheckpointStatus.FAILED.value
        self.finishedAtUTC = now()
        self.errorMessage = error

    def skip(self, reason: str) -> None:
        self.status = CheckpointStatus.SKIPPED.value
        self.notes = reason


@dataclass
class DatabaseEndpoint:
    """Database connection endpoint."""
    platform: str  # SQLServer, Postgres, Fabric, Synapse, Databricks
    connectionString: Optional[str] = None
    server: Optional[str] = None
    database: Optional[str] = None
    schema: Optional[str] = None
    credentials: Optional[str] = None  # KeyVault reference


@dataclass
class MigrationRun:
    """A migration run from source to target."""
    migrationId: str
    projectId: str
    source: Dict[str, Any]
    target: Dict[str, Any]
    strategy: str = MigrationStrategy.DUAL_LIVE.value
    status: str = MigrationStatus.PLANNED.value
    createdAtUTC: str = field(default_factory=now)
    createdBy: Optional[str] = None
    checkpoints: List[MigrationCheckpoint] = field(default_factory=list)
    cutoverAtUTC: Optional[str] = None
    coldUntilUTC: Optional[str] = None
    deleteAfterUTC: Optional[str] = None
    rollbackAvailableUntil: Optional[str] = None
    tags: Dict[str, str] = field(default_factory=dict)

    def get_checkpoint(self, code: str) -> Optional[MigrationCheckpoint]:
        """Get checkpoint by code."""
        for cp in self.checkpoints:
            if cp.code == code:
                return cp
        return None

    def current_checkpoint(self) -> Optional[MigrationCheckpoint]:
        """Get the current (in-progress or next pending) checkpoint."""
        for cp in self.checkpoints:
            if cp.status == CheckpointStatus.IN_PROGRESS.value:
                return cp
        for cp in self.checkpoints:
            if cp.status == CheckpointStatus.PENDING.value:
                return cp
        return None

    def is_complete(self) -> bool:
        """Check if all checkpoints are done."""
        for cp in self.checkpoints:
            if cp.status in (CheckpointStatus.PENDING.value, CheckpointStatus.IN_PROGRESS.value):
                return False
        return True

    def progress_percent(self) -> int:
        """Calculate completion percentage."""
        if not self.checkpoints:
            return 0
        done = sum(1 for cp in self.checkpoints
                   if cp.status in (CheckpointStatus.COMPLETED.value, CheckpointStatus.SKIPPED.value))
        return int(100 * done / len(self.checkpoints))
