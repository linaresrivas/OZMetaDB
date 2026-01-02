# MetaDB Requirements (Control Plane)

MetaDB MUST support:
1) Canonical model (tables/fields/relations)
2) Source model (as-is)
3) Mapping model (source→canonical)
4) Physical projections (multi-platform naming + types)
5) Jobs/pipelines definitions (logical) + compilation targets (physical)
6) Field-level lineage from source to canonical to semantic
7) Metrics/KPIs definitions and dependency graph
8) Versioning, approvals, and change control
9) Drift detection and enforcement
10) Multi-cloud redundancy roles and failover metadata
11) A/B production slots and promotion/rollback

Non-negotiable:
- Canonical naming never changes for platform reasons
- Physical objects are projections and must reverse-map to canonical
