# Logical Model: Platforms and Targets

## Meta.Platform
Purpose: registry of supported platforms and their constraints.

Minimum fields:
- PlatformCode (e.g., Fabric, SQLMI, BigQuery, Redshift, Databricks)
- Cloud (Azure, GCP, AWS, OnPrem)
- Category (OLTP, Warehouse, Lakehouse, Semantic, Orchestrator)
- NamingConstraintProfile (ref)
- TypeMappingProfile (ref)
- IsEnabled

## Meta.Target
Purpose: canonical deployment target (coordinates).

Minimum fields:
- TargetID (UUID)
- ClientCode
- Env (Dev/Test/Uat/ProdA/ProdB)
- Platform (canonical 'preferred' platform token; can be overridden by TargetPlatform)
- Domain (BI, Case, Risk, Core, Meta)
- Region (USW, USE, EUW, etc.)
- CanonicalName = {Client}-{Env}-{Platform}-{Domain}-{Region}
- SwitchGroup (for ProdA/ProdB)
- IsActive (in switch group)
- ActiveSinceDate
- PreviousTargetID (optional)

## Meta.TargetPlatform
Purpose: multi-platform mapping for a Target (multi-cloud + redundancy).

Minimum fields:
- TargetPlatformID (UUID)
- TargetID
- PlatformCode
- Role (Primary/Secondary/DR)
- FailoverOrder
- IsActive
- PhysicalLocator (JSON or structured: subscription/project/account IDs)
