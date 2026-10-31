# AI development prompts

Use one platform prompt together with the shared project context.

- `common/PROJECT_CONTEXT.md` — architecture, source-of-truth rules, security and quality gates.
- `chrome/DEVELOPMENT_PROMPT.md` — Chrome extension work.
- `ios/DEVELOPMENT_PROMPT.md` — iPhone/iPad Safari userscript work.

## Recommended workflow

1. Start with the shared context.
2. Add only the target platform prompt.
3. Ask the agent to inspect the current files before editing and report any assumptions.
4. Keep shared behavior in `extension/chrome/core.js` and `extension/chrome/instagram-api.js` where appropriate.
5. Rebuild generated customer packages after changing the shared Chrome source.
6. Run `npm test`, `npm run typecheck`, `npm run build`, and the platform-specific syntax/build checks.
7. Do not publish, push, or deploy unless the owner explicitly asks.

Never paste `.env.local`, Supabase secrets, Stripe secrets, Instagram cookies, session tokens, license keys, or customer data into prompts.
