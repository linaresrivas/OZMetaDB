# Process: Deploy (with A/B Slots)

## Goal
Deploy compiled artifacts to inactive production slot then switch.

## Steps
1) Identify active slot (ProdA or ProdB) for the SwitchGroup
2) Compile artifacts for inactive slot
3) Deploy artifacts
4) Run smoke tests + quality checks + drift checks
5) Promote: mark inactive slot active, deactivate previous
6) Record DeploymentHistory (versions, timestamps, actor)

## Rollback
Switch back to the previous slot (fast).
