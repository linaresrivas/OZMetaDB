# Full-Fidelity Exporter Contract (MetaDB -> Snapshot)

Goal: any exporter can produce **the same snapshot shape** as `exports/samples/sample.snapshot.json`.

Required keys (empty arrays allowed):
- objects.model.tables[]
- objects.texts.languages[], textKeys[], translations[]
- objects.uiThemes[]
- objects.ui.apps[], pages[], components[], pageComponents[]
- objects.workflows.workflows[], states[], transitions[]
- objects.runtime.bindings[]
- objects.governance.purposes[], consentPolicies[], residencyPolicies[]
- objects.reliability.outboxSpecs[], inboxSpecs[]
- objects.graph.models[], nodeTypes[], edgeTypes[]
- objects.enums.enums[], values[]
- objects.documents.documentTypes[], retentionPolicies[], redactionPolicies[]
- objects.ai.features[], models[]

Determinism:
- _DeleteDate IS NULL
- stable sort by PK
- UTC ISO8601 strings
