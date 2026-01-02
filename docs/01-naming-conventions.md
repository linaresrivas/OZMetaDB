# Naming Conventions Standard (Canonical)

## Goals
- Visual deduction (PK/FK/roles identifiable at a glance)
- Consistent across platforms and tooling
- Adapter-friendly for multi-cloud restrictions

## Casing and separators
- TitleCase for schemas/tables/fields (except job/proc names)
- Acronyms preserved uppercase: ID, USA, KPI, API, ETL
- Single underscore "_" only (no "__")
- Internal/system fields start with "_" and use TitleCase after: _TenantID

## Canonical coordinate format (mandatory)
`{Client}-{Env}-{Platform}-{Domain}-{Region}`

Examples:
- `SFO-ProdA-Fabric-BI-USW`
- `SFO-ProdB-SQLMI-Case-USE`

Allowed Envs:
`Dev, Test, Uat, ProdA, ProdB`

## Schemas
- TitleCase
- Represent domains or data layers

Common examples:
`Core, Sales, HR, Case, Risk`
`Raw, Stg, Dwh, Mart, Agg, Sem, Audit, Sync, Archive`
`Meta` (in MetaDB)

## Tables
- TitleCase
- Singular nouns
- Must have a STRICTLY 2-letter table code registered in MetaDB

Examples:
- `Transaction` (TR)
- `Employee` (EM)
- `DimCustomer` (CU)
- `FactSalesActual` (SA)
- `FactSalesForecast` (SF)

## Columns

### Primary key (PK)
Pattern: `{TableCode}_ID`
Examples: `TR_ID, EM_ID, CU_ID`

IDs are UUIDv7 semantics; physical type is platform-mapped.

### Relationship columns (FKs)
Default role:
`{FromCode}{ToCode}_ID`
Example: `Transaction.TREM_ID` → `Employee.EM_ID`

Role-specific:
`{FromCode}{ToCode}_{Role}`
Example: `Transaction.TREM_ApprovedBy` → `Employee.EM_ID`

Rule: Relationship columns MUST be declared in MetaDB as FK to a target PK and MUST be enforced by constraints where supported.

### Internal/system fields (minimum mandatory)
`_TenantID`
`_CreateDate`
`_SourceSystem`
`_SourceKey`
`_SyncDate`
`_DeleteDate`

Common extensions (recommended):
`_CreatedBy, _UpdateDate, _UpdatedBy, _DeletedBy`
`_RowVersion, _IngestBatchID, _ArchiveDate`

## Constraints and indexes
Single underscore only.

Primary key constraint:
`pk_{TableCode}` (e.g., `pk_TR`)

Foreign key constraint:
`fk_{TableCode}_{ColumnName}` (e.g., `fk_TR_TREM_ApprovedBy`)

Index:
`ix_{TableCode}_{ColumnName}` (e.g., `ix_TR_TREM_ApprovedBy`)

Unique:
`uq_{TableCode}_{ColumnName}`

Check:
`ck_{TableCode}_{RuleName}`

## Procedures and functions
Pattern: `noun_verb` (lowercase)
Examples: `invoice_create, invoice_close, transaction_archive`

Optional schemas: `api.*`, `admin.*`, `sync.*`
