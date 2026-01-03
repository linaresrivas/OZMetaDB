# CLI Contract + Golden Tests + Manifest Hashing

- CLI contract: `contracts/ozmeta.cli.contract.md`
- Golden runner: `scripts/run_golden_tests.py`
- Golden fixtures: `tests/fixtures/*`
- Golden outputs: `tests/golden/*`
- Manifest hashing: generator writes `manifest.json` with SHA-256 hashes.

This is the key for:
- deterministic CI (reproducible builds)
- safe Python -> Go/Rust migration (same contracts)
- caching & incremental generation (future)
