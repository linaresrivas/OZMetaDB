# Logical Model: Metrics and KPIs

## Principle
Metrics are defined once (canonical) and compiled per platform (SQL/DAX/Spark).

## Meta.Metric
Fields:
- MetricID (UUID)
- MetricCode (unique, readable)
- MetricName
- Unit
- FormatString
- BaseTableID (canonical)
- BaseFieldID (canonical, optional)
- Grain (dimension level validity)
- GroupCode (optional)
- IsAdditive (bool)
- Notes

## Meta.MetricFormula
Fields:
- FormulaID (UUID)
- MetricID
- ExpressionLogical (preferred; structured JSON or DSL)
- Version (int)
- EffDate, EndDate (optional)
- Notes

## Meta.MetricDependency
Fields:
- DependencyID (UUID)
- MetricID
- DependsOnMetricID

## Meta.MetricPlatform
Fields:
- MetricPlatformID (UUID)
- FormulaID
- PlatformCode
- ExpressionPhysical (DAX/SQL/Spark)
- Notes

## Meta.KPI
Fields:
- KPIID (UUID)
- KPICode
- KPIName
- MetricID
- Direction (HigherIsBetter/LowerIsBetter)
- Thresholds (JSON)
- TargetValue (optional)
- Notes
