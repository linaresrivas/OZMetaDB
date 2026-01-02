# UI + Multi-language Metadata (Addendum)

## Goal
OZMetaDB should drive not only data/ETL/BI, but also UI:
- display names and descriptions for every entity/table/field/metric
- multi-language translations
- consistent formatting, masks, and validations
- enumerations / code lists
- dynamic forms and grids driven by metadata
- role-based visibility (high assurance environments)

## Principle
Canonical names remain stable (for deduction, lineage, portability).
UI-friendly names are *aliases* stored in MetaDB and served per language/locale.

## Localization model (high level)
- A small `Meta.Language` registry (e.g., en-US, es-ES, pt-BR)
- A `Meta.TextKey` registry (stable keys like `table.Transaction`, `field.Transaction.TREM_ApprovedBy`, `metric.TotalSales`)
- A `Meta.TextTranslation` table for translated strings:
  - DisplayName
  - ShortDescription
  - LongDescription
  - HelpText / Tooltip
  - ExampleValue
- Every describable object references a TextKey

## UI model (high level)
- `Meta.UiEntity` represents a “screen” (e.g., Case, Person, Evidence, Transaction)
- `Meta.UiField` maps canonical fields/metrics to UI controls (textbox, datepicker, dropdown, file upload)
- `Meta.UiValidation` defines validation rules (regex/range/required)
- `Meta.UiVisibility` defines role-based visibility or sensitivity gates
- `Meta.Enum` + `Meta.EnumValue` defines code lists and localized labels

This enables consistent UI across apps and supports offline capture stations by generating forms from metadata.
