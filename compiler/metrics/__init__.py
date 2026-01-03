"""Metrics Compiler - compiles canonical metrics to platform expressions.

Steps:
  1.1 Parse metric formula (logical DSL)
  1.2 Resolve metric dependencies
  2.1 Emit to target (TSQL, DAX, Spark SQL, Python)

Supports:
  - Aggregations: SUM, COUNT, AVG, MIN, MAX, DISTINCTCOUNT
  - Time intelligence: YTD, MTD, QTD, PY, PM, SAMEPERIODLASTYEAR
  - Arithmetic: +, -, *, /, %
  - Conditional: IF, SWITCH, COALESCE
  - Window functions: RUNNINGTOTAL, RANK, PERCENTILE
"""

from .compiler import MetricsCompiler, compile_metric, compile_kpi
from .parser import parse_metric_formula, MetricExpr, AggExpr, TimeIntelExpr, ArithExpr

__all__ = [
    "MetricsCompiler",
    "compile_metric",
    "compile_kpi",
    "parse_metric_formula",
    "MetricExpr",
    "AggExpr",
    "TimeIntelExpr",
    "ArithExpr",
]
