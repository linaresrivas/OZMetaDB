# OZMetaDB Console (Next.js)

Starter structure for the enterprise Meta OS Console.

## Run
```bash
npm install
npm run dev
```

## Intended bindings
- UI routing/layout driven from MetaDB snapshot exports:
  - UiApp, UiPage, UiComponent, UiPageComponent
  - UiValidationRule, UiSearchFacet
- Localization driven from TextKey/Translation snapshot exports
- Security gates driven by Security policies + project roles

## Next steps
- Add shadcn/ui + design tokens
- Add AG Grid + React Flow + Monaco
- Implement auth (Entra ID) + authorization
- Wire Command Palette to snapshot-backed global search

## Demos
- `/model/grid` (AG Grid)
- `/workflows/designer` (React Flow)
- `/security/policy-editor` (Monaco)

## Keyboard
- Cmd+K / Ctrl+K: command palette
