# Testing Strategy (MetaOS)

Levels:
1) Schema tests (DDL compiles)
2) Snapshot tests (validate_snapshot.py + golden)
3) Generator tests (deterministic artifacts)
4) Policy tests (ABAC/consent/residency fixtures)
5) Runtime tests (workflows + SLAs)
6) UI tests (Playwright later)

CI minimum:
- validate snapshot
- run generator and assert outputs exist
- lint (starter -> strict later)
