# Process: Validate

## Goal
Ensure deployed state matches MetaDB truth and data meets expectations.

## Validations
- Drift checks: objects exist, required internal fields, naming rules
- FK enforcement where supported (or logical FK checks where not)
- Partitioning checks for large facts
- Row count checks, checksum checks, anomaly detection
- Lineage completeness checks

## Outputs
- Audit.DriftCheck
- Audit.QualityCheck
- Audit.Error
