"""Lineage Graph - builds and manages lineage DAG.

Steps:
  1.1 Parse nodes (sources, objects, fields)
  1.2 Parse edges (mappings, transformations)
  1.3 Build adjacency lists for traversal
"""

from __future__ import annotations
from dataclasses import dataclass, field as dataclass_field
from typing import Any, Dict, List, Optional, Set, Tuple
from enum import Enum
from collections import defaultdict


class NodeType(str, Enum):
    """Types of lineage nodes."""
    SOURCE_SYSTEM = "source_system"      # External source system
    SOURCE_OBJECT = "source_object"      # Table in source system
    SOURCE_FIELD = "source_field"        # Column in source table
    CANONICAL_TABLE = "canonical_table"  # Meta.Table
    CANONICAL_FIELD = "canonical_field"  # Meta.Field
    PHYSICAL_OBJECT = "physical_object"  # Deployed table
    PHYSICAL_FIELD = "physical_field"    # Deployed column
    METRIC = "metric"                    # Calculated metric
    REPORT = "report"                    # BI report/dashboard
    API = "api"                          # API endpoint


class EdgeType(str, Enum):
    """Types of lineage edges."""
    DIRECT = "direct"           # Direct 1:1 mapping
    TRANSFORM = "transform"     # Transformation applied
    AGGREGATE = "aggregate"     # Aggregation
    JOIN = "join"               # Join from multiple sources
    FILTER = "filter"           # Filtered subset
    DERIVE = "derive"           # Derived/calculated
    COPY = "copy"               # Copy without transformation
    UNION = "union"             # Union of multiple sources


@dataclass
class LineageNode:
    """A node in the lineage graph."""
    id: str
    name: str
    nodeType: NodeType
    schema: Optional[str] = None
    table: Optional[str] = None
    field: Optional[str] = None
    metadata: Dict[str, Any] = dataclass_field(default_factory=dict)

    @property
    def full_path(self) -> str:
        """Get full qualified path."""
        parts = []
        if self.schema:
            parts.append(self.schema)
        if self.table:
            parts.append(self.table)
        if self.field:
            parts.append(self.field)
        return ".".join(parts) if parts else self.name

    def __hash__(self) -> int:
        return hash(self.id)

    def __eq__(self, other: object) -> bool:
        if isinstance(other, LineageNode):
            return self.id == other.id
        return False


@dataclass
class LineageEdge:
    """An edge in the lineage graph."""
    id: str
    sourceId: str
    targetId: str
    edgeType: EdgeType
    transformation: Optional[str] = None  # Expression/SQL
    confidence: float = 1.0  # 0-1, for inferred lineage
    metadata: Dict[str, Any] = dataclass_field(default_factory=dict)

    def __hash__(self) -> int:
        return hash(self.id)


