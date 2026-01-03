#!/usr/bin/env python3
"""End-to-end test script for OZMetaDB.

Steps:
  1.1 Validate sample snapshot against schema
  1.2 Run golden tests (generator)
  2.1 Compile to Postgres
  2.2 Compile to BigQuery
  2.3 Compile to Redshift
  3.1 Test CLI commands
  4.1 Summary

Usage:
  python scripts/test_all.py
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def run(cmd: list[str], cwd: Path = ROOT) -> tuple[int, str]:
    """Run command and return (exit_code, output)."""
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    return result.returncode, result.stdout + result.stderr

def test(name: str, cmd: list[str], expected_code: int = 0) -> bool:
    """Run a test and print result."""
    code, output = run(cmd)
    ok = code == expected_code
    status = "PASS" if ok else "FAIL"
    print(f"  [{status}] {name}")
    if not ok:
        print(f"         Exit code: {code} (expected {expected_code})")
        for line in output.strip().split("\n")[-5:]:
            print(f"         {line}")
    return ok

def main() -> int:
    print("=" * 50)
    print("OZMetaDB End-to-End Tests")
    print("=" * 50)
    results = []

    # 1.1 Schema validation
    print("\n1. Validation")
    results.append(test(
        "1.1 Schema validation",
        [sys.executable, "scripts/validate_snapshot.py", "exports/samples/sample.snapshot.json"]
    ))

    # 1.2 Golden tests
    results.append(test(
        "1.2 Golden tests",
        [sys.executable, "scripts/run_golden_tests.py",
         "--fixture", "tests/fixtures/sample.snapshot.json",
         "--golden", "tests/golden/sample",
         "--out", "out/e2e-golden"]
    ))

    # 2.1-2.3 Compiler targets
    print("\n2. Compiler")
    for target in ["postgres", "bigquery", "redshift"]:
        results.append(test(
            f"2.x Compile to {target}",
            [sys.executable, "-m", "compiler.compile",
             "--snapshot", "exports/samples/sample.snapshot.json",
             "--target", target,
             "--out", f"out/e2e-compile-{target}"]
        ))

    # 3.1 CLI commands
    print("\n3. CLI")
    results.append(test(
        "3.1 CLI validate",
        [sys.executable, "cli/ozmeta.py", "validate", "--snapshot", "exports/samples/sample.snapshot.json"]
    ))
    results.append(test(
        "3.2 CLI generate",
        [sys.executable, "cli/ozmeta.py", "generate",
         "--snapshot", "exports/samples/sample.snapshot.json",
         "--out", "out/e2e-cli-generate"]
    ))
    results.append(test(
        "3.3 CLI export (stub)",
        [sys.executable, "cli/ozmeta.py", "export", "--out", "out/e2e-cli-export.json"]
    ))

    # 4.1 Summary
    print("\n" + "=" * 50)
    passed = sum(results)
    total = len(results)
    print(f"Summary: {passed}/{total} tests passed")
    print("=" * 50)

    return 0 if passed == total else 1


if __name__ == "__main__":
    raise SystemExit(main())
