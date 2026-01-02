# Environments and Production Slots (A/B)

## Environments
Allowed:
`Dev, Test, Uat, ProdA, ProdB`

## A/B production slots (mandatory)
- Exactly one of ProdA/ProdB is active at a time.
- Deployment goes to the inactive slot.
- Cutover is a switch; rollback is switching back.

## Canonical coordinate includes Env
`{Client}-{Env}-{Platform}-{Domain}-{Region}`

## MetaDB target fields (required)
MetaDB must track per Target:
- Env (Dev/Test/Uat/ProdA/ProdB)
- SwitchGroup (e.g., `SFO_Case_Prod`)
- IsActive (per switch group and platform role)
- ActiveSinceDate
- PreviousTargetID (optional history chain)

## Logical alias (recommended)
Maintain stable logical endpoints (aliases):
- `SFO-Prod-Fabric-BI-USW` (logical alias; not a physical deployment target)
maps to active physical target (`ProdA` or `ProdB`).
