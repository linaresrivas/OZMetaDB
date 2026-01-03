from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any

@dataclass
class FieldIR:
    code: str
    type: str
    nullable: bool = True
    ref: Optional[str] = None

@dataclass
class TableIR:
    schema: str
    code: str
    fields: List[FieldIR] = field(default_factory=list)

@dataclass
class ProjectIR:
    tables: List[TableIR] = field(default_factory=list)

def build_ir(snapshot: Dict[str, Any]) -> ProjectIR:
    tables = snapshot.get("objects", {}).get("model", {}).get("tables", [])
    out=[]
    for t in tables:
        flds=[FieldIR(code=f.get("code"), type=f.get("type"), nullable=bool(f.get("nullable", True)), ref=f.get("ref")) for f in t.get("fields", [])]
        out.append(TableIR(schema=t.get("schema","dp"), code=t.get("code"), fields=flds))
    return ProjectIR(tables=out)
