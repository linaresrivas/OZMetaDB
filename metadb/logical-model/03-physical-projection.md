# Logical Model: Physical Projection (Multi-Cloud)

## Meta.ConstraintProfile
Purpose: per-platform naming constraints and normalization rules.

Fields:
- ProfileID
- PlatformCode
- MaxLengthObjectName
- CasePolicy (Lower/Preserve)
- AllowedCharsPattern
- NormalizeRule (e.g., lower, replace invalid with '-', truncate, hash suffix)

## Meta.LogicalType
Purpose: platform-neutral type system.

Examples:
- UUIDv7
- String
- Int32
- Int64
- Decimal
- Money
- Date
- DateTimeUTC
- Bool
- Bytes

## Meta.PhysicalTypeMap
Purpose: map LogicalType → platform-specific physical types.

Fields:
- PlatformCode
- LogicalType
- PhysicalType
- Notes

## Meta.PhysicalObject
Purpose: map canonical objects to physical objects per platform/target.

Fields:
- PhysicalObjectID (UUID)
- TargetPlatformID (FK)
- CanonicalObjectType (Target/Schema/Table/View/etc.)
- CanonicalObjectID (e.g., TableID)
- PhysicalContainer (workspace/project/database)
- PhysicalSchema (dataset/schema)
- PhysicalName (table/object)
- ConstraintsApplied (string)
- IsActive
- ReverseKey (optional composite to reverse-map from physical to canonical)

## Meta.PhysicalField
Purpose: map canonical fields to physical fields per platform.

Fields:
- PhysicalFieldID (UUID)
- PhysicalObjectID (table)
- FieldID (canonical)
- PhysicalFieldName
- PhysicalType
- IsEncrypted (bool)
- IsMasked (bool)
