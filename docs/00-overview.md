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

See also: `docs/17-next-expansion-ui-lineage-sync-bi.md` for UI/lineage/offline/BI expansions.

See also: `docs/18-localization-full-fidelity-export.md` for full-fidelity localization exports.

See also: `docs/19-ci-validation.md` for CI validation rules.

See also: `docs/20-ui-blueprint-console.md`.

See also: `docs/21-nextjs-console-structure.md`.

See also: `docs/22-identity-and-theming-patterns.md`.

See also: `docs/23-console-wiring-plan.md` for console wiring plan.

See also: `docs/24-enums.md`.

See also: `docs/25-documents-redaction.md`.

See also: `docs/26-identity-resolution.md`.

See also: `docs/27-dr-topology.md`.

See also: `docs/28-graph-model.md`.

See also: `docs/29-governance-consent-purpose-residency.md`.

See also: `docs/30-reliability-outbox-inbox.md`.

See also: `docs/31-performance-scalability.md`.

See also: `docs/32-platform-service-map.md`.

CI: workflows under `.github/workflows/`.

See also: `docs/40-exporter-contract-full-fidelity.md`.

See also: `docs/41-testing-strategy.md`.

See also: `docs/42-governance-implementation.md`.

See also: `docs/50-control-plane-api.md`.

See also: `docs/51-change-request-engine.md`.

See also: `docs/52-wizard-engine.md`.

See also: `docs/53-multi-engine-compilers.md`.

See also: `docs/54-migration-runner.md`.

See also: `docs/55-personalization.md`.
