# Enums / EnumValue Model

## Goal
Make enumerations first-class so the generator can produce:
- DB constraints / lookup tables
- UI dropdowns
- validation rules
- source-system mapping normalization

## Recommended naming
- Enum: `CaseStatus`, `EvidenceType`, `RiskLevel`
- Value codes: stable `NEW`, `REVIEW`, `CLOSED` (labels via TextKeys)

## Generator outputs (starter plan)
- `lkp.<Enum>` table OR CHECK constraints
- UI select component bound to enum
