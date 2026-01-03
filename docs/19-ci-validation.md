# CI Validation (Snapshots + Localization)

This repo includes a deterministic CI validation path that works without MetaDB connectivity.

## Script
- `scripts/validate_snapshot.py <snapshot.json>`

## What it checks
1. Snapshot matches schema:
   - `exports/spec/ozmeta.metadata.snapshot.schema.json`
2. Localization completeness:
   - for required project languages (from `objects.localization.projectLanguages`), every exported TextKey must have a Translation row.

## GitHub Actions
- `.github/workflows/validate-snapshot.yml`
Runs validation on PRs and on pushes to main.

## Future checks to add
- DSL validation (guards/actions/start/stop rules)
- security policy compilation sanity checks
- no dangling references (FK-like checks inside snapshot)
- naming convention compliance
