# OZMetaDB Control Plane API (v1)

Local-first Control Plane API for humans + AI/agents.

Backend v1: filesystem (so it runs without DB connectivity).
Later: MetaDB-backed storage adapter (SQL Server/Azure SQL/Postgres/etc).

## Run
```bash
cd api
python -m pip install -e .
uvicorn ozmetadb_api.main:app --reload --port 8080
```

## Endpoints
- `GET /v1/projects`
- `GET /v1/projects/{projectId}/snapshot`
- `POST /v1/change-requests`
- `POST /v1/change-requests/{crId}/validate`
- `POST /v1/change-requests/{crId}/submit`
- `POST /v1/change-requests/{crId}/approve`
- `POST /v1/change-requests/{crId}/apply`
- `POST /v1/compile/{projectId}` (runs local generator)
- Wizard runtime:
  - `POST /v1/wizards/{wizardCode}/start`
  - `POST /v1/wizard-runs/{wizardRunId}/answer`
  - `POST /v1/wizard-runs/{wizardRunId}/preview-change-request`
