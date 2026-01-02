# Workflow Runtime Tracking (Live instances, timers, breaches, escalations)

This enhancement adds **control-plane bindings** and **data-plane templates** so OZMetaDB can generate runtime tracking
for live cases/tickets/invoices/person investigations/etc.

## 1) Why a runtime layer?
Workflow definitions are static metadata. Real operations need runtime state:
- current state per entity instance
- timers per SLA
- breaches / warnings
- escalation queue
- approval progress
- audit trail / events

## 2) Control-plane bindings (MetaDB)
### Core tables
- Meta.RuntimeBinding
  - attaches workflow/approval to an entity (Table or UiEntity)
  - defines runtime mode:
    - Inline: add columns to the entity table (fast but intrusive)
    - Sidecar: separate runtime tables keyed by (TenantID, ObjectID) (**recommended**)
- Meta.RuntimeTemplateBinding
  - selects which data-plane templates to generate (WorkflowInstance, SlaTracking, ApprovalTracking, EscalationQueue)
- Meta.RuntimeSlaBinding
  - binds SLA policies to an entity, plus start/stop rules (JSON/DSL)
- Meta.RuntimeSignalType
  - portable catalog for runtime signals (warn/breach/escalation/approval requested)

## 3) Data-plane pattern tables (generated)
OZMetaDB stores template specs in `/templates` and (optionally) also in Meta.EventTemplate records.
Generators compile to SQL/Fabric/Databricks/BigQuery/Redshift.

### A) WorkflowInstance (sidecar)
Tracks current lifecycle state for each entity instance.
Canonical columns:
- WI_ID (UUIDv7)
- _TenantID
- WI_ObjectType, WI_ObjectID
- WF_ID, WS_CurrentCode
- WI_CurrentSinceUTC
- WI_LastTransitionCode, WI_LastTransitionUTC
- WI_LastActor
- WI_RowVersion (for optimistic concurrency)

### B) SlaTimer
One row per SLA per instance.
Canonical columns:
- ST_ID (UUIDv7)
- _TenantID
- WI_ID (or ObjectType/ObjectID)
- SL_Code
- ST_StartUTC, ST_DueUTC, ST_StopUTC
- ST_Status (Running/Warned/Breached/Stopped)
- ST_WarnedUTC, ST_BreachedUTC
- ST_EscalationLevel

### C) EscalationQueue
Work items for supervisors/ops.
Canonical columns:
- EQ_ID (UUIDv7)
- _TenantID
- EQ_ObjectType, EQ_ObjectID
- EQ_SignalCode (e.g., SLA.Breached)
- EQ_Severity
- EQ_AssignedToRole / Principal
- EQ_Status (Open/Ack/Closed)
- EQ_CreatedUTC, EQ_ClosedUTC

### D) ApprovalInstance (optional)
Tracks step-by-step approval progress for an object.

## 4) Emitting runtime signals
- Workflow transitions can emit domain events (Meta.EventType) and runtime signals (Meta.RuntimeSignalType)
- Events go to EventJournal (append-only)
- Signals go to runtime tables and can also be mirrored to EventJournal for integrity

## 5) Offline capture stations
Sidecar runtime tables work well offline:
- Local runtime + event journal
- On reconnect: replay events, resolve conflicts via sequence + rowversion + deterministic merge rules
