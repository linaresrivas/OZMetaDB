"""Lineage Visualization - generate visual representations.

Steps:
  1.1 Generate Mermaid diagrams
  1.2 Generate DOT/Graphviz
  1.3 Generate D3.js JSON
  1.4 Generate simple JSON
"""

from __future__ import annotations
import json
from typing import Any, Dict, List, Optional, Set
from .graph import LineageGraph, LineageNode, LineageEdge, NodeType, EdgeType


def to_mermaid(
    graph: LineageGraph,
    title: Optional[str] = None,
    direction: str = "LR",
    node_ids: Optional[Set[str]] = None
) -> str:
    """Generate Mermaid flowchart diagram.

    Steps:
      1.1 Generate header
      1.2 Generate node definitions with styling
      1.3 Generate edge definitions
      1.4 Add subgraphs by type
    """
    lines = [
        f"---",
        f"title: {title or 'Data Lineage'}",
        f"---",
        f"flowchart {direction}",
        "",
    ]

    # Filter nodes if subset specified
    nodes = graph.nodes.values()
    if node_ids:
        nodes = [n for n in nodes if n.id in node_ids]

    # Group nodes by type for subgraphs
    by_type: Dict[NodeType, List[LineageNode]] = {}
    for node in nodes:
        if node.nodeType not in by_type:
            by_type[node.nodeType] = []
        by_type[node.nodeType].append(node)

    # Define subgraphs
    subgraph_names = {
        NodeType.SOURCE_SYSTEM: "Sources",
        NodeType.SOURCE_OBJECT: "Source Objects",
        NodeType.SOURCE_FIELD: "Source Fields",
        NodeType.CANONICAL_TABLE: "Canonical Model",
        NodeType.CANONICAL_FIELD: "Canonical Fields",
        NodeType.METRIC: "Metrics",
        NodeType.REPORT: "Reports",
    }

    # Generate nodes with appropriate shapes
    node_shapes = {
        NodeType.SOURCE_SYSTEM: ("[(", ")]"),   # Stadium
        NodeType.SOURCE_OBJECT: ("[", "]"),      # Rectangle
        NodeType.SOURCE_FIELD: ("([", "])"),     # Pill
        NodeType.CANONICAL_TABLE: ("[[", "]]"),  # Subroutine
        NodeType.CANONICAL_FIELD: ("(", ")"),    # Rounded
        NodeType.METRIC: ("{{", "}}"),           # Hexagon
        NodeType.REPORT: ("[/", "/]"),           # Trapezoid
    }

    for node_type, type_nodes in by_type.items():
        subgraph_name = subgraph_names.get(node_type, node_type.value)
        lines.append(f"    subgraph {_safe_id(subgraph_name)}[\"{subgraph_name}\"]")

        for node in type_nodes:
            safe_id = _safe_id(node.id)
            shape = node_shapes.get(node_type, ("[", "]"))
            label = node.name
            if node.field:
                label = f"{node.table}.{node.field}" if node.table else node.field
            elif node.table:
                label = f"{node.schema}.{node.table}" if node.schema else node.table

            lines.append(f"        {safe_id}{shape[0]}\"{label}\"{shape[1]}")

        lines.append("    end")
        lines.append("")

    # Generate edges
    lines.append("    %% Edges")
    edge_styles = {
        EdgeType.DIRECT: "-->",
        EdgeType.TRANSFORM: "-.->",
        EdgeType.AGGREGATE: "==>",
        EdgeType.JOIN: "-->",
        EdgeType.FILTER: "-.->",
        EdgeType.DERIVE: "==>",
        EdgeType.COPY: "-->",
        EdgeType.UNION: "-->",
    }

    for edge in graph.edges:
        if node_ids:
            if edge.sourceId not in node_ids or edge.targetId not in node_ids:
                continue

        src = _safe_id(edge.sourceId)
        tgt = _safe_id(edge.targetId)
        style = edge_styles.get(edge.edgeType, "-->")

        if edge.transformation:
            # Add label for transformation
            label = edge.transformation[:20] + "..." if len(edge.transformation) > 20 else edge.transformation
            lines.append(f"    {src} {style}|{label}| {tgt}")
        else:
            lines.append(f"    {src} {style} {tgt}")

    # Add styling
    lines.extend([
        "",
        "    %% Styling",
        "    classDef source fill:#e1f5fe,stroke:#01579b",
        "    classDef canonical fill:#e8f5e9,stroke:#1b5e20",
        "    classDef metric fill:#fff3e0,stroke:#e65100",
        "    classDef report fill:#fce4ec,stroke:#880e4f",
    ])

    # Apply styles
    for node_type, type_nodes in by_type.items():
        if node_type in (NodeType.SOURCE_SYSTEM, NodeType.SOURCE_OBJECT, NodeType.SOURCE_FIELD):
            style_class = "source"
        elif node_type in (NodeType.CANONICAL_TABLE, NodeType.CANONICAL_FIELD):
            style_class = "canonical"
        elif node_type == NodeType.METRIC:
            style_class = "metric"
        elif node_type == NodeType.REPORT:
            style_class = "report"
        else:
            continue

        ids = ",".join(_safe_id(n.id) for n in type_nodes)
        if ids:
            lines.append(f"    class {ids} {style_class}")

    return "\n".join(lines)