@dataclass
class LineageGraph:
    """A complete lineage graph with nodes and edges.

    Supports:
      - Forward traversal (downstream impact)
      - Backward traversal (upstream sources)
      - Path finding
      - Subgraph extraction
    """
    nodes: Dict[str, LineageNode] = dataclass_field(default_factory=dict)
    edges: List[LineageEdge] = dataclass_field(default_factory=list)

    # Adjacency lists for fast traversal
    _forward: Dict[str, List[str]] = dataclass_field(default_factory=lambda: defaultdict(list))
    _backward: Dict[str, List[str]] = dataclass_field(default_factory=lambda: defaultdict(list))
    _edge_map: Dict[Tuple[str, str], LineageEdge] = dataclass_field(default_factory=dict)

    def add_node(self, node: LineageNode) -> None:
        """Add a node to the graph."""
        self.nodes[node.id] = node

    def add_edge(self, edge: LineageEdge) -> None:
        """Add an edge to the graph."""
        self.edges.append(edge)
        self._forward[edge.sourceId].append(edge.targetId)
        self._backward[edge.targetId].append(edge.sourceId)
        self._edge_map[(edge.sourceId, edge.targetId)] = edge

    def get_node(self, node_id: str) -> Optional[LineageNode]:
        """Get a node by ID."""
        return self.nodes.get(node_id)

    def get_edge(self, source_id: str, target_id: str) -> Optional[LineageEdge]:
        """Get an edge between two nodes."""
        return self._edge_map.get((source_id, target_id))

    def get_downstream(self, node_id: str) -> List[str]:
        """Get immediate downstream node IDs."""
        return self._forward.get(node_id, [])

    def get_upstream(self, node_id: str) -> List[str]:
        """Get immediate upstream node IDs."""
        return self._backward.get(node_id, [])

    def traverse_downstream(self, node_id: str, max_depth: int = 100) -> Set[str]:
        """Traverse all downstream nodes (BFS).

        Steps:
          1.1 Initialize with starting node
          1.2 BFS through forward edges
          1.3 Track visited to avoid cycles
        """
        visited: Set[str] = set()
        queue = [(node_id, 0)]

        while queue:
            current, depth = queue.pop(0)
            if current in visited or depth > max_depth:
                continue
            visited.add(current)

            for next_id in self._forward.get(current, []):
                if next_id not in visited:
                    queue.append((next_id, depth + 1))

        visited.discard(node_id)  # Don't include start node
        return visited

    def traverse_upstream(self, node_id: str, max_depth: int = 100) -> Set[str]:
        """Traverse all upstream nodes (BFS).

        Steps:
          1.1 Initialize with starting node
          1.2 BFS through backward edges
          1.3 Track visited to avoid cycles
        """
        visited: Set[str] = set()
        queue = [(node_id, 0)]

        while queue:
            current, depth = queue.pop(0)
            if current in visited or depth > max_depth:
                continue
            visited.add(current)

            for prev_id in self._backward.get(current, []):
                if prev_id not in visited:
                    queue.append((prev_id, depth + 1))

        visited.discard(node_id)  # Don't include start node
        return visited

    def find_path(self, source_id: str, target_id: str) -> Optional[List[str]]:
        """Find a path between two nodes (BFS).

        Steps:
          1.1 BFS from source
          1.2 Track parent for path reconstruction
          1.3 Return path or None
        """
        if source_id == target_id:
            return [source_id]

        visited: Set[str] = set()
        parent: Dict[str, str] = {}
        queue = [source_id]

        while queue:
            current = queue.pop(0)
            if current in visited:
                continue
            visited.add(current)

            for next_id in self._forward.get(current, []):
                if next_id not in visited:
                    parent[next_id] = current
                    if next_id == target_id:
                        # Reconstruct path
                        path = [target_id]
                        node = target_id
                        while node in parent:
                            node = parent[node]
                            path.append(node)
                        return list(reversed(path))
                    queue.append(next_id)

        return None  # No path found

    def get_root_nodes(self) -> List[str]:
        """Get nodes with no incoming edges (sources)."""
        return [
            node_id for node_id in self.nodes
            if not self._backward.get(node_id)
        ]

    def get_terminal_nodes(self) -> List[str]:
        """Get nodes with no outgoing edges (sinks)."""
        return [
            node_id for node_id in self.nodes
            if not self._forward.get(node_id)
        ]

    def subgraph(self, node_ids: Set[str]) -> 'LineageGraph':
        """Extract a subgraph containing only specified nodes."""
        sub = LineageGraph()

        for node_id in node_ids:
            if node_id in self.nodes:
                sub.add_node(self.nodes[node_id])

        for edge in self.edges:
            if edge.sourceId in node_ids and edge.targetId in node_ids:
                sub.add_edge(edge)

        return sub

    def get_stats(self) -> Dict[str, Any]:
        """Get graph statistics."""
        return {
            "nodeCount": len(self.nodes),
            "edgeCount": len(self.edges),
            "rootNodes": len(self.get_root_nodes()),
            "terminalNodes": len(self.get_terminal_nodes()),
            "nodesByType": self._count_by_type(),
        }

    def _count_by_type(self) -> Dict[str, int]:
        """Count nodes by type."""
        counts: Dict[str, int] = defaultdict(int)
        for node in self.nodes.values():
            counts[node.nodeType.value] += 1
        return dict(counts)


