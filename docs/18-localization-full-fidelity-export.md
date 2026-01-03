# Full-fidelity Localization Export (TextKeys + Translations)

Snapshots are now capable of driving **UI localization completely offline**.

## Exporter contract queries
- `texts` (languages)
- `text_keys_project` (TextKey rows referenced by the project)
- `translations_project` (Translation rows for those TextKeys)

## Determinism
- The project TextKey set is computed via a deterministic UNION across known `*_TextKeyID` columns.
- Ordering:
  - TextKeys by `TK_Code`
  - Translations by `LG_Code`, `TK_ID`

## Why this matters
- Generated UI and docs can render multilingual labels, descriptions, validation messages, etc.
- CI can validate that every referenced TextKey has translations for required languages (future rule).

## Next extensions (optional)
- Add a `Meta.TextUsage` view/table to capture bindings more explicitly (objectType/objectId/fieldName -> TK_ID).
- Add CI rule: "no missing translations for default languages".