def to_dot(
    graph: LineageGraph,
    title: Optional[str] = None,
    rankdir: str = "LR",
    node_ids: Optional[Set[str]] = None
) -> str:
    """Generate DOT/Graphviz diagram.

    Steps:
      1.1 Generate digraph header
      1.2 Generate node definitions
      1.3 Generate edge definitions
      1.4 Add clusters by type
    """
    lines = [
        f'digraph "{title or "Lineage"}" {{',
        f"    rankdir={rankdir};",
        '    node [fontname="Arial", fontsize=10];',
        '    edge [fontname="Arial", fontsize=8];',
        "",
    ]

    # Filter nodes if subset specified
    nodes = list(graph.nodes.values())
    if node_ids:
        nodes = [n for n in nodes if n.id in node_ids]

    # Node colors by type
    colors = {
        NodeType.SOURCE_SYSTEM: "#e1f5fe",
        NodeType.SOURCE_OBJECT: "#b3e5fc",
        NodeType.SOURCE_FIELD: "#81d4fa",
        NodeType.CANONICAL_TABLE: "#c8e6c9",
        NodeType.CANONICAL_FIELD: "#a5d6a7",
        NodeType.METRIC: "#ffe0b2",
        NodeType.REPORT: "#f8bbd9",
    }

    shapes = {
        NodeType.SOURCE_SYSTEM: "cylinder",
        NodeType.SOURCE_OBJECT: "box",
        NodeType.SOURCE_FIELD: "ellipse",
        NodeType.CANONICAL_TABLE: "box3d",
        NodeType.CANONICAL_FIELD: "ellipse",
        NodeType.METRIC: "hexagon",
        NodeType.REPORT: "note",
    }

    # Group by type for clusters
    by_type: Dict[NodeType, List[LineageNode]] = {}
    for node in nodes:
        if node.nodeType not in by_type:
            by_type[node.nodeType] = []
        by_type[node.nodeType].append(node)

    cluster_names = {
        NodeType.SOURCE_SYSTEM: "Sources",
        NodeType.SOURCE_OBJECT: "Source Objects",
        NodeType.SOURCE_FIELD: "Source Fields",
        NodeType.CANONICAL_TABLE: "Canonical Model",
        NodeType.CANONICAL_FIELD: "Canonical Fields",
        NodeType.METRIC: "Metrics",
        NodeType.REPORT: "Reports",
    }

    # Generate clusters
    for i, (node_type, type_nodes) in enumerate(by_type.items()):
        cluster_name = cluster_names.get(node_type, node_type.value)
        color = colors.get(node_type, "#ffffff")
        shape = shapes.get(node_type, "box")

        lines.append(f'    subgraph cluster_{i} {{')
        lines.append(f'        label="{cluster_name}";')
        lines.append(f'        style=filled;')
        lines.append(f'        fillcolor="{color}40";')
        lines.append("")

        for node in type_nodes:
            safe_id = _safe_id(node.id)
            label = _get_node_label(node)
            lines.append(f'        {safe_id} [label="{label}", shape={shape}, style=filled, fillcolor="{color}"];')

        lines.append("    }")
        lines.append("")

    # Generate edges
    lines.append("    // Edges")
    edge_styles = {
        EdgeType.DIRECT: "",
        EdgeType.TRANSFORM: 'style=dashed, label="transform"',
        EdgeType.AGGREGATE: 'style=bold, label="aggregate"',
        EdgeType.JOIN: 'label="join"',
        EdgeType.FILTER: 'style=dotted, label="filter"',
    }

    for edge in graph.edges:
        if node_ids:
            if edge.sourceId not in node_ids or edge.targetId not in node_ids:
                continue

        src = _safe_id(edge.sourceId)
        tgt = _safe_id(edge.targetId)
        style = edge_styles.get(edge.edgeType, "")

        if edge.transformation:
            label = edge.transformation[:15] + "..." if len(edge.transformation) > 15 else edge.transformation
            style = f'label="{label}"'

        if style:
            lines.append(f"    {src} -> {tgt} [{style}];")
        else:
            lines.append(f"    {src} -> {tgt};")

    lines.append("}")

    return "\n".join(lines)


