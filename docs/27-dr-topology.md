# DR Topology (A/B Slots + Multi-Region)

## Baseline
- blue/green slots for prod
- instant rollback via slot switch
- PITR backups for MetaDB + data plane
- optional active/active multi-region

## Metadata to store
- regions per env
- RPO/RTO targets
- failover runbooks references (no secrets)