def build_lineage_graph(snapshot: Dict[str, Any]) -> LineageGraph:
    """Build a lineage graph from a snapshot.

    Steps:
      1.1 Parse source systems
      1.2 Parse source objects and fields
      1.3 Parse canonical tables and fields
      1.4 Parse mapping edges
      1.5 Parse physical deployment edges
    """
    graph = LineageGraph()
    objs = snapshot.get("objects", {})

    # 1.1 Parse source systems
    lineage = objs.get("lineage", {})
    sources = lineage.get("sourceSystems", [])
    source_objects = lineage.get("sourceObjects", [])
    source_fields = lineage.get("sourceFields", [])
    map_objects = lineage.get("mapObjects", [])
    map_fields = lineage.get("mapFields", [])
    lineage_edges = lineage.get("lineageEdges", [])

    # Add source system nodes
    for src in sources:
        src_id = src.get("id") or src.get("SS_ID")
        src_code = src.get("code") or src.get("SS_Code", "Unknown")
        graph.add_node(LineageNode(
            id=f"src:{src_id}",
            name=src_code,
            nodeType=NodeType.SOURCE_SYSTEM,
            metadata=src,
        ))

    # Add source object nodes
    for obj in source_objects:
        obj_id = obj.get("id") or obj.get("SO_ID")
        obj_name = obj.get("name") or obj.get("SO_Name", "Unknown")
        src_id = obj.get("sourceSystemId") or obj.get("SS_ID")
        schema = obj.get("schema") or obj.get("SO_Schema")

        graph.add_node(LineageNode(
            id=f"src_obj:{obj_id}",
            name=obj_name,
            nodeType=NodeType.SOURCE_OBJECT,
            schema=schema,
            table=obj_name,
            metadata=obj,
        ))

        # Edge from source system to source object
        if src_id:
            graph.add_edge(LineageEdge(
                id=f"e:src:{src_id}->src_obj:{obj_id}",
                sourceId=f"src:{src_id}",
                targetId=f"src_obj:{obj_id}",
                edgeType=EdgeType.DIRECT,
            ))

    # Add source field nodes
    for fld in source_fields:
        fld_id = fld.get("id") or fld.get("SF_ID")
        fld_name = fld.get("name") or fld.get("SF_Name", "Unknown")
        obj_id = fld.get("sourceObjectId") or fld.get("SO_ID")

        graph.add_node(LineageNode(
            id=f"src_fld:{fld_id}",
            name=fld_name,
            nodeType=NodeType.SOURCE_FIELD,
            field=fld_name,
            metadata=fld,
        ))

        # Edge from source object to source field
        if obj_id:
            graph.add_edge(LineageEdge(
                id=f"e:src_obj:{obj_id}->src_fld:{fld_id}",
                sourceId=f"src_obj:{obj_id}",
                targetId=f"src_fld:{fld_id}",
                edgeType=EdgeType.DIRECT,
            ))

    # 1.2 Parse canonical model
    model = objs.get("model", {})
    tables = model.get("tables", [])

    for tbl in tables:
        tbl_id = tbl.get("id") or tbl.get("TB_ID")
        tbl_code = tbl.get("code") or tbl.get("TB_Code", "Unknown")
        schema = tbl.get("schema") or tbl.get("TB_Schema", "dbo")

        graph.add_node(LineageNode(
            id=f"tbl:{tbl_id}",
            name=tbl_code,
            nodeType=NodeType.CANONICAL_TABLE,
            schema=schema,
            table=tbl_code,
            metadata=tbl,
        ))

        # Add fields
        for fld in tbl.get("fields", []):
            fld_id = fld.get("id") or fld.get("FD_ID")
            fld_code = fld.get("code") or fld.get("FD_Code", "Unknown")

            graph.add_node(LineageNode(
                id=f"fld:{fld_id}",
                name=fld_code,
                nodeType=NodeType.CANONICAL_FIELD,
                schema=schema,
                table=tbl_code,
                field=fld_code,
                metadata=fld,
            ))

            # Edge from table to field
            graph.add_edge(LineageEdge(
                id=f"e:tbl:{tbl_id}->fld:{fld_id}",
                sourceId=f"tbl:{tbl_id}",
                targetId=f"fld:{fld_id}",
                edgeType=EdgeType.DIRECT,
            ))

    # 1.3 Parse mapping edges (source -> canonical)
    for mf in map_fields:
        mf_id = mf.get("id") or mf.get("MF_ID")
        src_fld_id = mf.get("sourceFieldId") or mf.get("SF_ID")
        tgt_fld_id = mf.get("targetFieldId") or mf.get("FD_ID")
        transform = mf.get("transformation") or mf.get("MF_Transformation")
        edge_type = EdgeType.TRANSFORM if transform else EdgeType.DIRECT

        if src_fld_id and tgt_fld_id:
            graph.add_edge(LineageEdge(
                id=f"e:map:{mf_id}",
                sourceId=f"src_fld:{src_fld_id}",
                targetId=f"fld:{tgt_fld_id}",
                edgeType=edge_type,
                transformation=transform,
            ))

    # 1.4 Parse explicit lineage edges
    for le in lineage_edges:
        le_id = le.get("id") or le.get("LE_ID")
        src_id = le.get("sourceNodeId") or le.get("LE_SourceID")
        tgt_id = le.get("targetNodeId") or le.get("LE_TargetID")
        edge_type_str = le.get("edgeType") or le.get("LE_EdgeType", "direct")

        try:
            edge_type = EdgeType(edge_type_str.lower())
        except ValueError:
            edge_type = EdgeType.DIRECT

        graph.add_edge(LineageEdge(
            id=f"e:le:{le_id}",
            sourceId=src_id,
            targetId=tgt_id,
            edgeType=edge_type,
            transformation=le.get("transformation") or le.get("LE_Transformation"),
            confidence=le.get("confidence", 1.0),
        ))

    # 1.5 Parse metrics as nodes
    metrics = objs.get("metrics", {})
    if isinstance(metrics, list):
        metric_list = metrics
    elif isinstance(metrics, dict):
        metric_list = metrics.get("metrics", [])
    else:
        metric_list = []

    for m in metric_list:
        m_id = m.get("id") or m.get("MT_ID")
        m_code = m.get("code") or m.get("MT_Code", "Unknown")
        base_tbl = m.get("baseTableId") or m.get("TB_ID")
        base_fld = m.get("baseFieldId") or m.get("FD_ID")

        graph.add_node(LineageNode(
            id=f"metric:{m_id}",
            name=m_code,
            nodeType=NodeType.METRIC,
            metadata=m,
        ))

        # Edge from base table/field to metric
        if base_fld:
            graph.add_edge(LineageEdge(
                id=f"e:fld:{base_fld}->metric:{m_id}",
                sourceId=f"fld:{base_fld}",
                targetId=f"metric:{m_id}",
                edgeType=EdgeType.AGGREGATE,
            ))
        elif base_tbl:
            graph.add_edge(LineageEdge(
                id=f"e:tbl:{base_tbl}->metric:{m_id}",
                sourceId=f"tbl:{base_tbl}",
                targetId=f"metric:{m_id}",
                edgeType=EdgeType.AGGREGATE,
            ))

    return graph
