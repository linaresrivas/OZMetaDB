"""Migration CLI - manage database migrations.

Commands:
  create   - Create a new migration plan
  list     - List all migrations
  show     - Show migration details
  advance  - Advance to next checkpoint
  fail     - Mark current checkpoint as failed
  rollback - Rollback migration

Usage:
  python -m migrate.cli create --project-id <id> --source <json> --target <json>
  python -m migrate.cli list
  python -m migrate.cli show <migration-id>
  python -m migrate.cli advance <migration-id>
"""

from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path
from .runner import (
    create_run, save_run, load_run, list_runs,
    advance_checkpoint, fail_checkpoint, rollback, get_progress
)


DEFAULT_OUT_DIR = "out/migrations"


def _load_json(x: str):
    """Load JSON from string or file path."""
    p = Path(x)
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return json.loads(x)


def _find_run(migration_id: str, out_dir: str) -> str:
    """Find migration file by ID."""
    p = Path(out_dir) / f"{migration_id}.json"
    if p.exists():
        return str(p)
    # Try partial match
    for f in Path(out_dir).glob("*.json"):
        if f.stem.startswith(migration_id):
            return str(f)
    raise FileNotFoundError(f"Migration not found: {migration_id}")


def cmd_create(args) -> int:
    """Create a new migration."""
    run = create_run(
        project_id=args.project_id,
        source=_load_json(args.source),
        target=_load_json(args.target),
        strategy=args.strategy,
        created_by=args.created_by,
    )
    path = save_run(args.out, run)
    print(f"Created migration: {run['migrationId']}")
    print(f"  File: {path}")
    print(f"  Strategy: {run['strategy']}")
    print(f"  Checkpoints: {len(run['checkpoints'])}")
    return 0


def cmd_list(args) -> int:
    """List all migrations."""
    runs = list_runs(args.out)
    if not runs:
        print("No migrations found.")
        return 0

    print(f"{'ID':<36}  {'Status':<12}  {'Progress':<8}  {'Created'}")
    print("-" * 80)
    for run in runs:
        progress = get_progress(run)
        print(f"{run['migrationId']:<36}  {run['status']:<12}  {progress['percent']:>6}%  {run['createdAtUTC']}")
    return 0


def cmd_show(args) -> int:
    """Show migration details."""
    path = _find_run(args.migration_id, args.out)
    run = load_run(path)
    progress = get_progress(run)

    print(f"Migration: {run['migrationId']}")
    print(f"  Project: {run['projectId']}")
    print(f"  Status: {run['status']}")
    print(f"  Strategy: {run['strategy']}")
    print(f"  Progress: {progress['percent']}%")
    print(f"  Created: {run['createdAtUTC']}")
    if run.get('createdBy'):
        print(f"  Created by: {run['createdBy']}")
    print()
    print("Checkpoints:")
    for cp in run.get("checkpoints", []):
        status_icon = {
            "Pending": "○",
            "InProgress": "◐",
            "Completed": "●",
            "Failed": "✗",
            "Skipped": "○",
        }.get(cp.get("status"), "?")
        duration = f" ({cp['durationSeconds']}s)" if cp.get("durationSeconds") else ""
        print(f"  {status_icon} {cp['code']}: {cp['status']}{duration}")
        if cp.get("errorMessage"):
            print(f"      Error: {cp['errorMessage']}")
        if cp.get("notes"):
            print(f"      Notes: {cp['notes']}")
    print()
    print("Source:")
    print(f"  {json.dumps(run.get('source', {}), indent=2)[:200]}...")
    print("Target:")
    print(f"  {json.dumps(run.get('target', {}), indent=2)[:200]}...")
    return 0


def cmd_advance(args) -> int:
    """Advance to next checkpoint."""
    path = _find_run(args.migration_id, args.out)
    run = load_run(path)

    progress_before = get_progress(run)
    current_before = progress_before.get("currentCheckpoint")

    run = advance_checkpoint(run, notes=args.notes)
    save_run(args.out, run)

    progress_after = get_progress(run)
    current_after = progress_after.get("currentCheckpoint")

    if current_before:
        print(f"Completed: {current_before}")
    if current_after:
        print(f"Started: {current_after}")
    else:
        print("Migration completed!")
    print(f"Progress: {progress_after['percent']}%")
    return 0


def cmd_fail(args) -> int:
    """Mark current checkpoint as failed."""
    path = _find_run(args.migration_id, args.out)
    run = load_run(path)

    run = fail_checkpoint(run, error=args.error)
    save_run(args.out, run)

    print(f"Marked as failed: {args.error}")
    return 0


def cmd_rollback(args) -> int:
    """Rollback migration."""
    path = _find_run(args.migration_id, args.out)
    run = load_run(path)

    try:
        run = rollback(run, reason=args.reason)
        save_run(args.out, run)
        print(f"Rolled back: {args.reason}")
        return 0
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


def main() -> int:
    ap = argparse.ArgumentParser(prog="migrate", description="OZMetaDB Migration CLI")
    ap.add_argument("--out", default=DEFAULT_OUT_DIR, help="Output directory for migration files")
    sub = ap.add_subparsers(dest="cmd", required=True)

    # create
    p_create = sub.add_parser("create", help="Create a new migration")
    p_create.add_argument("--project-id", required=True, help="Project ID")
    p_create.add_argument("--source", required=True, help="Source endpoint JSON (string or file)")
    p_create.add_argument("--target", required=True, help="Target endpoint JSON (string or file)")
    p_create.add_argument("--strategy", default="DualLive", choices=["DualLive", "BlueGreen", "Canary", "Offline"])
    p_create.add_argument("--created-by", help="Creator name/email")
    p_create.set_defaults(func=cmd_create)

    # list
    p_list = sub.add_parser("list", help="List all migrations")
    p_list.set_defaults(func=cmd_list)

    # show
    p_show = sub.add_parser("show", help="Show migration details")
    p_show.add_argument("migration_id", help="Migration ID (or prefix)")
    p_show.set_defaults(func=cmd_show)

    # advance
    p_advance = sub.add_parser("advance", help="Advance to next checkpoint")
    p_advance.add_argument("migration_id", help="Migration ID (or prefix)")
    p_advance.add_argument("--notes", help="Notes for completed checkpoint")
    p_advance.set_defaults(func=cmd_advance)

    # fail
    p_fail = sub.add_parser("fail", help="Mark current checkpoint as failed")
    p_fail.add_argument("migration_id", help="Migration ID (or prefix)")
    p_fail.add_argument("--error", required=True, help="Error message")
    p_fail.set_defaults(func=cmd_fail)

    # rollback
    p_rollback = sub.add_parser("rollback", help="Rollback migration")
    p_rollback.add_argument("migration_id", help="Migration ID (or prefix)")
    p_rollback.add_argument("--reason", required=True, help="Rollback reason")
    p_rollback.set_defaults(func=cmd_rollback)

    args = ap.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
