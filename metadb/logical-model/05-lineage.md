# Logical Model: Lineage

Lineage must be at least field-level and cover:
SourceField → CanonicalField → PhysicalField → SemanticMeasure (where applicable)

## Meta.SourceSystem
- SourceSystemCode (matches _SourceSystem)
- Description
- Owner
- RefreshCadence

## Meta.SourceObject
- SourceObjectID (UUID)
- SourceSystemCode
- ObjectName
- ObjectType (Table/File/API)
- LocationRef (uri/conn string ref)
- Notes

## Meta.SourceField
- SourceFieldID (UUID)
- SourceObjectID
- FieldName
- SourceType
- IsKey
- Notes

## Meta.MapObject
- MapObjectID (UUID)
- SourceObjectID
- TableID (canonical)
- MapVersion
- Strategy (Append/Upsert/SCD1/SCD2)
- Notes

## Meta.MapField
- MapFieldID (UUID)
- MapObjectID
- SourceFieldID
- FieldID (canonical)
- TransformExpressionLogical (string/JSON)
- TransformExpressionSQL (optional)
- TransformExpressionSpark (optional)
- MapVersion

## Meta.LineageEdge
- LineageID (UUID)
- FromType (SourceField/CanonicalField/PhysicalField/SemanticMeasure)
- FromID
- ToType
- ToID
- Evidence (MapFieldID / MetricFormulaID)
