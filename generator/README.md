# OZMeta Generator (Starter Stub)

This folder is the **entry point for Codex** to implement generators/compilers.

## Responsibilities
1. Load MetaDB metadata (tables, fields, relations, mappings, workflows, security, templates)
2. Validate metadata + DSL using `contracts/ozmeta.runtime.dsl.schema.json`
3. Compile to platform artifacts:
   - DDL (SQL Server / Fabric Warehouse / BigQuery / Redshift)
   - Spark/Databricks (Delta tables, views)
   - Pipelines/jobs (Fabric pipelines, ADF, Databricks Jobs)
   - Power BI semantic model (measures/dimensions) from Meta.Metric* / Meta.Dimension*

## Suggested architecture
- loaders/ : read metadata from DB or export files
- compilers/ : compile DSL + model to target representations
- emitters/ : write files, publish artifacts, register back to MetaDB (JobTarget, PhysicalObject)
- models/ : typed models for metadata objects
- utils/ : helpers

## Commands (future)
- `generate ddl --platform AzureSQL --project <PJ_Code>`
- `generate runtime --platform Fabric --project <PJ_Code>`
- `generate semantic --platform PowerBI --project <PJ_Code>`

## Offline mode (CI/CD)
Use `exports/*.snapshot.json` as the metadata source; no DB connectivity required.

## Export from MetaDB (when connectivity is available)
Use `src/export_from_db.py` to produce an exports snapshot that matches the offline schema.
