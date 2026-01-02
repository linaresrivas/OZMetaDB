# Logging and Audit Standard

## Goals
- Logs must be visually deducible
- Logs must be machine-parsable (structured)
- Every operation must be traceable to Target, Model Versions, Mapping Versions, and RunID

## Required log keys (ordered)
1) TS (UTC timestamp)
2) Client
3) Env
4) Platform
5) Domain
6) Region
7) RunID (UUIDv7)
8) JobCode
9) StepCode
10) Object (Canonical schema.table or physical ref)
11) Operation
12) Counts (In/Out/Reject)
13) DurationMs
14) Versions (StdVer/MapVer/ModelVer)
15) Result + ErrorCode/ErrorMessage

## Human-readable example
2026-01-01T10:15:22.184Z  Client=SFO Env=ProdA Platform=Fabric Domain=BI Region=USW RunID=01H...
Job=bi_dwh_load_factsalesactual Step=merge Obj=Dwh.FactSalesActual Op=Upsert In=1245981 Out=1245960 Rej=21 DurMs=38421
StdVer=1 MapVer=12 ModelVer=7 Result=OK

## Audit tables (minimum)
- Audit.LoadRun: one row per run
- Audit.LoadObject: per object step (table/dataset)
- Audit.QualityCheck: per check result
- Audit.DriftCheck: per drift validation result
- Audit.Error: normalized errors

## Read auditing (recommended for high assurance)
If required by policy:
- Audit.ReadEvent: record accesses to sensitive objects (who/when/purpose)
