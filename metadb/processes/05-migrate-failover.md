# Process: Migrate / Failover (Multi-Cloud)

## Goal
Move or fail over a canonical target between platforms/clouds without changing canonical definitions.

## Steps
1) Ensure TargetPlatform entries exist for both platforms
2) Compile projections and jobs for secondary platform
3) Deploy and validate secondary
4) Switch role/active flags (Primary → Secondary or vice versa)
5) Update logical aliases/endpoints
6) Record DeploymentHistory and FailoverEvent

## Rules
- Canonical names never change
- Only PhysicalObject/JobTarget change by platform
