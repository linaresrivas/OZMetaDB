"""DSL Compiler - compiles portable DSL to target SQL/code.

Steps:
  1.1 Parse DSL JSON
  1.2 Build expression tree
  2.1 Emit to target (TSQL, Postgres, Python)
"""

from .compiler import compile_dsl, compile_guard_to_sql, DSLCompiler
from .parser import parse_expr, parse_dsl, Literal, Ref, Op, Expr

__all__ = [
    "compile_dsl",
    "compile_guard_to_sql",
    "DSLCompiler",
    "parse_expr",
    "parse_dsl",
    "Literal",
    "Ref",
    "Op",
    "Expr",
]
