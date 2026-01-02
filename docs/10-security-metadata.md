# Security Metadata (RLS/FLS/Encryption/Masking)

## Why
Enterprise systems (legal, country security, finance, HR) must be provably secure.
OZMetaDB makes security metadata-driven and portable.

## Tables
- Meta.SecurityClassification: Public/Internal/Confidential/Restricted/Sealed
- Meta.ObjectClassification: applies classification to Table/Field/Metric/Doc
- Meta.SecurityPolicy: logical security rules (portable DSL/JSON)
- Meta.TableSecurity: applies policy to a canonical table (RLS)
- Meta.FieldSecurity: applies policy to a canonical field (FLS)
- Meta.DataProtectionPolicy: encrypt/mask/tokenize/hash policies
- Meta.FieldProtection: applies protection to fields, with a logical mode

## Compilation
SecurityPolicy.SP_ExpressionLogical is compiled per target:
- SQL Server: CREATE SECURITY POLICY / predicate functions
- Fabric Warehouse: views + RLS where possible
- Databricks: table ACLs + views + dynamic masking
- BigQuery: row access policies + authorized views
- Redshift: RLS (where available) + views

## UI integration
- UiField.UF_VisibilityRule and FieldSecurity determine what a user sees.
- TextKey/Translation provide localized warnings/help text.

## Recommendations
- Treat RLS as default everywhere (deny-by-default).
- Mask PII by default for non-privileged roles.
- Encrypt “Sealed” and “Restricted” at rest, and use strong key mgmt (KeyVault/KMS).
