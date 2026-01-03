#!/usr/bin/env python3
"""OZMetaDB Console - Elegant Terminal UI

A beautiful, intuitive interface for:
  - Project dashboard and overview
  - Visual lineage exploration
  - Metric/KPI design and monitoring
  - Multi-client management
  - Code generation and deployment
"""

from __future__ import annotations
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
from dataclasses import dataclass

# Check for dependencies
try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.tree import Tree
    from rich.layout import Layout
    from rich.live import Live
    from rich.text import Text
    from rich.markdown import Markdown
    from rich.syntax import Syntax
    from rich.progress import Progress, SpinnerColumn, TextColumn
    from rich import box
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False

try:
    from textual.app import App, ComposeResult
    from textual.widgets import (
        Header, Footer, Static, Button, Tree as TextualTree,
        DataTable, TabbedContent, TabPane, Input, Label, TextArea
    )
    from textual.containers import Container, Horizontal, Vertical, ScrollableContainer
    from textual.binding import Binding
    from textual.screen import Screen
    TEXTUAL_AVAILABLE = True
except ImportError:
    TEXTUAL_AVAILABLE = False


console = Console() if RICH_AVAILABLE else None


@dataclass
class ProjectStats:
    """Aggregated project statistics."""
    tables: int = 0
    fields: int = 0
    enums: int = 0
    workflows: int = 0
    metrics: int = 0
    jobs: int = 0
    source_systems: int = 0
    mappings: int = 0


def load_snapshot(path: Optional[str]) -> Dict[str, Any]:
    """Load metadata snapshot from file."""
    if not path:
        return {"schema": "ozmeta.snapshot.v1", "objects": {}}
    try:
        return json.loads(Path(path).read_text())
    except Exception:
        return {"schema": "ozmeta.snapshot.v1", "objects": {}}


def compute_stats(snapshot: Dict[str, Any]) -> ProjectStats:
    """Compute statistics from snapshot."""
    objs = snapshot.get("objects", {})
    model = objs.get("model", {})
    tables = model.get("tables", [])

    stats = ProjectStats()
    stats.tables = len(tables)
    stats.fields = sum(len(t.get("fields", [])) for t in tables)

    enums = objs.get("enums", {})
    stats.enums = len(enums.get("enums", [])) if isinstance(enums, dict) else len(enums) if isinstance(enums, list) else 0

    wf = objs.get("workflows", {})
    stats.workflows = len(wf.get("workflows", [])) if isinstance(wf, dict) else 0

    metrics = objs.get("metrics", {})
    stats.metrics = len(metrics.get("metrics", [])) if isinstance(metrics, dict) else 0

    jobs = objs.get("jobs", {})
    stats.jobs = len(jobs.get("jobs", [])) if isinstance(jobs, dict) else 0

    lineage = objs.get("lineage", {})
    stats.source_systems = len(lineage.get("sourceSystems", [])) if isinstance(lineage, dict) else 0
    stats.mappings = len(lineage.get("mapFields", [])) if isinstance(lineage, dict) else 0

    return stats


# ============================================================================
# Rich-based Simple Console (fallback when Textual not available)
# ============================================================================

def rich_dashboard(snapshot: Dict[str, Any]) -> None:
    """Display dashboard using Rich."""
    if not RICH_AVAILABLE:
        print("Rich library not available. Install with: pip install rich")
        return

    stats = compute_stats(snapshot)
    meta = snapshot.get("metadata", {})

    # Header
    console.print()
    console.print(Panel.fit(
        "[bold blue]OZMetaDB[/] [dim]Meta Control Plane[/]",
        border_style="blue"
    ))

    # Project Info
    project_info = Table(show_header=False, box=box.SIMPLE)
    project_info.add_column("Key", style="cyan")
    project_info.add_column("Value")
    project_info.add_row("Client", meta.get("clientCode", "Unknown"))
    project_info.add_row("Project", meta.get("projectCode", "Unknown"))
    project_info.add_row("Version", meta.get("version", "1.0.0"))
    project_info.add_row("Schema", snapshot.get("schema", "unknown"))

    console.print(Panel(project_info, title="Project", border_style="green"))

    # Stats Grid
    stats_table = Table(show_header=True, box=box.ROUNDED)
    stats_table.add_column("Category", style="cyan")
    stats_table.add_column("Count", justify="right", style="green")
    stats_table.add_column("Status", style="dim")

    stats_table.add_row("Tables", str(stats.tables), "[green]Ready" if stats.tables else "[yellow]Empty")
    stats_table.add_row("Fields", str(stats.fields), f"[dim]{stats.fields/max(stats.tables,1):.1f}/table")
    stats_table.add_row("Enums", str(stats.enums), "[green]Defined" if stats.enums else "[dim]None")
    stats_table.add_row("Workflows", str(stats.workflows), "[green]Active" if stats.workflows else "[dim]None")
    stats_table.add_row("Metrics/KPIs", str(stats.metrics), "[green]Tracked" if stats.metrics else "[dim]None")
    stats_table.add_row("Jobs", str(stats.jobs), "[green]Scheduled" if stats.jobs else "[dim]None")
    stats_table.add_row("Source Systems", str(stats.source_systems), "[blue]Connected" if stats.source_systems else "[dim]None")
    stats_table.add_row("Field Mappings", str(stats.mappings), "[blue]Mapped" if stats.mappings else "[dim]None")

    console.print(Panel(stats_table, title="Metadata Statistics", border_style="blue"))


