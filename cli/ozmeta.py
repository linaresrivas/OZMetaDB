#!/usr/bin/env python3
"""OZMetaDB CLI - Meta Control Plane Command Interface

Commands:
  validate    Validate a metadata snapshot
  generate    Generate artifacts from snapshot
  export      Export metadata from database
  compile     Compile DDL for target platform
  metrics     Compile and manage metrics/KPIs
  jobs        Compile jobs for target scheduler
  lineage     Query and visualize data lineage
  migrate     Run migrations
  console     Launch interactive console (TUI)
"""
from __future__ import annotations
import argparse, subprocess, sys, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def run(cmd, cwd=None):
    return subprocess.run(cmd, text=True, cwd=cwd).returncode


def cmd_metrics(args) -> int:
    """Compile metrics to target platform expressions."""
    snap = json.loads(Path(args.snapshot).read_text())

    sys.path.insert(0, str(ROOT))
    from compiler.metrics import MetricsCompiler

    compiler = MetricsCompiler(target=args.target)
    metrics = snap.get("objects", {}).get("metrics", {})
    metric_list = metrics.get("metrics", []) if isinstance(metrics, dict) else []

    results = []
    for m in metric_list:
        code = m.get("code") or m.get("MT_Code", "Unknown")
        formula = m.get("formula") or m.get("MT_Formula")
        if formula:
            try:
                compiled = compiler.compile(formula)
                results.append({"code": code, "formula": formula, "compiled": compiled})
            except Exception as e:
                results.append({"code": code, "formula": formula, "error": str(e)})

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(results, indent=2))
    print(f"Compiled {len(results)} metrics to {args.out}")
    return 0


def cmd_jobs(args) -> int:
    """Compile jobs to target scheduler format."""
    snap = json.loads(Path(args.snapshot).read_text())

    sys.path.insert(0, str(ROOT))
    from compiler.jobs import compile_job

    jobs = snap.get("objects", {}).get("jobs", {})
    job_list = jobs.get("jobs", []) if isinstance(jobs, dict) else []

    outputs = []
    for job in job_list:
        try:
            compiled = compile_job(job, args.scheduler)
            outputs.append(f"# Job: {job.get('code', 'unknown')}\n{compiled}")
        except Exception as e:
            outputs.append(f"# Job: {job.get('code', 'unknown')} - Error: {e}")

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n\n".join(outputs))
    print(f"Compiled {len(job_list)} jobs to {args.out} for {args.scheduler}")
    return 0


def cmd_lineage(args) -> int:
    """Query and visualize data lineage."""
    snap = json.loads(Path(args.snapshot).read_text())

    sys.path.insert(0, str(ROOT))
    from compiler.lineage import (
        build_lineage_graph, to_mermaid, to_dot, to_json, to_d3_graph,
        get_upstream, get_downstream, get_impact_analysis
    )

    graph = build_lineage_graph(snap)

    if args.action == "export":
        fmt = args.format or "json"
        if fmt == "mermaid":
            output = to_mermaid(graph, title="Data Lineage")
        elif fmt == "dot":
            output = to_dot(graph, title="Data Lineage")
        elif fmt == "d3":
            output = to_d3_graph(graph)
        else:
            output = to_json(graph, include_metadata=True)

        out_path = Path(args.out)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(output)
        print(f"Exported lineage ({fmt}) to {args.out}")
        print(f"  Nodes: {len(graph.nodes)}, Edges: {len(graph.edges)}")

    elif args.action == "upstream":
        if not args.node:
            print("Error: --node required for upstream query")
            return 1
        result = get_upstream(graph, args.node)
        print(f"Upstream of {args.node}:")
        for n in result.nodes:
            print(f"  {n.nodeType.value}: {n.full_path}")

    elif args.action == "downstream":
        if not args.node:
            print("Error: --node required for downstream query")
            return 1
        result = get_downstream(graph, args.node)
        print(f"Downstream of {args.node}:")
        for n in result.nodes:
            print(f"  {n.nodeType.value}: {n.full_path}")

    elif args.action == "impact":
        if not args.node:
            print("Error: --node required for impact analysis")
            return 1
        impact = get_impact_analysis(graph, args.node, args.change_type or "modify")
        print(f"Impact Analysis for {args.node}:")
        print(f"  Total Impacted: {impact.totalImpacted}")
        print(f"  By Type: {impact.impactedByType}")
        print(f"  Critical Path: {' -> '.join(impact.criticalPath)}")
        print("  Recommendations:")
        for r in impact.recommendations:
            print(f"    {r}")
    else:
        # Stats
        stats = graph.get_stats()
        print("Lineage Graph Statistics:")
        print(f"  Nodes: {stats['nodeCount']}")
        print(f"  Edges: {stats['edgeCount']}")
        print(f"  Root nodes: {stats['rootNodes']}")
        print(f"  Terminal nodes: {stats['terminalNodes']}")
        print("  By type:")
        for t, c in stats['nodesByType'].items():
            print(f"    {t}: {c}")

    return 0


