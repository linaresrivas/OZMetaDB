# Governance Implementation (Runtime enforcement)

Components:
- PDP: allow/deny + obligations
- PEP: middleware + DB RLS/FLS
- Audit evidence: immutable decisions stamped with policy version

Purpose limitation:
- every request declares a purpose
- deny by default if missing

Consent + Residency:
- DSL compiled into PDP rules
- residency gates storage + compute region

ChangeRequest:
- edit as drafts
- approvals required
- activated versions recorded in audit
