"""DSL Parser - parses DSL JSON into expression tree.

Steps:
  1.1 Parse literal values
  1.2 Parse references (object.field, user.role, etc.)
  1.3 Parse operations (and, or, eq, etc.)
  2.1 Build typed expression tree
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Union


@dataclass
class Literal:
    """A literal value."""
    value: Any
    type: Optional[str] = None

    def __repr__(self) -> str:
        return f"Literal({self.value!r})"


@dataclass
class Ref:
    """A reference to a field or context value."""
    path: str
    cast: Optional[str] = None

    def __repr__(self) -> str:
        return f"Ref({self.path!r})"


@dataclass
class Op:
    """An operation with arguments."""
    op: str
    args: List[Expr]

    def __repr__(self) -> str:
        return f"Op({self.op}, {self.args})"


# Expression type
Expr = Union[Literal, Ref, Op]


def parse_expr(node: Any) -> Expr:
    """Parse an expression node from DSL JSON.

    Steps:
      1.1 Check for literal
      1.2 Check for reference
      1.3 Check for operation
      1.4 Return parsed expression
    """
    if node is None:
        return Literal(None, "null")

    if isinstance(node, bool):
        return Literal(node, "boolean")

    if isinstance(node, (int, float)):
        return Literal(node, "number")

    if isinstance(node, str):
        # Simple string - check for shorthand
        if node in ("allow", "true", "1=1"):
            return Literal(True, "boolean")
        if node in ("deny", "false", "1=0"):
            return Literal(False, "boolean")
        if node == "tenant":
            return Op("eq", [Ref("_TenantID"), Ref("context.tenantId")])
        return Literal(node, "string")

    if not isinstance(node, dict):
        return Literal(node, "unknown")

    # 1.1 Check for literal
    if "lit" in node:
        return Literal(node["lit"], node.get("type"))

    # 1.2 Check for reference
    if "ref" in node:
        return Ref(node["ref"], node.get("as"))

    # 1.3 Check for operation
    if "op" in node:
        op_name = node["op"]
        args = [parse_expr(a) for a in node.get("args", [])]
        return Op(op_name, args)

    # Unknown structure - treat as literal
    return Literal(node, "object")


def parse_dsl(dsl: Union[str, Dict[str, Any]]) -> Dict[str, Any]:
    """Parse a full DSL document.

    Steps:
      1.1 Parse JSON if string
      1.2 Extract kind and version
      1.3 Parse expression if present
      1.4 Parse actions if present
    """
    import json

    # 1.1 Parse JSON if string
    if isinstance(dsl, str):
        # Handle shorthand strings
        if dsl in ("allow", "true", "1=1"):
            return {"kind": "Guard", "version": 1, "expr": Literal(True, "boolean")}
        if dsl in ("deny", "false", "1=0"):
            return {"kind": "Guard", "version": 1, "expr": Literal(False, "boolean")}
        if dsl == "tenant":
            return {
                "kind": "Guard",
                "version": 1,
                "expr": Op("eq", [Ref("_TenantID"), Ref("context.tenantId")])
            }
        try:
            dsl = json.loads(dsl)
        except json.JSONDecodeError:
            # Treat as unknown string literal
            return {"kind": "Guard", "version": 1, "expr": Literal(False, "boolean")}

    if not isinstance(dsl, dict):
        return {"kind": "Guard", "version": 1, "expr": Literal(False, "boolean")}

    result = {
        "kind": dsl.get("kind", "Guard"),
        "version": dsl.get("version", 1),
        "description": dsl.get("description"),
        "params": dsl.get("params"),
    }

    # 1.3 Parse expression if present
    if "expr" in dsl:
        result["expr"] = parse_expr(dsl["expr"])

    # 1.4 Parse actions if present
    if "actions" in dsl:
        result["actions"] = dsl["actions"]  # Keep as-is for now

    return result