def cmd_migrate(args) -> int:
    """Run database migrations."""
    sys.path.insert(0, str(ROOT))
    from migrate.cli import main as migrate_main

    # Build argv for migrate CLI
    migrate_args = [args.action]
    if hasattr(args, 'plan') and args.plan:
        migrate_args.extend(['--plan', args.plan])
    if hasattr(args, 'target') and args.target:
        migrate_args.extend(['--target', args.target])
    if hasattr(args, 'connection') and args.connection:
        migrate_args.extend(['--connection', args.connection])
    if hasattr(args, 'checkpoint') and args.checkpoint:
        migrate_args.extend(['--checkpoint', args.checkpoint])

    old_argv = sys.argv
    sys.argv = ['migrate'] + migrate_args
    try:
        return migrate_main()
    finally:
        sys.argv = old_argv


def cmd_console(args) -> int:
    """Launch interactive TUI console."""
    sys.path.insert(0, str(ROOT))

    try:
        from ui.console import run_console
        return run_console(args.snapshot if hasattr(args, 'snapshot') else None)
    except ImportError as e:
        print(f"Console not available: {e}")
        print("Run: pip install textual rich")
        return 1


def main() -> int:
    ap = argparse.ArgumentParser(
        prog="ozmeta",
        description="OZMetaDB - Meta Control Plane CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  ozmeta validate --snapshot meta.json
  ozmeta generate --snapshot meta.json --out ./generated
  ozmeta compile --snapshot meta.json --target snowflake --out ./ddl
  ozmeta metrics --snapshot meta.json --target dax --out metrics.json
  ozmeta jobs --snapshot meta.json --scheduler airflow --out dags.py
  ozmeta lineage --snapshot meta.json --action export --format mermaid --out lineage.md
  ozmeta lineage --snapshot meta.json --action impact --node "fld:123"
  ozmeta console --snapshot meta.json
"""
    )
    sub = ap.add_subparsers(dest="cmd", required=True)

    # validate
    v = sub.add_parser("validate", help="Validate metadata snapshot")
    v.add_argument("--snapshot", required=True, help="Path to snapshot JSON")

    # generate
    g = sub.add_parser("generate", help="Generate artifacts from snapshot")
    g.add_argument("--snapshot", required=True, help="Path to snapshot JSON")
    g.add_argument("--out", required=True, help="Output directory")
    g.add_argument("--scheduler", default="airflow", help="Job scheduler target")

    # export
    e = sub.add_parser("export", help="Export metadata from database")
    e.add_argument("--out", required=True, help="Output file path")
    e.add_argument("--client", default="SFO", help="Client code")
    e.add_argument("--project", default="CaseMgmt", help="Project code")
    e.add_argument("--provider", default="stub", help="DB provider")
    e.add_argument("--connection", default="", help="Connection string")

    # compile
    c = sub.add_parser("compile", help="Compile DDL for target platform")
    c.add_argument("--snapshot", required=True, help="Path to snapshot JSON")
    c.add_argument("--target", required=True,
                   choices=["postgres", "bigquery", "redshift", "snowflake", "spark"],
                   help="Target platform")
    c.add_argument("--out", required=True, help="Output directory")
    c.add_argument("--options", default="{}", help="JSON options")

    # metrics
    m = sub.add_parser("metrics", help="Compile metrics/KPIs")
    m.add_argument("--snapshot", required=True, help="Path to snapshot JSON")
    m.add_argument("--target", default="tsql",
                   choices=["tsql", "dax", "spark", "python"],
                   help="Target expression language")
    m.add_argument("--out", required=True, help="Output file path")

    # jobs
    j = sub.add_parser("jobs", help="Compile jobs for scheduler")
    j.add_argument("--snapshot", required=True, help="Path to snapshot JSON")
    j.add_argument("--scheduler", default="airflow",
                   choices=["airflow", "prefect", "dagster", "cron", "adf",
                           "databricks", "step_functions", "fabric"],
                   help="Target scheduler")
    j.add_argument("--out", required=True, help="Output file path")

    # lineage
    l = sub.add_parser("lineage", help="Query and visualize lineage")
    l.add_argument("--snapshot", required=True, help="Path to snapshot JSON")
    l.add_argument("--action", default="stats",
                   choices=["stats", "export", "upstream", "downstream", "impact"],
                   help="Lineage action")
    l.add_argument("--node", help="Node ID for queries")
    l.add_argument("--format", choices=["json", "mermaid", "dot", "d3"],
                   help="Export format")
    l.add_argument("--out", help="Output file for export")
    l.add_argument("--change-type", dest="change_type",
                   choices=["modify", "delete", "rename", "type_change"],
                   help="Change type for impact analysis")

    # migrate
    mg = sub.add_parser("migrate", help="Run database migrations")
    mg.add_argument("action", choices=["plan", "run", "status", "rollback"],
                    help="Migration action")
    mg.add_argument("--plan", help="Migration plan file")
    mg.add_argument("--target", help="Target platform")
    mg.add_argument("--connection", help="Connection string")
    mg.add_argument("--checkpoint", help="Checkpoint ID")

    # console
    con = sub.add_parser("console", help="Launch interactive TUI console")
    con.add_argument("--snapshot", help="Path to snapshot JSON")

    args = ap.parse_args()

    if args.cmd == "validate":
        return run([sys.executable, str(ROOT/"scripts"/"validate_snapshot.py"), args.snapshot])

    if args.cmd == "generate":
        cmd_args = [sys.executable, str(ROOT/"generator"/"src"/"generate_from_snapshot.py"),
                    "--snapshot", args.snapshot, "--out", args.out,
                    "--scheduler", args.scheduler]
        return run(cmd_args)

    if args.cmd == "export":
        return run([sys.executable, str(ROOT/"generator"/"src"/"export_from_db.py"),
                    "--out", args.out, "--client", args.client,
                    "--project", args.project, "--provider", args.provider,
                    "--connection", args.connection])

    if args.cmd == "compile":
        return run([sys.executable, "-m", "compiler.compile",
                    "--snapshot", args.snapshot, "--target", args.target,
                    "--out", args.out, "--options", args.options],
                   cwd=str(ROOT))

    if args.cmd == "metrics":
        return cmd_metrics(args)

    if args.cmd == "jobs":
        return cmd_jobs(args)

    if args.cmd == "lineage":
        return cmd_lineage(args)

    if args.cmd == "migrate":
        return cmd_migrate(args)

    if args.cmd == "console":
        return cmd_console(args)

    return 2


if __name__ == "__main__":
    raise SystemExit(main())
