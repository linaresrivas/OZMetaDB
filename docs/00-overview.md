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
