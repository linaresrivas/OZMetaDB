# Workflow, Approvals, SLAs, and Immutable Events (Metadata-Driven)

This package adds the control-plane metadata needed to generate:
- status/state machines (transitions, guards, actions)
- approvals (multi-step, quorum, role-based)
- SLAs (timers, warnings, escalations)
- event journal / immutable audit (append-only)

## 1) Workflow / State machine
### Metadata tables
- Meta.Workflow
- Meta.WorkflowState
- Meta.WorkflowTransition
- Meta.WorkflowTransitionRole

### How it works
- A workflow is bound to a Table (TB_ID) or UI entity (UE_ID).
- States define allowed values.
- Transitions define allowed moves:
  - optional Guard (condition) in portable JSON/DSL
  - optional Action (side-effects) in portable JSON/DSL
  - allowed roles per transition

### Generated outputs (examples)
- UI: buttons/actions shown only if current state + user role allows transition
- API: server-side enforcement (deny-by-default)
- DB: optional constraints, plus transition stored procedure per entity (platform dependent)

## 2) Approvals
### Metadata tables
- Meta.ApprovalFlow
- Meta.ApprovalStep
- Meta.ApprovalStepRole

### Concepts
- An approval flow is reusable across entities (purchase, case, document release).
- Steps are ordered and may require quorum or specific approver sets (rule JSON).
- Steps can be linked to workflow transitions (e.g., "Submitted -> Approved").

## 3) SLAs
### Metadata table
- Meta.SlaPolicy

### Concepts
- SLA can target a Workflow, Transition, ApprovalStep, Table or UI entity.
- TargetMinutes + WarnMinutes define timing
- EscalationRule is portable JSON/DSL and compiles to:
  - notifications (email/teams)
  - queues
  - incident system integration

## 4) Immutable events / Event Journal template
### Metadata tables
- Meta.EventTemplate (generator input)
- Meta.EventType (domain event catalog)
- Meta.TransitionEvent (bind workflow changes to events)

### Data plane templates (recommended)
#### A) EventJournal (append-only)
Columns (canonical idea, compiled per platform):
- EJ_ID (UUIDv7)
- _TenantID
- EJ_EventType (string; links to EventType)
- EJ_EventTimeUTC (datetime)
- EJ_Actor (principal/service)
- EJ_ObjectType, EJ_ObjectID (entity reference)
- EJ_CorrelationID, EJ_CausationID (trace)
- EJ_SourceSystem, EJ_SourceKey (lineage)
- EJ_Payload (json / varbinary)
- EJ_PayloadHash (sha-256) + optional signature
- EJ_Sequence (monotonic per object) for tamper detection

#### B) EntityAudit (change data capture style)
- EA_ID (UUIDv7)
- _TenantID
- EA_TableCode / EA_ObjectID
- EA_ChangeType (Insert/Update/Delete/StateChange)
- EA_BeforeJson / EA_AfterJson (or diff)
- EA_Actor + timestamps
- EA_HashChainPrev / EA_HashChainThis (optional hash chain)

### Integrity options
- Strong: hash-chain + periodic anchoring (e.g., write daily hashes to external WORM storage)
- Standard: append-only with immutable storage policy + access controls

## 5) How this ties back to UI + Security
- UiField / UiEntity controls are derived from metadata + translations.
- FieldSecurity/TableSecurity policies apply before exposing actions or data.
- State transitions are executed via services that produce events and update state atomically.
