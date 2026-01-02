# Source to Canonical Mapping Policy

## Principle
Source systems MAY violate canonical naming and structure.
We store source schemas AS-IS and map to canonical.

## Source Model (AS-IS)
MetaDB stores:
- SourceSystem
- SourceObject (table/file/api)
- SourceField (name, type, constraints)
- SourceKey rules

## Canonical Model (Our Standard)
MetaDB stores:
- Canonical tables/fields/relations
- Table codes and required internal fields
- Types (logical)

## Mapping (Translation Contract)
MetaDB defines:
- Object mapping (SourceObject → CanonicalTable)
- Field mapping (SourceField → CanonicalField) with transformations/casts/parsing
- Key mapping (source natural key → canonical UUIDv7)
- SCD handling (if dimensions)
- Reject/error handling rules
- Lineage links (field-level)

## Outputs
Mappings compile to platform-specific implementations:
- Fabric pipelines/notebooks
- Databricks jobs
- Synapse pipelines
- SQL MI jobs/procedures

All runs must write Audit + Lineage.
