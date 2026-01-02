# Metadata Export Format (Snapshot JSON)

Goal: allow generators and CI/CD to run **without direct MetaDB connectivity**.

## Files
- Schema: `exports/spec/ozmeta.metadata.snapshot.schema.json`
- Sample: `exports/samples/sample.snapshot.json`

## Snapshot contents
A snapshot includes:
- Canonical model: tables, fields, relations
- Workflows/approvals/SLAs/events
- Security: RLS/FLS/protection/classification
- Runtime bindings
- BI: metrics/dimensions (optional in early versions)
- Jobs/pipelines (optional)
- Templates (event journal, runtime sidecars)
- Texts & translations
- Enums / code lists

## Usage patterns
### CI/CD validation
- Validate snapshot against the schema
- Validate all DSL rules against `contracts/ozmeta.runtime.dsl.schema.json`
- Run generator in “offline mode” using snapshot only
- Produce DDL/pipelines/semantic artifacts
- Commit generated artifacts or compare diffs in PR

### Export sources
- Export from MetaDB using a tool (future): `ozmeta export --client X --project Y`
- Or manually craft snapshot for early stages


## Full-fidelity exports
When MetaDB connectivity is available, use `generator/src/export_from_db.py` (guided by `contracts/ozmeta.exporter.contract.json`) to export workflows, security, runtime bindings, and more.
