# Exporter Contract (Deterministic SQL Output)

This contract defines **exact query outputs** that a SQL exporter must produce to create a snapshot in the
shape defined by:
- `exports/spec/ozmeta.metadata.snapshot.schema.json`

## Contract file
- `contracts/ozmeta.exporter.contract.json`

## Goals
- deterministic results for CI/CD
- stable column names and types
- portable snapshot generation with no secrets
- easy diffs in pull requests

## Determinism rules
- Filter: `_DeleteDate IS NULL` by default
- Scope: `CL_Code` + `PJ_Code`
- Order: stable `ORDER BY` on natural keys
- No nondeterministic fields unless explicitly required (e.g., generatedAtUTC is allowed)

## Extending the contract
Add queries for:
- workflows/states/transitions/roles
- approvals/steps
- SLA policies and runtime bindings
- security policies (RLS/FLS) and protection mappings
- enums/values, metrics, dimensions, jobs, templates, mappings, sources


## Expanded coverage (integration + BI + ops)
Contract queries now include sources/mappings/ingestion, quality/certification, documents/redaction, eventing bus/channels/subscriptions, semantic models/measures, AI features/models, environments/deployments, platform service map + DR, and lifecycle change requests.
