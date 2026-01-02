# Overview

OZMetaDB is a Control Plane for data platforms and systems.

It defines a single Canonical Truth (naming, canonical model, metrics) and projects it to one or more physical
targets (Azure/GCP/AWS/OnPrem) while retaining full lineage, auditability, and drift validation.

Core concepts:
- Canonical coordinate: `{Client}-{Env}-{Platform}-{Domain}-{Region}`
- A/B production slots: `ProdA` and `ProdB`
- Canonical model vs Source model: source schemas stored AS-IS; mappings translate to canonical
- Multi-cloud projections: each canonical object may have multiple physical names per platform
- Jobs/pipelines: defined logically, compiled per platform, and fully auditable


See also: `docs/08-ui-and-localization.md` for metadata-driven UI + multi-language support.

See also: `docs/09-enterprise-app-patterns.md`.

See also: `docs/10-security-metadata.md`.

See also: `docs/11-workflow-and-events.md` for workflows, approvals, SLAs, and immutable events.

See also: `docs/12-runtime-tracking.md` for workflow instance runtime tracking patterns.

See also: `docs/13-runtime-compiler-contracts.md` for the portable runtime DSL contract.

See also: `docs/14-metadata-export-format.md` for snapshot export format.

See also: `docs/15-exporter-contract.md` for deterministic exporter contract.

See also: `docs/16-roadmap-priorities.md` for prioritization roadmap.
