# Project structure

This repository intentionally keeps canonical source in one place and separates AI workspaces from built customer releases.

```text
IG-Snapper/
├─ extension/chrome/            # Canonical Chrome MV3 customer source
├─ tools/build-ios.mjs          # Generates iOS from extension/chrome
├─ src/                         # Next.js storefront, dashboard, admin and API
├─ public/
│  ├─ preview.html              # Marketing/download content embedded in Next.js
│  └─ downloads/
│     └─ ig-snapper.user.js     # Current public iOS update endpoint only
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/               # Full DB history incl. License baseline
│  ├─ functions/verify-license/ # Deployed Edge Function source
│  └─ types/database.types.ts   # Generated production DB types
├─ workspace/
│  ├─ README.md
│  ├─ shared/
│  ├─ chrome/
│  ├─ ios/
│  ├─ web/
│  ├─ supabase/
│  └─ ai-prompts/
├─ releases/v2.3.2/
│  ├─ chrome/                   # Customer ZIP
│  └─ ios/                      # Safari userscript
├─ archive/                     # Retired packages / one-off scripts
├─ docs/                        # Project docs and review records
└─ tests/                       # Automated regression tests
```

## Source ownership

- `extension/chrome/` is the only editable product source for Chrome/iOS shared behavior.
- `tools/build-ios.mjs` produces `public/downloads/ig-snapper.user.js`; never hand-edit the generated file.
- Build the customer ZIP from only `extension/chrome/`.
- `public/downloads/` is served directly by the web host. Only keep files that must be public there. Versioned customer release bundles belong under `releases/`.
- `src/` is the separate Next.js app. Its deployment root stays at the repository root.
- `supabase/migrations/` must include the original schema baseline and every later applied migration. Never edit an already-applied migration.
- `workspace/` holds instructions for AI agents and cross-device development, not extra copies of app source.
- `archive/` is never a build input.

## Release verification

Run `npm test`, `npm run typecheck`, `npm run build`, syntax-check changed extension scripts, rebuild both device targets from the same Chrome source, inspect the ZIP, and test on actual Chrome and Safari devices. A successful automated build does not equal real-device acceptance.
