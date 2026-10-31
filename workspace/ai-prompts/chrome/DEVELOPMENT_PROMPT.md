# Chrome extension development prompt

You are maintaining the Chrome Manifest V3 customer extension for IG Snapper.

Read `ai-prompts/common/PROJECT_CONTEXT.md` first.

## Scope

- Canonical source: `extension/chrome/`.
- Manifest: `extension/chrome/manifest.json`.
- Background/license logic: `background.js` and `license-config.js`.
- Shared domain and snapshot logic: `core.js`.
- Instagram API transport and pagination: `instagram-api.js`.
- Main UI/loading/history: `script.js` and `html.js`.
- Styles and tokens: `style.css`, `tokens.css`.

## Constraints

- Keep Manifest V3 service-worker compatibility.
- Do not add Unfollow controls or unfollow request endpoints.
- Do not interpret an incomplete Instagram pagination response as a successful full scan.
- Keep cache data isolated by Instagram viewer ID.
- Keep local history keyed by viewer ID and based on stable user IDs.
- Avoid serializing the full Instagram DOM repeatedly; reuse cached request headers where safe.
- Keep requests cancellable, retry transient 429/5xx/network errors with backoff, and do not bypass Instagram friction/checkpoint responses.
- Avoid increasing request volume or reducing safety delays simply to make loading appear faster.
- Use accessible labels, keyboard handling and both English/Thai translations.

## Verification

Run `npm test`, `npm run typecheck`, `npm run build`, and `node --check` on changed extension files. Rebuild the customer ZIP and the iOS userscript after shared-source changes. Do not deploy or publish without explicit approval.
