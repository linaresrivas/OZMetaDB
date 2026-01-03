"""Metrics Compiler - compiles metric expressions to platform code.

Steps:
  1.1 Resolve metric dependencies
  1.2 Compile expression tree to target
  2.1 Emit TSQL (SQL Server)
  2.2 Emit DAX (Power BI)
  2.3 Emit Spark SQL (Databricks)
  2.4 Emit Python (pandas/polars)
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set
from .parser import (
    MetricExpr, FieldRef, MetricRef, Literal, AggExpr, TimeIntelExpr,
    ArithExpr, CondExpr, CompareExpr, CoalesceExpr, DivideExpr, WindowExpr,
    AggFunc, TimeIntelFunc, ArithOp, parse_metric_formula, parse_field_ref
)


@dataclass
class CompiledMetric:
    """Result of compiling a metric."""
    metricCode: str
    target: str
    expression: str
    dependencies: List[str] = field(default_factory=list)
    notes: Optional[str] = None


class MetricsCompiler:
    """Compiles metric expressions to target platform code."""

    def __init__(self, target: str = "tsql"):
        """Initialize compiler with target dialect.

        Steps:
          1.1 Set target dialect
          1.2 Configure dialect-specific settings
        """
        self.target = target.lower()
        self._metrics_cache: Dict[str, str] = {}  # metricCode -> compiled expression
        self._setup_dialect()

    def _setup_dialect(self) -> None:
        """Configure dialect-specific settings."""
        if self.target in ("tsql", "sqlserver"):
            self.quote_char = "["
            self.quote_end = "]"
            self.string_quote = "'"
            self.null_safe_divide = True
        elif self.target in ("dax", "powerbi"):
            self.quote_char = "'"
            self.quote_end = "'"
            self.string_quote = '"'
            self.null_safe_divide = True
        elif self.target in ("spark", "databricks", "sparksql"):
            self.quote_char = "`"
            self.quote_end = "`"
            self.string_quote = "'"
            self.null_safe_divide = False
        elif self.target in ("postgres", "redshift"):
            self.quote_char = '"'
            self.quote_end = '"'
            self.string_quote = "'"
            self.null_safe_divide = False
        elif self.target == "python":
            self.quote_char = ""
            self.quote_end = ""
            self.string_quote = '"'
            self.null_safe_divide = True
        else:
            # Default ANSI SQL
            self.quote_char = '"'
            self.quote_end = '"'
            self.string_quote = "'"
            self.null_safe_divide = False

    def quote_identifier(self, name: str) -> str:
        """Quote an identifier for the target dialect."""
        return f"{self.quote_char}{name}{self.quote_end}"

    def quote_field(self, table: str, field: str) -> str:
        """Quote a table.field reference."""
        if self.target in ("dax", "powerbi"):
            return f"{table}[{field}]"
        if table:
            return f"{self.quote_identifier(table)}.{self.quote_identifier(field)}"
        return self.quote_identifier(field)

    def compile(self, expr: MetricExpr) -> str:
        """Compile a metric expression to target code.

        Steps:
          1.1 Dispatch to type-specific compiler
        """
        if isinstance(expr, Literal):
            return self._compile_literal(expr)
        if isinstance(expr, FieldRef):
            return self._compile_field_ref(expr)
        if isinstance(expr, MetricRef):
            return self._compile_metric_ref(expr)
        if isinstance(expr, AggExpr):
            return self._compile_agg(expr)
        if isinstance(expr, TimeIntelExpr):
            return self._compile_time_intel(expr)
        if isinstance(expr, ArithExpr):
            return self._compile_arith(expr)
        if isinstance(expr, CondExpr):
            return self._compile_cond(expr)
        if isinstance(expr, CompareExpr):
            return self._compile_compare(expr)
        if isinstance(expr, CoalesceExpr):
            return self._compile_coalesce(expr)
        if isinstance(expr, DivideExpr):
            return self._compile_divide(expr)
        if isinstance(expr, WindowExpr):
            return self._compile_window(expr)
        return "NULL"

    def _compile_literal(self, lit: Literal) -> str:
        """Compile literal value."""
        if lit.value is None:
            return "NULL" if self.target != "python" else "None"
        if isinstance(lit.value, bool):
            if self.target == "python":
                return "True" if lit.value else "False"
            if self.target in ("dax", "powerbi"):
                return "TRUE" if lit.value else "FALSE"
            return "1" if lit.value else "0"
        if isinstance(lit.value, (int, float)):
            return str(lit.value)
        if isinstance(lit.value, str):
            escaped = lit.value.replace(self.string_quote, self.string_quote * 2)
            return f"{self.string_quote}{escaped}{self.string_quote}"
        return str(lit.value)

    def _compile_field_ref(self, ref: FieldRef) -> str:
        """Compile field reference."""
        return self.quote_field(ref.table, ref.field)

    def _compile_metric_ref(self, ref: MetricRef) -> str:
        """Compile metric reference."""
        metric_code = ref.metricCode if isinstance(ref.metricCode, str) else str(ref.metricCode)
        # Check cache for already-compiled metrics
        if metric_code in self._metrics_cache:
            return f"({self._metrics_cache[metric_code]})"
        # Return as placeholder for dependency resolution
        if self.target in ("dax", "powerbi"):
            return f"[{metric_code}]"
        return f"/* {metric_code} */"

    def _compile_agg(self, agg: AggExpr) -> str:
        """Compile aggregation expression."""
        inner = self.compile(agg.arg)

        if self.target in ("dax", "powerbi"):
            return self._compile_agg_dax(agg, inner)
        if self.target in ("spark", "databricks", "sparksql"):
            return self._compile_agg_spark(agg, inner)
        if self.target == "python":
            return self._compile_agg_python(agg, inner)
        # Default: TSQL/ANSI SQL
        return self._compile_agg_sql(agg, inner)

    def _compile_agg_sql(self, agg: AggExpr, inner: str) -> str:
        """Compile aggregation for TSQL/ANSI SQL."""
        func_map = {
            AggFunc.SUM: "SUM",
            AggFunc.COUNT: "COUNT",
            AggFunc.AVG: "AVG",
            AggFunc.MIN: "MIN",
            AggFunc.MAX: "MAX",
            AggFunc.DISTINCTCOUNT: "COUNT(DISTINCT",
            AggFunc.COUNTROWS: "COUNT(*",
            AggFunc.FIRST: "MIN",  # Approximation
            AggFunc.LAST: "MAX",   # Approximation
            AggFunc.STDEV: "STDEV",
            AggFunc.VAR: "VAR",
            AggFunc.MEDIAN: "PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY",
        }

        func = func_map.get(agg.func, "SUM")

        if agg.func == AggFunc.DISTINCTCOUNT:
            return f"COUNT(DISTINCT {inner})"
        if agg.func == AggFunc.COUNTROWS:
            return "COUNT(*)"
        if agg.func == AggFunc.MEDIAN:
            return f"PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY {inner})"

        result = f"{func}({inner})"

        if agg.filter:
            filter_sql = self.compile(agg.filter)
            result = f"SUM(CASE WHEN {filter_sql} THEN {inner} ELSE 0 END)"

        return result

    def _compile_agg_dax(self, agg: AggExpr, inner: str) -> str:
        """Compile aggregation for DAX."""
        func_map = {
            AggFunc.SUM: "SUM",
            AggFunc.COUNT: "COUNT",
            AggFunc.AVG: "AVERAGE",
            AggFunc.MIN: "MIN",
            AggFunc.MAX: "MAX",
            AggFunc.DISTINCTCOUNT: "DISTINCTCOUNT",
            AggFunc.COUNTROWS: "COUNTROWS",
            AggFunc.FIRST: "FIRSTNONBLANK",
            AggFunc.LAST: "LASTNONBLANK",
            AggFunc.STDEV: "STDEV.P",
            AggFunc.VAR: "VAR.P",
            AggFunc.MEDIAN: "MEDIAN",
        }

        func = func_map.get(agg.func, "SUM")

        if agg.func == AggFunc.COUNTROWS:
            # Extract table from field ref
            if isinstance(agg.arg, FieldRef):
                return f"COUNTROWS({agg.arg.table})"
            return f"COUNTROWS({inner})"

        result = f"{func}({inner})"

        if agg.filter:
            filter_dax = self.compile(agg.filter)
            result = f"CALCULATE({result}, {filter_dax})"

        return result

    def _compile_agg_spark(self, agg: AggExpr, inner: str) -> str:
        """Compile aggregation for Spark SQL."""
        func_map = {
            AggFunc.SUM: "SUM",
            AggFunc.COUNT: "COUNT",
            AggFunc.AVG: "AVG",
            AggFunc.MIN: "MIN",
            AggFunc.MAX: "MAX",
            AggFunc.DISTINCTCOUNT: "COUNT(DISTINCT",
            AggFunc.COUNTROWS: "COUNT(*",
            AggFunc.FIRST: "FIRST",
            AggFunc.LAST: "LAST",
            AggFunc.STDEV: "STDDEV",
            AggFunc.VAR: "VARIANCE",
            AggFunc.MEDIAN: "PERCENTILE",
        }

        func = func_map.get(agg.func, "SUM")

        if agg.func == AggFunc.DISTINCTCOUNT:
            return f"COUNT(DISTINCT {inner})"
        if agg.func == AggFunc.COUNTROWS:
            return "COUNT(*)"
        if agg.func == AggFunc.MEDIAN:
            return f"PERCENTILE({inner}, 0.5)"

        result = f"{func}({inner})"

        if agg.filter:
            filter_sql = self.compile(agg.filter)
            result = f"SUM(CASE WHEN {filter_sql} THEN {inner} ELSE 0 END)"

        return result

    def _compile_agg_python(self, agg: AggExpr, inner: str) -> str:
        """Compile aggregation for Python (pandas)."""
        func_map = {
            AggFunc.SUM: "sum",
            AggFunc.COUNT: "count",
            AggFunc.AVG: "mean",
            AggFunc.MIN: "min",
            AggFunc.MAX: "max",
            AggFunc.DISTINCTCOUNT: "nunique",
            AggFunc.COUNTROWS: "len",
            AggFunc.FIRST: "first",
            AggFunc.LAST: "last",
            AggFunc.STDEV: "std",
            AggFunc.VAR: "var",
            AggFunc.MEDIAN: "median",
        }

        func = func_map.get(agg.func, "sum")

        if agg.func == AggFunc.COUNTROWS:
            return f"len(df)"

        if agg.filter:
            filter_py = self.compile(agg.filter)
            return f"df.loc[{filter_py}, {inner}].{func}()"

        return f"df[{inner}].{func}()"

    def _compile_time_intel(self, ti: TimeIntelExpr) -> str:
        """Compile time intelligence expression."""
        # Ensure metric is compiled if it's an expression
        if hasattr(ti.metric, '__class__') and ti.metric.__class__.__name__ in ('AggExpr', 'ArithExpr', 'FieldRef'):
            pass  # Already parsed
        elif isinstance(ti.metric, dict):
            # Need to parse the inner metric
            ti = TimeIntelExpr(
                func=ti.func,
                metric=parse_metric_formula(ti.metric),
                dateColumn=ti.dateColumn,
                offset=ti.offset
            )

        if self.target in ("dax", "powerbi"):
            return self._compile_time_intel_dax(ti)
        if self.target in ("spark", "databricks", "sparksql"):
            return self._compile_time_intel_spark(ti)
        # Default: TSQL
        return self._compile_time_intel_sql(ti)

    def _compile_time_intel_dax(self, ti: TimeIntelExpr) -> str:
        """Compile time intelligence for DAX."""
        metric = self.compile(ti.metric)
        date_col = self.compile(ti.dateColumn)

        func_map = {
            TimeIntelFunc.YTD: f"TOTALYTD({metric}, {date_col})",
            TimeIntelFunc.MTD: f"TOTALMTD({metric}, {date_col})",
            TimeIntelFunc.QTD: f"TOTALQTD({metric}, {date_col})",
            TimeIntelFunc.PY: f"CALCULATE({metric}, SAMEPERIODLASTYEAR({date_col}))",
            TimeIntelFunc.PM: f"CALCULATE({metric}, PREVIOUSMONTH({date_col}))",
            TimeIntelFunc.PQ: f"CALCULATE({metric}, PREVIOUSQUARTER({date_col}))",
            TimeIntelFunc.SAMEPERIODLASTYEAR: f"CALCULATE({metric}, SAMEPERIODLASTYEAR({date_col}))",
            TimeIntelFunc.PARALLELPERIOD: f"CALCULATE({metric}, PARALLELPERIOD({date_col}, {ti.offset or -1}, MONTH))",
            TimeIntelFunc.DATEADD: f"CALCULATE({metric}, DATEADD({date_col}, {ti.offset or -1}, DAY))",
            TimeIntelFunc.DATESYTD: f"CALCULATE({metric}, DATESYTD({date_col}))",
            TimeIntelFunc.PREVIOUSDAY: f"CALCULATE({metric}, PREVIOUSDAY({date_col}))",
            TimeIntelFunc.PREVIOUSMONTH: f"CALCULATE({metric}, PREVIOUSMONTH({date_col}))",
            TimeIntelFunc.PREVIOUSQUARTER: f"CALCULATE({metric}, PREVIOUSQUARTER({date_col}))",
            TimeIntelFunc.PREVIOUSYEAR: f"CALCULATE({metric}, PREVIOUSYEAR({date_col}))",
        }

        return func_map.get(ti.func, f"CALCULATE({metric}, {date_col})")

    def _compile_time_intel_sql(self, ti: TimeIntelExpr) -> str:
        """Compile time intelligence for TSQL."""
        metric = self.compile(ti.metric)
        date_col = self.compile(ti.dateColumn)

        if ti.func == TimeIntelFunc.YTD:
            return f"""SUM(CASE WHEN {date_col} >= DATEFROMPARTS(YEAR({date_col}), 1, 1)
                AND {date_col} <= GETDATE() THEN {metric} ELSE 0 END)"""
        if ti.func == TimeIntelFunc.MTD:
            return f"""SUM(CASE WHEN {date_col} >= DATEFROMPARTS(YEAR({date_col}), MONTH({date_col}), 1)
                AND {date_col} <= GETDATE() THEN {metric} ELSE 0 END)"""
        if ti.func == TimeIntelFunc.QTD:
            return f"""SUM(CASE WHEN {date_col} >= DATEADD(QUARTER, DATEDIFF(QUARTER, 0, {date_col}), 0)
                AND {date_col} <= GETDATE() THEN {metric} ELSE 0 END)"""
        if ti.func == TimeIntelFunc.PY:
            return f"""SUM(CASE WHEN YEAR({date_col}) = YEAR(GETDATE()) - 1 THEN {metric} ELSE 0 END)"""
        if ti.func == TimeIntelFunc.PM:
            return f"""SUM(CASE WHEN YEAR({date_col}) = YEAR(DATEADD(MONTH, -1, GETDATE()))
                AND MONTH({date_col}) = MONTH(DATEADD(MONTH, -1, GETDATE())) THEN {metric} ELSE 0 END)"""

        # Default
        return metric

    def _compile_time_intel_spark(self, ti: TimeIntelExpr) -> str:
        """Compile time intelligence for Spark SQL."""
        metric = self.compile(ti.metric)
        date_col = self.compile(ti.dateColumn)

        if ti.func == TimeIntelFunc.YTD:
            return f"""SUM(CASE WHEN {date_col} >= DATE_TRUNC('YEAR', CURRENT_DATE())
                AND {date_col} <= CURRENT_DATE() THEN {metric} ELSE 0 END)"""
        if ti.func == TimeIntelFunc.MTD:
            return f"""SUM(CASE WHEN {date_col} >= DATE_TRUNC('MONTH', CURRENT_DATE())
                AND {date_col} <= CURRENT_DATE() THEN {metric} ELSE 0 END)"""
        if ti.func == TimeIntelFunc.PY:
            return f"""SUM(CASE WHEN YEAR({date_col}) = YEAR(CURRENT_DATE()) - 1 THEN {metric} ELSE 0 END)"""

        return metric

    def _compile_arith(self, arith: ArithExpr) -> str:
        """Compile arithmetic expression."""
        left = self.compile(arith.left)
        right = self.compile(arith.right)
        return f"({left} {arith.op.value} {right})"

    def _compile_cond(self, cond: CondExpr) -> str:
        """Compile conditional expression."""
        condition = self.compile(cond.condition)
        then_expr = self.compile(cond.thenExpr)

        if self.target in ("dax", "powerbi"):
            if cond.elseExpr:
                else_expr = self.compile(cond.elseExpr)
                return f"IF({condition}, {then_expr}, {else_expr})"
            return f"IF({condition}, {then_expr})"

        if self.target == "python":
            if cond.elseExpr:
                else_expr = self.compile(cond.elseExpr)
                return f"({then_expr} if {condition} else {else_expr})"
            return f"({then_expr} if {condition} else None)"

        # SQL
        if cond.elseExpr:
            else_expr = self.compile(cond.elseExpr)
            return f"CASE WHEN {condition} THEN {then_expr} ELSE {else_expr} END"
        return f"CASE WHEN {condition} THEN {then_expr} END"

    def _compile_compare(self, comp: CompareExpr) -> str:
        """Compile comparison expression."""
        left = self.compile(comp.left)
        right = self.compile(comp.right)
        return f"({left} {comp.op} {right})"

    def _compile_coalesce(self, coal: CoalesceExpr) -> str:
        """Compile coalesce expression."""
        args = ", ".join(self.compile(a) for a in coal.args)

        if self.target == "python":
            # Python doesn't have COALESCE, use next()
            return f"next((x for x in [{args}] if x is not None), None)"

        return f"COALESCE({args})"

    def _compile_divide(self, div: DivideExpr) -> str:
        """Compile safe division expression."""
        num = self.compile(div.numerator)
        den = self.compile(div.denominator)
        alt = self.compile(div.alternateResult) if div.alternateResult else "0"

        if self.target in ("dax", "powerbi"):
            return f"DIVIDE({num}, {den}, {alt})"

        if self.target == "python":
            return f"({num} / {den} if {den} != 0 else {alt})"

        # SQL: NULLIF pattern
        if self.null_safe_divide:
            return f"CASE WHEN {den} = 0 THEN {alt} ELSE {num} / {den} END"
        return f"({num} / NULLIF({den}, 0))"

    def _compile_window(self, win: WindowExpr) -> str:
        """Compile window function expression."""
        metric = self.compile(win.metric)

        if self.target in ("dax", "powerbi"):
            # DAX doesn't have traditional window functions
            return metric

        # SQL window functions
        parts = [f"{win.func}({metric})"]
        over_parts = []

        if win.partitionBy:
            cols = ", ".join(self.compile(f) for f in win.partitionBy)
            over_parts.append(f"PARTITION BY {cols}")

        if win.orderBy:
            cols = ", ".join(self.compile(f) for f in win.orderBy)
            over_parts.append(f"ORDER BY {cols}")

        if over_parts:
            parts.append(f"OVER ({' '.join(over_parts)})")
        else:
            parts.append("OVER ()")

        return " ".join(parts)


def compile_metric(
    metric_def: Dict[str, Any],
    target: str = "tsql",
    metrics_lookup: Optional[Dict[str, str]] = None
) -> CompiledMetric:
    """Compile a metric definition to target code.

    Steps:
      1.1 Parse formula
      1.2 Resolve dependencies
      1.3 Compile to target

    Args:
        metric_def: Metric definition from snapshot
        target: Target platform (tsql, dax, spark, python)
        metrics_lookup: Dict of metricCode -> compiled expression for dependencies

    Returns:
        CompiledMetric with code and metadata
    """
    code = metric_def.get("code") or metric_def.get("metricCode") or metric_def.get("MT_Code", "Unknown")
    formula = metric_def.get("formula") or metric_def.get("expressionLogical") or metric_def.get("MT_FormulaJSON", {})

    compiler = MetricsCompiler(target)

    # Inject pre-compiled metrics for dependency resolution
    if metrics_lookup:
        compiler._metrics_cache = metrics_lookup.copy()

    # Parse and compile
    expr = parse_metric_formula(formula)
    compiled = compiler.compile(expr)

    # Extract dependencies
    deps = _extract_dependencies(expr)

    return CompiledMetric(
        metricCode=code,
        target=target,
        expression=compiled,
        dependencies=deps,
        notes=metric_def.get("notes")
    )


def _extract_dependencies(expr: MetricExpr) -> List[str]:
    """Extract metric dependencies from expression."""
    deps: Set[str] = set()

    def _walk(e: MetricExpr) -> None:
        if isinstance(e, MetricRef):
            code = e.metricCode if isinstance(e.metricCode, str) else str(e.metricCode)
            deps.add(code)
        elif isinstance(e, AggExpr):
            _walk(e.arg)
            if e.filter:
                _walk(e.filter)
        elif isinstance(e, TimeIntelExpr):
            _walk(e.metric)
        elif isinstance(e, ArithExpr):
            _walk(e.left)
            _walk(e.right)
        elif isinstance(e, CondExpr):
            _walk(e.condition)
            _walk(e.thenExpr)
            if e.elseExpr:
                _walk(e.elseExpr)
        elif isinstance(e, CompareExpr):
            _walk(e.left)
            _walk(e.right)
        elif isinstance(e, CoalesceExpr):
            for a in e.args:
                _walk(a)
        elif isinstance(e, DivideExpr):
            _walk(e.numerator)
            _walk(e.denominator)
            if e.alternateResult:
                _walk(e.alternateResult)
        elif isinstance(e, WindowExpr):
            _walk(e.metric)

    _walk(expr)
    return sorted(deps)


def compile_kpi(
    kpi_def: Dict[str, Any],
    metrics: Dict[str, CompiledMetric],
    target: str = "tsql"
) -> Dict[str, str]:
    """Compile a KPI definition to threshold checks.

    Steps:
      1.1 Get metric expression
      1.2 Generate threshold SQL/DAX
      1.3 Return check expressions

    Args:
        kpi_def: KPI definition from snapshot
        metrics: Dict of compiled metrics
        target: Target platform

    Returns:
        Dict with check expressions for each threshold level
    """
    code = kpi_def.get("code") or kpi_def.get("kpiCode") or kpi_def.get("KPI_Code", "Unknown")
    metric_code = kpi_def.get("metricCode") or kpi_def.get("KPI_MetricCode", "")
    direction = kpi_def.get("direction") or kpi_def.get("KPI_Direction", "HigherIsBetter")
    thresholds = kpi_def.get("thresholds") or kpi_def.get("KPI_ThresholdsJSON", {})
    target_value = kpi_def.get("targetValue") or kpi_def.get("KPI_TargetValue")

    # Get metric expression
    metric_expr = f"[{metric_code}]"
    if metric_code in metrics:
        metric_expr = f"({metrics[metric_code].expression})"

    result: Dict[str, str] = {"kpiCode": code, "metricCode": metric_code}

    # Parse thresholds
    if isinstance(thresholds, str):
        import json
        try:
            thresholds = json.loads(thresholds)
        except json.JSONDecodeError:
            thresholds = {}

    # Generate threshold checks
    red = thresholds.get("red") or thresholds.get("critical")
    yellow = thresholds.get("yellow") or thresholds.get("warning")
    green = thresholds.get("green") or thresholds.get("good")

    if target in ("dax", "powerbi"):
        result["statusExpression"] = _kpi_status_dax(metric_expr, direction, red, yellow, green)
    else:
        result["statusExpression"] = _kpi_status_sql(metric_expr, direction, red, yellow, green)

    # Target variance
    if target_value is not None:
        result["varianceExpression"] = f"({metric_expr} - {target_value})"
        result["variancePctExpression"] = f"(({metric_expr} - {target_value}) / NULLIF({target_value}, 0) * 100)"

    return result


def _kpi_status_dax(metric: str, direction: str, red: Any, yellow: Any, green: Any) -> str:
    """Generate KPI status DAX expression."""
    higher_is_better = direction.lower() in ("higherbetter", "higherisbetter", "maximize")

    if higher_is_better:
        if red is not None and yellow is not None:
            return f"""
