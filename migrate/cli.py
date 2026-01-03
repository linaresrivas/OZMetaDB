from __future__ import annotations
import argparse, json
from pathlib import Path
from .runner import create_run, save_run

def main() -> int:
    ap=argparse.ArgumentParser()
    ap.add_argument("--project-id", required=True)
    ap.add_argument("--source", required=True, help="JSON string or path")
    ap.add_argument("--target", required=True, help="JSON string or path")
    ap.add_argument("--out", default="out/migrations")
    args=ap.parse_args()

    def load(x: str):
        p=Path(x)
        if p.exists():
            return json.loads(p.read_text(encoding="utf-8"))
        return json.loads(x)

    run=create_run(args.project_id, load(args.source), load(args.target))
    path=save_run(args.out, run)
    print(path)
    return 0

if __name__=="__main__":
    raise SystemExit(main())
