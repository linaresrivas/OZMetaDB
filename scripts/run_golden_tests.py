#!/usr/bin/env python3
"""Golden test harness for OZMetaDB generator.

Run:
  python scripts/run_golden_tests.py --fixture tests/fixtures/sample.snapshot.json --golden tests/golden/sample --out out/golden-run

Update golden:
  python scripts/run_golden_tests.py --fixture tests/fixtures/sample.snapshot.json --golden tests/golden/sample --out out/golden-run --update
"""

from __future__ import annotations

import argparse
import hashlib
import shutil
import sys
from pathlib import Path
from typing import List, Tuple

def normalize_manifest_paths(manifest: dict) -> dict:
    # Ensure paths are relative; if absolute, keep only relative-to out/ if present, else basename.
    out = dict(manifest)
    files = []
    for f in manifest.get("files", []):
        ff = dict(f)
        p = ff.get("path", "")
        if isinstance(p, str) and (p.startswith("/") or re.match(r"^[A-Za-z]:\\", p)):
            # Try to find 'sql/' or known directories
            m = re.search(r"(sql/.*)$", p.replace("\\", "/"))
            ff["path"] = m.group(1) if m else os.path.basename(p)
        files.append(ff)
    out["files"] = sorted(files, key=lambda x: x.get("path",""))
    return out


def sha256_file(p: Path) -> str:
    h = hashlib.sha256()
    h.update(p.read_bytes())
    return h.hexdigest()


def collect_files(base: Path) -> List[Path]:
    return sorted([p for p in base.rglob("*") if p.is_file()])


def compare_dirs(out_dir: Path, golden_dir: Path) -> Tuple[bool, List[str]]:
    diffs: List[str] = []
    out_files = [p.relative_to(out_dir).as_posix() for p in collect_files(out_dir)]
    gold_files = [p.relative_to(golden_dir).as_posix() for p in collect_files(golden_dir)]

    if out_files != gold_files:
        diffs.append("File list differs")
        only_out = sorted(set(out_files) - set(gold_files))
        only_gold = sorted(set(gold_files) - set(out_files))
        if only_out:
            diffs.append("Only in output: " + ", ".join(only_out[:30]) + (" ..." if len(only_out) > 30 else ""))
        if only_gold:
            diffs.append("Only in golden: " + ", ".join(only_gold[:30]) + (" ..." if len(only_gold) > 30 else ""))

    ok = True
    for rel in sorted(set(out_files).intersection(gold_files)):
        a = out_dir / rel
        b = golden_dir / rel
        if sha256_file(a) != sha256_file(b):
            ok = False
            diffs.append(f"Content differs: {rel}")
    return ok and len(diffs) == 0, diffs


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--fixture", required=True)
    ap.add_argument("--golden", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--update", action="store_true")
    args = ap.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    gen = repo_root / "generator" / "src" / "generate_from_snapshot.py"

    out_dir = Path(args.out)
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    import subprocess
    subprocess.run([sys.executable, str(gen), "--snapshot", args.fixture, "--out", str(out_dir)], check=True)

    golden_dir = Path(args.golden)

    if args.update:
        if golden_dir.exists():
            shutil.rmtree(golden_dir)
        shutil.copytree(out_dir, golden_dir)
        print("Updated golden:", golden_dir)
        return 0

    ok, diffs = compare_dirs(out_dir, golden_dir)
    if not ok:
        print("GOLDEN TEST FAILED")
        for d in diffs:
            print("-", d)
        return 2

    print("Golden test OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
