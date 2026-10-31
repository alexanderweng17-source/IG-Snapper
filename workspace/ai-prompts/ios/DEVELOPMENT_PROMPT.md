# iOS Safari userscript development prompt

You are maintaining the iPhone/iPad Safari edition of IG Snapper, installed through a compatible Userscripts manager.

Read `ai-prompts/common/PROJECT_CONTEXT.md` first.

## Source and build pipeline

- The iOS edition is generated from the canonical Chrome customer source in `extension/chrome/`.
- Build script: `tools/build-ios.mjs`.
- Build dependency: `tools/package.json` / `tools/package-lock.json` (Lightning CSS).
- Generated release output: `public/downloads/ig-snapper.user.js`.
- The generated file bundles the license/storage shim, shared `core.js`, `instagram-api.js`, and the UI.
- Do not hand-edit the generated userscript. Fix the canonical source or build script, then regenerate.

## iOS constraints

- Support Safari on iPhone and iPad, touch interaction, safe-area insets, smaller viewport widths and the Userscripts manager storage/network APIs.
- Keep both current GM API variants supported where possible.
- Keep `@connect` limited to the required license host.
- Preserve the one-tap activation-link behavior and remove sensitive key fragments from the visible URL immediately.
- Do not add Unfollow controls or unfollow request endpoints.
- Do not bypass Instagram authentication, checkpoint or rate-limit responses.

## Verification

Run `node tools/build-ios.mjs extension/chrome public/downloads/ig-snapper.user.js https://ig-snapper.vercel.app` from the repository root after installing `tools/package.json` dependencies. Then run `node --check public/downloads/ig-snapper.user.js` and inspect the generated userscript header/version. Test installation and interaction in Safari on an actual iPhone/iPad before release. Do not deploy or publish without explicit approval.
