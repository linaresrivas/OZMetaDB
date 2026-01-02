# Next Expansion: UI, Evidence Integrity, Lineage, Offline Sync, BI Deep Model

This drop adds first-class metadata tables and exporter support for:

## UI/UX generation
- UiApp, UiPage, UiComponent
- UiPageComponent (composition + regions)
- UiValidationRule (portable DSL)
- UiSearchFacet (faceted search definitions)

## Evidence integrity / chain of custody (policies)
- RetentionPolicy
- DocumentPolicy (integrity mode, redaction, watermark policy)

## Lineage & Observability
- DataAsset (datasets / topics / semantic models)
- LineageEdge (From → To edges)
- JobRun + JobRunAsset (run-time observability catalog)

## Offline sync
- SyncPolicy (merge/conflict DSL, idempotency key specs)

## BI deep modeling
- FactTable (grain definition)
- DimensionTable (SCD type + natural key spec)
- PartitionSpec (platform strategies + spec JSON)

All of these are exported via:
- contracts/ozmeta.exporter.contract.json
- generator/src/export_from_db.py
and supported in offline snapshots via:
- exports/spec/ozmeta.metadata.snapshot.schema.json