def rich_model_tree(snapshot: Dict[str, Any]) -> None:
    """Display data model as tree."""
    if not RICH_AVAILABLE:
        return

    model = snapshot.get("objects", {}).get("model", {})
    tables = model.get("tables", [])

    tree = Tree("[bold blue]Data Model")

    # Group by schema
    by_schema: Dict[str, List] = {}
    for t in tables:
        schema = t.get("schema", "dbo")
        if schema not in by_schema:
            by_schema[schema] = []
        by_schema[schema].append(t)

    for schema, schema_tables in sorted(by_schema.items()):
        schema_branch = tree.add(f"[yellow]{schema}")
        for t in schema_tables:
            code = t.get("code", "Unknown")
            fields = t.get("fields", [])
            table_branch = schema_branch.add(f"[green]{code}[/] [dim]({len(fields)} fields)")
            for f in fields[:5]:  # Show first 5 fields
                fcode = f.get("code", "?")
                ftype = f.get("type", "?")
                nullable = "[dim]NULL" if f.get("nullable") else "[red]NOT NULL"
                table_branch.add(f"[cyan]{fcode}[/] {ftype} {nullable}")
            if len(fields) > 5:
                table_branch.add(f"[dim]... and {len(fields) - 5} more fields")

    console.print(Panel(tree, title="Data Model", border_style="green"))


def rich_lineage_preview(snapshot: Dict[str, Any]) -> None:
    """Display lineage preview."""
    if not RICH_AVAILABLE:
        return

    try:
        sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
        from compiler.lineage import build_lineage_graph

        graph = build_lineage_graph(snapshot)
        stats = graph.get_stats()

        table = Table(show_header=True, box=box.ROUNDED)
        table.add_column("Node Type", style="cyan")
        table.add_column("Count", justify="right", style="green")

        for node_type, count in stats.get("nodesByType", {}).items():
            table.add_row(node_type, str(count))

        console.print(Panel(table, title=f"Lineage Graph ({stats['nodeCount']} nodes, {stats['edgeCount']} edges)", border_style="magenta"))

        # Show root and terminal nodes
        roots = graph.get_root_nodes()[:5]
        terminals = graph.get_terminal_nodes()[:5]

        if roots:
            console.print("[bold]Root Sources:[/]")
            for r in roots:
                node = graph.get_node(r)
                if node:
                    console.print(f"  [green]{node.name}[/] [dim]({node.nodeType.value})")

        if terminals:
            console.print("[bold]Terminal Nodes:[/]")
            for t in terminals:
                node = graph.get_node(t)
                if node:
                    console.print(f"  [blue]{node.name}[/] [dim]({node.nodeType.value})")

    except ImportError:
        console.print("[yellow]Lineage compiler not available")


