"""Lineage Query - query and analyze lineage graphs.

Steps:
  1.1 Upstream/downstream traversal
  1.2 Impact analysis
  1.3 Root/terminal detection
  1.4 Path finding
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional, Set, Tuple
from dataclasses import dataclass, field
from .graph import LineageGraph, LineageNode, LineageEdge, NodeType, EdgeType


@dataclass
class ImpactAnalysis:
    """Result of impact analysis for a node."""
    nodeId: str
    nodeName: str
    nodeType: NodeType
    impactedNodes: List[Dict[str, Any]]
    impactedByType: Dict[str, int]
    totalImpacted: int
    criticalPath: List[str]
    recommendations: List[str]


@dataclass
class LineageQueryResult:
    """Result of a lineage query."""
    queryType: str
    startNode: str
    nodes: List[LineageNode]
    edges: List[LineageEdge]
    paths: List[List[str]] = field(default_factory=list)
    stats: Dict[str, Any] = field(default_factory=dict)


def get_upstream(
    graph: LineageGraph,
    node_id: str,
    max_depth: int = 100,
    node_types: Optional[List[NodeType]] = None
) -> LineageQueryResult:
    """Get all upstream nodes (data sources).

    Steps:
      1.1 Traverse backward from node
      1.2 Filter by node types if specified
      1.3 Collect edges on path
    """
    upstream_ids = graph.traverse_upstream(node_id, max_depth)

    # Filter by type if specified
    if node_types:
        upstream_ids = {
            nid for nid in upstream_ids
            if graph.get_node(nid) and graph.get_node(nid).nodeType in node_types
        }

    # Collect nodes and edges
    nodes = [graph.get_node(nid) for nid in upstream_ids if graph.get_node(nid)]
    edges = [
        e for e in graph.edges
        if e.targetId in upstream_ids or e.targetId == node_id
        if e.sourceId in upstream_ids or e.sourceId == node_id
    ]

    return LineageQueryResult(
        queryType="upstream",
        startNode=node_id,
        nodes=nodes,
        edges=edges,
        stats={
            "depth": max_depth,
            "nodeCount": len(nodes),
            "edgeCount": len(edges),
        },
    )


def get_downstream(
    graph: LineageGraph,
    node_id: str,
    max_depth: int = 100,
    node_types: Optional[List[NodeType]] = None
) -> LineageQueryResult:
    """Get all downstream nodes (consumers).

    Steps:
      1.1 Traverse forward from node
      1.2 Filter by node types if specified
      1.3 Collect edges on path
    """
    downstream_ids = graph.traverse_downstream(node_id, max_depth)

    # Filter by type if specified
    if node_types:
        downstream_ids = {
            nid for nid in downstream_ids
            if graph.get_node(nid) and graph.get_node(nid).nodeType in node_types
        }

    # Collect nodes and edges
    nodes = [graph.get_node(nid) for nid in downstream_ids if graph.get_node(nid)]
    edges = [
        e for e in graph.edges
        if e.sourceId in downstream_ids or e.sourceId == node_id
        if e.targetId in downstream_ids or e.targetId == node_id
    ]

    return LineageQueryResult(
        queryType="downstream",
        startNode=node_id,
        nodes=nodes,
        edges=edges,
        stats={
            "depth": max_depth,
            "nodeCount": len(nodes),
            "edgeCount": len(edges),
        },
    )


def get_impact_analysis(
    graph: LineageGraph,
    node_id: str,
    change_type: str = "modify"
) -> ImpactAnalysis:
    """Analyze impact of changing a node.

    Steps:
      1.1 Get all downstream nodes
      1.2 Categorize by type
      1.3 Find critical paths
      1.4 Generate recommendations
    """
    node = graph.get_node(node_id)
    if not node:
        return ImpactAnalysis(
            nodeId=node_id,
            nodeName="Unknown",
            nodeType=NodeType.CANONICAL_FIELD,
            impactedNodes=[],
            impactedByType={},
            totalImpacted=0,
            criticalPath=[],
            recommendations=["Node not found in lineage graph"],
        )

    downstream = graph.traverse_downstream(node_id)

    # Collect impacted nodes with details
    impacted: List[Dict[str, Any]] = []
    by_type: Dict[str, int] = {}

    for nid in downstream:
        n = graph.get_node(nid)
        if n:
            impacted.append({
                "id": n.id,
                "name": n.name,
                "type": n.nodeType.value,
                "path": n.full_path,
            })
            by_type[n.nodeType.value] = by_type.get(n.nodeType.value, 0) + 1

    # Find critical path (longest path from node)
    critical_path = _find_longest_path(graph, node_id, downstream)

    # Generate recommendations
    recommendations = _generate_recommendations(node, impacted, change_type)

    return ImpactAnalysis(
        nodeId=node_id,
        nodeName=node.name,
        nodeType=node.nodeType,
        impactedNodes=impacted,
        impactedByType=by_type,
        totalImpacted=len(impacted),
        criticalPath=critical_path,
        recommendations=recommendations,
    )


def _find_longest_path(
    graph: LineageGraph,
    start_id: str,
    downstream: Set[str]
) -> List[str]:
    """Find the longest path from start through downstream nodes."""
    if not downstream:
        return [start_id]

    longest: List[str] = [start_id]

    def dfs(current: str, path: List[str]) -> None:
        nonlocal longest
        if len(path) > len(longest):
            longest = path.copy()

        for next_id in graph.get_downstream(current):
            if next_id in downstream and next_id not in path:
                path.append(next_id)
                dfs(next_id, path)
                path.pop()

    dfs(start_id, [start_id])
    return longest


def _generate_recommendations(
    node: LineageNode,
    impacted: List[Dict[str, Any]],
    change_type: str
) -> List[str]:
    """Generate recommendations based on impact analysis."""
    recs = []

    if len(impacted) == 0:
        recs.append("No downstream dependencies found. Safe to modify.")
        return recs

    # Count by type
    metrics = sum(1 for i in impacted if i["type"] == "metric")
    reports = sum(1 for i in impacted if i["type"] == "report")
    tables = sum(1 for i in impacted if "table" in i["type"])

    if metrics > 0:
        recs.append(f"⚠️  {metrics} metric(s) depend on this field. Verify formula compatibility.")

    if reports > 0:
        recs.append(f"⚠️  {reports} report(s) may be affected. Notify BI team.")

    if tables > 3:
        recs.append(f"⚠️  {tables} downstream tables affected. Consider staged rollout.")

    if change_type == "delete":
        recs.append("🚫 Deleting this node will break all downstream dependencies!")
        recs.append("Consider deprecation period before removal.")

    if change_type == "rename":
        recs.append("Ensure all downstream mappings are updated atomically.")

    if change_type == "type_change":
        recs.append("Type changes may cause data truncation. Test with sample data.")

    if len(impacted) > 10:
        recs.append("📋 Create a migration plan before proceeding.")
        recs.append("Consider feature flag for gradual rollout.")

    return recs


def get_root_sources(
    graph: LineageGraph,
    node_id: str
) -> List[LineageNode]:
    """Get the ultimate source nodes for a given node.

    Steps:
      1.1 Traverse upstream to root
      1.2 Filter to source types only
    """
    upstream = graph.traverse_upstream(node_id)
    roots = []

    for nid in upstream:
        node = graph.get_node(nid)
        if node and node.nodeType in (
            NodeType.SOURCE_SYSTEM,
            NodeType.SOURCE_OBJECT,
            NodeType.SOURCE_FIELD,
        ):
            # Check if this is a true root (no upstream)
            if not graph.get_upstream(nid):
                roots.append(node)

    return roots


def get_terminal_sinks(
    graph: LineageGraph,
    node_id: str
) -> List[LineageNode]:
    """Get the terminal consumer nodes for a given node.

    Steps:
      1.1 Traverse downstream to terminals
      1.2 Filter to consumer types only
    """
    downstream = graph.traverse_downstream(node_id)
    terminals = []

    for nid in downstream:
        node = graph.get_node(nid)
        if node and not graph.get_downstream(nid):
            terminals.append(node)

    return terminals


def find_path(
    graph: LineageGraph,
    source_id: str,
    target_id: str
) -> Optional[List[LineageNode]]:
    """Find a path between two nodes.

    Steps:
      1.1 BFS to find path
      1.2 Return node objects on path
    """
    path_ids = graph.find_path(source_id, target_id)
    if not path_ids:
        return None

    return [graph.get_node(nid) for nid in path_ids if graph.get_node(nid)]


def get_data_quality_lineage(
    graph: LineageGraph,
    node_id: str
) -> Dict[str, Any]:
    """Get data quality propagation through lineage.

    Steps:
      1.1 Trace upstream sources
      1.2 Identify quality checkpoints
      1.3 Calculate quality score
    """
    upstream = get_upstream(graph, node_id)

    quality_points = []
    for node in upstream.nodes:
        if node.metadata.get("hasQualityChecks"):
            quality_points.append({
                "node": node.name,
                "type": node.nodeType.value,
                "checks": node.metadata.get("qualityChecks", []),
            })

    # Calculate coverage
    source_count = sum(1 for n in upstream.nodes if n.nodeType == NodeType.SOURCE_FIELD)
    checked_count = len(quality_points)

    return {
        "nodeId": node_id,
        "upstreamSources": source_count,
        "qualityCheckpoints": checked_count,
        "coverage": checked_count / max(source_count, 1),
        "checkpoints": quality_points,
    }
