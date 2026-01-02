# Runtime Compiler Contracts (Portable DSL)

OZMetaDB stores *portable* logic for:
- WorkflowTransition guards (`WT_GuardLogical`)
- WorkflowTransition actions (`WT_ActionLogical`)
- SLA start/stop rules (`RuntimeSlaBinding.RSB_StartRule` / `RSB_StopRule`)
- Escalation rules (`SlaPolicy.SL_EscalationRule`)
- Security policies (`SecurityPolicy.SP_ExpressionLogical`)

To make these rules consistent and compilable across platforms, OZMeta defines a **JSON DSL** with a JSON-Schema contract.

## Contract file
- `contracts/ozmeta.runtime.dsl.schema.json`

## Examples
- `contracts/examples/*.json`

## Design goals
1. **Portable**: compiles to SQL predicates/views, Spark expressions, Kusto queries, or app-layer evaluators.
2. **Auditable**: expression trees are deterministic; can be hashed for integrity.
3. **Safe**: no arbitrary code execution; only whitelisted operators.
4. **Composable**: actions can emit events/signals and update runtime tables.

## Reference paths (common)
- `object.<Field>`: current entity instance
- `transition.fromState`, `transition.toState`, `transition.code`
- `user.id`, `user.roles`, `user.claims.<x>`
- `tenant.id`
- `now.utc`
- `context.<x>`: runtime context (device, office, station, source system)

## Compilation
Generators should implement:
- `compileExpr(kind, expr, targetPlatform)`
- `compileActions(actions, targetPlatform)`

Targets:
- Azure SQL / SQL MI: SQL expressions, predicate functions, stored procs
- Fabric Warehouse: SQL expressions + views (where supported)
- Databricks: Spark SQL expressions / Delta Live Table rules
- BigQuery: SQL expressions / row access policies / authorized views
- Redshift: SQL expressions + views
