# Enterprise App Patterns (Metadata-Driven)

OZMetaDB is designed to generate and govern enterprise applications using metadata:
- Deep Search / Person profile / Risk graph
- HR / Organization / Identity & Access
- Document management (cases, evidence, contracts)
- Sales / CRM / Budgets / Forecast
- Storage facilities / Logistics / Fleet / Inventory
- Finance / Ledger / Payments / Compliance

## 1) Common entity patterns (reusable)

### Person / Identity
- Person (master)
- Identifier (email/phone/national id/passport/etc.)
- Alias (aka names)
- Address / Geo
- Relationship (person-person, person-org)
- Case involvement (roles)
- Risk signals / assessments

### Organization
- OrgUnit (hierarchy)
- Position / Role
- Employee (person + employment)
- Access entitlement (role/group mapping)

### Documents
- Document (metadata)
- DocumentVersion
- Attachment/Binary
- Classification
- ChainOfCustody (especially legal/evidence systems)
- Redaction policy (field/document level)

### Transactions / Audit
- Transaction header
- Transaction line
- State transitions
- Full event log / append-only journal (optional for high integrity)

## 2) Metadata required to generate a UI
- UiEntity: a screen/form for an entity (Case, Person, Evidence, Invoice)
- UiField: fields/metrics shown, order, control type, required/read-only
- Enum / EnumValue: dropdown values (localized)
- TextKey / Translation: labels, tooltips, help text per language
- FieldSecurity: Hide/Mask/Deny rules
- TableSecurity: row filters (RLS)

## 3) Security baseline (high assurance)
- Data classification at table/field level (ObjectClassification)
- Field protection: mask/tokenize/encrypt policies (FieldProtection)
- RLS rules compiled per platform (SecurityPolicy + TableSecurity)
- Immutable auditing of changes (Audit.* + optional event-store table in data plane)
- Key management references stored as KeyRef only (KeyVault/KMS), never secrets in MetaDB

## 4) Deep search / person graph (risk + intelligence) - metadata approach
- Canonical entity model stays stable (Person, Identifier, Relationship, Observation, Source)
- Source systems are registered as-is (SourceObject/SourceField)
- MapVersion/MapField define normalization into canonical model
- LineageEdge links any evidence back to its source fields and transforms
- UI generated from UiEntity/UiField with translations and security gates

## 5) Output targets (multi-cloud)
- A single canonical definition compiles to:
  - Azure SQL / Fabric Warehouse / Lakehouse tables
  - Databricks/Spark tables
  - BigQuery datasets
  - Redshift schemas
  - Power BI Semantic model (measures/dimensions from Meta.Metric* & Meta.Dimension*)
