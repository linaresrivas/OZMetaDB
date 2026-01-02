# MetaDB DDL

`metadb-schema.sql` is the reference schema for OZMetaDB on SQL Server/Azure SQL.

Scope:
- Control plane tables (canonical model, source model, mappings, physical projections, jobs, lineage, metrics/KPIs)
- UI + Localization metadata (multi-language display names, help text, enums, UI screens/forms)
- Audit tables for runs/checks/errors
- Governance helper stored procedures (upsert translations, soft delete/undelete, ProdA/ProdB slot switch)

Notes:
- UUIDv7 semantics should be generated in application layer; DB stores as `uniqueidentifier`.
- Heavy data-plane archive/purge operations are compiled to platform jobs; MetaDB stores retention policy only.
