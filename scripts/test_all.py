#!/usr/bin/env python3
"""End-to-end test script for OZMetaDB.

Steps:
  1.1 Validate sample snapshot against schema
  1.2 Run golden tests (generator)
  2.1 Compile to Postgres, BigQuery, Redshift
  2.2 Compile to Snowflake, Spark
  3.1 Test CLI commands
  4.1 Test DSL compiler
  5.1 Test migration runner
  6.1 Summary

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

def test_dsl_compiler() -> bool:
    """Test DSL compiler functionality."""
    try:
        import sys
        sys.path.insert(0, str(ROOT))
        from compiler.dsl import compile_dsl

        # Test shorthands
        assert compile_dsl("allow", "tsql") == "1", "allow should return 1"
        assert compile_dsl("deny", "tsql") == "0", "deny should return 0"
        assert "SESSION_CONTEXT" in compile_dsl("tenant", "tsql"), "tenant should use SESSION_CONTEXT"

        # Test expression compilation
        dsl = {"expr": {"op": "eq", "args": [{"ref": "Status"}, {"lit": "Active"}]}}
        result = compile_dsl(dsl, "tsql")
        assert "[Status]" in result, "Should quote identifier with brackets"
        assert "'Active'" in result, "Should quote string literal"

        # Test multi-dialect
        result_pg = compile_dsl(dsl, "postgres")
        assert '"Status"' in result_pg, "Postgres should use double quotes"

        result_spark = compile_dsl(dsl, "spark")
        assert "`Status`" in result_spark, "Spark should use backticks"

        # Test complex expression
        dsl = {
            "expr": {
                "op": "and",
                "args": [
                    {"op": "eq", "args": [{"ref": "Status"}, {"lit": "Active"}]},
                    {"op": "in", "args": [{"ref": "Type"}, {"lit": "A"}, {"lit": "B"}]}
                ]
            }
        }
        result = compile_dsl(dsl, "tsql")
        assert "AND" in result, "Should contain AND"
        assert "IN" in result, "Should contain IN"

        print("  [PASS] 4.1 DSL compiler expressions")
        return True
    except Exception as e:
        print(f"  [FAIL] 4.1 DSL compiler expressions")
        print(f"         {e}")
        return False


def test_migration_runner() -> bool:
    """Test migration runner functionality."""
    try:
        import sys
        sys.path.insert(0, str(ROOT))
        from migrate.runner import create_run, advance_checkpoint, get_progress, DEFAULT_CHECKPOINTS
        from migrate.state import CheckpointStatus

        # Test create run
        source = {"coord": "acme-prod-azure-core-eastus", "platform": "azure"}
        target = {"coord": "acme-prod-gcp-core-us-central1", "platform": "gcp"}
        run = create_run(
            project_id="test-project-123",
            source=source,
            target=target,
            strategy="DualLive"
        )
        assert run["source"]["coord"] == "acme-prod-azure-core-eastus", "Source coord should match"
        assert run["target"]["coord"] == "acme-prod-gcp-core-us-central1", "Target coord should match"
        assert len(run["checkpoints"]) == len(DEFAULT_CHECKPOINTS), "Should have default checkpoints"
        assert run["status"] == "Planned", "Initial status should be Planned"

        # Test get progress
        progress = get_progress(run)
        assert progress["completed"] == 0, "No checkpoints completed initially"
        assert progress["total"] == len(DEFAULT_CHECKPOINTS), "Total should match"

        # Test advance checkpoint - first call starts the first checkpoint
        run = advance_checkpoint(run, "Starting first checkpoint")
        assert run["status"] == "InProgress", "Status should be InProgress"

        progress = get_progress(run)
        assert progress["currentCheckpoint"] == "ProvisionTarget", "Should be on first checkpoint"

        # Test checkpoint status - first checkpoint should be InProgress
        first_cp = run["checkpoints"][0]
        assert first_cp["status"] == CheckpointStatus.IN_PROGRESS.value, "First checkpoint should be InProgress"

        # Second advance completes the first checkpoint
        run = advance_checkpoint(run, "Completed first checkpoint")
        progress = get_progress(run)
        assert progress["completed"] == 1, "One checkpoint completed"

        first_cp = run["checkpoints"][0]
        assert first_cp["status"] == CheckpointStatus.COMPLETED.value, "First checkpoint should be completed"

        print("  [PASS] 5.1 Migration runner checkpoints")
        return True
    except Exception as e:
        print(f"  [FAIL] 5.1 Migration runner checkpoints")
        print(f"         {e}")
        import traceback
        traceback.print_exc()
        return False


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

    # 2.1-2.5 Compiler targets
    print("\n2. Compiler")
    for target in ["postgres", "bigquery", "redshift", "snowflake", "spark"]:
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

    # 4. DSL Compiler
    print("\n4. DSL Compiler")
    results.append(test_dsl_compiler())

    # 5. Migration Runner
    print("\n5. Migration Runner")
    results.append(test_migration_runner())

    # 6. Summary
    print("\n" + "=" * 50)
    passed = sum(results)
    total = len(results)
    print(f"Summary: {passed}/{total} tests passed")
    print("=" * 50)

    return 0 if passed == total else 1


if __name__ == "__main__":
    raise SystemExit(main())
