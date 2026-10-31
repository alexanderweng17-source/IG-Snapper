# IG Snapper Workspaces

This folder is the hand-off area for AI agents and development on another device. It is documentation and prompts only, not a second copy of runtime application source.

## Start here

1. Read `shared/PROJECT_CONTEXT.md`.
2. Choose one target: `chrome/`, `ios/`, `web/`, or `supabase/`.
3. Add only the matching prompt from `ai-prompts/`.
4. Edit canonical source paths described in that workspace, not generated customer packages.
5. Run the target verification checklist.
6. Record changed files, tests, build outputs and remaining risks.

## Workspaces

- `shared/` — architecture, source-of-truth rules and security.
- `chrome/` — Chrome desktop extension.
- `ios/` — Safari + Userscripts for iPhone/iPad.
- `web/` — Next.js storefront, accounts, admin and APIs.
- `supabase/` — database migrations and Edge Functions.
- `ai-prompts/` — common project context plus per-platform development prompts.

Application source stays in `extension/chrome/`, `src/` and `supabase/`. Versioned builds go in `releases/`. Never put secrets, cookies, session tokens, production data or customer exports here.

No agent may force-push, rewrite production data, run destructive SQL, or deploy without a specific release decision.
