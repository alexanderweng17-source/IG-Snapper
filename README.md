# IG Snapper storefront

Next.js App Router · TypeScript · Tailwind CSS · Lucide. Customer-facing copy is Thai. The landing page uses the newer HTML preview as its visual reference and is implemented as React/Next.js so the other routes remain available.

## Backend status

This project now includes the first production-oriented integration layer:

- Supabase Auth browser/server clients using cookie-based sessions.
- Protected customer dashboard and Admin route group; Admin requires an email allowlist.
- Server-side Stripe Checkout Session creation (one-time payment; no wallet or recurring billing).
- Stripe signature-verified webhook handling for completed/async PromptPay Checkout Sessions.
- Idempotent database license issuance through `public.issue_web_order_license`.
- Customer order/license data loaded from Supabase, with the raw issued key kept in a service-role-only table.
- Server-side order status endpoint used by the Checkout return page.

The storefront is deliberately disabled for checkout until actual prices and server secrets are configured. This repository does not contain API secrets. The Stripe account connected during development was in test mode; live payment eligibility for this software and its Instagram-related functionality must be confirmed with Stripe before launch.

## Install and run

```bash
npm ci
Copy-Item .env.example .env.local
npm run dev
npm run typecheck
npm run build
```

The project includes a generated `package-lock.json`; install deterministically with `npm ci`. Before each release, run the typecheck and production build in CI. Next.js is pinned to `15.5.28`; dependency security should be reviewed with `npm audit` before launching live payments.

## Environment variables

See `.env.example`. Never expose `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, or `STRIPE_WEBHOOK_SECRET` in client-side code or any `NEXT_PUBLIC_*` variable.

`STORE_CHECKOUT_ENABLED` must remain `false` until the test flow works. Configure all three `STORE_PRICE_*_SATANG` values with the actual sale price in satang (1 THB = 100 satang), `NEXT_PUBLIC_SITE_URL`, Supabase URL/publishable key, server-only Supabase secret, and Stripe test secret. After the app is deployed to Vercel, register `https://YOUR_DOMAIN/api/webhooks/stripe` as a Stripe webhook endpoint and subscribe to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `charge.refunded`

The webhook signing secret must match the endpoint's Stripe mode (test vs live). Enable PromptPay in the Stripe Dashboard's payment-method settings; the code leaves payment method selection to Stripe's dynamic payment methods rather than forcing an unavailable method.

## Supabase database

The existing extension tables (`licenses`, `license_activations`, `license_failures`) and `verify-license` Edge Function are preserved. Migrations `202610290001_web_store.sql` and `202610290002_refund_web_orders.sql` are applied to the existing `Ig-Snapper` Supabase project. They create `web_orders`, `web_license_secrets`, and server-only RPC functions for issuance, pending-status updates, and full-refund revocation. Both new tables have RLS enabled and no `anon`/`authenticated` grants; service-role access is required.

Set Supabase Auth's Site URL and the following redirect URL before testing email confirmation/password recovery:

- `https://YOUR_DOMAIN/auth/callback`
- `http://localhost:3000/auth/callback` (local test)

## Routes

| Area | Routes |
|---|---|
| Public | `/` `/pricing` `/download` `/faq` `/legal/terms` `/legal/privacy` `/legal/refunds` |
| Auth | `/login` `/register` `/forgot-password` `/reset-password` `/auth/callback` |
| Checkout | `/checkout?plan=30-days\|90-days\|365-days` `/checkout/success` `/checkout/pending` `/checkout/cancel` |
| Customer | `/dashboard` `/dashboard/licenses` `/dashboard/orders` `/dashboard/profile` `/dashboard/support` |
| Admin | `/admin` `/admin/orders` `/admin/licenses` `/admin/products` `/admin/customers` |
| API | `POST /api/checkout/session`, `POST /api/webhooks/stripe`, `GET /api/orders/status?session_id=...` |

## Before accepting real money

1. Confirm with Stripe in writing that this software and its described Instagram-related features are eligible for payments.
2. Set real prices and configure the environment variables in Vercel.
3. Enable PromptPay if available on the account and test in Stripe test mode end-to-end.
4. Verify email confirmation, password recovery, purchase ownership, webhook retries, duplicate-event idempotency, and license verification against the extension.
5. Replace/complete legal policy drafts, support channels, and download hosting. Remove `robots: noindex` only when legal/privacy and product copy are ready for public indexing.
6. Review the remaining Admin mutation controls and support form before treating those routes as fully operational.

## Not yet verified

The code could not be built locally because this environment could not resolve `registry.npmjs.org` (EAI_AGAIN) while installing the new packages. No live end-to-end Stripe payment was run. The Vercel connector currently shows no linked projects/teams, and no Vercel deploy has been made from this package yet.