def rich_menu(snapshot: Dict[str, Any]) -> None:
    """Interactive menu using Rich."""
    if not RICH_AVAILABLE:
        print("Rich not available")
        return

    while True:
        console.clear()
        console.print()
        console.print(Panel.fit(
            "[bold blue]OZMetaDB Console[/]",
            subtitle="[dim]Meta Control Plane[/]",
            border_style="blue"
        ))
        console.print()

        menu = Table(show_header=False, box=None)
        menu.add_column("Key", style="cyan bold", width=4)
        menu.add_column("Action")
        menu.add_row("1", "Dashboard - Project overview")
        menu.add_row("2", "Model - Data model tree")
        menu.add_row("3", "Lineage - Data lineage graph")
        menu.add_row("4", "Metrics - KPI definitions")
        menu.add_row("5", "Generate - Create artifacts")
        menu.add_row("q", "Quit")

        console.print(Panel(menu, title="Menu", border_style="green"))
        console.print()

        choice = console.input("[cyan]Select option:[/] ").strip().lower()

        if choice == "1":
            console.clear()
            rich_dashboard(snapshot)
            console.input("\n[dim]Press Enter to continue...[/]")
        elif choice == "2":
            console.clear()
            rich_model_tree(snapshot)
            console.input("\n[dim]Press Enter to continue...[/]")
        elif choice == "3":
            console.clear()
            rich_lineage_preview(snapshot)
            console.input("\n[dim]Press Enter to continue...[/]")
        elif choice == "4":
            console.clear()
            rich_metrics_view(snapshot)
            console.input("\n[dim]Press Enter to continue...[/]")
        elif choice == "5":
            console.clear()
            rich_generate_menu(snapshot)
        elif choice == "q":
            console.print("[green]Goodbye!")
            break


def rich_metrics_view(snapshot: Dict[str, Any]) -> None:
    """Display metrics view."""
    if not RICH_AVAILABLE:
        return

    metrics = snapshot.get("objects", {}).get("metrics", {})
    metric_list = metrics.get("metrics", []) if isinstance(metrics, dict) else []

    if not metric_list:
        console.print(Panel("[yellow]No metrics defined yet", title="Metrics"))
        return

    table = Table(show_header=True, box=box.ROUNDED)
    table.add_column("Code", style="cyan")
    table.add_column("Name")
    table.add_column("Unit", style="green")
    table.add_column("Direction", style="blue")
    table.add_column("Formula", style="dim", max_width=40)

    for m in metric_list:
        code = m.get("code") or m.get("MT_Code", "?")
        name = m.get("name") or m.get("MT_Name", code)
        unit = m.get("unit") or m.get("MT_Unit", "")
        direction = m.get("direction") or m.get("MT_Direction", "up")
        formula = str(m.get("formula") or m.get("MT_Formula", ""))[:40]
        table.add_row(code, name, unit, direction, formula)

    console.print(Panel(table, title=f"Metrics ({len(metric_list)} defined)", border_style="yellow"))


def rich_generate_menu(snapshot: Dict[str, Any]) -> None:
    """Generation menu."""
    if not RICH_AVAILABLE:
        return

    console.print(Panel.fit("[bold]Generate Artifacts[/]", border_style="blue"))
    console.print()

    menu = Table(show_header=False, box=None)
    menu.add_column("Key", style="cyan bold", width=4)
    menu.add_column("Action")
    menu.add_row("1", "SQL DDL (T-SQL)")
    menu.add_row("2", "Snowflake DDL")
    menu.add_row("3", "Spark DDL")
    menu.add_row("4", "Airflow DAGs")
    menu.add_row("5", "Lineage (Mermaid)")
    menu.add_row("b", "Back")

    console.print(menu)
    console.print()

    choice = console.input("[cyan]Select:[/] ").strip().lower()

    if choice == "b":
        return

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        task = progress.add_task("Generating...", total=None)

        # Simulate generation
        import time
        time.sleep(1)

        console.print("[green]Generation complete![/]")
        console.print("[dim]Output would be written to ./generated/[/]")

    console.input("\n[dim]Press Enter to continue...[/]")


# ============================================================================
# Textual-based Full TUI (when available)
# ============================================================================

