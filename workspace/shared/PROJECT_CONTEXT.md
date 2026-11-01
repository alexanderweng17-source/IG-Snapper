# IG Snapper — shared project context

## Architecture
- Chrome extension canonical source: `extension/chrome/`.
- Relationship and snapshot logic: `extension/chrome/core.js`.
- Instagram transport/pagination: `extension/chrome/instagram-api.js`.
- UI/cache/history: `extension/chrome/script.js`; injected markup/storage bridge: `extension/chrome/html.js`.
- iOS Safari edition is built from Chrome source by `tools/build-ios.mjs`; generated update artifact is `public/downloads/ig-snapper.user.js`.
- Next.js storefront, auth, dashboard, admin and API source: `src/`.
- Supabase config, migrations and functions: `supabase/`.
- Versioned customer builds: `releases/vX.Y.Z/chrome/` and `releases/vX.Y.Z/ios/`.
- AI hand-off guides: `workspace/`.

## Required product behavior
- Do not reintroduce per-user or bulk Unfollow controls, endpoints or dialogs.
- History compares only schema-v2 snapshots with verified, complete Followers and Following scans, matched viewer IDs, page counts and stable user IDs—not list order or mutable usernames.
- History is a list-membership comparison, never proof of an Instagram Follow/Unfollow activity or its timestamp. Older snapshots without integrity metadata stay stored but cannot produce change events.
- Do not compare or display snapshots across Instagram viewer IDs; load the corresponding account's local history before starting a scan.
- A user disappearing from Followers does not prove a deliberate unfollow. It may be a block, deactivation, deletion or another platform-side change. The UI must say this clearly.
- Distinguish lost followers, lost followers still present in Following, users removed from both lists, new followers, and changes in Following.
- Never save a partial pagination result as a complete snapshot.
- Cache connection lists only for the matching Instagram viewer ID; explicit Refresh forces a fresh scan.

## Security
- Customer JavaScript, ZIPs and userscripts are inspectable and modifiable. Client-side obfuscation cannot make a license gate tamper-proof.
- License validation, issuance, revocation, device/account limits and privileged database/payment operations must remain server-side.
- Do not commit or prompt-share credentials, raw license keys, cookies, sessions or customer exports.
- Keep RLS enabled. License, activation, failure, order and raw-license-secret tables are server-only unless a narrowly scoped policy is explicitly reviewed.
- Do not read or print local environment secret files.

## Source-of-truth and release rules
1. Edit canonical source only.
2. Build iOS from the exact Chrome source used for the release.
3. Build Chrome ZIP from `extension/chrome/`.
4. Place built outputs under the matching version in `releases/`.
5. Keep only the current iOS auto-update file in `public/downloads/`; old customer ZIPs belong in the archive, not public paths.
6. Run tests, typecheck, production build, syntax checks and ZIP-content checks.
7. Inspect Git state before push. Never force-push to resolve a divergent branch.
8. Local verification is not a substitute for production smoke testing.

## Production integration identifiers
- Vercel project: `ig-snapper`; domain: `https://ig-snapper.vercel.app`.
- Supabase project ref: `hihhomdldouekdymgmzn`; region: `eu-west-1`.
- Edge Function `verify-license` has JWT verification disabled because it validates the license request itself; retain strict method/body validation and server-only database access.
- Checkout must remain disabled unless every payment secret, webhook and end-to-end test is ready.

## Required AI hand-off report
Record source files inspected, changes made, tests/builds, Git state, Supabase migration/function state, Vercel deployment state, unverified real-device tests and remaining release blockers.
