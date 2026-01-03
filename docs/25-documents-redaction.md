# Document Types / Evidence / Redaction (High Priority)

Legal/evidence systems require:
- retention + legal hold
- chain-of-custody (immutable)
- redaction policies (manual + AI assist)
- sealed/privileged access controls

## Control-plane metadata needed
- DocumentType, RetentionPolicy, RedactionPolicy, IntegrityMode, StorageClass
- classification tags and access rules
- lineage: source -> derived -> published

## Data-plane templates to generate
- `doc.Document`, `doc.DocumentVersion`
- `doc.RedactionJob`, `doc.RedactionResult`
- `doc.ChainOfCustodyEvent` (immutable journal)
