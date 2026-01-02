# Logical Model: Jobs and Pipelines

## Naming
JobCode is lowercase:
{domain}_{layer}_{action}_{object}
Example: bi_dwh_load_factsalesactual

## Meta.Job
Purpose: logical job definition.

Fields:
- JobID (UUID)
- JobCode (unique)
- Domain
- Layer (raw/stg/dwh/mart/agg/sem/sync/audit)
- Description
- StandardVersion
- IsEnabled

## Meta.JobStep
Purpose: ordered job steps (logical).

Fields:
- StepID (UUID)
- JobID
- StepOrder (int)
- StepCode (lowercase)
- StepType (Extract, LandRaw, Transform, Load, BuildAgg, PublishSem, QualityCheck, DriftCheck)
- InputObjects (refs)
- OutputObjects (refs)
- Parameters (JSON)
- RetryPolicy (JSON)

## Meta.JobTarget
Purpose: compile a job for a platform.

Fields:
- JobTargetID (UUID)
- JobID
- PlatformCode
- TargetPlatformID (optional)
- ImplementationType (FabricPipeline, FabricNotebook, DatabricksJob, SynapsePipeline, SQLAgentJob, Other)
- ArtifactRef (uri/path)
- ArtifactVersion
- IsEnabled
