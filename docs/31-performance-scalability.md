# Performance & Scalability

## Scale targets
- 1k–10k tables per org (across projects)
- 100k+ fields possible
- lineage edges can be very large

## Snapshot export time
- export by PJ_ID + _DeleteDate IS NULL
- index PJ_ID + FK columns
- support incremental export by update watermark

## Generator speed
- multi-pass compile
- incremental compilation (ChangeRequest diff)
- deterministic outputs for CI

## Lineage queries
- precompute closure tables or graph index
- avoid deep recursive CTE on hot path
- cache lineage paths