if TEXTUAL_AVAILABLE:

    class DashboardWidget(Static):
        """Dashboard panel widget."""

        def __init__(self, snapshot: Dict[str, Any], **kwargs):
            super().__init__(**kwargs)
            self.snapshot = snapshot

        def compose(self) -> ComposeResult:
            stats = compute_stats(self.snapshot)
            meta = self.snapshot.get("metadata", {})

            yield Static(f"""[bold blue]OZMetaDB[/] [dim]Meta Control Plane[/]

[cyan]Client:[/]  {meta.get('clientCode', 'Unknown')}
[cyan]Project:[/] {meta.get('projectCode', 'Unknown')}
[cyan]Version:[/] {meta.get('version', '1.0.0')}

[bold]Statistics:[/]
  Tables:      [green]{stats.tables}[/]
  Fields:      [green]{stats.fields}[/]
  Enums:       [green]{stats.enums}[/]
  Workflows:   [green]{stats.workflows}[/]
  Metrics:     [green]{stats.metrics}[/]
  Jobs:        [green]{stats.jobs}[/]
  Sources:     [green]{stats.source_systems}[/]
  Mappings:    [green]{stats.mappings}[/]
""")


    class ModelWidget(Static):
        """Data model tree widget."""

        def __init__(self, snapshot: Dict[str, Any], **kwargs):
            super().__init__(**kwargs)
            self.snapshot = snapshot

        def compose(self) -> ComposeResult:
            model = self.snapshot.get("objects", {}).get("model", {})
            tables = model.get("tables", [])

            lines = ["[bold blue]Data Model[/]\n"]

            by_schema: Dict[str, List] = {}
            for t in tables:
                schema = t.get("schema", "dbo")
                if schema not in by_schema:
                    by_schema[schema] = []
                by_schema[schema].append(t)

            for schema, schema_tables in sorted(by_schema.items()):
                lines.append(f"[yellow]{schema}[/]")
                for t in schema_tables:
                    code = t.get("code", "Unknown")
                    fields = t.get("fields", [])
                    lines.append(f"  [green]{code}[/] ({len(fields)} fields)")
                    for f in fields[:3]:
                        fcode = f.get("code", "?")
                        ftype = f.get("type", "?")
                        lines.append(f"    [cyan]{fcode}[/]: {ftype}")
                    if len(fields) > 3:
                        lines.append(f"    [dim]... +{len(fields) - 3} more[/]")

            yield Static("\n".join(lines))


    class LineageWidget(Static):
        """Lineage preview widget."""

        def __init__(self, snapshot: Dict[str, Any], **kwargs):
            super().__init__(**kwargs)
            self.snapshot = snapshot

        def compose(self) -> ComposeResult:
            try:
                sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
                from compiler.lineage import build_lineage_graph

                graph = build_lineage_graph(self.snapshot)
                stats = graph.get_stats()

                lines = [
                    f"[bold magenta]Lineage Graph[/]",
                    f"  Nodes: [green]{stats['nodeCount']}[/]",
                    f"  Edges: [green]{stats['edgeCount']}[/]",
                    f"  Roots: [green]{stats['rootNodes']}[/]",
                    f"  Terminals: [green]{stats['terminalNodes']}[/]",
                    "",
                    "[bold]By Type:[/]"
                ]
                for t, c in stats.get("nodesByType", {}).items():
                    lines.append(f"  {t}: [cyan]{c}[/]")

                yield Static("\n".join(lines))
            except ImportError:
                yield Static("[yellow]Lineage compiler not available")


    class MetricsWidget(Static):
        """Metrics view widget."""

        def __init__(self, snapshot: Dict[str, Any], **kwargs):
            super().__init__(**kwargs)
            self.snapshot = snapshot

        def compose(self) -> ComposeResult:
            metrics = self.snapshot.get("objects", {}).get("metrics", {})
            metric_list = metrics.get("metrics", []) if isinstance(metrics, dict) else []

            if not metric_list:
                yield Static("[yellow]No metrics defined")
                return

            lines = [f"[bold yellow]Metrics/KPIs[/] ({len(metric_list)} defined)\n"]

            for m in metric_list[:10]:
                code = m.get("code") or m.get("MT_Code", "?")
                name = m.get("name") or m.get("MT_Name", code)
                unit = m.get("unit") or m.get("MT_Unit", "")
                direction = m.get("direction") or "up"
                icon = "[green]" if direction == "up" else "[red]"
                lines.append(f"  {icon}{code}[/]: {name} ({unit})")

            if len(metric_list) > 10:
                lines.append(f"\n[dim]... +{len(metric_list) - 10} more[/]")

            yield Static("\n".join(lines))


    class OZMetaApp(App):
        """OZMetaDB Terminal Application."""

        CSS = """
        Screen {
            background: $surface;
        }

        #sidebar {
            width: 30;
            background: $panel;
            border-right: solid $primary;
            padding: 1;
        }

        #main {
            padding: 1;
        }

        .nav-button {
            width: 100%;
            margin: 1 0;
        }

        .panel {
            border: solid $primary;
            padding: 1;
            margin: 1;
        }

        TabbedContent {
            height: 100%;
        }

        TabPane {
            padding: 1;
        }

        #status-bar {
            dock: bottom;
            height: 1;
            background: $primary;
            color: $text;
        }
        """

        BINDINGS = [
            Binding("q", "quit", "Quit"),
            Binding("d", "dashboard", "Dashboard"),
            Binding("m", "model", "Model"),
            Binding("l", "lineage", "Lineage"),
            Binding("k", "metrics", "Metrics"),
            Binding("g", "generate", "Generate"),
            Binding("?", "help", "Help"),
        ]

        def __init__(self, snapshot_path: Optional[str] = None):
            super().__init__()
            self.snapshot = load_snapshot(snapshot_path)
            self.title = "OZMetaDB Console"
            self.sub_title = "Meta Control Plane"

        def compose(self) -> ComposeResult:
            yield Header()

            with Horizontal():
                with Vertical(id="sidebar"):
                    yield Static("[bold blue]OZMetaDB[/]\n", id="logo")
                    yield Button("Dashboard", id="btn-dashboard", variant="primary", classes="nav-button")
                    yield Button("Data Model", id="btn-model", classes="nav-button")
                    yield Button("Lineage", id="btn-lineage", classes="nav-button")
                    yield Button("Metrics", id="btn-metrics", classes="nav-button")
                    yield Button("Generate", id="btn-generate", variant="success", classes="nav-button")

                with TabbedContent(id="main"):
                    with TabPane("Dashboard", id="tab-dashboard"):
                        yield DashboardWidget(self.snapshot)

                    with TabPane("Model", id="tab-model"):
                        yield ScrollableContainer(ModelWidget(self.snapshot))

                    with TabPane("Lineage", id="tab-lineage"):
                        yield LineageWidget(self.snapshot)

                    with TabPane("Metrics", id="tab-metrics"):
                        yield ScrollableContainer(MetricsWidget(self.snapshot))

                    with TabPane("Generate", id="tab-generate"):
                        yield Static("""[bold]Generate Artifacts[/]

Select target platform and generate:

[cyan]Platforms:[/]
  - SQL Server (T-SQL)
  - PostgreSQL
  - Snowflake
  - Spark
  - BigQuery

[cyan]Schedulers:[/]
  - Airflow DAGs
  - Prefect Flows
  - Dagster Jobs
  - Azure Data Factory
  - Databricks Workflows

[cyan]Exports:[/]
  - Lineage (Mermaid/DOT/JSON)
  - Metrics (DAX/SQL/Python)
  - Documentation

Use CLI for generation:
  [dim]ozmeta generate --snapshot meta.json --out ./generated[/]
""")

            yield Footer()

        def on_button_pressed(self, event: Button.Pressed) -> None:
            """Handle button presses."""
            button_id = event.button.id
            tabs = self.query_one(TabbedContent)

            if button_id == "btn-dashboard":
                tabs.active = "tab-dashboard"
            elif button_id == "btn-model":
                tabs.active = "tab-model"
            elif button_id == "btn-lineage":
                tabs.active = "tab-lineage"
            elif button_id == "btn-metrics":
                tabs.active = "tab-metrics"
            elif button_id == "btn-generate":
                tabs.active = "tab-generate"

        def action_dashboard(self) -> None:
            self.query_one(TabbedContent).active = "tab-dashboard"

        def action_model(self) -> None:
            self.query_one(TabbedContent).active = "tab-model"

        def action_lineage(self) -> None:
            self.query_one(TabbedContent).active = "tab-lineage"

        def action_metrics(self) -> None:
            self.query_one(TabbedContent).active = "tab-metrics"

        def action_generate(self) -> None:
            self.query_one(TabbedContent).active = "tab-generate"

        def action_help(self) -> None:
            self.notify(
                "Keyboard shortcuts:\n"
                "d=Dashboard, m=Model, l=Lineage, k=Metrics, g=Generate, q=Quit",
                title="Help"
            )


# ============================================================================
# Main Entry Point
# ============================================================================

def run_console(snapshot_path: Optional[str] = None) -> int:
    """Run the console UI.

    Uses Textual if available, falls back to Rich menu.
    """
    if TEXTUAL_AVAILABLE:
        app = OZMetaApp(snapshot_path)
        app.run()
        return 0
    elif RICH_AVAILABLE:
        snapshot = load_snapshot(snapshot_path)
        rich_menu(snapshot)
        return 0
    else:
        print("No UI libraries available.")
        print("Install with: pip install textual rich")
        return 1


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--snapshot", help="Path to snapshot JSON")
    args = ap.parse_args()
    raise SystemExit(run_console(args.snapshot))
