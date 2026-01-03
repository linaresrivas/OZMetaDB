"""Metric Formula Parser - parses logical metric DSL to expression tree.

Steps:
  1.1 Parse aggregation expressions
  1.2 Parse time intelligence expressions
  1.3 Parse arithmetic expressions
  1.4 Parse conditional expressions
  1.5 Resolve field/metric references
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union
from enum import Enum


class AggFunc(str, Enum):
    """Supported aggregation functions."""
    SUM = "SUM"
    COUNT = "COUNT"
    AVG = "AVG"
    MIN = "MIN"
    MAX = "MAX"
    DISTINCTCOUNT = "DISTINCTCOUNT"
    COUNTROWS = "COUNTROWS"
    FIRST = "FIRST"
    LAST = "LAST"
    STDEV = "STDEV"
    VAR = "VAR"
    MEDIAN = "MEDIAN"


class TimeIntelFunc(str, Enum):
    """Supported time intelligence functions."""
    YTD = "YTD"           # Year to date
    MTD = "MTD"           # Month to date
    QTD = "QTD"           # Quarter to date
    PY = "PY"             # Prior year
    PM = "PM"             # Prior month
    PQ = "PQ"             # Prior quarter
    SAMEPERIODLASTYEAR = "SAMEPERIODLASTYEAR"
    PARALLELPERIOD = "PARALLELPERIOD"
    DATEADD = "DATEADD"
    DATESYTD = "DATESYTD"
    DATESMTD = "DATESMTD"
    DATESQTD = "DATESQTD"
    PREVIOUSDAY = "PREVIOUSDAY"
    PREVIOUSMONTH = "PREVIOUSMONTH"
    PREVIOUSQUARTER = "PREVIOUSQUARTER"
    PREVIOUSYEAR = "PREVIOUSYEAR"


class ArithOp(str, Enum):
    """Arithmetic operators."""
    ADD = "+"
    SUB = "-"
    MUL = "*"
    DIV = "/"
    MOD = "%"


# Expression types
@dataclass
class FieldRef:
    """Reference to a table.field."""
    table: str
    field: str
    alias: Optional[str] = None

    def __str__(self) -> str:
        return f"{self.table}.{self.field}"


@dataclass
class MetricRef:
    """Reference to another metric."""
    metricCode: str

    def __str__(self) -> str:
        return f"[{self.metricCode}]"


@dataclass
class Literal:
    """Literal value."""
    value: Any
    type: Optional[str] = None

    def __str__(self) -> str:
        if isinstance(self.value, str):
            return f'"{self.value}"'
        return str(self.value)


@dataclass
class AggExpr:
    """Aggregation expression: SUM(table.field)."""
    func: AggFunc
    arg: Union[FieldRef, 'MetricExpr']
    filter: Optional['MetricExpr'] = None  # CALCULATE filter

    def __str__(self) -> str:
        base = f"{self.func.value}({self.arg})"
        if self.filter:
            return f"CALCULATE({base}, {self.filter})"
        return base


@dataclass
class TimeIntelExpr:
    """Time intelligence expression: YTD(metric, dateColumn)."""
    func: TimeIntelFunc
    metric: Union['MetricExpr', AggExpr, MetricRef]
    dateColumn: FieldRef
    offset: Optional[int] = None  # For PARALLELPERIOD, DATEADD

    def __str__(self) -> str:
        if self.offset is not None:
            return f"{self.func.value}({self.metric}, {self.dateColumn}, {self.offset})"
        return f"{self.func.value}({self.metric}, {self.dateColumn})"


@dataclass
class ArithExpr:
    """Arithmetic expression: a + b, a / b."""
    op: ArithOp
    left: 'MetricExpr'
    right: 'MetricExpr'

    def __str__(self) -> str:
        return f"({self.left} {self.op.value} {self.right})"


@dataclass
class CondExpr:
    """Conditional expression: IF(cond, then, else)."""
    condition: 'MetricExpr'
    thenExpr: 'MetricExpr'
    elseExpr: Optional['MetricExpr'] = None

    def __str__(self) -> str:
        if self.elseExpr:
            return f"IF({self.condition}, {self.thenExpr}, {self.elseExpr})"
        return f"IF({self.condition}, {self.thenExpr})"


@dataclass
class CompareExpr:
    """Comparison expression: a > b, a = b."""
    op: str  # =, <>, >, <, >=, <=
    left: 'MetricExpr'
    right: 'MetricExpr'

    def __str__(self) -> str:
        return f"{self.left} {self.op} {self.right}"


@dataclass
class CoalesceExpr:
    """COALESCE expression: first non-null."""
    args: List['MetricExpr']

    def __str__(self) -> str:
        return f"COALESCE({', '.join(str(a) for a in self.args)})"


@dataclass
class DivideExpr:
    """Safe division with zero handling."""
    numerator: 'MetricExpr'
    denominator: 'MetricExpr'
    alternateResult: Optional['MetricExpr'] = None

    def __str__(self) -> str:
        if self.alternateResult:
            return f"DIVIDE({self.numerator}, {self.denominator}, {self.alternateResult})"
        return f"DIVIDE({self.numerator}, {self.denominator})"


@dataclass
class WindowExpr:
    """Window function expression."""
    func: str  # RUNNINGTOTAL, RANK, PERCENTILE, etc.
    metric: 'MetricExpr'
    partitionBy: Optional[List[FieldRef]] = None
    orderBy: Optional[List[FieldRef]] = None

    def __str__(self) -> str:
        parts = [f"{self.func}({self.metric})"]
        if self.partitionBy:
            parts.append(f"PARTITION BY {', '.join(str(f) for f in self.partitionBy)}")
        if self.orderBy:
            parts.append(f"ORDER BY {', '.join(str(f) for f in self.orderBy)}")
        return " ".join(parts)


# Union type for all metric expressions
MetricExpr = Union[
    FieldRef, MetricRef, Literal, AggExpr, TimeIntelExpr,
    ArithExpr, CondExpr, CompareExpr, CoalesceExpr, DivideExpr, WindowExpr
]


def parse_field_ref(node: Dict[str, Any]) -> FieldRef:
    """Parse a field reference from DSL.

    Formats:
      - {"table": "Sales", "field": "Amount"}
      - {"ref": "Sales.Amount"}
    """
    if "ref" in node:
        parts = node["ref"].split(".", 1)
        if len(parts) == 2:
            return FieldRef(table=parts[0], field=parts[1], alias=node.get("alias"))
        return FieldRef(table="", field=parts[0], alias=node.get("alias"))
    return FieldRef(
        table=node.get("table", ""),
        field=node.get("field", ""),
        alias=node.get("alias")
    )


def parse_metric_formula(node: Any) -> MetricExpr:
    """Parse a metric formula DSL to expression tree.

    Steps:
      1.1 Handle string shorthand
      1.2 Handle literal values
      1.3 Handle expression objects
    """
    # 1.1 String shorthand: "SUM(Sales.Amount)" or "Sales.Amount"
    if isinstance(node, str):
        return _parse_string_formula(node)

    # 1.2 Literal values
    if isinstance(node, (int, float, bool)):
        return Literal(value=node, type=type(node).__name__)

    if not isinstance(node, dict):
        return Literal(value=node)

    # 1.3 Expression objects - order matters!
    # Check compound expressions first before simple references
    if "lit" in node:
        return Literal(value=node["lit"], type=node.get("type"))

    if "timeIntel" in node:
        return _parse_time_intel_expr(node)

    if "agg" in node:
        return _parse_agg_expr(node)

    # Simple metric reference: {"metric": "TotalSales"} - must be a string
    if "metric" in node and isinstance(node["metric"], str):
        return MetricRef(metricCode=node["metric"])

    if "ref" in node or ("table" in node and "field" in node):
        return parse_field_ref(node)

    if "op" in node:
        op = node["op"]
        if op in ("+", "-", "*", "/", "%"):
            return _parse_arith_expr(node)
        if op in ("=", "<>", ">", "<", ">=", "<=", "==", "!="):
            return _parse_compare_expr(node)

    if "if" in node:
        return _parse_cond_expr(node)

    if "coalesce" in node:
        return CoalesceExpr(args=[parse_metric_formula(a) for a in node["coalesce"]])

    if "divide" in node:
        return _parse_divide_expr(node)

    if "window" in node:
        return _parse_window_expr(node)

    # Default: literal
    return Literal(value=node)


def _parse_string_formula(s: str) -> MetricExpr:
    """Parse string shorthand formulas.

    Examples:
      - "SUM(Sales.Amount)"
      - "Sales.Amount"
      - "[TotalSales]"
      - "42"
    """
    s = s.strip()

    # Metric reference: [MetricCode]
    if s.startswith("[") and s.endswith("]"):
        return MetricRef(metricCode=s[1:-1])

    # Aggregation: FUNC(table.field)
    for func in AggFunc:
        prefix = f"{func.value}("
        if s.upper().startswith(prefix) and s.endswith(")"):
            inner = s[len(prefix):-1]
            return AggExpr(func=func, arg=_parse_string_formula(inner))

    # Field reference: table.field
    if "." in s and not s.replace(".", "").replace("_", "").isdigit():
        parts = s.split(".", 1)
        return FieldRef(table=parts[0], field=parts[1])

    # Numeric literal
    try:
        if "." in s:
            return Literal(value=float(s), type="float")
        return Literal(value=int(s), type="int")
    except ValueError:
        pass

    # String literal
    return Literal(value=s, type="string")


def _parse_agg_expr(node: Dict[str, Any]) -> AggExpr:
    """Parse aggregation expression."""
    func_str = node["agg"].upper()
    try:
        func = AggFunc(func_str)
    except ValueError:
        func = AggFunc.SUM  # Default

    arg = parse_metric_formula(node.get("arg", node.get("field", {})))
    filter_expr = None
    if "filter" in node:
        filter_expr = parse_metric_formula(node["filter"])

    return AggExpr(func=func, arg=arg, filter=filter_expr)


def _parse_time_intel_expr(node: Dict[str, Any]) -> TimeIntelExpr:
    """Parse time intelligence expression."""
    func_str = node["timeIntel"].upper()
    try:
        func = TimeIntelFunc(func_str)
    except ValueError:
        func = TimeIntelFunc.YTD  # Default

    metric = parse_metric_formula(node.get("metric", node.get("arg", {})))
    date_col = parse_field_ref(node.get("dateColumn", node.get("date", {})))
    offset = node.get("offset")

    return TimeIntelExpr(func=func, metric=metric, dateColumn=date_col, offset=offset)


def _parse_arith_expr(node: Dict[str, Any]) -> ArithExpr:
    """Parse arithmetic expression."""
    op_str = node["op"]
    try:
        op = ArithOp(op_str)
    except ValueError:
        op = ArithOp.ADD

    left = parse_metric_formula(node.get("left", node.get("args", [{}])[0]))
    right = parse_metric_formula(node.get("right", node.get("args", [None, {}])[1]))

    return ArithExpr(op=op, left=left, right=right)


def _parse_compare_expr(node: Dict[str, Any]) -> CompareExpr:
    """Parse comparison expression."""
    op = node["op"]
    if op == "==":
        op = "="
    if op == "!=":
        op = "<>"

    left = parse_metric_formula(node.get("left", node.get("args", [{}])[0]))
    right = parse_metric_formula(node.get("right", node.get("args", [None, {}])[1]))

    return CompareExpr(op=op, left=left, right=right)


def _parse_cond_expr(node: Dict[str, Any]) -> CondExpr:
    """Parse conditional expression."""
    cond = parse_metric_formula(node["if"])
    then_expr = parse_metric_formula(node.get("then", {}))
    else_expr = None
    if "else" in node:
        else_expr = parse_metric_formula(node["else"])

    return CondExpr(condition=cond, thenExpr=then_expr, elseExpr=else_expr)


def _parse_divide_expr(node: Dict[str, Any]) -> DivideExpr:
    """Parse safe division expression."""
    div = node["divide"]
    if isinstance(div, list) and len(div) >= 2:
        num = parse_metric_formula(div[0])
        den = parse_metric_formula(div[1])
        alt = parse_metric_formula(div[2]) if len(div) > 2 else None
    else:
        num = parse_metric_formula(node.get("numerator", {}))
        den = parse_metric_formula(node.get("denominator", {}))
        alt = parse_metric_formula(node["alternate"]) if "alternate" in node else None

    return DivideExpr(numerator=num, denominator=den, alternateResult=alt)


def _parse_window_expr(node: Dict[str, Any]) -> WindowExpr:
    """Parse window function expression."""
    func = node["window"].upper()
    metric = parse_metric_formula(node.get("metric", node.get("arg", {})))

    partition_by = None
    if "partitionBy" in node:
        partition_by = [parse_field_ref(f) for f in node["partitionBy"]]

    order_by = None
    if "orderBy" in node:
        order_by = [parse_field_ref(f) for f in node["orderBy"]]

    return WindowExpr(func=func, metric=metric, partitionBy=partition_by, orderBy=order_by)
