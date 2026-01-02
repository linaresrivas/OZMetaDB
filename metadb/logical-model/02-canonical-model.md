# Logical Model: Canonical Data Model

## Meta.Code
Purpose: global registry of STRICT 2-letter table codes.

Fields:
- Code (2 chars, PK)
- SchemaName
- TableName
- TableID (FK)
- IsReserved
- _CreateDate, _SourceSystem, _SourceKey (optional)

## Meta.Table
Purpose: canonical table registry.

Fields:
- TableID (UUID)
- SchemaName (TitleCase)
- TableName (TitleCase)
- TableCode (2 letters, FK to Meta.Code)
- TableType (Dim, Fact, Agg, Bridge, Ref, Audit, Meta)
- GrainDescription (string)
- IsActual (bool)
- IsForecast (bool)
- RequiresTenant (bool)
- SoftDeleteEnabled (bool)
- SourceTrackingEnabled (bool)
- StandardVersion (int)

## Meta.Field
Purpose: canonical field registry.

Fields:
- FieldID (UUID)
- TableID
- FieldName (TitleCase; acronyms uppercase)
- LogicalType (ref to Meta.LogicalType)
- IsPK, IsFK, IsInternal
- IsNullable
- DefaultRule (string)
- SensitivityClass (None/PII/PHI/Sealed/etc.)
- Description

## Meta.Relation
Purpose: canonical relationships (including role naming).

Fields:
- RelationID (UUID)
- FromTableID, FromFieldID
- ToTableID, ToFieldID
- RoleName (TitleCase, optional)
- Cardinality (1:1, 1:N, N:N)
- EnforceInDB (bool)  # if platform supports FK constraints
