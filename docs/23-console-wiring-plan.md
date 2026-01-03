# Console Wiring Plan (Snapshot-first, API-second)

The console must run in two modes:
1) **Offline / snapshot mode**: reads `/public/snapshot.json`
2) **Connected mode**: loads snapshot from API export endpoint and submits changes as ChangeRequests

## Implemented in this starter
- `SnapshotProvider` loads `/snapshot.json`
- applies theme tokens (Default) to CSS variables
- `CommandPalette` toggles with Cmd/Ctrl+K

## Auth skeleton (Entra ID)
Environment variables:
- `NEXT_PUBLIC_AAD_CLIENT_ID`
- `NEXT_PUBLIC_AAD_AUTHORITY`
- `NEXT_PUBLIC_AAD_REDIRECT_URI`
