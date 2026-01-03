#!/usr/bin/env python3
from __future__ import annotations
import argparse, subprocess, sys, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def run(cmd, cwd=None):
    return subprocess.run(cmd, text=True, cwd=cwd).returncode

def main() -> int:
    ap=argparse.ArgumentParser(prog="ozmeta")
    sub=ap.add_subparsers(dest="cmd", required=True)

    v=sub.add_parser("validate"); v.add_argument("--snapshot", required=True)
    g=sub.add_parser("generate"); g.add_argument("--snapshot", required=True); g.add_argument("--out", required=True)
    e=sub.add_parser("export"); e.add_argument("--out", required=True); e.add_argument("--client", default="SFO"); e.add_argument("--project", default="CaseMgmt"); e.add_argument("--provider", default="stub"); e.add_argument("--connection", default="")
    c=sub.add_parser("compile"); c.add_argument("--snapshot", required=True); c.add_argument("--target", required=True, choices=["postgres","bigquery","redshift"]); c.add_argument("--out", required=True); c.add_argument("--options", default="{}")

    args=ap.parse_args()
    if args.cmd=="validate":
        return run([sys.executable, str(ROOT/"scripts"/"validate_snapshot.py"), args.snapshot])
    if args.cmd=="generate":
        return run([sys.executable, str(ROOT/"generator"/"src"/"generate_from_snapshot.py"), "--snapshot", args.snapshot, "--out", args.out])
    if args.cmd=="export":
        return run([sys.executable, str(ROOT/"generator"/"src"/"export_from_db.py"), "--out", args.out, "--client", args.client, "--project", args.project, "--provider", args.provider, "--connection", args.connection])
    if args.cmd=="compile":
        return run([sys.executable, "-m", "compiler.compile", "--snapshot", args.snapshot, "--target", args.target, "--out", args.out, "--options", args.options], cwd=str(ROOT))
    return 2

if __name__=="__main__":
    raise SystemExit(main())
