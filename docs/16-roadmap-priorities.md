# OZMetaDB Roadmap: Priorities (MVP → Enterprise Complete)

This document prioritizes all capability areas required to generate:
- enterprise applications
- business intelligence platforms
- system integration/ingestion
- multi-cloud operations

## Phase 0 (Foundation) — already implemented
- Naming conventions / canonical object model (tables/fields/relations)
- Soft delete + tenant + source tracking basics
- Localization TextKey/Translation + UI entity/fields
- Security metadata (classification, RLS/FLS, protection)
- Workflow + approvals + SLAs + runtime bindings
- Event templates + event types
- Snapshot schema + loader + exporter contract + exporter stub

## Phase 1 (MVP Enterprise Platform)
1. Source integration foundation: SourceSystem/SourceObject/SourceField, MapVersion/MapField, IngestionSpec
2. Full localization export: TextKey + translations + per-object description coverage
3. UI generation hardening: layouts, search facets, validation, form rules
4. Data quality rules + certification levels + basic reconciliation hooks
5. DevOps environments + deployment specs (A/B slots, rollback metadata)

## Phase 2 (Enterprise Apps at Scale)
1. Document/Evidence metadata: DocumentType, RedactionPolicy, retention policies per type
2. Event bus/channels/subscriptions + outbox/inbox patterns metadata
3. Identity resolution metadata: identifier types, match rules, survivorship
4. Runtime operations: escalation queue policies, assignment rules, offline replay rules
5. DR topology + multi-cloud service equivalence

## Phase 3 (Analytics & AI First)
1. Semantic model + measures + (dimensions/facts expansion)
2. Feature definitions + model registry governance
3. Lineage expansion: end-to-end pipeline lineage and field-level transforms

## Completion criteria
A project is "enterprise-complete" when MetaDB can generate:
- OLTP data plane (tables, constraints, RLS/FLS, runtime tables)
- Ingestion pipelines (batch/CDC/event), plus lineage
- Documents/evidence storage policies, chain-of-custody patterns
- BI model (semantic + measures) and refresh pipelines
- Audit/event journal outputs
- Multi-cloud compiled naming and platform mapping
