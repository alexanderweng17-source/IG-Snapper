# Website / Web application workspace

Canonical source: `src/`; Next.js config and dependencies are at repository root. `public/preview.html` supplies the marketing/download preview content embedded by Next.js pages.

Key areas:
- `src/app/(public)/` — marketing, pricing, download, FAQ and policy routes.
- `src/app/(auth)/` — login, registration and recovery.
- `src/app/dashboard/` — customer area.
- `src/app/admin/` — allowlisted admin area.
- `src/app/api/` — checkout, orders and Stripe webhook APIs.
- `src/lib/supabase/`, `src/lib/stripe/`, `src/lib/data/` — server/browser integrations.

Chrome ZIP distribution uses `GET /api/downloads/chrome`; the route requires a signed-in allowlisted admin or a paid order linked to an active, unexpired license. The ZIP is stored under `releases/`, included in the serverless route trace, and is not published from `public/`.

Verification: `npm test`, `npm run typecheck`, `npm run build`. Review responsive layouts, keyboard navigation, loading/empty/error states and unauthenticated routes. Demo data must never be presented as a customer's real order/license data.

Checkout stays disabled until server-side payment secrets, webhook configuration, confirmed prices, legal/support copy and end-to-end payment testing are complete. Never expose server secrets through `NEXT_PUBLIC_*` variables.