# Identity, Roles, and Theming Patterns

## Two layers of identity
1) OZMetaDB Console (admin/users/roles/preferences/themes)
2) Each generated system (its own users/roles/preferences/themes)

## Control-plane tables (MetaDB)
- `Meta.UserAccount` (console users; external id support e.g., Entra ID)
- `Meta.UserProjectRole` (user ↔ project ↔ role)
- `Meta.Role` (roles per project; already exists)
- `Meta.UserPreference` (personalization)
- `Meta.UiTheme` (design tokens for brand/look & feel)

## Generated system pattern (what the generator should emit)
- Schema `Sec`: User, Role, UserRole, Permission (optional), Policy (ABAC)
- Schema `Ux`: UserPreference, UiTheme, UiThemeOverride

## Brand model
- Project default theme lives in `Meta.UiTheme`
- Each system UI can select/override via `UiApp.ThemeJSON`
- Per-user selections saved in `Meta.UserPreference`
