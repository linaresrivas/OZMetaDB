from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

@dataclass
class MigrationCheckpoint:
    code: str
    status: str = "Pending"
    startedAtUTC: Optional[str] = None
    finishedAtUTC: Optional[str] = None
    notes: Optional[str] = None

@dataclass
class MigrationRun:
    migrationId: str
    projectId: str
    source: Dict[str, Any]
    target: Dict[str, Any]
    strategy: str = "DualLive"
    status: str = "Planned"
    createdAtUTC: str = field(default_factory=now)
    checkpoints: List[MigrationCheckpoint] = field(default_factory=list)
    cutoverAtUTC: Optional[str] = None
    coldUntilUTC: Optional[str] = None
    deleteAfterUTC: Optional[str] = None
