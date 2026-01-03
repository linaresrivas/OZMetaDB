# OZMetaDB Console UI Blueprint

## Stack
- Next.js (App Router) + TypeScript
- shadcn/ui + Tailwind
- AG Grid (enterprise grids)
- React Flow (workflows/lineage/schema diagrams)
- React Hook Form + Zod (forms + wizards)
- Monaco Editor (DSL editing)
- next-intl (i18n) from TextKey/Translation snapshot

## Global layout
- Left rail navigation (modules)
- Top bar: Client/Project/Environment switcher, global search (Cmd+K), notifications
- Main content: tabs + split panels
- Right Inspector drawer: details, references, audit, JSON preview

## Modules
Home, Projects, Model, Integrations, Workflows, Security, Documents, Analytics, Generators, Operations, Governance, Admin

## Wizards
New Project, Onboard Source System, Create Entity, Build Workflow, Security Baseline, Create Semantic Model

## Personalization
- `Meta.UserPreference`: theme, density, saved layouts, saved searches
- `Meta.UiTheme`: client/project design tokens (look & feel)
- `Meta.UiApp.UA_ThemeJSON`: per-app overrides

