# IG Snapper — shared project context

## Product

IG Snapper helps a signed-in Instagram user compare their Followers and Following lists, review relationship states, save local snapshots, and inspect changes over time. Connection lists and history are processed and stored locally in the browser/userscript storage; the storefront is a separate Next.js application.

## Architecture and source of truth

- `extension/chrome/` is the canonical customer-app source.
- `core.js` contains shared, platform-independent relationship and snapshot logic.
- `instagram-api.js` contains Instagram transport, pagination and request verification.
- `script.js` contains the UI, loading flow, cache, history, localization and license-gated features.
- `html.js` contains the injected UI markup and storage bridge.
- `background.js` and `license-config.js` contain Chrome background and license handling.
- `tools/build-ios.mjs` generates the iOS Safari userscript from the Chrome customer source. The generated `public/downloads/ig-snapper.user.js` is an output; do not hand-edit it.
- `public/downloads/IG-Snapper-*-customer.zip` is the customer Chrome package. Rebuild it from `extension/chrome/` after source changes.
- `src/app/` and `src/lib/` are the separate Next.js storefront, dashboard, admin and API application. Do not put Instagram DOM/UI logic there.
- `supabase/migrations/` contains database migrations. Do not change production schema or Edge Functions without reviewing the Supabase skill, current docs, RLS and a migration plan.
- `ai-prompts/` contains future-agent instructions.

## Non-negotiable behavior

- There is no Unfollow action in the customer UI or transport. Do not reintroduce per-account or bulk Unfollow controls, endpoints, confirmation dialogs or automatic unfollowing.
- History compares complete snapshots by stable Instagram user ID, not array order or mutable display names.
- A follower disappearing from the Followers list does not prove they deliberately unfollowed. Instagram may hide the account because of a block, deactivation, deletion or other platform behavior. State this uncertainty in the UI.
- History must distinguish: accounts no longer following the viewer; members of that group who are still in the viewer's Following list; and accounts removed from both lists during the same interval.
- Never save a partial scan as a complete snapshot. If Instagram signals another page but gives no cursor, repeats a cursor, or returns no new users before pagination ends, fail the scan visibly and do not cache it.
- Cache ownership must be tied to the current Instagram viewer ID. Never reuse another account's list data.
- Keep the explicit Refresh action as the way to force a fresh scan. Use short-lived caches to reduce unnecessary repeated loading without sacrificing daily change detection.
- Keep the iOS output generated from the exact Chrome source used for the release.

## Licensing and security

Customer-side JavaScript, ZIP files and userscripts are inspectable and modifiable. A customer can patch local license checks. Do not claim that minification, obfuscation, hidden constants or a client-side secret prevents this. Keep license authority, key issuance, revocation, device/account limits and all privileged database/payment operations on the server. Never expose Supabase `service_role`, Stripe secret keys or other secrets in client code. Local-only features running in a customer's browser cannot be made fully tamper-proof.

## Quality gates

- Add regression tests for snapshot diffs, account isolation and pagination edge cases.
- Run `npm test`, `npm run typecheck` and `npm run build`.
- Run `node --check` on changed extension scripts and on the generated iOS userscript.
- Build the iOS userscript from `extension/chrome/` using `tools/build-ios.mjs`.
- Inspect the resulting ZIP contents and test the Chrome and iOS packages before distribution.
- Do not read, print, commit or upload `.env.local` or secret files.
- Inspect the current local/remote Git state before pushing. Production may have been deployed from a local CLI build; never assume GitHub main is the same commit.