def to_json(
    graph: LineageGraph,
    node_ids: Optional[Set[str]] = None,
    include_metadata: bool = False
) -> str:
    """Generate JSON representation.

    Steps:
      1.1 Serialize nodes
      1.2 Serialize edges
      1.3 Add stats
    """
    nodes_list = []
    for node in graph.nodes.values():
        if node_ids and node.id not in node_ids:
            continue

        node_dict = {
            "id": node.id,
            "name": node.name,
            "type": node.nodeType.value,
            "path": node.full_path,
        }
        if node.schema:
            node_dict["schema"] = node.schema
        if node.table:
            node_dict["table"] = node.table
        if node.field:
            node_dict["field"] = node.field
        if include_metadata and node.metadata:
            node_dict["metadata"] = node.metadata

        nodes_list.append(node_dict)

    edges_list = []
    for edge in graph.edges:
        if node_ids:
            if edge.sourceId not in node_ids or edge.targetId not in node_ids:
                continue

        edge_dict = {
            "id": edge.id,
            "source": edge.sourceId,
            "target": edge.targetId,
            "type": edge.edgeType.value,
        }
        if edge.transformation:
            edge_dict["transformation"] = edge.transformation
        if edge.confidence < 1.0:
            edge_dict["confidence"] = edge.confidence

        edges_list.append(edge_dict)

    result = {
        "nodes": nodes_list,
        "edges": edges_list,
        "stats": graph.get_stats(),
    }

    return json.dumps(result, indent=2)


def to_d3_graph(
    graph: LineageGraph,
    node_ids: Optional[Set[str]] = None
) -> str:
    """Generate D3.js force-directed graph JSON.

    Steps:
      1.1 Generate nodes with group
      1.2 Generate links with value
    """
    # Map node type to group number
    type_groups = {
        NodeType.SOURCE_SYSTEM: 1,
        NodeType.SOURCE_OBJECT: 2,
        NodeType.SOURCE_FIELD: 3,
        NodeType.CANONICAL_TABLE: 4,
        NodeType.CANONICAL_FIELD: 5,
        NodeType.METRIC: 6,
        NodeType.REPORT: 7,
        NodeType.API: 8,
    }

    nodes_list = []
    node_index: Dict[str, int] = {}

    for i, node in enumerate(graph.nodes.values()):
        if node_ids and node.id not in node_ids:
            continue

        node_index[node.id] = len(nodes_list)
        nodes_list.append({
            "id": node.id,
            "name": node.name,
            "group": type_groups.get(node.nodeType, 0),
            "type": node.nodeType.value,
            "label": _get_node_label(node),
        })

    links_list = []
    for edge in graph.edges:
        if edge.sourceId not in node_index or edge.targetId not in node_index:
            continue

        links_list.append({
            "source": node_index[edge.sourceId],
            "target": node_index[edge.targetId],
            "value": 1 if edge.edgeType == EdgeType.DIRECT else 2,
            "type": edge.edgeType.value,
        })

    result = {
        "nodes": nodes_list,
        "links": links_list,
    }

    return json.dumps(result, indent=2)


def _safe_id(s: str) -> str:
    """Make a string safe for use as an ID in diagrams."""
    return s.replace(":", "_").replace("-", "_").replace(".", "_").replace(" ", "_")


def _get_node_label(node: LineageNode) -> str:
    """Get a display label for a node."""
    if node.field:
        return f"{node.table}.{node.field}" if node.table else node.field
    if node.table:
        return f"{node.schema}.{node.table}" if node.schema else node.table
    return node.name