SWITCH(
    TRUE(),
    {metric} >= {green or yellow}, "Green",
    {metric} >= {yellow}, "Yellow",
    {metric} < {red}, "Red",
    "Yellow"
)"""
        if red is not None:
            return f'IF({metric} >= {red}, "Green", "Red")'
    else:
        # Lower is better
        if red is not None and yellow is not None:
            return f"""
SWITCH(
    TRUE(),
    {metric} <= {green or yellow}, "Green",
    {metric} <= {yellow}, "Yellow",
    {metric} > {red}, "Red",
    "Yellow"
)"""
        if red is not None:
            return f'IF({metric} <= {red}, "Green", "Red")'

    return '"Unknown"'


def _kpi_status_sql(metric: str, direction: str, red: Any, yellow: Any, green: Any) -> str:
    """Generate KPI status SQL expression."""
    higher_is_better = direction.lower() in ("higherbetter", "higherisbetter", "maximize")

    if higher_is_better:
        if red is not None and yellow is not None:
            return f"""CASE
    WHEN {metric} >= {green or yellow} THEN 'Green'
    WHEN {metric} >= {yellow} THEN 'Yellow'
    WHEN {metric} < {red} THEN 'Red'
    ELSE 'Yellow'
END"""
        if red is not None:
            return f"CASE WHEN {metric} >= {red} THEN 'Green' ELSE 'Red' END"
    else:
        if red is not None and yellow is not None:
            return f"""CASE
    WHEN {metric} <= {green or yellow} THEN 'Green'
    WHEN {metric} <= {yellow} THEN 'Yellow'
    WHEN {metric} > {red} THEN 'Red'
    ELSE 'Yellow'
END"""
        if red is not None:
            return f"CASE WHEN {metric} <= {red} THEN 'Green' ELSE 'Red' END"

    return "'Unknown'"
