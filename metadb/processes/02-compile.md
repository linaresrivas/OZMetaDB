# Process: Compile

## Goal
Compile logical definitions into platform-specific artifacts.

## Inputs
- Canonical model + versions
- Source mappings + versions
- Target + TargetPlatform details
- Platform constraint/type profiles

## Outputs (examples)
- PhysicalObject/PhysicalField projections (names/types)
- DDL (SQL) and/or lakehouse table definitions
- Orchestration artifacts (pipelines/jobs/notebooks)
- Semantic model specs (tables, relationships, measures)
- Drift validation ruleset
