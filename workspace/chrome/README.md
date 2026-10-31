# Chrome desktop workspace

Target: Windows / desktop Chrome (Manifest V3).

Canonical source: `extension/chrome/`. Do not develop inside `releases/` or extracted ZIPs.

Main files:
- `manifest.json` — extension manifest, version and permissions.
- `background.js`, `license-config.js` — background and license flow.
- `core.js` — relationship states and snapshot comparison.
- `instagram-api.js` — Instagram transport and complete pagination.
- `script.js`, `html.js` — UI, cache, history and DOM integration.
- `style.css`, `tokens.css` — design system.

Before release run `npm test`, `npm run typecheck`, `npm run build`, and syntax-check every changed JavaScript file. Rebuild the Chrome ZIP from only `extension/chrome/`. Install in a clean Chrome profile and test against an authorized Instagram account. Verify Thai/English, keyboard access, history, loading/error/empty states and refresh behavior.

Do not bypass Instagram checkpoints or remove platform safety delays to improve perceived speed.