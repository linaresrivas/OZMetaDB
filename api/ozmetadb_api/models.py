from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Any, Literal, Optional, List, Dict

ActionType = Literal[
    "CreateTable","UpdateTable",
    "CreateField","UpdateField","DeleteField",
    "CreateEnum","CreateEnumValue",
    "CreateWorkflow","CreateWorkflowState","CreateWorkflowTransition",
    "SetPolicy","SetUiTheme","SetUiPage"
]

class CRAction(BaseModel):
    actionId: str
    type: ActionType
    target: Dict[str, Any] = Field(default_factory=dict)
    payload: Dict[str, Any] = Field(default_factory=dict)
    order: int = 0
    idempotencyKey: Optional[str] = None

class ChangeRequest(BaseModel):
    crId: str
    projectId: str
    title: str
    rationale: Optional[str] = None
    status: Literal["Draft","Submitted","Approved","Applied","Rejected"] = "Draft"
    createdAtUTC: str
    createdBy: Optional[str] = None
    approvedAtUTC: Optional[str] = None
    approvedBy: Optional[str] = None
    appliedAtUTC: Optional[str] = None
    appliedBy: Optional[str] = None
    baseSnapshotVersion: Optional[int] = None
    actions: List[CRAction] = Field(default_factory=list)
    validation: Dict[str, Any] = Field(default_factory=dict)
