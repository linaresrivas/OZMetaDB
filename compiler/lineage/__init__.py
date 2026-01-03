"""Lineage Compiler - traverses and visualizes data lineage.

Steps:
  1.1 Parse lineage edges from metadata
  1.2 Build lineage graph (DAG)
  2.1 Query upstream/downstream
  2.2 Generate visualizations (Mermaid, DOT, JSON)
  3.1 Impact analysis
  3.2 Data quality lineage

The FIRST successful field-level lineage implementation.
"""

from .graph import (
    LineageGraph,
    LineageNode,
    LineageEdge,
    NodeType,
    EdgeType,
    build_lineage_graph,
)
from .query import (
    get_upstream,
    get_downstream,
    get_impact_analysis,
    get_root_sources,
    get_terminal_sinks,
    find_path,
)
from .visualize import (
    to_mermaid,
    to_dot,
    to_json,
    to_d3_graph,
)

__all__ = [
    # Graph
    "LineageGraph",
    "LineageNode",
    "LineageEdge",
    "NodeType",
    "EdgeType",
    "build_lineage_graph",
    # Query
    "get_upstream",
    "get_downstream",
    "get_impact_analysis",
    "get_root_sources",
    "get_terminal_sinks",
    "find_path",
    # Visualize
    "to_mermaid",
    "to_dot",
    "to_json",
    "to_d3_graph",
]
