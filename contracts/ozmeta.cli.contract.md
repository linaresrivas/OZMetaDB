# OZMeta CLI Contract (Stable Interface)

This contract defines the stable CLI surface so implementations can change (Python -> Go/Rust)
without breaking CI/CD, automation, or Codex.

## Commands

### `ozmeta validate`
Validates a snapshot JSON against `exports/spec/ozmeta.metadata.snapshot.schema.json`.

Args:
- `--snapshot <path>` (required)
- `--schema <path>` (optional; default: exports/spec/ozmeta.metadata.snapshot.schema.json)

Exit codes:
- 0 OK
- 2 validation failed
- 3 file error
- 10 unexpected error

### `ozmeta generate`
Generates deterministic artifacts from a snapshot into an output folder.

Args:
- `--snapshot <path>` (required)
- `--out <folder>` (required)

Outputs:
- `README.md`
- `sql/*.sql`
- `manifest.json` (SHA-256 hashes)

Exit codes:
- 0 OK
- 2 input validation failed
- 10 unexpected error

### `ozmeta export`
Exports MetaDB content to a snapshot JSON.

Args:
- `--provider stub|sqlserver|postgres|...`
- `--connection <conn-string>`
- `--project-id <uuid>`
- `--out <path>`

Exit codes:
- 0 OK
- 2 contract violated
- 4 DB connection failed
- 10 unexpected error

## Determinism
- Stable sort by PK/Code
- UTC ISO8601
- Hash is SHA-256 over raw bytes
