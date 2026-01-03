"""DSL Compiler - compiles expression trees to target SQL dialects.

Steps:
  1.1 Compile literals to SQL
  1.2 Compile references to SQL identifiers
  1.3 Compile operations to SQL expressions
  2.1 Target-specific emitters (TSQL, Postgres, Spark, Snowflake)
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional, Callable
from .parser import Expr, Literal, Ref, Op, parse_expr, parse_dsl


class DSLCompiler:
    """Compiles DSL expressions to target SQL dialect."""

    def __init__(self, target: str = "tsql"):
        """Initialize compiler with target dialect.

        Steps:
          1.1 Set target dialect
          1.2 Configure dialect-specific settings
        """
        self.target = target.lower()
        self._setup_dialect()

    def _setup_dialect(self) -> None:
        """Configure dialect-specific settings.

        Steps:
          1.1 Set quote character for identifiers
          1.2 Set string quote character
          1.3 Set boolean literals
          1.4 Set null handling
        """
        if self.target in ("tsql", "sqlserver"):
            self.id_quote = "["
            self.id_quote_end = "]"
            self.str_quote = "'"
            self.true_lit = "1"
            self.false_lit = "0"
            self.null_lit = "NULL"
            self.concat_op = "+"
            self.current_timestamp = "GETUTCDATE()"
        elif self.target == "postgres":
            self.id_quote = '"'
            self.id_quote_end = '"'
            self.str_quote = "'"
            self.true_lit = "TRUE"
            self.false_lit = "FALSE"
            self.null_lit = "NULL"
            self.concat_op = "||"
            self.current_timestamp = "NOW()"
        elif self.target == "snowflake":
            self.id_quote = '"'
            self.id_quote_end = '"'
            self.str_quote = "'"
            self.true_lit = "TRUE"
            self.false_lit = "FALSE"
            self.null_lit = "NULL"
            self.concat_op = "||"
            self.current_timestamp = "CURRENT_TIMESTAMP()"
        elif self.target in ("spark", "databricks"):
            self.id_quote = "`"
            self.id_quote_end = "`"
            self.str_quote = "'"
            self.true_lit = "TRUE"
            self.false_lit = "FALSE"
            self.null_lit = "NULL"
            self.concat_op = "||"
            self.current_timestamp = "CURRENT_TIMESTAMP()"
        elif self.target == "bigquery":
            self.id_quote = "`"
            self.id_quote_end = "`"
            self.str_quote = "'"
            self.true_lit = "TRUE"
            self.false_lit = "FALSE"
            self.null_lit = "NULL"
            self.concat_op = "||"
            self.current_timestamp = "CURRENT_TIMESTAMP()"
        else:
            # Default to ANSI SQL
            self.id_quote = '"'
            self.id_quote_end = '"'
            self.str_quote = "'"
            self.true_lit = "TRUE"
            self.false_lit = "FALSE"
            self.null_lit = "NULL"
            self.concat_op = "||"
            self.current_timestamp = "CURRENT_TIMESTAMP"

    def quote_identifier(self, name: str) -> str:
        """Quote an identifier for the target dialect.

        Steps:
          1.1 Handle dot-separated paths
          1.2 Quote each segment
        """
        parts = name.split(".")
        return ".".join(f"{self.id_quote}{p}{self.id_quote_end}" for p in parts)

    def quote_string(self, value: str) -> str:
        """Quote a string literal.

        Steps:
          1.1 Escape internal quotes
          1.2 Wrap in quotes
        """
        escaped = value.replace(self.str_quote, self.str_quote * 2)
        return f"{self.str_quote}{escaped}{self.str_quote}"

    def compile_literal(self, lit: Literal) -> str:
        """Compile a literal value to SQL.

        Steps:
          1.1 Handle null
          1.2 Handle boolean
          1.3 Handle number
          1.4 Handle string
        """
        if lit.value is None:
            return self.null_lit
        if isinstance(lit.value, bool):
            return self.true_lit if lit.value else self.false_lit
        if isinstance(lit.value, (int, float)):
            return str(lit.value)
        if isinstance(lit.value, str):
            return self.quote_string(lit.value)
        # Fallback for complex objects
        return self.quote_string(str(lit.value))

    def compile_ref(self, ref: Ref, context: Optional[Dict[str, str]] = None) -> str:
        """Compile a reference to SQL.

        Steps:
          1.1 Check context mapping
          1.2 Handle special references
          1.3 Quote identifier
        """
        context = context or {}
        path = ref.path

        # Check context mapping first
        if path in context:
            return context[path]

        # Handle special context references
        if path.startswith("context."):
            ctx_key = path[8:]  # Remove "context." prefix
            if ctx_key == "tenantId":
                return self._context_tenant_id()
            if ctx_key == "userId":
                return self._context_user_id()
            if ctx_key == "now":
                return self.current_timestamp
            # Unknown context - return as parameter
            return f"@{ctx_key}"

        # Handle user references
        if path.startswith("user."):
            return self._user_ref(path[5:])

        # Regular column reference
        result = self.quote_identifier(path)

        # Apply cast if specified
        if ref.cast:
            result = self._apply_cast(result, ref.cast)

        return result

    def _context_tenant_id(self) -> str:
        """Get tenant ID from context based on dialect."""
        if self.target in ("tsql", "sqlserver"):
            return "SESSION_CONTEXT(N'TenantId')"
        if self.target == "postgres":
            return "current_setting('app.tenant_id')"
        if self.target == "snowflake":
            return "CURRENT_SESSION()::VARIANT:tenant_id"
        if self.target in ("spark", "databricks"):
            return "current_user()"  # Unity Catalog uses user identity
        return "@TenantId"

    def _context_user_id(self) -> str:
        """Get user ID from context based on dialect."""
        if self.target in ("tsql", "sqlserver"):
            return "SESSION_CONTEXT(N'UserId')"
        if self.target == "postgres":
            return "current_setting('app.user_id')"
        if self.target == "snowflake":
            return "CURRENT_USER()"
        if self.target in ("spark", "databricks"):
            return "current_user()"
        return "@UserId"

    def _user_ref(self, field: str) -> str:
        """Compile user field reference."""
        if field == "role":
            if self.target in ("tsql", "sqlserver"):
                return "SESSION_CONTEXT(N'UserRole')"
            return "@UserRole"
        if field == "roles":
            if self.target in ("tsql", "sqlserver"):
                return "SESSION_CONTEXT(N'UserRoles')"
            return "@UserRoles"
        return f"@User_{field}"

    def _apply_cast(self, expr: str, cast_type: str) -> str:
        """Apply type cast to expression."""
        type_map = {
            "int": "INT",
            "integer": "INT",
            "string": "VARCHAR(MAX)" if self.target in ("tsql", "sqlserver") else "TEXT",
            "boolean": "BIT" if self.target in ("tsql", "sqlserver") else "BOOLEAN",
            "datetime": "DATETIME2" if self.target in ("tsql", "sqlserver") else "TIMESTAMP",
        }
        sql_type = type_map.get(cast_type.lower(), cast_type.upper())
        return f"CAST({expr} AS {sql_type})"

    def compile_op(self, op: Op, context: Optional[Dict[str, str]] = None) -> str:
        """Compile an operation to SQL.

        Steps:
          1.1 Handle logical operators
          1.2 Handle comparison operators
          1.3 Handle arithmetic operators
          1.4 Handle string operators
          1.5 Handle date operators
          1.6 Handle special operators
        """
        op_name = op.op.lower()
        args = [self.compile_expr(a, context) for a in op.args]

        # 1.1 Logical operators
        if op_name == "and":
            return f"({' AND '.join(args)})"
        if op_name == "or":
            return f"({' OR '.join(args)})"
        if op_name == "not":
            return f"(NOT {args[0]})"

        # 1.2 Comparison operators
        if op_name == "eq":
            return f"({args[0]} = {args[1]})"
        if op_name == "ne":
            return f"({args[0]} <> {args[1]})"
        if op_name == "gt":
            return f"({args[0]} > {args[1]})"
        if op_name == "gte":
            return f"({args[0]} >= {args[1]})"
        if op_name == "lt":
            return f"({args[0]} < {args[1]})"
        if op_name == "lte":
            return f"({args[0]} <= {args[1]})"

        # IN operator
        if op_name == "in":
            values = ", ".join(args[1:])
            return f"({args[0]} IN ({values}))"

        # Null checks
        if op_name == "isnull":
            return f"({args[0]} IS NULL)"
        if op_name == "isnotnull":
            return f"({args[0]} IS NOT NULL)"

        # 1.3 Arithmetic operators
        if op_name == "add":
            return f"({args[0]} + {args[1]})"
        if op_name == "sub":
            return f"({args[0]} - {args[1]})"
        if op_name == "mul":
            return f"({args[0]} * {args[1]})"
        if op_name == "div":
            return f"({args[0]} / {args[1]})"

        # 1.4 String operators
        if op_name == "contains":
            return self._compile_contains(args[0], args[1])
        if op_name == "startswith":
            return self._compile_startswith(args[0], args[1])
        if op_name == "endswith":
            return self._compile_endswith(args[0], args[1])
        if op_name == "concat":
            return f"({f' {self.concat_op} '.join(args)})"
        if op_name == "regex":
            return self._compile_regex(args[0], args[1])

        # 1.5 Date operators
        if op_name == "dateadd":
            return self._compile_dateadd(args)
        if op_name == "datediffminutes":
            return self._compile_datediff_minutes(args[0], args[1])

        # 1.6 Special operators
        if op_name == "coalesce":
            return f"COALESCE({', '.join(args)})"
        if op_name == "case":
            return self._compile_case(op.args, context)
        if op_name == "exists":
            return f"EXISTS ({args[0]})"

        # Unknown operator - emit as function call
        return f"{op_name.upper()}({', '.join(args)})"

    def _compile_contains(self, field: str, value: str) -> str:
        """Compile CONTAINS check."""
        if self.target in ("tsql", "sqlserver"):
            return f"(CHARINDEX({value}, {field}) > 0)"
        return f"({field} LIKE '%' {self.concat_op} {value} {self.concat_op} '%')"

    def _compile_startswith(self, field: str, value: str) -> str:
        """Compile STARTSWITH check."""
        if self.target in ("tsql", "sqlserver"):
            return f"({field} LIKE {value} + '%')"
        return f"({field} LIKE {value} {self.concat_op} '%')"

    def _compile_endswith(self, field: str, value: str) -> str:
        """Compile ENDSWITH check."""
        if self.target in ("tsql", "sqlserver"):
            return f"({field} LIKE '%' + {value})"
        return f"({field} LIKE '%' {self.concat_op} {value})"

    def _compile_regex(self, field: str, pattern: str) -> str:
        """Compile REGEX match."""
        if self.target in ("tsql", "sqlserver"):
            # SQL Server doesn't have native regex - use LIKE approximation
            return f"({field} LIKE {pattern})"
        if self.target == "postgres":
            return f"({field} ~ {pattern})"
        if self.target == "snowflake":
            return f"(REGEXP_LIKE({field}, {pattern}))"
        if self.target in ("spark", "databricks"):
            return f"({field} RLIKE {pattern})"
        return f"(REGEXP_LIKE({field}, {pattern}))"

    def _compile_dateadd(self, args: List[str]) -> str:
        """Compile DATEADD operation."""
        # args: [unit, amount, date]
        if len(args) < 3:
            return "NULL"
        unit, amount, date = args[0], args[1], args[2]
        # Remove quotes from unit if present
        unit_clean = unit.strip("'\"").upper()

        if self.target in ("tsql", "sqlserver"):
            return f"DATEADD({unit_clean}, {amount}, {date})"
        if self.target == "postgres":
            return f"({date} + INTERVAL '{amount} {unit_clean}')"
        if self.target == "snowflake":
            return f"DATEADD({unit_clean}, {amount}, {date})"
        if self.target in ("spark", "databricks"):
            if unit_clean in ("DAY", "DAYS"):
                return f"DATE_ADD({date}, {amount})"
            return f"({date} + INTERVAL {amount} {unit_clean})"
        return f"DATEADD({unit_clean}, {amount}, {date})"

    def _compile_datediff_minutes(self, date1: str, date2: str) -> str:
        """Compile DATEDIFF in minutes."""
        if self.target in ("tsql", "sqlserver"):
            return f"DATEDIFF(MINUTE, {date1}, {date2})"
        if self.target == "postgres":
            return f"EXTRACT(EPOCH FROM ({date2} - {date1})) / 60"
        if self.target == "snowflake":
            return f"DATEDIFF(MINUTE, {date1}, {date2})"
        if self.target in ("spark", "databricks"):
            return f"(UNIX_TIMESTAMP({date2}) - UNIX_TIMESTAMP({date1})) / 60"
        return f"DATEDIFF(MINUTE, {date1}, {date2})"

    def _compile_case(self, args: List[Expr], context: Optional[Dict[str, str]] = None) -> str:
        """Compile CASE expression.

        Args format: [condition1, result1, condition2, result2, ..., else_result]
        """
        parts = ["CASE"]
        i = 0
        while i < len(args) - 1:
            cond = self.compile_expr(args[i], context)
            result = self.compile_expr(args[i + 1], context)
            parts.append(f"WHEN {cond} THEN {result}")
            i += 2
        if i < len(args):
            else_result = self.compile_expr(args[i], context)
            parts.append(f"ELSE {else_result}")
        parts.append("END")
        return " ".join(parts)

    def compile_expr(self, expr: Expr, context: Optional[Dict[str, str]] = None) -> str:
        """Compile any expression to SQL.

        Steps:
          1.1 Dispatch to appropriate compiler
        """
        if isinstance(expr, Literal):
            return self.compile_literal(expr)
        if isinstance(expr, Ref):
            return self.compile_ref(expr, context)
        if isinstance(expr, Op):
            return self.compile_op(expr, context)
        # Unknown expression type
        return "NULL"

    def compile_guard(self, dsl: Any) -> str:
        """Compile a guard DSL to SQL WHERE clause.

        Steps:
          1.1 Parse DSL if needed
          1.2 Compile expression
        """
        if isinstance(dsl, str):
            parsed = parse_dsl(dsl)
            expr = parsed.get("expr")
        elif isinstance(dsl, dict):
            if "expr" in dsl:
                # Check if expr is already parsed or raw
                raw_expr = dsl["expr"]
                if isinstance(raw_expr, (Literal, Ref, Op)):
                    expr = raw_expr
                else:
                    expr = parse_expr(raw_expr)
            elif "op" in dsl or "ref" in dsl or "lit" in dsl:
                # Direct expression dict
                expr = parse_expr(dsl)
            else:
                parsed = parse_dsl(dsl)
                expr = parsed.get("expr")
        else:
            expr = Literal(False, "boolean")

        if expr is None:
            return self.true_lit  # No guard = allow all

        return self.compile_expr(expr)


def compile_dsl(dsl: Any, target: str = "tsql") -> str:
    """Compile DSL expression to SQL.

    Steps:
      1.1 Create compiler
      1.2 Compile guard
    """
    compiler = DSLCompiler(target)
    return compiler.compile_guard(dsl)


def compile_guard_to_sql(guard_dsl: Any, target: str = "tsql") -> str:
    """Compile guard DSL to SQL WHERE clause.

    Convenience function for guard compilation.
    """
    return compile_dsl(guard_dsl, target)
